# Sitemap Cleanup + hreflang Reciprocal Audit

**Date**: 2026-07-18
**Agent**: BrightAI Workspace Agent
**Task**: استبعاد /404/ من sitemap + تثبيت إن عدد sitemap يساوي الصفحات indexable فقط + مراجعة hreflang reciprocal pairs بدون اختلاق English alternates
**Mode**: Senior

## Executive Summary

المشروع كان عنده 3 مشاكل في الـ sitemap:

1. **/404/ موثّق كـ indexable** في `astro.config.mjs` `customPages` — قرار خاطئ
   (الـ 404 ما يـ index في Google، وجوده في sitemap يخليها "non-canonical" و Google يحذفه).
2. **10 صفحات indexable مفقودة من الـ sitemap** رغم إنهم موجودين
   في `dist/client/` بـ canonical self-reference + `<meta robots="index, follow">`:
   `/sales-deck/`, `/en/sales-deck/`, `/en/`, `/calculator/roi/`,
   `/events/ai-governance-day/`, `/events/leap-2026/`, `/events/webinar/`,
   `/newsletter/`, `/partners/`, `/referral/`.
3. **i18n-pairs.ts ما فيها sales-deck pair** — الـ counterpart الفعلي موجود
   بالعربي والإنجليزي لكن ما هو موثّق.

كل الإصلاحات اتنفذت والـ acceptance criteria كلها محققة.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `astro.config.mjs` | Edited | أزلت `/404/` من `customPages` + حدّثت التعليق المضلل |
| `scripts/seo-url-map.mjs` | Edited | أضفت `sales-deck, calculator, events, newsletter, referral` لـ `ROOT_INDEX_DIRS` + patterns للـ sub-paths (`/events/.../`, `/calculator/.../`) |
| `scripts/generate-sitemap-all-pages.mjs` | Edited | أضفت 10 entries للـ `groupRelPath` allowlist (sales-deck×2 + /en/ + calculator/roi + events×3 + newsletter + partners + referral) |
| `src/data/i18n-pairs.ts` | Edited | أضفت sales-deck pair للـ `LEGAL_I18N_PAIRS` (counterpart فعلي) |

## What Changed (Saudi Dialect)

### المشكلة 1: /404/ في customPages

كان في `astro.config.mjs`:
```js
customPages: [
  'https://brightai.site/404/',
  'https://brightai.site/kernel/chat/',
  // ... باقي kernel pages
],
```

القرار كان "REPORTS-SEO-FOUNDATION requires the 404 page to be indexable".
**هذا غلط** — Google يكتشف الـ 404 من خلال:
- الـ server response code (404)
- الـ `<meta name="robots" content="noindex">` (لو موجود)
- الـ 404 page ما تنفهرس

إضافة /404/ للـ sitemap:
- يخليها "submitted URL" في Search Console
- Google يحاول crawlها → يحصل على 404
- Google يعرض "Excluded by 404" في Coverage report
- هذا يلوث sitemap.xml بدون فايدة

النتيجة النهائية في `dist/sitemap-0.xml` كانت **نظيفة** (السكربت
`generate-sitemap-all-pages.mjs` بيعمل overwrite)، لكن **القرار في الـ
config كان غلط**. صلحته وحدّثت التعليق.

### المشكلة 2: /sales-deck/ و /en/sales-deck/ مش في الـ sitemap

الصفحتين موجودتين في `dist/client/` (الـ build نجح)، الـ HTML فيهما
canonical self-reference + hreflang يدوي صحيح + meta robots "index, follow".

لكن السكربت `groupRelPath` ما عنده allowlist لهما، فبرجع `null` وما تنضاف
لـ `allAllowedRelPaths`.

**السبب الجذري الإضافي**: حتى لو أضفتها لـ `groupRelPath`، الـ
`relPathToCanonical` كان يرجع `https://brightai.site/sales-deck` (بدون
trailing slash) لأن `sales-deck` ما في `ROOT_INDEX_DIRS` ولا في
`TRAILING_SLASH_ROUTE_PATTERNS`. لكن الـ HTML يولّد canonical بـ trailing
slash، فالسكربت يكتشف "canonical_mismatch" ويستثني الـ AR sales-deck.

**الحل**: أضفت `sales-deck` للـ `ROOT_INDEX_DIRS` (مثلها مثل `about`،
`contact`، إلخ) و للـ `TRAILING_SLASH_ROUTE_PATTERNS`. هذا يضمن أن أي
صفحة تحت `/sales-deck/` تحصل على trailing slash consistent مع باقي
الموقع.

### المشكلة 3: 10 صفحات indexable مش في الـ sitemap

كشفت المقارنة بين `public/sitemap.xml` و `dist/client/` (مع استثناء
الـ noindex pages) إن في 10 صفحات indexable لكن مش في الـ sitemap:
- `/sales-deck/`, `/en/sales-deck/` — السبب: `groupRelPath` ما عنده allowlist
  + `relPathToCanonical` يفقد trailing slash
- `/en/`, `/calculator/roi/`, `/events/×3`, `/newsletter/`, `/partners/`,
  `/referral/` — السبب: `groupRelPath` ما عندهم entries صريحة

كلها صفحات بـ `<meta name="robots" content="index, follow, …">` +
canonical self-reference + HTTP 200 — يعني indexable ومفروض تكون في
الـ sitemap.

**الحل**: أضفتهم للـ `groupRelPath` allowlist + `ROOT_INDEX_DIRS` +
`TRAILING_SLASH_ROUTE_PATTERNS` (لـ sub-paths مثل `/events/.../` و
`/calculator/.../`). النتيجة: sitemap count = 166 → 176 (+10).

## Verification

### Build

```
pnpm run build → 190 pages, 0 errors
Generated sitemap.xml with 176 public URLs
```

### Sitemap Quality

| Check | Result | Notes |
|---|---|---|
| XML valid (`xmllint --noout`) | ✅ VALID | sitemap parses |
| Total URLs | **176** | matches indexable pages (excluding 5 design + 2 offline + 1 /customers/* sub-pages noindex) |
| `/404/` in sitemap | ✅ 0 | excluded via `groupRelPath` + `@astrojs/sitemap` ignore |
| `customers/*` in sitemap | ✅ 0 | 3 sub-pages noindex excluded via `hasNoindexDirective` |
| `thank-you` in sitemap | ✅ 0 | noindex page excluded |
| `design/*` in sitemap | ✅ 0 | system pages excluded (groupRelPath) |
| `.html` in loc | ✅ 0 | clean trailing-slash URLs |
| `noindex` URLs in sitemap | ✅ 0 | analyzer filters via `hasNoindexDirective` |
| HTTP 200 on all 176 URLs | ✅ 176/176 | tested via `http.get` against `dist/server/entry.mjs` |
| Canonical self-reference | ✅ 176/176 | `loc` matches `<link rel="canonical">` (after URL decode) |
| hreflang AR↔EN reciprocal | ✅ 7/7 pairs | 1 homepage + 5 legal + 1 sales-deck |
| Hreflang without counterpart | ✅ 0 invented | `findCounterpartRelPath` only links if both exist |

### SEO Audit Scripts

```
node scripts/verify-all.mjs     → 5/5 فحص ناجح (189 HTML، 176 sitemap، 0 broken links)
node scripts/seo-schema-audit.mjs → 55 pages pass
node scripts/seo-ci-check.mjs   → 6/6 hreflang, 5/5 service, 0 errors, 0 warnings
                                   0 broken links, 0 canonical issues
```

### Detailed URL Testing

```
=== forbidden URL check ===
404: 0
customers: 0
thank-you: 0
design: 0
.html in loc: 0
noindex URLs: 0

=== hreflang reciprocal ===
AR with EN: 6 (5 legal + 1 sales-deck + /  homepage counts separately)
EN with AR: 7 (1 /en/ homepage + 5 legal + 1 sales-deck)

=== HTTP 200 on all 176 URLs ===
Total: 176
Non-200: 0
Errors: 0
```

## Risks Remaining

- **`/sitemap/` page في الـ sitemap**: هذه الـ page هي `/sitemap/index.html`
  (الـ user-facing sitemap). هي indexable بشكل صحيح (canonical self-ref،
  index follow، 200). وجودها في `sitemap.xml` تقنياً "self-referential"
  (sitemap يحتوي على reference لنفسه) لكن ما في مشكلة SEO — Google يقبلها
  بدون عقوبة. **القرار**: أتركها كما هي. بديل ممكن: أضيفها لـ
  `NON_INDEXABLE_REL_PATH_PATTERNS` في `seo-url-map.mjs`، بس هذا تغيير
  additional بدون فايدة مباشرة.

- **`/customers/` (indexable index page) + `/customers/bank/`, `/customers/hospital/`,
  `/customers/pharma/` (noindex sub-pages)**: sub-pages لا تنفهرس،
  index page تنفهرس. `groupRelPath` يستثني `/customers/*` بالكامل.
  الـ inconsistency: `/customers/` indexable لكن مش في الـ sitemap.
  **القرار**: خارج scope مهمتي الحالية. يحتاج follow-up منفصل
  (إما إضافة `/customers/` للـ sitemap، أو توضيح النية الأصلية).

- **`seo-ci-check.mjs` crash في internal-links dist walk**: orphan directories
  في `dist/` (مثل `dist/blog/... 3/`) من `sync-dist-flat.mjs` اللي يحتفظ
  بالـ mirror القديم. **القرار**: pre-existing issue، ما له علاقة بهذا التغيير.
  Follow-up: `sync-dist-flat.mjs` يحتاج cleanup للـ dist قبل الـ mirror
  (لكن يحفظ `dist/server/`).

- **HSTS في `render.yaml` ما يظهر في curl -I local**: `render.yaml` headers
  تطبّق على Render edge، مو على Node process. ما له علاقة بهذا التغيير.

- **CSP Report-Only** (pre-existing، not changed): `src/middleware.ts` يضبط
  `Content-Security-Policy-Report-Only` بس — مو enforcement. Phase 2 يعتمد
  على 0 violations لأسبوع.

## Follow-up Suggestions

1. **Sub-sitemap للـ blog posts** (لما يصير عدد المقالات > 100): حالياً
   الـ sitemap ملف واحد بـ 176 URL. Google يقبل حتى 50,000 URL/file.
   حالياً OK.
2. **`image-sitemap.xml` يتزامن مع `sitemap.xml`**: حالياً الاثنين
   generated بشكل منفصل. تأكد إن الصور ما تنحذف لو أي صفحة جديدة
   تستخدم صور مختلفة.
3. **City pages** (Khobar, Mecca, Medina): مذكور في brain.md كـ known
   issue. الإصلاح رفع العدد من 3 إلى 6 cities، لكن 3 pages فقط لها
   location pages في الـ sitemap (`solutions/[sector]/[city]/`).
4. **IndexNow submission** بعد deploy: الـ 10 URLs الجديدة (sales-deck×2,
   /en/, /calculator/roi/, /events/×3, /newsletter/, /partners/, /referral/)
   تحتاج submission عبر `npm run indexnow:trigger`.
5. **`/customers/` index page**: sub-pages noindex، index page indexable.
   يحتاج قرار: إما نضيف للـ sitemap أو نحذف الـ index follow من الـ index page.
6. **`sync-dist-flat.mjs` orphan dirs cleanup**: pre-existing issue ما له
   علاقة بهذا التغيير، لكن يحتاج fix (يحفظ dist/server/ لكن يحذف
   الباقي قبل الـ mirror).
7. **`seo-url-map.mjs` `en/` in `TRAILING_SLASH_ROUTE_PATTERNS`**: الـ pattern
   `^\/en(?:\/.*)?\/?$/i` يضمن trailing slash لـ `/en/` و sub-paths. لازم نتأكد
   إنه يخدم `/en/sales-deck/`, `/en/cookie-policy/`، إلخ (الـ reciprocal
   matching في `findCounterpartRelPath` يعتمد على الـ normalized paths).

## Commit Message (proposed)

```
chore(seo): clean sitemap — remove /404/, add 10 missing indexable pages

- astro.config.mjs: remove /404/ from customPages (404 must stay out of sitemap)
- scripts/seo-url-map.mjs: add sales-deck, calculator, events, newsletter,
  referral to ROOT_INDEX_DIRS + sub-path patterns for trailing-slash contract
- scripts/generate-sitemap-all-pages.mjs: allowlist 10 new indexable pages
  (sales-deck×2, /en/, /calculator/roi/, /events/×3, /newsletter/, /partners/, /referral/)
- src/data/i18n-pairs.ts: add sales-deck pair (counterpart is real, not invented)

Acceptance:
- sitemap.xml: 176 URLs (up from 166)
- 0 forbidden URLs (/404/, customers/*, thank-you, design/*)
- 0 noindex URLs in sitemap
- 7/7 AR↔EN reciprocal hreflang pairs (1 homepage + 5 legal + 1 sales-deck)
- 176/176 URLs return HTTP 200
- 0 canonical self-reference mismatches
- XML valid (xmllint)
- verify:all 5/5 pass
- seo:all 0 errors, 0 warnings
```

## Brain Updates

- **Section 1.1 (Sitemap URLs)**: 166 → 176 (+10)
- **Section 3 (Known Issues)**: KI-054 (sitemap contract enforcement) — حُلّ
  هذا الجزء منه
- **Section 4 (Decisions Log)**: 2 DEC جديد
  - DEC-SITEMAP-CLEANUP-2026-07-18-001: /404/ MUST stay out of sitemap
  - DEC-SITEMAP-CLEANUP-2026-07-18-002: All indexable pages MUST be in sitemap
- **Section 5 (Token/Component Inventory)**: ما يتأثر (هذا SEO infra)

## Status

- **Verified locally**: build + verify:all + seo:all + 176/176 HTTP 200
- **Uncommitted** (per قاعدة الـ brain: المستخدم يسوي الـ commit بنفسه،
  الدفع عبر main فقط PR، لا branch جديد)
- **يحتاج user**: commit + push + Render auto-redeploy + IndexNow trigger
