#!/usr/bin/env bash
# call.sh — wrapper around the model CLI for the BRIGHTAI heartbeat
#
# Usage:
#   call.sh <model> <effort> <prompt_file> [extra_args...]
#
# Contract:
#   exit 0 = model returned a usable response (safe to parse)
#   exit 2 = refusal or model-routing failure (caller should skip / reroute)
#   exit 1 = unrecoverable (caller should escalate)
#
# BRIGHTAI / MiniMax Code specifics:
#   - Model string: MiniMax-M3 (configured in Mavis daemon, provider minimax)
#   - CLI on this host: `MiniMax` (Mavis daemon manager) + `claude` (Claude Code)
#   - Neither is a direct "call model" CLI on this host.
#   - The honest path: try each known strategy with a tight timeout; if none
#     works, exit 2 with a clear message so the heartbeat skips gracefully.
#   - To wire a real bridge: set MINIMAX_BRIDGE in the environment.
#
# Bridge contract (when MINIMAX_BRIDGE is set):
#   stdin           = prompt
#   env MINIMAX_MODEL        = model string (e.g. "MiniMax-M3")
#   env MINIMAX_EFFORT       = effort (low|medium|high|xhigh|max)
#   env MINIMAX_MAX_TOKENS   = integer max output tokens
#   stdout          = JSON parseable by ./loop/scripts/check-refusal.sh
#   no positional args are passed (cleaner than $1/$2/$3 interpolation)
#
# Until a bridge is wired, every heartbeat iteration will log
# "no model backend" and exit 2 — the loop is structurally complete but
# will not call any model.

set -euo pipefail

MODEL="${1:?model required}"
EFFORT="${2:?effort required}"   # low|medium|high|xhigh|max
PROMPT_FILE="${3:?prompt file required}"
shift 3

MAX_TOKENS="${MAX_TOKENS:-64000}"
OUT="/tmp/call-$$.json"
trap 'rm -f "$OUT" "$OUT.raw" "$OUT.test"' EXIT

STRATEGY_TIMEOUT="${STRATEGY_TIMEOUT:-5}"   # seconds per strategy probe

# Portable timeout: run cmd in background, kill after N seconds.
# Returns 0 if the cmd finished before the deadline, 124 (timeout convention) otherwise.
# Suppresses bash job-control "Killed" messages on cleanup.
# IMPORTANT: does not touch stdin — callers pipe prompt into the command.
with_timeout() {
  local secs="$1"; shift
  "$@" &
  local pid=$!
  # watchdog is fully isolated — absorbs the "Killed" message
  (
    sleep "$secs"
    kill -9 "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null
  ) </dev/null >/dev/null 2>&1 &
  local watchdog=$!
  wait "$pid" 2>/dev/null
  local rc=$?
  kill -9 "$watchdog" 2>/dev/null || true
  wait "$watchdog" 2>/dev/null || true
  [ "$rc" -eq 0 ] && return 0 || return 124
}

# Helper: probe whether a CLI supports the flags we need (with timeout)
probe_flags() {
  local cli="$1" need="$2"
  with_timeout "$STRATEGY_TIMEOUT" "$cli" --help 2>/dev/null | grep -q -- "$need" || return 1
}

# ---- strategy 1: explicit bridge ----
if [ -n "${MINIMAX_BRIDGE:-}" ]; then
  if with_timeout "$STRATEGY_TIMEOUT" \
       env MINIMAX_MODEL="$MODEL" MINIMAX_EFFORT="$EFFORT" MINIMAX_MAX_TOKENS="$MAX_TOKENS" \
       bash -c "$MINIMAX_BRIDGE" < "$PROMPT_FILE" > "$OUT" 2>/dev/null; then
    if ./loop/scripts/check-refusal.sh "$OUT"; then
      jq -r '.result // .content[0].text // .' "$OUT"
      exit 0
    fi
    exit 2
  fi
  echo "BRIDGE: command failed or timed out" >&2
  exit 2
fi

# ---- strategy 2: MiniMax CLI with -m flag (works on hosts that have it) ----
if probe_flags MiniMax " -m, --model"; then
  if with_timeout "$STRATEGY_TIMEOUT" MiniMax -m "$MODEL" \
        --effort "$EFFORT" \
        --max-tokens "$MAX_TOKENS" \
        --output-format json \
        "$(cat "$PROMPT_FILE")" > "$OUT" 2>/dev/null; then
    if ./loop/scripts/check-refusal.sh "$OUT"; then
      jq -r '.result // .content[0].text // .' "$OUT"
      exit 0
    fi
    exit 2
  fi
  echo "CALL: MiniMax CLI strategy failed" >&2
  exit 2
fi

# ---- strategy 3: claude CLI print mode (substitute, only if it exits cleanly) ----
if command -v claude >/dev/null 2>&1; then
  if with_timeout "$STRATEGY_TIMEOUT" claude --print --bare "ping" </dev/null >"$OUT.test" 2>/dev/null; then
    rm -f "$OUT.test"
    if with_timeout "$STRATEGY_TIMEOUT" claude --print --bare \
          "$(cat "$PROMPT_FILE")" >"$OUT.raw" 2>/dev/null; then
      jq -n --arg t "$(cat "$OUT.raw")" '{result: $t, stop_reason: "end_turn"}' > "$OUT"
      rm -f "$OUT.raw"
      if ./loop/scripts/check-refusal.sh "$OUT"; then
        jq -r '.result' "$OUT"
        exit 0
      fi
      exit 2
    fi
    rm -f "$OUT.raw"
  else
    rm -f "$OUT.test"
  fi
  echo "CALL: claude --print strategy not viable on this host" >&2
  exit 2
fi

# ---- no strategy worked ----
cat >&2 <<EOF
CALL: no working model backend on this host.
      Set MINIMAX_BRIDGE to a command that produces a JSON response
      with {stop_reason, result} (or {content: [{text}], stop_reason}).
      model=$MODEL effort=$EFFORT prompt=$(basename "$PROMPT_FILE")
EOF
exit 2