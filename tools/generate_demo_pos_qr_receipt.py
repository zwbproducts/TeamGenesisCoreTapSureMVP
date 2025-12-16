from __future__ import annotations

import json
import time
from pathlib import Path
import sys
import secrets

import qrcode
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.pos_qr import build_token


def main() -> int:
    tenant_id = "demo"
    secret = "dev-secret"

    payload = {
        "tenant_id": tenant_id,
        "transaction_id": f"tx_demo_{int(time.time())}",
        "timestamp": int(time.time()),
        "nonce": f"nonce_demo_{secrets.token_hex(8)}",
        "merchant_id": "merchant_demo_001",
        "plan_id": "plan_demo_12m",
        "amount_cents": 4999,
        "currency": "USD",
    }

    token = build_token(payload, secret=secret)

    qr_img = qrcode.make(token).convert("RGB")
    canvas = Image.new("RGB", (900, 550), color="white")

    draw = ImageDraw.Draw(canvas)
    draw.text((20, 20), "TapSure Demo Receipt", fill="black")
    draw.text((20, 55), f"Merchant: {payload['merchant_id']}", fill="black")
    draw.text((20, 80), f"Transaction: {payload['transaction_id']}", fill="black")
    draw.text((20, 105), f"Amount: ${payload['amount_cents']/100:.2f} {payload['currency']}", fill="black")
    draw.text((20, 130), "Scan/Upload QR for verification", fill="black")

    qr_img = qr_img.resize((380, 380))
    canvas.paste(qr_img, (500, 140))

    out_dir = Path("backend/fixtures")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "demo_pos_qr_receipt.png"
    canvas.save(out_path)

    meta_path = out_dir / "demo_pos_qr_receipt.payload.json"
    meta_path.write_text(json.dumps({"payload": payload, "token": token, "secret": secret}, indent=2), encoding="utf-8")

    print(f"Wrote: {out_path}")
    print(f"Wrote: {meta_path}")
    print("Set this env to verify it:")
    print('  POS_TENANT_SECRETS={"demo":"dev-secret"}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
