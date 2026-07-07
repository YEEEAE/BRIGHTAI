#!/usr/bin/env bash
# loop.sh — BRIGHTAI heartbeat
#
# exit map:
#   0 = quiet / done
#   1 = iteration cap reached (check STATE.md)
#   2 = rerouted (model fallback triggered)
#   3 = budget breach
#   4 = missing dependency / setup error
#
# BRIGHTAI host notes (see loop/ENGINE.md "Current host — model bridge gap"):
#   - If MINIMAX_BRIDGE is unset, call.sh exits 2 per iteration with
#     "no model backend". The loop treats this as setup state, not failure.
#   - To activate the heartbeat against a real model, set MINIMAX_BRIDGE
#     to your model-calling command (curl/HTTP/SDK/etc.).

set -euo pipefail

cd "$(dirname "$0")/.."

ROOT="$(pwd)"

# ---- knobs ----
MAX_ITERS="${MAX_ITERS:-10}"
DAILY_BUDGET_USD="${DAILY_BUDGET_USD:-5}"
TRIAGE_MODEL="${TRIAGE_MODEL:-MiniMax-M3-low}"     # cheap for triage
CONDUCTOR_MODEL="${CONDUCTOR_MODEL:-MiniMax-M3}"    # main seat, xhigh
WORKER_MODEL="${WORKER_MODEL:-MiniMax-M3-medium}"   # cheap for execution
VERIFIER_MODEL="${VERIFIER_MODEL:-MiniMax-M3}"      # main seat, high

MAX_TOKENS="${MAX_TOKENS:-64000}"
LOG="loop/memory/loop.log"
WORK_ORDER="loop/work-order.json"

mkdir -p loop/memory loop/memory/worktrees

log() { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "$LOG"; }

log "=== loop.sh START (budget=\$$DAILY_BUDGET_USD, max_iters=$MAX_ITERS) ==="

# ---- budget check helper (uses log-cost.sh + cost-check.sh from BUILD 6) ----
check_budget() {
  if [ -x loop/scripts/cost-check.sh ]; then
    loop/scripts/cost-check.sh --budget "$DAILY_BUDGET_USD" || return 1
  fi
}

# ---- call helper (uses call.sh from BUILD 0) ----
call() {
  local model="$1" effort="$2" prompt_file="$3" out="$4"
  if [ -x loop/scripts/call.sh ]; then
    MAX_TOKENS="$MAX_TOKENS" loop/scripts/call.sh "$model" "$effort" "$prompt_file" \
      --output-format json > "$out" 2>>"$LOG" \
      || return 1
  else
    # fallback: direct CLI call (host that has a MiniMax CLI with -m flag)
    MiniMax -m "$model" --max-tokens "$MAX_TOKENS" \
      --output-format json \
      "$(cat "$prompt_file")" > "$out" 2>>"$LOG" \
      || return 1
  fi
}

# ---- triage helper ----
triage() {
  local out="loop/memory/triage.txt"

  {
    echo "## git log (last 20)"
    git log --oneline -20
    echo ""
    echo "## open issues"
    gh issue list --limit 20 2>/dev/null || echo "(no gh)"
    echo ""
    echo "## recent CI"
    gh run list --limit 10 2>/dev/null || echo "(no gh)"
    echo ""
    echo "## BRIGHTAI signals"
    # broken internal links check (lightweight)
    if [ -f package.json ] && grep -q '"check-links"' package.json; then
      npm run check-links --if-present 2>&1 | tail -10 || true
    fi
    # recent content edits
    git diff --name-only HEAD~5 HEAD 2>/dev/null | grep '^src/content/' | head -10 || true
  } > loop/memory/signals.txt

  if ! call "$TRIAGE_MODEL" "low" loop/triage.md "$out"; then
    log "triage: call failed"
    echo "status: quiet" > "$out"
  fi

  # normalize: extract just the findings into STATE.md
  grep -E '^- finding:|status: ' "$out" | head -20 > loop/memory/STATE.md.new || true
  cat loop/memory/STATE.md.new > loop/memory/STATE.md 2>/dev/null || touch loop/memory/STATE.md
  rm -f loop/memory/STATE.md.new

  log "triage: done"
}

# ---- conductor helper ----
conduct() {
  local out="/tmp/c.json"
  local prompt="/tmp/conductor-prompt.txt"

  {
    cat loop/conductor.md
    echo ""
    echo "STATE:"
    cat loop/memory/STATE.md 2>/dev/null || echo "(empty)"
    echo ""
    echo "TRUST:"
    if [ -x loop/scripts/trust-log.sh ]; then
      loop/scripts/trust-log.sh --render 2>/dev/null || echo "(no trust log yet)"
    else
      echo "(trust log not built — BUILD 4)"
    fi
    echo ""
    echo "CONTRACT:"
    cat loop/contract.md
  } > "$prompt"

  if ! call "$CONDUCTOR_MODEL" "xhigh" "$prompt" "$out"; then
    log "conductor: call failed"
    return 1
  fi

  # route-tolerance check (uses check-refusal.sh from BUILD 0)
  if [ -x loop/scripts/check-refusal.sh ]; then
    loop/scripts/check-refusal.sh "$out" || {
      log "conductor: refusal or reroute detected"
      echo "- rerouted: conductor" >> loop/memory/STATE.md
      exit 2
    }
  fi

  # extract result JSON
  if ! jq -r '.result // .content[0].text // .' "$out" > "$WORK_ORDER" 2>/dev/null; then
    log "conductor: invalid JSON output"
    return 1
  fi

  # validate work order
  for field in action item skill spec done_when; do
    if ! jq -e ".$field" "$WORK_ORDER" >/dev/null 2>&1; then
      log "conductor: missing field '$field' in work order"
      return 1
    fi
  done
}

# ---- worker helper ----
execute() {
  local i="$1" skill="$2"
  local WT="loop/memory/worktrees/wt-$i"

  # clean any stale worktree
  git worktree remove --force "$WT" 2>/dev/null || true

  if ! git worktree add "$WT" -b "loop/$skill-$i" >/dev/null 2>&1; then
    log "worker: failed to create worktree $WT"
    return 1
  fi

  (
    cd "$WT" && \
      MAX_TOKENS="$MAX_TOKENS" MiniMax -m "$WORKER_MODEL" --effort "high" \
        -s "$(cat "$ROOT/loop/workers/implement.md")" \
        "$(cat "$ROOT/$WORK_ORDER")" > "$WT/IMPLEMENTATION.md" 2>>"$ROOT/$LOG"
  )

  log "worker: worktree $WT ready"
}

# ---- verifier helper ----
verify() {
  local i="$1"
  local WT="loop/memory/worktrees/wt-$i"
  local prompt="/tmp/verify-prompt.txt"
  local out="/tmp/v.json"

  {
    cat loop/workers/verify.md
    echo ""
    echo "SPEC:"
    jq -r .spec "$WORK_ORDER"
    echo ""
    echo "DIFF:"
    ( cd "$WT" && git diff )
  } > "$prompt"

  if ! call "$VERIFIER_MODEL" "high" "$prompt" "$out"; then
    log "verifier: call failed"
    echo "FAIL: verifier call failed"
    return 1
  fi

  jq -r '.result // .content[0].text // .' "$out"
}

# ---- main loop ----

check_budget || { log "budget: exceeded at start"; exit 3; }

for ((i=1; i<=MAX_ITERS; i++)); do
  log "--- iter $i ---"

  triage
  if ! grep -q "status: actionable" loop/memory/STATE.md 2>/dev/null; then
    log "triage: quiet — exit 0"
    exit 0
  fi

  if ! conduct; then
    log "conduct: failed"
    exit 1
  fi

  ACTION=$(jq -r .action "$WORK_ORDER")
  SKILL=$(jq -r .skill "$WORK_ORDER")

  case "$ACTION" in
    stop)  log "conductor: stop — exit 0"; exit 0 ;;
    queue) echo "- queued: $SKILL" >> loop/memory/STATE.md; log "conductor: queued $SKILL"; continue ;;
  esac

  if ! execute "$i" "$SKILL"; then
    log "execute: failed"
    continue
  fi

  VERDICT=$(verify "$i")
  log "verifier: $VERDICT"

  WT="loop/memory/worktrees/wt-$i"
  if [[ "$VERDICT" == PASS* ]] && ( cd "$WT" && "$ROOT/loop/guardrails/verify.sh" >/dev/null 2>&1 ); then
    if [ -x loop/scripts/trust-log.sh ]; then
      loop/scripts/trust-log.sh "$SKILL" pass 2>/dev/null || true
      TIER=$(loop/scripts/trust-log.sh --tier "$SKILL" 2>/dev/null || echo "watch")
    else
      TIER="watch"
    fi

    ( cd "$WT" && git add -A && git commit -qm "loop: $SKILL" ) || true

    if [ "$TIER" = "auto" ]; then
      ( cd "$WT" && gh pr create --fill 2>/dev/null ) || log "ship: gh pr skipped (no auth or error)"
      echo "- shipped: $SKILL" >> loop/memory/STATE.md
    else
      echo "- review: $SKILL (tier=$TIER) in $WT" >> loop/memory/STATE.md
    fi
  else
    if [ -x loop/scripts/trust-log.sh ]; then
      loop/scripts/trust-log.sh "$SKILL" fail 2>/dev/null || true
    fi
    echo "- FAILED: $SKILL in $WT" >> loop/memory/STATE.md
  fi

  check_budget || { log "budget: exceeded"; exit 3; }
done

log "loop: iteration cap reached — exit 1"
exit 1