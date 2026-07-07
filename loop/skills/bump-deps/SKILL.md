---
name: bump-deps
description: Bump one dependency version in package.json (and lockfile) and verify the build still passes.
when: A dependency has a published update (patch or minor) AND the user has approved bumping it.
tier: watch
---

# bump-deps

## Goal

Update one dependency safely. One dep per commit. No scope creep.

## Steps

1. Identify the single dep to bump (run `npm outdated` to see candidates — pick one).
2. Run `npm install <pkg>@<new-version> --save[-dev]` — exact version, no `^` rewrites on adjacent deps.
3. Inspect the diff. If peer-dep warnings appear, halt and ask.
4. Run `npm run build`. Must produce 125 pages, 0 errors.
5. Run `loop/guardrails/verify.sh`. Must exit 0.
6. If the dep touches the bundle (any runtime import), run `npm run performance:budget`. Must exit 0.
7. Log pass/fail to `loop/scripts/trust-log.sh bump-deps <pass|fail>`.

## Never

- Don't bump multiple deps in one commit (one dep = one commit = one rollback unit).
- Don't bump majors without explicit user approval — major bumps need a separate skill (`migrate-dep`).
- Don't bypass `npm audit` failures — fix them first.
- Don't edit `package-lock.json` by hand. Use `npm install`.

## done_when

- `package.json` and `package-lock.json` show exactly one dep change.
- `npm run build` → 125 pages, 0 errors.
- `loop/guardrails/verify.sh` exits 0.
- `npm run performance:budget` exits 0 (only if the dep is in the runtime bundle).
- Commit message: `chore(deps): bump <pkg> from <old> to <new>`.