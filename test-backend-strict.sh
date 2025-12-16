#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

"$ROOT/install-backend.sh" >/dev/null

# Fail fast on the first failure.
exec "$ROOT/.venv/bin/python" -m pytest -q -x --maxfail=1 backend "$@"
