
المرحلة H: حزمة البرومبتات التنفيذية الختامية لإغلاق كافة الفجوات المثبتة (16 برومبتًا تنفيذيًا مستقلًا ومترابطًا):

صُممت هذه الحزمة من واقع الفجوات المثبتة بالدليل عند الرأس 738520067de19ae3bb5380beb292cd4d44861b69 دون توليد أي برومبت لميزة مكتملة مسبقًا، ودون دمج مهام التصميم مع مهام الأمان الحرجة P0، ومع التزام مطلق بحماية منطقة Hero الرئيسية وConstellation.astro. تُنفذ البرومبتات محليًا عبر وكيل التطوير بموافقة المالك المستقلة لكل بوابة خارجية:

PROMPT-01: إغلاق خلل مختبر Ledger العام وتوحيد مختبر Firewall وتوكنز الهوية:

PROMPT-ID | Title | Severity: PROMPT-01 | إصلاح ربط LedgerDemo.astro في صفحة المنتج وتوحيد /demo/firewall/ وإزالة الألوان الصلبة | P1
Proven Gap / REQ IDs: REQ-30, REQ-29, REQ-40
Cause: ملف src/components/ProductExperience.astro يستورد المكونات التفاعلية لـ 4 منتجات ويترك ledger يسقط في قالب بدائي جامد بلا حساب SHA-256، بينما تستخدم /demo/firewall/ نموذجًا قديمًا بدل FirewallWorkspace.astro، وتحتوي LedgerDemo.astro وSecureChatDemo.astro و/demo/[product].astro على ألوان hex صلبة (#151f32, #202b43, #101523) خارج variables.css.
Affected Files: src/components/ProductExperience.astro, src/components/LedgerDemo.astro, src/components/SecureChatDemo.astro, src/pages/demo/[product].astro (يُحظر لمس index.astro أو Constellation.astro أو theme.css).
Preconditions & MCPs: نسخة محلية نظيفة عند HEAD؛ أدوات القراءة المحلية وPlaywright المحلي للتحقق البصري.
Exact Execution Tasks:
في ProductExperience.astro، استورد LedgerDemo.astro وعرضه عند kind === 'ledger' واحذف كود الأزرار الجامدة الميتة للـ ledger وhuman-gate وsecure-chat داخل ذلك الملف.
في src/pages/demo/[product].astro، استورد FirewallWorkspace.astro وعرضه عند product === 'firewall' بدل #generic-demo مع الحفاظ على ترويسة CSP connect-src 'none'.
استبدل كافة قيم الألوان الصلبة في LedgerDemo.astro وSecureChatDemo.astro وdemo/[product].astro بمتغيرات variables.css القياسية (--surface-raised, --surface-sunken, --border-strong, --color-text, --color-focus, --color-action-hover-strong) مع ربط زر data-lab-reset في LabShell بدالة إعادة الضبط في LedgerDemo.
Local Permission Boundary & Secrets: تعديل محلي فقط؛ لا أسرار مطلوبة؛ لا git push.
UI & Backend Evidence: عرض Timeline وسلسلة SHA-256 الحقيقية وأزرار الإضافة والتلاعب والتصدير JSON داخل /products/ledger/#lab على مقاسات 360/390/768/1024/1440؛ لا أثر خادمي.
Acceptance Tests & Security/Perf: npm run build ناجح؛ node --test tests/firewall-demo.test.mjs ناجح؛ التحقق من تباين الأزرار ≥4.5:1 وعدم إرسال أي طلب شبكي أثناء التفاعل (0 network requests)؛ بقاء لقطة Hero الرئيسية مطابقة 100%.
Rollback & DoD & Approval: التراجع عبر git checkout -- <affected_files>؛ يكتمل عند عمل مختبرات المنتجات الـ 6 باتساق بصري ووظيفي تام؛ موافقة المالك مطلوبة قبل أي commit.
PROMPT-02: ترقية تجربة شاشات المختبرات الست إلى مستوى مساحة عمل عالمية (Inspector & Visual Flows):

PROMPT-ID | Title | Severity: PROMPT-02 | تحسين كثافة المعلومات والتمثيلات السببية (Policy Graph / Risk Matrix / Chain Diff) في المختبرات العامة | P2
Proven Gap / REQ IDs: REQ-28, REQ-33, REQ-42, REQ-49
Cause: تفاوت كثافة عرض الأدلة بين المختبرات وتكرار النصوص التمهيدية قبل الوصول للمهمة الأولى على شاشات الجوال 360px/390px، مع تضارب نصوص /pricing/ و/contact/ التي تنفي وجود تفعيل ذاتي مع أزرار تجربة تشغيلية 48 ساعة.
Affected Files: src/components/LabShell.astro, src/styles/experience-hub.css, src/pages/kernel.astro, src/pages/pricing.astro, src/pages/contact.astro, src/pages/app/trial/index.astro.
Preconditions & MCPs: اكتمال PROMPT-01؛ محرك متصفح محلي لفحص مقاسات الشاشات والوصولية.
Exact Execution Tasks:
وحّد تخطيط مكان العمل في LabShell.astro وexperience-hub.css بحيث تظهر المهمة التفاعلية الأولى فوق خط الطي على الجوال (360x800 و390x844) مع جعل الـ Inspector السببي مدمجًا بوضوح وإبراز الحالات الأربع (Empty / Loading / Verified / Blocked) بأيقونات ونصوص صريحة وليس باللون وحده.
استبدل الألوان الصلبة في src/pages/app/trial/index.astro (#494151, #21192e, #f5b544) بتوكنز variables.css.
وفّق الصياغة القانونية في pricing.astro وcontact.astro لتميز بوضوح بين: (أ) المختبر التفاعلي العام الفوري بلا حساب، (ب) استكشاف الـ 48 ساعة المحدود للقراءة بالبريد الموثق عند فتح البوابة، و(ج) التجربة التشغيلية المؤسسية الكاملة المحكومة بموافقة مشغّل.
Local Permission Boundary & Secrets: تعديل محلي فقط؛ لا مساس بملفات الصفحة الرئيسية / أو Constellation.astro؛ لا أسرار.
UI & Backend Evidence: لقطات شاشة على 5 مقاسات (360, 390, 768, 1024, 1440) تثبت انعدام التجاوز الأفقي (scrollWidth === clientWidth) وتطابق الرسائل التعاقدية.
Acceptance Tests & Security/Perf: فحص لوحة المفاتيح (Tab / Shift+Tab / Escape) وتباين WCAG 2.2 AA، وتشغيل scripts/verify-product-journey.mjs وscripts/verify-interior-ui.mjs.
Rollback & DoD & Approval: git checkout للملفات المعدلة؛ يكتمل بنجاح الاختبارات البصرية وتطابق النصوص؛ موافقة المالك للدمج.
PROMPT-03: حل تعارض الترحيل 0034 وإصلاح مصفوفة RLS (0035) ودالة Bootstrap (0036):

PROMPT-ID | Title | Severity: PROMPT-03 | تسوية سلسلة الترحيلات وإغلاق ثغرة client_deny على 0033/0034 وبناء دوال Bootstrap لـ aigas_runtime | P0
Proven Gap / REQ IDs: REQ-06, REQ-09, REQ-13
Cause: تطبيق 0034_aigas_self_service_trial.sql على Staging دون إضافته لـ DELTA_ORDER في scripts/migration-order.mjs، وفشل مصفوفة RLS المحلية (72/74) لغياب aigas_client_deny وسحب المنح على aigas_exploration_grants وaigas_self_service_trials، وعجز دور aigas_runtime عن إنشاء مؤسسة جديدة (INSERT INTO aigas_tenants) أو قراءة الدعوات قبل العضوية.
Affected Files: scripts/migration-order.mjs, migrations/0035_aigas_tenant_isolation_closure_v2.sql (جديد), migrations/0036_aigas_runtime_workspace_bootstrap.sql (جديد), src/server/kernel/service.mjs, scripts/verify-runtime-rls.mjs, tests/migration-order.test.mjs.
Preconditions & MCPs: عنقود PostgreSQL 18 محلي معزول ومؤقت (Disposable Local PG)؛ ممنوع الاتصال بـ Neon Staging أو Production في هذا البرومبت.
Exact Execution Tasks:
لا تعدّل 0033 أو 0034 مطلقًا حفاظًا على تطابق بصمات SHA-256 في سجل Staging؛ أضف '0034', '0035', '0036' بالترتيب إلى DELTA_ORDER في scripts/migration-order.mjs.
أنشئ migrations/0035_aigas_tenant_isolation_closure_v2.sql داخل غلاف BEGIN; ... COMMIT; واحد لإضافة سياسات AS RESTRICTIVE تمنع authenticated وanonymous على aigas_exploration_grants وaigas_self_service_trials، وسحب كافة الصلاحيات عنهما، وتحديث aigas_is_tenant_member لفحص u.banned IS NOT TRUE، مع شرط تحقق ختامي (Postcondition) يفشل إذا بقي أي جدول public.aigas_* بلا سياسة حجب عميل.
أنشئ migrations/0036_aigas_runtime_workspace_bootstrap.sql لتعريف دالة SECURITY DEFINER محروسة aigas_bootstrap_workspace(p_name text) بـ search_path = pg_catalog, public تتحقق من aigas_actor() وعدم الحظر وتنشئ المستأجر وعضوية OWNER وحدث التدقيق ذريًا، ودالة محروسة لقبول الدعوة الموثقة، ومنح EXECUTE لـ aigas_runtime فقط، ثم حدّث src/server/kernel/service.mjs لاستدعائها وحدّث scripts/verify-runtime-rls.mjs ليشمل الجدولين في قائمة القراءة فقط.
Local Permission Boundary & Secrets: قاعدة بيانات PostgreSQL محلية مؤقتة فقط؛ لا أسرار خارجية.
UI & Backend Evidence: مخرجات node --test tests/migration-order.test.mjs وnode scripts/verify-runtime-rls.mjs بنتيجة 76/76 PASS (صفر فشل) ونجاح db-migration-rehearsal.mjs في وضعي fresh وdelta.
Acceptance Tests & Security/Perf: إثبات إنشاء مؤسسة وقبول دعوة عبر اتصال aigas_runtime (NOBYPASSRLS) وفشل أي كتابة مباشرة من خارج الدالة بـ 42501.
Rollback & DoD & Approval: حذف ملفي 0035/0036 محليًا واستعادة الملفات المعدلة؛ يكتمل بنجاح 100% من مصفوفة RLS المحلية؛ لا تطبيق خارجي بدون موافقة المالك في PROMPT-05.
PROMPT-04: تهيئة وتشغيل أصل Astro Node SSR المعزول وفك أخطاء HTTP 404:

PROMPT-ID | Title | Severity: PROMPT-04 | التحقق من البناء الخادمي وإعداد خدمة Render Node SSR وحل مسار اتصال Neon غير المجمع للـ Runtime | P0
Proven Gap / REQ IDs: REQ-01, REQ-02, REQ-03, REQ-04, REQ-46
Cause: خدمة Render الحالية srv-d7m5bcjbc2fs73826v20 من نوع static_site تخدم dist/client فقط فتسقط جميع مسارات SSR والـ API والتحويلات في 404، كما أن مجمع اتصالات Neon يرفض تمرير options=-c role=aigas_runtime عند بدء الاتصال.
Affected Files: src/server/kernel/db.mjs, render.yaml, scripts/verify-node-runtime.mjs, docs/NODE-ORIGIN-OPERATOR-2026-11-16.md.
Preconditions & MCPs: اكتمال PROMPT-03؛ موافقة المالك الصريحة قبل أي إجراء على لوحة Render أو Cloudflare.
Exact Execution Tasks:
في src/server/kernel/db.mjs، أضف دعمًا اختياريًا نظيفًا لمتغير AIGAS_DB_RUNTIME_ROLE (بحيث إذا اتصل الخادم عبر حساب قناة محدود مثل aigas_app_login عبر Pooler، ينفذ SET LOCAL ROLE aigas_runtime تلقائيًا داخل transaction() وprobeDatabase() ويتحقق من current_user = 'aigas_runtime' وrolbypassrls = false دون الاعتماد على معاملات بدء Pooler المرفوضة).
حدّث render.yaml ليضم متغير AIGAS_REQUIRE_RLS: "true" ومتغيرات أسماء مفاتيح Groq والـ CSP بوضوح (sync: false للأسرار).
أعد تشغيل npm run build وnode scripts/verify-node-runtime.mjs محليًا للتثبت من عمل /healthz/ و/auth/sign-up/ وجميع مسارات /app/* و/knowledge/?q=audit (301 -> /docs/?q=audit).
(بإذن المشغّل فقط) أنشئ خدمة Render Web Service (runtime: node) معزولة على رابط .onrender.com أولًا مع ربطها بـ Neon Staging، وافحص استجابة /healthz/ = 200 OK مع consistent: true قبل أي تحويل لـ Cloudflare/DNS، ثم اضبط قواعد Bypass Cache على Cloudflare لبادئات /app*, /auth*, /api*, و/healthz*.
Local Permission Boundary & Secrets: الكود محليًا؛ النشر على Render وتعديل Cloudflare يتطلب تنفيذ/موافقة المالك المباشرة؛ الأسرار بالاسم فقط (DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL).
UI & Backend Evidence: استجابة GET https://.../healthz/ بحالة 200 وstatus: "ready"، واستجابة /app/api/kernel/members/ بلا جلسة بـ 401 JSON بدل 404 HTML، وترويسة Cache-Control: private, no-store, max-age=0.
Acceptance Tests & Security/Perf: verify-node-runtime.mjs وverify-routes.mjs ناجحان بالكامل؛ صفر تخزين مؤقت على الحافة للمسارات الخاصة.
Rollback & DoD & Approval: إبقاء خدمة Static القديمة جاهزة لإعادة التوجيه الفوري في Cloudflare عند أي طارئ؛ موافقة المالك إلزامية قبل ربط الدومين brightai.live.
PROMPT-05: تأمين Neon Staging ثم Production وتطبيق Delta وتعطيل Data API:

PROMPT-ID | Title | Severity: PROMPT-05 | تطبيق 0035/0036 على Staging وإثبات الاستعادة ثم ترقية Production إلى aigas_runtime وإغلاق Data API | P0
Proven Gap / REQ IDs: REQ-06, REQ-07, REQ-08, REQ-10
Cause: فرع Production يعمل بـ 31 جدولًا وسياستين مع Data API نشط ودور مالك BYPASSRLS وفرع غير محمي (protected=false).
Affected Files: scripts/apply-migrations.mjs, scripts/audit-runtime-posture.mjs, scripts/verify-restore-rehearsal.mjs.
Preconditions & MCPs: اكتمال PROMPT-03 وPROMPT-04؛ موافقة المالك المكتوبة على نافذة الصيانة وتوفر وصول إداري لـ Neon.
Exact Execution Tasks:
نفّذ أولًا على Staging المعزول: طبّق 0035 و0036 عبر apply-migrations.mjs وتحقق من وصول سجل ops.aigas_migration_ledger إلى 32 صفًا APPLIED بلا انحراف، ونفذ اختبار العزل السلوكي (قراءة وكتابة مرفوضة بين Tenant A وTenant B عبر دور aigas_runtime).
نفّذ بروفة الاستعادة (verify-restore-rehearsal.mjs) على فرع مؤقت مشتق من Production للتثبت من سلامة PITR، ثم فعّل Branch Protection على فرع production وارفع نافذة الاحتفاظ بالتاريخ.
من لوحة Neon Control Plane، عطّل Neon Data API تمامًا عن المخطط public.
شغّل فحص Preflight القرائي على Production، ثم طبّق سلسلة DELTA_ORDER الكاملة حتى 0036 باستخدام scripts/apply-migrations.mjs --mode delta، وأنشئ دور اتصال محدود (LOGIN NOINHERIT NOBYPASSRLS) يمنح التبديل إلى aigas_runtime فقط، وحدّث .env وبيئة الخادم لاستخدامه مع AIGAS_REQUIRE_RLS=true (وإزالة أي DSN يحمل neondb_owner من التشغيل).
Local Permission Boundary & Secrets: يُمنع التنفيذ التلقائي بدون تفويض المالك الصريح؛ الأسماء فقط (DATABASE_URL, DATABASE_URL_UNPOOLED, AIGAS_REQUIRE_RLS).
UI & Backend Evidence: تقرير scripts/audit-runtime-posture.mjs يثبت: 43 جدولًا بـ RLS مفعلة، FORCE RLS على جدولي المحادثة، صفر صلاحيات لـ authenticated/anonymous، Data API = disabled، وconnectionPrivilege().rlsEnforced === true.
Acceptance Tests & Security/Perf: نجاح اختبار العزل المتقاطع A/B كتابةً وقراءةً، وفشل أي اتصال مالك عند تفعيل AIGAS_REQUIRE_RLS=true بـ 503 RLS_NOT_ENFORCED.
Rollback & DoD & Approval: التراجع عبر استعادة الفرع المحمي المأخوذ قبل الترحيل خلال دقائق؛ موافقة المالك إلزامية قبل لمس Production.
PROMPT-06: تدوير مفتاح Groq وبناء البوابة الخادمية الآمنة (Groq Gateway) لنموذج qwen/qwen3.8-27b:

PROMPT-ID | Title | Severity: PROMPT-06 | بناء بوابة Groq الموحدة وجسر العقود الأمنية وضبط وضع Instruct وقواطع الدائرة والميزانية | P0
Proven Gap / REQ IDs: REQ-34, REQ-35, REQ-36
Cause: المفتاح السابق مكشوف؛ adapter.mjs يشترط اسم AIGAS_SC_<PROVIDER>_API_KEY ويرفض ردود qwen/qwen3.8-27b إذا استهلك وضع التفكير الافتراضي الحد الأقصى للرموز، ولا يحتوي على معالجة 429 أو سقف تزامن أو قاطع ميزانية يومي/شهري.
Affected Files: src/server/kernel/env.mjs, src/server/ai/groq-gateway.mjs (جديد), src/server/secure-chat/adapter.mjs, .env.example, tests/groq-gateway.test.mjs (جديد).
Preconditions & MCPs: قيام المالك يدويًا بإبطال المفتاح القديم في لوحة Groq وتوليد مفتاح جديد ووضعه في .env المحلي فقط تحت GROQ_API_KEY مع GROQ_MODEL=qwen/qwen3.8-27b.
Exact Execution Tasks:
في src/server/kernel/env.mjs، أضف دالة خادمية فقط resolveProviderSecret(apiKeyEnv) تقبل فقط أسماء العقود المطابقة لـ /^AIGAS_SC_[A-Z0-9_]+_API_KEY$/، وعند طلب AIGAS_SC_GROQ_API_KEY تقرأ process.env.AIGAS_SC_GROQ_API_KEY || process.env.GROQ_API_KEY بعد التحقق من خلوها من محارف السطر الجديد ومنع وجود أي متغير يبدأ بـ PUBLIC_GROQ.
أنشئ src/server/ai/groq-gateway.mjs كطبقة خادمية موحدة تدير الاتصال بـ https://api.groq.com/openai/v1/chat/completions وGET https://api.groq.com/openai/v1/models وتنفذ الضوابط الإلزامية التالية:
التحقق من أن GROQ_MODEL (افتراضيًا qwen/qwen3.8-27b) يطابق حرفيًا النموذج المعتمد في السجل المصدري.
ضبط معاملات qwen/qwen3.8-27b لوضع المحادثة المحكوم: reasoning_effort: "none", temperature: 0.7, top_p: 0.80, stream: false, n: 1 (مع دعم وضع استشاري محدود بـ reasoning_format: "hidden" عند الطلب الخادمي الداخلي فقط).
مهلة اتصال صارمة (AbortSignal.timeout)، سقف تزامن أقصى (AIGAS_GROQ_MAX_CONCURRENCY افتراضيًا 5 طلبات متزامنة)، معالجة رمز 429 Too Many Requests قراءةً من ترويسة retry-after دون إعادة إرسال عشوائية، وقاطع دائرة (Circuit Breaker) يفتح لمدة 60 ثانية بعد 5 إخفاقات متتالية من فئة 5xx/الشبكة.
محاسبة تكلفة لحظية بالمعادلة الدقيقة (0.80/1M in+4.00/1M out) ضد سقف يومي وشهري خادمي (AIGAS_GROQ_DAILY_BUDGET_USD, AIGAS_GROQ_MONTHLY_BUDGET_USD) يوقف الإرسال فور بلوغه بـ 503 BUDGET_CAP_REACHED، مع تنقيح تام لأي ترويسة Authorization أو مفتاح من سجلات الأخطاء.
اربط src/server/secure-chat/adapter.mjs ببوابة groq-gateway.mjs، وحدّث .env.example بأسماء المتغيرات الجديدة فقط دون أي قيم سرية.
Local Permission Boundary & Secrets: يُحظر طباعة قيمة GROQ_API_KEY في الطرفية أو السجلات أو الاختبارات؛ فحص اتصال GET /openai/v1/models ببيانات اصطناعية بعد إذن المالك فقط.
UI & Backend Evidence: نجاح node --test tests/groq-gateway.test.mjs في محاكاة حالات 200، 429، انتهاء المهلة، انفتاح قاطع الدائرة، وتجاوز الميزانية، وتأكيد عدم تسرب أي بايت من المفتاح في حزم dist/client/**.
Acceptance Tests & Security/Perf: بحث نصي آلي يثبت 0 matches لـ GROQ_API_KEY داخل dist/client/؛ وفحص أهلية qwen/qwen3.8-27b عبر دالة الفحص الصحي الخادمية بدون إظهار المفتاح.
Rollback & DoD & Approval: حذف groq-gateway.mjs واستعادة adapter.mjs؛ موافقة المالك لتدوير المفتاح وتشغيل فحص الاتصال الأول.
PROMPT-07: تسجيل النموذج المعتمد وتفعيل AIGAS Secure Chat الخادمي مع الحصص وفحص المخرجات:

PROMPT-ID | Title | Severity: PROMPT-07 | اعتماد سجل qwen/qwen3.8-27b المشروط وربط حصص الرموز وفحص مخرجات المساعد في Secure Chat | P0
Proven Gap / REQ IDs: REQ-27, REQ-35, REQ-25
Cause: مصفوفة APPROVED_MODELS في src/server/secure-chat/models.mjs فارغة، وإعدادات الحصص AIGAS_SC_* غير موثقة، ويلزم ضمان فحص مخرجات النموذج بنفس صرامة فحص المدخلات.
Affected Files: src/server/secure-chat/models.mjs, src/server/secure-chat/service.mjs, src/scripts/secure-chat.ts, tests/secure-chat.test.mjs, tests/secure-chat-policy.test.mjs.
Preconditions & MCPs: اكتمال PROMPT-06 واعتماد المالك خطيًا لشروط المنطقة وعدم التدريب (noTraining: true) ومراجع الاحتفاظ لمزود Groq.
Exact Execution Tasks:
حدّث src/server/secure-chat/models.mjs ليبقى مغلقًا افتراضيًا ما لم تتطابق قائمة المستأجرين المصرح لهم ومرجع موافقة المالك الساري غير المنتهي الصلاحية للنموذج qwen/qwen3.8-27b (endpoint: 'https://api.groq.com/openai/v1/chat/completions', apiKeyEnv: 'AIGAS_SC_GROQ_API_KEY', maxOutputTokens: 1024, maxRequestTokens: 4096, maxInputBytes: 8000, inputOverheadTokens: 512, timeoutMs: 20000).
في src/server/secure-chat/service.mjs، تأكد من تطبيق protectText وقواعد Firewall للمؤسسة على رد النموذج الوارد (reply) قبل إرجاعه للمتصفح، وتحديث حالة liveSend إلى VERIFIED فقط بعد نجاح استدعاء فعلي موثق، مع فرض حصص aigas_sc_usage_window_v2 (مثل 10 طلبات/دقيقة، 100 طلب/يوم، 50,000 رمز/يوم للمستخدم).
في src/scripts/secure-chat.ts، اعرض بوضوح عدد الرموز المستهلكة الفعلية (inputTokens / outputTokens) وحالة التنقيح أو الحجب عند حدوثهما.
Local Permission Boundary & Secrets: أسماء متغيرات الحصص والموافقة فقط (AIGAS_SC_LIMITS_APPROVAL_REF, AIGAS_SC_USER_TOKENS_PER_DAY, إلخ)؛ نصوص الاختبار اصطناعية 100%.
UI & Backend Evidence: استجابة GET /app/api/secure-chat/models/ تعرض النموذج بحالة ELIGIBLE للمؤسسة المخولة فقط، واستجابة POST /app/api/secure-chat/messages/ تعيد ردًا عربيًا فعليًا من qwen/qwen3.8-27b مع خصم الرموز في جدول الطلبات وعدم حفظ أي نص محادثة في aigas_audit_events.
Acceptance Tests & Security/Perf: node scripts/verify-chat-policy-local.mjs ناجح؛ اختبار حجب Prompt يحتوي مفتاحًا وهميًا (422 SENSITIVE_CONTENT_BLOCKED) وتنقيح رقم هوية سعودي مكتوب بأرقام عربية قبل وصوله لـ Groq.
Rollback & DoD & Approval: إعادة APPROVED_MODELS فارغة أو ضبط مفتاح إيقاف الحصص يوقف الإرسال فورًا؛ يتطلب موافقة المالك على وثيقة شروط Groq.
PROMPT-08: مسار المختبر العام الاختياري المدعوم بـ Groq (Opt-In Isolated Public Sandbox) مع Fallback شفاف:

PROMPT-ID | Title | Severity: PROMPT-08 | إضافة وضع اختياري محكوم بـ Groq للمختبر العام مع عزل تام عن قاعدة المؤسسات والعودة التلقائية للمحاكي | P1
Proven Gap / REQ IDs: REQ-37, REQ-33
Cause: المختبر العام الحالي حتمي محلي فقط؛ والمطلوب تمكين الزائر الراغب من تجربة رد حي آمن عبر qwen/qwen3.8-27b في مختبر معزول تمامًا إذا وافق على شروط البيانات والمنطقة وكان العلم الخادمي مفعلًا، مع بقاء المختبر الحتمي يعمل دائمًا بلا مفتاح.
Affected Files: src/pages/api/public-demo/groq-sandbox.ts (جديد), src/server/ai/public-sandbox-limiter.mjs (جديد), src/components/SecureChatDemo.astro, tests/public-sandbox.test.mjs (جديد).
Preconditions & MCPs: اكتمال PROMPT-06؛ لا اتصال مطلقًا بقاعدة بيانات Neon للمؤسسات في هذا المسار!
Exact Execution Tasks:
أنشئ src/server/ai/public-sandbox-limiter.mjs بدون أي اتصال بقاعدة بيانات المؤسسات؛ يطبق محدد معدل في الذاكرة مقيدًا بعنوان IP وترويسة Origin === 'https://brightai.live' (أو localhost محليًا)، بسقف 3 طلبات فقط كل 10 دقائق لكل زائر، وسقف طول نص 400 حرف، وسقف إخراج max_tokens: 250، وميزانية يومية عامة مستقلة (AIGAS_PUBLIC_DEMO_GROQ_ENABLED=false افتراضيًا + AIGAS_PUBLIC_DEMO_DAILY_USD_CAP).
أنشئ POST /api/public-demo/groq-sandbox/ بحيث يرفض الطلب ما لم يرسل الزائر إقرار الموافقة الصريح (consent: { syntheticOnly: true, regionAndTermsAccepted: true })، ويمرر النص عبر protectText وقواعد firewall-demo.mjs الحتمية أولًا (فيحجب BLOCK وينقح REDACT محليًا/خادميًا دون استدعاء النموذج عند الحجب)، ويستخدم موجه نظام صارم مضاد لـ Prompt Injection.
في SecureChatDemo.astro، أبقِ الوضع الافتراضي هو «مختبر تفاعلي ببيانات افتراضية (حتمي بدون نموذج)» يعمل فورًا للجميع؛ وأضف مفتاح تبديل اختياري (Opt-in) لتجربة النموذج الحي يفتح نافذة موافقة واضحة، ولا يعلن «النموذج متصل» إلا إذا نجح فحص جاهزية المسار فعليًا، وإذا كان المسار معطلًا أو استُنفدت الحصة أو انقطع المزود يعود بشفافية تامة إلى المحاكي الحتمي مع توضيح السبب.
Local Permission Boundary & Secrets: مفتاح AIGAS_PUBLIC_DEMO_GROQ_ENABLED يبقى "false" حتى يفعله المالك صراحةً؛ صفر وصول لجداول PostgreSQL.
UI & Backend Evidence: عمل المختبر الحتمي بنسبة 100% عند تعطيل العلم؛ وعند تفعيله محليًا نجاح 3 طلبات اصطناعية ثم إرجاع 429 في الطلب الرابع مع استمرار عمل الوضع الحتمي دون انقطاع.
Acceptance Tests & Security/Perf: node --test tests/public-sandbox.test.mjs يثبت رفض الطلبات العابرة للنطاقات (CSRF/Origin check)، ورفض أي نص يشبه سرًا أو بيانات شخصية، وعدم تسرب المفتاح.
Rollback & DoD & Approval: تعطيل AIGAS_PUBLIC_DEMO_GROQ_ENABLED=false يغلق المسار فورًا دون إعادة بناء؛ موافقة المالك قبل تفعيله للعامة.
PROMPT-09: ترقية AIGAS Firewall — فحص المخرجات والربط الفعلي مع Human Gate والمستشار الدلالي بـ Groq:

PROMPT-ID | Title | Severity: PROMPT-09 | إضافة فحص المخرجات وعقد تصعيد ESCALATE إلى Human Gate ومساعد التفسير الاستشاري الاختياري | P1
Proven Gap / REQ IDs: REQ-18, REQ-22, REQ-38
Cause: يقتصر Firewall حاليًا على فحص المدخلات فقط، ومصفوفة approvedReviewIntegrations في escalation.mjs فارغة لعدم وجود نوع عملية في Human Gate لمراجعة قرار التصعيد، ولا يوجد مساعد استشاري لتفسير النصوص الغامضة.
Affected Files: migrations/0037_aigas_hg_firewall_escalation_op.sql (جديد), src/server/human-gate/core.mjs, src/server/firewall/escalation.mjs, src/server/firewall/guard.mjs, src/server/firewall/provider.mjs, src/pages/app/firewall/index.astro, tests/firewall-review-binding.test.mjs.
Preconditions & MCPs: اكتمال PROMPT-03 وPROMPT-06.
Exact Execution Tasks:
أضف نوع عملية محكومًا جديدًا في human-gate/core.mjs وترحيل 0037 باسم FIREWALL_ESCALATION_REVIEW يخزن البيانات الوصفية الآمنة فقط (decision_id, rule_id, rule_version, request_fingerprint) دون تخزين النص الخام الحساس، واربطه داخل escalation.mjs عبر مهايئ خادمي ذري ينشئ طلب PENDING داخل نفس معاملة Firewall عندما تكون سياسة المؤسسة مفعلة، مع بقاء الإرسال للمزود موقوفًا حتى صدور قرار مراجع مستقل (SoD) وإعادة فحص البصمة.
في src/server/firewall/guard.mjs، أضف بوابة فحص مخرجات إلزامية (evaluateOutput) تعيد تمرير استجابة المزود عبر قواعد المؤسسة وprotectText قبل إرجاعها، فتحجب أو تنقح أي تسرب في المخرج.
أضف وظيفة استشارية منفصلة غير ملزمة عبر groq-gateway.mjs (تعمل فقط عند تفعيلها للمؤسسة) تشرح للمختص الأمني مخاطر Prompt Injection المحتملة في النص الاصطناعي، مع فرض حارس صارم يمنع النتيجة الاستشارية من تغيير أو تخفيف قرار القواعد الحتمية (DENY/ESCALATE/REDACT/WARN/ALLOW).
Local Permission Boundary & Secrets: اختبار محلي على PG18 مؤقت؛ لا تخزين لنصوص الطلبات في قاعدة البيانات.
UI & Backend Evidence: تحول قرار ESCALATE في المؤسسة المفعلة إلى 202 REVIEW_PENDING وظهور الطلب فعليًا في طابور /app/human-gate/ للمراجع المستقل مع منع مقدم الطلب من اعتماده.
Acceptance Tests & Security/Perf: نجاح tests/firewall-review-binding.test.mjs وtests/human-gate-db.test.mjs؛ إثبات أن رفض المراجع أو تغير نسخة السياسة يبطل الإذن فورًا.
Rollback & DoD & Approval: تعطيل تكامل المراجعة يعيد السلوك الآمن 409 HUMAN_GATE_NOT_CONFIGURED؛ موافقة المالك قبل ترحيل 0037.
PROMPT-10: إضافة مساعد التحليل الأولي الاستشاري بـ Groq في AIGAS Risk Engine:

PROMPT-ID | Title | Severity: PROMPT-10 | ربط مساعد صياغة السيناريوهات والضوابط المقترحة عبر Groq دون المساس بحتمية مصفوفة 3×3 | P2
Proven Gap / REQ IDs: REQ-38, REQ-23, REQ-24
Cause: طلب المرحلة D ربط وظائف الذكاء الاصطناعي الملائمة في Risk Engine لتوليد سيناريوهات المخاطر ومساعدة التحليل الأولي مع بقاء الدرجة والاعتماد خاضعين للمنهج الحتمي والمراجعة البشرية.
Affected Files: src/pages/app/api/risk-engine/assist.ts (جديد), src/server/risk-engine/assist.mjs (جديد), src/components/RiskWorkspace.astro, tests/risk-assist.test.mjs (جديد).
Preconditions & MCPs: اكتمال PROMPT-06.
Exact Execution Tasks:
أنشئ src/server/risk-engine/assist.mjs وواجهة POST /app/api/risk-engine/assist/ مقيدة بدور OWNER أو ADMIN وإقرار البيانات الاصطناعية (synthetic: true)، تستقبل وصف الغرض وتصنيف البيانات (بعد تنقيح protectText) وتستدعي qwen/qwen3.8-27b عبر groq-gateway.mjs لإرجاع مخطط JSON مهيكل ومفحوص بصرامة (scenarios[], suggestedControls[], reviewQuestions[]) دون أي حقل درجة رقمية أو توصية قبول!
في RiskWorkspace.astro (الوضع التشغيلي فقط وليس المختبر العام الثابت)، أضف زرًا اختياريًا «اقتراح سيناريوهات وضوابط استشارية (AI)» يدرج المسودة في حقول الوصف ليعدلها المقيّم البشري بحرية، مع وسم واضح مسودة استشارية مولدة آليًا — الدرجة والاعتماد قراران بشريان حتميان.
حافظ بالكامل على دالة evaluate(likelihood, impact) وacceptanceDecision في risk-engine/core.mjs دون أي تعديل.
Local Permission Boundary & Secrets: عبر groq-gateway.mjs الخادمية فقط؛ ممنوع قبول أي درجة خطر من مخرج النموذج.
UI & Backend Evidence: التحقق من رفض أي JSON غير مطابق للمخطط من المزود، وبقاء حساب Score=L×I وشرط المالك المستقل للخطر المرتفع حتميين 100%.
Acceptance Tests & Security/Perf: node --test tests/risk-engine.test.mjs tests/risk-assist.test.mjs ناجحة بالكامل.
Rollback & DoD & Approval: إزالة مسار /assist/ تعيد الواجهة للوضع اليدوي البحت دون أي أثر على البيانات المحفوظة.
PROMPT-11: الإغلاق التشغيلي الحي لتجربة الـ 48 ساعة الذاتية والمؤسسية End-to-End:

PROMPT-ID | Title | Severity: PROMPT-11 | التحقق الشامل من رحلة التسجيل بـ OTP وتفعيل تجربة 48 ساعة وانتهاء الصلاحية وعزل المستأجرين على أصل Node | P0
Proven Gap / REQ IDs: REQ-11, REQ-15, REQ-03
Cause: رغم نجاح تجربة 48 ساعة على Staging عبر خادم محلي، لم يتم التحقق من مسار العودة بتسجيل الدخول بالرمز البريدي بدون كلمة مرور، ولم تُختبر الرحلة كاملة عبر أصل Node SSR المنشور مع الترويسات الأمنية.
Affected Files: src/pages/auth/sign-up.astro, src/scripts/trial-home.ts, src/server/kernel/self-service-trial.mjs, tests/trial-e2e.test.mjs (جديد).
Preconditions & MCPs: اكتمال PROMPT-04 وPROMPT-05؛ توفر بيئة Staging متصلة بأصل Node SSR معزول وموافقة المالك على حساب اختبار اصطناعي.
Exact Execution Tasks:
راجع وحصّن مسار العودة لتسجيل الدخول برمز البريد الإلكتروني (sign-in OTP) في sign-up.astro والتعامل السلس مع انتهاء صلاحية رمز الجلسة (15m maxTokenAge) في trial-home.ts دون إظهار رسائل خطأ غامضة.
نفّذ رحلة التحقق الكاملة عبر أصل Node HTTPS: زيارة صفحة منتج ← الضغط على «تجربة تشغيلية 48 ساعة» ← إنشاء حساب وتوثيق البريد بـ OTP ← بدء التجربة الذاتية (startTrial) ← التأكد من إنشاء Tenant معزول بعضوية MEMBER و5 منح استكشاف (100 وحدة، 172800 ثانية) ← تصفح المنتجات الخمسة بنجاح 200 ← التأكد من رفض محاولة قراءة مستأجر آخر بـ 403 FORBIDDEN ورفض استدعاء مزود AI في فئة الاستكشاف المجانية بـ 403 EXPLORATION_CAPABILITY_DENIED ما لم يرقَّ الحساب بمنحة مشغّل.
Local Permission Boundary & Secrets: يُحظر حفظ أي بريد حقيقي أو رمز OTP أو JWT في ملفات التدقيق أو المستودع.
UI & Backend Evidence: لقطات شاشة وسجل حالات HTTP موثق يثبت عمل العداد الخادمي وعدم تجدد النافذة أو الحصة عند إعادة تسجيل الدخول أو مسح localStorage.
Acceptance Tests & Security/Perf: نجاح scripts/verify-exploration-local.mjs وscripts/verify-trial-local.mjs بنتيجة 112/112 PASS (بعد إصلاح متغير EXPLORATION_TEST_DATABASE_URL في السكربت).
Rollback & DoD & Approval: إمكانية إغلاق البوابة فورًا بـ AIGAS_APP_ENABLED=false (تُرجع 503 نظيفة بدل 404)؛ موافقة المالك قبل فتحها للعامة.
PROMPT-12: تفعيل CSP الصارم وحوكمة المراقبة والخصوصية (Sentry & PostHog Retention Gate):

PROMPT-ID | Title | Severity: PROMPT-12 | ترقية سياسة أمن المحتوى من Report-Only إلى Enforce وإغلاق شروط المراقبة والخصوصية | P1
Proven Gap / REQ IDs: REQ-05, REQ-44
Cause: سياسة CSP الكاملة في src/middleware.ts تعمل بوضع Report-Only افتراضيًا (AIGAS_CSP_ENFORCE="false")، ومسار /api/observability غير مفعل حيًا، ومدد الحذف التلقائي في PostHog/Sentry غير موثقة بقرار خصوصية معتمد.
Affected Files: src/middleware.ts, src/server/observability/config.mjs, src/pages/privacy.astro, tests/observability.test.mjs.
Preconditions & MCPs: اكتمال PROMPT-04 وتشغيل أصل Node على Staging.
Exact Execution Tasks:
اختبر جميع الصفحات العامة وصفحة /auth/sign-up/ وشاشات /app/* في متصفح فعلي مع مراقبة انتهاكات Content-Security-Policy-Report-Only للتأكد من عدم حجب خط Plex Arabic أو اتصال NEON_AUTH_BASE_URL أو السكربتات المجمعة، ثم فعّل AIGAS_CSP_ENFORCE="true" في إعداد الخدمة المختبرة.
تحقق من أن /api/observability يعيد 204 صامتة عند تعطيل الأعلام، وعند التفعيل المستقبلي يطبق url-policy.mjs لتشذيب كافة مسارات /app/* و/auth/* ومنع إرسال أي متن محادثة أو بريد أو معرّف مستأجر.
حدّث src/pages/privacy.astro (بمراجعة المالك القانونية) لتعكس بدقة حالة البوابة والمختبرات العامة وسياسة عدم التدريب (No-Training).
Local Permission Boundary & Secrets: تبقى مفاتيح الإيقاف AIGAS_SENTRY_ENABLED وAIGAS_POSTHOG_ENABLED معطلة حتى يصدر المالك مرجع الموافقة AIGAS_MONITORING_APPROVAL_REF.
UI & Backend Evidence: صفر أخطاء CSP في Console المتصفح مع وجود ترويسة Content-Security-Policy الكاملة المفروضة وترويسة Strict-Transport-Security.
Acceptance Tests & Security/Perf: node --test tests/observability.test.mjs وnode scripts/preview-observability-payload.mjs ناجحان بالكامل.
Rollback & DoD & Approval: إعادة AIGAS_CSP_ENFORCE="false" أو تفعيل KILL_SWITCH بمتغير بيئة واحد؛ موافقة المالك والخصوصية.
PROMPT-13: تنظيف شجرة الاعتماديات وترقية أمن الحزم (Astro 7 & Node Adapter Upgrade):

PROMPT-ID | Title | Severity: PROMPT-13 | إزالة الحزم الميتة وترقية astro و@astrojs/node لإغلاق ثغرة GHSA-26w7-cxv4-gfx2 جذريًا | P2
Proven Gap / REQ IDs: REQ-48
Cause: وجود 3 حزم غير مستخدمة في package.json (react-useanimations, @neon/config, @neon/env)، وبقاء ثغرة حرجة مسجلة في npm audit على astro@6.4.8 تتطلب الترقية إلى astro >= 7.3.2 و@astrojs/node >= 11.1.3 وNode >= 22.23.4.
Affected Files: package.json, package-lock.json, render.yaml, .github/security-allowlist.yml, scripts/verify-dependency-posture.mjs.
Preconditions & MCPs: فرع محلي معزول للتجربة؛ التحقق من توفر Node >= 22.23.4 محليًا وعلى Render.
Exact Execution Tasks:
احذف الاعتماديات الثلاث غير المستوردة في أي ملف (react-useanimations, @neon/config, @neon/env)، وافصل أدوات الفحص إن لزم، مع إبقاء scripts/server.mjs بحراسات Host وBackslash كدفاع في العمق.
رقِّ astro إلى ^7.3.2 و@astrojs/node إلى ^11.1.3 وحدّث NODE_VERSION في render.yaml وengines.node في package.json، ثم أعد توليد package-lock.json نظيفًا.
شغّل npm audit وتأكد من وصول عدد الثغرات الحرجة والعالية إلى صفر (0 Critical / 0 High)، وحدّث .github/security-allowlist.yml وverify-dependency-posture.mjs، مع التحقق البصري الصارم من عدم تغير مخرجات الصفحة الرئيسية المحمية بأي بايت مؤثر.
Local Permission Boundary & Secrets: في فرع عمل محلي فقط؛ لا دفع إلى main دون مراجعة المالك.
UI & Backend Evidence: مخرج npm audit --json يسجل 0 vulnerabilities، وبناء الـ 57 صفحة عامة + 46 مسار خادمي بنجاح تام.
Acceptance Tests & Security/Perf: نجاح verify-dependency-posture.mjs, verify-node-runtime.mjs, وverify-routes.mjs.
Rollback & DoD & Approval: استعادة package.json وpackage-lock.json وrender.yaml من الرأس السابق؛ يتطلب موافقة المالك قبل الدمج.
PROMPT-14: قياس الأداء الحي (Core Web Vitals) والوصولية الشاملة وSEO السعودي:

PROMPT-ID | Title | Severity: PROMPT-14 | إغلاق بنود NOT_MEASURED عبر فحص Lighthouse/Playwright وقارئ الشاشة والتحقق من التحويلات والـ Sitemap | P2
Proven Gap / REQ IDs: REQ-42, REQ-45, REQ-46, REQ-47
Cause: بقاء مؤشرات LCP / CLS / INP واختبار قارئ الشاشة على الشاشات المصادقة غير مقاسة ميدانيًا، وفشل التحويل /knowledge/?q=audit حيًا قبل التحول لخادم Node.
Affected Files: scripts/verify-cwv-a11y.mjs (جديد), وأي تحسينات دقيقة في سمات aria-* خارج منطقة Hero المحمية فقط إن كشفها الفحص.
Preconditions & MCPs: اكتمال PROMPT-02 وPROMPT-04؛ توفر Playwright/Lighthouse محليًا.
Exact Execution Tasks:
أنشئ سكربت قياس آلي scripts/verify-cwv-a11y.mjs يقيس فعليًا زمن LCP (المستهدف <2.5s)، وCLS (المستهدف <0.10)، واستجابة التفاعل INP (المستهدف <200ms) على الموبايل (390x844 مع خنق الشبكة القياسي) والديسكتوب (1440x900) للصفحة الرئيسية وصفحات المنتجات الست ومركز المعرفة وشاشات /app/*.
نفّذ فحص شجرة الوصولية (Accessibility Tree) والتنقل بلوحة المفاتيح وإعلانات المناطق الحية (aria-live) وإغلاق النوافذ الحوارية بـ Escape (مثل نافذة تفاصيل الحدث <dialog> في /app/ledger/).
تحقق من عمل كافة تحويلات redirects.json (بما فيها الحفاظ على معامل البحث في /knowledge/?q=audit -> 301 /docs/?q=audit) وسلامة sitemap-index.xml وllms.txt.
Local Permission Boundary & Secrets: فحص قرائي وقياسي محلي وعلى Staging؛ يُحظر المساس بـ Hero الرئيسية.
UI & Backend Evidence: ملف JSON موثق بالأرقام المقاسة فعليًا لـ LCP/CLS/INP ونتيجة 0 violations في فحص الوصولية الآلي.
Acceptance Tests & Security/Perf: تحقيق معايير Core Web Vitals الخضراء وWCAG 2.2 AA على كافة المسارات.
Rollback & DoD & Approval: لا تغييرات خطرة؛ يكتمل بتحويل حالة REQ-47 وREQ-42 من NOT_MEASURED إلى PASS_VERIFIED.
PROMPT-15: بوابة التحقق الشامل وإعادة حساب لوحة النسب قبل الإطلاق (Pre-Release Verification Gate):

PROMPT-ID | Title | Severity: PROMPT-15 | تشغيل كافة حزم الاختبارات (Unit + PG18 RLS + Node SSR + Groq Sandbox) وإصدار شهادة الجاهزية | P0
Proven Gap / REQ IDs: REQ-50 (وإعادة التحقق من REQ-01 حتى REQ-49)
Cause: ضرورة إثبات خلو المشروع من أي تعارض انحداري (Regression) بعد دمج إصلاحات المختبرات وقاعدة البيانات وبوابة Groq وترقية الحزم قبل تحويل حركة مرور الدومين الحي.
Affected Files: قراءة وتشغيل الاختبارات وتحديث مصفوفة التدقيق المحلية فقط (Audit/release-gate/SCORECARD.json).
Preconditions & MCPs: اكتمال PROMPT-01 حتى PROMPT-14.
Exact Execution Tasks:
شغّل بالتتابع الصارم: npm ci, npm run build, كامل ملفات node --test tests/*.test.mjs, node scripts/verify-runtime-rls.mjs, node scripts/verify-contracts-local.mjs, node scripts/verify-node-runtime.mjs, node scripts/verify-routes.mjs, node scripts/verify-exploration-local.mjs, وnode scripts/verify-trial-local.mjs.
تحقق على خدمة Node Staging المعزولة من نجاح دورة كل منتج من المنتجات الخمسة + Kernel + تجربة 48 ساعة + استدعاء Groq المحكوم في Secure Chat مع تفعيل AIGAS_REQUIRE_RLS=true وAIGAS_CSP_ENFORCE=true.
أعد حساب المتطلبات الـ 50 في مصفوفة النسب بنفس الأوزان المعلنة دون أي تغيير في الأوزان، وتثبت من إغلاق جميع موانع P0 وP1.
Local Permission Boundary & Secrets: تشغيل اختبارات فقط؛ عدم طباعة أي سر أو رمز جلسة في المخرجات.
UI & Backend Evidence: سجل TAP/JSON يثبت نجاح 100% من الاختبارات دون أي SKIP غير مبرر أو FAIL.
Acceptance Tests & Security/Perf: Verified Completion % >= 95% مع 0 P0 Blockers وrlsEnforced: true وconsistent: true في /healthz/.
Rollback & DoD & Approval: في حال فشل أي اختبار P0 يبقى القرار NO-GO ويُمنع الانتقال إلى PROMPT-16؛ يعتمد المالك شهادة الجاهزية.
PROMPT-16: التحويل النهائي المحكوم للدومين الحي brightai.live ومراقبة ما بعد الإطلاق (Controlled Production Cutover):

PROMPT-ID | Title | Severity: PROMPT-16 | تحويل توجيه الدومين الحي من الاستضافة الثابتة إلى خدمة Node SSR المحصنة ومراقبة الاستقرار | P0
Proven Gap / REQ IDs: REQ-01, REQ-02, REQ-03, REQ-04, REQ-11, REQ-15, REQ-27
Cause: الخطوة الختامية لربط الدومين الرسمي https://brightai.live بالخدمة الخادمية الجاهزة بعد إغلاق جميع المخاطر الأمنية والمعمارية.
Affected Files: لا تعديل كود؛ إجراءات مشغّل موثقة في Audit/release-gate/LIVE-CUTOVER-RECEIPT.md.
Preconditions & MCPs: توقيع المالك الصريح على نجاح PROMPT-15، ووجود نسخة استعادة محمية لقاعدة الإنتاج، وبقاء خدمة Static السابقة في وضع الاستعداد للتراجع الفوري.
Exact Execution Tasks:
اضبط متغيرات البيئة المعتمدة في خدمة Render Node الإنتاجية (AIGAS_REQUIRE_RLS=true, AIGAS_CSP_ENFORCE=true, AIGAS_HEALTH_AUTH_PROBE=true, وفتح AIGAS_APP_ENABLED=true فقط إذا أقر المالك فتح البوابة التشغيلية وتجربة 48 ساعة للزوار المسجلين).
اربط الدومين brightai.live بخدمة Node Web Service عبر Cloudflare في وضع TLS Full (strict)، وامسح ذاكرة التخزين المؤقت للحافة (Purge Cache) لإزالة صفحات 404 القديمة المخزنة بـ s-maxage=300.
نفّذ فحص الدخان الفوري (Live Smoke Check) خلال أول 5 دقائق على https://brightai.live: تحقق من / (وسلامة Hero المحمية)، /products/* (الـ 5 مختبرات بما فيها Ledger المحدث)، /kernel/، /healthz/ (200 ready وتطابق SHA)، /auth/sign-up/ (200 no-store)، و/app/api/kernel/members/ (401 JSON no-store)، وراقب ميزانية Groq وقاطع الدائرة لمدة 48 ساعة متصلة.
Local Permission Boundary & Secrets: تنفيذ حصري بموافقة وإشراف المالك المباشر؛ صفر أسرار في تقارير الإيصال.
UI & Backend Evidence: استجابة حية 200 OK من https://brightai.live/healthz/ بتطابق SHA كامل واختفاء جميع أخطاء 404 غير المقصودة على مسارات المنظومة.
Acceptance Tests & Security/Perf: تطابق ترويسات Strict-Transport-Security, Content-Security-Policy, وCache-Control: private, no-store حيًا على كافة المسارات الخاصة، وتحول الأحكام الثلاثة (PUBLIC_DEMO, 48H_TRIAL, COMMERCIAL_LAUNCH) رسميًا بالأدلة الحية إلى GO.
Rollback & DoD & Approval: التراجع الفوري في أقل من 60 ثانية إما بإغلاق AIGAS_APP_ENABLED=false أو إعادة سجل الأصل في Cloudflare إلى خدمة Static الاحتياطية؛ يكتمل بتوقيع إيصال الإطلاق النهائي من المالك.