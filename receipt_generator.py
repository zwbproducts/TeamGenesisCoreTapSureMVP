#!/usr/bin/env python3
"""Generate realistic receipt images with embedded QR codes for different user tiers."""

import json
import sys
import time
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Dict, Tuple

import qrcode
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, 'backend')
from app.pos_qr import build_token


@dataclass
class UserTier:
    """User tier configuration."""
    name: str
    max_claims: int
    coverage_percent: int
    monthly_limit: float


# Define user tiers
TIERS = {
    "free": UserTier("Free", 2, 50, 500.0),
    "medium": UserTier("Medium", 5, 75, 2000.0),
    "premium": UserTier("Premium", 10, 100, 10000.0),
}

# Tenant secrets
SECRETS = {
    "client": "dev-client",
    "merchant": "dev-merchant",
    "insurer": "dev-insurer",
}

# Sample merchants for variety
MERCHANTS = [
    "Walmart",
    "Target",
    "Best Buy",
    "Amazon Fresh",
    "Costco",
    "Home Depot",
    "CVS Pharmacy",
    "Whole Foods",
]

# Sample products
PRODUCTS = [
    ("Electronics", 299.99),
    ("Groceries", 87.45),
    ("Home & Garden", 156.23),
    ("Pharmacy", 45.99),
    ("Clothing", 124.50),
    ("Sporting Goods", 89.99),
    ("Books", 34.95),
    ("Furniture", 499.00),
]


def make_qr_png(text: str) -> bytes:
    """Generate QR code PNG bytes."""
    qr_img = qrcode.make(text).convert("RGB").resize((200, 200))

    # Paste on white canvas
    canvas = Image.new("RGB", (250, 250), color="white")
    canvas.paste(qr_img, (25, 25))

    buf = BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def generate_receipt_image(
    user_id: str,
    tenant_id: str,
    tier_name: str,
    merchant: str,
    amount: float,
    qr_token: str,
) -> bytes:
    """Generate a simulated receipt image with QR code."""
    # Create receipt background
    width, height = 400, 600
    receipt = Image.new("RGB", (width, height), color="white")
    draw = ImageDraw.Draw(receipt)

    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        normal_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 9)
    except Exception:
        # Fallback to default font
        title_font = normal_font = small_font = ImageFont.load_default()

    y = 20

    # Header
    draw.text((20, y), "TAPSURE RECEIPT", font=title_font, fill="black")
    y += 30

    # Receipt info
    draw.text((20, y), f"Tier: {tier_name.upper()}", font=normal_font, fill="black")
    y += 20
    draw.text((20, y), f"User ID: {user_id}", font=small_font, fill="gray")
    y += 20
    draw.text((20, y), f"Tenant: {tenant_id.upper()}", font=small_font, fill="gray")
    y += 25

    # Merchant and amount
    draw.text((20, y), f"Merchant: {merchant}", font=normal_font, fill="black")
    y += 25
    draw.text((20, y), f"Amount: ${amount:.2f}", font=title_font, fill="green")
    y += 35

    # Timestamp
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    draw.text((20, y), f"Date: {timestamp}", font=small_font, fill="gray")
    y += 30

    # Separator line
    draw.line([(20, y), (width - 20, y)], fill="black", width=1)
    y += 20

    # QR code section
    draw.text((20, y), "QR Code (Auto-Verify):", font=normal_font, fill="black")
    y += 25

    # Generate and embed QR
    qr_png = make_qr_png(qr_token)
    qr_img = Image.open(BytesIO(qr_png))
    receipt.paste(qr_img, (75, y))
    y += 230

    # Footer
    draw.text((20, y), "Scan to verify coverage & claims", font=small_font, fill="gray")

    # Convert to bytes
    buf = BytesIO()
    receipt.save(buf, format="PNG")
    return buf.getvalue()


def generate_test_receipts():
    """Generate test receipts for all tier/tenant/user combinations."""
    output_dir = Path("test_receipts")
    output_dir.mkdir(exist_ok=True)

    print("Generating test receipts with QR codes...")
    print("=" * 70)

    receipt_count = 0
    results = {
        "by_tier": {},
        "by_tenant": {},
        "all_receipts": [],
    }

    for tier_key, tier in TIERS.items():
        results["by_tier"][tier_key] = []

        for tenant_id in ["client", "merchant", "insurer"]:
            if tenant_id not in results["by_tenant"]:
                results["by_tenant"][tenant_id] = []

            # Generate 3 users per tier/tenant combo
            for user_num in range(1, 4):
                user_id = f"{tier_key}_{tenant_id}_user{user_num}"
                secret = SECRETS[tenant_id]

                # Create unique payload
                payload = {
                    "user_id": user_id,
                    "tenant_id": tenant_id,
                    "tier": tier_key,
                    "transaction_id": f"tx_{tier_key}_{tenant_id}_{user_num:03d}",
                    "timestamp": int(time.time()),
                    "nonce": f"nonce_{user_id}_{int(time.time())}",
                    "actor_role": "customer",
                    "merchant_id": f"merchant_{tenant_id}",
                    "plan_id": f"plan_{tier_key}",
                    "max_claims": tier.max_claims,
                    "coverage_percent": tier.coverage_percent,
                }

                # Random merchant and amount
                merchant = MERCHANTS[(user_num - 1) % len(MERCHANTS)]
                product, amount = PRODUCTS[(user_num + receipt_count) % len(PRODUCTS)]

                payload["merchant"] = merchant
                payload["product"] = product
                payload["amount_cents"] = int(amount * 100)
                payload["currency"] = "USD"

                # Build token
                token = build_token(payload, secret)

                # Generate receipt image
                receipt_bytes = generate_receipt_image(
                    user_id=user_id,
                    tenant_id=tenant_id,
                    tier_name=tier.name,
                    merchant=merchant,
                    amount=amount,
                    qr_token=token,
                )

                # Save receipt
                filename = output_dir / f"receipt_{tier_key}_{tenant_id}_user{user_num}.png"
                filename.write_bytes(receipt_bytes)

                # Save metadata
                metadata_file = output_dir / f"receipt_{tier_key}_{tenant_id}_user{user_num}.json"
                metadata_file.write_text(json.dumps(payload, indent=2))

                receipt_info = {
                    "file": str(filename),
                    "metadata": str(metadata_file),
                    "tier": tier_key,
                    "tenant": tenant_id,
                    "user_id": user_id,
                    "amount": amount,
                    "token": token[:60] + "...",
                }

                results["by_tier"][tier_key].append(receipt_info)
                results["by_tenant"][tenant_id].append(receipt_info)
                results["all_receipts"].append(receipt_info)

                receipt_count += 1

                print(f"\n✓ Generated: {filename.name}")
                print(f"  User: {user_id}")
                print(f"  Amount: ${amount:.2f}")
                print(f"  Merchant: {merchant}")
                print(f"  Token: {token[:60]}...")

    print("\n" + "=" * 70)
    print(f"✓ Generated {receipt_count} receipts with QR codes")
    print(f"  Location: {output_dir.absolute()}")
    print()
    print("Organization:")
    for tier_key in TIERS.keys():
        count = len(results["by_tier"][tier_key])
        print(f"  - {tier_key}: {count} receipts")

    print()
    print("To test locally:")
    print("  1. Open http://localhost:5173 in your browser")
    print("  2. Upload a receipt image")
    print("  3. QR code should auto-verify with correct tier/user info")

    return results


if __name__ == "__main__":
    generate_test_receipts()
