#!/bin/bash
# Run comprehensive test suite for QR and receipt generation

set -e

cd "$(dirname "$0")"

echo "=========================================="
echo "🧪 TapSure QR & Receipt Test Suite"
echo "=========================================="
echo ""

# Install pytest if needed
echo "📦 Checking test dependencies..."
python3 -m pip install -q pytest pytest-asyncio 2>/dev/null || true

echo "✓ Test environment ready"
echo ""

# Run tests
echo "🏃 Running comprehensive tests..."
echo ""

python3 -m pytest test_generate_test_qr.py -v \
    --tb=short \
    --color=yes

echo ""
echo "=========================================="
echo "✅ TEST SUITE COMPLETE"
echo "=========================================="
echo ""
