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


PROFILES: list[dict[str, object]] = [
    # Merchants
    {"profile_id": "merchant_gold", "actor_role": "merchant", "merchant_id": "m_gold_001", "amount_cents": 7999},
    {"profile_id": "merchant_new", "actor_role": "merchant", "merchant_id": "m_new_001", "amount_cents": 2599},
    {"profile_id": "merchant_flagged", "actor_role": "merchant", "merchant_id": "m_flag_001", "amount_cents": 4999},
    # Customers
    {"profile_id": "customer_loyal", "actor_role": "customer", "merchant_id": "m_gold_001", "amount_cents": 1999},
    {"profile_id": "customer_new", "actor_role": "customer", "merchant_id": "m_new_001", "amount_cents": 1499},
    {"profile_id": "customer_chargeback", "actor_role": "customer", "merchant_id": "m_flag_001", "amount_cents": 9999},
    # Insurers
    {"profile_id": "insurer_partner", "actor_role": "insurer", "merchant_id": "m_gold_001", "amount_cents": 8999},
    {"profile_id": "insurer_auditor", "actor_role": "insurer", "merchant_id": "m_new_001", "amount_cents": 2999},
    {"profile_id": "insurer_unknown", "actor_role": "insurer", "merchant_id": "m_flag_001", "amount_cents": 3999},
]


def _receipt_like_qr(token: str, title: str, subtitle: str) -> Image.Image:
    qr_img = qrcode.make(token).convert("RGB").resize((420, 420))
    canvas = Image.new("RGB", (900, 550), color="white")
    draw = ImageDraw.Draw(canvas)
    draw.text((20, 20), title, fill="black")
    draw.text((20, 55), subtitle, fill="black")
    draw.text((20, 90), "Scan/Upload QR for verification", fill="black")
    canvas.paste(qr_img, (460, 110))
    return canvas


def main() -> int:
    tenant_id = "demo"
    secret = "dev-secret"
    now = int(time.time())

    out_dir = ROOT / "backend" / "fixtures" / "profiles_9"
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest: list[dict[str, object]] = []

    for i, p in enumerate(PROFILES, start=1):
        payload = {
            "tenant_id": tenant_id,
            "transaction_id": f"tx_{p['profile_id']}_{now}_{i}",
            "timestamp": now,
            "nonce": f"nonce_{p['profile_id']}_{secrets.token_hex(6)}",
            "actor_role": p["actor_role"],
            "profile_id": p["profile_id"],
            "merchant_id": p["merchant_id"],
            "plan_id": "plan_basic_12m" if i % 2 == 0 else "plan_plus_12m",
            "amount_cents": int(p["amount_cents"]),
            "currency": "USD",
        }

        token = build_token(payload, secret=secret)
        img = _receipt_like_qr(
            token,
            title="TapSure Demo Receipt (Profiles)",
            subtitle=f"Role={payload['actor_role']} Profile={payload['profile_id']}",
        )

        png_name = f"demo_{payload['actor_role']}_{payload['profile_id']}.png"
        png_path = out_dir / png_name
        img.save(png_path)

        manifest.append({"png": str(png_path.relative_to(ROOT)), "payload": payload, "token": token})

    manifest_path = out_dir / "profiles_9.manifest.json"
    manifest_path.write_text(json.dumps({"tenant_id": tenant_id, "secret": secret, "items": manifest}, indent=2), encoding="utf-8")

    print(f"Wrote {len(manifest)} images to: {out_dir}")
    print(f"Wrote manifest: {manifest_path}")
    print("Set this env to verify:")
    print('  POS_TENANT_SECRETS={"demo":"dev-secret"}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
