import json
import time
from io import BytesIO

import pytest
import qrcode
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.pos_qr import build_token


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("POS_TENANT_SECRETS", json.dumps({"demo": "dev-secret"}))
    monkeypatch.setenv("POS_QR_MAX_AGE_SECONDS", "3600")
    monkeypatch.setenv("POS_QR_NONCE_TTL_SECONDS", "3600")
    # Ensure POS mode is on regardless of defaults.
    monkeypatch.setenv("POS_QR_ENFORCEMENT", "on")
    return TestClient(app)


def _make_qr_png_bytes(text: str) -> bytes:
    # OpenCV's QRCodeDetector can be flaky on "QR-only" synthetic images.
    # Generate a QR and paste it onto a larger white canvas (receipt-like) for stable decoding.
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(text)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    qr_img = qr_img.resize((520, 520), resample=Image.Resampling.NEAREST)
    canvas = Image.new("RGB", (800, 800), color="white")
    canvas.paste(qr_img, (140, 140))

    img = canvas
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_10_distinct_qr_codes_verify_and_populate_receipt(client: TestClient):
    now = int(time.time())

    for i in range(10):
        verify_payload = {
            "tenant_id": "demo",
            "transaction_id": f"v{i}",
            "timestamp": now,
            "nonce": f"nv{i}",
            "merchant_id": f"m{i}",
            "plan_id": "plan_basic_12m" if i % 2 == 0 else "plan_plus_12m",
            "amount_cents": 1000 + i * 111,
            "currency": "USD",
        }

        analyze_payload = {
            **verify_payload,
            "transaction_id": f"a{i}",
            "nonce": f"na{i}",
        }

        verify_token = build_token(verify_payload, secret="dev-secret")
        verify_png = _make_qr_png_bytes(verify_token)

        analyze_token = build_token(analyze_payload, secret="dev-secret")
        analyze_png = _make_qr_png_bytes(analyze_token)

        # 1) Verify endpoint should accept each unique token.
        vr = client.post(
            "/api/pos/qr/verify",
            files={"receipt": (f"qr_verify_{i}.png", verify_png, "image/png")},
        )
        assert vr.status_code == 200, f"verify failed i={i} status={vr.status_code} body={vr.text!r}"
        vbody = vr.json()
        assert vbody["valid"] is True
        assert vbody["reason"] == "ok"
        assert vbody["payload"]["transaction_id"] == verify_payload["transaction_id"]

        # 2) Analyze endpoint should accept the QR image and include verification context.
        ar = client.post(
            "/api/receipt/analyze",
            files={"receipt": (f"qr_analyze_{i}.png", analyze_png, "image/png")},
        )
        assert ar.status_code == 200, f"analyze failed i={i} status={ar.status_code} body={ar.text!r}"
        abody = ar.json()

        assert abody.get("pos_qr_verified") is True
        assert abody.get("pos_qr_reason") in {"ok", None}

        pos_payload = abody.get("pos_qr_payload") or {}
        assert pos_payload.get("transaction_id") == analyze_payload["transaction_id"]
        assert pos_payload.get("merchant_id") == analyze_payload["merchant_id"]
        assert pos_payload.get("amount_cents") == analyze_payload["amount_cents"]

        # Trust signals should reflect verified QR.
        assert abody.get("trust_rating") == 5
        assert float(abody.get("trust_confidence")) >= 0.90
