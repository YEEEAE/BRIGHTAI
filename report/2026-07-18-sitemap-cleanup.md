# Sitemap Cleanup + hreflang Reciprocal Audit

**Date**: 2026-07-18
**Agent**: BrightAI Workspace Agent
**Task**: استبعاد /404/ من sitemap + تثبيت إن عدد sitemap يساوي الصفحات indexable فقط + مراجعة hreflang reciprocal pairs بدون اختلاق English alternates
**Mode**: Senior

## Executive Summary

المشروع كان عنده 3 مشاكل في الـ sitemap:

1. **/404/ موثّق كـ indexable** في `astro.config.mjs` `customPages` — قرار خاطئ
   (الـ 404 ما يـ index في Google، وجوده في sitemap يخليها "non-canonical" و Google يحذفه).
2. **/sales-deck/ و /en/sales-deck/ مش في الـ sitemap** رغم إنهم indexable —
   نقص لأن في صفحات موجودة بدون ما تكون في الـ sitemap.
3. **i18n-pairs.ts ما فيها sales-deck pair** — الـ counterpart الفعلي موجود
   بالعربي والإنجليزي لكن ما هو موثّق.

كل الإصلاحات اتنفذت والـ acceptance criteria كلها محققة.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `astro.config.mjs` | Edited | أزلت `/404/` من `customPages` + حدّثت التعليق المضلل |
| `scripts/seo-url-map.mjs` | Edited | أضفت `sales-deck` لـ `ROOT_INDEX_DIRS` و `TRAILING_SLASH_ROUTE_PATTERNS` (يضمن trailing slash للـ canonical) |
| `scripts/generate-sitemap-all-pages.mjs` | Edited | أضفت `sales-deck/index.html` و `en/sales-deck/index.html` للـ `groupRelPath` allowlist |
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

### المشكلة 3: i18n-pairs.ts ما فيها sales-deck pair

أضفت pair `sales-deck ↔ en/sales-deck` للـ `LEGAL_I18N_PAIRS`. هذا
**مو اختراق** — counterparts فعلي موجود بالعربي والإنجليزي. الـ pair
موجود لأي tool يقرأ `LEGAL_I18N_PAIRS` للـ language switcher consistency.

## Verification

### Build

```
pnpm run build → 190 pages, 0 errors
Generated sitemap.xml with 168 public URLs
```

### Sitemap Quality

| Check | Result | Notes |
|---|---|---|
| XML valid (`xmllint --noout`) | ✅ VALID | sitemap parses |
| Total URLs | **168** | matches indexable pages |
| `/404/` in sitemap | ✅ 0 | excluded |
| `customers/*` in sitemap | ✅ 0 | 3 noindex pages excluded |
| `thank-you` in sitemap | ✅ 0 | noindex page excluded |
| `design/*` in sitemap | ✅ 0 | system pages excluded (groupRelPath) |
| `.html` in loc | ✅ 0 | clean trailing-slash URLs |
| `noindex` URLs in sitemap | ✅ 0 | analyzer filters via `hasNoindexDirective` |
| HTTP 200 on all 168 URLs | ✅ 168/168 | tested via `http.get` against `dist/server/entry.mjs` |
| Canonical self-reference | ✅ 168/168 | `loc` matches `<link rel="canonical">` (after URL decode) |
| hreflang AR↔EN reciprocal | ✅ 6/6 pairs | 5 legal + 1 sales-deck |
| Hreflang without counterpart | ✅ 0 invented | `findCounterpartRelPath` only links if both exist |

### SEO Audit Scripts

```
node scripts/verify-all.mjs     → 5/5 فحص ناجح (189 HTML، 168 sitemap، 0 broken links)
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
AR with EN: 6 (5 legal + 1 sales-deck)
EN with AR: 6 (5 legal + 1 sales-deck)

=== HTTP 200 on all 168 URLs ===
Total: 168
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

- **HSTS في `render.yaml` ما يظهر في curl -I local**: `render.yaml` headers
  تطبّق على Render edge، مو على Node process. ما له علاقة بهذا التغيير.

- **CSP Report-Only** (pre-existing، not changed): `src/middleware.ts` يضبط
  `Content-Security-Policy-Report-Only` بس — مو enforcement. Phase 2 يعتمد
  على 0 violations لأسبوع.

- **كل `0 sales-deck` من قبل كان صحيح** تقنياً (الصفحة مو جودة عالية)،
  لكن الصفحات نفسها كانت indexable في HTML — يعني Google يحتمل فهرستها
  بدون sitemap. الإصلاح يضمن إنها **مفهرسة** بشكل **صريح** عبر
  sitemap submission.

## Follow-up Suggestions

1. **Sub-sitemap للـ blog posts** (لما يصير عدد المقالات > 100): حالياً
   الـ sitemap ملف واحد بـ 168 URL. Google يقبل حتى 50,000 URL/file.
   حالياً OK.
2. **`image-sitemap.xml` يتزامن مع `sitemap.xml`**: حالياً الاثنين
   generated بشكل منفصل. تأكد إن الصور ما تنحذف لو الـ AR sales-deck
   يضاف (يستخدم نفس الصور).
3. **City pages** (Khobar, Mecca, Medina): مذكور في brain.md كـ known
   issue. الإصلاح رفع العدد من 3 إلى 6 cities، لكن 3 pages فقط لها
   location pages في الـ sitemap (`solutions/[sector]/[city]/`).
4. **IndexNow submission** بعد deploy: الـ URLs الجديدة (sales-deck) تحتاج
   submission عبر `npm run indexnow:trigger`.

## Commit Message (proposed)

```
chore(seo): clean sitemap — remove /404/, add sales-deck pair (AR↔EN)

- astro.config.mjs: remove /404/ from customPages (404 must stay out of sitemap)
- scripts/seo-url-map.mjs: add sales-deck to ROOT_INDEX_DIRS + TRAILING_SLASH_ROUTE_PATTERNS
- scripts/generate-sitemap-all-pages.mjs: allowlist sales-deck/index.html + en/sales-deck/index.html
- src/data/i18n-pairs.ts: add sales-deck pair (counterpart is real, not invented)

Acceptance:
- sitemap.xml: 168 URLs (up from 166)
- 0 forbidden URLs (/404/, customers/*, thank-you, design/*)
- 0 noindex URLs in sitemap
- 6/6 AR↔EN reciprocal hreflang pairs (5 legal + 1 sales-deck)
- 168/168 URLs return HTTP 200
- 0 canonical self-reference mismatches
- XML valid (xmllint)
- verify:all 5/5 pass
- seo:all 0 errors, 0 warnings
```

## Brain Updates

- **Section 1.1 (Sitemap URLs)**: 166 → 168 (+2 sales-deck)
- **Section 3 (Known Issues)**: KI-054 (sitemap contract enforcement) — حُلّ
  هذا الجزء منه (4 / 5 / 6 acceptance criteria مكتفية الآن)
- **Section 4 (Decisions Log)**: DEC جديد
  (DEC-SITEMAP-CLEANUP-2026-07-18-001): /404/ MUST stay out of sitemap
- **Section 5 (Token/Component Inventory)**: ما يتأثر (هذا SEO infra)

## Status

- **Verified locally**: build + verify:all + seo:all + 168/168 HTTP 200
- **Uncommitted** (per قاعدة الـ brain: المستخدم يسوي الـ commit بنفسه،
  الدفع عبر main فقط PR، لا branch جديد)
- **يحتاج user**: commit + push + Render auto-redeploy + IndexNow trigger
