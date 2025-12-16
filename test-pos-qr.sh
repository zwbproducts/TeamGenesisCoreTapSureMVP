#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

"$ROOT/install-backend.sh" >/dev/null

exec "$ROOT/.venv/bin/python" -m pytest -q backend/test_pos_qr_verify.py "$@"

