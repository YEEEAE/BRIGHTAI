---
name: fix-flaky-test
description: Detect, reproduce, and stabilise a single flaky test in the BRIGHTAI suite (vitest / node --test).
when: A test fails on second run without code changes, OR CI shows a known-flake on a tracked PR.
tier: watch
---

# fix-flaky-test

## Goal

Turn one flaky test into a deterministic one. One fix per commit.

## Steps

1. Reproduce: run the failing test 5 times. Capture the failure rate.
2. Classify the flake:
   - **Timing** (setTimeout/rAF not awaited, race conditions) → add explicit waits.
   - **Order dependency** (shared mutable state across tests) → isolate fixtures.
   - **Time-of-day** (Date.now, new Date()) → inject a clock.
   - **Network** (real fetch in unit test) → stub it.
3. Apply the smallest fix that removes the flake.
4. Re-run 10 times. Must pass 10/10.
5. Run the full test suite. Must still exit 0.
6. Run `loop/guardrails/verify.sh`. Must exit 0.
7. Log pass/fail to `loop/scripts/trust-log.sh fix-flaky-test <pass|fail>`.

## Never

- Don't delete or skip the test to make it pass.
- Don't add `.only` or `.skip` and commit.
- Don't broaden the fix to unrelated tests — one flake per commit.
- Don't increase global timeouts as a substitute for a real fix.

## done_when

- The targeted test passes 10/10 consecutive runs.
- Full suite still exits 0.
- `loop/guardrails/verify.sh` exits 0.
- Commit message: `test(<area>): stabilise <test-name> against <flake-class>`.