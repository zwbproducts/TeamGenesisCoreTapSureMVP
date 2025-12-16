import json
from io import BytesIO
import time

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
    return TestClient(app)


def _make_qr_png_bytes(text: str) -> bytes:
    img = qrcode.make(text)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_analyze_receipt_requires_qr_header_blocks_non_qr(client: TestClient):
    # blank image (no QR)
    from PIL import Image

    img = Image.new("RGB", (256, 256), color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")

    r = client.post(
        "/api/receipt/analyze",
        headers={"X-POS-Require-QR": "1"},
        files={"receipt": ("blank.png", buf.getvalue(), "image/png")},
    )
    assert r.status_code == 400
    assert "QR required" in r.text


def test_analyze_receipt_defaults_to_qr_required_when_secrets_configured(client: TestClient):
    # blank image (no QR) - no header
    from PIL import Image

    img = Image.new("RGB", (256, 256), color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")

    r = client.post(
        "/api/receipt/analyze",
        files={"receipt": ("blank.png", buf.getvalue(), "image/png")},
    )
    assert r.status_code == 400
    assert "QR required" in r.text


def test_analyze_receipt_requires_qr_header_accepts_valid_qr(client: TestClient):
    payload = {
        "tenant_id": "demo",
        "transaction_id": "tx_gate_1",
        "timestamp": int(time.time()),
        "nonce": "nonce_gate_1",
        "merchant_id": "merchant_001",
        "plan_id": "plan_basic_12m",
        "amount_cents": 1299,
        "currency": "USD",
    }
    token = build_token(payload, secret="dev-secret")
    png = _make_qr_png_bytes(token)

    r = client.post(
        "/api/receipt/analyze",
        headers={"X-POS-Require-QR": "1"},
        files={"receipt": ("qr.png", png, "image/png")},
    )

    # The actual analysis result can vary by OCR/LLM availability; but it must not be blocked by QR gating.
    assert r.status_code == 200
    body = r.json()
    assert "merchant" in body
    assert "total" in body
