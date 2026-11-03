## [2026-11-03] — إكمال دورة أصل/تقييم/معالجة في Risk Engine (محلي فقط)
### تم التنفيذ
- أُضيف كائن منهج معلن `METHOD` (محاور 1–3، نطاقات 1–2/3–4/6–9، معنى inherent/residual، وقيود صريحة) ويُعاد مع قائمة الأصول والتقييمات والمعالجة والتصدير؛ لا مقياس 0–100 ولا ادعاء ISO/سدايا/امتثال.
- أصبحت حالة التقييم مشتقة من مطابقة `asset_version` فقط: الأصل بلا تقييم أو بتقييم قديم يظهر `NOT_ASSESSED`/`REASSESSMENT_REQUIRED` ولا يُحتسب LOW. وقراءات التفاصيل تستخدم `FOR SHARE` بينما الكتابة فقط `FOR UPDATE`.
- تعديل الأصل يعيد `changed_fields` و`reassessment_required` و`treatment_review_required`؛ لا تتغير الدرجات السابقة ولا يُمحى سجل المعالجة.
- قبول الخطر: تعليل مسجل ≥20 حرفًا، وOWNER مستقل للخطر HIGH، واستجابة `acceptance` + `deployment_authorized:false` و`policy_override:false`، مع تدقيق صريح `risk_engine.treatment.accepted`.
- التصدير يضيف `method` و`authorization_scope` و`data_quality` (غير مقيّم/إعادة تقييم/مراجعة معالجة/قبول حالي) مع بقاء حد 10000 أصل.
- الواجهة توضح الفرق بين الخطر الكامن والمتبقي، ورسائل «يحتاج تقييمًا»، وحد التعليل عند القبول. أضيف `migrations/0021_aigas_risk_engine_acceptance_guard.sql` كمسودة محلية غير مطبقة.
### الملفات المتأثرة
- `src/server/risk-engine/{core,service,http}.mjs`, `src/components/RiskWorkspace.astro`, `src/scripts/risk-engine.ts`, `migrations/0021_aigas_risk_engine_acceptance_guard.sql`, `docs/RISK-ENGINE-DEVELOPMENT.md`, `docs/products/risk-engine/FEATURE-STATUS.yaml`
### التحقق
- `node --check` للملفات `.mjs` المعدلة و`git diff --check`: PASS. build/lint/typecheck/tests/Playwright/PostgreSQL/Neon/متصفح: NOT RUN حسب طلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTED — NOT RUNTIME VERIFIED؛ لا commit/push/deploy ولا كتابة إلى Neon أو GitHub.
### ملاحظات / مشاكل مفتوحة
- `0021` غير مطبق على أي بيئة؛ يلزم اعتماد بشري وبيئة معتمدة. تشغيل Risk Engine ما زال محجوبًا أيضًا بـ`0017` (سياق التدقيق) وعدم وجود مستخدم/جلسة أو دور runtime/RLS متحقق. لا توجد درجة للخطر المتبقي؛ هو وصف نصي فقط.

## [2026-11-03] — متابعة إغلاق Human Gate: أجسام POST والانتقالات وربط إذن التنفيذ
### تم التنفيذ
- أُصلح خلل خادمي حقيقي في `http.mjs`: الإلغاء والتفويض وإلغاء التفويض كانت تُنفّذ بجسم فارغ فتفشل دائمًا؛ أصبح كل مسار POST يقرأ JSON الخاص به.
- أصبحت الانتقالات تُفحص صراحةً في الخدمة عبر `canTransition` قبل كل تغيير حالة (قرار، إلغاء، انتهاء، تنفيذ)، مع بقاء حارس قاعدة البيانات المرجع النهائي.
- عُزّز `0014` غير المطبق: القرار يتطلب طلبًا `PENDING` وبصمة ونسخة سياسة مطابقتين، والتنفيذ يتطلب إذنًا `CONSUMED` لنفس المقدم والبصمة، والإذن لا يتجاوز مهلة الطلب، والاستهلاك من المقدم قبل الانتهاء.
- استجابة التنفيذ تُرجع `approval_expires_at`، والواجهة تسمّي تبويب الحالات المنتهية «منتهية»، وتعلن «عملية AIGAS محدودة» صراحةً، وتعرض الأثر الفعلي بصيغة مفهومة.
### الملفات المتأثرة
- `src/server/human-gate/{http,service}.mjs`, `migrations/0014_aigas_human_gate_cancellation_delegation_and_grant.sql`, `src/pages/app/human-gate/index.astro`, `src/scripts/human-gate.ts`, `src/styles/human-gate.css`, `docs/HUMAN-GATE-DEVELOPMENT.md`
### التحقق
- `node --check` للملفات المعدلة و`git diff --check`: PASS. build/lint/typecheck/tests/Playwright/DB/Neon/متصفح: NOT RUN حسب طلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTED NOT RUNTIME VERIFIED؛ لا commit/push/deploy ولا تغيير GitHub أو Neon.
### ملاحظات / مشاكل مفتوحة
- `0014` ما زال غير مطبق على بيئة معتمدة؛ تشغيل الإلغاء/التفويض/الإذن يبقى محجوبًا حتى اعتماد المشغّل وتطبيق الترحيل ومراجعة RLS/Grants وجلسة حقيقية. التنفيذ الفعلي محصور في تغيير اسم مساحة Kernel والملاحظة التجريبية؛ لا تنفيذ أنظمة خارجية.

## [2026-11-03] — إغلاق مصدر Ledger وموافقات Human Gate (محلي فقط)
### تم التنفيذ
- Ledger: أصبحت الحالة المشتقة صريحة بثلاث قيم `VERIFIED_WITHIN_SCOPE / TAMPERED / UNVERIFIED` بدل `VERIFIED/BLOCKED`، وتُحسب لكل حدث من بصمته + سلامة البادئة، فلا يظهر صف مطابق داخل سلسلة مكسورة كحالة إيجابية.
- حزمة التصدير تحمل الآن `chain_version` صريحًا مع `profile` و`previous_hash` و`head_hash`، والفاحص المستقل `2.2.0` يرفض `chain_version` المخالف ويعيد `assurance=INTEGRITY_ONLY_NO_SIGNATURE` و`scope=SUPPLIED_PREFIX_ONLY`. لم يُشغّل الفاحص ولم يُنشر.
- واجهة Ledger تعرض الحالة المدمجة بدل بصمة الصف وحدها، وتوضح معنى المصطلحات الثلاثة وطريقة السلسلة؛ فلاتر المصدر/الفترة/الحالة (تصنيف الحدث) وتفاصيل الحدث وحظر التصدير لغير المالك/المسؤول قائمة.
- Human Gate: التحقق من بصمة الطلب في مسار العرض صار fail-closed عند صف قديم/مشوه بدل رمي 400، وأُضيف `binding_version` و`approval_expires_at` إلى استجابات القائمة/الإنشاء/القرار/التنفيذ والواجهة.
- التنفيذ يرفض إذنًا زمنيًا يتجاوز نافذة الطلب المعتمدة (`BINDING_INVALID`) إضافة إلى فحوص البصمة والعملية والهدف ومراجع القرار وصلاحيته.
- لم تُلمس routes أو عقود API أو Hero/Header/Logo أو migrations أو Neon؛ لا commit/push/deploy.
### الملفات المتأثرة
- `src/server/ledger/{core,writer,service}.mjs`, `public/downloads/aigas-ledger-verifier.mjs`, `src/scripts/ledger.ts`, `src/pages/app/ledger/index.astro`, `src/styles/ledger.css`
- `src/server/human-gate/service.mjs`, `src/scripts/human-gate.ts`, `docs/{LEDGER-DEVELOPMENT,HUMAN-GATE-DEVELOPMENT}.md`
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check`: PASS. build/lint/typecheck/tests/Playwright/verifier/DB/Neon/متصفح: NOT RUN حسب طلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTED NOT RUNTIME VERIFIED؛ لا اختبار أو إطلاق أو نشر.
### ملاحظات / مشاكل مفتوحة
- يبقى `0013` (قيد Ledger الخماسي وحارس السلسلة) و`0014` (grants/الحالات/التفويض) غير مطبقين على بيئة معتمدة؛ أي تشغيل فعلي لهذين المسارين محجوب حتى اعتماد المشغّل وتطبيقهما ومراجعة RLS/grants وجلسة حقيقية.
- لا توقيع مستقل ولا WORM/Blockchain ولا ضمان احتفاظ؛ حالات Ledger الجديدة تصف سلامة النسخة الموردة فقط.

## [2026-11-03] — إغلاق سياسات Kernel ومسار Firewall الواحد + تطبيق 0020
### تم التنفيذ
- أصبح قرار `evaluateKernelPolicy` يشرح `policyId/version/scope/action/reason/mandatory` لكل سياسة، ويميّز `MANDATORY_BLOCK`؛ لا ترفعه موافقة بشرية ولا قاعدة منتج، و`binding.policyReference` يقرأ الشكل الجديد.
- دورة السياسة: إحالة، اعتماد بعدد مراجعين مستقلين (`requiredApprovals` 1 أو 2)، منع الاعتماد المكرر لنفس الشخص (`ALREADY_APPROVED`)، فصل الواجبات للنشر عن المنشئ والمعتمدين، وسحب النسخة إلى مسودة (`withdraw`). واجهة الإدارة تعتمد على أعلام `can*` المحسوبة خادميًا لا على الدور في المتصفح.
- أضيف سياق تدقيق (`correlationId` و`policyVersion`) لكل عمليات السياسات والإدارة، وبقيت الكتابة داخل المعاملة نفسها فلا يُعلن نجاح عند فشل التدقيق.
- صار تمييز حالة المنتج: `NOT_CONFIGURED` لغياب صف الإتاحة أو `FOUNDATION`، مع `DISABLED/ENABLED/EXPIRED/REVOKED` من الجداول الحالية ودون ادعاء Live.
- Firewall: الحارس يرفض كل المسارات (بما فيها `ESCALATE`) دون قرار Kernel `ALLOW` محفوظ، فموافقة بشرية لا ترفع منعًا إلزاميًا؛ ولوحة Firewall تعرض نقطة إنفاذ واحدة وحالة تنفيذ مشتقة (`BLOCKED/PROVIDER_NOT_CONFIGURED`) وسلسلة قرار Kernel.
- بطلب المالك الصريح «قم بالترحيل»، طُبق `0020` على فرع `production` في مشروع Neon `young-frog-60183055`/قاعدة `neondb` بمعاملة واحدة، بعد فحص مسبق أكد غياب العمود وصفر صفوف في السياسات/النسخ/الاعتمادات.
### الملفات المتأثرة
- `src/server/kernel/{policies,core,service,administration}.mjs`, `src/server/firewall/{guard,service,binding}.mjs`, `src/scripts/{kernel,firewall}.ts`, `src/pages/app/kernel/index.astro`
- `migrations/0020_aigas_kernel_policy_review_requirements.sql` (جديد، مطبق على production) وتحديث خط أساس `0010`، `docs/{KERNEL-DEVELOPMENT,FIREWALL-DEVELOPMENT}.md`
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check`: PASS. بناء/اختبارات/متصفح: NOT RUN حسب طلب المهمة.
- فحص Neon بعد الترحيل: العمود `required_approvals` موجود NOT NULL DEFAULT 1، قيد `1..2` وقيد الإجراءات يشمل `WITHDRAWN`، والفهرس موجود، وعدد الجداول 31 بلا جدول جديد، وصفوف السياسات/النسخ/الاعتمادات ما زالت صفرًا.
### النتيجة
- **الحالة:** الترحيل DONE ومخططه متحقق؛ الكود المحلي PARTIAL / NOT VERIFIED تشغيليًا. لا commit/push/deploy ولا نشر.
### ملاحظات / مشاكل مفتوحة
- `0020` مطبق على production؛ أي بيئة أخرى تحتاج تطبيقه قبل تشغيل هذا الكود. منع `HARD_DENY` من الإيقاف يبقى مقصودًا؛ استبداله يحتاج سياسة جديدة أشد ومسار اعتماد مستقلًا. مزود Firewall وتكامل Human Gate ما زالا فارغين، فالتنفيذ الخارجي BLOCKED، والتشغيل/RLS/Grants NOT VERIFIED.

## [2026-11-03] — إكمال الهوية والمؤسسات والإدارات والأعضاء (محلي فقط)
### تم التنفيذ
- أصبح إنشاء المؤسسة متاحًا لأي حساب موثّق غير موقوف حتى لو كان عضوًا في مؤسسة أخرى؛ المؤسسة الجديدة تبدأ بعضويتك OWNER وحدك دون نسخ أعضاء/سياسات/دعوات/إتاحة، مع قفل استشاري وحد إساءة 10 مساحات (`WORKSPACE_LIMIT`).
- `GET /members/` يضيف نموذج `departments` مُقلّلًا: OWNER/ADMIN يريان الأسماء والأعضاء، والعضو يرى الإدارات التي ينتمي إليها فقط دون قوائم أخرى؛ التحقق الخادمي في `evaluateKernelPolicy` باقٍ.
- مُنع تغيير العضو لدوره بنفسه (`SELF_ROLE_CHANGE_REJECTED`) حتى للمالك، مع بقاء حماية آخر مالك وعدم نقل الملكية؛ وأُضيف إلغاء دعوة صريح يتطلب تأكيد Auth (`canceled`) قبل تسجيل/تدقيق `kernel.invitation.canceled`.
- `/auth/accept-invitation/` صارت صفحة قبول صريحة بحالات تحميل/فراغ/منتهية/دعوة غير صالحة/تبعية غير متاحة، بدل تحويل تلقائي؛ لا قبول عند فتح الرابط.
- أُضيفت حالات عربية لأخطاء الصلاحية/التبعية في Kernel، وUI يعرض الإدارات وأزرار إلغاء الدعوة، ويخفي تعديل الدور الذاتي.
### الملفات المتأثرة
- `src/server/kernel/{service,administration,core}.mjs`, `src/pages/auth/accept-invitation.astro`, `src/pages/app/kernel/index.astro`, `src/pages/app/api/kernel/members.ts`, `src/scripts/kernel.ts`, `src/styles/kernel.css`, `docs/KERNEL-DEVELOPMENT.md`
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check`: PASS. build/lint/typecheck/tests/Playwright/Neon: NOT RUN حسب طلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / تنفيذ محلي غير متحقق تشغيليًا؛ لا commit/push/deploy ولا تغيير Neon أو إنشاء مستخدم/دعوة.
### ملاحظات / مشاكل مفتوحة
- إلغاء الدعوة يعتمد على إتاحة Organization لدى Neon Auth؛ أول تهيئة مؤسسية وقبول فعلي يحتاجان مشغّلًا مصرحًا. حد 10 مساحات سياسة إساءة محلية وليس باقة. `Audit/15-FINAL-EXECUTION-PROMPTS-COMBINED.md` ظهر معدّلًا أثناء المهمة من جهة غير هذه المهمة ولم يُلمس.
- إنشاء أول مؤسسة تحت دور `aigas_runtime` (0019) يظل محجوبًا: لا سياسة INSERT على `aigas_tenants` ولا عضوية أولى OWNER؛ الكود يعمل تحت اتصال المالك الحالي فقط. لم تُضعف 0019، ويلزم ترحيل bootstrap معتمد مستقل.

## [2026-11-03] — إغلاق فجوات منح الوصول عبر RLS وGRANT ودور التشغيل (محلي فقط)
### تم التنفيذ
- جرد قراءة فقط عبر Neon MCP أكد: `neondb_owner` هو دور `DATABASE_URL` و`rolbypassrls=true`؛ `authenticated` يملك DML على 31 جدولًا وEXECUTE افتراضيًا؛ RLS مفعّل على 31 وسياسات على جدولين فقط؛ Data API `active` على `public`؛ لا بيانات ولا مستخدمين.
- الكود يرفض `workspace` غير الصالح كـUUID قبل أي استعلام، ويضبط سياق `aigas.tenant_id`/`aigas.user_id` معامليًا (`set_config(...,true)`) بعد التحقق من العضوية فقط؛ العضوية أصبحت عبر مسار واحد `assertTenantMembership`، و`audit` يرفض tenant غير صالح، وقراءة عضوية Secure Chat صارت داخل معاملة.
- لوحة Kernel المعتمدة تعرض `system.rls: BYPASSED/ENFORCED` بدل ادعاء عزل؛ لم يُضف هذا للفحص العام المجهول.
- أُضيفت مهاجرتان محليتان غير مطبقتين: `0018` تسحب منح `authenticated`/`anonymous` وتلغي default privileges وتشدد سياستي Secure Chat بالعضوية؛ `0019` تنشئ دور `aigas_runtime` بـ`NOBYPASSRLS` وسياسات نطاق مؤسسة.
- وثّق `docs/DATA-ACCESS-AND-RLS.md` المصفوفة والعوائق، وحُدّث `PLATFORM-ARCHITECTURE` بلقطة مصدر مؤرخة.
### الملفات المتأثرة
- `src/server/kernel/{core,db,access,service}.mjs`, `src/server/secure-chat/service.mjs`, `docs/{DATA-ACCESS-AND-RLS,PLATFORM-ARCHITECTURE}.md`, `migrations/0018_*.sql`, `migrations/0019_*.sql`
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check`: PASS. build/lint/typecheck/tests/Playwright/Neon writes: NOT RUN بطلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / تنفيذ محلي غير متحقق تشغيليًا؛ لا commit/push/deploy ولا تغيير Neon أو Data API.
### ملاحظات / مشاكل مفتوحة
- تحويل `DATABASE_URL` إلى `aigas_runtime` محجوب بـ: اعتماد المالك، فرع تطوير ونسخة استعادة، اعتماد دور تسجيل دخول خارج SQL، حل bootstrap إنشاء مساحة العمل وقبول الدعوات، وتطبيق `0016` قبل منح دالة الحصة. تعطيل Data API إجراء control-plane منفصل.

## [2026-11-03] — بوابة `/app/*`: استجابة 503 عند التعطيل وتوثيق تشغيل المشغّل
### تم التنفيذ
- تحوّلت البوابة المعطلة من تحويل 302 إلى `/contact/` إلى رد خادمي مباشر: صفحة HTML عربية `503` لمسارات `/app/*` وJSON `{code:"APP_UNAVAILABLE"}` لـ`/app/api/*`، مع `no-store`/`noindex`/`Retry-After`، ودون أي بيانات أو رابط دخول وهمي. الجسم في `src/server/kernel/unavailable.mjs` والترتيب في `src/middleware.ts`.
- صار `AIGAS_APP_ENABLED=false` يتغلّب صراحةً حتى في التطوير، وقيمة `true` هي الطريقة الوحيدة لفتح تشغيل غير تطويري؛ غياب العلم يُبقي `astro dev` مفتوحًا فقط.
- عُزّزت ترويسات `AppLayout` بـ`CDN-Cache-Control: no-store`، وأُضيف دليل مشغّل موجز يفصل Node SSR عن الاستضافة الثابتة ويحدد مكان تغيير الخدمة/الأسرار/العلم.
- أُبقيت `output:'server'` و`@astrojs/node` standalone و`npm start` كما هي؛ لا تغيير في routes أو عقود API أو المنتجات أو الهيرو/الهيدر/الشعار، ولا استيراد server جديد في أي عميل.
### الملفات المتأثرة
- `src/middleware.ts`, `src/server/kernel/{env,unavailable}.mjs`, `src/layouts/AppLayout.astro`, `render.yaml`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`
### التحقق
- `node --check` للملفين المعدل/الجديد، وتشييد استجابتي 503 برمجيًا (الحالة والترويسات)، و`git diff --check`: PASS.
- build/lint/typecheck/tests/Playwright/متصفح/خادم/نشر: NOT RUN حسب طلب المهمة. لا تغيير على GitHub أو Neon.
### النتيجة
- **الحالة:** DONE كمصدر محلي لإغلاق البوابة؛ التشغيل والنشر NOT VERIFIED.
### ملاحظات / مشاكل مفتوحة
- إصلاح 404 الحقيقي على `brightai.live` يتطلب ربط الدومين بخدمة Node SSR وتمرير `/app/*` دون CDN، ثم تحقق المشغّل من الاستجابة الفعلية؛ لم يُنفّذ أي نشر أو تعديل DNS/Render. `AIGAS_APP_ENABLED` بقي `false`.

## [2026-11-03] — توحيد الحقيقة بين المتطلبات والكود والمخطط والواجهات
### تم التنفيذ
- أُنشئ `docs/CURRENT-IMPLEMENTATION-REGISTER.md` يجرد المسارات والـAPIs والترحيلات وحالة Neon قراءة فقط، ويصنّف كل قدرة `FW/LD/HG/RE/SC` بحقول APPROVED_REQ وSOURCE_PRESENT وSCHEMA_PRESENT وRUNTIME_NOT_VERIFIED وBLOCKED_BY مع دليل الملف/الدالة.
- أُنشئ `docs/SOURCE-TO-CLAIM-MAP.md` لربط روابط المنتجات وTrust/Compliance بنوع الادعاء (مطلب معتمد / تنفيذ محلي / مرجع منشور / تنقل فقط) دون رفع أي حالة إتاحة.
- صُححت أعداد Registry و`MASTER-AGENT-CONTEXT` (35 مسارًا عامًا، 34 قابلًا للفهرسة، 11 مقالة) وأُضيف فحص مصدر مؤرخ في `PLATFORM-ARCHITECTURE` يثبت وجود `src/pages/app/api/**` دون ادعاء نشر.
- صُححت حقول Neon في سجل Firewall وLedger، وأُضيفت لقطات مصدر مؤرخة للخمسة؛ وعُلّمت الفجوات `0013/0014/0016/0017` كعوائق تشغيل. أُصلح YAML غير صالح مسبقًا في `FEATURE-STATUS` الخاص بـFirewall.
- فُصل تعيين `REQUEST_APPROVAL↔ESCALATE` و`BLOCK↔DENY` في الكتالوج كتعيين تنفيذي لا يغيّر المتطلب. لم تُلمس واجهات المنتجات أو الهيرو/الهيدر/الشعار.
### الملفات المتأثرة
- `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/SOURCE-TO-CLAIM-MAP.md`, `docs/{WEBSITE-PAGE-REGISTRY,MASTER-AGENT-CONTEXT,PLATFORM-ARCHITECTURE,PRODUCT-MASTER-CATALOG}.*`
- `docs/products/*/FEATURE-STATUS.yaml`, `AGENTS.md`, `.agents/AGENTS.md`
### التحقق
- تحليل YAML لملفات الكتالوج وRegistry وسجلات المنتجات الخمسة: PASS؛ `git diff --check`: PASS. مجموع جداول Neon المرصود 31، وRLS على 31، وسياسات على جدولين، وكل عدّادات العمل صفر.
- build/lint/typecheck/tests/Playwright/متصفح/نشر: NOT RUN حسب طلب المهمة.
### النتيجة
- **الحالة:** DONE محليًا كمصدر حقيقة موحد؛ التشغيل والنشر NOT VERIFIED. لا commit/push/deploy ولا تغيير Neon.
### ملاحظات / مشاكل مفتوحة
- الكود الحالي يحتاج `0013/0014/0016/0017` قبل أي تشغيل معتمد؛ `0017` غيابه يمنع كل تدقيق Kernel، و`0014` يمنع Human Gate، و`0013` يمنع أدلة Firewall الخماسية. لا مستخدم/جلسة ولا نموذج معتمد.

## [2026-11-03] — مركز المعرفة بأسلوب AI Knowledge Command Center
### تم التنفيذ
- أُعيد تصميم `/docs/` على المرجع التفاعلي الثاني: تصنيفات يمين، بحث عربي فوري، منتجات متعددة بمنطق OR مع AND لباقي الفلاتر، عرض مضغوط/موسع ومعاينة مستقلة؛ البحث والفلاتر مرتبطة بالرابط والتاريخ.
- نُقل كتالوج الأدلة الـ11 إلى مصدر واحد، وأصبحت الأقسام ووقت القراءة والتصنيفات الإضافية وروابط المنتجات مشتقة من HTML المقالات الفعلي أثناء البناء. Kernel وLedger بلا روابط منتج صريحة حاليًا؛ تظهر لهما نتيجة صفر بدل توثيق مخترع.
- أُضيف غلاف قراءة خاص بـ`/knowledge/` بفهرس sticky وتقدم تمرير وإبراز القسم وروابط مرتبطة بالتصنيف؛ الرجوع يحتفظ بالفلاتر والتمرير. مصادر نصوص المقالات ومراجعها وSEO لم تُعدّل، وكذلك الرئيسية والهيدر والفوتر.
### الملفات المتأثرة
- `src/pages/docs.astro`, `src/components/{PageShell,KnowledgeReader,KnowledgeIcon}.astro`, `src/data/knowledge.ts`, سكربتات وتنسيقات `knowledge-*`, `src/server/knowledge/`, `tests/knowledge-search.test.mjs`.
- أدلة ولقطات: `Audit/knowledge-command-center/`.
### التحقق
- Node 22.22.2؛ `npm run build` و`git diff --check`: PASS؛ اختبارات البحث واستخراج المحتوى: 3/3 PASS.
- Chrome محلي 1440/360: البحث وOR/AND والحالة الفارغة والمعاينة والعرض الموسع وEscape/التركيز والرجوع/التقدم واستعادة تمرير 650px وتقليل الحركة: PASS؛ JavaScript معطل: 11 رابطًا ظاهرًا.
- المقالات الـ11: HTTP 200 وH1 واحد وcanonical وJSON-LD وفهرس صالح: PASS؛ لا تجاوز صفحة عند فحصها بعرض محتوى 356px. تقدم القراءة الفعلي متحقق في PDPL. الصور محفوظة في Audit.
### النتيجة
- **الحالة:** DONE محليًا؛ لا commit/push/deploy. فحص شامل للوصول وSafari وقياسات الأداء والإنتاج: NOT VERIFIED.

## [2026-11-03] — مقال «أداة التقييم الذاتي لأخلاقيات الذكاء الاصطناعي من سدايا»
### تم التنفيذ
- أُنشئ `/knowledge/sdaia-ai-ethics-self-assessment/` بتصميم لوحة نتائج تركوازي مختلف: حلقة تقدم، مقاييس نصف دائرية، فاحص جاهزية من 10 أسئلة بحساب محلي، ونموذج تقرير ورقي اصطناعي، بطول 3299 كلمة على مقياس `scripts/count-words.mjs`.
- تحققت الوقائع من صفحة الخدمة على منصة حوكمة البيانات الوطنية وبيان الإطلاق: 81 سؤالاً، 7 مبادئ، مقياس 1–5، تقرير لكل مبدأ، والفئات المستفيدة، والإطلاق في نوفمبر 2024. لا نسخ لأسئلة الأداة.
- أُضيفت بطاقة رقم 11 في `docs.astro` بقسم المخاطر ونوع «مصفوفة تعليمية»؛ العدّاد صار 11، والبحث والتصفية يعملان.
- 13 رابط مقال داخل النص و5 روابط صفحات موقع و3 روابط عكسية سياقية، وسُجلت 8 روابط لمقالات لم تُنشأ بعد.
### الملفات المتأثرة
- `src/pages/knowledge/sdaia-ai-ethics-self-assessment.astro` (جديد)، `src/pages/docs.astro`، `src/pages/knowledge/{ai-governance-saudi,ai-risk-assessment,sdaia-ai-adoption-framework}.astro`، `.agents/pending-links.md`.
### التحقق
- `npm run build`: PASS؛ 3299 كلمة؛ H1 واحد؛ 5 كتل JSON-LD تُحلَّل وFAQ الخمسة مطابق حرفياً للنص الظاهر؛ sitemap/canonical/robots/og:locale: PASS.
- المتصفح (1280/360): لا تمرير أفقي؛ الفاحص والحلقة والمقاييس وإعادة الضبط تعمل؛ `prefers-reduced-motion` يكشف المحتوى ويعطّل الانتقالات؛ لا أخطاء console.
- قصّ أعلى الحروف العربية في لقطات Chromium يظهر أيضاً في صفحة عربية فارغة، ويُعد قيد بيئة العرض لا خلل CSS في المقال.
### النتيجة
- **الحالة:** DONE محلياً؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- 4 `TODO-VERIFY` (إلزامية الأداة، التسجيل وأهلية الأفراد، حفظ النتائج ومشاركتها، تاريخ الإطلاق) تحتاج مراجعة بشرية/قانونية.
- 8 روابط لمقالات لاحقة مسجلة في `pending-links.md`.

## [2026-11-03] — توحيد شعار الموقع وبطاقات مشاركة الروابط
### تم التنفيذ
- أصبح `brightai-logo.png` المصدر القانوني للشعار وبيانات المشاركة والسكيما؛ بقي WebP المشتق لعرض الهيدر والفوتر لتقليل حجم الصورة.
- أضيفت بيانات Open Graph للصورة بصيغة PNG ومقاسها الصحيح، وتحولت بطاقة Twitter/X إلى صورة كبيرة؛ شمل التوحيد بيانات الناشر في صفحات المقالات.
### الملفات المتأثرة
- `src/data/brand.ts`, `src/components/BrandLogo.astro`, `src/layouts/BaseLayout.astro`, `src/data/structured-data.ts`, 4 صفحات معرفة.
### التحقق
- فحص مراجع الشعار و`git diff --check`: PASS؛ build/اختبارات: NOT RUN.
### النتيجة
- **الحالة:** DONE محليًا؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- معاينات المشاركة الخارجية تتطلب نشر هذه الملفات وقد تعرض نسخة مخزنة مؤقتًا حتى يعيد التطبيق فحص الرابط.

