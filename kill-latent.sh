#!/usr/bin/env bash
set -euo pipefail

# TapSure: kill any lingering dev servers/processes.
# - Frees common TapSure ports (frontend/backends)
# - Avoids killing VS Code internal Node services by targeting ports + specific command patterns

PORTS=(3000 3001 5173 5174 8000)

if ! command -v lsof >/dev/null 2>&1; then
  echo "ERROR: lsof is required (install via: sudo apt-get install -y lsof)" >&2
  exit 1
fi

for p in "${PORTS[@]}"; do
  echo "--- killing port $p"
  lsof -ti:"$p" | xargs -r kill -9 || true
done

# Also stop common dev servers (more targeted than `pkill node`)
# - Backend
pkill -9 -f 'uvicorn app\.main:app' 2>/dev/null || true
pkill -9 -f 'uvicorn.*app\.main:app' 2>/dev/null || true
# - Frontend (Vite)
pkill -9 -f 'vite --' 2>/dev/null || true
pkill -9 -f 'vite --host' 2>/dev/null || true

sleep 1

echo "--- remaining listeners (${PORTS[*]})"
for p in "${PORTS[@]}"; do
  if lsof -iTCP:"$p" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
    echo "port $p STILL LISTENING"
    lsof -iTCP:"$p" -sTCP:LISTEN -n -P || true
  else
    echo "port $p free"
  fi
done
