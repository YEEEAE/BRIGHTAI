# ROUTE-COVERAGE — QC-POST-IMPLEMENTATION-MASTER-AUDIT-022

Baseline: HEAD `b51504b7` · generated from current `src/pages` + `src/middleware.ts` · verified by `pnpm test:route-manifest` (exit 0): **114 file routes · 25 middleware short-circuit routes · 6 middleware guards**.

## Totals

| Class | Count |
|---|---:|
| PAGE routes (.astro) | 76 |
| API GET routes | 12 |
| API MUTATION routes (25 POST + 1 PATCH) | 26 |
| **Total file routes** | **114** |
| Middleware-dispatched form POSTs on .astro URLs | 25 (+ `/login`, `/account/security` = 27 form-POST surfaces) |
| Middleware role/prefix guards | 6 (auth wall + 5 prefix gates) |

## PAGE routes (76)

- Public/auth: `/`, `/login`, 404 — 3
- Root app: `/dashboard`, `/dashboard/drilldown`, `/findings`, `/findings/[id]`, `/notifications`, `/reports`, `/search`, `/tasks/[id]` — 8
- `/account/security` — 1
- `/admin/*` (8): index, settings, system-health, templates (index/new/[id]/edit), users (index/audit)
- `/employee/*` (2), `/manager/*` (4), `/supervisor/*` (2)
- `/lab/*` (48): index, audit, calendar, data-quality, management, notifications, reports, search; acknowledgements ×2; calibration ×5; change-requests ×3; documents ×6; equipment ×6; maintenance print ×1; products ×4; retests ×3; saved-views ×1; templates ×4; tests ×5

## API GET (12) — all `requireApiUser` except `/api/health` (deliberately public)

`/api/health` · `/api/export/tasks.csv` · `/api/export/search.csv` · `/api/export/search.xlsx` · `/api/export/tasks/pdf/[id]` · `/api/tasks/suggestions` ⚠ P3-012 (dead: zero UI references) · `/api/tasks/[id]/attachments/[attachmentId]` · `/api/lab/tests/export.csv` · `/api/lab/tests/export.xlsx` · `/api/lab/search-suggest` · `/api/reports/[reportType].[format]` · `/api/reports/audit`

## API MUTATION (26) — every route verified to call `requireCsrf` + `requireApiUser` (36/36 API files security-reviewed)

POST `/logout` · POST `/admin/templates/api` · POST `/admin/users/api` · POST `/manager/requests/api` · POST `/api/admin/backup` · POST `/api/ai/[feature]` (+AI rate limit) · POST+PATCH `/api/findings*` (5) · POST `/api/lab/change-requests/[id]/review` · POST `/api/lab/change-requests/[id]/withdraw` · POST `/api/lab/equipment/[id]/maintenance` · POST `/api/lab/saved-views` · POST `/api/lab/tests/[id]/review` · POST `/api/notifications/[id]/read` · POST `/api/notifications/read-all` · POST `/api/tasks/[id]/attachments` · POST `/api/tasks/[id]/{cancel,close,comment,delete-request,reopen,update}` (6)

## Middleware-dispatched form POSTs (27 surfaces)

`/login`, `/account/security` (CSRF in middleware) + 25 patterns dispatched to lib handlers that self-apply `requireCsrf` + permission re-checks: `/lab/tests/new`, `/lab/tests/[id]/{edit,void,links,links/unlink}`, `/lab/products/new`, `/lab/products/[id]/{edit,archive,restore}`, `/lab/templates/new`, `/lab/templates/[id]/edit`, `/lab/equipment/new`, `/lab/equipment/[id]/{edit,…}`, `/lab/calibration/new`, `/lab/calibration/[id]/edit`, `/lab/retests/new`, `/lab/change-requests/new`, `/lab/change-requests/[id]/{approve,reject}`, `/lab/documents/new`, `/lab/documents/[id]/{edit,workflow}`, `/lab/acknowledgements/{assign,[id]/acknowledge}`, `/manager/new`, `/supervisor/new`, `/employee/new`.

## Middleware guards (6)

1. Auth wall (all non-public paths → `/login?redirect=`)
2. `/dashboard` → supervisor+ (employee denied — RULE #1)
3. `/admin*` → admin only
4. `/manager*` → manager+admin
5. `/supervisor*` → supervisor+
6. `must_change_password` gate (only `/account/security` + `/logout` bypass) — plus method guard (405 for unsafe methods on .astro) and request-security layer (12MB cap, content-type allowlist, rate limits).

## UI → route reconciliation

- All 16 Navbar hrefs resolve to real pages (verified by source review + ui-consistency guard "dead nav routes" check).
- All `IMPLEMENTED_LAB_ROUTES` map to real page files (ui-consistency guard).
- `pnpm test:route-manifest` verifies required report routes and internal `href/action` references — exit 0.
- **Dead route found: `GET /api/tasks/suggestions`** (P3-012) — no UI caller; endpoint itself is auth-protected (no security exposure).
- No orphan API found beyond the above; no missing routes for UI calls; no verb mismatches detected; 403/404 behavior consistent (scope violations → 404, role denial → flash+redirect to role home).

## Gate evidence (this audit run, 2026-08-28)

| Command | Result |
|---|---|
| `pnpm test:route-manifest` | ✅ exit 0 — 114 file routes / 25 middleware / 6 guards |
| `pnpm test:manifest` | ✅ exit 0 — 60 canonical suites / 28 canonical E2E |
