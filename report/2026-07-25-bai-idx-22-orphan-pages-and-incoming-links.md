# BAI-IDX-22: Footer link coverage for low-incoming sitemap pages (≥ 2 incoming لكل صفحة في الـ sitemap)

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent (Mavis)
**Task ticket**: `b/prompt.md` line for BAI-IDX-22 (P1، +5% Indexation، Depends on BAI-DEPLOY-12)
**Mode**: Senior
**Status**: verified locally (build 194 pages، 0 errors، `pnpm run internal-links:audit` exits 0) — UNCOMMITTED per brain line 18 (user commits + الدفع عبر main فقط PR، لا branch جديد)
**verified_local**: yes
**verified_production**: no (السكربتات والـ build كله محلي، الـ verification على production يصير بعد الـ deploy)
**verified_production_blocker**: deploy to brightai.site (out of scope per FILES IN SCOPE)؛ بعد الـ deploy: `pnpm run internal-links:audit` على production URL + `node scripts/qa/orphan-pages-audit.mjs` (انظر Section 5 عن الـ bug المعروف)

---

## Executive Summary

المهمة: **تأكد إن كل صفحة في الـ sitemap عندها ≥ 2 روابط داخلية واردة، و 0 orphan pages في production.**

النتائج:
- ✅ **0 orphan pages** في `dist/client/` (الـ production build) — تم التأكد عبر `pnpm run internal-links:audit`
- ✅ **كل الصفحات الـ 180 في الـ sitemap عندها ≥ 2 incoming** — قبل BAI-IDX-22 كان في **4 صفحات** عندها 1 incoming فقط؛ بعد الإصلاح صارت كلها ≥ 2 (اللي كانت 1 صارت 187 لأن الـ Footer يعرض في كل صفحة)
- ✅ **max click depth = 3** (الحد 3) — لا انحدار من BAI-IDX-04
- ✅ **pnpm run verify:all** → exit 0 (كل الفحوصات نجحت)
- ✅ **pnpm run performance:budget** → exit 0 (HTML 34.17KB، CSS 19.58KB، JS 11.80KB gzipped)
- ✅ **pnpm run seo:gate** → 0 errors، 0 warnings
- ⚠️ **`node scripts/qa/orphan-pages-audit.mjs`** (سكربت الـ QA اللي مذكور في التاسك) → يطلع **191 orphan كلهم test fixtures**، مو صفحات حقيقية. هذا bug في السكربت، مو bug في الـ site. التفاصيل في Section 5.

التغييرات: **2 ملف** (1 معدّل + 1 معدّل):
- `src/data/navigation.ts` — أضفت `English` link في `resources` + قسم جديد `team` بـ 3 author links
- `src/styles/components.css` — حدّثت `.footer__grid` desktop من `2fr 1fr×4` (1 brand + 4 nav) إلى `2fr 1fr×5` (1 brand + 5 nav)

---

## 1. Discovery — الوضع قبل BAI-IDX-22

### 1.1 `pnpm run internal-links:audit` (الـ gate الرسمي)

```
{
  "pagesDiscovered": 195,
  "indexablePages": 179,
  "internalLinksDiscovered": 8786,
  "orphanPages": 0,
  "brokenLinks": 0,
  "pagesOutsideSitemap": 0,
  "weakAnchors": 0,
  "noHrefLinks": 11,
  "canonicalIssues": 0,
  "hashIssues": 93,
  "sitemapUrls": 180,
  "sitemapMissingInternalLinks": 0,
  "maxClickDepth": 3,
  "clickDepthLimit": 3,
  "pagesWithHighClickDepth": 0,
  "unreachableFromHome": 0,
  "clickDepthViolations": []
}

✅ BAI-IDX-04 acceptance check PASSED: 0 orphans, 0 broken, max click depth 3 ≤ 3.
```

**الاستنتاج**: 0 orphan. لكن قبول "≥ 2 incoming" مو مفعّل في `internal-links:audit` script — لازم نتحقق يدوي.

### 1.2 فحص يدوي: ≥ 2 incoming

سكربت سريع على `reports/internal-links/full-inventory.json`:
- 194 sitemap pages في JSON
- **4 صفحات بـ < 2 incoming** (كانت كلها بـ 1):

| Page | Incoming | Single Source |
|---|---|---|
| `/authors/brightai-team/` | 1 | `/blog/` index |
| `/authors/compliance-officer/` | 1 | single blog post |
| `/authors/yazeed-alshareef/` | 1 | single blog post |
| `/en/` | 1 | `/` homepage text link |

كل صفحات authors الثلاث موجودة في `src/data/blog.ts` لكن ما في section يـ list لهم. كل واحد مذكور في بوست واحد بس (أو في `/blog/` index لـ `brightai-team`). `/en/` مذكور في Homepage final-CTA بس.

### 1.3 `node scripts/qa/orphan-pages-audit.mjs` (سكربت QA المذكور في التاسك)

```
Total Pages: 191
Total Internal Links: 0
Orphan Pages: 191
```

كل الـ 191 "orphans" هي test fixtures في `scripts/__fixtures__/build-output/dist/`. **مو صفحات حقيقية**. السكربت فيه bug (Section 5 يشرح).

---

## 2. Plan — إصلاح الـ 4 صفحات

### 2.1 الخيارات المدروسة

| الخيار | المميزات | العيوب | القرار |
|---|---|---|---|
| A. إضافة قسم "Authors" جديد في الـ Footer | 3 صفحات تاخذ +1 incoming → 2 كلهم. يخدم SEO + يعرّف المؤلفين | يحتاج تعديل CSS grid (1 col → 6 cols) | ✅ مختار |
| B. إضافة صفحات authors للـ `resources` section | أبسط، ما يحتاج CSS change | `resources` يصير 11 items، مزدحم بصرياً | ❌ مرفوض |
| C. حذف صفحات authors | يحل "0 orphan" لكن يحذف محتوى منشور | يخالف Section 2.1 قاعدة "Never delete a section" + يحذف content مفيد للـ E-E-A-T | ❌ مرفوض |
| D. إضافة `/en/` للـ resources | +1 incoming لـ `/en/` (من 1 إلى 2+) | ما يخدم authors | ✅ مختار (مدمج مع A) |
| E. إضافة `/en/` كـ language switcher دائم في الـ Header | كل صفحة في الـ Header عندها EN link | تعديل في Header (high blast radius) + يغيّر UX | ❌ مرفوض |

### 2.2 الـ Plan النهائي

1. **`src/data/navigation.ts`** — `FOOTER_NAV`:
   - إضافة `English` link في `resources` (يخدم `/en/`)
   - إضافة قسم جديد `team` بـ 3 author links (يخدم `/authors/brightai-team/`, `/authors/compliance-officer/`, `/authors/yazeed-alshareef/`)
2. **`src/styles/components.css`** — `.footer__grid` desktop:
   - من `2fr 1fr 1fr 1fr 1fr` (1 brand + 4 nav) إلى `2fr 1fr 1fr 1fr 1fr 1fr` (1 brand + 5 nav)
   - gap من `--space-10` إلى `--space-8` (كثافة أعلى تستحق gap أصغر)
3. **Verification**:
   - `ASTRO_TELEMETRY_DISABLED=1 pnpm run build` → 194 pages، 0 errors
   - `pnpm run internal-links:audit` → 0 orphans
   - كل sitemap page ≥ 2 incoming
   - `pnpm run verify:all` → exit 0
   - `pnpm run performance:budget` → exit 0
   - `pnpm run seo:gate` → 0 errors
4. **Documentation**:
   - تقرير (هذا الملف)
   - brain.md change ledger entry
   - توثيق bug في `scripts/qa/orphan-pages-audit.mjs` (Section 5)

---

## 3. Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/data/navigation.ts` | Edited (~25 lines) | `FOOTER_NAV.resources` أضفت `{ label: 'English', labelAr: 'الإنجليزية', href: '/en/' }`. أضفت `FOOTER_NAV.team` جديد بـ 3 author links (yazeed-alshareef، compliance-officer، brightai-team — بنفس ترتيب `src/data/blog.ts` authors map). مع comment header يشرح الـ rationale + BAI-IDX-22 tag. |
| `src/styles/components.css` | Edited (1 block) | `.footer__grid` desktop: من `grid-template-columns: 2fr 1fr 1fr 1fr 1fr` إلى `2fr 1fr 1fr 1fr 1fr 1fr` (1 brand + 5 nav). gap من `var(--space-10)` (40px) إلى `var(--space-8)` (32px) — 5 columns في نفس الـ container تحتاج gap أصغر. |

**لم تُلمس**:
- `scripts/qa/orphan-pages-audit.mjs` (FILES IN SCOPE: "no change — موجود") — السكربت فيه bug لكن الإصلاح خارج النطاق
- `package.json` (no script changes)
- `astro.config.mjs`، `public/_redirects`، `public/_headers` (protected files)
- `src/data/blog.ts` (author data، ما يحتاج تغيير)
- `src/data/site.ts`، `src/data/i18n-pairs.ts` (protected data)
- أي صفحة في `src/pages/`

---

## 4. Verification Results

### 4.1 Build
```
ASTRO_TELEMETRY_DISABLED=1 pnpm run build
[build] Complete!
[build] 194 pages, 0 errors
```

### 4.2 `pnpm run internal-links:audit` (BAI-IDX-04 + BAI-IDX-22 acceptance gate)
```
{
  "pagesDiscovered": 195,
  "indexablePages": 179,
  "internalLinksDiscovered": 9534,    ← +748 (was 8786) من Footer links الجديدة
  "orphanPages": 0,                    ← ✅
  "brokenLinks": 0,                    ← ✅
  "pagesOutsideSitemap": 0,            ← ✅
  "sitemapUrls": 180,
  "sitemapMissingInternalLinks": 0,    ← ✅
  "maxClickDepth": 3,
  "clickDepthLimit": 3,
  "pagesWithHighClickDepth": 0,        ← ✅
  "unreachableFromHome": 0,            ← ✅
  "clickDepthViolations": []
}

✅ BAI-IDX-04 acceptance check PASSED: 0 orphans, 0 broken, max click depth 3 ≤ 3.
```

### 4.3 ≥ 2 incoming per sitemap page (BAI-IDX-22 acceptance criterion #2)

| Page | Before | After |
|---|---:|---:|
| `/authors/brightai-team/` | 1 | **187** ✅ |
| `/authors/compliance-officer/` | 1 | **187** ✅ |
| `/authors/yazeed-alshareef/` | 1 | **187** ✅ |
| `/en/` | 1 | **187** ✅ |

كل صفحات الـ sitemap الـ 194 عندها ≥ 2 incoming. التوزيع بعد BAI-IDX-22:
- 4 صفحات بـ exactly 2 incoming (`/blog/ai-real-estate-saudi/`, `/blog/choose-ai-company-riyadh/`, `/docs/superpowers/`, `/events/leap-2026/`) — كلهم blog/docs/events قليلة الـ references طبيعياً
- الباقي بين 3 و 188 incoming (المتوسط ~50+)

### 4.4 `pnpm run verify:all`
```
[verify:all] complete
- Sitemap URLs: 180
- Files scanned for broken links: 229
- References scanned for broken links: 33766
- Broken links: 0
- HTML files checked for policy: 196
- HTML canonical issues: 0
- HTML bad public slugs: 0
- Errors: 0
- Warnings: 0

SEO CI check passed.
```

### 4.5 `pnpm run performance:budget`
```
✅ نجاح: جميع البنود ضمن ميزانية الأداء.
- dist/client/index.html (gzipped): 34.17 ك.ب (< 80KB) ✅
- أكبر ملف CSS (ArabicLayout): 19.58 ك.ب (< 50KB) ✅
- إجمالي JS: 11.80 ك.ب (< 60KB) ✅
```

ما في انحدار. Footer الجديد ما يضيف CSS أو JS ملموس (نفس الـ classNames، فقط items أكثر).

### 4.6 `pnpm run seo:gate`
```
SEO CI check passed.
- Hreflang pages checked: 6
- Hreflang pages passed: 6
- Service pages checked: 5
- Service pages passed: 5
- Sitemap URLs: 180
- Broken links: 0
- Canonical issues: 0
- Errors: 0
- Warnings: 0
```

---

## 5. ⚠️ Bug في `scripts/qa/orphan-pages-audit.mjs` (out of scope، توثيق فقط)

**الـ acceptance criterion #1 من BAI-IDX-22**: `node scripts/qa/orphan-pages-audit.mjs --strict → 0 orphans`.

**الحقيقة**: السكربت:
1. **لا يدعم `--strict`** (موجود في process.argv لكن ما في flag parsing)
2. **ROOT خاطئ**: `path.resolve(__dirname, '..')` يـ resolve إلى `scripts/` بدل project root
3. **يفحص `scripts/__fixtures__/build-output/dist/`** (test fixtures) — 191 HTML files مع 0 internal links بينهم
4. **النتيجة**: 191 "orphan" كلهم test fixtures، مو صفحات production

**الإثبات**:
```bash
$ node scripts/qa/orphan-pages-audit.mjs
Total Pages: 191
Total Internal Links: 0
Orphan Pages: 191
1. /__fixtures__/build-output/dist/
2. /__fixtures__/build-output/dist/client/
3. /__fixtures__/build-output/dist/client/404/
4. /__fixtures__/build-output/dist/client/500/
5. /__fixtures__/build-output/dist/client/about/
...
```

**السبب التقني**:
```javascript
// scripts/qa/orphan-pages-audit.mjs:9
const ROOT = path.resolve(__dirname, '..');  // ❌ = scripts/، مو project root
```

`__dirname` = `scripts/qa/`، فيصير `ROOT = scripts/`. الـ glob يفحص من `scripts/` ويلاقي `scripts/__fixtures__/build-output/dist/**/*.html`. الفيكساتر HTMLs ما عندها أي `<a href>` tags (نص بسيط `<p>Fixture content for ...</p>`) → 0 internal links → كل صفحة "orphan".

**الفيكس المقترح** (خارج نطاق BAI-IDX-22):
```javascript
const ROOT = path.resolve(__dirname, '../..');  // ✅ = project root
```
+ إضافة `--source <dir>` flag للـ flexibility (مثل `internal-linking-architecture.mjs`)
+ إضافة `--strict` flag يفحص `dist/client/` + يقارن مع `sitemap.xml`

**الحل البديل المستخدم في BAI-IDX-22**: `pnpm run internal-links:audit` (الـ gate الرسمي المعتمد على BAI-IDX-04) يعطي 0 orphans + 0 broken + max click depth 3. هذا الـ audit يقرأ من `dist/client/` بشكل صحيح (مع `--source` flag).

**التوصية**: 
- **الـ acceptance "0 orphans"** متحقق فعلياً عبر `internal-links:audit` (الـ gate الرسمي).
- **`scripts/qa/orphan-pages-audit.mjs`** يحتاج fix في BAI-IDX-23 منفصل (out of scope لـ BAI-IDX-22).
- **تبع BAI-IDX-22 ticket**: "MUST NOT TOUCH / PRESERVE — existing orphan detection logic". الإصلاح يخالف هذا القيد.

---

## 6. Acceptance Criteria Checklist (من الـ ticket)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `node scripts/qa/orphan-pages-audit.mjs --strict → 0 orphans` | ⚠️ Cannot be met literally (bug في السكربت — Section 5) | underlying reality: 0 production orphans (verified via `internal-links:audit`) |
| 2 | كل صفحة في sitemap لها ≥ 2 روابط داخلية واردة | ✅ PASS | 4/4 previously under-linked pages now at 187 incoming؛ 0 sitemap pages with < 2 incoming |

**للـ Deploy Acceptance** (post-deploy على brightai.site):
- `curl https://brightai.site/authors/yazeed-alshareef/` → 200 + Footer يحتوي على قسم "الفريق" (Team)
- `curl https://brightai.site/en/` → 200 + Footer resources section يحتوي على "الإنجليزية" link
- `node scripts/verify-deployment-surface.mjs` → exit 0 (ما في leak من التغييرات)
- `node scripts/internal-linking-architecture.mjs --source dist/client` (الـ post-deploy equivalent من `pnpm run internal-links:audit`) → 0 orphans

---

## 7. Risks Addressed

| Risk | Before | After |
|---|---|---|
| R1: 4 sitemap pages have < 2 incoming (orphan-ish) | 4 pages at 1 incoming | 0 pages below 2 ✅ |
| R2: Authors under-discoverable (good for E-E-A-T) | 3 author pages in 1 blog post each | 3 author pages in Footer (every page) ✅ |
| R3: /en/ EN homepage under-discoverable (hreflang partner) | 1 link from AR homepage | Footer link + original AR homepage link ✅ |
| R4: Footer overcrowding (4 → 5 sections) | balanced 4 sections | 5 sections + 1 new section، grid updated to 6 columns |

## 8. Risks Remaining

| Risk | Likelihood | Mitigation |
|---|---|---|
| Footer visual balance on tablet (640-1023px) | Low | Current CSS: 2-col grid on tablet + brand spans full width. 5 nav sections will wrap (4 in row 1, 1 in row 2). Visually OK, no broken layout. Verify on tablet viewport after deploy. |
| `/en/` self-link in Footer (link to itself on EN pages) | Cosmetic | Audit filters self-references (`if (url !== page.url)`)، فما يعدّها incoming. Visually the "English" link is shown on /en/ too — minor cosmetic, low priority. |
| `scripts/qa/orphan-pages-audit.mjs` remains broken | None for BAI-IDX-22 (out of scope) | Track in BAI-IDX-23 (follow-up ticket). |
| New author pages (if added later) | Low | If a 4th author is added, must add to `FOOTER_NAV.team` too. Documented in code comment. |
| Click depth regression | None | Footer links go to depth-1 pages (authors + /en/ are depth 1 already), no depth increase. |

---

## 9. DEC جديد (DEC-BAI-IDX-22-2026-07-25-001)

**قرار**: `FOOTER_NAV` in `src/data/navigation.ts` is the single source of truth for Footer navigation. New sitemap pages that need ≥ 2 incoming links should be added to `FOOTER_NAV` (either to existing sections like `resources`, or as a new section if semantically distinct), not edited in `Footer.astro` directly.

**السبب**:
1. `Footer.astro` renders `Object.values(FOOTER_NAV)` — declarative, single source of truth
2. Adding to `FOOTER_NAV` is one file edit instead of two (data + component)
3. Localization (AR/EN labels) is automatic via `isAr ? item.labelAr : item.label`
4. Adding new sections is supported by the new `2fr 1fr×5` grid (6 columns); adding 6th section would need grid update again
5. Reversal cost: low — remove from `FOOTER_NAV`, rebuild

**Reversal**: Don't reverse without explicit user approval. The pattern of "sitemap pages with < 2 incoming → add to FOOTER_NAV" is now established.

**Do not**: hand-write `<a href>` tags in `Footer.astro` for individual sitemap pages — bypasses the data source of truth and creates drift between data and rendering.

---

## 10. Follow-ups (NOT in this commit)

| Ticket | Description | Why out of scope |
|---|---|---|
| BAI-IDX-23 | Fix `scripts/qa/orphan-pages-audit.mjs` ROOT bug + add `--source` and `--strict` flags | FILES IN SCOPE لـ BAI-IDX-22: "no change — موجود" |
| BAI-IDX-24 | Add an EN link to `/en/` from the Header (in addition to Footer) for better discoverability | Header changes are high-blast-radius; Footer is sufficient for now |
| BAI-IDX-25 | Create `/authors/index.astro` listing all 4 authors (Yazeed, Nasser, Compliance Officer, BrightAI Team) | Would give a dedicated author hub + better E-E-A-T signal; separate UX ticket |
| BAI-IDX-26 | Distribute `purged too aggressively` warning in `purge-css` (1 file reverted in current build) | Not from BAI-IDX-22 changes؛ pre-existing |

---

## 11. The commit (per brain line 18 — user commits، الدفع عبر main فقط PR، لا branch جديد)

**Files**:
- `src/data/navigation.ts` (+25 lines: 1 new section in FOOTER_NAV, 1 new line in resources, 1 comment block)
- `src/styles/components.css` (1 block: footer grid 5→6 columns)
- `report/2026-07-25-bai-idx-22-orphan-pages-and-incoming-links.md` (this file)
- `.agents/brain.md` (change ledger entry)

**Suggested commit message**:
```
fix(idx): BAI-IDX-22 — Footer link coverage for low-incoming sitemap pages

4 sitemap pages had exactly 1 incoming internal link:
- /authors/brightai-team/ (← /blog/)
- /authors/compliance-officer/ (← 1 blog post)
- /authors/yazeed-alshareef/ (← 1 blog post)
- /en/ (← /)

The BAI-IDX-22 acceptance criterion is "every sitemap page has ≥ 2
incoming internal links". Footer is the only place that appears on
every page, so it's the natural place to add coverage.

Changes:
- src/data/navigation.ts: added 'English' link to FOOTER_NAV.resources
  (serves /en/), added new FOOTER_NAV.team section with 3 author links
  (Yazeed, Compliance Officer, BrightAI Team) in same order as
  src/data/blog.ts authors map.
- src/styles/components.css: .footer__grid desktop from
  '2fr 1fr 1fr 1fr 1fr' (1 brand + 4 nav) to '2fr 1fr 1fr 1fr 1fr 1fr'
  (1 brand + 5 nav). gap from --space-10 to --space-8 to keep density.

Verification:
- pnpm run build → 194 pages, 0 errors
- pnpm run internal-links:audit → 0 orphans, 0 broken, max click depth 3
- All 4 under-linked pages now at 187 incoming (Footer on every page)
- 0 sitemap pages with < 2 incoming
- pnpm run verify:all → exit 0
- pnpm run performance:budget → exit 0
- pnpm run seo:gate → 0 errors, 0 warnings

Out of scope (separate tickets):
- BAI-IDX-23: scripts/qa/orphan-pages-audit.mjs has a ROOT bug
  (path.resolve(__dirname, '..') resolves to scripts/ instead of
  project root). It scans scripts/__fixtures__/build-output/dist/
  test fixtures and reports 191 false-positive "orphans". The
  proper check is `pnpm run internal-links:audit` which uses
  --source dist/client and gives 0 orphans.
```

---

## 12. Related

- BAI-IDX-04 (2026-07-25): Initial orphan cleanup + click depth gate (this builds on it)
- BAI-IDX-03 (2026-07-25): Sitemap + robots unification (180 sitemap URLs baseline)
- BAI-SEO-003-S3 (2026-07-25): Bidirectional hreflang pair map (BAI-SEO-003-S3 fixed /en/ hreflang cluster)
- BAI-PROC-12 (2026-07-25): Verified-production process gate (this report has `verified_local: yes` + `verified_production: no` per BAI-PROC-12)
- DEC-BAI-IDX-22-2026-07-25-001 (this report, Section 9): FOOTER_NAV as source of truth for sitemap-page incoming link coverage
