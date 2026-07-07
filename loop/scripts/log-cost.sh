#!/usr/bin/env bash
# loop/scripts/log-cost.sh — append a cost row to memory/usage.log
#
# Usage: log-cost.sh <role> <cost_usd>
#   role: triage | conductor | worker | verifier | <other-tag>
#   cost_usd: numeric (e.g. 0.35 or 0.012)
#
# Output row: <ISO-timestamp>\t<role>\t<cost>
#
# macOS adaptation: GNU `date -Is` → portable `date -u +"%Y-%m-%dT%H:%M:%SZ"`.

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo -e "$TS\t$1\t$2" >> "$(dirname "$0")/../memory/usage.log"