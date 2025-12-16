#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

mkdir -p "$ROOT/.logs"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_V2_PORT="${FRONTEND_V2_PORT:-5174}"

echo "Starting backend on :$BACKEND_PORT ..."
"$ROOT/dev-backend.sh" >"$ROOT/.logs/backend.log" 2>&1 &
BACKEND_PID=$!

echo "Starting frontend-v2 on :$FRONTEND_V2_PORT ..."
"$ROOT/dev-frontend-v2.sh" >"$ROOT/.logs/frontend-v2.log" 2>&1 &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping..."
  kill "$FRONTEND_PID" 2>/dev/null || true
  kill "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Backend:      http://localhost:$BACKEND_PORT"
echo "Frontend-v2:  http://localhost:$FRONTEND_V2_PORT"
echo "Logs:         $ROOT/.logs/backend.log , $ROOT/.logs/frontend-v2.log"

wait
