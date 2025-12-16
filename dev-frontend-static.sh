#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

HOST="${FRONTEND_STATIC_HOST:-0.0.0.0}"
PORT="${FRONTEND_STATIC_PORT:-5173}"

exec python3 -m http.server "$PORT" --bind "$HOST" -d "$ROOT/frontend"
