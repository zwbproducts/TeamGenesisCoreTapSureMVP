#!/usr/bin/env python3
"""Generate valid QR code images for testing locally."""

import json
import sys
import time
from io import BytesIO
from pathlib import Path

import qrcode
from PIL import Image

sys.path.insert(0, 'backend')
from app.pos_qr import build_token

# Test tenant IDs from .env
TENANT_IDS = ["client", "merchant", "insurer"]
SECRETS = {
    "client": "dev-client",
    "merchant": "dev-merchant", 
    "insurer": "dev-insurer"
}

def make_qr_png(text: str) -> bytes:
    """Generate QR code PNG bytes."""
    qr_img = qrcode.make(text).convert("RGB").resize((520, 520))
    
    # Paste on white canvas for stability
    canvas = Image.new("RGB", (800, 800), color="white")
    canvas.paste(qr_img, (140, 140))
    
    buf = BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()

def generate_qr_codes():
    """Generate QR codes for each tenant."""
    now = int(time.time())
    output_dir = Path("test_qr_codes")
    output_dir.mkdir(exist_ok=True)
    
    print("Generating QR codes for testing...")
    print("=" * 60)
    
    for tenant_id in TENANT_IDS:
        secret = SECRETS[tenant_id]
        
        # Create payload
        payload = {
            "tenant_id": tenant_id,
            "transaction_id": f"test_{tenant_id}_001",
            "timestamp": now,
            "nonce": f"nonce_{tenant_id}_test",
            "actor_role": "merchant",
            "profile_id": f"{tenant_id}_test",
            "merchant_id": f"merchant_{tenant_id}",
            "plan_id": "plan_test",
            "amount_cents": 5000,
            "currency": "USD",
        }
        
        # Build token
        token = build_token(payload, secret)
        
        # Generate QR PNG
        png_bytes = make_qr_png(token)
        
        # Save file
        filename = output_dir / f"test_qr_{tenant_id}.png"
        filename.write_bytes(png_bytes)
        
        print(f"\n✓ Generated: {filename}")
        print(f"  Tenant ID: {tenant_id}")
        print(f"  Secret: {secret}")
        print(f"  Token (first 50 chars): {token[:50]}...")
        print(f"  Payload: {json.dumps(payload, indent=2)}")
    
    print("\n" + "=" * 60)
    print(f"✓ All QR codes saved to: {output_dir.absolute()}")
    print("\nTo test locally:")
    print("  1. Open http://localhost:5174 in your browser")
    print("  2. Upload a test QR code image")
    print("  3. Should now verify successfully!")

if __name__ == "__main__":
    generate_qr_codes()
