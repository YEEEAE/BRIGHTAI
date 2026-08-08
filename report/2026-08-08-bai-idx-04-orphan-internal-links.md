# BAI-IDX-04 — إصلاح الصفحات اليتيمة: روابط داخلية سياقية لـ /answer/ و /lp/

**Date**: 2026-08-08
**Agent**: BrightAI Workspace Agent
**Task**: إصلاح BAI-IDX-04 — `orphan_pages` و `unreachable_indexable` (الروابط الداخلية + السايت ماب)
**Mode**: Senior

## الملخص التنفيذي

المشكلة كانت إن 22 صفحة مفهرسة (في الـ sitemap + مفهرسة في Google) ما كان عندها **أي رابط داخلي وارد** من صفحة على عمق ≤ 3 من الرئيسية. يعني الـ crawlers يوصلها نظريًا عبر الـ sitemap، لكن من ناحية الـ link graph هي "يتيمة" — ما عندها روابط واردة، وعمقها `null` من `/`. هذي الصفحات:

- **17 صفحة `/answer/`** (أسئلة شائعة متخصصة: PDPL، NCA ECC، سدايا، SAMA، ISO 42001، جدار حماية AI، إلخ) — كانت في الـ sitemap لكن بلا روابط واردة.
- **5 صفحات `/lp/`** (صفحات هبوط: pdpl, ecc, banking, healthcare, government) — مفهرسة لكنها **خارج الـ sitemap** أصلًا.

سوّينا حلاً على مرحلتين، كل الروابط **سياقية ومرئية وفي المحتوى** (ما في link farms خفية):

1. **روابط واردة**: أضفنا خريطة `INTERNAL_LINKS_BY_SLUG` في `src/pages/blog/[...slug].astro` تربط كل مقالة مدونة محورية (عمق 2 ✓) بصفحة answer/lp اللي موضوعها يطابقها. كل صفحة من الـ 22 صارت عندها 1–3 روابط واردة من مقالات blog مختلفة.
2. **السايت ماب**: أضفنا `/lp/` لـ `groupRelPath` + `resolveSourceFiles` في `scripts/generate-sitemap-all-pages.mjs`، فصارت صفحات الـ landing الخمس تظهر في الـ sitemap مع `lastmod` مربوط بتعديلات القالب.

القرار المعماري (بموافقة المستخدم): ربطنا `/lp/` + ضفناها للـ sitemap بدلاً من `noindex` — لأنها صفحات هبوط قوية تستهدف كلمات رئيسية قيمة (pdpl, ecc, sama, sfda, nca)، و noindex كان راح يضيع الاستثمار كله.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/pages/blog/[...slug].astro` | Edited | أضفت `INTERNAL_LINKS_BY_SLUG` (40 entry) + دمجها مع خريطة الفئات في `internalLinks` |
| `scripts/generate-sitemap-all-pages.mjs` | Edited | `groupRelPath`: إضافة `lp/` → "pages". `resolveSourceFiles`: إضافة `src/pages/lp/[slug].astro` لـ lastmod |
| `public/sitemap.xml` | Generated | يتضمن 17 answer + 5 lp (256 URL) |
| `report/2026-08-08-bai-idx-04-orphan-internal-links.md` | Created | هذا التقرير |

## Verification Results

| Check | Result |
|---|---|
| `npm run build` | ✅ 0 أخطاء |
| `npm run internal-links:audit` | ✅ `orphan_pages=0`, `unreachable_indexable=0`, `brokenLinks=0`, `maxClickDepth=3 ≤ 3` |
| `npm run sitemap:generate` | ✅ exit 0 (256 URL) |
| `npm run verify:all` (seo:gate + seo:hreflang + seo:schema) | ✅ 0 أخطاء، 0 تحذيرات |
| سايت ماب: answer URLs | ✅ 17 |
| سايت ماب: lp URLs | ✅ 5 |
| روابط واردة لكل صفحة | ✅ كل صفحة answer/lp عندها ≥ 1 من blog post |

تغطية الروابط الواردة قبل/بعد:

| صفحة | روابط واردة |
|---|---|
| answer/ai-governance-saudi-arabia | 2 |
| answer/ai-governance-saudi-arabia-ar | 2 |
| answer/ai-firewall-saudi | 2 |
| answer/ai-firewall-saudi-ar | 1 |
| answer/pdpl-ai-compliance | 2 |
| answer/pdpl-ai-compliance-ar | 2 |
| answer/ai-safety-platform-enterprise | 2 |
| answer/saudi-ai-safety-os | 1 |
| answer/audit-trail-saudi-ar | 2 |
| answer/nca-ecc-controls | 3 |
| answer/sdaia-generative-ai | 2 |
| answer/ai-banking | 2 |
| answer/ai-healthcare | 1 |
| answer/ai-governance-framework | 2 |
| answer/nca-compliance | 2 |
| answer/sama-ai | 3 |
| answer/iso-42001 | 3 |
| lp/pdpl | 2 |
| lp/ecc | 2 |
| lp/banking | 2 |
| lp/healthcare | 2 |
| lp/government | 2 |

## Risks Remaining

- **قسم "محتوى ذو صلة" في المدونة** صار فيه 5–7 روابط أحيانًا (4 فئة + 1–3 سلج). مقبول بصريًا، لكن لو كبرت الخريطة مستقبلًا راح ينتفخ القسم — يحتاج تصميم grid أنظف.
- **الـ audit عد `pagesOutsideSitemap=2` و `noHrefLinks=19`** — ما هي ضمن معايير BAI-IDX-04 (فحصناها: خارج النطاق، غالبًا صفحات status). باقية في الـ inventory وتستاهل مراجعة لاحقة.
- **`sitemap.xml` الجذر (root)** اتحدث تلقائيًا مع البناء (نسخة قديمة duplicate) — ما لمسناها، بس تعتبر legacy residue.

## Follow-up Suggestions

- مراجعة الـ `pagesOutsideSitemap=2` — شنو هالصفحتان وأهلًا تسوّى لهن روابط.
- فحص الـ `noHrefLinks=19` — غالبًا عناصر `<a>` بدون href تستاهل `role` أو حذف.
- بعد الـ deploy: تشغيل `npm run indexnow:trigger` عشان Bing يعرف بالسايت ماب الجديد (256 URL).

## Rollback Plan

```
git checkout -- src/pages/blog/[...slug].astro scripts/generate-sitemap-all-pages.mjs
npm run build
npm run internal-links:audit
```

الروابط المُضافة كلها **روابط داخلية جديدة** — ما في أي نص عربي منشور تعدل، ما في slugs تغيرت، ما في canonical/hreflang انلمست. الـ rollback آمن بالكامل.
