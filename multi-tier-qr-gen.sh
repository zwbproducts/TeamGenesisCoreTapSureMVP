#!/bin/bash
# Quick multi-tier QR and receipt generation wrapper

set -e

cd "$(dirname "$0")"

COMMAND="${1:-gen}"

case "$COMMAND" in
    gen|generate)
        echo "Generating receipts and QR codes..."
        bash gen-receipts.sh
        ;;
    test)
        echo "Running test suite..."
        bash test-gen-receipts.sh
        ;;
    clean)
        echo "Cleaning generated files..."
        rm -rf test_qr_codes test_receipts
        echo "✓ Cleaned"
        ;;
    list)
        echo "Generated QR codes:"
        ls -lh test_qr_codes/ 2>/dev/null || echo "  (none yet)"
        echo ""
        echo "Generated receipts:"
        ls -lh test_receipts/ 2>/dev/null | grep -E "\.png$" | wc -l | xargs echo "  Total PNG files:"
        ;;
    *)
        echo "TapSure Multi-Tier QR & Receipt Generator"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  generate  - Generate receipts and QR codes for all tiers (default)"
        echo "  test      - Run comprehensive test suite"
        echo "  clean     - Remove all generated files"
        echo "  list      - List generated files"
        echo ""
        echo "Examples:"
        echo "  bash multi-tier-qr-gen.sh generate"
        echo "  bash multi-tier-qr-gen.sh test"
        echo "  bash multi-tier-qr-gen.sh clean"
        ;;
esac
