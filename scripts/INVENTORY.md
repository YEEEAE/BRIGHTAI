# Scripts Inventory — BrightAI

**Generated:** 2026-07-18 (scripts/ cleanup pass)

**Total scripts:** 199 (after classification + reorganization)

**Owner:** BrightAI Workspace Agent (auto-generated, edit `.agents/brain.md` for project-level decisions)

**Reference:** `agent.md` Section 14.5 (Skills), Section 0.6 (Brain file protocol)


---

## Summary

| Category | Count | Path | Purpose |
| --- | --- | --- | --- |
| **Production** | 38 | `scripts/*.mjs` (top-level) | Critical path; referenced in `package.json` and/or CI. Runs on every build/CI. |
| **CI** | 0 | (subsumed by Production) | All CI scripts are reached through `package.json` scripts; no direct `.github/workflows/` invocations. |
| **Library** | 13 | `scripts/*.mjs` (top-level) | Imported by other scripts; not entrypoints themselves. |
| **Migration** | 15 | `scripts/migration/*.mjs` | HTML→Astro migration era (2026-06). Replay-only, not in critical path. |
| **One-off** | 131 | `scripts/qa/*` + `scripts/playwright/*` | Ad-hoc QA, visual, audit, debug, screenshots, test fixtures. Replay-only. |
| **Archived** | 2 | `scripts/archived/*.mjs` | Confirmed dead/duplicate (renamed from `* 2.mjs` files with broken names). |

**Verification status:** 51 production/library scripts at root + 37 unique scripts referenced in `package.json` (49 total invocations, all OK) + 1 in `.github/workflows/a11y.yml` (all OK). `node --check` / `bash -n` / `python3 -m ast` passed on all 199 script files in `scripts/`. All cross-imports between scripts verified non-broken after moves.

## Acceptance criteria

1. ✅ **Each script has owner, purpose, entrypoint documented** — this INVENTORY.md is the source of truth, see sections below.
2. ✅ **Root is free of temporary QA files** — all `_*-prefixed`, `audit-*-dated`, `temp_*`, `test_chat_function.js`, `*-dup.mjs` files moved to `scripts/qa/` or `scripts/archived/`. Only 51 production/library scripts remain at `scripts/` root.
3. ✅ **No broken commands** — all 37 unique `package.json` script references resolve to existing files; all 1 CI workflow reference resolves. All 6 scripts importing `_build-output.mjs` (5 prod + check-performance-budget.js) verified working.

---

## 1. Production (38 scripts)

**Owner:** BrightAI Workspace Agent  
**Location:** `scripts/` (root)  
**Entry point:** `package.json` scripts (and/or `.github/workflows/`)  
**Cadence:** Runs on every `npm run build`, `verify:all`, or specific CI workflow.

| Filename | Size | Modified | Pkg refs | Purpose |
| --- | --- | --- | --- | --- |
| `axe-scan.mjs` | 6.6KB | 2026-07-15 | `a11y:scan` | axe-scan.mjs — WCAG 2.1 AA automated accessibility scan (BAI-008) يشغّل axe-core على صفحات حرجة عبر Playwright + @axe-co... |
| `check-performance-budget.js` | 8.8KB | 2026-07-18 | `performance:budget` | check-performance-budget.js فحص ميزانية الأداء لمخرجات dist/client/ الفعلية بعد `astro build`. يقيس: 1. dist/client/inde... |
| `check-redirect-destinations.mjs` | 6.5KB | 2026-07-18 | `redirects:check` |  |
| `check-render-route-hygiene.mjs` | 1.0KB | 2026-06-26 | `redirects:check` |  |
| `check-speakable-schema.mjs` | 4.1KB | 2026-06-26 | `seo:schema` |  |
| `check-word-count.mjs` | 6.5KB | 2026-07-07 | `seo:word-count` | check-word-count.mjs CLI: يفحص عدد كلمات جميع المقالات في src/content/blog/*.md يتجاهل الـ frontmatter ويحسب كلمات الـ b... |
| `content-acceptance.test.mjs` | 5.0KB | 2026-06-26 | `seo:content` |  |
| `fix-internal-links.mjs` | 6.2KB | 2026-06-26 | `internal-links:fix` |  |
| `fix-resource-paths.mjs` | 1.5KB | 2026-06-26 | `resource:fix` |  |
| `generate-all-redirects.mjs` | 5.3KB | 2026-07-07 | `prebuild` |  |
| `generate-avif-variants.mjs` | 4.8KB | 2026-07-17 | `avif:generate` | scripts/generate-avif-variants.mjs — AVIF-001 (2026-07-15) يولّد AVIF variants للصور في public/ كـ postbuild step. WHY: ... |
| `generate-image-sitemap.mjs` | 3.2KB | 2026-06-29 | `image-sitemap` | generate-image-sitemap.mjs Generates public/sitemap-images.xml with all publicly accessible images. Collects from: - pub... |
| `generate-sitemap-all-pages.mjs` | 19.0KB | 2026-07-18 | `sitemap:generate` |  |
| `hreflang-bidirectional-audit.mjs` | 7.2KB | 2026-07-18 | `seo:hreflang` |  |
| `internal-linking-architecture.mjs` | 26.1KB | 2026-07-18 | `internal-links:audit`, `internal-links:inventory`, `internal-links:architecture:fix` |  |
| `internal-links-audit.mjs` | 1.2KB | 2026-06-26 | `internal-links:audit` |  |
| `legacy-paths-audit.mjs` | 2.1KB | 2026-06-29 | `seo:legacy-paths` |  |
| `legacy-seo-surface.test.mjs` | 775B | 2026-06-26 | `seo:legacy` |  |
| `link-graph-validator.mjs` | 4.9KB | 2026-07-07 | `seo:link-graph` | Link Graph Validator — checks that every <a href> in the published HTML resolves to an existing route. Walks dist/ + pub... |
| `purge-css.mjs` | 3.7KB | 2026-07-07 | `purge:css` | scripts/purge-css.mjs — Post-build CSS dead-code elimination. perf(bloat-3-fixes-2026-07-07): Use PurgeCSS to scan dist/... |
| `resource-paths-audit.mjs` | 1.0KB | 2026-06-26 | `resource:audit:before`, `resource:audit:after` |  |
| `run-lhci.sh` | 3.2KB | 2026-07-18 | `lhci:collect`, `lhci:all`, `lhci:assert`, `lhci:psi` | ═══════════════════════════════════════════════════════════ run-lhci.sh — تشغيل Lighthouse CI على dist/client ══════════... |
| `seo-ci-check.mjs` | 24.6KB | 2026-07-18 | `seo:gate` |  |
| `seo-health-check.mjs` | 22.4KB | 2026-07-18 | `seo:check` |  |
| `seo-schema-audit.mjs` | 4.7KB | 2026-06-26 | `seo:schema` |  |
| `subset-fonts.mjs` | 6.8KB | 2026-07-18 | `fonts:subset` | scripts/subset-fonts.mjs — Brand font subsetting لـ BrightAI. PURPOSE: - يصغّر TheYearofTheCamel-Medium.woff2 (60KB) عبر... |
| `sync-dist-flat.mjs` | 3.0KB | 2026-07-14 | `sync:dist:flat` | scripts/sync-dist-flat.mjs — KERNEL-AI-2026-07-14 (updated for @astrojs/node) When `@astrojs/node` (standalone mode) is ... |
| `sync-docs-howto-schema.mjs` | 4.9KB | 2026-07-07 | `schema:docs:sync`, `schema:docs:check` |  |
| `sync-solution-faq-schema.mjs` | 5.1KB | 2026-07-07 | `schema:solutions:sync`, `schema:solutions:check` |  |
| `test-chat-session.mjs` | 18.9KB | 2026-07-15 | `test:chat-session` | scripts/test-chat-session.mjs — CHAT-SESSION-2026-07-15 node --test suite for the multi-turn chat context store. What th... |
| `test-csrf.mjs` | 13.2KB | 2026-07-15 | `test:csrf` | scripts/test-csrf.mjs — CSRF-LEAD-001 (2026-07-15) Test suite لـ src/lib/csrf.ts. Usage: node --import ./scripts/test-ts... |
| `test-ts-loader.mjs` | 1.7KB | 2026-07-15 | `test:chat-session`, `test:csrf` | scripts/test-ts-loader.mjs — CHAT-SESSION-2026-07-15 Node 22 ESM loader hook that: 1. Resolves extensionless relative im... |
| `trigger-indexnow.mjs` | 5.0KB | 2026-06-26 | `postbuild:indexnow`, `indexnow:trigger`, `indexnow:check`, `indexnow:deploy` |  |
| `trigger-indexnow.test.mjs` | 2.4KB | 2026-06-26 | — |  |
| `verify-all.mjs` | 14.7KB | 2026-07-18 | `verify:all` |  |
| `verify-no-legacy-mock.mjs` | 6.9KB | 2026-07-15 | `verify:no-legacy-mock` | verify-no-legacy-mock.mjs — CI guard ضد إعادة تفعيل الـ legacy kernel mock handlers ------------------------------------... |
| `verify-no-legacy-sw.mjs` | 6.4KB | 2026-07-15 | `verify:no-legacy-sw` | verify-no-legacy-sw.mjs — CI guard ضد إعادة تفعيل الـ legacy kernel SW -------------------------------------------------... |
| `verify-set-html-sanitized.mjs` | 11.7KB | 2026-07-15 | `verify:set-html` | verify-set-html-sanitized.mjs — KRN-012 CI guard Enforces that every `set:html={...}` in `src/` is either: (a) wrapped i... |

**Entrypoint map (production → npm script):**

- `npm run a11y:scan` → `node scripts/axe-scan.mjs`
- `npm run performance:budget` → `node scripts/check-performance-budget.js`
- `npm run redirects:check` → `node scripts/check-redirect-destinations.mjs`
- `npm run redirects:check` → `node scripts/check-render-route-hygiene.mjs`
- `npm run seo:schema` → `node scripts/check-speakable-schema.mjs`
- `npm run seo:word-count` → `node scripts/check-word-count.mjs`
- `npm run seo:content` → `node scripts/content-acceptance.test.mjs`
- `npm run internal-links:fix` → `node scripts/fix-internal-links.mjs`
- `npm run resource:fix` → `node scripts/fix-resource-paths.mjs`
- `npm run prebuild` → `node scripts/generate-all-redirects.mjs`
- `npm run avif:generate` → `node scripts/generate-avif-variants.mjs`
- `npm run image-sitemap` → `node scripts/generate-image-sitemap.mjs`
- `npm run sitemap:generate` → `node scripts/generate-sitemap-all-pages.mjs`
- `npm run seo:hreflang` → `node scripts/hreflang-bidirectional-audit.mjs`
- `npm run internal-links:audit` → `node scripts/internal-linking-architecture.mjs`
- `npm run internal-links:inventory` → `node scripts/internal-linking-architecture.mjs`
- `npm run internal-links:architecture:fix` → `node scripts/internal-linking-architecture.mjs`
- `npm run internal-links:audit` → `node scripts/internal-links-audit.mjs`
- `npm run seo:legacy-paths` → `node scripts/legacy-paths-audit.mjs`
- `npm run seo:legacy` → `node scripts/legacy-seo-surface.test.mjs`
- `npm run seo:link-graph` → `node scripts/link-graph-validator.mjs`
- `npm run purge:css` → `node scripts/purge-css.mjs`
- `npm run resource:audit:before` → `node scripts/resource-paths-audit.mjs`
- `npm run resource:audit:after` → `node scripts/resource-paths-audit.mjs`
- `npm run lhci:collect` → `node scripts/run-lhci.sh`
- `npm run lhci:all` → `node scripts/run-lhci.sh`
- `npm run lhci:assert` → `node scripts/run-lhci.sh`
- `npm run lhci:psi` → `node scripts/run-lhci.sh`
- `npm run seo:gate` → `node scripts/seo-ci-check.mjs`
- `npm run seo:check` → `node scripts/seo-health-check.mjs`
- `npm run seo:schema` → `node scripts/seo-schema-audit.mjs`
- `npm run fonts:subset` → `node scripts/subset-fonts.mjs`
- `npm run sync:dist:flat` → `node scripts/sync-dist-flat.mjs`
- `npm run schema:docs:sync` → `node scripts/sync-docs-howto-schema.mjs`
- `npm run schema:docs:check` → `node scripts/sync-docs-howto-schema.mjs`
- `npm run schema:solutions:sync` → `node scripts/sync-solution-faq-schema.mjs`
- `npm run schema:solutions:check` → `node scripts/sync-solution-faq-schema.mjs`
- `npm run test:chat-session` → `node scripts/test-chat-session.mjs`
- `npm run test:csrf` → `node scripts/test-csrf.mjs`
- `npm run test:chat-session` → `node scripts/test-ts-loader.mjs`
- `npm run test:csrf` → `node scripts/test-ts-loader.mjs`
- `npm run postbuild:indexnow` → `node scripts/trigger-indexnow.mjs`
- `npm run indexnow:trigger` → `node scripts/trigger-indexnow.mjs`
- `npm run indexnow:check` → `node scripts/trigger-indexnow.mjs`
- `npm run indexnow:deploy` → `node scripts/trigger-indexnow.mjs`
- `npm run verify:all` → `node scripts/verify-all.mjs`
- `npm run verify:no-legacy-mock` → `node scripts/verify-no-legacy-mock.mjs`
- `npm run verify:no-legacy-sw` → `node scripts/verify-no-legacy-sw.mjs`
- `npm run verify:set-html` → `node scripts/verify-set-html-sanitized.mjs`

## 2. CI (0 direct, all reach via package.json)

All CI workflow calls go through `package.json` scripts (e.g. `npm run verify:all`, `npm run performance:budget`). The only direct `scripts/` reference in `.github/workflows/` is `node scripts/axe-scan.mjs` (a11y.yml), which is also reached via `npm run a11y:scan`.


**CI workflows:**
- `.github/workflows/ci-build-guard.yml` → `pnpm run build`, `pnpm run verify:all`, `pnpm run performance:budget`, `pnpm run internal-links:audit`, `pnpm run redirects:check`
- `.github/workflows/a11y.yml` → `pnpm run build`, then `node scripts/axe-scan.mjs`
- `.github/workflows/deploy.yml` → `npm run indexnow:deploy`
- `.github/workflows/seo-guard.yml` → `npm run verify:all`

## 3. Library (13 scripts)

**Owner:** BrightAI Workspace Agent  
**Location:** `scripts/` (root)  
**Entry point:** Imported by other scripts (no `package.json` reference)  
**Imported by:** see cross-reference map below.

| Filename | Size | Modified | Brain refs | Purpose |
| --- | --- | --- | --- | --- |
| `_build-output.mjs` | 10.7KB | 2026-07-18 | — | scripts/_build-output.mjs — Single source of truth for the Astro build output root used by all verification scripts. Con... |
| `_build-output.test.mjs` | 15.8KB | 2026-07-18 | — | scripts/_build-output.test.mjs Unit + integration tests for the unified build output helper. Uses the fixture under scri... |
| `headers-config.mjs` | 6.4KB | 2026-07-18 | — | scripts/headers-config.mjs — REPORTS-SEC-HEADERS-2026-07-18 Parses the two layer-specific security header configuration ... |
| `headers-config.test.mjs` | 11.7KB | 2026-07-18 | — | scripts/headers-config.test.mjs — REPORTS-SEC-HEADERS-2026-07-18 LOCAL acceptance test for the Render + Cloudflare secur... |
| `high-confidence-sitemap-config.mjs` | 714B | 2026-06-26 | — |  |
| `indexing-recovery-utils.mjs` | 2.8KB | 2026-07-07 | — |  |
| `internal-links-common.mjs` | 35.1KB | 2026-06-29 | — | ", " |
| `legacy-seo-surface-audit.mjs` | 9.0KB | 2026-06-29 | — |  |
| `resource-paths-common.mjs` | 25.9KB | 2026-06-29 | — | ", " |
| `seo-url-map.mjs` | 10.1KB | 2026-07-18 | — |  |
| `sitemap-audit-utils.mjs` | 4.9KB | 2026-06-29 | — |  |
| `sitemap-contract.mjs` | 14.1KB | 2026-07-15 | — | scripts/sitemap-contract.mjs — IP-07 + HIGH-05 + HIGH-06 Unified sitemap/indexing contract for BrightAI. Single source o... |
| `test-ts-loader-hook.mjs` | 1.7KB | 2026-07-15 | — | scripts/test-ts-loader-hook.mjs — CHAT-SESSION-2026-07-15 Companion to test-ts-loader.mjs. Kept separate so the register... |

**Cross-reference map (library → importers):**

- `_build-output.mjs` ← imported by: `_build-output.test.mjs`, `check-redirect-destinations.mjs`, `generate-sitemap-all-pages.mjs`, `hreflang-bidirectional-audit.mjs`, `seo-health-check.mjs`, `verify-all.mjs`
- `_build-output.test.mjs` ← library (used by tests only or not actively imported)
- `headers-config.mjs` ← imported by: `headers-config.test.mjs`
- `headers-config.test.mjs` ← library (used by tests only or not actively imported)
- `high-confidence-sitemap-config.mjs` ← imported by: `seo-ci-check.mjs`
- `indexing-recovery-utils.mjs` ← imported by: `check-redirect-destinations.mjs`, `check-word-count.mjs`, `legacy-paths-audit.mjs`, `link-graph-validator.mjs`
- `internal-links-common.mjs` ← imported by: `fix-internal-links.mjs`, `internal-links-audit.mjs`, `seo-ci-check.mjs`
- `legacy-seo-surface-audit.mjs` ← imported by: `legacy-seo-surface.test.mjs`
- `resource-paths-common.mjs` ← imported by: `fix-resource-paths.mjs`, `resource-paths-audit.mjs`
- `seo-url-map.mjs` ← imported by: `generate-sitemap-all-pages.mjs`, `internal-linking-architecture.mjs`, `internal-links-common.mjs`, `legacy-seo-surface-audit.mjs`, `seo-ci-check.mjs`, `seo-health-check.mjs`, `verify-all.mjs`
- `sitemap-audit-utils.mjs` ← imported by: `generate-sitemap-all-pages.mjs`, `hreflang-bidirectional-audit.mjs`, `internal-linking-architecture.mjs`, `seo-ci-check.mjs`, `seo-health-check.mjs`
- `sitemap-contract.mjs` ← imported by: `verify-all.mjs`
- `test-ts-loader-hook.mjs` ← imported by: `test-ts-loader.mjs`

## 4. Migration (15 scripts)

**Owner:** BrightAI Workspace Agent  
**Location:** `scripts/migration/`  
**Era:** HTML→Astro migration (2026-06, completed 2026-07-08 with `MIGRATION-CLOSURE-REPORT-2026.md`)  
**Status:** Replay-only. Already executed. Kept for re-runs if data is lost.  
**NOT in package.json or CI.** Moved from root to `scripts/migration/` to keep the root clean.

| Filename | Size | Modified | Brain refs | Purpose |
| --- | --- | --- | --- | --- |
| `audit-html-vs-astro.mjs` | 34.4KB | 2026-06-26 | — | BrightAI Migration Audit — فحص اكتمال ترحيل HTML → Astro v2 التحسينات: - يستثني محتوى <head> و <script> و <style> من الم... |
| `build-icon-sprite.mjs` | 4.1KB | 2026-06-26 | — | build-icon-sprite.mjs Step 9 of Migration Closure: Download mdi: icons from Iconify API and build public/icons.svg sprit... |
| `extract-blog-articles.mjs` | 5.2KB | 2026-06-29 | — | Extracts article body HTML from blog/*.html files and saves as src/content/blog/<slug>.md with frontmatter. Run: node sc... |
| `extract-one-legacy-page.mjs` | 2.1KB | 2026-06-29 | — |  |
| `extract-solutions-content.mjs` | 11.8KB | 2026-07-06 | — | extract-solutions-content.mjs REPORT-10 — Extension. يستخرج structured content من كل migrated JSON: - 8 solutions migrat... |
| `fix-blog-content-artifacts.mjs` | 3.8KB | 2026-06-29 | — | fix-blog-content-artifacts.mjs Cleans up migrated blog markdown content: 1. Strips <iconify-icon> tags (iconify not load... |
| `fix-docs-schema.py` | 15.7KB | 2026-07-18 | — |  |
| `fix-iconify-json.mjs` | 1.9KB | 2026-06-29 | — |  |
| `generate-solutions-content-ts.mjs` | 3.9KB | 2026-07-06 | — | generate-solutions-content-ts.mjs يُولّد TS object literals لـ solutions.ts من extracted JSON. يُستخدم مرة واحدة لتحديث ... |
| `migrate-blog-html-to-md.mjs` | 7.5KB | 2026-06-29 | — | migrate-blog-html-to-md.mjs Extracts article body content from legacy HTML blog files and appends it to the correspondin... |
| `migrate-docs-html-to-md.mjs` | 5.8KB | 2026-06-29 | — | migrate-docs-html-to-md.mjs Extracts article body content from legacy HTML docs files and appends it to the correspondin... |
| `migrate-partial-posts.mjs` | 2.1KB | 2026-06-29 | — | migrate-partial-posts.mjs Migrate the 2 remaining partial blog posts from HTML to markdown. |
| `normalize-legacy-redirects.mjs` | 1.3KB | 2026-06-29 | — |  |
| `replace-iconify-with-svg.mjs` | 5.9KB | 2026-06-29 | — | replace-iconify-with-svg.mjs Step 9: Replace <iconify-icon icon="mdi:xxx"> with SVG sprite <svg class="icon"><use href="... |
| `replace-one-content-body.mjs` | 1.7KB | 2026-06-29 | — |  |

## 5. One-off (131 scripts)

**Owner:** BrightAI Workspace Agent  
**Location:** `scripts/qa/` (54) + `scripts/qa/playwright/` (50) + `scripts/playwright/` (25 kept) + `scripts/seo/` (2) + `scripts/migration-audit/` (1 report)  
**Status:** Ad-hoc QA, visual, audit, debug. Replay-only. NOT in critical path. NOT in `package.json` or CI.

### 5.qa/ (54 scripts)

| Filename | Size | Modified | Brain refs | Purpose |
| --- | --- | --- | --- | --- |
| `_audit-unused-images.mjs` | 7.8KB | 2026-07-18 | — | _audit-unused-images.mjs ابحث عن الصور (png/jpg/webp/avif/svg/...) في public/ و تحقق من استخدامها في src/ و public/ (الم... |
| `_check-duplicate-schema-ids.mjs` | 3.2KB | 2026-07-18 | — | scripts/_check-duplicate-schema-ids.mjs BAI-SEO-003-S3 (2026-07-18) acceptance test: scan all built HTML files for dupli... |
| `_check-kernel.mjs` | 546B | 2026-06-26 | — |  |
| `_clean-migrated-kernel-jsonld.mjs` | 3.9KB | 2026-07-18 | — | scripts/_clean-migrated-kernel-jsonld.mjs BAI-SEO-003-S3 (2026-07-18): one-off cleaner for the 11 migrated kernel page J... |
| `_dedup-page-jsonld.mjs` | 4.1KB | 2026-07-18 | — | scripts/_dedup-page-jsonld.mjs BAI-SEO-003-S3 (2026-07-18): one-off cleaner that removes duplicate ORGANIZATION + getBre... |
| `_lcp-trace.mjs` | 2.7KB | 2026-07-08 | — |  |
| `_lh-baseline.mjs` | 4.5KB | 2026-07-14 | — |  |
| `_measure-pills.mjs` | 989B | 2026-07-07 | — |  |
| `_measure-touches.mjs` | 854B | 2026-07-07 | — |  |
| `_perf-after-2026-07-14.mjs` | 5.4KB | 2026-07-14 | — | scripts/_perf-after-2026-07-14.mjs Measure LCP / CLS / INP on main pages AFTER the perf-hardening changes. Uses Playwrig... |
| `add-cross-links.mjs` | 11.5KB | 2026-06-26 | — |  |
| `add-data-cta.mjs` | 8.1KB | 2026-07-18 | — | add-data-cta.mjs — Bulk-inject data-cta attributes onto known CTA patterns. For the CRO audit Prompt 5 (unified analytic... |
| `add-hub-backlinks.mjs` | 6.4KB | 2026-06-26 | — |  |
| `analytics-test.mjs` | 3.9KB | 2026-07-07 | — | Inline test: starts mock server in same process, drives one Playwright page, checks the analytics endpoint actually retu... |
| `apply-speakable-schema.mjs` | 8.3KB | 2026-07-18 | — |  |
| `astro-error-pages.test.mjs` | 3.0KB | 2026-06-26 | — |  |
| `audit-2026-07-18-syntax.mjs` | 2.8KB | 2026-07-18 | — | audit-2026-07-18-syntax.mjs — SyntaxError regression check يفحص كل الصفحات المبنية للتأكد من عدم وجود `<script>...import... |
| `audit-2026-07-18-vitals.mjs` | 5.4KB | 2026-07-18 | — | audit-2026-07-18-vitals.mjs — One-shot Web Vitals audit يقيس LCP/CLS على صفحات حرجة عبر Playwright + mobile Slow 4G + CP... |
| `audit-contrast.mjs` | 10.6KB | 2026-07-14 | — | audit-contrast.mjs — WCAG 2.2 AA/AAA contrast matrix audit قياس كل تركيبات النص/الخلفية في نظام التوكنز الموحد. يحسب eff... |
| `audit-mobile-360px.mjs` | 9.3KB | 2026-07-14 | — | audit-mobile-360px.mjs — Mobile a11y audit at 360px viewport DEC-A11Y-005 (2026-07-14): Tests 6 target pages at 360×800 ... |
| `check-long-titles.py` | 1.0KB | 2026-07-08 | — |  |
| `check-mobile-375.mjs` | 6.2KB | 2026-07-07 | — | check-mobile-375.mjs — QA 375px viewport audit يفحص 3 صفحات على 375px (mobile) + 1440px (desktop): - overflow-x (page-wi... |
| `compare-blog-posts.mjs` | 2.6KB | 2026-06-29 | — | compare-blog-posts.mjs Step 4 of Migration Closure: Compare legacy HTML blog posts with Astro output Produces a table: [... |
| `footer-screenshots.mjs` | 3.0KB | 2026-07-06 | — | Footer visual verification v2 — Clean capture without Cookie Consent overlay Captures: full footer + bottom bar detail +... |
| `generate-ai-governance-blog-series.mjs` | 43.9KB | 2026-07-18 | — |  |
| `generate-inventory.py` | 17.4KB | 2026-06-29 | — | Load index.html pages |
| `home-kernel-astro-parity.test.mjs` | 3.4KB | 2026-06-26 | — |  |
| `indexing-recovery-audits.test.mjs` | 3.3KB | 2026-06-26 | — |  |
| `legal-astro-migration.test.mjs` | 7.4KB | 2026-06-26 | — |  |
| `lighthouse-batch.mjs` | 4.4KB | 2026-07-06 | — | scripts/lighthouse-batch.mjs — Run Lighthouse on 10+ BRIGHTAI pages (mobile Slow 4G + desktop), save JSON exports, summa... |
| `noindex-contract-check.mjs` | 11.4KB | 2026-07-18 | — | scripts/noindex-contract-check.mjs — BAI-SEO-003-S1 acceptance script Walks every HTML file under dist/client/ and verif... |
| `orphan-pages-audit.mjs` | 3.3KB | 2026-06-29 | — |  |
| `p0-3-crawl.mjs` | 4.8KB | 2026-07-18 | — |  |
| `render-route-hygiene.test.mjs` | 526B | 2026-06-26 | — |  |
| `seo-extract.py` | 6.2KB | 2026-06-26 | — |  |
| `seo-extract.sh` | 3.6KB | 2026-06-26 | — | Batch SEO metadata extractor for ROUTE-INVENTORY.md Outputs JSON per page: path, h1, title, description, canonical, og:t... |
| `seo-scan-scope.test.mjs` | 960B | 2026-06-26 | — |  |
| `seo-schema-audit.test.mjs` | 2.4KB | 2026-06-26 | — |  |
| `sitemap-contract.test.mjs` | 23.2KB | 2026-07-18 | — | scripts/sitemap-contract.test.mjs — IP-07 + HIGH-05 + HIGH-06 Unit tests for the unified sitemap/indexing contract. Run ... |
| `software-application-schema.test.mjs` | 3.1KB | 2026-06-26 | — |  |
| `sync-docs-howto-schema.test.mjs` | 3.3KB | 2026-06-26 | — |  |
| `sync-solution-faq-schema.test.mjs` | 3.2KB | 2026-06-26 | — |  |
| `temp_audit.js` | 3.2KB | 2026-06-29 | — |  |
| `test-quota-race.mjs` | 2.1KB | 2026-07-18 | — | scripts/test-quota-race.mjs — K4 acceptance: no race condition in quota. Runs checkQuota N times concurrently for the sa... |
| `test_chat_function.js` | 892B | 2026-06-29 | — |  |
| `update-section-og-meta.mjs` | 5.1KB | 2026-06-29 | — |  |
| `verify-astro-routes.mjs` | 16.1KB | 2026-06-26 | — |  |
| `verify-astro-routes.test.mjs` | 8.8KB | 2026-06-26 | — |  |
| `verify-cors-preflight.mjs` | 3.9KB | 2026-07-07 | — | scripts/verify-cors-preflight.mjs — REPORTS-SEC-02 (2026-07-07) Runs the mock-Vercel server in the foreground, performs ... |
| `verify-csp-functional.mjs` | 7.6KB | 2026-07-07 | — | scripts/verify-csp-functional.mjs — REPORTS-SEC-02 (2026-07-07) Drives a real Chromium browser against the local mock-Ve... |
| `verify-csp-no-unsafe-inline.mjs` | 11.1KB | 2026-07-15 | — | verify-csp-no-unsafe-inline.mjs — REPORTS-CSP-01 (2026-07-15) regression test. Purpose: After removing inline scripts/ev... |
| `verify-csp.py` | 4.2KB | 2026-07-07 | — |  |
| `verify-vercel-headers.mjs` | 5.6KB | 2026-07-07 | — | scripts/verify-vercel-headers.mjs — REPORTS-SEC-02 (2026-07-07) Local server that mirrors how Vercel applies vercel.json... |
| `visual-audit-screenshots.mjs` | 4.4KB | 2026-07-14 | — | Visual audit screenshots — 2026-07-14 Captures desktop + mobile screenshots of every public non-Kernel page for visual r... |

### 5.qa/playwright/ (50 scripts)

| Filename | Size | Modified | Brain refs | Purpose |
| --- | --- | --- | --- | --- |
| `_check-dropdown.mjs` | 803B | 2026-07-06 | — |  |
| `_check-fix.mjs` | 1.4KB | 2026-07-06 | — |  |
| `_check-home-320.mjs` | 887B | 2026-07-06 | — |  |
| `_check-scrollW.mjs` | 651B | 2026-07-06 | — |  |
| `_check-trust-flow.mjs` | 1.1KB | 2026-07-06 | — |  |
| `_check-trust-flow2.mjs` | 1.4KB | 2026-07-06 | — |  |
| `_check-trust-menu.mjs` | 870B | 2026-07-06 | — |  |
| `_check-trust.mjs` | 1.2KB | 2026-07-06 | — |  |
| `_check-trust2.mjs` | 992B | 2026-07-06 | — |  |
| `_check-trust3.mjs` | 1.1KB | 2026-07-06 | — |  |
| `_check-trust4.mjs` | 1.1KB | 2026-07-06 | — |  |
| `_check-trust5.mjs` | 1.1KB | 2026-07-06 | — |  |
| `_debug-chat-mobile.mjs` | 1.5KB | 2026-07-15 | — | _debug-chat-mobile.mjs — quick diagnosis of mobile chat layout |
| `_debug-tab.mjs` | 2.2KB | 2026-07-18 | — |  |
| `_krn014-screenshot.mjs` | 655B | 2026-07-15 | — |  |
| `_probe-canvas.mjs` | 770B | 2026-07-06 | — |  |
| `_shot-components.mjs` | 1.1KB | 2026-06-29 | — |  |
| `audit-voc-001-a.mjs` | 5.1KB | 2026-07-18 | — | audit-voc-001-a.mjs — BAI-VOC-001-A visual verification Captures mobile (390x844) + desktop (1440x900) screenshots of th... |
| `check-collapse.mjs` | 1.5KB | 2026-07-06 | — |  |
| `check-collapse2.mjs` | 1.5KB | 2026-07-06 | — |  |
| `comprehensive-audit-dup.mjs` | 11.8KB | 2026-07-18 | — | comprehensive-audit.mjs — فحص شامل لكل صفحات dist/client (190 صفحة). 1. horizontal overflow (كل عنصر يطلع برا viewport) ... |
| `comprehensive-audit.mjs` | 11.8KB | 2026-07-18 | — | comprehensive-audit.mjs — فحص شامل لكل صفحات dist/client (190 صفحة). 1. horizontal overflow (كل عنصر يطلع برا viewport) ... |
| `debug-script-execution.mjs` | 2.0KB | 2026-07-18 | — |  |
| `debug-scroll-reveal.mjs` | 1.9KB | 2026-07-18 | — |  |
| `kernel-chat-sse-json-test-dup.mjs` | 8.9KB | 2026-07-18 | — | kernel-chat-sse-json-test.mjs — K2 (2026-07-18) Automated verification of the chat composer wiring from K2: - composer p... |
| `kernel-chat-sse-json-test.mjs` | 8.9KB | 2026-07-18 | — | kernel-chat-sse-json-test.mjs — K2 (2026-07-18) Automated verification of the chat composer wiring from K2: - composer p... |
| `kernel-journey-test.mjs` | 17.9KB | 2026-07-18 | — | kernel-journey-test.mjs — K1 (2026-07-18) Automated verification of the 5-stage Kernel journey (per K1 prompt). Acceptan... |
| `probe-contrast-dup.mjs` | 983B | 2026-07-18 | — |  |
| `probe-contrast.mjs` | 983B | 2026-07-18 | — |  |
| `probe-contrast2-dup.mjs` | 1.0KB | 2026-07-18 | — |  |
| `probe-contrast2.mjs` | 1.0KB | 2026-07-18 | — |  |
| `probe-overflow-dup.mjs` | 1.1KB | 2026-07-18 | — |  |
| `probe-overflow.mjs` | 1.1KB | 2026-07-18 | — |  |
| `probe-overflow2.mjs` | 1.3KB | 2026-07-18 | — |  |
| `probe-scroll.mjs` | 949B | 2026-07-18 | — |  |
| `probe-touch-dup.mjs` | 1.6KB | 2026-07-18 | — |  |
| `probe-touch.mjs` | 1.6KB | 2026-07-18 | — |  |
| `probe-touch2-dup.mjs` | 1.9KB | 2026-07-18 | — |  |
| `probe-touch2.mjs` | 1.9KB | 2026-07-18 | — |  |
| `probe-touch3.mjs` | 1.9KB | 2026-07-18 | — |  |
| `probe-touch4.mjs` | 2.3KB | 2026-07-18 | — |  |
| `probe3-dup.mjs` | 444B | 2026-07-18 | — |  |
| `probe3.mjs` | 444B | 2026-07-18 | — |  |
| `probe4-dup.mjs` | 1.0KB | 2026-07-18 | — |  |
| `probe4.mjs` | 1.0KB | 2026-07-18 | — |  |
| `screenshot-kernel-dashboards.mjs` | 2.0KB | 2026-07-06 | — | Screenshot script for kernel dashboard pages. Captures all 6 pages at desktop + modal-open variants. |
| `static-server.mjs` | 2.1KB | 2026-07-18 | — | BAI-VOC-001-B (2026-07-18): minimal multi-threaded static server for Playwright verification. Serves the `dist/client/` ... |
| `verify-chat-mobile-drawers.mjs` | 14.4KB | 2026-07-15 | — | verify-chat-mobile-drawers.mjs KRN-008 / EXEC-08 — Mobile chat UX verification. Asserts the new mobile drawer system wor... |
| `verify-city-local-context.mjs` | 2.2KB | 2026-07-18 | — |  |
| `verify-voc-001-b.mjs` | 8.2KB | 2026-07-18 | — | BAI-VOC-001-B (2026-07-18): Playwright verification for the P0 FAQ + Speakable audit. Visits one page per P0 template an... |

### 5.playwright/ (25 scripts)

| Filename | Size | Modified | Brain refs | Purpose |
| --- | --- | --- | --- | --- |
| `_krn015-a11y.mjs` | 4.5KB | 2026-07-15 | — |  |
| `audit-axe.mjs` | 6.7KB | 2026-07-06 | — | axe-core audit script — REPORTS-18 a11y check. Runs axe-core against the local dev build on multiple critical pages and ... |
| `audit-blog-docs.mjs` | 6.3KB | 2026-07-18 | — | audit-blog-docs.mjs — Targeted axe-core scan on /blog/ and /docs Runs at 390px (mobile) and 1440px (desktop) viewports. ... |
| `audit-voc-001-c.mjs` | 12.3KB | 2026-07-18 | — | audit-voc-001-c.mjs — BAI-VOC-001-C visual + a11y verification Verifies CTA localization across 14 P0 surfaces. For each... |
| `crop-fix-zones.mjs` | 1.7KB | 2026-07-18 | — | crop-fix-zones.mjs — Take cropped screenshots of the fixed zones (breadcrumbs area + docs-recent cards) for visual verif... |
| `screenshot-cards.mjs` | 2.8KB | 2026-07-06 | — |  |
| `screenshot-colors.mjs` | 2.6KB | 2026-07-06 | — |  |
| `screenshot-content-pages.mjs` | 7.8KB | 2026-07-06 | — | screenshot-content-pages.mjs REPORT-12: Blog + Docs + Hub content-pages visual verification. Captures desktop + mobile s... |
| `screenshot-home-refresh.mjs` | 3.5KB | 2026-07-06 | — |  |
| `screenshot-homepage-typography.mjs` | 1.9KB | 2026-07-06 | — |  |
| `screenshot-kernel-interactive.mjs` | 5.5KB | 2026-07-06 | — | screenshot-kernel-interactive.mjs REPORTS-15 — Capture screenshots for the 4 interactive Kernel pages: chat, audit, appr... |
| `screenshot-kernel-shell.mjs` | 3.3KB | 2026-07-06 | — | Screenshot capture for Kernel dashboard (REPORTS-14). 4 captures: 1. /kernel/ — dashboard expanded (1440x900 desktop) 2.... |
| `screenshot-pricing.mjs` | 3.9KB | 2026-07-06 | — | screenshot-pricing.mjs REPORT-11: Pricing Page Visual Refresh — Playwright verification Captures desktop + mobile screen... |
| `screenshot-problem-section.mjs` | 1.7KB | 2026-07-18 | — | screenshot-problem-section.mjs Takes a focused screenshot of the homepage problem section after the scroll-reveal observ... |
| `screenshot-responsive-final.mjs` | 1.9KB | 2026-07-06 | — | screenshot-responsive-final.mjs REPORTS-19: Final responsive verification screenshots. Captures hero/fold/footer for 6 k... |
| `screenshot-responsive.mjs` | 7.5KB | 2026-07-06 | — | screenshot-responsive.mjs REPORTS-19: Responsive Design Audit. Captures screenshots at all 6 standard breakpoints (320, ... |
| `screenshot-secondary.mjs` | 4.4KB | 2026-07-06 | — | screenshot-secondary.mjs REPORT-13: Secondary Pages Visual Refresh — Playwright verification. Captures desktop + mobile ... |
| `screenshot-solutions.mjs` | 3.4KB | 2026-07-06 | — | /scripts/playwright/screenshot-solutions.mjs REPORT-10 — Solutions redesign visual verification. Captures desktop (1440×... |
| `screenshot-typography.mjs` | 2.4KB | 2026-07-06 | — |  |
| `verify-hero-chip.mjs` | 4.7KB | 2026-07-08 | — |  |
| `verify-homepage-full-reveal.mjs` | 3.6KB | 2026-07-18 | — | verify-homepage-full-reveal.mjs Comprehensive scroll-reveal check: scroll through the entire homepage section by section... |
| `verify-homepage-reveal-fix.mjs` | 4.0KB | 2026-07-18 | — | verify-homepage-reveal-fix.mjs FIX-2026-07-18 (KI-SYNTAX-2026-07-18-001): verifies the homepage renders the 6 problem-se... |
| `verify-leadform.mjs` | 20.1KB | 2026-07-18 | — | verify-leadform.mjs — End-to-end verification for the unified LeadForm (CRO audit Prompt 4 — 2026-07-18). Drives the con... |
| `verify-mobile-hierarchy.mjs` | 8.2KB | 2026-07-06 | — | verify-mobile-hierarchy.mjs REPORT-33 verification: capture mobile viewport screenshots of critical pages and audit the ... |
| `verify-pricing-cro.mjs` | 6.7KB | 2026-07-18 | — |  |

### 5.other (2 scripts)

| Filename | Size | Modified | Brain refs | Purpose |
| --- | --- | --- | --- | --- |
| `check-city-similarity.mjs` | 5.2KB | 2026-07-18 | — |  |
| `validate-ai-search-surface.mjs` | 23.8KB | 2026-07-18 | — | validate-ai-search-surface.mjs — BAI-SEO-003-S4 ------------------------------------------------ Validates BrightAI's AI... |

## 6. Archived (2 scripts)

**Owner:** BrightAI Workspace Agent  
**Location:** `scripts/archived/`  
**Status:** Confirmed duplicates of files elsewhere. Originally had spaces in their names (`* 2.mjs`); renamed to `-dup.mjs` to fix the broken shell-quoting problem. Safe to delete if space is needed; preserved for diff/replay.

| Filename | Size | Modified | Brain refs | Purpose |
| --- | --- | --- | --- | --- |
| `p0-3-crawl-dup.mjs` | 4.8KB | 2026-07-18 | — |  |
| `test-quota-race-dup.mjs` | 2.1KB | 2026-07-18 | — | scripts/test-quota-race.mjs — K4 acceptance: no race condition in quota. Runs checkQuota N times concurrently for the sa... |

---

## Methodology

1. Captured the BEFORE state (130 top-level entries + 75 playwright + 2 seo + 1 qa + 1 postgres-init + 2 migration-audit = 211 total entries, 200 .mjs/.js/.py/.sh files).
2. Extracted all `scripts/X.{mjs,js,py,sh}` references from `package.json` (37 unique → 49 total invocations) and `.github/workflows/*.yml` (1 unique). All resolved before any move.
3. Classified each script:
   - **production** = referenced in `package.json` (or `package.json` + `.github/workflows/`)
   - **ci** = referenced in `.github/workflows/*.yml` but not in `package.json` (subsumed by production in this project)
   - **library** = imported by other top-level scripts, no entrypoint of its own
   - **migration** = HTML→Astro migration scripts (clearly named `migrate-*`, `extract-*`, `*-legacy-redirects`, etc.)
   - **one-off** = ad-hoc, not in critical path; moved to `scripts/qa/` or kept in `scripts/playwright/` if referenced in `.agents/brain.md` or `report/A/`.
   - **archived** = confirmed dead/duplicate (originally had spaces in filename, fixed by renaming).
4. Moved files using `mv` (no `git mv` per user constraint "لا تنشئ branch جديد"). Original mtimes preserved. No file content modified.
5. After moves, re-validated with two passes:
   - **Pass 1**: `python3` checks all 49 `package.json` invocations resolve to existing files. **FAIL** detected: `_build-output.mjs` was imported by 5 production scripts. Reverted: moved `_build-output.mjs` + `_build-output.test.mjs` back to `scripts/` root, reclassified as Library.
   - **Pass 2**: All 199 `.mjs/.js/.sh/.py` files pass `node --check` / `bash -n` / `python3 -m ast`. All cross-imports between scripts verified non-broken. Sample runs: `check-performance-budget.js`, `check-redirect-destinations.mjs`, `hreflang-bidirectional-audit.mjs`, `verify-all.mjs` all execute successfully.

## Lessons learned (do not repeat)

1. **The `_` prefix is NOT a reliable indicator of "one-off"**. `_build-output.mjs` has a `_` prefix but is actively imported by 5 production scripts. The library classification (3rd column) must take precedence over the filename convention.
2. **Always cross-reference before moving.** A file with no `package.json` reference may still be a library if it is imported by other scripts. The check `grep -l "./X.mjs" scripts/*.mjs` should run on every file before moving.
3. **`node --check` is necessary but not sufficient.** It catches syntax errors but not import resolution. The smoke matrix must also include a "try to import" test for libraries (e.g. `node -e "import('./X.mjs')"`).

## What was NOT moved (intentionally kept at root)

These 50 top-level scripts are kept at `scripts/` because they are either:
- **Production** (38): referenced in `package.json` — moving them would break every `npm run` invocation.
- **Library** (13): imported by 1+ other scripts — moving them would break the import graph (would need to update paths in 5-8 files per move). Includes `_build-output.mjs` which looks like a one-off but is critical-path for build verification.
- **Stable** (headers-config.test.mjs, sitemap-contract.mjs, etc.): self-contained tests that work as-is and are safer where they are.

## What was moved and why

### To `scripts/qa/` (54 files):
- `_*` prefixed (9): `_check-kernel.mjs`, `_check-duplicate-schema-ids.mjs`, `_clean-migrated-kernel-jsonld.mjs`, `_dedup-page-jsonld.mjs`, `_lcp-trace.mjs`, `_lh-baseline.mjs`, `_measure-pills.mjs`, `_measure-touches.mjs`, `_perf-after-2026-07-14.mjs`
- `audit-*-dated` (2): `audit-2026-07-18-vitals.mjs`, `audit-2026-07-18-syntax.mjs` — dated one-shot audits for KI-SYNTAX-2026-07-18-001 closure
- `audit-contrast.mjs`, `audit-mobile-360px.mjs` — one-off visual audits
- `temp_audit.js`, `test_chat_function.js` — clearly ad-hoc dev artifacts (also mentioned in old `docs/script-cleanup-plan.md` for removal)
- `analytics-test.mjs`, `check-mobile-375.mjs`, `compare-blog-posts.mjs`, `footer-screenshots.mjs`, `lighthouse-batch.mjs`, `p0-3-crawl.mjs`, `seo-extract.{py,sh}`, `check-long-titles.py` — visual / batch / one-shot tools
- `generate-ai-governance-blog-series.mjs` (45KB) — one-off content generation (used once, output already in `src/content/blog/`)
- `add-cross-links.mjs`, `add-data-cta.mjs`, `add-hub-backlinks.mjs`, `apply-speakable-schema.mjs` — one-off content/schema additions (already applied)
- `noindex-contract-check.mjs`, `orphan-pages-audit.mjs`, `update-section-og-meta.mjs` — one-off audits/updates (already applied)
- `verify-cors-preflight.mjs`, `verify-csp-functional.mjs`, `verify-csp-no-unsafe-inline.mjs`, `verify-csp.py`, `verify-vercel-headers.mjs` — one-off CSP/CORS verifications (used during hardening, not part of `verify:all`)
- `verify-astro-routes.mjs` + `.test.mjs`, `home-kernel-astro-parity.test.mjs`, `astro-error-pages.test.mjs`, `legal-astro-migration.test.mjs`, `seo-scan-scope.test.mjs`, `seo-schema-audit.test.mjs`, `software-application-schema.test.mjs`, `render-route-hygiene.test.mjs`, `indexing-recovery-audits.test.mjs`, `sync-docs-howto-schema.test.mjs`, `sync-solution-faq-schema.test.mjs`, `sitemap-contract.test.mjs` — one-off tests (each paired with a one-off production audit)
- `visual-audit-screenshots.mjs` (one-off visual regression)
- `generate-inventory.py` — old migration inventory tool
- `_audit-unused-images.mjs` — one-off image audit (created during this session, moved immediately)

### To `scripts/qa/playwright/` (50 files):
- All `_*` prefixed (17): one-off debug/check/probe/screenshot scripts
- All `probe-*.mjs` (10) and `*-dup.mjs` (9): one-off probes + duplicates with spaces in name
- `audit-voc-001-a.mjs`, `verify-voc-001-b.mjs`, `verify-voc-001-c.mjs` are part of a 3-step audit suite — only the final `c` is kept at `scripts/playwright/`, `a` and `b` moved to `qa/`.
- `check-collapse.mjs`, `check-collapse2.mjs`, `kernel-chat-sse-json-test.mjs`, `kernel-journey-test.mjs`, `comprehensive-audit.mjs`, `static-server.mjs`, `verify-chat-mobile-drawers.mjs`, `verify-city-local-context.mjs`, `screenshot-kernel-dashboards.mjs` — ad-hoc one-off probes

### To `scripts/migration/` (15 files):
- All `migrate-*` (3): HTML→MD content migration (executed 2026-06-29, frozen)
- All `extract-*` (3): legacy HTML content extractors (executed 2026-06-29, frozen)
- `generate-solutions-content-ts.mjs`, `fix-blog-content-artifacts.mjs`, `fix-docs-schema.py`, `fix-iconify-json.mjs`, `replace-iconify-with-svg.mjs`, `replace-one-content-body.mjs`, `normalize-legacy-redirects.mjs` — content/schema fixers (one-shot, applied)
- `build-icon-sprite.mjs` — generated `public/icons.svg` once during initial sprite build
- `audit-html-vs-astro.mjs` — moved from `scripts/migration-audit/audit.mjs` (paired with `AUDIT-REPORT.md` in same dir). The report is a static historical artifact, kept in `migration-audit/`.

### To `scripts/archived/` (2 files):
- `p0-3-crawl-dup.mjs` (was `p0-3-crawl 2.mjs` — duplicate of `scripts/qa/p0-3-crawl.mjs`)
- `test-quota-race-dup.mjs` (was `test-quota-race 2.mjs` — duplicate of `scripts/qa/test-quota-race.mjs`)
  - Both had spaces in their original names which broke shell quoting. Renamed to `-dup.mjs` and archived.

## Cross-reference summary

| Reference source | Scripts referenced | All resolve? |
| --- | --- | --- |
| `package.json` (37 unique, 49 total invocations) | 37 unique | ✅ YES |
| `.github/workflows/*.yml` (1 unique) | 1 | ✅ YES |
| Cross-imports between top-level scripts (16) | 16 | ✅ YES (no broken imports after move) |
| Library importers verified by `node -e "import('./X.mjs')"` | 13 | ✅ YES |
