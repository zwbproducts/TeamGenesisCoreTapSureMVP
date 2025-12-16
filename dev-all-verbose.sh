#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

export TAPSURE_DEBUG_HTTP=1
export POS_REQUIRE_QR=1

# Demo-friendly: allow older demo images to still verify during local dev.
export POS_QR_MAX_AGE_SECONDS=31536000

# Demo tenant secret (override by exporting POS_TENANT_SECRETS yourself)
export POS_TENANT_SECRETS=${POS_TENANT_SECRETS:-'{"demo":"dev-secret"}'}

# Frontend-v2 reads VITE_* at dev server startup.
export VITE_DEBUG_LOGGING=1
export VITE_POS_REQUIRE_QR=1

exec "$ROOT/dev-all.sh"
