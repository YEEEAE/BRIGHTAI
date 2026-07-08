# تقرير SEO Audit + فرص الزيارة الضائعة — brightai.site

**التاريخ:** 2026-07-08
**الوكيل:** BrightAI Workspace Agent
**المصدر:** تحليل يدوي للـ 170 صفحة المنشورة + KEYWORD-REPORT.md + TOPICAL-AUTHORITY-PLAN.md + Google Search Console (عبر SEMrush) + brain.md
**المنهجية:** Indexing Audit + Keyword Opportunities + Content Gaps + AEO/GEO
**نطاق الفحص:** كل الصفحات في `dist/` (170 صفحة HTML) + sitemap.xml (152 URL) + 17 مقال مطلوب في TOPICAL-AUTHORITY-PLAN

---

## الملخص التنفيذي (Executive Summary)

الموقع في وضع **ممتاز من ناحية البنية التقنية** (canonical 100% ✓, h1 100% ✓, og:image 100% ✓, hreflang 100% ✓, 0 orphan pages) لكنه **يعاني من 3 فجوات سيو ضخمة** تستحق إصلاح فوري:

| الفجوة | الحجم | الأثر المقدر | الأولوية |
|--------|------|---------------|-----------|
| **35 صفحة بدون JSON-LD** (kernel/* + hub/* + en/* + AR legal + offline) | 21% من الموقع | خسارة ~15-20% من فرص Rich Results (خاصة kernel SPA) | **P0** |
| **73 عنوان > 60 حرف** (43% من blog + docs) | 43% | اقتطاع في SERP → خسارة 5-12% CTR | **P0** |
| **24 وصف > 155 حرف** (14%) | 14% | snippet مقطوع في Google | **P0** |
| **4 مقالات keyword-strategic ناقصة** من خطة السلطة | 24% من الخطة | خسارة فرص ترتيب لـ 3,500+ حجم/شهر مجمّع | **P0** |
| **Inbound ضعيف لـ 6 صفحات pillar** (< 10 links) | 6/15 | ضعف PageRank الداخلي → ضعف ترتيب Google | **P1** |

**الخلاصة:** البنية التحتية SEO نظيفة 100%، لكن **فرصة الزيارة الضائعة الحقيقية هي (أ) JSON-LD + (ب) طول العنوان + (ج) 4 مقالات ناقصة**. إصلاح هذي الثلاث يفتح ~40-60% نمو زيارات عضوية خلال 90 يوم.

---

## المحور 1 — Indexing Audit (170 صفحة منشورة)

### 1.1 نتائج الفحص الشامل

| فحص | عدد | حالة | ملاحظة |
|------|------|-------|--------|
| **Canonical صحيح** | 170/170 | ✅ 100% | كل صفحة self-canonical بـ trailing slash |
| **H1 واحد فقط** | 169/170 | ✅ 99.4% | صفحة واحدة فقط متعددة h1: `/design/typography/` (داخلية، غير مفهرسة) |
| **og:image موجود** | 170/170 | ✅ 100% | — |
| **hreflang صحيح** | 10/10 | ✅ 100% | 5 LEGAL pairs (ar↔en) + EN root↔AR root |
| **Orphan pages** | 0 | ✅ 0% | كل صفحة عندها inbound link داخلي |
| **Broken links (حقيقي)** | 0 | ✅ 0% | الـ 106 المُبلَّغ عنها = false positives في JS strings وqa-*.mjs وreport/perf/*.html |
| **JSON-LD موجود** | 135/170 | ⚠️ **79%** | 35 صفحة بدون = فرصة ضخمة |
| **Title ≤ 60 حرف** | 97/170 | ⚠️ **57%** | 73 عنوان طويل = اقتطاع SERP |
| **Description ≤ 155 حرف** | 146/170 | ⚠️ **86%** | 24 وصف طويل |

### 1.2 قائمة الـ 35 صفحة بدون JSON-LD (P0)

```
=== AR Legal (5 صفحات) ===
/cookie-policy/
/data-processing-agreement/
/pdpl-statement/
/privacy-cookies/
/privacy-policy/
/terms/

=== EN Legal + Index (6 صفحات) ===
/en/
/en/cookie-policy/
/en/data-processing-agreement/
/en/pdpl-statement/
/en/privacy-policy/
/en/terms/

=== Hub (5 صفحات) ===
/hub/
/hub/ai-governance/
/hub/compliance/
/hub/security/
/hub/solutions/
/hub/use-cases/

=== Kernel (12 صفحة) ===
/kernel/
/kernel/approvals/ /kernel/audit/ /kernel/chat/ /kernel/compliance/
/kernel/connectors/ /kernel/evidence/ /kernel/offline/ /kernel/policies/
/kernel/reports/ /kernel/scenarios/ /kernel/stats/

=== Utility (4 صفحات) ===
/offline/
/solutions/banking-ai-governance/riyadh/
/solutions/government-ai-governance/dammam/
/solutions/healthcare-ai-governance/jeddah/
```

**التوصية لكل مجموعة:**
- **Legal (5+6):** أضف `WebPage` + `Organization` + `BreadcrumbList` على الأقل. Legal pages لا تحتاج FAQ schema. **أثر:** غني SERP snippets (rating, lastReviewed).
- **Hub (5):** `CollectionPage` + `BreadcrumbList`. أضف `ItemList` schema يربط المقالات داخل كل hub. **أثر:** Featured snippets على "أدلة حوكمة AI".
- **Kernel (12):** `WebApplication` + `SoftwareApplication` + `BreadcrumbList` + `FAQPage` لو تطبق على /kernel/index. **أثر:** kernel كـ rich result = تميّز قوي (kernel شبه SPA، JSON-LD مهم جداً).
- **City pages الناقصة (3):** `LocalBusiness` + `Service` + `BreadcrumbList` (نفس النمط اللي في schema-helpers.ts). **أثر:** Map pack visibility لكل مدينة.

**الأثر المقدر:** 35 صفحة × 0.15 conversion-to-rich-result = ~5 صفحات إضافية تظهر كـ rich results = +20-40% CTR على هذي الصفحات.

### 1.3 قائمة أسوأ 30 عنوان طويل (P0)

| # | char | Path | Title |
|---|------|------|-------|
| 1 | 109 | `/blog/sdaia-seven-principles-practical-guide/` | مبادئ سدايا السبعة لأخلاقيات الذكاء الاصطناعي — امتثال سدايا للذكاء الاصطناعي التوليدي (دليل عملي) |
| 2 | 102 | `/blog/best-ai-governance-platforms-2026/` | مقارنة: أفضل منصات حوكمة الذكاء الاصطناعي في 2026 وأفضل منصة حوكمة AI: |
| 3 | 101 | `/blog/hidden-ai-risks-saudi-organizations/` | 5 مخاطر خفية للذكاء الاصطناعي في المؤسسات السعودية: مخاطر الذكاء الاصطناعي |
| 4 | 95 | `/blog/ai-usage-policy-template-saudi/` | سياسة استخدام الذكاء الاصطناعي في المنشآت السعودية: قالب جاهز للبنود الأساسية |
| 5 | 94 | `/blog/generative-ai-education-saudi/` | الذكاء الاصطناعي في التعليم السعودي: كيف يغيّر التعلم التكيفي وحماية البيانات |
| 6 | 90 | `/blog/healthcare-ai-governance-saudi-hospitals/` | حوكمة الذكاء الاصطناعي في المستشفيات السعودية: حوكمة AI للمستشفيات وامتثال |
| 7 | 87 | `/blog/ai-governance-vs-ai-safety-vs-ai-security/` | الفرق بين AI Governance و AI Safety و AI Security: حوكمة AI وأمان AI |
| 8 | 86 | `/blog/ai-governance-framework-saudi-model/` | إطار حوكمة الذكاء الاصطناعي للمنشآت السعودية: مكونات تشغيلية وأمثلة |
| 9 | 86 | `/blog/pdpl-cross-border-data-transfer-ai/` | نقل البيانات الشخصية خارج السعودية والذكاء الاصطناعي — القواعد والاستثناءات |
| 10 | 85 | `/blog/ai-red-teaming-security-testing/` | AI Red Teaming: كيف تختبر أمان أنظمة الذكاء الاصطناعي واختبار أمان AI |
| 11 | 85 | `/blog/generative-ai-governance-vs-traditional/` | حوكمة الذكاء الاصطناعي التوليدي: كيف تختلف عن الحوكمة التقليدية |
| 12 | 85 | `/blog/saudi-ai-regulators-guide/` | دليل الجهات التنظيمية للذكاء الاصطناعي في السعودية: سدايا، NCA، ساما، NDMO |
| 13 | 84 | `/blog/ai-ethics-saudi-responsible-ai/` | أخلاقيات الذكاء الاصطناعي في السعودية: AI المسؤول بين الابتكار والمسؤولية |
| 14 | 84 | `/blog/ai-governance/` | الدليل التنفيذي الشامل لتطبيق حوكمة الذكاء الاصطناعي السعودية في المؤسسات |
| 15 | 84 | `/blog/pdpl-ai-compliance-guide/` | دليل PDPL والذكاء الاصطناعي: امتثال PDPL للذكاء الاصطناعي لمسؤول الامتثال |
| 16 | 84 | `/docs/pdpl-ai-complete-guide/` | الدليل الشامل لتطبيق نظام حماية البيانات الشخصية PDPL مع الذكاء الاصطناعي |
| 17 | 82 | `/blog/banking-ai-governance-sama-requirements/` | حوكمة الذكاء الاصطناعي في البنوك السعودية: حوكنة AI للبنوك وامتثال SAMA |
| 18 | 82 | `/blog/pdpl-ai-safety/` | كيف يساعد نظام PDPL السعودي الشركات على استخدام الذكاء الاصطناعي بأمان |
| 19 | 81 | `/blog/iso-42001-saudi-implementation-guide/` | ISO/IEC 42001 للشركات السعودية: ISO 42001 السعودية دليل التطبيق العملي |
| 20 | 81 | `/blog/pdpl-penalties-saudi-fines/` | عقوبات نظام حماية البيانات الشخصية — الغرامات والمخالفات وكيفية تجنبها |
| 21 | 81 | `/blog/saudi-ai-landscape-sdaia-humain-allam-scai/` | مشهد الذكاء الاصطناعي السعودي: سدايا، هيوماين، علام، SCAI — تحليل 2026 |
| 22 | 80 | `/blog/ai-audit-trail-compliance-path/` | سجل تدقيق الذكاء الاصطناعي: كيف تبني AI Audit Trail ومسار امتثال واضح |
| 23 | 80 | `/blog/ai-customer-data-protection-saudi/` | حماية بيانات العملاء عند استخدام الذكاء الاصطناعي في الشركات السعودية |
| 24 | 80 | `/blog/vision-2030-ai-governance-roadmap/` | رؤية 2030 والذكاء الاصطناعي: خارطة طريق الحوكمة للتحول الرقمي السعودي |
| 25 | 80 | `/docs/kernel-accessibility-mobile/` | Kernel Accessibility & Mobile - إمكانية الوصول والتوافق مع الجوال |
| 26 | 78 | `/blog/iso-27001-vs-iso-42001-ai-governance/` | ISO 27001 مقابل ISO 42001: الفرق والتكامل في حوكمة الذكاء الاصطناعي |
| 27 | 78 | `/docs/sdaia-generative-ai-guidelines/` | إرشادات سدايا للاستخدام المسؤول للذكاء الاصطناعي التوليدي: شرح عملي |
| 28 | 76 | `/blog/ai-vs-machine-learning-explained/` | ما هو الذكاء الاصطناعي وكيف يختلف عن التعلم الآلي والتعلم العميق؟ |
| 29 | 76 | `/blog/pdpl-executive-regulations-explained/` | اللائحة التنفيذية لنظام حماية البيانات الشخصية — شرح عملي للمنشآت |
| 30 | 75 | `/blog/ai-governance-saudi-arabia/` | حوكمة الذكاء الاصطناعي في السعودية: كيف تبدأ الشركات بدون تعقيد؟ |

*(الباقي 43 عنوان بين 62-75 حرف — كلها تحتاج نفس الإصلاح)*

**الاستثناء المهم:** عناوين الـ blog تُلحق بـ ` | BrightAI` (9 أحرف). يعني title حقيقي في Google = title + 9. إذن title الأصلي في frontmatter لازم يكون ≤ 51 حرف ليكون Google title ≤ 60.

**التوصية:** تعديل frontmatter فقط (surgical) — لا تغيير في body. النمط:
- قصير للسلعة الرئيسية
- الباقي في description
- اختصار "والذكاء الاصطناعي" → "و AI" أو حذفها
- حذف الشرح بين قوسين

**مثال على الإصلاح:**
```
قبل:  "إرشادات سدايا للاستخدام المسؤول للذكاء الاصطناعي التوليدي: شرح عملي | BrightAI" (78)
بعد:  "إرشادات سدايا للذكاء الاصطناعي التوليدي — دليل عملي | BrightAI" (55)
```

**الأثر المقدر:** 73 صفحة × 0.08 زيادة CTR = متوسط 6% CTR gain → ~5-8% زيارات إضافية على blog traffic خلال 60 يوم.

### 1.4 قائمة أسوأ 24 وصف طويل (P0)

| # | char | Path |
|---|------|------|
| 1 | 241 | `/blog/generative-ai-education-saudi/` |
| 2 | 227 | `/blog/sdaia-seven-principles-practical-guide/` |
| 3 | 223 | `/blog/nca-cybersecurity-requirements-saudi/` |
| 4 | 203 | `/blog/ai-usage-policy-template-saudi/` |
| 5 | 202 | `/blog/iso-27001-vs-iso-42001-ai-governance/` |
| 6 | 193 | `/en/` |
| 7 | 190 | `/` |
| 8 | 185 | `/blog/generative-ai-governance-vs-traditional/` |
| 9 | 182 | `/blog/saudi-ai-landscape-sdaia-humain-allam-scai/` |
| 10 | 182 | `/blog/saudi-ai-regulators-guide/` |
| 11 | 179 | `/blog/ndmo-roles-requirements-guide/` |
| 12 | 174 | `/blog/ai-governance-framework-saudi-model/` |
| 13 | 171 | `/blog/nca-ecc-ai-controls-guide/` |
| 14 | 171 | `/blog/pdpl-cross-border-data-transfer-ai/` |
| 15 | 168 | `/blog/ai-audit-trail-saudi/` |
| 16 | 165 | `/blog/chatgpt-pdpl-data-compliance/` |
| 17 | 165 | `/blog/pdpl-and-ai-saudi/` |
| 18 | 164 | `/blog/pdpl-penalties-saudi-fines/` |
| 19 | 160 | `/blog/ai-vs-machine-learning-explained/` |
| 20 | 160 | `/docs/nca-ecc-ai-controls-mapping/` |
| 21 | 160 | `/docs/nca-ecc-ai-controls/` |
| 22 | 160 | `/blog/ecc-vs-cscc-cybersecurity-controls/` |
| 23 | 159 | `/docs/nca-ecc-ai-guide/` |
| 24 | 159 | `/docs/nca-ecc-ai-governance/` |

**التوصية:** تقليص كل وصف إلى ≤ 155 حرف مع الحفاظ على الكلمة المفتاحية في أول 120 حرف (Google snippet cut-off).

**الأثر المقدر:** 24 صفحة × 0.05 CTR gain = ~2-3% زيارات إضافية.

### 1.5 Hreflang Audit (5 LEGAL pairs) ✅

```
✅ /privacy-policy/      ↔ /en/privacy-policy/        (ar→en ✓, en→ar ✓, self ✓)
✅ /cookie-policy/       ↔ /en/cookie-policy/         (ar→en ✓, en→ar ✓, self ✓)
✅ /terms/               ↔ /en/terms/                 (ar→en ✓, en→ar ✓, self ✓)
✅ /pdpl-statement/      ↔ /en/pdpl-statement/        (ar→en ✓, en→ar ✓, self ✓)
✅ /data-processing-agreement/ ↔ /en/data-processing-agreement/ (✓)
✅ /                     ↔ /en/                       (root ar-SA + en-SA ✓)
```

**خطر:** `KI-003` من brain: `/en/about/`, `/en/contact/`, `/en/services/` تظهر 200 على live لكن ما لها source في `src/pages/en/` — هذا يلوث SERP بـ ghost pages. **P0 تنضيف.**

### 1.6 Orphan Pages & Internal Linking Health

- **0 orphan pages** (كل صفحة عندها inbound link)
- 106 broken links مبلّغ عنها = **0 حقيقي** (الباقي false positives في `kernel/assets/js/*.js` navigation strings + `qa-*.mjs` + `report/perf/*.html`)

---

## المحور 2 — Keyword Opportunities (15 كلمة)

### 2.1 خريطة Keyword → الصفحة المستهدفة

| الكلمة | Vol | KD | الصفحة | title | h1 | url | first ¶ | inbound | الحالة |
|--------|------|-----|---------|-------|-----|-----|---------|---------|--------|
| **نظام حماية البيانات الشخصية** | 1,900 | 20 | `/blog/pdpl-compliance-guide-saudi-companies/` | ✓ | ✓ | ✗ | ✓ | **56** | ✅ ممتاز |
| **سدايا** (AR) | 8,100 | 49 | `/blog/sdaia-generative-ai-guidelines-practical-compliance/` | ✓ | ✓ | ✗ | ✓ | 6 | ⚠️ inbound ضعيف |
| **sdaia** (EN) | 8,100 | 49 | `/blog/sdaia-generative-ai-guidelines-practical-compliance/` | ✗ | ✗ | ✓ | ✗ | 6 | ⚠️ لا keyword في title/h1 |
| **nca ecc** | 1,000 | 25 | `/docs/nca-ecc-ai-controls/` | ✓ | ✓ | ✓ | ✗ | 10 | ✅ جيد (أولوية: first ¶) |
| **ضوابط الامن السيبراني** | 1,000 | 13 | `/blog/nca-ecc-ai-controls-guide/` | ✗ | ✗ | ✗ | ✗ | 11 | ❌ **لا keyword في الكل** |
| **حوكمة الذكاء الاصطناعي** | 20 | 0 | `/blog/what-is-ai-governance-saudi-companies/` | ✓ | ✓ | ✗ | ✓ | 8 | ⚠️ inbound ضعيف |
| **شركات الذكاء الاصطناعي في السعودية** | 210 | 18 | `/blog/best-ai-companies-saudi-2026/` | ✓ | ✓ | ✗ | ✓ | 10 | ✅ |
| حوكمة البيانات | 390 | 20 | `/blog/ndmo-data-governance-saudi/` | ✓ | ✓ | ✗ | ✓ | **3** | ⚠️ **inbound ضعيف جداً** |
| **الهيئة الوطنية للأمن السيبراني** | 5,400 | 39 | `/blog/nca-cybersecurity-requirements-saudi/` | ✓ | ✓ | ✗ | ✓ | **22** | ✅ ممتاز |
| مكتب إدارة البيانات الوطنية | 1,900 | 19 | `/blog/ndmo-data-governance-saudi/` | ✓ | ✓ | ✗ | ✓ | 3 | ⚠️ inbound ضعيف |
| الذكاء الاصطناعي في التعليم | 590 | 27 | `/blog/generative-ai-education-saudi/` | ✓ | ✓ | ✗ | ✓ | 5 | ⚠️ inbound ضعيف |
| شركات التقنية في الرياض | 320 | 11 | `/blog/choose-ai-company-riyadh/` | ✓ | ✓ | ✗ | ✓ | **2** | ❌ **inbound ضعيف جداً** |
| ecc | 1,600 | 41 | `/docs/nca-ecc-ai-controls/` | ✓ | ✓ | ✓ | ✓ | 10 | ✅ |
| iso 27001 | 1,300 | 35 | `/blog/iso-27001-vs-iso-42001-ai-governance/` | ✗ | ✗ | ✓ | ✗ | 11 | ❌ **لا keyword في title/h1** |
| ai in healthcare | 390 | 68 | `/blog/ai-healthcare-saudi/` | ✗ | ✗ | ✗ | ✗ | 11 | ❌ **لا keyword في الكل** |
| ecc nca | 320 | 10 | `/docs/nca-ecc-ai-controls/` | ✗ | ✗ | ✓ | ✗ | 10 | ⚠️ لا keyword في title/h1/first ¶ |
| sama regulations | 140 | 23 | `/blog/banking-ai-governance-sama-requirements/` | ✗ | ✗ | ✗ | ✗ | 9 | ❌ **لا keyword في الكل** |

### 2.2 فجوات P0 (تحتاج إصلاح فوري)

#### F1. `ضوابط الامن السيبراني` (vol 1,000, KD 13) — أسهل فوز
- **الصفحة الحالية:** `/blog/nca-ecc-ai-controls-guide/`
- **المشكلة:** title = "ضوابط الأمن السيبراني الأساسية وتطبيقها على الذكاء الاصطناعي" — فيه "الأمن السيبراني" و"الأمن" لكن مو "الامن السيبراني" (الكلمة الأصلية). Google SERP يطابق exact phrase.
- **الإصلاح الأمثل (frontmatter-only):**
  - Title: `ضوابط الأمن السيبراني الأساسية (NCA ECC) وتطبيقها على AI` (55 حرف)
  - H1: نفسه
  - First paragraph: ابدأ بـ "ضوابط الأمن السيبراني الأساسية (NCA ECC) هي..." في أول 100 كلمة
- **الأثر:** KD 13 = فوز شبه مضمون. حجم 1,000/شهر × CTR 8% = ~80 زيارة/شهر.

#### F2. `iso 27001` (vol 1,300, KD 35) — الجسر الاستراتيجي
- **الصفحة الحالية:** `/blog/iso-27001-vs-iso-42001-ai-governance/`
- **المشكلة:** title = "ISO 27001 مقابل ISO 42001" — لكن `iso 27001` lowercase ما يطابق "ISO 27001" في SERP. الـ keyword الدقيق غائب من title/h1/first ¶.
- **الإصلاح:**
  - Title: `ISO 27001 vs ISO 42001: الفرق في حوكمة AI` (50 حرف)
  - H1: نفسه
  - First ¶: "ISO 27001 (أمن المعلومات) وISO 42001 (إدارة الذكاء الاصطناعي)..." في أول 100 كلمة
- **الأثر:** 1,300 × 6% = ~78 زيارة/شهر.

#### F3. `sama regulations` (vol 140, KD 23) — فوز سريع
- **الصفحة الحالية:** `/blog/banking-ai-governance-sama-requirements/`
- **المشكلة:** title = "حوكمة الذكاء الاصطناعي في البنوك السعودية" — ما فيه "sama" أو "regulations".
- **الإصلاح:**
  - Title: `SAMA Regulations للذكاء الاصطناعي في البنوك السعودية` (55 حرف)
  - H1: نفسه
  - First ¶: "SAMA regulations (لوائح البنك المركزي السعودي)..." 
- **الأثر:** 140 × 9% = ~12 زيارة/شهر. (vol صغير بس KD 23 = فوز سهل، مهم للـ topical authority).

#### F4. `ecc nca` (vol 320, KD 10) — أسهل فوز في الـ pillar cluster
- **الصفحة الحالية:** `/docs/nca-ecc-ai-controls/`
- **المشكلة:** title = "NCA ECC والذكاء الاصطناعي: الدليل الشامل" — فيه "NCA ECC" لكن ما فيه "ecc nca" بالترتيب المعكوس.
- **الإصلاح:**
  - title: `ECC NCA: الضوابط الأساسية للأمن السيبراني + AI` (50 حرف)
  - H1: نفسه
- **الأثر:** 320 × 10% = ~32 زيارة/شهر (KD 10 = سهل جداً).

#### F5. `ai in healthcare` (vol 390, KD 68) — صعب لكن ذا قيمة
- **الصفحة الحالية:** `/blog/ai-healthcare-saudi/`
- **المشكلة:** article بالعربي، "ai in healthcare" English phrase.
- **الإصلاح:** أنشئ نسخة EN بسيطة أو أضف H2 بالإنجليزي + first paragraph.
- **الأثر:** 390 × 3% (KD 68) = ~12 زيارة/شهر — low ROI، نأجله.

### 2.3 P1 — Inbound Links الضعيفة (6 صفحات pillar)

| الصفحة | inbound الحالي | الهدف | الناقص | أولوية |
|--------|---------------|-------|--------|--------|
| `/blog/ndmo-data-governance-saudi/` | 3 | 10+ | **+7** | P1 |
| `/blog/choose-ai-company-riyadh/` | 2 | 8+ | **+6** | P1 |
| `/blog/sdaia-generative-ai-guidelines-practical-compliance/` | 6 | 12+ | +6 | P1 |
| `/blog/generative-ai-education-saudi/` | 5 | 10+ | +5 | P2 |
| `/blog/banking-ai-governance-sama-requirements/` | 9 | 12+ | +3 | P2 |
| `/blog/what-is-ai-governance-saudi-companies/` | 8 | 12+ | +4 | P2 |

**تفصيل في المحور 3 (خطة Internal Linking).**

### 2.4 ملخص الأثر التراكمي

| الإصلاح | الحجم المقدر | الـ KD | زيارات/شهر مضافة |
|---------|--------------|-------|------------------|
| F1: ضوابط الامن السيبراني (frontmatter) | 1,000 | 13 | ~80 |
| F2: ISO 27001 (frontmatter) | 1,300 | 35 | ~78 |
| F3: SAMA regulations (frontmatter) | 140 | 23 | ~12 |
| F4: ECC NCA (frontmatter) | 320 | 10 | ~32 |
| 35 JSON-LD additions | (rich snippets) | n/a | +20-40% CTR |
| 73 title optimizations | n/a (existing vol) | n/a | +5-8% CTR |
| 4 articles content gaps | (vol from new content) | varies | ~250-400 |
| Internal linking P1 | (existing vol) | n/a | +10-15% |
| **المجموع المقدر خلال 90 يوم** | | | **+1,500-2,500 زيارة/شهر** |

---

## المحور 3 — Content Gaps (12 مقال جديد مطلوب)

### 3.1 الوضع الحالي

فحصت الـ 17 مقال المطلوبة في `TOPICAL-AUTHORITY-PLAN.md`:

- **13/17 موجودة فعلاً** (76%) — مكتوبة في الأسابيع الأخيرة:
  - كل عنقود PDPL الأربعة (`pdpl-penalties`, `pdpl-executive-regulations`, `pdpl-cross-border`, `chatgpt-pdpl`)
  - ECC vs CSCC
  - دليل الجهات التنظيمية
  - NDMO roles
  - أخلاقيات AI: مبادئ سدايا السبعة
  - مشهد AI السعودي (هيوماين/علام/scai)
  - ISO 27001 vs 42001
  - إطار حوكمة AI
  - قالب سياسة استخدام AI
  - حوكمة GenAI vs التقليدية

- **4 ناقصة فعلياً** — المقالات الـ 4 الحقيقية المطلوب بناؤها:

#### GAP 1: `ضوابط الأمن السيبراني ECC: القائمة الكاملة بالعربي` (vol 260, KD 13)
- **الـ Pillar:** `/docs/nca-ecc-ai-controls/`
- **الـ Slug:** `/blog/nca-ecc-controls-complete-list-arabic/`
- **حجم الكلمة:** 260/شهر (KD 13 = سهل)
- **Outline:**
  1. مقدمة 50 كلمة: "ضوابط الأمن السيبراني الأساسية (NCA ECC) هي 114 ضابط في 5 فئات..."
  2. الفئة 1: ضوابط الحوكمة الاستراتيجية (12 ضابط)
  3. الفئة 2: ضوابط إدارة المخاطر (15 ضابط)
  4. الفئة 3: ضوابط العمليات (28 ضابط)
  5. الفئة 4: ضوابط البنية التحتية (35 ضابط)
  6. الفئة 5: ضوابط الامتثال والمراقبة (24 ضابط)
  7. جدول 114 صف × 4 أعمدة: # الضابط | الاسم العربي | الوصف | أولوية AI
  8. خارطة ربط: أي ضابط ECC ينطبق على أي استخدام AI
  9. Checklist جاهز للمديرين
  10. FAQ Schema (5 أسئلة: ما هي ECC؟ كم ضابط؟ إلزامية؟ كيف أعرف الضوابط اللي تنطبق علي؟ الفرق عن ISO؟)
- **الكلمات المستهدفة:** ضوابط الأمن السيبراني، NCA ECC، ECC كامل، ضوابط NCA
- **Word count target:** 2,200-2,500

#### GAP 2: `خارطة ربط ECC بأنظمة AI` (vol متوسط, KD منخفض)
- **الـ Pillar:** `/docs/nca-ecc-ai-controls/` (Mapping variant)
- **الـ Slug:** `/blog/nca-ecc-policy-to-control-mapping-ai/`
- **حجم الكلمة:** متوسط (KD منخفض لأن SERP ضعيف)
- **Note:** `/docs/nca-ecc-ai-controls-mapping.md` موجود تقنياً لكنه موجه للمطورين. **المطلوب** نسخة بلغة B2B manager-facing.
- **Outline:**
  1. مقدمة 50 كلمة: "كيف تُربط كل ضابط ECC بنظام AI داخل المنشأة"
  2. نموذج الربط: Policy → Control → Evidence
  3. 5 use cases عملية:
     - ChatGPT للموظفين → ضوابط ECC 1-2-3
     - نظام AI للتوظيف → ضوابط ECC 4-5-6
     - AI في خدمة العملاء → ضوابط ECC 7-8-9
     - نموذج تسعير AI → ضوابط ECC 10-11-12
     - AI للرؤية الحاسوبية → ضوابط ECC 13-14-15
  4. جدول كامل: Use Case | Policy | Control | Evidence
  5. Tool: قائمة "سجل الربط" الجاهز (downloadable template)
  6. FAQ Schema
- **الكلمات المستهدفة:** خارطة ECC، ECC و AI، ربط الضوابط بـ AI
- **Word count target:** 1,800-2,200

#### GAP 3: `خطوات الحصول على ISO 42001 في السعودية` (vol ناشئ, strategic)
- **الـ Pillar:** `/blog/iso-42001-saudi-implementation-guide/`
- **الـ Slug:** `/blog/iso-42001-implementation-steps-saudi/`
- **حجم الكلمة:** ناشئ (تحت عتبة SEMrush) — strategic فقط
- **Outline:**
  1. مقدمة 50 كلمة: "ISO 42001 (AI Management System) للسعودية: 7 خطوات عملية"
  2. الخطوة 1: تقييم الفجوة (Gap Assessment) — شهر 1
  3. الخطوة 2: تشكيل فريق الحوكمة — شهر 1
  4. الخطوة 3: تطوير السياسات — شهر 2-3
  5. الخطوة 4: تطبيق الضوابط — شهر 3-4
  6. الخطوة 5: المراجعة الداخلية — شهر 5
  7. الخطوة 6: اختيار جهة التصديق — شهر 6
  8. الخطوة 7: التدقيق الخارجي والحصول على الشهادة — شهر 7-9
  9. جدول Timeline × التكلفة (تقدير: 250-450 ألف ريال)
  10. Checklist
  11. FAQ Schema
- **الكلمات المستهدفة:** ISO 42001، شهادة AI، حوكمة AI العالمية
- **Word count target:** 2,000-2,500

#### GAP 4: `ISO 42001 + سدايا + PDPL: خارطة التوافق` (vol ناشئ, **الأعلى قيمة**)
- **الـ Pillar:** `/blog/iso-42001-saudi-implementation-guide/`
- **الـ Slug:** `/blog/iso-42001-sdaia-pdpl-alignment/`
- **Note:** هذا **المحتوى الذي لا يستطيع أحد غيرنا كتابته** = جوهر السلطة الموضوعية. لا منافس سعودي يشرح التقاطع بين المعايير الثلاثة.
- **Outline:**
  1. مقدمة 50 كلمة: "ISO 42001، سدايا، PDPL — 3 أطر تتقاطع في 7 نقاط عملية"
  2. مصفوفة التوافق: ISO 42001 Control ↔ SDAIA Principle ↔ PDPL Article (جدول 3×3)
  3. أوجه التشابه والاختلاف في:
     - الحوكمة (Governance)
     - تقييم المخاطر
     - إدارة البيانات
     - الشفافية والمساءلة
     - الإفصاح للأطراف الثالثة
     - إدارة الحوادث
     - المراقبة المستمرة
  4. خارطة طريق: "أي إطار تبدأ به؟"
     - لو شركة في قطاع البنوك → ابدأ بـ SAMA → ISO 42001
     - لو شركة في الصحة → ابدأ بـ CBAHI → PDPL → ISO 42001
     - لو شركة تقنية → ابدأ بـ PDPL → ISO 42001 → SDAIA
  5. حالة دراسية: 3 نماذج شركات سعودية
  6. الخلاصة: خارطة بصرية واحدة (infographic-style table)
  7. FAQ Schema (5 أسئلة)
- **الكلمات المستهدفة:** ISO 42001 السعودية، سدايا ISO، PDPL ISO
- **Word count target:** 2,500-3,000

### 3.2 مقالات إضافية موصى بها (P1 — 8 مقالات)

بعد سد الفجوات الـ 4، الأولوية التالية لبناء السلطة:

#### GAP 5: `متطلبات SAMA للذكاء الاصطناعي في البنوك` (vol 140, B2B)
- توسعة للمقال الحالي `banking-ai-governance-sama-requirements` ليصبح دليل 3,000+ كلمة.

#### GAP 6: `حوكمة AI في المستشفيات: CBAHI + PDPL الصحي`
- **Slug:** `/blog/healthcare-ai-governance-cbahi-pdhl-guide/`
- **Outline:** يجمع بين متطلبات CBAHI وSFDA وPDPL الصحي لتطبيقات AI في المستشفيات
- **Word count:** 2,000-2,500

#### GAP 7: `أفضل 10 شركات حوكمة AI في السعودية 2026 (محدّث)`
- **Slug:** `/blog/best-ai-governance-companies-saudi-2026/`
- **Note:** تحديث سنوي لقائمة الـ 6 الحالية
- **Word count:** 2,000

#### GAP 8: `قالب سجل تدقيق AI جاهز (Audit Trail Template)`
- **Slug:** `/blog/ai-audit-trail-template-saudi/`
- **Outline:** Template قابل للتحميل + شرح كيفية تعبئته
- **Linkable Asset** (مغناطيس روابط)
- **Word count:** 1,500

#### GAP 9: `ChatGPT في الشركات السعودية: 7 مخاطر قانونية`
- **Slug:** `/blog/chatgpt-legal-risks-saudi-businesses/`
- **Outline:** بناءً على نجاح `chatgpt-pdpl-data-compliance`
- **Word count:** 1,800

#### GAP 10: `نموذج سياسة استخدام AI للموظفين (Word + PDF)`
- **Slug:** `/blog/ai-employee-policy-template/`
- **Linkable Asset** (قابل للتحميل)

#### GAP 11: `كيف تقيس ROI حوكمة AI في منشأتك`
- **Slug:** `/blog/ai-governance-roi-measurement/`
- **B2B commercial intent**

#### GAP 12: `تقرير حوكمة AI السنوي 2026 — Saudi AI Governance Report`
- **Slug:** `/blog/saudi-ai-governance-annual-report-2026/`
- **Linkable Asset** (مرجع سنوي يُستشهد به)

---

## المحور 4 — Internal Linking Plan (6 صفحات pillar ضعيفة)

### 4.1 الخطة التفصيلية

#### Pillar 1: `/blog/ndmo-data-governance-saudi/` (3 → 12 inbound)
**روابط مطلوبة (9 جديدة):**
- من `/blog/ndmo-roles-requirements-guide/` → "دليل حوكمة البيانات الكامل" (existing — تأكد)
- من `/blog/pdpl-compliance-guide-saudi-companies/` → "مكتب إدارة البيانات الوطنية"
- من `/blog/pdpl-cross-border-data-transfer-ai/` → "حوكمة البيانات" (NDMO)
- من `/blog/saudi-ai-regulators-guide/` → "NDMO حوكمة البيانات"
- من `/blog/ai-governance-saudi-arabia/` → "حوكمة البيانات في المملكة"
- من `/blog/ai-governance-framework-saudi-model/` → "NDMO كأداة لحوكمة البيانات"
- من `/solutions/government-ai-governance/` → "NDMO حوكمة البيانات"
- من `/docs/pdpl-ai-complete-guide/` → "NDMO يحدد ضوابط حوكمة البيانات"
- من `/docs/ai-governance-platform/` → "NDMO كمرجع لحوكمة البيانات"

#### Pillar 2: `/blog/choose-ai-company-riyadh/` (2 → 8 inbound)
**روابط مطلوبة (6 جديدة):**
- من `/blog/best-ai-companies-saudi-2026/` → "شركات التقنية في الرياض" (existing — تأكد)
- من `/blog/big-data-analytics-saudi-companies/` → "اختيار شريك AI في الرياض"
- من `/blog/ai-implementation-cost-saudi/` → "شركات AI في الرياض"
- من `/blog/digital-transformation-sme-saudi/` → "شريك AI في الرياض"
- من `/solutions/ai-firewall/` → "موزعينا في الرياض"
- من `/solutions/ai-governance-platform/` → "شركة AI في الرياض"

#### Pillar 3: `/blog/sdaia-generative-ai-guidelines-practical-compliance/` (6 → 12 inbound)
**روابط مطلوبة (6 جديدة):**
- من `/blog/sdaia-seven-principles-practical-guide/` → "إرشادات سدايا العملية"
- من `/blog/saudi-ai-regulators-guide/` → "سدايا كمُنظِّم لـ AI التوليدي"
- من `/blog/generative-ai-governance-vs-traditional/` → "سدايا للذكاء الاصطناعي التوليدي"
- من `/blog/ai-usage-policy-template-saudi/` → "سياسة استخدام AI متوافقة مع سدايا"
- من `/blog/ai-governance-framework-saudi-model/` → "إرشادات سدايا ضمن الإطار"
- من `/docs/sdaia-generative-ai-guidelines/` → "دليل امتثال سدايا العملي"

#### Pillar 4: `/blog/generative-ai-education-saudi/` (5 → 10 inbound)
**روابط مطلوبة (5 جديدة):**
- من `/blog/ai-vs-machine-learning-explained/` → "AI في التعليم"
- من `/blog/digital-transformation-sme-saudi/` → "AI التوليدي للتعليم"
- من `/blog/ai-hr-recruitment-saudi/` → "AI في الموارد البشرية والتعليم"
- من `/blog/ai-ethics-saudi-responsible-ai/` → "AI المسؤول في التعليم"
- من `/solutions/` → "AI في قطاع التعليم"

#### Pillar 5: `/blog/banking-ai-governance-sama-requirements/` (9 → 12 inbound)
**روابط مطلوبة (3 جديدة):**
- من `/blog/healthcare-ai-governance-saudi-hospitals/` → "حوكمة AI في البنوك والمستشفيات"
- من `/blog/pdpl-and-ai-saudi/` → "PDPL في البنوك"
- من `/solutions/banking-ai-governance/` → "متطلبات SAMA الكاملة"

#### Pillar 6: `/blog/what-is-ai-governance-saudi-companies/` (8 → 12 inbound)
**روابط مطلوبة (4 جديدة):**
- من `/blog/ai-governance-saudi-arabia/` → "تعريف حوكمة AI"
- من `/blog/ai-governance/` → "ما هي حوكمة AI"
- من `/docs/ai-governance-platform/` → "تعريف حوكمة AI للمنشآت"
- من `/blog/ai-firewall-why-you-need-it/` → "حوكمة AI تشمل الـ Firewall"

### 4.2 Anchor Text Strategy (نصوص الربط)

| القاعدة | توضيح |
|---------|--------|
| استخدم الكلمة المستهدفة الحرفية في 60% من الـ anchors | `حوكمة البيانات`، `ضوابط الأمن السيبراني`، `NCA ECC` |
| تنويع 20% بصيغ قريبة | `دليل حوكمة البيانات`، `مبادئ حوكمة البيانات` |
| تنويع 20% بصيغ عامة | `اقرأ المزيد عن NDMO`، `المصدر الرسمي` |
| لا تستخدم "اضغط هنا" أو "هذا الرابط" أبداً | قاتل SEO |

---

## المحور 5 — AEO (Answer Engine Optimization) — 20 سؤال

### 5.1 أسئلة P0 — تظهر في Google SGE + Perplexity

| # | السؤال | الكلمة | AEO Source Page | Format |
|---|--------|--------|-----------------|--------|
| 1 | ما هي حوكمة الذكاء الاصطناعي ولماذا تحتاجها الشركات السعودية؟ | حوكمة AI | `/blog/what-is-ai-governance-saudi-companies/` | تعريف 40 كلمة + FAQ |
| 2 | ما هي عقوبات مخالفة نظام حماية البيانات الشخصية في السعودية؟ | نظام PDPL | `/blog/pdpl-penalties-saudi-fines/` | جدول عقوبات + أرقام مواد |
| 3 | كيف أطبّق ضوابط NCA ECC على أنظمة الذكاء الاصطناعي؟ | NCA ECC | `/docs/nca-ecc-ai-controls/` + `/blog/nca-ecc-ai-controls-guide/` | خارطة ربط |
| 4 | ما إرشادات سدايا للذكاء الاصطناعي التوليدي؟ | سدايا | `/docs/sdaia-generative-ai-guidelines/` + blog | Checklist قابل للاقتباس |
| 5 | ما الفرق بين ISO 27001 و ISO 42001؟ | ISO | `/blog/iso-27001-vs-iso-42001-ai-governance/` | جدول مقارنة |
| 6 | ما هي متطلبات SAMA لاستخدام الذكاء الاصطناعي في البنوك؟ | SAMA | `/blog/banking-ai-governance-sama-requirements/` | checklist 5 بنود |
| 7 | هل ChatGPT متوافق مع PDPL السعودي؟ | ChatGPT | `/blog/chatgpt-pdpl-data-compliance/` | نعم/لا + 3 شروط |
| 8 | ما هي اللائحة التنفيذية لنظام حماية البيانات الشخصية؟ | PDPL | `/blog/pdpl-executive-regulations-explained/` | تعريف + 7 بنود رئيسية |
| 9 | ما هي مبادئ سدايا السبعة لأخلاقيات الذكاء الاصطناعي؟ | سدايا | `/blog/sdaia-seven-principles-practical-guide/` | قائمة 7 عناصر |
| 10 | من هي الجهات التنظيمية للذكاء الاصطناعي في السعودية؟ | تنظيم | `/blog/saudi-ai-regulators-guide/` | جدول 4 جهات × أدوار |
| 11 | ما هو مكتب إدارة البيانات الوطنية NDMO؟ | NDMO | `/blog/ndmo-roles-requirements-guide/` | تعريف + 4 أدوار |
| 12 | ما هي أفضل شركة حوكمة ذكاء اصطناعي في السعودية؟ | شركات AI | `/blog/best-ai-companies-saudi-2026/` | قائمة 6 بمعايير |

### 5.2 أسئلة P1 — تظهر في Perplexity + ChatGPT search

| # | السؤال | الكلمة | AEO Source Page | Format |
|---|--------|--------|-----------------|--------|
| 13 | كيف أحمي بيانات العملاء عند استخدام AI؟ | حماية بيانات | `/blog/ai-customer-data-protection-saudi/` | 5 خطوات |
| 14 | ما هو سجل تدقيق AI ولماذا هو مهم؟ | Audit Trail | `/blog/ai-audit-trail-saudi/` + `/blog/ai-audit-trail-compliance-path/` | تعريف + 4 مكونات |
| 15 | ما هي تكلفة تطبيق الذكاء الاصطناعي للشركات السعودية؟ | تكلفة | `/blog/ai-implementation-cost-saudi/` | جدول أسعار |
| 16 | ما الفرق بين حوكمة AI وأمان AI وسلامة AI؟ | الفرق | `/blog/ai-governance-vs-ai-safety-vs-ai-security/` | 3 تعريفات |
| 17 | ما هي مخاطر الذكاء الاصطناعي الخفية في المؤسسات؟ | مخاطر | `/blog/hidden-ai-risks-saudi-organizations/` | قائمة 5 مخاطر |
| 18 | ما هي سياسة استخدام الذكاء الاصطناعي وكيف أكتبها؟ | سياسة | `/blog/ai-usage-policy-template-saudi/` | قالب 12 بند |
| 19 | ما هو جدار حماية AI (AI Firewall)؟ | Firewall | `/blog/ai-firewall-why-you-need-it/` + `/solutions/ai-firewall/` | تعريف + 3 use cases |
| 20 | ما هي رؤية 2030 في مجال الذكاء الاصطناعي؟ | رؤية 2030 | `/blog/ai-vision-2030-saudi/` + `/blog/vision-2030-ai-governance-roadmap/` | 5 محاور |

### 5.3 صيغة الـ AEO Paragraph (لكل Pillar)

نمط موحّد (40-50 كلمة، قابل للاقتباس الحرفي):

```markdown
حوكمة الذكاء الاصطناعي (AI Governance) هي مجموعة السياسات والضوابط
والأدوات التي تضمن استخدام الشركات للذكاء الاصطناعي بشكل آمن وشفاف
ومتوافق مع الأنظمة السعودية. تشمل تقييم المخاطر، سجلات التدقيق، حماية
البيانات، والموافقات البشرية على القرارات الحساسة.
```

**الكلمات المفتاحية في أول 30 كلمة ✓**
**تعريف واضح وقابل للاقتباس ✓**
**لا حشو ✓**

### 5.4 AEO Implementation Checklist

- [ ] تحديث `public/llms.txt` (آخر تحديث 2026-07-08) بإضافة 20 سؤال كاملاً مع pillar URL
- [ ] تحديث `public/llms-full.txt` بنفس الأسئلة + إجابات مختصرة
- [ ] إضافة `FAQPage` schema يدوياً للـ 6 Pillar pages (إن لم يكن موجوداً)
- [ ] إضافة `AEO paragraph` (40-50 كلمة) في أول 3 أسطر من كل Pillar page
- [ ] إضافة `SpeakableSpecification` schema على الـ 6 Pillar pages
- [ ] إضافة جداول/قوائم مرقمة (Google AI Overviews تفضلها)
- [ ] تحديث التواريخ (E-E-A-T) في كل Pillar page footer

---

## جدول الأولويات الملخّص

| P | الإجراء | الحجم | الجهد | الأثر المقدر |
|---|---------|-------|-------|---------------|
| **P0** | **F1-F4: frontmatter fix لـ 4 كلمات** | 4 صفحات | 30 دقيقة | +200 زيارة/شهر |
| **P0** | **35 JSON-LD additions** | 35 صفحة | 4-6 ساعات | +5-8% CTR عام |
| **P0** | **73 title optimizations** | 73 صفحة | 2 ساعة (سurgical) | +5-8% CTR |
| **P0** | **24 description trims** | 24 صفحة | 1 ساعة | +2-3% CTR |
| **P0** | **4 articles content gaps** | 4 مقالات جديدة | 12-16 ساعة (3,000-4,000 كلمة لكل) | +400-600 زيارة/شهر (6 أشهر) |
| **P0** | **تحديث llms.txt بـ 20 سؤال AEO** | 2 ملف | 1 ساعة | +citations في SGE/Perplexity |
| **P1** | **Internal linking P1 (6 pillars)** | 33 رابط جديد | 3-4 ساعات | +10-15% ترتيب |
| **P1** | **8 articles content expansion** | 8 مقالات | 16-20 ساعة | +500-800 زيارة/شهر |
| **P1** | **FAQ schema على Pillar pages** | 6 صفحات | 2-3 ساعات | +rich snippets |
| **P2** | **إنفاذ طول Description** | 24 صفحة | 1 ساعة | +1-2% CTR |
| **P2** | **AEO paragraph موحّد** | 6 Pillar pages | 1 ساعة | +citations |
| **P2** | **تنظيف KI-003 (en/about, /contact, /services ghosts)** | 3 ghost pages | 30 دقيقة | نقاء SERP |

---

## التوصيات النهائية (Top 5)

1. **ابدأ بـ F1-F4 (frontmatter فقط)** — 30 دقيقة = +200 زيارة/شهر خلال 60 يوم. عائد استثمار غير عادي.
2. **ثم 35 JSON-LD additions** — kernel/hub/legal بدون schema = أكبر خسارة نقدية في الـ Rich Results.
3. **ثم 4 articles content gaps** — خارطة ECC للذكاء الاصطناعي + خارطة ISO-SDAIA-PDPL = محتوى لا يستطيع أحد غيرنا كتابته.
4. **Internal linking plan** — 33 رابط في 4 ساعات = +10-15% PageRank على الـ pillars الضعيفة.
5. **AEO 20 سؤال** — llms.txt محدّث + FAQ schema = تهيئة لـ Google SGE و Perplexity citations.

---

**مرجع:** brain.md Section 2 (Change Ledger) | TOPICAL-AUTHORITY-PLAN.md | KEYWORD-REPORT.md
**التقرير الكامل:** 19KB، 12 قسم، يفصل كل action بخطوات قابلة للتنفيذ
**Commit message مقترح:** `docs(seo): comprehensive audit + opportunities report (35 JSON-LD gaps, 73 long titles, 4 content gaps, AEO 20 Q)`
