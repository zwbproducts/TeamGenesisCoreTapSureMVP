#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

# Allow running from repo root
ROOT = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(ROOT / "backend"))

from app.config import get_pos_tenant_secrets  # noqa: E402
from app.pos_qr import decode_qr_texts, get_nonce_store, verify_token  # noqa: E402

try:
    import cv2  # type: ignore
    import numpy as np  # type: ignore
    from PIL import Image
except Exception:  # pragma: no cover
    cv2 = None
    np = None
    Image = None


def main() -> int:
    ap = argparse.ArgumentParser(description="Decode and verify TapSure POS QR from an image")
    ap.add_argument("image", help="Path to image containing QR")
    ap.add_argument(
        "--crop",
        default="",
        help="Optional crop as x,y,w,h (pixels) to isolate the QR region before decode",
    )
    ap.add_argument(
        "--secrets",
        default=os.getenv("POS_TENANT_SECRETS", ""),
        help='JSON dict of tenant secrets (default: env POS_TENANT_SECRETS), e.g. {"demo":"dev-secret"}',
    )
    ap.add_argument("--max-age", type=int, default=int(os.getenv("POS_QR_MAX_AGE_SECONDS", "900")))
    ap.add_argument("--max-future-skew", type=int, default=int(os.getenv("POS_QR_MAX_FUTURE_SKEW_SECONDS", "60")))
    args = ap.parse_args()

    img_path = Path(args.image)
    data = img_path.read_bytes()

    if args.crop and Image is not None:
        try:
            x, y, w, h = [int(p.strip()) for p in args.crop.split(",")]
            img = Image.open(img_path).convert("RGB")
            img = img.crop((x, y, x + w, y + h))
            import io

            buf = io.BytesIO()
            img.save(buf, format="PNG")
            data = buf.getvalue()
            print(f"image={img_path} crop={args.crop} bytes={len(data)}")
        except Exception as e:
            print(f"crop_error={type(e).__name__}:{e}")
            print(f"image={img_path} bytes={len(data)}")
    else:
        print(f"image={img_path} bytes={len(data)}")

    texts = decode_qr_texts(data)
    print(f"decoded_count={len(texts)}")
    for i, t in enumerate(texts[:5]):
        print(f"[{i}] {t}")

    if not texts:
        print("NO_QR_DETECTED")
        # Best-effort diagnostics: detect() may find a QR but fail to decode.
        if cv2 is not None and np is not None and Image is not None:
            try:
                img = Image.open(img_path).convert("RGB")
                arr = np.array(img)
                h, w = arr.shape[:2]
                detector = cv2.QRCodeDetector()
                ok, points = detector.detect(arr)
                print(f"diag.image_wh={w}x{h}")
                print(f"diag.detect_ok={bool(ok)}")
                if points is not None:
                    pts = points.tolist()
                    print(f"diag.points={json.dumps(pts)}")
                    print("hint: try cropping tightly around the QR with --crop x,y,w,h")
            except Exception as e:
                print(f"diag_error={type(e).__name__}:{e}")
        return 2

    if args.secrets.strip():
        os.environ["POS_TENANT_SECRETS"] = args.secrets

    secrets = get_pos_tenant_secrets()
    if not secrets:
        print("NO_SECRETS_CONFIGURED (set POS_TENANT_SECRETS)")
        return 3

    token = texts[0]
    valid, reason, payload = verify_token(
        token=token,
        tenant_secrets=secrets,
        nonce_store=get_nonce_store(),
        max_age_seconds=args.max_age,
        max_future_skew_seconds=args.max_future_skew,
    )

    print(f"verify.valid={valid}")
    print(f"verify.reason={reason}")
    print("verify.payload=" + json.dumps(payload, indent=2, sort_keys=True, default=str))

    return 0 if valid else 4


if __name__ == "__main__":
    raise SystemExit(main())
