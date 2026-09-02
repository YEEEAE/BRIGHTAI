# PROMPT 03 — SECURITY, IAM, SECRETS & ADVERSARIAL HARDENING

TASK ID:
QC-REMEDIATION-003

PRIORITY:
P1 / P2

ROLE:
Principal Application Security Architect, IAM Engineer, Penetration Tester.

DEPENDS ON:
GATE A (PROMPT-01).

BLOCKS:
PROMPT-04, GATE B.

SOURCE FINDINGS:
- P2-5: Test credentials rotation and production secret enforcement (EP-H14).
- Audit Sections 3, 6, 8, 21, 36, 70, 71, 72, 81.

AFFECTED DOMAINS:
Domain 3 (Security Engineering), Domain 6 (Authentication / IAM / RBAC), Domain 21 (Privacy Engineering), Domain 36 (File / Attachment Security), Domain 70 (Security UX), Domain 71 (Privacy UX), Domain 72 (Session Expiry UX), Domain 81 (Secrets Management).

MISSION:
Harden application security defenses: enforce single permission authority in `src/lib/permissions.ts`, enforce session invalidation on logout and password change, implement secure password rotation prompts for default accounts, protect against IDOR on all task/finding/lab endpoints, sanitize SVG and file upload mime-types, and ensure zero plain-text secrets exist in the repository.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read finding P2-5 and Security deep dive (Section 8)
* inspect `apps/qc-task-manager/src/lib/permissions.ts`
* inspect `apps/qc-task-manager/src/lib/auth.ts`
* inspect `apps/qc-task-manager/SECURITY.md`
* inspect secret scanning output.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/lib/permissions.ts`
- `apps/qc-task-manager/src/lib/auth.ts`
- `apps/qc-task-manager/src/middleware/index.ts`
- `apps/qc-task-manager/src/pages/api/tasks/[id]/attachments/index.ts`
- `apps/qc-task-manager/scripts/test-security-hygiene.mjs`
- `apps/qc-task-manager/scripts/test-security-rbac-privacy-100.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/better-writing/SKILL.md`

REQUIREMENTS:
1. Single Authority Enforcement:
   - Ensure every page, API route, and middleware references `src/lib/permissions.ts` for role ranks, capability checks, and route guards.
   - Run `pnpm run test:architecture` to verify zero duplicated permission definitions.
2. Adversarial IDOR Protection:
   - Verify that non-manager users cannot access or mutate tasks, findings, or lab calibrations belonging to other units unless explicitly authorized by policy.
   - Add automated test attempting vertical privilege escalation: Employee attempting to access `/admin/users/api` must receive 403 Forbidden.
3. Attachment Upload Security:
   - In attachment upload endpoint, strictly validate file magic bytes (magic number check for PNG, JPEG, PDF). Reject executable files, polyglot files, and unsanitized SVGs containing script tags.
4. Default Secret Rotation & Policy:
   - Add warning/block in production build if `SESSION_SECRET` or `JWT_SECRET` equals known development fallback values.
   - Enforce mandatory password change prompt on initial login for seeded default users.
5. Session Expiry & Revocation:
   - Ensure active sessions in SQLite `sessions` table are immediately deleted upon logout.

NON-NEGOTIABLE BUSINESS RULES:
- Never log user passwords or session tokens in plain text.
- Passwords must be hashed using bcrypt (cost factor >= 10).
- Session cookies must be `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

IMPLEMENTATION REQUIREMENTS:
- Strict TypeScript contracts.
- Rate limiting on login attempts (5 attempts -> 10-minute lockout).

DO NOT:
- Do NOT disable CSRF checks in Astro.
- Do NOT allow file uploads to be served with executable MIME types.
- Do NOT allow client-side role checks to override server permissions.

TEST-FIRST / DEBUGGING REQUIREMENT:
Create an automated test simulating:
1. Malicious SVG upload containing `<script>alert(1)</script>`.
2. Direct API call to `/api/admin/backup` with Employee cookie.
Both must be rejected with 400/403.

TEST QUALITY REQUIREMENT:
Assert HTTP status codes AND verify that no unauthorized records are created in the database.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:security-hygiene`
- `pnpm run test:security-rbac-privacy-100`
- `pnpm run test:architecture`
- New adversarial security test suite.

REQUIRED BROWSER TESTS:
- E2E login, session expiration dialog, and re-authentication flow.

REQUIRED DATABASE TESTS:
- Verify password hash column starts with `$2a$` or `$2b$`.

REQUIRED SECURITY TESTS:
- SQL injection fuzzing on search inputs (`' OR 1=1 --`).
- XSS fuzzing on task descriptions (`<img src=x onerror=alert(1)>`).

REQUIRED ACCESSIBILITY TESTS:
- Error messages in login and security dialogs must have `role="alert"`.

REQUIRED ROLE TESTS:
- Full matrix: Employee, Supervisor, Manager, Admin across all 39 API routes.

REQUIRED NEGATIVE TESTS:
- Expired session cookie -> redirected to `/login?expired=1`.
- Locked account -> returns HTTP 429 with lockout timer.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Single permission authority verified with zero architectural leaks.
- AC-02: IDOR tests pass across all protected resources.
- AC-03: Attachment upload validates magic bytes and blocks malicious uploads.
- AC-04: Session revocation on logout is verified in database.
- AC-05: Production environment fails to start if development secrets are detected.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-03-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-03-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:security-hygiene` and `pnpm run test:security-rbac-privacy-100`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...
