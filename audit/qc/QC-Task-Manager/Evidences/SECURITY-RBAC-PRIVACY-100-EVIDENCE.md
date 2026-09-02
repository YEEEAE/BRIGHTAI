# SECURITY / RBAC / PRIVACY 100% Evidence

**Task:** `QC-100-SECURITY-004`  
**Application:** `apps/qc-task-manager`  
**Evidence scope:** local source, isolated SQLite databases, deterministic unit/contract suites, and production-build artifacts.  
**Canonical authorization source:** `src/lib/permissions.ts` (`PERMISSIONS` plus its entity-level predicates).

## Result

**Local automatable status: PASS (unit/contract scope).** No known critical, high, or medium exploitable authorization defect remains in the exercised scope. A cross-entity CAPA/evidence IDOR found during this task was fixed in `src/lib/qc-operations.ts` and covered by a regression test.

This is not a claim of live production security or human/UAT completion. External evidence blockers are listed at the end.

## Coverage matrix

| Area | Evidence | Result |
|---|---|---|
| Login, password, reset, lockout, disabled users | `test:auth-password-lifecycle`, `e2e-auth-lockout`, `e2e-auth-password-flow` | PASS |
| Sessions, expiry, logout, cookie flags, open redirect | auth/session tests and `safeRedirectTarget` contract | PASS |
| CSRF, Fetch Metadata, request size/content type | `test:request-security`, `test:lab-security` | PASS |
| XSS and injection | schema bounds, output escaping contracts, LIKE escaping, hostile live search | PASS |
| SQL usage | parameterized query guards and `test:api-contract` / `test:security-hygiene` | PASS |
| IDOR / horizontal access | task scopes, lab record scopes, notification/filter ownership, CAPA parent binding | PASS |
| Vertical access / RBAC | `test-security-rbac-privacy-100` plus existing lab/admin/findings/report suites | PASS |
| File upload / MIME / filename / executable bytes / size | `test:lab-security`, upload validators, attachment E2E | PASS |
| Exports and reports | task/search/lab/report E2E suites, role-scoped report authorization | PASS |
| AI endpoints | AI feature/lab suites, consent, per-user limiter, record scopes, safe provider errors | PASS |
| Admin, backup, audit, signatures | admin-users, backup, audit-integrity, esignature suites | PASS |
| Security headers / CSP / CORS | middleware contract and `test:request-security` / `test:security-hygiene` | PASS |
| Error leakage / sensitive logs / tracked secrets | `test:observability`, `test:security-hygiene`, source scan | PASS locally |

## RBAC matrix

The executable matrix tests every role-only sensitive gate across `employee`, `supervisor`, `manager`, and `admin`, with anonymous access denied by the session/API wall. It covers allowed and denied decisions for dashboard, user administration, templates, delete requests, assignment, workload, findings/CAPA, lab tests, products, templates, equipment, calibration, reports, exports, audit, management dashboards, change requests, and AI assist.

Entity-level segregation is tested for:

- laboratory test: tester cannot review/approve their own record; reviewer cannot approve the same record; terminal records are immutable;
- controlled document and document version: author/owner cannot review or approve their own version;
- lab template: author cannot approve their own version;
- change request: requester cannot approve their own request;
- task/finding/CAPA/evidence: ownership and parent-entity binding are checked server-side;
- signatures: approval re-verifies the current password and is rate-limited/audited.

## Remediation recorded in this task

- Removed duplicate exported permission declarations for `canManageTemplates` and `canOverrideEvidenceGate`; callers use the `PERMISSIONS` object.
- Bound CAPA evidence to the parent Finding in both the API contract and the operation layer. A mismatched CAPA/Finding pair returns the same safe “target not found” domain error and creates no row.
- Inaccessible task/Finding detail, attachment, PDF, comment, and AI contexts use a not-found surface where revealing the record would create an enumeration oracle. Role-only denials on an already-visible resource remain explicit permission denials.
- Replaced the remaining direct management/report role gates with canonical predicates from `src/lib/permissions.ts`; role scope remains data scoping, not a second permission source.
- Added `scripts/test-security-rbac-privacy-100.mjs` and registered it in the canonical test manifest.

## Executed results

- All registered local `test:*` unit/integration/contract scripts: **69/69 PASS**.
- `test-security-rbac-privacy-100`: PASS; `test-lab-security`: **66/66**; `test-request-security`: **56/56**; deployment contract: **22/22**.
- `astro check`: **0 errors / 0 warnings / 0 hints**; production build: PASS, both executed before the final test-expectation-only E2E edits.
- Acceptance execution verified the non-discovery behavior for foreign task PDFs and Findings, then exposed two stale 403 expectations in `e2e-findings`; those expectations were corrected to 404. The requested final re-run was intentionally skipped by the user, so there is no final full-acceptance claim for this working tree.

## Reproducible checks

| Command | Expected evidence |
|---|---|
| `node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-security-rbac-privacy-100.mjs` | RBAC matrix + canonical-source scan PASS |
| `node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-lab-security.mjs` | 66 checks PASS, including CAPA/Finding IDOR regression |
| `node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-request-security.mjs` | 56 checks PASS |
| `pnpm test:manifest` | canonical registry has no drift |
| `pnpm test:security-hygiene` | no tracked DB/env/private-key material or sensitive logging |
| `pnpm typecheck` | zero type errors/warnings |
| `NODE_ENV=production pnpm build` | production build completes |

## Explicit blockers outside local automation

- **Credential rotation blocker:** `.claude/settings.local.json` contains a local third-party Anthropic credential configuration previously recorded by the project mind. No revoke/rotation evidence exists in this task. Treat the credential as exposed until the human owner revokes and rotates it, then records provider-side evidence. The secret value is intentionally not reproduced here.
- **Live deployment blocker:** no staging/production deployment, live header capture, or production database access was authorized or performed.
- **Human validation blocker:** real employee/supervisor/manager/admin UAT and independent VoiceOver/NVDA/manual security review remain required; automated tests are not substituted for them.
- **Final acceptance rerun:** intentionally skipped at user direction after correcting the two stale E2E status expectations. Run `NODE_ENV=production pnpm e2e:acceptance` before release to record final browser acceptance evidence.

No commit, push, deploy, or external credential mutation was performed.
