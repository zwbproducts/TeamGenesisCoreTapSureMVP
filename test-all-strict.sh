#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "== Backend (strict, fail-fast) =="
./test-backend-strict.sh

echo "== Frontend-v2 (strict, fail-fast) =="
./test-frontend-v2.sh

echo "ALL TESTS PASSED"
