#!/usr/bin/env bash
# BRIGHTAI guardrails — verify.sh
# Runs the lightweight checks before any commit / merge / ship.
# If any of these fail, the loop must not advance.

set -e

npm run typecheck --if-present
npm test --if-present
npm run lint --if-present