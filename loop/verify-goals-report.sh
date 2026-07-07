#!/usr/bin/env bash
# loop/verify-goals-report.sh — daily sentinel
#
# Detection-only. Runs verify-goals.sh, then for each VIOLATED goal:
#   - reads its last-pass date from the goal file
#   - lists what merged into the repo since that date
#   - prints goal + suspects + on-violation policy
# Never fixes anything. Never edits the goal files.
#
# Cron wiring:
#   0 6 * * *  cd <REPO> && ./loop/verify-goals-report.sh 2>&1
#
# Exit codes:
#   0 = all goals hold (silent or "all standing goals hold" line)
#   1 = at least one goal violated (report printed, exit 1 so cron can mail)

set -uo pipefail
cd "$(dirname "$0")/.."

echo "=== goal sentinel: $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="

if ./loop/verify-goals.sh; then
  echo "no action needed"
  exit 0
fi

# verify-goals.sh exited non-zero. enumerate violated goals.
echo ""
echo "=== VIOLATED GOALS — suspects report ==="

for g in loop/goals/*.md; do
  [ -e "$g" ] || continue
  grep -q '^status: VIOLATED' "$g" || continue

  name=$(basename "$g" .md)
  last_pass=$(grep '^last-pass:' "$g" | awk '{print $2}')
  on_violation=$(grep '^on-violation:' "$g" | cut -d' ' -f2-)

  echo ""
  echo "--- goal: $name ---"
  echo "  last-pass: ${last_pass:-never}"
  echo "  on-violation: $on_violation"

  if [ -n "$last_pass" ] && [ "$last_pass" != "never" ]; then
    echo "  suspects (commits since $last_pass):"
    # read into array to preserve line boundaries (no word-splitting)
    suspects_seen=0
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      echo "    $line"
      suspects_seen=$((suspects_seen + 1))
      [ "$suspects_seen" -ge 20 ] && break
    done < <(git log --oneline --since="$last_pass" 2>/dev/null)
    if [ "$suspects_seen" -eq 0 ]; then
      echo "    (no commits since $last_pass)"
    fi
  else
    echo "  suspects: (no last-pass recorded — goal has never passed; investigate fresh)"
  fi
done

echo ""
echo "=== sentinel: detection only — no fixes applied ==="
exit 1