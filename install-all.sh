#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$ROOT/install-backend.sh"
"$ROOT/install-frontend-v2.sh"

echo "All deps installed."
