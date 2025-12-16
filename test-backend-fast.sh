#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

"$ROOT/install-backend.sh" >/dev/null

# Skips the strict OCR integration suite which may depend on system Tesseract.
exec "$ROOT/.venv/bin/python" -m pytest -q backend --ignore backend/test_integration.py "$@"

