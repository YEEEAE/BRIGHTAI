# BAI-IDX-04: Zero indexable orphans + click depth ≤ 3 + broken-link gate

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent (Mavis)
**Task ticket**: `b/prompt.md` line for BAI-IDX-04 (P1, +8% Indexation impact, depends on BAI-IDX-03)
**Mode**: Senior
**Status**: verified locally — UNCOMMITTED per brain line 18 (user commits + الدفع عبر main فقط PR)

---

## Executive Summary

المهمة كانت: **Give every indexable URL at least one contextual inbound link from an indexable page. Keep redirect stubs out of the graph and sitemap.**

الحالة قبل BAI-IDX-04:
- 180 صفحة indexable في الـ graph
- **1 orphan**: `/kernel/offline/` (صفحة PWA offline، indexable لكن ما في أي link داخلي يدخلها)
- **6 canonical_mismatch** على `solutions/cities/{city}/index.html` — ملفات redirect (301 → `/solutions/{sector}/{city}/`) فيها `noindex` لكن الـ audit يفتش canonical بدون ما يستثني noindex
- **click depth**: مو محسوب في الـ audit (فجوة)

الحالة بعد BAI-IDX-04:
- **179 صفحة indexable** (180 - 1 = الـ offline بقت في الـ build لكن صارت noindex → خرجت من "indexable")
- **0 orphans** ✅
- **0 brokenLinks** ✅
- **0 canonicalIssues** (الـ 6 redirect files صارت تُستثنى لأنها noindex) ✅
- **max click depth = 3** (limit 3) ✅
- **0 pages with depth > 3** ✅
- **0 indexable pages unreachable from /** ✅
- **`pnpm run internal-links:audit` exits 0** + يطبع banner نجاح

التغييرات: **3 ملفات** (`src/layouts/KernelLayout.astro` + `scripts/internal-linking-architecture.mjs` + `package.json`).

---

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/layouts/KernelLayout.astro` | Edited (2 lines) | destructure `robots` from `Astro.props` + forward `robots={robots}` to `BaseLayout`. يصلح orphan `/kernel/offline/` (الـ page يمرّر `robots="noindex, follow"` لكن الـ layout ما كان يوصله). |
| `scripts/internal-linking-architecture.mjs` | Edited (3 regions) | (1) تخطّي `hasNoindexDirective(html)` في فحص `canonical_mismatch` (يحل الـ 6 false-positives على redirect files). (2) BFS click depth من `/` + `maxClickDepth` + `pagesWithHighClickDepth` + `unreachableFromHome` + `clickDepthViolations` في الـ summary. (3) Exit code: يفشل `pnpm run internal-links:audit` لو أي AC مكسور. (4) Markdown report فيه section جديد "Click Depth (BAI-IDX-04)" + عمود Click Depth في الجدول. (5) `REPORT_DIR` صار anchored على project root (مو `ROOT`)، عشان dist/ rebuild ما يحذف التقارير. |
| `package.json` | Edited (3 lines) | تمرير `--source dist/client` لـ `internal-links:audit` و `internal-links:inventory` و `internal-links:architecture:fix`. بدونها الـ script يفتش project root (فيها 404.html + report artifacts) ويطلع 0 indexable. |

**`report/2026-07-25-bai-idx-04-internal-link-orphans-and-click-depth.md`**: هذا التقرير (جديد).
**`.agents/brain.md`**: change ledger entry (جديد).

---

## Verification Results

### `pnpm run internal-links:audit` (BAI-IDX-04 acceptance gate)

```json
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

Exit code: **0** ✅

### Click Depth Distribution (BAI-IDX-04 metric)

| Depth | Page Count | Description |
|---:|---:|---|
| 0 | 1 | `/` (الرئيسية) |
| 1 | 45 | main sections (`/solutions/`, `/blog/`, `/kernel/`, `/hub/`, `/about/`, ...) |
| 2 | 126 | sub-sections (`/blog/post/`, `/solutions/sector/`, `/docs/page/`, ...) |
| 3 | 7 | أعمق الصفحات (authors, docs, hub/security) |

**صفحات العمق 3**:
- `https://brightai.site/authors/compliance-officer/`
- `https://brightai.site/authors/yazeed-alshareef/`
- `https://brightai.site/docs/kernel-operations-runbook/`
- `https://brightai.site/docs/kernel-pages/`
- `https://brightai.site/docs/kernel-security-model/`
- `https://brightai.site/docs/kernel-testing-checklist/`
- `https://brightai.site/hub/security/`

كلها في الـ budget (depth = 3 ≤ limit = 3).

### Pre-existing other checks

| Check | Result |
|---|---|
| `ASTRO_TELEMETRY_DISABLED=1 pnpm build` | ✅ 196 pages, 0 errors, 0 warnings |
| `pnpm run verify:all` | ✅ 5/5 checks pass, 0 errors, 0 warnings |
| `pnpm run seo:gate` (in verify:all) | ✅ 6/6 hreflang + 5/5 service + 180 sitemap + 0 errors + 0 warnings |
| `pnpm run performance:budget` | ✅ كل البنود داخل الميزانية |
| `node scripts/seo-ci-check.mjs` | ✅ SEO CI check passed (0 errors, 0 warnings) |
| Failure-path test (mocked: `maxClickDepth=4, pagesWithHighClickDepth=1`) | ✅ exits 1, prints "❌ BAI-IDX-04 acceptance check FAILED" |

### Functional evidence (BAI-IDX-04 ACs)

1. **Zero indexable orphan pages**:
   - قبل: 1 (`/kernel/offline/` — indexable، 0 inbound links)
   - بعد: 0 (الصفحة صارت `noindex, follow` بسبب fix الـ KernelLayout)
   - التحقق: `grep -oE '<meta[^>]*robots[^>]*>' dist/client/kernel/offline/index.html` → `<meta name="robots" content="noindex, follow">`
   - الـ 179 صفحة indexable الباقية كلهم عندهم ≥1 inbound link (min: 1, max: 188)

2. **No indexable route has click depth over 3**:
   - BFS من `/` يطلع max depth = 3
   - 0 صفحات تتجاوز الحد
   - 0 صفحات indexable غير قابلة للوصول من `/`

3. **`pnpm run internal-links:audit` reports no broken production links**:
   - 0 brokenLinks
   - 0 pagesOutsideSitemap
   - exit 0

---

## Implementation Details

### Change 1: `src/layouts/KernelLayout.astro` (2 lines)

**Bug** (pre-existing، كامن من 2026-07-18 لما أُضيف `robots` allowlist):
- `src/pages/kernel/offline.astro` يمرّر `robots="noindex, follow"` للـ `KernelLayout`
- `KernelLayout` يقبل `robots` (عبر extends `SEOProps`) لكن **ما يوصله** لـ `BaseLayout`
- النتيجة: `BaseLayout` ما يشوف `wantsNoindex=true`، والصفحة تطلع `index, follow` بدل `noindex, follow`
- التأثير: الصفحة indexable → الـ audit يحسبها orphan (0 inbound links)

**Fix**:
```diff
 const {
   title,
   description,
   canonical,
   hreflang = [],
   ogImage,
   jsonLd,
+  robots,
   currentPath = '/kernel/',
   extraSpeakableSelectors = [],
 } = Astro.props;
@@
 <BaseLayout
   lang="ar"
   dir="rtl"
   title={title}
   description={description}
   canonical={canonical}
   hreflang={hreflang}
   ogImage={ogImage}
   jsonLd={jsonLd}
   currentPath={currentPath}
+  robots={robots}
   omitLocalBusiness={omitLocalBusiness}
   extraSpeakableSelectors={extraSpeakableSelectors}
 >
```

**النتيجة بعد build**:
- `dist/client/kernel/offline/index.html` robots meta: `noindex, follow` ✅
- باقي kernel pages (`/kernel/chat/`, `/kernel/audit/`, `/kernel/approvals/`, ...): `index, follow, ...` (لم تتأثر) ✅
- `/kernel/offline/` خرجت من عداد "indexable" (179 بدلاً من 180) → 0 orphans

### Change 2: `scripts/internal-linking-architecture.mjs` (3 regions)

#### Region A: تخطّي noindex في فحص `canonical_mismatch` (1 line)

```diff
- if (expectedCanonical && canonical !== expectedCanonical && !isOwnerDecision(relPath)) {
+ if (expectedCanonical && canonical !== expectedCanonical && !isOwnerDecision(relPath) && !hasNoindexDirective(html)) {
   canonicalIssues.push({ relPath, expectedCanonical, canonical: canonicalHref || "" });
 }
```

**المشكلة قبل**: الـ 6 ملفات `solutions/cities/{city}/index.html` (redirect files) عندها canonical = redirect target (`/solutions/{sector}/{city}/`)، لكن `expectedCanonical` (محسوب من path) = `/solutions/cities/{city}/`. الـ mismatch حقيقي بس **مقصود** (الصفحة redirect، والـ canonical يشير للـ target). مع noindex فهي ما تحتاج فحص.

**النتيجة**: `canonicalIssues: 6 → 0` ✅

#### Region B: BFS Click Depth (جديد — 50 سطر تقريباً)

أضفت BFS من `${BASE_URL}/` يحسب depth لكل صفحة indexable. الـ logic:

```js
const HOME_URL = `${BASE_URL}/`;
const urlToPage = new Map();
for (const page of pages) {
  if (page.url && page.indexable) urlToPage.set(page.url, page);
}
const clickDepth = new Map();
clickDepth.set(HOME_URL, 0);
const bfsQueue = [HOME_URL];
let maxClickDepth = 0;
while (bfsQueue.length) {
  const current = bfsQueue.shift();
  const currentDepth = clickDepth.get(current) || 0;
  const page = urlToPage.get(current);
  if (!page) continue;
  for (const target of page.outgoing) {
    if (!urlToPage.has(target)) continue;
    if (clickDepth.has(target)) continue;
    const nextDepth = currentDepth + 1;
    clickDepth.set(target, nextDepth);
    if (nextDepth > maxClickDepth) maxClickDepth = nextDepth;
    bfsQueue.push(target);
  }
}
```

كل صفحة تحصل `page.clickDepth` (null لو unreachable). الصفحات اللي `depth > 3` تنحفظ في `highClickDepthPages`. الصفحات indexable اللي `clickDepth === null` تنحفظ في `unreachableIndexable`.

**في summary** (JSON output):
- `maxClickDepth: 3`
- `clickDepthLimit: 3`
- `pagesWithHighClickDepth: 0`
- `unreachableFromHome: 0`
- `clickDepthViolations: []`

**في markdown report**:
- Header lines للـ max depth + limit + counts
- Section جديد "Click Depth (BAI-IDX-04)" فيه قائمة الصفحات اللي تتجاوز الحد (أو "None" لو الكل OK)
- Section "Indexable pages unreachable from /" (لو في)
- عمود جديد "Click Depth" في الـ table الرئيسي

#### Region C: Exit Code Enforcement (جديد — 25 سطر)

في نهاية `auditOnly()`:

```js
const failures = [];
if (report.summary.orphanPages > 0) failures.push(`orphan_pages=${report.summary.orphanPages} (expected 0)`);
if (report.summary.brokenLinks > 0) failures.push(`broken_links=${report.summary.brokenLinks} (expected 0)`);
if (report.summary.maxClickDepth > report.summary.clickDepthLimit) failures.push(`max_click_depth=${report.summary.maxClickDepth} exceeds limit=${report.summary.clickDepthLimit}`);
if (report.summary.pagesWithHighClickDepth > 0) failures.push(`pages_with_high_click_depth=${report.summary.pagesWithHighClickDepth} (expected 0)`);
if (report.summary.unreachableFromHome > 0) failures.push(`unreachable_indexable=${report.summary.unreachableFromHome} (expected 0)`);
if (failures.length) {
  console.error("");
  console.error("❌ BAI-IDX-04 acceptance check FAILED:");
  for (const failure of failures) console.error(`   - ${failure}`);
  console.error(`   See ${REPORT_MD} for details.`);
  process.exit(1);
}
console.log("");
console.log("✅ BAI-IDX-04 acceptance check PASSED: 0 orphans, 0 broken, max click depth " + report.summary.maxClickDepth + " ≤ " + report.summary.clickDepthLimit + ".");
```

#### Region D: REPORT_DIR anchored على project root (3 lines)

```diff
- const REPORT_DIR = path.join(ROOT, "reports", "internal-links");
+ // BAI-IDX-04: report directory is anchored at the project root (not ROOT)
+ // so dist/ rebuilds don't delete past reports. `--source` only changes
+ // which HTML files the audit reads — outputs stay in the project tree.
+ const REPORT_DIR = path.resolve(process.cwd(), "reports", "internal-links");
```

**السبب**: قبل التغيير، `--source dist/client` يخلّي ROOT = `dist/client`، فالـ `REPORT_DIR` = `dist/client/reports/internal-links/` → يحذفها كل build. الحين الـ reports في `reports/internal-links/` (project root) بشكل ثابت.

### Change 3: `package.json` (3 lines)

```diff
- "internal-links:audit": "node scripts/internal-links-audit.mjs && node scripts/internal-linking-architecture.mjs",
- "internal-links:inventory": "node scripts/internal-linking-architecture.mjs",
- "internal-links:architecture:fix": "node scripts/internal-linking-architecture.mjs --fix",
+ "internal-links:audit": "node scripts/internal-links-audit.mjs && node scripts/internal-linking-architecture.mjs --source dist/client",
+ "internal-links:inventory": "node scripts/internal-linking-architecture.mjs --source dist/client",
+ "internal-links:architecture:fix": "node scripts/internal-linking-architecture.mjs --source dist/client --fix",
```

**السبب**: بدون `--source dist/client`، الـ script يستخدم `process.cwd()` (project root) كـ ROOT. المشروع فيه:
- `public/500.html` (legacy)
- `public/icons.svg` (sprite، ما هي صفحة)
- `dist/server/...` (build artifacts)
- `reports/...` (سجلات)
- 404.html

كل هذه `isPublicIndexableRelPath()` ترجع false. النتيجة: `indexablePages: 0` حتى مع sitemap 180 URL. **الـ audit يطلع بلا فايدة بدون الـ flag**.

مع `--source dist/client`:
- الـ script يقرأ 195 HTML من `dist/client/`
- 179 منهم indexable (يطابقوا canonical + لا noindex + لا owner decision)
- النتائج تطلع صحيحة

---

## DEC new

### DEC-BAI-IDX-04-2026-07-25-001: `pnpm run internal-links:audit` = gate for BAI-IDX-04 acceptance

`scripts/internal-linking-architecture.mjs` الآن **enforces** BAI-IDX-04 acceptance criteria as exit codes. الـ `auditOnly()` mode (default لما `pnpm run internal-links:audit` يتنفذ) يحسب:
- `orphanPages > 0` → exit 1
- `brokenLinks > 0` → exit 1
- `maxClickDepth > 3` → exit 1
- `pagesWithHighClickDepth > 0` → exit 1
- `unreachableFromHome > 0` → exit 1

الـ thresholds (3 للـ click depth، 0 للـ orphans/broken/unreachable) مسجلة في الـ summary كـ `clickDepthLimit` و`ACCEPTANCE_CRITERIA` constants. لو حصل regression في أي metric، الـ build يطلع بـ exit 1. أي agent مستقبلي يشوف `❌ BAI-IDX-04 acceptance check FAILED` يقدر يفتح `reports/internal-links/full-inventory.md` ويشوف الـ offending rows.

**Reversal cost**: low — احذف الـ exit-code block في `auditOnly()`، أو غيّر الـ thresholds. الـ underlying logic (BFS + canonical check) يبقى يعمل ويفيد debugging.

### DEC-BAI-IDX-04-2026-07-25-002: BFS click depth is the canonical depth metric

لما أي agent مستقبلي يحتاج يقيس "كم click للوصول لصفحة من الرئيسية"، يستخدم BFS من `/` على الـ outgoing internal links المحسوبة في `internal-linking-architecture.mjs`. لا يحسب من redirects (canonical=target) ولا من noindex pages. الـ metric `maxClickDepth` يطلع في summary و في markdown report.

**Do not** تحسب depth من ملف sitemap (ما يعكس الترابط الفعلي) أو من URL alone (ما يميز indexable من redirect).

### DEC-BAI-IDX-04-2026-07-25-003: لا orphan = لا حاجة لاضافة inbound links صريحة

`/kernel/offline/` هو الـ orphan الوحيد (قبل BAI-IDX-04). بقية 179 صفحة indexable عندها ≥1 inbound link:
- min inbound = 1 (authors/، 3 pages)
- max inbound = 188 (الرئيسية)
- average inbound = 49

ما في صفحة تتطلب link جديد (blog categories كلها عندها inbound links من hub pages، city pages كلها inbound من /solutions/ + sector pages، إلخ). المهمة تركّزت على:
1. **إزالة الـ orphan الموجود** (KernelLayout fix)
2. **منع regression** (audit gate)

### DEC-BAI-IDX-04-2026-07-25-004: redirect files (`/solutions/cities/{city}/`) لا تُحتسب في الـ graph

الـ 6 redirect files (301 → `/solutions/{sector}/{city}/`) عندها `noindex, follow`. الـ audit يستثنيهم من:
- `indexable` (لأن noindex)
- `canonicalIssues` (لأن mismatch مقصود — canonical = redirect target)

**Do not** تحاول تضيف inbound links للـ redirect files. لو حصل، تكون تكلفة زائدة (الزائر يتبع redirect ما يوصل لمحتوى). الـ graph الفعلي يحتوي الـ 6 city pages الحقيقية في `/solutions/{sector}/{city}/`، وهذي عندها inbound links من:
- `/solutions/` index
- القطاع (`/solutions/banking-ai-governance/`, إلخ) index
- Hub pages
- Blog posts
- etc.

---

## Risks Addressed

- **R1 (orphan pages تضيع crawl budget)**: closed. الـ audit gate يفشل `pnpm run internal-links:audit` لو ظهر orphan جديد. `/kernel/offline/` صار noindex (السبب الجذري للـ orphan السابق).
- **R2 (click depth > 3 = crawl depth penalty)**: closed. الـ audit يحسب click depth من BFS ويفشل لو max > 3. العمق الحالي = 3 (متوسط).
- **R3 (broken production links تتراكم)**: closed. الـ audit يفشل لو `brokenLinks > 0`. مفيش broken links في الـ build الحالي.
- **R4 (canonical mismatches false-positive على redirect files)**: closed. `&& !hasNoindexDirective(html)` يصفّر الـ 6 false-positives.
- **R5 (audit gate ما كان موجود — السكربت يطلع 0 بس ما fail الـ build)**: closed. exit 1 على أي AC مكسور + banner واضح.

## Risks Remaining

- **noHrefLinks = 11**: 11 `<a>` بدون `href` (أزرار تفاعلية في kernel pages). ليست broken links (ما هي links أصلاً). الـ audit يحسبها كـ informational. للـ strictness: ممكن تتحول لـ `<button>` لكن التغيير يمس 11 مكان في kernel. **out of scope لـ BAI-IDX-04** — تذكرة منفصلة لو تبي.
- **hashIssues = 93**: 93 `<a href="#section">` تشير لهدف غير موجود في نفس الصفحة. الأكثر في migrated content. **out of scope لـ BAI-IDX-04** — تذكرة منفصلة.
- **لا unit test لـ BFS logic**: الـ audit هو integration test. لو تبي unit tests، أضف `scripts/__tests__/click-depth.test.mjs` بـ `node --test`. **out of scope**.
- **الـ `--source dist/client` flag ضروري** للـ audit يطلع نتائج صحيحة. لو حدا شال الـ flag من `package.json`، الـ audit يطلع 0 indexable ويعدّي بـ exit 0 (falsely). mitigation: TODO comment في `package.json`، أو unit test يتحقق إن `--source dist/client` موجود.
- **الـ BFS لا يحسب redirects كـ edges** (redirect files = 1 click، لكن فعلياً 0 لأن الـ redirect فوري). الـ metric يبقى صحيح (يحسب pages من graph الـ indexable بس).

## Out-of-Scope (تذكرة منفصلة)

1. **kernel/offline inbound link**: ممكن نضيف link من `/kernel/` sidebar footer ("متصل بالإنترنت؟ تحقق من حالة الشبكة"). الـ offline page يبقى في الـ allowlist للـ noindex، فـ click depth ما يتأثر. Skip.
2. **kernel pages noHrefLinks → buttons**: 11 `<a>` بدون href في kernel. أخلاقياً، هذا anti-pattern (a11y). لكن لا يؤثر على link graph.
3. **hash target fixes (93)**: معظمها في migrated content. يحتاج migration review.
4. **unit tests للـ BFS**: `scripts/__tests__/click-depth.test.mjs` بـ fixtures.
5. **redirects → real pages**: 6 redirect files في `solutions/cities/` تخدم SEO legacy URLs. ممكن نخليها canonical (توقف عن redirect) عشان نخلي inbound links تحسب. لكن هذا يكسر legacy redirect chains في `_redirects` (314 entries).

---

## Related

- **BAI-IDX-03** (2026-07-25): توحيد sitemap و robots — هذه البنية التحتية اللي BAI-IDX-04 تعتمد عليها (`sitemap.xml` = single source of truth، 180 URL indexable).
- **BAI-SEO-003-S3** (2026-07-25): bidirectional hreflang pair map — 7 EN pages fixed.
- **P0-1 / P0-2 / P0-3** (2026-07-19): tenant isolation + CI test gate + observability — البنية التحتية لـ gates.
- `report/2026-07-25-bidirectional-hreflang-pair-map.md` (BAI-SEO-003-S3).
- `scripts/internal-linking-architecture.mjs` (lines 186-307 للـ buildInventory، 309-560 للـ relatedLinks + apply + render).
- `src/layouts/KernelLayout.astro` (line 47-56 للـ destructure، line 69-82 للـ BaseLayout props).

---

## Suggested commit message

```
feat(seo): BAI-IDX-04 — zero indexable orphans + click depth ≤ 3 + audit gate

`pnpm run internal-links:audit` now enforces the BAI-IDX-04 acceptance
criteria as exit codes. The audit computes BFS click depth from / and
tracks orphan / broken / high-depth / unreachable pages. Any regression
fails the build with a clear banner and a pointer to the markdown report.

What changed (3 files):
  - src/layouts/KernelLayout.astro (2 lines):
    destructure `robots` from Astro.props + forward it to BaseLayout.
    Fixes /kernel/offline/ which passed `robots="noindex, follow"` but
    the layout never forwarded the prop, so the dist emitted `index,
    follow` and the audit counted the page as an indexable orphan.
  - scripts/internal-linking-architecture.mjs:
    (a) canonical_mismatch check now skips noindex pages (fixes 6
        false-positives on the solutions/cities/{city}/ 301 redirect
        files which intentionally point canonical at the redirect
        target).
    (b) new BFS click-depth computation: maxClickDepth, clickDepthLimit,
        pagesWithHighClickDepth, unreachableFromHome, clickDepthViolations
        in the summary; a dedicated "Click Depth (BAI-IDX-04)" section in
        the markdown report + a new "Click Depth" column in the table.
    (c) auditOnly() now exits 1 if any AC is broken (orphan > 0,
        broken > 0, max depth > 3, high depth > 0, unreachable > 0).
    (d) REPORT_DIR anchored at the project root so dist/ rebuilds don't
        delete past reports.
  - package.json:
    `internal-links:audit` / `inventory` / `architecture:fix` now pass
    --source dist/client. Without it, the audit walks the project root
    (which holds legacy 500.html + report artifacts) and reports 0
    indexable pages.

Verification:
  - pnpm run internal-links:audit → exit 0, banner PASSED
  - 0 indexable orphans (was 1: /kernel/offline/)
  - 0 broken links in production
  - 0 canonical issues (was 6)
  - max click depth from / = 3 (limit 3)
  - 0 indexable pages unreachable from /
  - 179 indexable pages in graph (was 180; /kernel/offline/ correctly
    excluded as noindex)
  - ASTRO_TELEMETRY_DISABLED=1 pnpm build → 196 pages, 0 errors
  - pnpm run verify:all → 5/5 pass, 0 errors
  - pnpm run performance:budget → exit 0
  - pnpm run seo:gate → 6/6 hreflang, 5/5 service, 0 errors
  - Failure path test: mocked maxClickDepth=4 → exit 1, banner FAILED

DEC new:
  - DEC-BAI-IDX-04-2026-07-25-001: pnpm run internal-links:audit is the
    gate. Thresholds: 0 orphans, 0 broken, max depth 3, 0 high-depth,
    0 unreachable.
  - DEC-BAI-IDX-04-2026-07-25-002: BFS click depth is the canonical
    depth metric.
  - DEC-BAI-IDX-04-2026-07-25-003: No new inbound links needed; the
    existing graph is well-connected (min 1, max 188, avg 49 inbound
    links per indexable page).
  - DEC-BAI-IDX-04-2026-07-25-004: redirect files (solutions/cities/
    {city}/) are excluded from the graph; their canonical points to
    the real target, not the file path.
```
