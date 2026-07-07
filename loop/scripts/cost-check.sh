#!/usr/bin/env bash
# loop/scripts/cost-check.sh — daily budget guard + 7-day per-role report
#
# Usage:
#   cost-check.sh --budget <usd>   # exits 1 if today's spend >= budget
#   cost-check.sh --report         # per-role $ totals over last 7 days
#
# Depends on loop/memory/usage.log with rows: <ISO-timestamp>\t<role>\t<cost>
#
# macOS adaptation: GNU `date -d '7 days ago' +%F` → BSD `date -v-7d +%F`.
# Both produce the same YYYY-MM-DD string. The awk string-comparison
# `$1 >= since` still works because full timestamps (`2026-07-07T22:53:46Z`)
# sort lexicographically the same as calendar dates.

set -euo pipefail
F="$(dirname "$0")/../memory/usage.log"; touch "$F"
# Use UTC to match the log timestamps (which are emitted by log-cost.sh in UTC).
TODAY=$(date -u +%F)
case "${1:-}" in
  --budget)
    spent=$(awk -F'\t' -v d="$TODAY" '$1 ~ d {s+=$3} END{printf "%.2f",s+0}' "$F")
    awk -v s="$spent" -v b="$2" 'BEGIN{exit (s+0>=b+0)?1:0}' \
      || { echo "spent \$$spent of \$$2 today" >&2; exit 1; };;
  --report)
    since=$(date -v-7d +%F 2>/dev/null || date -d '7 days ago' +%F)
    awk -F'\t' -v since="$since" \
      '$1>=since{s[$2]+=$3;t+=$3} END{for(k in s) printf "  %-10s $%.2f\n",k,s[k]; printf "  TOTAL      $%.2f\n",t}' "$F";;
  *)
    echo "usage: $0 --budget <usd> | --report" >&2
    exit 2;;
esac