from __future__ import annotations

import base64
import hashlib
import hmac
import io
import json
import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

from PIL import Image

try:
    import cv2  # type: ignore
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover
    cv2 = None
    np = None


TOKEN_PREFIX = "TSQR1"


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(text: str) -> bytes:
    padding = "=" * ((4 - (len(text) % 4)) % 4)
    return base64.urlsafe_b64decode(text + padding)


def build_token(payload: Dict[str, Any], secret: str) -> str:
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), payload_json, hashlib.sha256).digest()
    return f"{TOKEN_PREFIX}.{_b64url_encode(payload_json)}.{_b64url_encode(sig)}"


def parse_token(token: str) -> Tuple[Dict[str, Any], bytes]:
    parts = token.strip().split(".")
    if len(parts) != 3 or parts[0] != TOKEN_PREFIX:
        raise ValueError("invalid_token_format")

    payload_json = _b64url_decode(parts[1])
    sig = _b64url_decode(parts[2])

    payload = json.loads(payload_json.decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("invalid_payload")

    return payload, sig


@dataclass
class NonceStore:
    ttl_seconds: int
    _seen: Dict[Tuple[str, str], float]

    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._seen = {}

    def _purge(self, now: float) -> None:
        expired = [k for k, exp in self._seen.items() if exp <= now]
        for k in expired:
            self._seen.pop(k, None)

    def check_and_mark(self, tenant_id: str, nonce: str, now: Optional[float] = None) -> bool:
        """Returns True if nonce is new (and marks it), False if replay."""
        now = time.time() if now is None else now
        self._purge(now)
        key = (tenant_id, nonce)
        if key in self._seen:
            return False
        self._seen[key] = now + float(self.ttl_seconds)
        return True


_global_nonce_store = NonceStore(ttl_seconds=int(os.getenv("POS_QR_NONCE_TTL_SECONDS", "900")))


def get_nonce_store() -> NonceStore:
    return _global_nonce_store


def decode_qr_texts(image_bytes: bytes) -> list[str]:
    if cv2 is None or np is None:
        raise RuntimeError("qr_decoder_unavailable")

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    base = np.array(img)

    detector = cv2.QRCodeDetector()

    def _decode(arr) -> list[str]:
        out: list[str] = []
        if hasattr(detector, "detectAndDecodeMulti"):
            ok, decoded_info, _, _ = detector.detectAndDecodeMulti(arr)  # type: ignore[assignment]
            if ok and decoded_info:
                for d in decoded_info:
                    if isinstance(d, str) and d.strip():
                        out.append(d.strip())
        data, _, _ = detector.detectAndDecode(arr)
        if isinstance(data, str) and data.strip():
            out.append(data.strip())
        # preserve order, drop duplicates
        dedup: list[str] = []
        seen: set[str] = set()
        for t in out:
            if t not in seen:
                seen.add(t)
                dedup.append(t)
        return dedup

    # Fast path: try the original RGB first.
    try:
        texts = _decode(base)
        if texts:
            return texts
    except Exception:
        pass

    gray = None
    try:
        gray = cv2.cvtColor(base, cv2.COLOR_RGB2GRAY)
        texts = _decode(gray)
        if texts:
            return texts
    except Exception:
        gray = None

    # Slow path: scale up + thresholding for tricky photos.
    candidates: list = []

    for scale in (1.5, 2.0, 3.0):
        try:
            w = int(base.shape[1] * scale)
            h = int(base.shape[0] * scale)
            candidates.append(cv2.resize(base, (w, h), interpolation=cv2.INTER_CUBIC))
            if gray is not None:
                candidates.append(cv2.resize(gray, (w, h), interpolation=cv2.INTER_CUBIC))
        except Exception:
            pass

    if gray is not None:
        try:
            thr = cv2.adaptiveThreshold(
                gray,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                31,
                2,
            )
            candidates.append(thr)
        except Exception:
            pass

    all_texts: list[str] = []
    for arr in candidates:
        try:
            texts = _decode(arr)
        except Exception:
            continue
        for t in texts:
            if t not in all_texts:
                all_texts.append(t)

    return all_texts


def verify_token(
    token: str,
    tenant_secrets: Dict[str, str],
    nonce_store: NonceStore,
    max_age_seconds: int,
    max_future_skew_seconds: int,
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    try:
        payload, sig = parse_token(token)
    except ValueError as e:
        return False, str(e), None

    tenant_id = str(payload.get("tenant_id") or "")
    nonce = str(payload.get("nonce") or "")
    ts = payload.get("timestamp")

    if not tenant_id or not nonce or not isinstance(ts, int):
        return False, "missing_required_fields", payload

    secret = tenant_secrets.get(tenant_id)
    if not secret:
        return False, "unknown_tenant", payload

    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), payload_json, hashlib.sha256).digest()
    if not hmac.compare_digest(expected, sig):
        return False, "bad_signature", payload

    now = int(time.time())
    if ts > now + max_future_skew_seconds:
        return False, "timestamp_in_future", payload
    if now - ts > max_age_seconds:
        return False, "expired", payload

    if not nonce_store.check_and_mark(tenant_id, nonce):
        return False, "replay", payload

    return True, "ok", payload
