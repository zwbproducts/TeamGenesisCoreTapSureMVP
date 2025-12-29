#!/bin/bash
# Generate test receipts with QR codes for all tiers and tenants

set -e

cd "$(dirname "$0")"

echo "================================"
echo "🎯 TapSure Receipt Generator"
echo "================================"
echo ""

# Check Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ python3 not found. Please install Python 3."
    exit 1
fi

# Check dependencies
echo "📦 Checking dependencies..."
python3 -c "import PIL, qrcode" 2>/dev/null || {
    echo "⚠️  Installing required packages..."
    pip install pillow qrcode -q
}

echo "✓ Dependencies OK"
echo ""

# Generate receipts
echo "📝 Generating test receipts with QR codes..."
python3 receipt_generator.py

echo ""
echo "✓ Receipt generation complete!"
echo ""

# Generate QR codes
echo "🔲 Generating standalone QR codes..."
python3 generate_test_qr.py

echo ""
echo "================================"
echo "✅ ALL GENERATION COMPLETE"
echo "================================"
echo ""
echo "Generated files:"
echo "  - test_qr_codes/      (standalone QR codes)"
echo "  - test_receipts/      (receipt images with embedded QR)"
echo ""
echo "To test locally:"
echo "  1. Start backend: python3 -m uvicorn backend.app.main:app --reload"
echo "  2. Start frontend: cd frontend-v2 && npm run dev"
echo "  3. Upload receipt images to test QR verification"
echo ""
