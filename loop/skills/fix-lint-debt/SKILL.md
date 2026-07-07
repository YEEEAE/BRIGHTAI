---
name: fix-lint-debt
description: Sweep the codebase for lint warnings introduced by recent commits and fix them in small, surgical commits.
when: ESLint/Prettier output shows >5 new warnings since last sweep, OR a sweeper finds warnings on touched files.
tier: watch
---

# fix-lint-debt

## Goal

Reduce the lint warning count without changing behavior. One warning class per commit.

## Steps

1. Run `npm run lint` (or equivalent). Capture the warning count.
2. Group warnings by rule. Pick the highest-frequency rule with the lowest blast radius.
3. For each rule, run the autofixer first (`npm run lint -- --fix`).
4. For what autofix can't handle, edit files manually — one rule, one commit.
5. Re-run lint. Confirm the targeted warning count is zero.
6. Run `loop/guardrails/verify.sh`. Must exit 0.
7. Log pass/fail to `loop/scripts/trust-log.sh fix-lint-debt <pass|fail>`.

## Never

- Don't change app behavior to silence a warning (use `// eslint-disable-next-line` only when the warning is a false positive).
- Don't autofix across more than 50 files in one commit.
- Don't touch locked files (`public/_redirects`, `astro.config.mjs`) unless the lint debt is inside them.
- Don't edit tests to make lint pass — fix the source.

## done_when

- The targeted warning rule reports zero hits on the touched files.
- `loop/guardrails/verify.sh` exits 0.
- Commit message: `chore(lint): fix <rule> across <N> files`.