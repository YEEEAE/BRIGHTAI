# جدول شبكة الربط الداخلي Hub-and-Spoke — 2026-07-08

**المشروع**: brightai.site
**التاريخ**: 2026-07-08
**المُنفّذ**: BrightAI Workspace Agent
**النطاق**: 53 blog + 18 docs (SEO) = 71 مقال + 13 solution pages = 84 ملف إجمالي
**النمط**: Hub-and-Spoke مع 6 عناقيد (Pillars)

---

## ملخص تنفيذي

شبكة الربط الداخلي تربط كل مقال SEO بـ 4 روابط (Pillar عنقوده + 2 مقالين شقيقين + 1 صفحة solution). الـ Pillars الستة تستقبل روابط عكسية من كل مقالات عنقودها (جدول محتويات في نهاية الصفحة). صفحات `/solutions/*` تربط بـ 2-3 مقالات blog ذات صلة قطاعية.

**العناقيد الستة + Pillars**:
1. **الحوكمة** → `/blog/ai-governance-saudi-arabia/` (26 مقال: 16 blog + 10 docs)
2. **PDPL** → `/docs/pdpl-ai-complete-guide/` (12 مقال: 9 blog + 3 docs)
3. **NCA ECC** → `/docs/nca-ecc-ai-controls/` (6 ملفات: 2 blog + 4 docs)
4. **سدايا SDAIA** → `/docs/sdaia-generative-ai-guidelines/` (7 ملفات: 6 blog + 1 doc)
5. **القطاعات** → `/solutions/` (19 blog، الـ Pillar هو صفحة الحلول الأم)
6. **ISO** → `/blog/iso-42001-saudi-implementation-guide/` (1 blog فقط)

**ملاحظة معمارية**: عنقود "القطاعات" لا يوجد به مقال Pillar منفصل — الـ Pillar هو `/solutions/` نفسه (صفحة index تجمع 13 حلاً). هذا استثناء متعمد لأن المحتوى قائم على Solutions لا على blog.

**استثناء النطاق**: 23 ملف `kernel-*` + `superpowers.md` خارج شبكة SEO هذه (وثائق تقنية داخلية، مو محسنة لـ SEO).

---

## عنقود 1: الحوكمة (Governance) — Pillar: `/blog/ai-governance-saudi-arabia/`

**المقالات الـ 26 في العنقود**:

| # | المقال | النوع | العنوان | شقيق 1 | شقيق 2 | Solution | Anchor Text |
|---|---|---|---|---|---|---|---|
| 1 | /blog/ai-governance-saudi-arabia | PILLAR | حوكمة الذكاء الاصطناعي في السعودية | — | — | /solutions/ai-governance-platform/ | حوكمة AI في السعودية |
| 2 | /blog/ai-governance-framework-saudi-model | blog | إطار حوكمة AI السعودي | #3 | #4 | /solutions/ai-governance-platform/ | إطار حوكمة الذكاء الاصطناعي |
| 3 | /blog/ai-usage-policy-template-saudi | blog | قالب سياسة استخدام AI | #2 | #4 | /solutions/policy-to-control-mapping/ | قالب سياسة استخدام الذكاء الاصطناعي |
| 4 | /blog/generative-ai-governance-vs-traditional | blog | حوكمة GenAI vs التقليدي | #2 | #5 | /solutions/ai-governance-platform/ | حوكمة الذكاء الاصطناعي التوليدي |
| 5 | /blog/what-is-ai-governance-saudi-companies | blog | ما هي حوكمة AI للشركات السعودية | #2 | #6 | /solutions/continuous-ai-governance/ | حوكمة AI للشركات |
| 6 | /blog/best-ai-governance-platforms-2026 | blog | أفضل منصات حوكمة AI 2026 | #5 | #7 | /solutions/ai-governance-platform/ | منصات حوكمة الذكاء الاصطناعي |
| 7 | /blog/vision-2030-ai-governance-roadmap | blog | خارطة طريق رؤية 2030 | #1 | #6 | /solutions/ai-governance-platform/ | خارطة طريق حوكمة AI في رؤية 2030 |
| 8 | /blog/ai-governance | blog | حوكمة AI | #1 | #5 | /solutions/ai-governance-platform/ | حوكمة AI |
| 9 | /blog/ai-governance-vs-ai-safety-vs-ai-security | blog | حوكمة vs سلامة vs أمن AI | #8 | #10 | /solutions/ai-governance-platform/ | حوكمة الذكاء الاصطناعي |
| 10 | /blog/ai-ethics-saudi-responsible-ai | blog | أخلاقيات AI السعودية | #9 | #11 | /solutions/ai-governance-platform/ | أخلاقيات الذكاء الاصطناعي |
| 11 | /blog/ai-firewall-why-you-need-it | blog | لماذا تحتاج AI Firewall | #12 | #13 | /solutions/ai-firewall/ | AI Firewall |
| 12 | /blog/hidden-ai-risks-saudi-organizations | blog | مخاطر AI الخفية | #11 | #13 | /solutions/ai-risk-classification/ | مخاطر الذكاء الاصطناعي الخفية |
| 13 | /blog/shadow-ai-discovery-saudi-company | blog | اكتشاف Shadow AI | #11 | #12 | /solutions/ai-use-case-discovery/ | اكتشاف Shadow AI |
| 14 | /blog/ai-audit-trail-saudi | blog | AI Audit Trail السعودية | #15 | #16 | /solutions/ai-audit-trail/ | سجل تدقيق الذكاء الاصطناعي |
| 15 | /blog/ai-audit-trail-compliance-path | blog | مسار امتثال AI Audit Trail | #14 | #16 | /solutions/ai-audit-trail/ | مسار امتثال AI Audit Trail |
| 16 | /blog/ai-red-teaming-security-testing | blog | AI Red Teaming اختبار أمن | #14 | #15 | /solutions/ai-firewall/ | اختبار AI Red Teaming |
| 17 | /docs/ai-governance-saudi-arabia | doc | حوكمة AI في السعودية (docs) | #18 | #19 | /solutions/ai-governance-platform/ | حوكمة AI للشركات السعودية |
| 18 | /docs/ai-governance-platform | doc | منصة حوكمة AI | #17 | #19 | /solutions/ai-governance-platform/ | منصة حوكمة الذكاء الاصطناعي |
| 19 | /docs/ai-risk-management | doc | إدارة مخاطر AI | #20 | #17 | /solutions/ai-risk-classification/ | إدارة مخاطر الذكاء الاصطناعي |
| 20 | /docs/governance-application | doc | تطبيق الحوكمة | #17 | #18 | /solutions/ai-governance-platform/ | تطبيق حوكمة AI |
| 21 | /docs/ai-firewall | doc | AI Firewall | #22 | #11 | /solutions/ai-firewall/ | جدار حماية الذكاء الاصطناعي |
| 22 | /docs/ai-evidence-file | doc | ملف أدلة AI | #21 | #23 | /solutions/ai-evidence-file/ | ملف أدلة AI |
| 23 | /docs/ai-audit-trail | doc | AI Audit Trail | #14 | #22 | /solutions/ai-audit-trail/ | سجل تدقيق AI |
| 24 | /docs/ai-audit-readiness | doc | جاهزية تدقيق AI | #23 | #19 | /solutions/ai-audit-trail/ | جاهزية تدقيق الذكاء الاصطناعي |
| 25 | /docs/human-approval-layer | doc | طبقة الموافقة البشرية | #5 | #9 | /solutions/human-approval-layer/ | طبقة الموافقة البشرية |
| 26 | /docs/superpowers | doc | الصلاحيات | #9 | #25 | /solutions/continuous-ai-governance/ | إدارة الصلاحيات |

---

## عنقود 2: PDPL — Pillar: `/docs/pdpl-ai-complete-guide/`

**المقالات الـ 12 في العنقود**:

| # | المقال | النوع | العنوان | شقيق 1 | شقيق 2 | Solution | Anchor Text |
|---|---|---|---|---|---|---|---|
| 1 | /docs/pdpl-ai-complete-guide | PILLAR | الدليل الشامل PDPL + AI | — | — | /solutions/ai-governance-platform/ | نظام حماية البيانات الشخصية |
| 2 | /blog/chatgpt-pdpl-data-compliance | blog | ChatGPT والبيانات الشخصية | #3 | #4 | /solutions/ai-firewall/ | ChatGPT و PDPL |
| 3 | /blog/pdpl-cross-border-data-transfer-ai | blog | نقل البيانات خارج السعودية | #2 | #4 | /solutions/ai-governance-platform/ | نقل البيانات الشخصية خارج السعودية |
| 4 | /blog/pdpl-executive-regulations-explained | blog | اللائحة التنفيذية PDPL | #3 | #5 | /solutions/ai-governance-platform/ | اللائحة التنفيذية PDPL |
| 5 | /blog/pdpl-penalties-saudi-fines | blog | عقوبات PDPL والغرامات | #4 | #6 | /solutions/continuous-ai-governance/ | عقوبات PDPL والغرامات |
| 6 | /blog/pdpl-compliance-guide-saudi-companies | blog | دليل امتثال PDPL للشركات | #5 | #7 | /solutions/ai-governance-platform/ | امتثال PDPL للشركات السعودية |
| 7 | /blog/pdpl-and-ai-saudi | blog | PDPL والذكاء الاصطناعي | #6 | #8 | /solutions/ai-governance-platform/ | PDPL والذكاء الاصطناعي |
| 8 | /blog/pdpl-ai-safety | blog | PDPL وسلامة AI | #6 | #7 | /solutions/ai-firewall/ | PDPL وسلامة الذكاء الاصطناعي |
| 9 | /blog/pdpl-ai-compliance-guide | blog | دليل امتثال PDPL + AI | #7 | #6 | /solutions/ai-governance-platform/ | دليل امتثال PDPL والذكاء الاصطناعي |
| 10 | /blog/ai-customer-data-protection-saudi | blog | حماية بيانات العملاء | #2 | #3 | /solutions/ai-firewall/ | حماية بيانات العملاء |
| 11 | /docs/pdpl-chatgpt-data-protection | doc | حماية بيانات ChatGPT | #2 | #12 | /solutions/ai-firewall/ | حماية بيانات ChatGPT في PDPL |
| 12 | /docs/pdpl-ai-governance | doc | حوكمة AI وفق PDPL | #1 | #11 | /solutions/ai-governance-platform/ | حوكمة AI وفق PDPL |

---

## عنقود 3: NCA ECC — Pillar: `/docs/nca-ecc-ai-controls/`

**الملفات الـ 6 في العنقود** (تم بناؤها في REPORTS-NCA-ECC-CLUSTER-FIX):

| # | المقال | النوع | العنوان | شقيق 1 | شقيق 2 | Solution | Anchor Text |
|---|---|---|---|---|---|---|---|
| 1 | /docs/nca-ecc-ai-controls | PILLAR | NCA ECC + AI: الدليل الشامل | — | — | /solutions/ai-firewall/ | ضوابط NCA ECC |
| 2 | /docs/nca-ecc-ai-guide | doc | تطبيق NCA ECC على AI: خطة 90 يوم | #3 | #4 | /solutions/policy-to-control-mapping/ | تطبيق NCA ECC على الذكاء الاصطناعي |
| 3 | /docs/nca-ecc-ai-controls-mapping | doc | خريطة ربط ضوابط NCA ECC | #2 | #4 | /solutions/policy-to-control-mapping/ | خريطة ضوابط NCA ECC |
| 4 | /docs/nca-ecc-ai-governance | doc | حوكمة AI وفق NCA ECC | #3 | #2 | /solutions/ai-governance-platform/ | حوكمة AI وفق NCA ECC |
| 5 | /blog/nca-ecc-ai-controls-guide | blog | ضوابط الأمن السيبراني الأساسية | #6 | #2 | /solutions/ai-firewall/ | ضوابط الأمن السيبراني |
| 6 | /blog/nca-cybersecurity-requirements-saudi | blog | هيئة الأمن السيبراني ومتطلباتها | #5 | #2 | /solutions/ai-firewall/ | الهيئة الوطنية للأمن السيبراني |

---

## عنقود 4: SDAIA — Pillar: `/docs/sdaia-generative-ai-guidelines/`

**الملفات الـ 7 في العنقود** (4 جديدة + 1 قديمة + Pillar + 1 قديمة):

| # | المقال | النوع | العنوان | شقيق 1 | شقيق 2 | Solution | Anchor Text |
|---|---|---|---|---|---|---|---|
| 1 | /docs/sdaia-generative-ai-guidelines | PILLAR | إرشادات سدايا للذكاء الاصطناعي التوليدي | — | — | /solutions/ai-governance-platform/ | إرشادات سدايا للذكاء الاصطناعي التوليدي |
| 2 | /blog/saudi-ai-landscape-sdaia-humain-allam-scai | blog | مشهد AI السعودي | #3 | #4 | /solutions/continuous-ai-governance/ | مشهد الذكاء الاصطناعي السعودي |
| 3 | /blog/sdaia-seven-principles-practical-guide | blog | مبادئ سدايا السبعة | #2 | #4 | /solutions/ai-governance-platform/ | مبادئ سدايا السبعة |
| 4 | /blog/ndmo-roles-requirements-guide | blog | مكتب إدارة البيانات NDMO | #5 | #6 | /solutions/policy-to-control-mapping/ | مكتب إدارة البيانات الوطنية NDMO |
| 5 | /blog/saudi-ai-regulators-guide | blog | الجهات التنظيمية AI | #4 | #3 | /solutions/ai-governance-platform/ | الجهات التنظيمية للذكاء الاصطناعي في السعودية |
| 6 | /blog/sdaia-generative-ai-guidelines-practical-compliance | blog | إرشادات سدايا العملية | #1 | #3 | /solutions/ai-governance-platform/ | إرشادات سدايا العملية |
| 7 | /blog/ndmo-data-governance-saudi | blog | حوكمة بيانات NDMO | #4 | #5 | /solutions/policy-to-control-mapping/ | حوكمة بيانات NDMO |

---

## عنقود 5: القطاعات (Sectors) — Pillar: `/solutions/`

**المقالات الـ 19 blog في العنقود** (لا توجد docs هنا، الـ Pillar هو صفحة الحلول الأم):

| # | المقال | العنوان | شقيق 1 | شقيق 2 | Solution | Anchor Text |
|---|---|---|---|---|---|---|
| 1 | /blog/best-ai-companies-saudi-2026 | شركات AI في السعودية 2026 | #2 | #3 | /solutions/ai-governance-platform/ | شركات الذكاء الاصطناعي في السعودية |
| 2 | /blog/choose-ai-company-riyadh | شركات التقنية في الرياض | #1 | #4 | /solutions/ai-governance-platform/ | شركات التقنية في الرياض |
| 3 | /blog/arabic-chatbot-customer-service-saudi | شات بوت عربي لخدمة العملاء | #4 | #5 | /solutions/ai-governance-platform/ | شات بوت عربي لخدمة العملاء |
| 4 | /blog/rpa-automation-saudi-savings | أتمتة RPA والتوفير | #3 | #5 | /solutions/continuous-ai-governance/ | أتمتة RPA في السعودية |
| 5 | /blog/generative-ai-education-saudi | GenAI في التعليم | #3 | #6 | /solutions/ai-governance-platform/ | GenAI في التعليم السعودي |
| 6 | /blog/digital-transformation-sme-saudi | التحول الرقمي للمنشآت الصغيرة | #7 | #8 | /solutions/ai-use-case-discovery/ | التحول الرقمي للمنشآت الصغيرة |
| 7 | /blog/computer-vision-saudi-factories | الرؤية الحاسوبية في المصانع | #8 | #9 | /solutions/ai-governance-platform/ | الرؤية الحاسوبية في المصانع السعودية |
| 8 | /blog/ai-vision-2030-saudi | AI ورؤية 2030 | #7 | #9 | /solutions/ai-governance-platform/ | AI ورؤية 2030 |
| 9 | /blog/ai-neom-smart-city | AI ونيوم المدينة الذكية | #10 | #11 | /solutions/ai-governance-platform/ | AI ونيوم المدينة الذكية |
| 10 | /blog/ai-healthcare-saudi | AI في الرعاية الصحية | #11 | #12 | /solutions/healthcare-ai-governance/ | AI في الرعاية الصحية السعودية |
| 11 | /blog/ai-ecommerce-saudi | AI في التجارة الإلكترونية | #10 | #12 | /solutions/ai-governance-platform/ | AI في التجارة الإلكترونية السعودية |
| 12 | /blog/ai-real-estate-saudi | AI في العقار | #10 | #11 | /solutions/ai-governance-platform/ | AI في العقار السعودي |
| 13 | /blog/ai-implementation-cost-saudi | تكلفة تطبيق AI | #14 | #15 | /solutions/ai-use-case-discovery/ | تكلفة تطبيق الذكاء الاصطناعي |
| 14 | /blog/ai-hr-recruitment-saudi | AI في التوظيف | #13 | #15 | /solutions/ai-governance-platform/ | AI في التوظيف السعودي |
| 15 | /blog/big-data-analytics-saudi-companies | تحليلات البيانات الضخمة | #13 | #14 | /solutions/ai-governance-platform/ | تحليلات البيانات الضخمة للشركات السعودية |
| 16 | /blog/ai-banking-saudi | AI في البنوك السعودية | #17 | #18 | /solutions/banking-ai-governance/ | AI في البنوك السعودية |
| 17 | /blog/ai-vs-machine-learning-explained | AI vs تعلم الآلة | #16 | #19 | /solutions/ai-governance-platform/ | الفرق بين AI وتعلم الآلة |
| 18 | /blog/healthcare-ai-governance-saudi-hospitals | حوكمة AI في المستشفيات | #10 | #16 | /solutions/healthcare-ai-governance/ | حوكمة AI في المستشفيات السعودية |
| 19 | /blog/banking-ai-governance-sama-requirements | حوكمة AI في البنوك SAMA | #16 | #18 | /solutions/banking-ai-governance/ | حوكمة AI وفق متطلبات SAMA |

---

## عنقود 6: ISO 42001 — Pillar: `/blog/iso-42001-saudi-implementation-guide/`

**مقال واحد فقط** (لا يمكن ربط بشقيقين، نكتفي بـ Pillar + Solution):

| # | المقال | العنوان | شقيق | Solution | Anchor Text |
|---|---|---|---|---|---|
| 1 | /blog/iso-42001-saudi-implementation-guide | PILLAR — تطبيق ISO 42001 في السعودية | — | /solutions/ai-governance-platform/ | ISO 42001 في السعودية |

**ملاحظة**: العنقود يحتاج توسعة مستقبلية (DEC-2026-ISO-EXPANSION). حالياً لا توجد مقالات شقيقة كافية. الـ Pillar يربط مباشرة بـ Governance Pillar كـ sibling بدلاً من شقيق آخر.

---

## روابط عكسية من صفحات `/solutions/*` → blog (2-3 مقالات لكل صفحة)

| Solution | المقالات المرتبطة |
|---|---|
| /solutions/ai-governance-platform/ | /blog/ai-governance/، /blog/what-is-ai-governance-saudi-companies/، /blog/best-ai-governance-platforms-2026/ |
| /solutions/ai-firewall/ | /blog/ai-firewall-why-you-need-it/، /blog/chatgpt-pdpl-data-compliance/، /blog/nca-cybersecurity-requirements-saudi/ |
| /solutions/ai-audit-trail/ | /blog/ai-audit-trail-saudi/، /blog/ai-audit-trail-compliance-path/، /docs/ai-audit-trail/ |
| /solutions/ai-evidence-file/ | /docs/ai-evidence-file/، /docs/ai-audit-readiness/، /blog/banking-ai-governance-sama-requirements/ |
| /solutions/human-approval-layer/ | /docs/human-approval-layer/، /blog/healthcare-ai-governance-saudi-hospitals/، /blog/banking-ai-governance-sama-requirements/ |
| /solutions/continuous-ai-governance/ | /blog/pdpl-penalties-saudi-fines/، /blog/saudi-ai-landscape-sdaia-humain-allam-scai/، /blog/rpa-automation-saudi-savings/ |
| /solutions/ai-risk-classification/ | /docs/ai-risk-management/، /blog/hidden-ai-risks-saudi-organizations/، /blog/shadow-ai-discovery-saudi-company/ |
| /solutions/ai-use-case-discovery/ | /blog/digital-transformation-sme-saudi/، /blog/shadow-ai-discovery-saudi-company/، /blog/ai-implementation-cost-saudi/ |
| /solutions/policy-to-control-mapping/ | /blog/ai-usage-policy-template-saudi/، /blog/ndmo-roles-requirements-guide/، /docs/nca-ecc-ai-controls-mapping/ |
| /solutions/banking-ai-governance/ | /blog/banking-ai-governance-sama-requirements/، /blog/ai-banking-saudi/، /blog/healthcare-ai-governance-saudi-hospitals/ |
| /solutions/government-ai-governance/ | /blog/saudi-ai-regulators-guide/، /blog/sdaia-seven-principles-practical-guide/، /docs/sdaia-generative-ai-guidelines/ |
| /solutions/healthcare-ai-governance/ | /blog/healthcare-ai-governance-saudi-hospitals/، /blog/ai-healthcare-saudi/، /docs/human-approval-layer/ |
| /solutions/manufacturing-ai-governance/ | /blog/computer-vision-saudi-factories/، /blog/ai-implementation-cost-saudi/، /blog/ai-vision-2030-saudi/ |

---

## خطة التنفيذ (Phased)

### المرحلة 1: تحديث الـ Pillars (إضافة/تحديث جدول المحتويات)
- `ai-governance-saudi-arabia` (موجود TOC، يحتاج تحديث + إضافة 10 docs + 16 blog)
- `pdpl-ai-complete-guide` (يحتاج TOC جديد)
- `nca-ecc-ai-controls` (موجود TOC، يحتاج تحقق)
- `sdaia-generative-ai-guidelines` (موجود TOC، يحتاج تحقق)
- `iso-42001-saudi-implementation-guide` (يحتاج إضافة روابط)

### المرحلة 2: إضافة روابط inbound في الـ spokes (per cluster)
- عنقود الحوكمة: 16 blog + 10 docs = 26 ملف
- عنقود PDPL: 9 blog + 3 docs = 12 ملف
- عنقود NCA ECC: 2 blog + 4 docs = 6 ملفات (جزئياً مكتمل)
- عنقود SDAIA: 6 blog + 1 doc = 7 ملفات (جزئياً مكتمل)
- عنقود القطاعات: 19 blog
- عنقود ISO: 1 blog

### المرحلة 3: روابط عكسية في صفحات `/solutions/*`
- 13 صفحة solution → 2-3 مقالات لكل صفحة

### المرحلة 4: التحقق
- `npm run build` → 0 أخطاء
- `npm run internal-links:audit` → 0 broken links
- `npm run seo:gate` → pass
- التحقق اليدوي من مقال عينة لكل عنقود

---

## المخاطر (Risks)

1. **MEDIUM**: تعديل 70+ ملف دفعة واحدة يستهلك وقت ويصعّب الـ rollback. الحل: تنفيذ per cluster + commit per cluster.
2. **MEDIUM**: الإضافة inline تتطلب اختيار موضع طبيعي — قد يبدو غير طبيعي لو الإضافة آلية بحتة. الحل: اختيار الجملة الأنسب يدوياً لكل ملف.
3. **LOW**: عنقود ISO به مقال واحد فقط — لا يمكن تحقيق قاعدة "2 شقيقين". نتجاوز بقبول Pillar + Solution فقط.
4. **LOW**: الـ Anchor Text diversity 20% — التطبيق الحالي 100% literal. نطبق 80% literal + 20% variation (إضافة أدوات تعريف أو صيغ مرادفة).

---

**الحالة**: planned → in-progress
**التاريخ**: 2026-07-08