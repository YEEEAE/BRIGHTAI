# PROMPT 05 — REPORTING, EXPORTS & ARABIC BIDI PDF ENGINE

TASK ID:
QC-REMEDIATION-005

PRIORITY:
P2 (Medium / Core Export Defect)

ROLE:
Document Systems Engineer, Arabic Typography & BiDi Specialist, PDF Generation Lead.

DEPENDS ON:
PROMPT-04.

BLOCKS:
GATE B.

SOURCE FINDINGS:
- P2-1: Arabic text shaping and BiDi rendering defect in PDF export (`scripts/test-report-pdf-arabic.mjs`).
- Audit Sections 18, 73, 74.

AFFECTED DOMAINS:
Domain 73 (Print / PDF / Export UX), Domain 74 (Reporting Architecture & Reporting UX), Domain 88 (Content Design & Terminology).

MISSION:
Fix the Arabic text shaping and bidirectional (BiDi) glyph reordering in the PDF export engine, resolve the TypeError in `scripts/test-report-pdf-arabic.mjs`, ensure official Certificate of Analysis (CoA) and task reports render properly connected Arabic script, and verify clean print layouts across all 115 routes.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read finding P2-1 and PDF deep dive (Section 18)
* inspect `apps/qc-task-manager/scripts/test-report-pdf-arabic.mjs`
* inspect `apps/qc-task-manager/src/pages/api/export/tasks/pdf/[id].ts`
* inspect `apps/qc-task-manager/src/lib/pdf/` or PDF generation utilities
* reproduce the TypeError in `test-report-pdf-arabic.mjs`.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/scripts/test-report-pdf-arabic.mjs`
- `apps/qc-task-manager/src/pages/api/export/tasks/pdf/[id].ts`
- `apps/qc-task-manager/src/pages/lab/tests/[id]/print.astro`
- `apps/qc-task-manager/src/pages/lab/equipment/[id]/print.astro`
- `apps/qc-task-manager/src/styles/global.css` (`@media print` rules)

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/better-typography/SKILL.md`

REQUIREMENTS:
1. Arabic Glyph Shaping & BiDi Reordering:
   - Diagnose root cause of TypeError in `scripts/test-report-pdf-arabic.mjs`:
     - Verify font file loading (e.g. Cairo or Amiri font with proper OpenType gsub/gpos tables).
     - Use a verified Arabic text shaping pipeline (e.g., standard Arabic reshaper or proper fontkit feature layout).
     - Ensure right-to-left text is properly rendered without disconnected letters or inverted words.
2. PDF Report Generator:
   - In `src/pages/api/export/tasks/pdf/[id].ts`:
     - Render professional QC Certificate of Analysis / Task Summary header with Saudi standard styling.
     - Include bilingual headers (Arabic / English), Task ID, Status, Priority, Inspector Name, Date, and e-Signature verification badge.
     - Return valid PDF bytes with header `Content-Type: application/pdf; charset=utf-8` and `Content-Disposition: inline; filename="..."`.
3. Print Stylesheet Hardening:
   - In `src/styles/global.css`, audit `@media print` rules:
     - Hide navigation bars, buttons, sidebars, and action dialogs when printing.
     - Prevent awkward page breaks inside data tables (`page-break-inside: avoid;`).
     - Force high contrast black-on-white text for paper readability.

NON-NEGOTIABLE BUSINESS RULES:
- Arabic text in printed reports must be 100% grammatically and visually correct; disconnected characters are unacceptable in official audit documents.
- The document must clearly indicate whether it is an "OFFICIAL APPROVED REPORT" or "DRAFT / UNAPPROVED COPY".

IMPLEMENTATION REQUIREMENTS:
- Fast, synchronous or streaming PDF generation without blocking server event loop.
- Memory efficient buffer handling.

DO NOT:
- Do NOT ship PDF reports where Arabic words appear left-to-right or with isolated glyphs.
- Do NOT rely on external internet APIs or CDN services to render PDFs (must run 100% locally offline).

TEST-FIRST / DEBUGGING REQUIREMENT:
Run `node apps/qc-task-manager/scripts/test-report-pdf-arabic.mjs` -> reproduce TypeError. Apply fontkit/reshaping fix -> re-run script -> verify it generates a valid PDF buffer and exits 0.

TEST QUALITY REQUIREMENT:
Inspect generated PDF buffer: verify `%PDF-1.` magic bytes, non-zero length, and presence of shaped Arabic text strings in PDF stream.

REQUIRED AUTOMATED TESTS:
- `node apps/qc-task-manager/scripts/test-report-pdf-arabic.mjs`
- `pnpm run test:export-reports-100`

REQUIRED BROWSER TESTS:
- Open `/lab/tests/1/print` in headless browser, trigger print emulation, verify `@media print` styles hide navigation.

REQUIRED DATABASE TESTS:
- Ensure PDF export logs a read/export event in `task_activity_log`.

REQUIRED SECURITY TESTS:
- Verify that users without read permission on a task cannot export its PDF.

REQUIRED ACCESSIBILITY TESTS:
- PDF generated should include basic document title and language tag (`/Lang (ar)`).

REQUIRED ROLE TESTS:
- Verify Inspector, Supervisor, and Manager can export PDF.

REQUIRED NEGATIVE TESTS:
- Requesting PDF for non-existent task ID returns HTTP 404 JSON, not unhandled crash.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: `scripts/test-report-pdf-arabic.mjs` executes and passes with exit code 0.
- AC-02: Arabic glyphs in generated PDF are properly shaped and connected (RTL).
- AC-03: Official Certificate of Analysis PDF layout meets QMS printing standards.
- AC-04: `@media print` rules cleanly hide interactive UI elements across print views.
- AC-05: PDF export enforces authentication and authorization guards.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-05-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-05-EVIDENCE.md`

FINAL VERIFICATION:
Run `node apps/qc-task-manager/scripts/test-report-pdf-arabic.mjs`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...
