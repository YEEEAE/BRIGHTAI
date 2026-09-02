# PROMPT 05 — ARABIC/BIDI PDF EXPORT REMEDIATION EVIDENCE

**Task:** `QC-REMEDIATION-005`  
**Date:** `2026-09-03`  
**Target:** `apps/qc-task-manager`  
**Status:** `PASS` — All 6 acceptance criteria verified.

## 1. Implemented Controls

### AC-01: Arabic shaping and BiDi-safe PDF pipeline

- Extended the existing Unicode reporting writer in `src/lib/reporting/writers/pdf.ts` with fontkit shaping, Arabic contextual forms, lam-alef handling, RTL/LTR run ordering, and ToUnicode extraction mappings.
- Embedded the local IBM Plex Sans Arabic font instead of relying on browser/system fonts.
- Added `/Lang (ar)` and `/ViewerPreferences /Direction /R2L` to generated PDFs.
- Fixed multi-page flushing so long reports retain every page.

### AC-02: Professional bilingual QC/CoA report header

- Added `src/lib/taskPdf.ts` as the task-report assembly layer.
- Every task report now includes bilingual BRIGHTAI/QC headings, Task ID, Status, Priority, Inspector Name, Date/Generated timestamp, evidence, and an `E-SIGNATURE BADGE: VERIFIED` marker.
- PDF Info metadata includes the control header and task/evidence metadata for searchable/auditable inspection.

### AC-03: Export response contract and auditability

- The task export route returns `Content-Type: application/pdf; charset=utf-8`.
- The response is inline with `filename="task-{id}.pdf"`.
- Successful exports write `report_exported` to `task_activity_log`.
- Existing authentication, authorization, and generic foreign-task 404 behavior remain enforced.

### AC-04: Print hardening and offline font use

- Added print CSS to hide navigation/chrome and prevent table rows, sections, and report panels from splitting incorrectly.
- Updated `PrintLayout.astro` to use the bundled local IBM Plex Sans Arabic font with `font-display: swap`.
- Browser verification covered `/lab/tests/1/print` under Playwright print emulation and generated a non-empty A4 PDF.

### AC-05: Role and regression coverage

- Added `test:export-reports-100` covering Inspector/employee ownership, Supervisor, Manager, foreign-task denial, audit logging, headers, metadata, font embedding, pagination, print CSS, and route contracts.
- Added the direct `test:report-pdf-arabic` command and fixed its TypeError-safe diagnostic bootstrap and assertions.
- Classified both suites as canonical in the test manifest.
- Acceptance fixture runner now uses `NODE_ENV=test` only for isolated fixture databases; production build remains unchanged.

### AC-06: Evidence and reproducibility

- This evidence file records the implementation, commands, exact results, and remaining issues.

## 2. Verification Results

| Test / Check | Command | Result |
|---|---|---|
| Arabic PDF diagnostic | `node scripts/test-report-pdf-arabic.mjs` | **PASS (34/34)** |
| Export contract suite | `pnpm run test:export-reports-100` | **PASS (20/20)** |
| Test manifest guard | `node scripts/test-manifest-guard.mjs` | **PASS — 83 canonical suites, 28 E2E suites** |
| Typecheck | `node_modules/.bin/astro check` | **PASS — 0 errors, 0 warnings, 0 hints** |
| Production build | `node_modules/.bin/astro build` | **PASS** |
| Full unit regression | `pnpm test` | **PASS — 83 canonical suites** |
| Focused lab print E2E | `scripts/e2e-lab-tests.mjs` | **PASS (94/94)** |
| Full acceptance E2E | `pnpm e2e:acceptance` | **PASS — 30/30 suites, 0 failed; 3059+ assertions passed** |
| HTTP export smoke check | `GET /api/export/tasks/pdf/1` | **200; UTF-8 PDF; inline filename; audit metadata present** |

The full acceptance runner also passed the responsive suite with **648/648** checks and the report suite with **912/912** checks. The restart-persistence phase passed for both create and verify stages.

## 3. Acceptance Criteria Matrix

| Criterion | Requirement | Status | Evidence |
|---|---|---|---|
| **AC-01** | Arabic shaping, BiDi ordering, searchable Unicode, language and RTL metadata | **PASS** | `pdf.ts` + `test-report-pdf-arabic.mjs` + `test-export-reports-100.mjs` |
| **AC-02** | Bilingual professional QC/CoA header with required control fields and e-signature badge | **PASS** | `taskPdf.ts` + PDF metadata assertions |
| **AC-03** | UTF-8 inline PDF response, stable filename, auth/RBAC/404, and export audit event | **PASS** | `[id].ts` + `activity.ts` + route contract suite |
| **AC-04** | Print CSS hardening, offline local font, A4 print behavior | **PASS** | `global.css` + `PrintLayout.astro` + focused Playwright E2E |
| **AC-05** | Canonical test commands and no regressions | **PASS** | `package.json` + `test-manifest.mjs` + `pnpm test` + full E2E |
| **AC-06** | Evidence document | **PASS** | This file |

## 4. Operational Safety

- No `git commit`, `git push`, or workflow changes were made.
- Existing unrelated working-tree changes were preserved.
- Temporary test databases and server fixtures were cleaned up by their test runners; expected backup warnings only referenced deleted temporary databases.
- No secrets or environment files were modified.
