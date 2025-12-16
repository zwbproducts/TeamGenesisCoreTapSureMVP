#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/frontend-v2"

if [[ -f package-lock.json ]]; then
  if ! npm ci; then
    npm install
  fi
else
  npm install
fi

echo "Frontend-v2 deps ready: $ROOT/frontend-v2/node_modules"
