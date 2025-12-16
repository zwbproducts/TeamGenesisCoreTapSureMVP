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
    # Make the QR valid for a long enough window for tests
    monkeypatch.setenv("POS_QR_MAX_AGE_SECONDS", "3600")
    monkeypatch.setenv("POS_QR_NONCE_TTL_SECONDS", "3600")
    return TestClient(app)


def _make_qr_png_bytes(text: str) -> bytes:
    img = qrcode.make(text)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_pos_qr_verify_valid_and_replay(client: TestClient):
    payload = {
        "tenant_id": "demo",
        "transaction_id": "tx_123",
        "timestamp": int(time.time()),
        "nonce": "nonce_abc",
        "merchant_id": "merchant_001",
        "plan_id": "plan_basic_12m",
        "amount_cents": 1299,
        "currency": "USD",
    }
    token = build_token(payload, secret="dev-secret")
    png = _make_qr_png_bytes(token)

    r1 = client.post(
        "/api/pos/qr/verify",
        files={"receipt": ("qr.png", png, "image/png")},
    )
    assert r1.status_code == 200
    body1 = r1.json()
    assert body1["valid"] is True
    assert body1["reason"] == "ok"
    assert body1["payload"]["transaction_id"] == "tx_123"

    r2 = client.post(
        "/api/pos/qr/verify",
        files={"receipt": ("qr.png", png, "image/png")},
    )
    assert r2.status_code == 409
    body2 = r2.json()
    assert body2["valid"] is False
    assert body2["reason"] == "replay"


def test_pos_qr_verify_no_qr_found(client: TestClient):
    # make a blank image
    from PIL import Image

    img = Image.new("RGB", (256, 256), color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")

    r = client.post(
        "/api/pos/qr/verify",
        files={"receipt": ("blank.png", buf.getvalue(), "image/png")},
    )
    assert r.status_code == 400
    assert "No QR code" in r.text
