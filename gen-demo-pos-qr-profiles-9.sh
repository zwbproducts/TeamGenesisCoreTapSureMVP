#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

"$ROOT/install-backend.sh" >/dev/null

export PYTHONPATH="$ROOT/backend${PYTHONPATH:+:$PYTHONPATH}"
exec "$ROOT/.venv/bin/python" tools/generate_demo_pos_qr_profiles_9.py "$@"
