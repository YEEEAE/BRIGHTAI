# BAI-SEO-004-S7 — إدراج صفحتي /events/ و /kernel/api/ الناقصتين في الـ sitemap

**Date**: 2026-08-08
**Agent**: BrightAI Workspace Agent
**Task**: حل فجوات BAI-SEO-004 — صفحات indexable خارج الـ sitemap
**Mode**: Senior

## الملخص التنفيذي

أوديت SEO (`seo-audit` / `sitemap` الفحص) ادّعى إن "29 ملف خارج السايت ماب". حققت في الادعاء هذا بشكل كامل، والنقاط التالية:

1. **الرقم 29 كان ضد نسخة قديمة** من الموقع قبل إصلاح BAI-IDX-04 (اللي ضم 17 صفحة `/answer/` + 5 صفحات `/lp/`). بعد الفحص الفعلي على `main` الحالي، الرقم الحقيقي = **16 ملف indexable خارج السايت ماب**.
2. من الـ 16، **14 استبعاد مقصود بالتصميم** وليست bugs:
   - `design/*` (5 صفحات) → `noindex` مقصود.
   - `thank-you/` → `noindex` (صفحة شكر بعد الفورم).
   - `kernel/offline/` → `noindex` (صفحة أوفلاين).
   - `kernel/admin/quota/` → `noindex` (صفحة إدارية).
   - 6 صفحات `solutions/cities/*` → هذه stubs تستخدم `Astro.redirect()` + `<meta refresh>` + `noindex` + canonical تشير للصفحة الحقيقية (استبعاد مقصود صحيح).
   - (وصفحات `blog/category/*` الخمس تظهر "ناقصة" في فحص المقارنة النصية بسبب أن العناوين في السايت ماب URL-encoded عربي — هي فعليًا موجودة في السايت ماب.)
3. **الفجوة الحقيقية الوحيدة = صفحتان indexable حقيقيتين بمحتوى فعلي** كانتا خارج السايت ماب بالخطأ:
   - **`/events/`** — فهرس الفعاليات، 3471 كلمة، canonical `/events/`، schema `CollectionPage`. `index, follow` ✓.
   - **`/kernel/api/`** — صفحة وثائق الـ API، 11,347 كلمة، static من `src/pages/kernel/api.astro`. `index, follow` ✓.

**السبب الجذري** (في `scripts/generate-sitemap-all-pages.mjs`):
- `events/index.html` ناقص من whitelist صفحات الـ pages group.
- الـ exclusion القديم `normalized.includes("/api/")` كان يلتقط `kernel/api/index.html` ويستبعده **قبل** ما يوصل لـ whitelist الكيرنل — لاحظ إن `includes` يطابق في أي مكان بالسلسلة، فكان يرمي أي ملف فيه `/api/` حتى لو تحت `kernel/`.

**الإصلاح** (4 تعديلات دقيقة):
1. `includes("/api/")` → `startsWith("api/")` (يستثني فقط مجلد `api/` على الجذر، ما يمس `kernel/api`).
2. أضفت `kernel/api.html` + `kernel/api/index.html` لـ kernel whitelist.
3. أضفت `events/index.html` لـ pages whitelist.
4. في `resolveSourceFiles` أضفت `dir === "kernel/api"` يشير لـ `src/pages/kernel/api.astro` عشان `lastmod` يطلع صحيح.

**النتيجة**: السايت ماب صار **258 URL** (كان 256)، الصفحتان ظاهرتين مع `lastmod` صحيح من git (2026-07-31 / 2026-08-02)، وكل فحوصات SEO و الـ build و verify ناجحة.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `scripts/generate-sitemap-all-pages.mjs` | Edited | 4 تعديلات: `startsWith("api/")` بدل `includes("/api/")`، إضافة `kernel/api` لـ kernel whitelist، إضافة `events/index.html` لـ pages whitelist، فرع `kernel/api` في `resolveSourceFiles` |
| `dist/client/sitemap.xml` | Generated | يتضمن `/events/` و `/kernel/api/` (258 URL) |
| `.agents/brain.md` | Edited | entry BAI-SEO-004-S7 في سجل التغييرات |
| `report/2026-08-08-bai-seo-004-sitemap-gap.md` | Created | هذا التقرير |

## Verification Results

| Check | Result |
|---|---|
| `npm run sitemap:generate` | ✅ exit 0 — **258 URL** (كان 256) |
| `/events/` في السايت ماب | ✅ مع lastmod 2026-07-31 |
| `/kernel/api/` في السايت ماب | ✅ مع lastmod 2026-08-02 |
| gap-check (ملفات خارج السايت ماب) | ✅ 14 متبقية — كلها مقصودة (noindex/redirect) |
| `npm run seo:gate` | ✅ 0 أخطاء، 0 تحذيرات (258 sitemap URLs) |
| `npm run seo:hreflang` | ✅ 0 أخطاء (259 sets) |
| `npm run build` | ✅ 0 أخطاء |
| `node scripts/verify-all.mjs` | ✅ 5/5 |
| `scripts/seo-url-map.mjs` + `sitemap-contract.mjs` | ✅ غير معدلين — يعتبرون الصفحتين indexable من قبل |

## Risks Remaining

- **الـ 14 ملف المتبقية خارج السايت ماب** مقصودة بالتصميم — لو مرّ audit آلي بعدّها كـ gaps، يحتاج الـ audit يضيفها لـ allowlist بدل ما تتكرر كـ "مشكلة".
- **`blog/category/*`** تظهر كـ "ناقصة" في فحص مقارنة نصية بسبب الـ URL-encoding العربي — ليست مشكلة فعلية، بس تلوّث التقارير. مرشحة لتعديل audit مستقبلاً (فك encode قبل المقارنة).
- **`solutions/cities/*`** stubs بـ `noindex` + canonical — استبعاد صحيح تقنياً، لكن تحتاج مراجعة لاحقة: هل الهدف منها SEO للـ local pages الحقيقية عبر الـ canonical، ولا تستاهل تكون صفحات حقيقية؟ (مرتبط بـ KI-002 في brain.md).

## Follow-up Suggestions

- تحديث أداة الفحص (audit script) لتتعرف على الـ 14 صفحة المقصودة كـ allowlist + فك URL-encoding لـ `blog/category/*` — عشان التقارير الجاية توقف ترمي أرقام غلط.
- بعد الـ deploy: تشغيل `npm run indexnow:trigger` عشان Bing يتعلم بالسايت ماب الجديد (258 URL) — خصوصاً `/events/` و `/kernel/api/` اللي كانت مخفية.
- إرسال `/events/` و `/kernel/api/` للفهرسة عبر Google Search Console (URL Inspection → Request Indexing) لأنها صفحات موجودة من زمان ومحتواها قوي (11k كلمة لوحدة /kernel/api/).

## Rollback Plan

```
git checkout -- scripts/generate-sitemap-all-pages.mjs
npm run sitemap:generate
npm run build
```

التغيير تعديل أدوات توليد فقط — ما لمس أي محتوى عربي منشور، ما غيّر أي canonical/hreflang/slug، وما حذف أي صفحة. الـ rollback آمن بالكامل (الصفحتان كانتا تعملان قبل، بس بلا سايت ماب).
