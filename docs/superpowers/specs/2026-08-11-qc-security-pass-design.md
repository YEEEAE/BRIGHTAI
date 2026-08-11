# QC Task Manager Security Pass Design

## Goal

Harden the server-rendered QC Task Manager so every protected page and API
route authenticates the request on the server, authorizes task access, accepts
only validated inputs, and avoids leaking sensitive data.

## Scope

This pass covers `apps/qc-task-manager`. It does not change the public
marketing site or the Kernel demo APIs, which have separate authentication and
deployment models.

## Architecture

### Request security boundary

`middleware.ts` remains the outer guard for all pages and static responses. It
will add a compatible Content-Security-Policy and consistently attach frame,
MIME-sniffing, and referrer headers. State-changing routes retain Astro's
same-origin CSRF check and will additionally use one application CSRF verifier
for API requests, based on Origin plus a per-session CSRF token.

Each API handler must call a shared `requireApiUser()` helper instead of
trusting middleware locals. The helper resolves the opaque session token from
the server-side session table and rejects absent, expired, inactive, or invalid
sessions. It returns no user credential fields.

### Authorization boundary

A shared task-access helper will load a task through a prepared statement and
apply the existing role policy: employees see only tasks they created or are
assigned; supervisors/managers/admins retain their documented wider access.
Attachment download and every task mutation will use the helper before reading
or changing a task, attachment, comment, checklist, or delete request.

### Input and file boundary

All route parameters, query fields and forms are parsed with Zod. File input is
checked in this order: filename normalization, extension and MIME allowlist,
byte size before allocating/persisting a BLOB, then signature verification for
formats with stable magic bytes. Display and Content-Disposition use the
sanitized filename only; no path-derived filesystem access is permitted.

### Authentication boundary

Login has a uniform external error for unknown, disabled, locked and incorrect
credentials. Account lockout stays server-side and an IP rate limiter is added
to prevent distributed username guessing. Sessions expire server-side, cookies
are Secure/HttpOnly/SameSite in production, and logout deletes the persisted
session as well as clearing the browser cookie.

### Verification and operations

Security tests will exercise anonymous access, missing/invalid CSRF, task
IDOR, malformed identifiers, upload limits/type checks, generic login errors,
rate limits, logout/session expiry, response redaction, headers and audit
log hygiene. Repository checks will reject tracked database files and likely
secrets. `SECURITY.md` will define the threat model, security controls and
production deployment requirements.

## Error Handling

Unauthenticated API calls receive `401`; authenticated but unauthorized calls
receive `403`; invalid request shape receives `400`; CSRF failure receives
`403`; rate limiting receives `429`. Login failures always redirect with the
same generic indication. Error logs contain a request-safe category and error
message only, never passwords, cookies, tokens, raw uploads or file content.

## Non-goals

- No new authentication provider or database engine.
- No changes to user-facing role policy beyond enforcing its existing rules.
- No content inspection/antivirus engine; deployment requirements document
  malware scanning when it is available in the hosting environment.
