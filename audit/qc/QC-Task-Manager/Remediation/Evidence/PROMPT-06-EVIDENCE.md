# PROMPT 06 — Canonical Form Contract Evidence

**Task:** QC-REMEDIATION-006  
**Date:** 2026-09-03  
**Status:** PASS — 6/6 acceptance criteria

## Implemented

- Replaced the partial `form-productivity.js` helper with one canonical, dependency-free controller applied to every form discovered in the QC application. POST forms receive dirty tracking, draft persistence, restore/discard UI, native `beforeunload`, validation focus, error association, and pending locking.
- Draft keys are scoped to `qc-form-draft:v1:{userId}:{pathname}{search}:{action}`. Unauthenticated pages do not write drafts. Password, passcode, PIN, secret, token, signature, and file fields are excluded from the serialized JSON.
- Drafts are serialized after a 500ms debounce and removed after a successful followed POST response (`response.ok`). Logout clears every draft belonging to the current user.
- Invalid controls receive `aria-invalid="true"`; generated inline errors receive stable IDs and are appended to `aria-describedby`; the first invalid control receives focus before any server request.
- Submit controls are disabled immediately, marked `aria-busy`, and receive the localized pending copy `جاري الحفظ...` with a reduced-motion-safe spinner.
- Added the authenticated user ID to the layout contract and marked the React laboratory test form as a canonical consumer. Existing server-side Zod schemas remain authoritative for client/server validation parity.

## Coverage and verification

| Check | Result |
|---|---:|
| Form files discovered under `src/` | 51 |
| `test:forms-advanced-100` | 9/9 PASS |
| `test:form-productivity` | 20/20 PASS |
| `test:manifest` | 84 canonical unit suites / 28 E2E suites |
| `typecheck` | 0 errors, 0 warnings, 0 hints |
| `build` | PASS |
| Full `pnpm test` | PASS; all registered unit suites completed with 0 failed assertions |
| `pnpm e2e:acceptance` | PASS; 28 suites plus 2 restart-persistence phases |

The browser suite exercises typing and 500ms persistence, `beforeunload`, draft restoration, first-invalid focus, `aria-describedby`, immediate submit locking, logout cleanup, and the 51-file inventory. Existing laboratory database/schema tests remained green, including the 72/72 laboratory form checks and role/RBAC coverage in the full suite.

## Acceptance criteria

- **AC-01:** PASS — canonical controller documented in source comments and this evidence.
- **AC-02:** PASS — controller auto-discovers all 51 form files through the shared layout script; no per-form ad-hoc handler was added.
- **AC-03:** PASS — dirty state and native `beforeunload` are registered by the shared controller for POST forms.
- **AC-04:** PASS — invalid focus and error association are browser-tested.
- **AC-05:** PASS — immediate disabled/pending state is browser-tested.
- **AC-06:** PASS — this evidence file exists at the required path.

## Notes

- The first sandboxed run of the browser suite was blocked by localhost socket policy; the same suite was rerun with the approved local browser-test permission and passed 9/9.
- A repository-wide `git diff --check` still reports pre-existing trailing whitespace in `audit/website-builder-SEO/SEO-GEO-KEYWORD-COMPETITOR-RESEARCH-2026-09-03.md`; it is unrelated and was not changed.
- No commit, push, deployment, secret, password, or e-signature PIN was created or modified.
