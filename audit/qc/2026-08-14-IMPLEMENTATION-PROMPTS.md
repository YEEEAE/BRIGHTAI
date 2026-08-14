# برومبتات تنفيذية — إغلاق فجوات تدقيق QC Task Manager (2026-08-14)

> **المصدر:** `audit/qc/2026-08-14-EVIDENCE-AUDIT.md` — القرار NO-GO إنتاجيًا / Conditional GO محليًا.
> **طريقة الاستخدام:** نفّذ البرومبتات **بالترتيب** (P0 → P1 → P2/P3). كل برومبت مستقل وقابل للتحقق، ولا تنتقل للتالي قبل نجاح معايير القبول.
> **قواعد صارمة لكل برومبت:** لا commit ولا push (المستخدم يلتزم)، لا تعديل `.env*`، لا تكتب أسرار، لا تلمس قواعد بيانات حقيقية (استخدم `QC_DATABASE_PATH` مؤقتًا في الاختبارات)، ولا تغيّر `.github/workflows/`.
> **المرجع التقني:** التطبيق Astro SSR (`output: 'server'` + `@astrojs/node` standalone) داخل `apps/qc-task-manager/`، التشغيل عبر `pnpm --filter @brightai/qc-task-manager`.

---

## 📌 PROMPT 01 (P0 — XS) — Health endpoint

```text
Add a health check endpoint to the QC Task Manager app at apps/qc-task-manager.

Context: the app has no health route today; render.yaml cannot get readiness.

Implement:
1. Create src/pages/api/health.ts (GET only) returning 200 JSON:
   { ok: true, service: 'qc-task-manager', status: 'healthy', schemaVersion: <int> }
   - schemaVersion must come from the real schema_migrations table (latest applied version).
   - If the database is unreachable or migrations are missing, return 503
     { ok: false, status: 'unhealthy', reason: <short safe message> }.
   - The route must NOT require authentication (public, like /login) and must
     never log or expose file paths, env values, or secrets.
2. Keep the route consistent with existing api-security conventions:
   - Do not apply requireApiUser/CSRF (GET, public, no state change).
3. Update apps/qc-task-manager/docs/DEPLOYMENT.md: document the endpoint as the
   Render healthCheckPath.

Acceptance criteria:
- pnpm --filter @brightai/qc-task-manager typecheck passes (0 errors).
- NODE_ENV=production pnpm --filter @brightai/qc-task-manager build passes.
- With a temp DB (QC_DATABASE_PATH=/tmp/health-test.db) the built server answers
  GET /api/health with 200 and a numeric schemaVersion; with a missing/moved DB
  file it answers 503 without crashing.
- No secrets or absolute paths appear in the response body.
```

---

## 📌 PROMPT 02 (P0 — M) — تعريف خدمة QC في render.yaml

```text
Define the QC Task Manager as a second service in /render.yaml (the repository
root). Do NOT touch the existing brightai-site service.

Requirements:
1. Add a service block:
   - type: web, runtime: node (Node 22 LTS, matching root engines).
   - name: qc-task-manager.
   - buildCommand: pnpm install && pnpm --filter @brightai/qc-task-manager build
     (keep it minimal and consistent with the monorepo's existing build style;
     do not break brightai-site's buildCommand).
   - startCommand: pnpm --filter @brightai/qc-task-manager start
     (the app's start script runs node ./dist/server/entry.mjs).
   - healthCheckPath: /api/health (after PROMPT 01 lands).
2. Persistent disk:
   - mountPath: /var/data
   - sizeGB: 1 (SQLite + backups for an internal tool).
3. envVars (names only, values come from the Render dashboard — never commit values):
   - QC_DATABASE_PATH=/var/data/qc_tasks.db
   - QC_BACKUP_DIR=/var/data/backups
   - NODE_ENV=production
   - GROQ_API_KEY (from Render secret)
   - ADMIN_DEFAULT_PASSWORD (from Render secret, used only for first seed)
   - SESSION_SECRET: do NOT add it unless PROMPT 10 (docs alignment) lands first.
4. Do NOT autoDeploy changes that could break the main site; keep the QC service
   opt-in per the project's no-push / user-commits workflow.

Acceptance criteria:
- render.yaml parses (yaml lint / manual review) and defines exactly 2 services.
- No env values, keys, or secrets are written to the file.
- The QC service definition references only existing scripts in apps/qc-task-manager/package.json.
- Document in apps/qc-task-manager/docs/DEPLOYMENT.md that deployment is owned by
  the user via the Render dashboard (no push from agents).
```

---

## 📌 PROMPT 03 (P0 — S) — Groq live smoke (بالموافقة الصريحة على تشغيل شبكة)

```text
Verify the Groq integration against the live provider once, with explicit user
approval to make ONE outbound network call. Read-only on everything else.

Steps:
1. Inspect scripts/test-ai-foundation.mjs and scripts/test-ai-features.mjs to
   find the mocked path and the real provider path (src/lib/ai/provider.ts +
   src/lib/ai/service.ts).
2. Add (do not commit) a focused smoke: one real completion for 'task-analysis'
   using a controlled task fixture in a temp DB (QC_DATABASE_PATH=/tmp/...).
   Use the GROQ_API_KEY from the environment ONLY via process.env (never print it).
3. Assert:
   - response parses with the existing Zod schemas (src/lib/ai/schemas.ts);
   - no raw key / Authorization header / prompt is stored in ai_audit_log;
   - redaction is applied to a fixture containing a Saudi mobile number and an
     email inside <untrusted_qc_data> (assert the raw values do not reach the
     audit row);
   - a 429 or 5xx from the provider maps to the existing safe error contract.
4. If the key is invalid/expired, report the failure — do NOT invent a pass.

Acceptance criteria:
- Exactly one live request was made; all assertions pass OR the failure is
  reported verbatim with the error class (never the raw response body).
- pnpm --filter @brightai/qc-task-manager test still passes (265/0) afterwards.
- Document the result in apps/qc-task-manager/docs/AI-ARCHITECTURE.md under a
  "Live verification" note with the date and outcome.
```

---

## 📌 PROMPT 04 (P1 — M) — CSP: إزالة `'unsafe-inline'` من style-src

```text
Remove 'unsafe-inline' from style-src in the QC app CSP without breaking Tailwind
or React islands.

Context: src/middleware.ts sets Content-Security-Policy with
"style-src 'self' 'unsafe-inline'". Tailwind purges CSS into external files, so
inline styles are not required at runtime (verify first).

Steps:
1. Audit where inline styles are actually emitted:
   - grep for style= attributes and <style> tags in src/ (including React islands
     and any dynamic style props).
   - Build with NODE_ENV=production and grep dist/ for inline style attributes
     that would be blocked.
2. Move any required static styles to external files or allowlist them via
   style-src hashes (compute SHA-256 of the exact inline block) — never blanket
   unsafe-inline.
3. Update the CSP header in src/middleware.ts to "style-src 'self'" (+ hashes if
   a small allowlist is genuinely needed).
4. Run the existing security verifiers and the full QC suite.

Acceptance criteria:
- grep of the final header shows no 'unsafe-inline' in style-src (or a comment
  documents an exceptional allowlist with the exact hash and reason).
- NODE_ENV=production pnpm build passes and dashboard/forms render with correct
  styles in the existing e2e suites (pnpm e2e:acceptance — at minimum
  e2e-dashboard + e2e-task-shared).
- node apps/qc-task-manager/scripts/verify-security-hygiene.mjs passes.
```

---

## 📌 PROMPT 05 (P1 — S) — إلزام ADMIN_DEFAULT_PASSWORD خارج localhost

```text
Prevent the QC app from booting with the default password when exposed beyond
localhost.

Context: seeding currently falls back to 'admin123' and prints a warning; the
login page displays the default credentials.

Implement:
1. In src/lib/seed.ts: if ADMIN_DEFAULT_PASSWORD is unset, seed only when
   NODE_ENV is not 'production'; in production, refuse to create/keep accounts
   with the default password (throw a clear startup error explaining the required
   env var). Keep local dev behavior unchanged (warning is fine).
2. In src/pages/login.astro: hide the "Seeded accounts — password admin123" block
   unless NODE_ENV !== 'production'.
3. Add/extend a unit check in scripts/test.mjs: production-mode seed with no
   ADMIN_DEFAULT_PASSWORD fails fast; with the var set it seeds the configured
   password.

Acceptance criteria:
- pnpm --filter @brightai/qc-task-manager test passes (265/0 + new checks).
- NODE_ENV=production + no ADMIN_DEFAULT_PASSWORD → startup refuses with a clear
  message (verify via a temp DB, not the real one).
- Login page in production build shows no default credentials.
```

---

## 📌 PROMPT 06 (P1/P2 — XS) — إصلاح تحذيرات CANTOPEN في backup-scheduler

```text
Stop the backup scheduler from logging SQLITE_CANTOPEN when the database file
does not exist (temp test DBs being deleted between suites).

Context: createBackup fails with "unable to open database file" (SQLITE_CANTOPEN)
during test runs when the temp DB was removed; tests still pass but the noise
misrepresents backup health.

Implement:
1. In src/lib/backup-scheduler.ts (and src/lib/backup.ts performBackup if needed):
   - before starting a scheduled/catch-up backup, stat the dbPath and skip
     (log a debug line, do not record a failure) when the file is absent.
2. Keep real failures (permission, disk full, corrupt) recorded as failures.
3. Add a unit check in scripts/test.mjs or scripts/test-db-rules.mjs: scheduler
   with a missing DB file produces no failure status and no CANTOPEN log.

Acceptance criteria:
- pnpm --filter @brightai/qc-task-manager test runs with zero SQLITE_CANTOPEN
  warnings.
- e2e-backup still passes (13 checks).
- SECURITY.md / DATABASE.md: document that the app assumes a single instance
  (in-process scheduler + in-memory rate limiting) — add a one-line note.
```

---

## 📌 PROMPT 07 (P1/P2 — S) — Accessibility pass أساسي

```text
Bring the QC app to the project's mandatory a11y baseline (WCAG 2.2 AA basics)
with automated verification.

Implement:
1. Skip link: first focusable element in src/layouts/BaseLayout.astro linking to
   the <main> element (visible on focus).
2. Reduced motion: add a global rule honoring prefers-reduced-motion for the
   islands' transitions/modals (wizard in TaskLifecycle.tsx, Navbar dropdown,
   TaskUpdatePanel) — disable non-essential animation.
3. Focus management: ensure modals/dropdowns restore focus on close and trap
   focus while open (reuse the existing patterns; verify with a keyboard test).
4. Contrast: spot-check the badge colors in src/lib/format.ts (status/priority
   text+background pairs) against AA 4.5:1 for normal text / 3:1 for large text;
   fix only pairs that fail, documenting the change.
5. If a lightweight axe pass is feasible locally (playwright + axe-core already
   present in the toolchain), run it on /login, /dashboard, /tasks/[id] and
   report violations; otherwise document that manual validation is still pending.

Acceptance criteria:
- All existing E2E suites still pass (pnpm e2e:acceptance).
- Keyboard: tab reaches the skip link first, Enter jumps to main; opening and
  closing the notification dropdown with Escape returns focus to the bell.
- No new contrast regressions in the changed files (list the before/after pairs).
```

---

## 📌 PROMPT 08 (P1/P2 — S) — Navbar @768px + توحيد حالة الرفض

```text
Fix the pre-existing navbar overflow at 768px and standardize deletion-request
indicators.

Context: brain.md QC-DASHBOARD-V2-001 documented navbar horizontal overflow at
768px (Sign out + username + bell) affecting every page.

Implement:
1. src/components/Navbar.tsx: make the right-side cluster (bell, username+role,
   sign out) wrap or collapse into the mobile menu at ~768px so document scroll
   width never exceeds viewport. Verify at 768 and 390.
2. Verify the same fix does not regress 1440px layout (existing visual checks in
   e2e-dashboard must stay green).
3. Unify the "Deletion requested" badge so it appears consistently on task rows
   in /employee, /manager, /supervisor and /tasks/[id] (single shared component
   if not already shared), and show rejected-request status with a reason tooltip
   where available.

Acceptance criteria:
- Playwright visual check: docWidth <= viewport at 390, 768, 1440 on at least
  /dashboard and /manager (extend the existing visual helper in e2e-dashboard or
  add a small dedicated script).
- e2e-delete-request (39) and e2e-task-shared (196) still pass.
- Badge renders on the three role lists for a pending request.
```

---

## 📌 PROMPT 09 (P2 — M) — توسيع acceptance + ربط PDF بالواجهة

```text
Extend the QC acceptance surface to the currently uncovered areas and surface
the PDF export in the UI.

Implement:
1. Add e2e suites wired into scripts/e2e-acceptance.mjs:
   - e2e-search.mjs: run apps/qc-task-manager/scripts/e2e-task-search.mjs (exists)
     — add it to the orchestrator with a temp DB and port.
   - e2e-findings.mjs: create a critical finding via API/page, walk RCA → CAPA →
     evidence → approval → closure, assert authorization (employee forbidden).
   - e2e-reports.mjs: open /reports, render each report type, download CSV and
     PDF for one task, assert non-empty payloads and role gating.
2. UI: add a "Download PDF" button on /tasks/[id] linking to the existing
   /api/export/tasks/pdf/[id] (already implemented, not surfaced).
3. Each new suite follows the existing harness conventions (QC_DB_PATH temp,
   PORT isolation, ok() counters, no production access).

Acceptance criteria:
- pnpm e2e:acceptance runs all suites (existing 386 + new) with 0 failed.
- PDF download returns 200 with application/pdf and a content-disposition
  filename for an authorized role, and 302/403 for an employee on a foreign task.
- No regressions in pnpm test (265/0).
```

---

## 📌 PROMPT 10 (P2/P3 — M) — Saved filters UI + توثيق + REPOSITORY-AUDIT.md

```text
Close the documentation and small-UI gaps from the audit.

Implement:
1. Saved filters UI on src/pages/search.astro backed by the existing
   saved_filters table: save current filter state (name), list saved filters,
   apply (restores URL params), delete own filter. Owner-only access server-side;
   parameterized SQL; Zod validation on the name.
2. Docs alignment:
   - Remove or correct the SESSION_SECRET requirement in
     apps/qc-task-manager/docs/DEPLOYMENT.md and README.md — the app does not
     read it (sessions are opaque tokens in SQLite). Either state it is reserved
     (not implemented) or implement signing — pick one, do not leave it implied.
   - Create apps/qc-task-manager/docs/REPOSITORY-AUDIT.md summarizing how the app
     integrates with the monorepo (workspace wiring, astro config, deployment
     surface, files that must not be modified) — short, derived from
     docs/ARCHITECTURE.md and brain.md.
3. Add a small unit check: saved filter create/list/apply/delete with an
   unauthorized user getting 403/404.

Acceptance criteria:
- pnpm --filter @brightai/qc-task-manager typecheck passes (0 errors).
- pnpm --filter @brightai/qc-task-manager test passes (265/0 + new checks).
- Saved filter round-trip works in a temp-DB server session (create → list →
   apply → delete → gone).
- DEPLOYMENT.md and README.md no longer imply SESSION_SECRET is active.
- REPOSITORY-AUDIT.md exists and links from docs/ARCHITECTURE.md.
```

---

## ✅ ترتيب التنفيذ المقترح

| الترتيب | البرومبت | الأولوية | الجهد | معيار المتابعة |
|---|---|---|---|---|
| 1 | PROMPT 01 — health | P0 | XS | build + 200/503 محلي |
| 2 | PROMPT 05 — إلزام password | P1 | S | test + رفض الإقلاع في production |
| 3 | PROMPT 06 — CANTOPEN | P2 | XS | صفر تحذيرات |
| 4 | PROMPT 03 — Groq live | P0 | S | smoke حي موثق (بموافقة) |
| 5 | PROMPT 02 — render.yaml | P0 | M | ملف يمر + deploy من المستخدم |
| 6 | PROMPT 04 — CSP | P1 | M | verify-csp يمر |
| 7 | PROMPT 07 — a11y | P1/P2 | S | axe/كيبورد |
| 8 | PROMPT 08 — Navbar | P1/P2 | S | 0 overflow @768 |
| 9 | PROMPT 09 — acceptance موسّع | P2 | M | e2e 0 failed |
| 10 | PROMPT 10 — saved filters + docs | P2/P3 | M | test + round-trip |

> بعد إغلاق P0s (01، 02، 03) + P1s الأساسية (04، 05): **Conditional GO** للإنتاج.
> بعد restore drill + أسبوع monitoring على deploy حي: **GO**.
