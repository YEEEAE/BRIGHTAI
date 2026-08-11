# Security Policy — QC Task Manager

## Scope and threat model

QC Task Manager is an internal, server-rendered application that stores task
records and evidence BLOBs. The primary assets are user accounts, server-side
sessions, task metadata, comments, activity history, and uploaded evidence.

The application defends against unauthenticated access, stolen or replayed
browser requests, cross-site request forgery, insecure direct object reference
(IDOR), SQL injection, malicious uploads, path traversal, credential stuffing,
session fixation/replay, clickjacking, MIME confusion, accidental secret
publication, and sensitive-data logging. It does not replace endpoint malware
scanning, host hardening, or a managed web application firewall.

## Security controls

- Every non-public page is protected in middleware and resolves the session
  from the server-side `sessions` table. API handlers repeat that check.
- Task operations use role and task ownership/visibility rules on the server;
  client-side UI permissions are never authoritative.
- State-changing requests require same-origin CSRF validation in addition to
  Astro's built-in CSRF handling.
- Session cookies are `HttpOnly`, `SameSite=Lax`, path-scoped and `Secure` in
  production. Sessions are opaque UUID tokens, expire after 12 hours and are
  deleted from the database at logout and expiry.
- Login returns a generic error for bad, inactive, locked and unknown accounts.
  Failed attempts are account-locked after five failures and rate-limited per
  source IP over the same ten-minute window.
- SQL values are parameterized with `better-sqlite3` prepared statements.
  Dynamic SQL fragments are fixed allowlists, never user-provided identifiers.
- Inputs are constrained with Zod and domain validation; route IDs are positive
  integers and redirect targets are same-origin paths only.
- Uploads are restricted by sanitized filename, extension, declared MIME type,
  maximum size (10 MiB) and, for evidence formats, magic bytes. File size is
  checked before BLOB allocation/insertion. Files are served as attachments
  with sanitized `Content-Disposition` names and private/no-store caching.
- Responses use CSP, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `X-Frame-Options: DENY` / CSP `frame-ancestors 'none'`.
- Passwords, hashes, cookies, session tokens, raw upload bytes and file
  contents must never be returned or logged. Run the security hygiene gate
  before release.

## Production deployment requirements

1. Serve only over HTTPS and redirect HTTP at the reverse proxy. Set
   `NODE_ENV=production`; do not terminate TLS directly in the Astro process.
2. Set a trusted proxy configuration so `context.clientAddress` represents the
   real client IP, not a spoofable forwarded header. Rate limiting is weaker
   without this.
3. Store `QC_DATABASE_PATH` outside the deployed source tree with restrictive
   filesystem permissions. Encrypt volume and backups at rest; do not expose
   SQLite files through static hosting, downloads, logs, or container images.
4. Keep all secrets in the deployment secret manager/environment, never in
   source, database seed files, issue comments, screenshots or logs. Rotate a
   secret immediately after suspected exposure.
5. Preserve the response headers at the proxy/CDN. Do not weaken CSP with
   `unsafe-eval`, broad origins, or framing exceptions without a documented
   security review.
6. Enforce upload request-body limits at the reverse proxy at or below 10 MiB
   plus multipart overhead. Deploy malware scanning/quarantine where uploaded
   evidence crosses a trust boundary.
7. Run migrations and backups with least-privileged filesystem users. Test
   restores periodically; backup files require the same encryption/access
   controls as the live database.
8. Patch Node.js, Astro, bcryptjs, better-sqlite3 and the host OS on a defined
   cadence; subscribe to their security advisories.

## Release checks

Run from the repository root:

```bash
pnpm --filter @brightai/qc-task-manager typecheck
pnpm --filter @brightai/qc-task-manager test
node apps/qc-task-manager/scripts/verify-security-hygiene.mjs
pnpm --filter @brightai/qc-task-manager build
```

Review `git status` and `git ls-files` for `.env` and database files before a
release. The hygiene gate permits only committed `.env.example` templates.

## Reporting a vulnerability

Do not open a public issue containing proof-of-concept credentials, session
tokens, database files or customer evidence. Report privately to the project
owner with affected route, impact, minimal reproduction and contact details.
The owner should acknowledge, triage, patch, validate and rotate exposed
credentials before public disclosure.
