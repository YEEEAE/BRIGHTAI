# PROMPT 03 — SECURITY, IAM, SECRETS & ADVERSARIAL HARDENING EVIDENCE

**Task:** `QC-REMEDIATION-003`  
**Date:** `2026-09-02`  
**Target:** `apps/qc-task-manager`  
**Status:** `PARTIAL` — local security acceptance passed; browser/UAT evidence remains outstanding.

## Implemented controls

- `src/lib/permissions.ts` remains the single role/capability authority; architecture and RBAC privacy guards pass.
- Production startup rejects configured `SESSION_SECRET`/`JWT_SECRET` development fallbacks without logging their values.
- Production seeding rejects `QC_SEED_MUST_CHANGE_PASSWORD=0` and the default `admin123`; seeded accounts remain forced through first-login password change.
- Upload validation rejects SVG, executable markers, active-content/polyglot markers, mismatched MIME types, and invalid magic bytes before BLOB insertion.
- Logout deletes the opaque server-side session row immediately; password changes invalidate every other session; cookies remain HttpOnly/SameSite=Lax and secure on HTTPS.

## Verification

- `pnpm run test:security-adversarial` ✅ — 9 checks: bcrypt `$2a$/$2b$` cost 10, malicious SVG rejection, no unauthorized attachment, polyglot rejection, Employee `/api/admin/backup` → 403, no unauthorized mutation, logout revocation, production fallback rejection, and production fixture opt-out rejection.
- `pnpm run test:security-hygiene` ✅ — tracked secret/database/environment-file hygiene passed.
- `pnpm run test:security-rbac-privacy-100` ✅ — role matrix, segregation, canonical permission source, API guards.
- `pnpm run test:architecture` ✅ — 115 file routes, 25 middleware routes, 6 guards; no architectural permission leaks.
- `pnpm run test:auth-password-lifecycle` ✅ — 23/23.
- `pnpm run test:request-security` ✅ — 56/56.
- `pnpm run typecheck` ✅ — 0 errors, 0 warnings, 0 hints.
- `NODE_ENV=production pnpm run build` ✅.

## Acceptance matrix

| Criterion | Result | Evidence |
|---|---|---|
| AC-01 Single permission authority | PASS | architecture + RBAC guards |
| AC-02 IDOR / privilege boundary | PASS locally | RBAC matrix + Employee admin backup adversarial check; full browser matrix pending |
| AC-03 Attachment magic bytes and malicious upload defense | PASS locally | shared validator + adversarial suite |
| AC-04 Session revocation | PASS locally | logout row deletion + password lifecycle suite |
| AC-05 Production development-secret enforcement | PASS locally | production import/seed negative probes |
| AC-06 Evidence file | PASS | this file |

## Remaining external evidence

- Required browser E2E for login, session-expiry dialog, and re-authentication was not rerun in this task.
- VoiceOver/NVDA and production secret-provider rotation/revocation evidence require an operator and live environment.
- Full 76-unit / 30-E2E regression chain was not rerun after this focused security change; existing latest baseline was green before PROMPT-03.

No commit, push, or deployment was performed.
