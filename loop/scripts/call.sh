#!/usr/bin/env bash
# usage: call.sh <model> <effort> <prompt_file> [extra_args...]
# Always sets max_tokens=64000, checks stop_reason via check-refusal.sh
#
# Adaptations for MiniMax Code (model: MiniMax-M3):
#   - CLI: `MiniMax` (wrapper around Mavis daemon) replaces `claude`
#   - If --effort flag is missing on your CLI, use --reasoning-effort instead
#   - If --max-tokens is missing, use --max-output-tokens
#   - See loop/ENGINE.md for the full spec sheet.

set -euo pipefail

MODEL="${1:?model required}"
EFFORT="${2:?effort required}"   # low|medium|high|xhigh|max
PROMPT_FILE="${3:?prompt file required}"
shift 3

OUT="/tmp/call-$$.json"
trap 'rm -f "$OUT"' EXIT

# call the MiniMax Code CLI
MiniMax -m "$MODEL" \
  --effort "$EFFORT" \
  --max-tokens 64000 \
  --output-format json \
  "$@" \
  "$(cat "$PROMPT_FILE")" > "$OUT" 2>/dev/null

# check for refusal (exits 0=ok, 2=refusal→fallback, 1=unknown)
./loop/scripts/check-refusal.sh "$OUT"

# print result
jq -r '.result // .content[0].text // .' "$OUT"