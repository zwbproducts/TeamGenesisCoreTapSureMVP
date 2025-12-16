#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ "${SKIP_INSTALL:-}" != "1" ]]; then
  "$ROOT/install-backend.sh" >/dev/null
fi

HOST="${BACKEND_HOST:-0.0.0.0}"
PORT="${BACKEND_PORT:-8000}"
RELOAD="${BACKEND_RELOAD:-1}"

export PYTHONPATH="$ROOT/backend${PYTHONPATH:+:$PYTHONPATH}"

ARGS=("app.main:app" --host "$HOST" --port "$PORT")
if [[ "$RELOAD" == "1" ]]; then
  ARGS+=(--reload)
fi

exec "$ROOT/.venv/bin/python" -m uvicorn "${ARGS[@]}"
