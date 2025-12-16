#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

"$ROOT/install-backend.sh" >/dev/null

# Run the QR verification suite + the 10-distinct-QR integration test.
# Fail-fast on first failure.
exec "$ROOT/.venv/bin/python" -m pytest -q -x --maxfail=1 \
  backend/test_pos_qr_verify.py \
  backend/test_pos_qr_multi_10.py \
  "$@"
