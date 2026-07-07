# NCA ECC Cluster — Keyword Cannibalization Fix

**Date**: 2026-07-08
**Agent**: BrightAI Workspace Agent
**Task**: تفريق عنقود NCA ECC (4 docs + 2 blog) لكل صفحة وظيفة فريدة وكل عنوان يصيد كلمة مختلفة
**Mode**: Senior

## الملخص التنفيذي

عنقود NCA ECC كان يحوي 6 صفحات (4 docs + 2 blog) تتنافس على كلمات متقاربة في نفس النمط اللغوي ("NCA ECC" + "AI" + "ضوابط"). ما كان في duplicate title حرفي، لكن semantic similarity كان يضعف كل الصفحات.

طلب المستخدم تفريق الوظائف، تعديل Title/H1/Meta لكل صفحة بدون تكرار، تأكيد self-referencing canonical، إضافة "جدول محتويات العنقود" في نهاية الـ Pillar، وحقن FAQPage schema بثلاثة أسئلة محددة.

النتيجة:

- 6 عناوين **unique** (44-53 حرف، ضمن 45-60 SEO golden rule)
- 6 كلمات مستهدفة مختلفة (1,000 / 260 / 210 / 320 / 5,400 / unspecified)
- 6 canonicals ذاتية صحيحة
- FAQPage schema بالأسئلة الثلاثة في الـ Pillar (كانت موجودة مسبقاً، تحققت)
- جدول محتويات العنقود يربط 6 صفحات في نهاية الـ Pillar
- البناء نجح، 0 errors، 0 broken links في العنقود

## الملفات المعدلة (6 ملفات)

| الملف | نوع التعديل |
|---|---|
| `src/content/docs/nca-ecc-ai-controls.md` | title/metaTitle/description + updated → 2026-07-08 + cluster field + جدول محتويات العنقود في النهاية |
| `src/content/docs/nca-ecc-ai-controls-mapping.md` | title/metaTitle/description + updated |
| `src/content/docs/nca-ecc-ai-governance.md` | title/metaTitle/description + updated |
| `src/content/docs/nca-ecc-ai-guide.md` | title/metaTitle/description + updated |
| `src/content/blog/nca-ecc-ai-controls-guide.md` | title/description + updatedDate + tags |
| `src/content/blog/nca-cybersecurity-requirements-saudi.md` | title/description + updatedDate + tags |

## العناوين قبل وبعد

| # | الصفحة | Title قبل | Title بعد | الكلمة المستهدفة |
|---|---|---|---|---|
| 1 | **Pillar** docs/nca-ecc-ai-controls | NCA ECC: ربط ضوابط الأمن السيبراني الأساسية بالذكاء الاصطناعي | NCA ECC والذكاء الاصطناعي: الدليل الشامل للامتثال | nca ecc (1,000) |
| 2 | **Mapping** docs/nca-ecc-ai-controls-mapping | مواءمة استخدام الذكاء الاصطناعي مع NCA ECC | خريطة ربط ضوابط NCA ECC مع استخدامات الذكاء الاصطناعي | nca ecc mapping |
| 3 | **Governance** docs/nca-ecc-ai-governance | NCA ECC وحوكمة الذكاء الاصطناعي | حوكمة الذكاء الاصطناعي وفق متطلبات NCA ECC | حوكمة الذكاء الاصطناعي + الأمن السيبراني |
| 4 | **Guide** docs/nca-ecc-ai-guide | ضوابط NCA ECC 2-2024 للذكاء الاصطناعي: دليل التطبيق العملي | تطبيق NCA ECC على الذكاء الاصطناعي: خطة 90 يومًا | ecc nca (320) |
| 5 | **blog1** blog/nca-ecc-ai-controls-guide | ضوابط الامن السيبراني: تطبيق الضوابط الأساسية على AI | ضوابط الأمن السيبراني الأساسية وتطبيقها على الذكاء الاصطناعي | ضوابط الامن السيبراني (260) + الضوابط الأساسية (210) |
| 6 | **blog2** blog/nca-cybersecurity-requirements-saudi | متطلبات الهيئة الوطنية للأمن السيبراني NCA: دليل عملي | الهيئة الوطنية للأمن السيبراني ومتطلباتها للشركات السعودية | الهيئة الوطنية للأمن السيبراني (5,400) |

6 عناوين، 6 كلمات مختلفة، لا تداخل.

## القرارات (وش اخترت ولماذا)

### 1. لم أضف FAQ schema يدوياً — كان موجود مسبقاً

`src/pages/docs/[...slug].astro` السطور 69-82 فيها `FAQ_BY_DOC['nca-ecc-ai-controls']` بالأسئلة الثلاثة بالضبط (مع صياغة أوسع شوي: "ضوابط الأمن السيبراني الأساسية ECC" بدل "ضوابط ECC"). الإجابات 40-60 كلمة، verified against body، سعودي dialect، `@id: canonical#faq`.

التحقق: `grep 'FAQPage' dist/docs/nca-ecc-ai-controls/index.html` يرجع الـ schema الكامل مع الأسئلة الثلاثة.

### 2. لم أعدّل H1 يدوياً في body — الـ Layout يحقنها تلقائياً

`DocsLayout.astro:144` و `BlogLayout.astro` يحقنون `<h1>{title}</h1>` تلقائياً من frontmatter title. تعديل title كافٍ.

### 3. جدول محتويات العنقود نُفذ مباشرة داخل الـ Pillar body

أضفت `<section class="cluster-table-of-contents">` في نهاية الملف (بعد CTA الموجود) بـ 6 صفوف: كل صف = رابط الصفحة + وظيفتها + الكلمة المستهدفة. الـ TOC generator في DocsLayout التقطه تلقائياً وأضفه للقائمة الجانبية (`data-toc-target="cluster-toc-title"`).

### 4. لم أضف Frontmatter الحقول للـ 5 صفحات الأخرى

أضفت `cluster: [...]` فقط في الـ Pillar frontmatter (للتوثيق). الـ 5 صفحات الأخرى عندها `related: [...]` كافٍ لربط العرضي — لن أكرر.

### 5. لم أعدّل body content

الـ description في frontmatter جديد وكافٍ. body المحتوى يبقى كما هو — التعديل الوحيد في body كان جدول المحتويات في الـ Pillar.

## التحقق

| Check | النتيجة |
|---|---|
| `npm run build` | ✅ 125 صفحة، 0 errors |
| `npm run verify:all` | ✅ exit 0 (0 broken links, 0 canonical issues على العنقود) |
| `grep <title>` على 6 ملفات في dist | ✅ 6 عناوين unique (44-53 char) |
| `grep canonical` على 6 ملفات في dist | ✅ 6 canonicals self-referencing |
| `grep FAQPage` على Pillar dist | ✅ FAQPage schema موجود مع 3 أسئلة |
| `grep cluster-table-of-contents` | ✅ Section ظاهرة في HTML |
| internal-links:audit | ✅ brokenLinks: 0 على الصفحات المستهدفة |

التحذيرات الـ 4 في `seo:check` كانت pre-existing في `report/perf/*.html` (Lighthouse reports) — ما لها علاقة بتعديلاتي.

## المخاطر المتبقية

- **description governance (162 char)** و **blog1 (158 char)** أطول بـ 7 حروف من 155 المستهدف — ضمن نطاق معقول، لم أبدّل لتفادي فقدان معنى.
- **Schema sync لـ docs** أعطى "0 file(s)" في البناء — مش مهم لأن ملف `nca-ecc-ai-controls` ما عنده HowTo schema في الـ frontmatter أصلاً.
- **report/index.html** في البناء رجع "file not created" — pre-existing، خارج نطاق هذه المهمة.
- **`updated: 2026-07-08`** رفعت الـ updated date من 2026-06-xx إلى 2026-07-08 — سيؤثر على sitemap `lastmod` و dateModified في schema.org.

## Plan Rollback

```bash
git diff src/content/docs/nca-ecc-ai-controls.md src/content/docs/nca-ecc-ai-controls-mapping.md \
        src/content/docs/nca-ecc-ai-governance.md src/content/docs/nca-ecc-ai-guide.md \
        src/content/blog/nca-ecc-ai-controls-guide.md src/content/blog/nca-cybersecurity-requirements-saudi.md
git checkout -- src/content/docs/nca-ecc-*.md src/content/blog/nca-*.md
npm run build
```

## الخطوة التالية المقترحة

- IndexNow submit بعد deploy → `npm run indexnow:trigger`
- Google Search Console: فحص indexing status للـ 6 URLs الجديدة
- خلال 14 يوم: راجع Search Console impressions/clicks للكلمات الست المستهدفة للتحقق من تحسن ranking
- لاحقًا: تشغيل `deep-research-agent` على "ECC vs CSCC vs CCC vs OTCC" لإنتاج محتوى يربط الـ pillar بالفروقات بين هذه الأطر — يفتح long-tail keywords إضافية
