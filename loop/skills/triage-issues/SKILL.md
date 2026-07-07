---
name: triage-issues
description: Triage open GitHub issues for the BRIGHTAI repo — label, prioritise, and either route to a skill or queue for human review.
when: A new issue is opened, OR a weekly sweep finds unlabelled issues, OR `gh issue list` returns >3 unlabelled items.
tier: watch
---

# triage-issues

## Goal

Every open issue gets exactly one label (`bug` / `enhancement` / `docs` / `contract-sensitive` / `wontfix`) and a one-line priority. No silent issues.

## Steps

1. List unlabelled issues: `gh issue list --label none --limit 30 --json number,title,body,author,createdAt`.
2. For each issue:
   - Read title + body.
   - Classify: bug / enhancement / docs / contract-sensitive / wontfix.
   - Write a one-line priority prefix in a top comment: `Priority: P0 | P1 | P2 | P3`.
   - Apply the label: `gh issue edit <n> --add-label <label>`.
3. If the issue maps cleanly to an existing skill (e.g. "lint warning in X" → `fix-lint-debt`), add a comment linking to the skill path.
4. If the issue is contract-sensitive (auth, billing, RTL, schema, layouts, canonical, hreflang), leave a `contract-sensitive` label and do NOT auto-route — humans only.
5. Run `loop/guardrails/verify.sh` (no-op for pure triage, but the harness expects it).
6. Log pass/fail to `loop/scripts/trust-log.sh triage-issues <pass|fail>`.

## Never

- Don't close issues — humans only.
- Don't auto-merge PRs linked from issues.
- Don't add more than one label per issue.
- Don't route contract-sensitive issues to any skill.

## done_when

- Every previously-unlabelled issue now has exactly one triage label.
- Priority prefix comment is on every issue.
- Contract-sensitive issues are not routed.
- Commit message (if a tracking file changed): `chore(triage): labelled <N> issues on YYYY-MM-DD`.