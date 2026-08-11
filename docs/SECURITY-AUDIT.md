# Security Hardening Audit — BRIGHTAI QC Task Manager

**Date:** 2026-08-11  
**Scope:** `apps/qc-task-manager` plus the server-side Groq provider contract  
**Business-rule posture:** Existing role, task lifecycle, field-locking, checklist, dependency, evidence, and deletion rules were preserved.

## Status legend

- **PASS** — control existed and was verified.
- **FIXED** — gap was remediated in this change and covered by a regression check or static evidence.
- **FAIL** — unsafe condition remains.
- **RISK** — requires operational action, deployment configuration, or history cleanup outside this local code change.

## Findings

| Area | Status | Evidence / control | Remaining risk or action |
|---|---|---|---|
| Session fixation / rotation | FIXED | Sessions are opaque server-side rows; login creates a fresh 256-bit random token; the old cookie is never trusted as an authorization payload. | Existing sessions are intentionally not globally revoked on every login to preserve current multi-session behavior. |
| Expiration | PASS | 12-hour cookie max-age and server-side `expires_at` validation; expired rows are deleted on read and during login cleanup. | Confirm production clock synchronization. |
| Logout | PASS | Logout deletes the server-side session and clears the HttpOnly cookie; CSRF is required. | None identified locally. |
| Password handling | FIXED | bcrypt hashes only; password hashes/values are not returned or logged; unknown users use a dummy bcrypt compare; production fresh seeding now fails without `ADMIN_DEFAULT_PASSWORD`. | Any database seeded previously with the development default must have all seeded passwords reset. |
| Login attempts / lockout | PASS | Five consecutive account failures lock for 10 minutes; 20 failed attempts per IP in the same window; generic failure response prevents enumeration. | The IP limiter is process-local; use an upstream shared limiter for multi-instance production. |
| Roles: Admin / Manager / Supervisor / Employee | PASS | Central `PERMISSIONS`, route guards, server-side actor checks, assignment scope, and rank checks. | No live production authorization test was possible from this sandbox. |
| Horizontal privilege escalation / IDOR | PASS | Employee task scope is checked server-side for task details, comments, attachments, activity, evidence, delete requests, PDF exports, search results, and CSV/XLSX exports. Attachment queries bind both `attachmentId` and `taskId`. | Run the acceptance suite from a runtime that permits local listening. |
| Vertical privilege escalation | PASS | Admin-only user management; manager/admin deletion review, cancel, reopen, and overrides; supervisor assignment restricted to active employees. | No independent Finding/CAPA/Report resource tables exist; their current representation is task metadata/activity and was assessed through the same task authorization boundary. |
| Server-side field locking | PASS | `applyTaskUpdate` re-checks the current task and role. Employee locked fields include `title`, `description`, `department`, `assigned_to`, `due_date`, `priority`, `recurrence`, `recurrence_end_date`, `checklist`, and `dependencies`. UI state is not trusted. | None identified in the reviewed mutation path. |
| Request validation | PASS | Zod validation for form inputs and positive route IDs; parameterized SQL; safe redirect validation. | Some legacy form handlers use domain validators directly rather than one shared schema; they remain server-side validated. |
| CSRF | PASS | Same-origin `Origin` check on login, logout, API POSTs, admin user actions, and deletion review. | Requires correct `Origin` handling through the production reverse proxy. |
| Body limits / Content-Type | FIXED | Middleware rejects unsupported mutation content types and `Content-Length` above 12 MiB before FormData parsing. | Chunked requests still depend on the runtime parser/proxy limit; configure an upstream 12 MiB or lower limit. |
| API rate limiting | FIXED | Per-process 120 mutations/minute/path backstop; login has stricter account/IP controls. | Use a shared Redis/edge limiter for multiple production instances. |
| Secure headers | FIXED | CSP, frame denial, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP, production HSTS, and no-store on sensitive downloads/API responses. | CSP still contains `style-src 'unsafe-inline'` for the existing UI; removal is a separate UI/CSP migration. |
| File extension / MIME | PASS | Allowlist requires both normalized extension and declared MIME. Executable extensions are not allowed. | MIME is client-declared and therefore never treated as sufficient alone. |
| Magic bytes / executable files | FIXED | Generic uploads now verify signatures for PDF/images/Office/ZIP formats, reject PE/ELF/Mach-O/shebang signatures, and reject binary NUL content in text extensions. Evidence already had strict signatures. | Deep archive inspection and antivirus scanning are not implemented. |
| File size / filename / path traversal | PASS | 10 MiB application limit before allocation, basename extraction, control-character removal, leading-dot removal, bounded download filename, and no filesystem upload path. | Keep reverse-proxy upload limits aligned. |
| File hash | PASS | SHA-256 is calculated and persisted in `file_hash` for uploaded BLOBs. | Hash is integrity metadata, not malware scanning. |
| Secret source/frontend/log safety | FIXED / RISK | Groq reads `process.env.GROQ_API_KEY` in the server-only Dashboard provider; `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`; no key is placed in React props, Astro data, `public/`, storage, or client source. Current tracked report/config values were redacted. | Local `.env` contains secret material and duplicate `GROQ_API_KEY` entries; rotate/revoke every exposed provider key and recreate a single local value. Never paste values into tickets or logs. |
| Git history | RISK | Prior committed reports/config snapshots contained provider keys; current files were redacted, but history was not rewritten. | Treat all exposed keys as compromised, revoke/rotate them at each provider, then use an approved history rewrite and force-push process if repository policy permits. No push or history rewrite was performed here. |
| Production operational verification | FAIL | This handoff verified local code, local HTTPS-aware cookie behavior, isolated SQLite E2E, and build artifacts only. | Run a production-like HTTPS deployment check for proxy limits, secure cookies, shared rate limiting, secret injection, backups, and log redaction before release. |

## Groq contract

- Environment variables: `GROQ_API_KEY` and `GROQ_MODEL=llama-3.3-70b-versatile` are documented in both environment examples.
- The provider reads the key only at server runtime.
- The client receives provider status/model metadata, never the key.
- The QC Task Manager itself has no direct client-side Groq call.

## Requested object coverage

| Requested object | Coverage |
|---|---|
| Task | Detail, mutation, export, attachment, comment, delete-request checks. |
| Comment | Task-scoped insert and employee task authorization. |
| Evidence | Strict evidence allowlist, magic bytes, hash, task-scoped download. |
| Finding / CAPA / Reports | No independent tables/routes in this application; current QC metadata and generated task reports inherit task authorization. |
| Users | Admin-only management plus self-account safety guards. |
| Audit logs | Task activity is only loaded after task authorization; user-management actions avoid password/hash logging. |

## Verification commands

The required commands are run at handoff and their exact result is recorded in the final response and the project brain. Existing hints and environment blocks are not promoted to PASS.

Fresh handoff verification on 2026-08-11:

- `pnpm typecheck` — **PASS**: all workspaces completed; QC reports 0 errors and 11 existing hints.
- `pnpm test` — **PASS**: 16 chat-session + 29 CSRF + 38 PII tests passed.
- `pnpm build` — **PASS**: completed; 269 HTML files and 258 public sitemap URLs. Existing route-collision/Vite warnings remain documented outside this hardening change.
- `pnpm --filter @brightai/qc-task-manager test` — **PASS**: 240 domain checks plus migration and DB-backed lockout/notification checks passed.
- `pnpm e2e:acceptance` — **PASS**: admin-users 49/49, auth-lockout 44/44, task-shared 196/196, delete-request 39/39, dashboard 45/45, backup 12/12, and restart persistence create/verify passed.
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` — **PASS**. Git fsmonitor emitted an environment warning but the hygiene check passed.
- `git diff --check` — **PASS**.

The E2E runner first exposed a CSP/hydration regression. It was fixed with explicit CSP hashes for the known Astro hydration scripts while keeping `script-src` free of `unsafe-inline`; the final run verified the approve/reject dialogs and all listed workflows.

## Handoff risks

- **RISK**: historical provider keys remain in Git history and are compromised until revoked/rotated; history was not rewritten or pushed.
- **RISK**: the local `.env` has duplicate Groq entries; recreate it with one rotated `GROQ_API_KEY` value locally.
- **RISK**: `style-src 'unsafe-inline'` remains for the existing UI and needs a separate style nonce/hash migration.
- **RISK**: production HTTPS, reverse-proxy body limits, shared rate limiting, and deployment secret rotation need live operational verification.

No commit or push was performed; the user owns the commit and release decision.
