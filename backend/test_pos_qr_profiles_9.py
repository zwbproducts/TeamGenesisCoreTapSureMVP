import json
import time
from io import BytesIO

import pytest
import qrcode
from fastapi.testclient import TestClient

from app.main import app
from app.pos_qr import build_token


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("POS_TENANT_SECRETS", json.dumps({"demo": "dev-secret"}))
    monkeypatch.setenv("POS_QR_MAX_AGE_SECONDS", "3600")
    monkeypatch.setenv("POS_QR_NONCE_TTL_SECONDS", "3600")
    monkeypatch.setenv("POS_QR_ENFORCEMENT", "on")
    return TestClient(app)


def _make_receipt_like_qr_png_bytes(text: str) -> bytes:
    # Same stabilization trick as other tests: QR pasted on a larger white canvas.
    qr_img = qrcode.make(text).convert("RGB").resize((520, 520))

    try:
        from PIL import Image

        canvas = Image.new("RGB", (800, 800), color="white")
        canvas.paste(qr_img, (140, 140))
        img = canvas
    except Exception:
        img = qr_img

    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


PROFILES = [
    ("merchant", "merchant_gold", 5),
    ("merchant", "merchant_new", 4),
    ("merchant", "merchant_flagged", 2),
    ("customer", "customer_loyal", 5),
    ("customer", "customer_new", 3),
    ("customer", "customer_chargeback", 2),
    ("insurer", "insurer_partner", 5),
    ("insurer", "insurer_auditor", 4),
    ("insurer", "insurer_unknown", 3),
]


def test_pos_qr_profiles_9_trust_and_chat_prefix(client: TestClient):
    now = int(time.time())

    for idx, (role, profile_id, expected_rating) in enumerate(PROFILES):
        payload = {
            "tenant_id": "demo",
            "transaction_id": f"p{idx}",
            "timestamp": now,
            "nonce": f"pnonce{idx}",
            "actor_role": role,
            "profile_id": profile_id,
            "merchant_id": f"m_{idx}",
            "plan_id": "plan_basic_12m",
            "amount_cents": 1000 + idx * 100,
            "currency": "USD",
        }

        token = build_token(payload, secret="dev-secret")
        png = _make_receipt_like_qr_png_bytes(token)

        # Analyze: should accept the QR and attach profile-based trust.
        ar = client.post(
            "/api/receipt/analyze",
            files={"receipt": (f"qr_{profile_id}.png", png, "image/png")},
        )
        assert ar.status_code == 200, f"analyze failed profile={profile_id} status={ar.status_code} body={ar.text!r}"
        abody = ar.json()

        assert abody.get("pos_qr_verified") is True
        assert abody.get("trust_rating") == expected_rating
        assert float(abody.get("trust_confidence")) >= 0.75

        # Chat: should reflect role + trust in the first line.
        cr = client.post("/api/chat", json={"message": "hello"})
        assert cr.status_code == 200
        reply = cr.json().get("reply") or ""
        first_line = reply.splitlines()[0] if reply else ""
        assert f"Role={role.title()}" in first_line
        assert f"Trust={expected_rating}/5" in first_line
