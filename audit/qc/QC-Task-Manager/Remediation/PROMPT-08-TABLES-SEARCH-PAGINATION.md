# PROMPT 08 — ADVANCED TABLES, SERVER PAGINATION & SEARCH

TASK ID:
QC-REMEDIATION-008

PRIORITY:
P1 / P2

ROLE:
Staff Database Architect, Data Grid Engineer, Information Retrieval Specialist.

DEPENDS ON:
GATE B (PROMPT-02, PROMPT-04).

BLOCKS:
PROMPT-11, GATE C.

SOURCE FINDINGS:
- P1-5: Hard 500-row cap in search and drilldowns without server-side pagination.
- Audit Sections 17, 48, 49.

AFFECTED DOMAINS:
Domain 48 (Advanced Table / Data Density Design), Domain 49 (Search / Filter / Sorting UX), Domain 29 (Performance Engineering).

MISSION:
Eliminate the silent 500-row cap across all search and data table views (`search.astro`, `lab/search.astro`, `tasks/`), implement robust server-side cursor/offset pagination with customizable page sizes (25, 50, 100), normalize Arabic text search (alef/yaa/hamza insensitivity), and provide clear total count indicators (`عرض 1 إلى 50 من أصل 1,420 سجل`).

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read finding P1-5 and Table Deep Dive (Section 17)
* inspect `apps/qc-task-manager/src/pages/search.astro`
* inspect `apps/qc-task-manager/src/pages/lab/search.astro`
* inspect search query logic in `src/lib/search.ts`
* locate all instances of `LIMIT 500`.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/pages/search.astro`
- `apps/qc-task-manager/src/pages/lab/search.astro`
- `apps/qc-task-manager/src/lib/search.ts`
- `apps/qc-task-manager/src/components/Pagination.astro` (or create if missing)
- `apps/qc-task-manager/scripts/test-search-filter-sorting-100.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/table-accessibility/SKILL.md`

REQUIREMENTS:
1. Server-Side Pagination Architecture:
   - Create a reusable pagination component and helper: `src/lib/pagination.ts`.
   - Replace hardcoded `LIMIT 500` with parametric `LIMIT ? OFFSET ?`:
     - Default page size: 25.
     - Allowed page sizes: 25, 50, 100.
     - Read `page` and `pageSize` from URL search parameters (`?page=2&pageSize=50`).
   - Execute a fast `SELECT COUNT(*)` query to compute total pages and total rows.
2. Pagination Controls & UI:
   - Render accessible navigation: `الصفحة السابقة`, `الصفحة التالية`, page number links, and page size dropdown.
   - Display localized summary: `عرض {start} إلى {end} من أصل {total} نتيجة`.
   - Preserve all active filter parameters across page changes.
3. Arabic Text Search Normalization:
   - In search queries, normalize Arabic characters so that:
     - `أ`, `إ`, `آ`, `ا` match interchangeably.
     - `ة` and `ه` match interchangeably.
     - `ى` and `ي` match interchangeably.
     - Strip Arabic diacritics (tashkeel).
4. Sticky Table Headers & Column Density:
   - On wide tables, ensure column headers remain sticky during vertical scroll.
   - Support compact row height mode for high-density laboratory data review.

NON-NEGOTIABLE BUSINESS RULES:
- The system must NEVER silently truncate search results without warning the user.
- If total records exceed 10,000, provide index-backed cursor pagination or require refining search filters.

IMPLEMENTATION REQUIREMENTS:
- Fast SQL execution with index usage (`idx_tasks_status_created`, etc.).
- Semantic HTML `<table>` markup with proper ARIA attributes.

DO NOT:
- Do NOT perform in-memory pagination of 50,000 records on the Node.js server.
- Do NOT break URL bookmarking; pagination state must be in the URL query string.

TEST-FIRST / DEBUGGING REQUIREMENT:
Seed 600 mock tasks into test database -> run search query -> verify page 1 returns 25 rows, total shows 600, page 2 returns rows 26-50, and all 600 are accessible via pagination.

TEST QUALITY REQUIREMENT:
Assert exact record counts and SQL query plans; verify `EXPLAIN QUERY PLAN` uses proper indexes.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:search-filter-sorting-100`
- New: server-side pagination and Arabic search normalization test suite.

REQUIRED BROWSER TESTS:
- E2E test: Navigate to `/search?q=فحص&page=2` -> verify page 2 loads correct slice.

REQUIRED DATABASE TESTS:
- Ensure pagination query does not perform full table scan for indexed filters.

REQUIRED SECURITY TESTS:
- Validate `page` and `pageSize` inputs are positive integers; reject negative or extreme values (e.g. `pageSize=1000000` clamped to 100).

REQUIRED ACCESSIBILITY TESTS:
- Pagination navigation must be enclosed in `<nav aria-label="تنقل بين الصفحات">` with `aria-current="page"` on the active page.

REQUIRED ROLE TESTS:
- Verify pagination functions identically for all roles.

REQUIRED NEGATIVE TESTS:
- Out of range page number (e.g. `?page=9999`) gracefully redirects to last page or shows empty state with reset button.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Hardcoded 500-row cap eliminated from all search queries.
- AC-02: Server-side pagination implemented with 25/50/100 options.
- AC-03: Arabic search normalization handles alef, hamza, and taa marbuta variants.
- AC-04: Pagination controls fully accessible with keyboard and screen readers.
- AC-05: Page size clamped to maximum 100 to prevent DoS memory spikes.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-08-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-08-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:search-filter-sorting-100`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...
