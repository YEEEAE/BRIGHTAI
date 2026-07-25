# Main Branch Protection — Manual Setup Checklist

**Date**: 2026-07-25
**Author**: BrightAI Workspace Agent (BAI-PROC-12)
**Audience**: Project owner (Yazeed) — manual GitHub UI configuration
**Why this is a checklist, not a script**: GitHub branch protection requires
admin access to the repo settings page (`github.com/<org>/<repo>/settings/branches`).
The agent does not have a token with `repo:admin` scope, so the setup must be
done by the human. This document is the step-by-step. Verify each step before
moving to the next.

**Time required**: ~10 minutes

---

## Context

The BAI-PROC-12 (2026-07-25) process gates work locally, but they do not
prevent a direct push to `main` from a developer machine with write access.
The 3 reports that claimed ✅ for fixes that never reached production
(BAI-SEC-10, BAI-SEO-003-S3, BAI-DEPLOY-11) all happened because:
1. The fixes were verified **locally** only.
2. They sat **uncommitted** in the working tree (per the "user commits" rule).
3. The user eventually committed + pushed to main.
4. Render auto-deployed from main.
5. **Cloudflare cache + Render deploy lag** masked the deploy from being
   observed by `pnpm run verify:post-deploy`.
6. The reports claimed PASS based on local verification.

To prevent this, every change to `main` must go through a PR that:
- Passes the local verification (`pnpm run verify:all`)
- Passes the production verification (`pnpm run verify:production`) — for
  deploy-impacting changes
- Passes the reports gate (`pnpm run verify:report`)
- Has at least one human approval (the project owner)

This requires the GitHub branch protection configuration below.

---

## Step 1 — Open the branch protection page

Navigate to:

```
https://github.com/<your-org>/brightai-monorepo/settings/branches
```

Replace `<your-org>` with the GitHub org / user that owns the repo.

Click **Add rule** (or edit the existing `main` rule if one exists).

---

## Step 2 — Branch name pattern

- **Branch name pattern**: `main`

---

## Step 3 — Protect matching branches — required settings

Check these boxes:

- ☑ **Require a pull request before merging**
  - ☑ **Require approvals**: 1
  - ☐ **Dismiss stale pull request approvals when new commits are pushed** (optional, recommended)
  - ☐ **Require review from Code Owners** (if you have a CODEOWNERS file; otherwise skip)
- ☑ **Require status checks to pass before merging**
  - ☑ **Require branches to be up to date before merging**
  - Under **Search for status checks**, add the following required check names
    (these are the `name:` fields from each workflow's job):
    - `install` (from ci-build-guard.yml)
    - `typecheck` (from ci-build-guard.yml)
    - `lint` (from ci-build-guard.yml)
    - `test-all` (from ci-build-guard.yml, was `test` before BAI-PROC-12)
    - `build-astro` (from ci-build-guard.yml)
    - `build-dashboard` (from ci-build-guard.yml)
    - `seo-gates` (from ci-build-guard.yml)
    - `security-scan` (from ci-build-guard.yml)
    - `ci-success` (from ci-build-guard.yml — the gate job)
    - `Reports Gate — Report claims discipline gate` (from reports-gate.yml, BAI-PROC-12 NEW)
- ☑ **Require conversation resolution before merging**
- ☐ **Require signed commits** (optional, recommended for production sites)
- ☑ **Require linear history** (optional, but encourages clean history)
- ☐ **Require merge queue** (only if you have a GitHub Enterprise plan; otherwise skip)
- ☐ **Allow specified actors to bypass required pull requests**
  - If you want a single admin bypass, add yourself here. Otherwise leave unchecked.

---

## Step 4 — Rules applied to everyone including administrators

- ☑ **Do not allow force pushes** — every commit to main is final.
- ☑ **Do not allow deletions** — `main` cannot be deleted.

---

## Step 5 — Save the rule

Click **Create** (or **Save changes** if editing an existing rule).

You should see a green checkmark on the rule with the message
"Rule active for `main`".

---

## Step 6 — Verify the rule (test PR)

1. Create a test branch:
   ```bash
   git checkout -b test-branch-protection
   echo "test" > test-branch-protection.txt
   git add test-branch-protection.txt
   git commit -m "test: branch protection verification"  # WARNING: this WILL FAIL the commit-msg hook
   ```

   The commit-msg hook will reject the message format. Use a valid one:
   ```bash
   git commit -m "[BAI-PROC-12] test branch protection verification"
   ```

2. Push the branch:
   ```bash
   git push origin test-branch-protection
   ```

3. Open a PR on GitHub. You should see:
   - The **Merge** button is **disabled** with the message
     "Required status checks are expected" or similar.
   - The status check list includes all 9 required checks from Step 3.

4. If the PR is from a forked repo, some checks will require approval to
   run on a fork. The ci-build-guard.yml has `pull_request` and `push`
   triggers — forks may not have access to `push`. If you see "Waiting
   for status checks to be reported", that's normal for first-time forks.

5. Merge the PR (or close it — both demonstrate the protection works).

6. Delete the test branch:
   ```bash
   git push origin --delete test-branch-protection
   ```

---

## Step 7 — Bypass for emergency hotfixes

The branch protection does NOT include a self-approval bypass (per the
"1 approval required" rule). If a true production emergency requires
pushing directly to `main`:

1. Temporarily reduce the protection to "0 approvals" or use a GitHub
   admin override.
2. Make the hotfix commit (use `[FIX-XXX-NN] description` format).
3. Restore the protection immediately after the hotfix lands.
4. Write a follow-up report documenting the bypass + the reason.

Avoid the bypass where possible. The whole point of this protection is
to prevent the BAI-PROC-12 gap from recurring.

---

## Acceptance criteria

The protection is correctly configured when ALL of the following hold:

- [ ] Direct push to `main` is rejected (error: "protected branch hook declined").
- [ ] A PR from any branch (even owned by a maintainer) cannot be merged
      without 1 approval + all 9 status checks passing.
- [ ] The reports-gate CI runs on every PR that touches `report/**` and
      fails the PR if any post-2026-07-25 report has ✅ without
      `verified_production: yes`.
- [ ] The ci-build-guard CI runs on every PR and `ci-success` must be
      green.
- [ ] The commit-msg hook rejects unformatted commits (verified locally
      in this session — see `report/2026-07-25-bai-proc-12-verify-production-process.md`).

---

## Troubleshooting

### "I don't see my check in the Search for status checks list"

The check must have run at least once before it can be required. Open a
test PR, wait for the checks to complete, then come back to the branch
protection page. The check will now be available in the search.

### "The check is required but the workflow doesn't run on forks"

Forks don't get `push` events, so `push:` triggers don't fire. The
`pull_request:` trigger works for forks. The `ci-build-guard.yml` and
`reports-gate.yml` both have `pull_request:` triggers, so this should
not be an issue.

### "I need to allow a specific actor to bypass the protection"

Add the GitHub username to the **Allow specified actors to bypass
required pull requests** list. This is useful for solo developers who
don't have a second human to review their work. For BrightAI, since
the project owner IS the second human (Yazeed), we recommend leaving
this OFF and using a pair-programming session or a self-PR review
instead.

### "The reports-gate workflow is failing on legacy reports"

By design. Legacy reports (date < 2026-07-25) are grandfathered but
still generate warnings. To clear the warnings, retroactively add
`verified_production: yes` to the legacy report (after running
`pnpm run verify:production` against the historical state — which is
usually impossible) or leave them as warnings. The CI gate exits 1
only on post-2026-07-25 reports, not on legacy warnings.

---

## Related

- BAI-PROC-12 (2026-07-25) — process gates
- BAI-DEPLOY-11 (2026-07-25) — deployment drift detection
- BAI-SEC-10 (2026-07-25) — /frontend/ leak close
- DEC-PROC-12-2026-07-25-002 — commit-msg format
- DEC-PROC-12-2026-07-25-003 — production content gate
- `report/2026-07-25-bai-proc-12-verify-production-process.md` — full report

---

**Verification of this checklist itself**:

- This document was created 2026-07-25 as part of BAI-PROC-12.
- Apply the protection per Steps 1-5.
- Verify per Step 6.
- Mark this checklist as `verified_production: yes` in its `Verification Status` section
  once the protection is confirmed active on `main`.

> This checklist is the human-action counterpart to the CI gates. The CI
> gates work without the protection, but the protection is what makes the
> gates non-bypassable. Both are needed.
