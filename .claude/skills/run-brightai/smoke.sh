#!/usr/bin/env bash
# BRIGHTAI smoke test — launch backend, verify endpoints, clean up.
# Usage: bash .claude/skills/run-brightai/smoke.sh
# Exit 0 = healthy, 1 = failure.

set -euo pipefail

PORT="${PORT:-3001}"
LOG="/tmp/brightai-server.log"
MOCK="${AI_GATEWAY_MOCK_MODE:-1}"

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# --- Launch ---
AI_GATEWAY_MOCK_MODE=$MOCK node backend/server.js &> "$LOG" &
SERVER_PID=$!

# --- Wait for readiness ---
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "FAIL: server not ready after 30s"
    cat "$LOG"
    exit 1
  fi
  sleep 1
done

# --- Verify endpoints ---
FAIL=0

# Health
STATUS=$(curl -sf "http://127.0.0.1:$PORT/api/health" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null)
if [ "$STATUS" != "ok" ]; then
  echo "FAIL: /api/health returned '$STATUS'"
  FAIL=1
else
  echo "OK: /api/health"
fi

# Root HTML page
CODE=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/")
if [ "$CODE" != "200" ]; then
  echo "FAIL: / returned $CODE"
  FAIL=1
else
  echo "OK: / (root HTML)"
fi

# Static pages
for PAGE in about/ services/ blog/ pricing/; do
  CODE=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/$PAGE")
  if [ "$CODE" != "200" ]; then
    echo "FAIL: /$PAGE returned $CODE"
    FAIL=1
  else
    echo "OK: /$PAGE"
  fi
done

# AI status
CODE=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/ai/status")
if [ "$CODE" != "200" ]; then
  echo "FAIL: /api/ai/status returned $CODE"
  FAIL=1
else
  echo "OK: /api/ai/status"
fi

# Gateway status
CODE=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/gateway-status")
if [ "$CODE" != "200" ]; then
  echo "FAIL: /api/gateway-status returned $CODE"
  FAIL=1
else
  echo "OK: /api/gateway-status"
fi

echo "---"
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: all endpoints healthy"
  exit 0
else
  echo "FAIL: some endpoints failed"
  exit 1
fi
