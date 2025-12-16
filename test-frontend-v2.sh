#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/frontend-v2"

if [[ "${SKIP_INSTALL:-}" != "1" ]]; then
  "$ROOT/install-frontend-v2.sh" >/dev/null
fi

exec npm test -- --run --bail=1 "$@"
