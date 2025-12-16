#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/frontend-v2"

if [[ "${SKIP_INSTALL:-}" != "1" ]]; then
  "$ROOT/install-frontend-v2.sh" >/dev/null
fi

HOST="${FRONTEND_V2_HOST:-0.0.0.0}"
PORT="${FRONTEND_V2_PORT:-5174}"

exec npm run dev -- --host "$HOST" --port "$PORT"
