#!/usr/bin/env bash
set -euo pipefail

# Scan /mnt for TapSure "versions" (dirs/files matching a regex), write a report,
# and optionally delete the largest match.

ROOT_DIR="${SCAN_ROOT:-/mnt}"
REGEX="${REGEX:-tapsure}"
OUT_FILE="${OUT_FILE:-tapsure-mnt-report.txt}"
MAX_DEPTH="${MAX_DEPTH:-4}"
TYPE="${TYPE:-any}" # any|dir|file
DELETE_LARGEST=0
YES=0
DRY_RUN=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --root PATH           Root to scan (default: /mnt)
  --regex REGEX         Case-insensitive regex to match paths (default: tapsure)
  --out FILE            Write report to FILE (default: tapsure-mnt-report.txt)
  --max-depth N         Max dir depth to consider "versions" (default: 4)
  --type any|dir|file    What to match (default: any)
  --dry-run             Don't delete anything (prints what would happen)
  --delete-largest      Delete the largest matched "version" directory
  --yes                 Required with --delete-largest (no interactive prompt)
  -h, --help            Show help

Examples:
  ./mnt-tapsure-scan.sh
  ./mnt-tapsure-scan.sh --regex 'tapsure|TapSure' --out /tmp/report.txt
  ./mnt-tapsure-scan.sh --delete-largest --yes
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT_DIR="$2"; shift 2;;
    --regex) REGEX="$2"; shift 2;;
    --out) OUT_FILE="$2"; shift 2;;
    --max-depth) MAX_DEPTH="$2"; shift 2;;
    --type) TYPE="$2"; shift 2;;
    --dry-run) DRY_RUN=1; shift;;
    --delete-largest) DELETE_LARGEST=1; shift;;
    --yes) YES=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

if [[ ! -d "$ROOT_DIR" ]]; then
  echo "ERROR: root not found: $ROOT_DIR" >&2
  exit 2
fi

if ! command -v find >/dev/null 2>&1 || ! command -v grep >/dev/null 2>&1; then
  echo "ERROR: find and grep are required" >&2
  exit 2
fi

# Prefer gnu du/stat if available; fall back to busybox variants.
DU_BIN="du"
STAT_BIN="stat"

bytes_dir() {
  # prints total size in bytes for a directory
  # GNU: du -sb
  if "$DU_BIN" -sb "$1" >/dev/null 2>&1; then
    "$DU_BIN" -sb "$1" | awk '{print $1}'
    return
  fi
  # POSIX-ish: du -sk (KB)
  local kb
  kb=$(( $("$DU_BIN" -sk "$1" | awk '{print $1}') ))
  echo $((kb * 1024))
}

bytes_path() {
  if [[ -d "$1" ]]; then
    bytes_dir "$1"
    return
  fi
  if [[ -f "$1" ]]; then
    if "$STAT_BIN" -c '%s' "$1" >/dev/null 2>&1; then
      "$STAT_BIN" -c '%s' "$1"
      return
    fi
    wc -c <"$1" | tr -d ' '
    return
  fi
  echo 0
}

count_files() {
  if [[ -d "$1" ]]; then
    find "$1" -type f 2>/dev/null | wc -l | tr -d ' '
    return
  fi
  if [[ -f "$1" ]]; then
    echo 1
    return
  fi
  echo 0
}

# Discover candidate "versions": paths whose path matches regex.
# Limit depth so we don't treat every nested node_modules as a version.
FIND_TYPE_ARGS=()
case "${TYPE,,}" in
  dir) FIND_TYPE_ARGS=(-type d) ;;
  file) FIND_TYPE_ARGS=(-type f) ;;
  any) FIND_TYPE_ARGS=(\( -type d -o -type f \)) ;;
  *) echo "ERROR: --type must be any|dir|file" >&2; exit 2;;
esac

mapfile -t CANDIDATES < <(
  (find "$ROOT_DIR" -maxdepth "$MAX_DEPTH" "${FIND_TYPE_ARGS[@]}" 2>/dev/null || true) \
    | (grep -E -i "$REGEX" || true) \
    | sort -u
)

{
  echo "TapSure /mnt scan report"
  echo "timestamp: $(date -Is)"
  echo "root: $ROOT_DIR"
  echo "regex: $REGEX"
  echo "max_depth: $MAX_DEPTH"
  echo "candidates: ${#CANDIDATES[@]}"
  echo
  printf '%12s  %10s  %s\n' "SIZE_BYTES" "FILES" "PATH"
  printf '%12s  %10s  %s\n' "----------" "-----" "----"
} >"$OUT_FILE"

largest_path=""
largest_bytes=0

for d in "${CANDIDATES[@]}"; do
  [[ -e "$d" ]] || continue

  b=$(bytes_path "$d" || echo 0)
  f=$(count_files "$d" || echo 0)

  printf '%12s  %10s  %s\n' "$b" "$f" "$d" >>"$OUT_FILE"

  if [[ "$b" -gt "$largest_bytes" ]]; then
    largest_bytes="$b"
    largest_path="$d"
  fi

  # Also record grep hits (count of matching lines) inside each candidate.
  # Avoid binary noise; keep it lightweight.
  hits=$( ((grep -RIn --binary-files=without-match -E -i "$REGEX" "$d" 2>/dev/null || true) | wc -l) | tr -d ' ' )
  printf '  grep_hits=%s\n' "$hits" >>"$OUT_FILE"

  # Record top 10 matching file paths (unique), for quick navigation.
  printf '  sample_files:\n' >>"$OUT_FILE"
  ((grep -RIl --binary-files=without-match -E -i "$REGEX" "$d" 2>/dev/null || true) \
    | head -10 \
    | sed 's/^/    - /' >>"$OUT_FILE") || true
  echo >>"$OUT_FILE"
done

{
  echo "SUMMARY"
  echo "largest_bytes: $largest_bytes"
  echo "largest_path: $largest_path"
} >>"$OUT_FILE"

echo "Wrote report: $OUT_FILE"
echo "Candidates found: ${#CANDIDATES[@]}"
echo "Largest: $largest_bytes bytes | $largest_path"

if [[ ${#CANDIDATES[@]} -eq 0 ]]; then
  echo "NOTE: No matches for regex '$REGEX' under '$ROOT_DIR' (max-depth=$MAX_DEPTH, type=$TYPE)." >&2
  echo "Tips:" >&2
  echo "  - Quote your regex: --regex 'tapsure|TapSure'" >&2
  echo "  - Increase depth: --max-depth 6" >&2
  echo "  - Check root: --root /mnt" >&2
fi

if [[ "$DELETE_LARGEST" == "1" ]]; then
  if [[ -z "$largest_path" ]]; then
    echo "ERROR: No candidate directories found to delete." >&2
    exit 3
  fi
  if [[ ! -d "$largest_path" ]]; then
    echo "ERROR: Largest match is not a directory; refusing to delete: $largest_path" >&2
    echo "Hint: re-run with --type dir" >&2
    exit 3
  fi
  if [[ "$YES" != "1" ]]; then
    echo "ERROR: Refusing to delete without --yes" >&2
    echo "Would delete: $largest_path" >&2
    exit 4
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "DRY RUN: would rm -rf: $largest_path"
    exit 0
  fi

  echo "Deleting largest candidate: $largest_path"
  rm -rf -- "$largest_path"
  echo "Deleted: $largest_path"
fi
