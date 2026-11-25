# 16 — BRIGHT AI / AIGAS · حزمة التنفيذ القادمة (5 Prompts)

**الأساس المثبت:** `d51f9792f9464126306667efda204622a726f0a7` · 25 نوفمبر 2026
**النطاق:** تعليمات لوكيل تطوير داخل مساحة محلية مصرح بها — ليست تغييرات منفذة.
**الوضع:** GitHub قراءة فقط · لا commit/push/merge · لا نشر تلقائي.

---

## كيف تستخدم هذا الملف

1. اقرأ HEAD الحالي وقارن بالمصفوفة أدناه قبل كل برومبت؛ **لا تعِد بناء ما ثبت اكتماله**.
2. اضغط زر النسخ في كتلة البرومبت (أو حدّدها كاملة) والصقها للوكيل كرسالة واحدة.
3. عند إغلاق البرومبت، ضع ✓ في مربع **«مكتمل»** أعلى قسمه.

> كل برومبت **مستقل وقابل للنسخ وحده**: يحتوي الشروط العامة ومعيار القبول والتبعية داخله.

---

## خريطة الحزمة

| # | البرومبت | الأولوية | يعتمد على | يفتح |
|:--:|:--|:--:|:--:|:--|
| 01 | [Production Infrastructure & Release](#prompt-01--production-infrastructure--release-p0) | `P0` | — | 02 |
| 02 | [Enterprise Persistence & Trial Conversion](#prompt-02--enterprise-persistence--trial-conversion-p1-مع-بوابات-p0) | `P1` | 01 | 03، 04 |
| 03 | [Saudi & Global Policy Intelligence / Agent Governance](#prompt-03--saudi--global-policy-intelligence--agent-governance-p1) | `P1` | 02 | 05 |
| 04 | [Model Assurance, Enterprise UX, Performance & SEO/GEO](#prompt-04--model-assurance-enterprise-ux-performance--seogeo-p1) | `P1` | 02، 03 | 05 |
| 05 | [Advanced Security & Release Assurance](#prompt-05--advanced-security--release-assurance-p0) | `P0` | 01–04 | الإطلاق |

**الترتيب الملزم:** 01 → 02 → (03 و04) → 05.

---

## الشروط العامة (المرجع الكامل)

الأساس المثبت: `d51f9792f9464126306667efda204622a726f0a7` بتاريخ 25 نوفمبر 2026. هذه تعليمات لوكيل تطوير داخل مساحة محلية مصرح بها، وليست تغييرات تم تنفيذها. قبل كل برومبت اقرأ HEAD الحالي وقارن بالمصفوفة؛ لا تعِد بناء ما ثبت اكتماله. GitHub قراءة فقط؛ لا commit/push/merge أو تغيير Render/Cloudflare/Neon أو إنشاء تكلفة دون إذن مستقل. لا تعدل Hero، ولا تحذف Secure Chat أو ملفات خارج النطاق، ولا تطبع `.env` أو مفاتيح. استخدم بيانات اصطناعية فقط. اتبع المصدر الحالي واكتب نتيجة صادقة لكل خطوة.

**معايير القبول العامة:** 80% لكل محور ومنتج، ولا P0 مفتوح للنطاق المراد إطلاقه؛ جميع شروط الأمان الحرجة يجب اجتيازها. لا تستبدل التنفيذ بصور تصميم أو ادعاءات. إذا تعذر وصول أو تفويض، سلّم خطة دقيقة وPatch مقترحًا بدل تجاوز الضوابط.

---

## PROMPT 01 — Production Infrastructure & Release (P0)

- [x] **مكتمل** — التاريخ: `____` · القرار (GO/NO-GO): `____`

````text
ROLE: Astro SSR / Render SRE / PostgreSQL Security Engineer

ROOT CAUSE (proven):
- الخدمة static_site وتنشر dist/client مع أن Blueprint Node.
- app و app/kernel تعيدان 404.
- الإنتاج: 31 جدولًا و2 سياسة فقط؛ Staging: 43 جدولًا و93 سياسة.
- سجل Staging: 32 APPLIED من 45 ملفًا.

FILES: astro.config.mjs، render.yaml، package.json، middleware، server/kernel/db.mjs، readiness.mjs، health-endpoint.mjs، migrations، scripts.
ملاحظة: لا تفترض أن 13 ملفًا غير المسجلة لم تُطبق؛ افحص الكتالوج وchecksums والاعتماديات. لا تفعّل الإنتاج.

STEPS:
1) ثبّت HEAD وحالة العمل وتكوينات البناء.
2) راجع توافق readiness والـhealth وأوامر package manager الفعلية ومخرج dist/server.
3) أنشئ خطة خدمة Web معزولة ومصرحًا بها مع صلاحيات runtime محدودة، فصل Staging/Production، env names فقط، CSP/no-store، origin allowlist، وتحقق الجلسات.
4) جهّز migration delta قابلة للاسترجاع؛ أثبت عزل tenant على Staging مصرحًا بها دون بيانات حقيقية.
5) طابق SHA والـschema وhealth، وحدد خطوات Render وDNS/Cloudflare وrollback للمشغل. لا تطلب الانتقال إلى DNS قبل قرار مستقل.

ACCEPTANCE: مسارات التطبيق لا تعيد 404 ثابتة، Auth يحجب غير المخول، readiness يصف الاعتماديات بدقة، لا تجاوز RLS، خطة رجوع مثبتة.
GATE: 80% لكل محور ومنتج، لا P0 مفتوح، كل شروط الأمان الحرجة PASS.

DELIVERABLES: source/deploy/schema parity، migration ledger reconciliation، local/staging runbook، أدلة وGO/NO-GO.
DEPENDENCY: بيئة محلية وStaging معتمدة؛ لا تغيير خارجي تلقائي.

CONSTRAINTS: read-only GitHub؛ لا commit/push/merge؛ لا تغيير Render/Cloudflare/Neon أو تكلفة دون إذن مستقل؛ لا تلمس Hero ولا تحذف Secure Chat أو ملفات خارج النطاق؛ لا تطبع .env أو المفاتيح؛ بيانات اصطناعية فقط؛ لا تخفف assertions؛ عند تعذر الوصول سلّم خطة دقيقة وPatch بدل تجاوز الضوابط.
````

---

## PROMPT 02 — Enterprise Persistence & Trial Conversion (P1 مع بوابات P0)

- [x] **مكتمل** — التاريخ: `____` · الحالة (DONE/PARTIAL/BLOCKED): `____`

````text
ROLE: Enterprise Product Architect / SaaS Security / Growth UX

STATE: Risk Engine يدير الأصول، وKernel يضم السياق والسياسات وملف self-service-trial، لكن المختبرات العامة منفصلة، والإنتاج لا يحتوي جدول self-service أو exploration.

FILES: src/server/risk-engine/core.mjs وservice.mjs، kernel/self-service-trial.mjs وaccess.mjs، src/components/ProductCatalog.astro، LabShell.astro، WorkspaceNavigation.astro، src/pages/demo/[product].astro، src/pages/app/trial/index.astro.
GOAL: تجربة موحدة دون حساب + مسار 48 ساعة مستقل.

STEPS:
1) اختر مسار تجربة canonical بعد جرد URLs؛ لا تضف مشروعًا جديدًا ولا تغيّر Hero.
2) ابنِ Governance Overview وInventory وإضافة أصل اصطناعي وتفاصيله وحزمًا وسياسات وتقييمات ومراجعات وأدلة مرتبطة بسياق الجلسة.
3) استخدم مخزنًا معزولًا قصير المدة أو حالة محلية واضحة الحدود؛ لا جداول إنتاج.
4) عند طلب تجربة 48 ساعة افصل Auth والتوثيق والعزل والحصص ومنح العمليات؛ لا تُنشئ إذن OWNER ضمن التجربة العامة ولا تفتح بيانات مؤسسية.
5) اجعل الحفظ والاتصال التجاري اختياريين بموافقة واضحة، ومسح الجلسة وفق سياسة محددة.
6) راجع عقد self-service وعمليات القراءة المحدودة وعدم التحويل المالي.

ACCEPTANCE: 4/4 منتجات يمكن فتحها وتجربتها دون تسجيل؛ تغيير أصل أو فحص يظهر في المنتجات المعنية؛ استقلال كل منتج؛ مسار تجربة 48h مثبت إن توفرت البيئة وإلا BLOCKED؛ عزل الجلسات وانتهاؤها ومنع cross-tenant.
GATE: 80% لكل محور ومنتج، لا P0 مفتوح، كل شروط الأمان الحرجة PASS.

DELIVERABLES: schema/contracts، خريطة UX، register لتوافق القديم، evidence، handoff للنشر.
DEPENDENCY: 01 للوظائف الخادمية؛ يمكن تنفيذ تجربة اصطناعية معزولة أولًا.

CONSTRAINTS: read-only GitHub؛ لا commit/push/merge؛ لا تغيير Render/Cloudflare/Neon أو تكلفة دون إذن مستقل؛ لا تلمس Hero ولا تحذف Secure Chat أو ملفات خارج النطاق؛ لا تطبع .env أو المفاتيح؛ بيانات اصطناعية فقط؛ لا تخفف assertions؛ عند تعذر الوصول سلّم خطة دقيقة وPatch بدل تجاوز الضوابط.
````

---

## PROMPT 03 — Saudi & Global Policy Intelligence / Agent Governance (P1)

- [ ] **مكتمل** — التاريخ: `____` · الحالة (DONE/PARTIAL/BLOCKED): `____`

````text
ROLE: AI Governance Specialist / Policy Architect / Product Engineer

STATE: Kernel policies موجودة بإصدارات ونطاقات والتزامات، لكن حزم المتطلبات والتتبع لم تُثبت.

FILES: kernel/policies.mjs، firewall/core.mjs وguard.mjs وescalation.mjs، risk-engine/core.mjs، human-gate/service.mjs، ledger/core.mjs، أي contracts جديدة بعد الجرد.
GOAL: حوكمة أصول ووكلاء تشبه مبدأ Credo AI وTrustible لا نسخة من واجهاتهما.

STEPS:
1) صمم Registry يشمل AI systems/models/agents/use cases/vendors، مع مالك وغرض ونسخة ومصدر بيانات وحدود أدوات وأفعال ومراجعة.
2) اربط الأصل بحزمة ذات إصدار وتاريخ ومرجع وانطباق.
3) ابدأ بحزمة داخلية اصطناعية كاملة؛ استند إلى مصادر رسمية عند إضافة PDPL/SDAIA/NIST AI RMF/ISO 42001/EU AI Act، وميّز قانون/معيار/إرشاد. لا تنقل نصوصًا معيارية كاملة.
4) كل requirement يرتبط بـcontrol وcheck وexpected evidence وresponsible owner؛ حالات Pass/Fail/Needs Evidence/Needs Review/N/A مبررة.
5) اجعل policy resolution حتميًا، وDENY/BLOCK mapping متوافقًا؛ حدًا أساسيًا لا يغيره الزائر.
6) نفّذ اختبار فعل وكيل اصطناعي (أداة مسموحة/محظورة/تحتاج موافقة)، وتوثيق الإصدار وربط human review.

ACCEPTANCE: تطبيق حزمة ينتج فحوصًا قابلة للتعديل والمراجعة؛ تغيير الإصدار يبطل النتائج القديمة حسب العقد؛ سلسلة requirement→evidence قابلة للتصدير؛ لا ادعاء امتثال أو تنفيذ أدوات خارجية.
GATE: 80% لكل محور ومنتج، لا P0 مفتوح، كل شروط الأمان الحرجة PASS.

DELIVERABLES: benchmark، pack schema، mapping register، ملفات التنفيذ المحلية، أدلة المصدر والتشغيل.
DEPENDENCY: 02 للسياق المشترك.

CONSTRAINTS: read-only GitHub؛ لا commit/push/merge؛ لا تغيير Render/Cloudflare/Neon أو تكلفة دون إذن مستقل؛ لا تلمس Hero ولا تحذف Secure Chat أو ملفات خارج النطاق؛ لا تطبع .env أو المفاتيح؛ بيانات اصطناعية فقط؛ لا تخفف assertions؛ عند تعذر الوصول سلّم خطة دقيقة وPatch بدل تجاوز الضوابط.
````

---

## PROMPT 04 — Model Assurance, Enterprise UX, Performance & SEO/GEO (P1)

- [ ] **مكتمل** — التاريخ: `____` · الحالة (DONE/PARTIAL/BLOCKED): `____`

````text
ROLE: Model Risk Engineer / Principal Designer / Astro Performance Specialist

STATE: Risk Engine لديه 3×3 draft ومعالجة، ولا يثبت مركز عدالة وأداء ومراقبة؛ واجهة عامة مختبرية موجودة.

FILES: src/components/RiskDemo.astro وRiskWorkspace.astro، server/risk-engine/core.mjs وservice.mjs وassist.mjs، src/components/design-system/*، src/styles، GoogleAnalytics.astro، layout وroutes الحالية.
GOAL: واجهة تقييم نماذج ومخاطر فعلية على نمط Holistic AI مع تجربة مؤسسية مشتركة.

STEPS:
1) صمم datasets اصطناعية معلنة: confusion matrix/precision/recall/FPR/FNR/accuracy ومعدلات مجموعات حيث تنطبق، مع حد العينة والمقام الصفري وعدم الادعاء بدلالة إحصائية بلا منهج.
2) للنماذج اللغوية والوكيل: سيناريوهات نجاح المهمة وسلامة السياسة والرفض/الإحالة ووقت الاستجابة، وGroq judge مساعد موسوم لا مرجع وحيد.
3) اجعل Monitoring تشغيلات مؤرخة ونتائج محفوظة في السياق المصرح؛ لا بيانات وهمية أو ادعاء مراقبة متصلة.
4) أضف Findings ومالك إجراء ومهلة وإعادة تقييم وتقرير مخاطر؛ لا تغيّر درجات المخاطر آليًا.
5) صمم Governance Overview/Inventory/Policy Packs/Firewall/Risk/Human Gate/Ledger بمكونات BRIGHT AI، كل منتج مختلف وظيفيًا، RTL/Bidi/sidebar/drawer.
6) اختبر المقاسات 320–1920 وkeyboard وfocus وreduced motion وcontrast؛ احم Hero بصريًا ووظيفيًا.
7) قس الأداء بدل تخمينه، وحافظ على canonical/indexability للعام وnoindex للخاص؛ راجع GA4 الحالي وعدم التكرار والخصوصية، ولا تغيّر Stream أو حسابًا خارجيًا.

ACCEPTANCE: نواتج المقاييس قابلة لإعادة الحساب، فرق initial/residual مبرر، كل metric له مصدر، مراقبة حقيقية لنطاقها أو replay موسوم، UX واضح، لا regression غير مفسر.
GATE: 80% لكل محور ومنتج، لا P0 مفتوح، كل شروط الأمان الحرجة PASS.

DELIVERABLES: evaluation evidence، UI before/after، coverage، SEO/analytics plan؛ لا ضمان ترتيب.
DEPENDENCY: 02 و03.

CONSTRAINTS: read-only GitHub؛ لا commit/push/merge؛ لا تغيير Render/Cloudflare/Neon أو تكلفة دون إذن مستقل؛ لا تلمس Hero ولا تحذف Secure Chat أو ملفات خارج النطاق؛ لا تطبع .env أو المفاتيح؛ بيانات اصطناعية فقط؛ لا تخفف assertions؛ عند تعذر الوصول سلّم خطة دقيقة وPatch بدل تجاوز الضوابط.
````

---

## PROMPT 05 — Advanced Security & Release Assurance (P0)

- [ ] **مكتمل** — التاريخ: `____` · القرار النهائي (LOCAL/PUBLIC/48H/COMMERCIAL): `____`

````text
ROLE: Independent Release Auditor / Security Engineer / Groq Integration Engineer

STATE: groq-gateway موجود، لكن approvedProviders وAPPROVED_MODELS فارغتان؛ publicSandbox export يعيد 503 DISABLED؛ RLS الإنتاج غير مكتمل؛ Ledger integrity-only.

FILES: server/ai/groq-gateway.mjs، public-sandbox-limiter.mjs، secure-chat/models.mjs، firewall/provider.mjs وguard.mjs وescalation.mjs، risk-engine/assist.mjs، human-gate/service.mjs، ledger/core.mjs وservice.mjs، kernel/env.mjs وdb.mjs.
GOAL: إثبات التشغيل الآمن دون تعطيل بوابات الاعتماد.

STEPS:
1) راجع إعدادات .env بأسماء متغيرات فقط، وتحقق من توافق GROQ_MODEL واسم المفتاح وموافقة المزود والبيانات والمنطقة والميزانية. لا تستخدم مفتاحًا مكشوفًا ولا تسجل القيم.
2) وحد Gateway إذا ثبت وجود مسارين متكررين؛ اضبط budget عالمي متعدد العمال، مهلة وحصص وconcurrency وvalidation وإخفاق آمن.
3) نفّذ اتصالًا اصطناعيًا محدودًا فقط عند الاعتماد.
4) اجعل Firewall يقرر حتميًا ويمنع DENY قبل الإرسال، وHuman Gate يتطلب مراجعًا صالحًا وإذنًا ذريًا أحادي الاستخدام، وRisk Engine يحسب محليًا ويقبل اقتراحات استشارية فقط، وLedger يعيد التحقق من SHA-256 ويصدر حزمة واضحة الحدود.
5) اختبر عزل جلسات ومؤسستين اصطناعيتين، رفض تغيير الطلب بعد الموافقة، إعادة التنفيذ، حدود المعدل، انتهاء الجلسة، فشل المزود، فحص المخرجات، وTamper Test لنسخة لا الأصل.
6) لا تُرسل بيانات حساسة أو أسرار إلى logs/analytics، ولا تُنفّذ Red Team على أنظمة حية غير مصرح بها.
7) نفّذ الاختبارات المناسبة الموجودة وPlaywright/Browser في البيئة المعزولة، ولا تخفف assertions. أعد تطبيق scorecard قبل/بعد بالمقام نفسه؛ أضف متطلبات جديدة بسجل مستقل.

ACCEPTANCE: 80% لكل محور ومنتج، اجتياز كل critical gates، لا P0، Groq حي فقط في النطاق المعتمد، 4/4 وظائف E2E مثبتة، Hero مطابق، build ناجح.
GATE: 80% لكل محور ومنتج، لا P0 مفتوح، كل شروط الأمان الحرجة PASS.

DELIVERABLES: جدول أدلة وأخطاء، نسبة التشغيل المحلي وStaging والحي منفصلة، قرارات LOCAL / PUBLIC / 48H / COMMERCIAL، خطة نشر مستقلة.
DEPENDENCY: جميع البرومبتات السابقة. لا publish تلقائيًا.

CONSTRAINTS: read-only GitHub؛ لا commit/push/merge؛ لا تغيير Render/Cloudflare/Neon أو تكلفة دون إذن مستقل؛ لا تلمس Hero ولا تحذف Secure Chat أو ملفات خارج النطاق؛ لا تطبع .env أو المفاتيح؛ بيانات اصطناعية فقط؛ لا تخفف assertions؛ عند تعذر الوصول سلّم خطة دقيقة وPatch بدل تجاوز الضوابط.
````

---

## سجل التشغيل

| # | التاريخ | SHA المُنفَّذ عليه | القرار | ملاحظة |
|:--:|:--|:--|:--:|:--|
| 01 | | | | |
| 02 | | | | |
| 03 | | | | |
| 04 | | | | |
| 05 | | | | |
