---
## مهمة البرومبت 06

**إغلاق منتج Firewall داخل نقطة إنفاذ واحدة صادقة وملزِمة**

### الملفات والمكونات التي تبدأ منها

- `src/server/firewall/core.mjs`
- `src/server/firewall/service.mjs`
- `src/server/firewall/guard.mjs`
- `src/server/firewall/binding.mjs`
- `src/server/firewall/escalation.mjs`
- `src/server/firewall/provider.mjs`
- `src/pages/app/api/firewall/evaluate.ts`
- `src/pages/app/api/firewall/guarded-executions.ts`
- `src/pages/app/firewall/index.astro`
- `migrations/0011_aigas_firewall_execution_binding.sql`
- `migrations/0012_aigas_firewall_five_state_upgrade.sql`

### الأوامر التنفيذية الدقيقة

1. أنجز خمس حالات القرار المعيارية في نطاق المنتج: `ALLOW/WARN/REDACT/REQUIRE_APPROVAL/BLOCK` أو أسماؤها الصحيحة في الكود، مع دلالة منفصلة وحالة fail-closed حيث تكون السياسة Mandatory. لا تغيّر state machine دون مراعاة حقول SQL والواجهات.
2. تأكد أن المسار الذي يُرسل طلبًا إلى مزود AI يستدعي القرار **قبل** الإرسال، وليس مجرد واجهة Evaluate يمكن تجاوزها. عند BLOCK يُمنع الاتصال الخارجي، وعند REDACT لا يمر إلا المحتوى المنقح؛ وفي انتظار Human Gate لا تُرسل الرسالة.
3. امنع replay واختلاف body/tenant/policyVersion/approvalGrant بربط نسخة وحيدة أو digest وidempotency؛ عند فشل Ledger الإلزامي لا تكمل العملية الحساسة. لا تعتمد على شراء Ledger لتسجيل Audit Kernel الأساسي.
4. أعِد استخدام Firewall rules/decisions الحقيقية في Neon، مع أولوية القواعد والسياق والمعاملة؛ لا تحفظ نصًا حساسًا خامًا في سجل القرار.
5. `provider.mjs` قد يبقى بلا مزود معتمد؛ عند غياب موافقة Provider/No-Training/Region/Secret اجعل الواجهة والـAPI تقول `PROVIDER_NOT_CONFIGURED` ولا تكتب Connector وهميًا أو تحوّل Demo إلى حماية «شغالة».
6. حسّن الواجهة لعرض طلب/قاعدة/قرار/سبب/حالة مرحلة التسليم بوضوح، لا تعلن حماية جميع تطبيقات العميل؛ نطاق الحماية محصور في الطلبات التي تمر فعليًا عبر نقطة التكامل.
7. لا تتصل بنموذج حقيقي أو تكتب إلى الإنتاج؛ أنجز Code paths المحليّة واترك اعتماد المزود والإثبات التشغيلي لبوابات تسليم منفصلة.

### حد الإكمال وإغلاق المخاطر

أنجز كل ما يسمح به الكود المحلي الحالي ضمن نطاق المهمة. لكل اعتماد خارجي (موارد/بيانات اعتماد/قرارات قانونية/تفعيل خدمة/دليل تشغيل) ضع عائقًا واضحًا ولا تتجاوزه بافتراضات. لا تُجري تعديلًا في GitHub أو Neon production، ولا تنشئ نتائج مصطنعة لإيهام نجاح التشغيل.
---
# 

---

# FINAL CODEX / DEEPSEEK HERMAS PROMPT 15/15 — إنتاج حزمة تسليم صادقة تعلن ما ثبت وما يُمنع إطلاقه، بلا نشر أو اختبارات

**أولوية المهمة:** P0
**نوعها:** تنفيذ إغلاق نهائي للمصدر المحلي فقط، بدون اختبارات أو نشر.

## عقد الوكيل المستقل — يجب تنفيذه في كل برومبت

**المشروع الذي ستعمل عليه:** `YEEEAE/BRIGHTAI` — مؤسسة مُشرقة / BRIGHT AI هي المؤسسة، AI Governance & Safety (AIGAS) التخصص، `AIGAS Kernel` طبقة مشتركة لا تُباع منفصلة، والمنتجات المستقلة: Firewall وLedger وHuman Gate وRisk Engine وSecure Chat. هذا البرومبت مكتفٍ بذاته؛ لا تفترض اطلاعك على محادثة ChatGPT أو فحوصها السابقة. اقرأ نسختك المحلية من `AGENTS.md`, `.agents/mind/01-mind-latest.md`, `docs/MASTER-PROJECT-BLUEPRINT.md`, و`docs/PLATFORM-ARCHITECTURE.md` ووثائق المنتج الستة المعنية، ثم **اعتمد الكود والقاعدة الحالية إن تغيّرت عن لقطة التقرير**.

**نطاق صلاحية الوكيل:** نفّذ تعديل الملفات **في نسخة العمل المحلية فقط**. GitHub مصدر قراءة فقط؛ لا `git add/commit/push`, لا PR/merge، لا نشر، لا تشغيل خدمات إنتاج أو تغيير DNS/Render، لا كتابة إلى Neon production أو تغيير إعداداته أو ترحيل بياناته. استخدم Neon MCP للقراءة/الجرد فقط. لو احتجت جدولًا أو migration، جهز ملف SQL محليًا وحدد نقطة اعتماد الإنسان قبل تطبيقه على بيئة مستقلة. لا تُنشئ مستخدمين أو بيانات عميل حقيقية. لا تُعد استخدام الأسرار المرسلة سابقًا؛ ولا تضع قيمًا سرية في البرومبت أو الملفات tracked أو Console أو المتصفح.

**أسلوب العمل:** المطلوب **تنفيذ تحسينات كود محددة**، وليس مجرد خطة، وليس رفع نسبة إنجاز أو إعلان اعتماد. احفظ الـroutes وعقود API والأقسام ونصوص الموقع الحالية، ولا تلمس Hero/Constellation/Hero animation/Header/Logo المحمية إلا بتفويض صريح جديد. لا تكتب اختبارات أو تشغّلها، ولا `build`/`lint`/`typecheck` أو Playwright أو لقطات شاشة أو تقرير تدقيق إضافي؛ هذه حزمة إغلاق كود وليست تفويض تحقق/إطلاق. **هذا القيد لا يعادل قبولًا تشغيليًا:** اترك كل ما لم يُفحص `NOT_VERIFIED`، وسلّم بلوكِر صريحًا عندما يلزم إثبات أو اعتماد. قلّل الاعتماديات، وأعد استخدام Astro + Node standalone + Neon Auth + `pg` + CSS/motion الموجودة.

**ضوابط المنتج:** عزل tenant من جلسة خادمية موثوقة، RBAC وSoD وعدم استخدام مدخل العميل وحده سلطة؛ No-Training وبيانات اصطناعية افتراضيًا؛ أي AI provider/region/retention/secret يتطلب موافقة حقيقية قبل تشغيل الطلب؛ Fail-Closed للسياسة أو الأدلة الإلزامية، مع استمرار Audit Kernel الأساسي حتى دون ترخيص Ledger. لا تجعل شراء منتج آخر شرطًا للحماية الأساسية. الواجهات عربية RTL، وتفرّق بين Working in source / Not Configured / Trial / Live؛ لا تُزوّر مؤشرات أو امتثالًا أو شهادات أو نتائج تسجيل.

**حالة مرجعية مؤرخة للفهم وليست افتراضًا عن نسختك المحلية:** GitHub `main` عند `e33b480744b5d0b44344bf469f09b6cbbb50248f` في 3-نوفمبر-2026، وNeon `young-frog-60183055`: 31 جدول AIGAS فعلية لكن بلا سجلات عمل، وAuth بلا مستخدمين/جلسات، وRLS على 31 جدولًا وسياسات مباشرة لاثنين فقط، وفرع production غير محمي. صفحات `/app/` الستة أعادت 404 على `brightai.live` بينما صفحات التسويق و`/docs/` عملت. `APPROVED_MODELS=[]` و`AIGAS_APP_ENABLED=false` بحسب كود المصدر. لا تفترض أن كل هذه الحقائق بقيت كما هي؛ اقرأ الوضع الفعلي قبل تعديل الكود.

**صيغة ردّك النهائي:** 3 فقرات موجزة فقط: (1) ملفات/وظائف الكود المحلي التي أنجزتها، (2) القرارات/الاعتمادات/الترحيلات التي لم تلمس إنتاجها، (3) حالة العمل المتبقي بلا ادعاء اختبار أو إطلاق. لا تكتب «جاهز 100%» أو `RUNTIME_VERIFIED` دون دليل مستقل.

## مهمة البرومبت 15

**إنتاج حزمة تسليم صادقة تعلن ما ثبت وما يُمنع إطلاقه، بلا نشر أو اختبارات**

### الملفات والمكونات التي تبدأ منها

- `AGENTS.md`
- `.agents/mind/01-mind-latest.md`
- `docs/MASTER-AGENT-CONTEXT.md`
- `docs/PRODUCT-MASTER-CATALOG.yaml`
- `docs/products/*/FEATURE-STATUS.yaml`
- `astro.config.mjs`
- `render.yaml`
- `migrations/*`
- `src/pages/app/*`
- `src/server/*`

### الأوامر التنفيذية الدقيقة

1. أنشئ ملف تسليم محليًا `docs/FINAL-RELEASE-HANDOFF.md` يرتبط بآخر commit محلي وNeon branch المستهدف؛ صنّف كل مكوّن بوضوح إلى `SOURCE_IMPLEMENTED`, `SCHEMA_PRESENT`, `CONFIGURED`, `RUNTIME_VERIFIED` أو `BLOCKED`, ولا ترفع أي ميزة إلى Runtime Verified دون دليل مستقل مؤرخ.
2. أدرج 12 بوابة قرار: Source↔Deploy، Identity/Tenant، Data Access، Kernel policy، Firewall، Ledger، Human Gate، Risk Engine، Secure Chat، Trial/Commercial، Legal/Privacy، Operations/Restore. كل Gate له Owner، Evidence Required، Current Evidence، Missing Evidence، Release Decision Placeholder.
3. ابنِ سجل موانع `P0/P1/P2` في ملف Markdown مستقل عن اختبارات، مع `source_path`, `required_action`, `authority_needed`, `status`, `risk_if_ignored`. لا تكرر مشاكل قديمة أُغلقت فعليًا؛ اعتمد النسخة الحالية من الكود.
4. راجع ميثاق التسويق: لا تُطلق منتجًا لأن صفحة `/products/.../` نشرت أو لأن API تعمل محليًا. إذا كانت البوابة 404 أو `AIGAS_APP_ENABLED=false` أو Secure Chat لا يملك نموذجًا معتمدًا، ضع `NO-GO` صريحًا لنطاقها.
5. أخرج Runbook مختصرًا **للمشغل المخول لاحقًا**: تسلسل الموافقات، تهيئة أسرار server-side، تطبيق migrations على staging، الإقرار بالنسخ والاستعادة، فتح علم البوابة، DNS/SSR، ثم المراقبة والدعم. لا تنفذ أي خطوة خارج مساحة العمل.
6. لا تكتب نسبة تقدم مئوية دون تعداد Requirements ودليل لكل Requirement. إذا غاب دليل التشغيل اذكر `NOT_VERIFIED` بدقة، ولا تحول اختيار المالك عدم تشغيل اختبارات إلى نجاح افتراضي.
7. جميع الشروط أعلاه للتسليم البرمجي فقط؛ قرار نشر أول عميل/تجربة/منتج تجاري يبقى **توقيعًا إداريًا منفصلًا**، وليس رد الوكيل الختامي.

### حد الإكمال وإغلاق المخاطر

أنجز كل ما يسمح به الكود المحلي الحالي ضمن نطاق المهمة. لكل اعتماد خارجي (موارد/بيانات اعتماد/قرارات قانونية/تفعيل خدمة/دليل تشغيل) ضع عائقًا واضحًا ولا تتجاوزه بافتراضات. لا تُجري تعديلًا في GitHub أو Neon production، ولا تنشئ نتائج مصطنعة لإيهام نجاح التشغيل.
