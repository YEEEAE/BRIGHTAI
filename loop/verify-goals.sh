#!/usr/bin/env bash
# loop/verify-goals.sh — Standing goals sentinel
#
# For each loop/goals/<name>.md that is not retired, run the goal's
# `predicate:` line as a bash command. exit 0 = invariant holds; non-zero
# = violation. Writes a row to loop/memory/goal-ledger.tsv on every check.
#
# Adaptations for macOS (GNU-only → portable):
#   - `timeout` is GNU coreutils. macOS has no `timeout`. We inline a
#     perl-alarm wrapper at the top of this script so it works on both.
#   - `date -Is` is GNU. We use `date -u +"%Y-%m-%dT%H:%M:%SZ"` instead.
#   - `date +%s%3N` (millisecond epoch) is GNU. macOS only has `%s`.
#     The ledger records seconds, not milliseconds — acceptable for our
#     purposes (predicate timeout is 60s, sub-second granularity isn't needed).
#
# Layout: runs from anywhere, but resolves goals/ and memory/ relative to
# the repo root (where this script lives at loop/verify-goals.sh).

set -uo pipefail
cd "$(dirname "$0")/.."

# portable `timeout N CMD...` — GNU coreutils not required
run_with_timeout() {
  local secs="$1"; shift
  "$@" &
  local pid=$!
  ( sleep "$secs"; kill -9 "$pid" 2>/dev/null ) >/dev/null 2>&1 &
  local watchdog=$!
  wait "$pid" 2>/dev/null
  local rc=$?
  kill -9 "$watchdog" 2>/dev/null || true
  wait "$watchdog" 2>/dev/null || true
  return "$rc"
}

LEDGER="loop/memory/goal-ledger.tsv"
VIOLATIONS=0
NOW_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NOW_DATE=$(date +%F)
NOW_MS=$(date +%s)   # epoch seconds (no ms on BSD date)

for g in loop/goals/*.md; do
  [ -e "$g" ] || continue
  grep -q '^status: retired' "$g" && continue
  pred=$(grep '^predicate:' "$g" | cut -d' ' -f2-); name=$(basename "$g" .md)
  start=$(date +%s)
  if run_with_timeout 60 bash -c "$pred" >/dev/null 2>&1; then r=pass
    sed -i '' "s/^status:.*/status: satisfied/; s/^last-pass:.*/last-pass: $NOW_DATE/" "$g"
  else r=FAIL; VIOLATIONS=$((VIOLATIONS+1)); sed -i '' "s/^status:.*/status: VIOLATED/" "$g"; fi
  echo -e "$NOW_ISO\t$name\t$r\t$(( $(date +%s) - start ))" >> "$LEDGER"
done

if [ "$VIOLATIONS" -gt 0 ]; then
  grep -l '^status: VIOLATED' loop/goals/*.md
  exit 1
fi
echo "all standing goals hold"