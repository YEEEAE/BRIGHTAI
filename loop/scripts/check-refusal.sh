#!/usr/bin/env bash
# usage: check-refusal.sh <response.json>
# exit 0 = safe to proceed (or refusal handled)
# exit 2 = reroute to fallback model
# exit 1 = unrecoverable

set -euo pipefail

F="${1:?usage: check-refusal.sh response.json}"

STOP=$(jq -r '.stop_reason // .delta.stop_reason // "unknown"' "$F" 2>/dev/null || echo unknown)

case "$STOP" in
  end_turn|stop|tool_use|finished|succeeded)
    exit 0 ;;
  refusal|content_filter)
    echo "REFUSAL detected: $STOP" >&2
    # log + signal reroute (portable ISO timestamp for both GNU and BSD date)
    TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%S%z")
    printf "%s\trefusal\t%s\n" "$TS" "$STOP" >> "$(dirname "$0")/../memory/refusals.log"
    exit 2 ;;
  *)
    echo "UNKNOWN stop_reason: $STOP" >&2
    exit 1 ;;
esac