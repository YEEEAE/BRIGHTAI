# BRIGHT AI — BETA CLOSURE FIVE PHASES

# BRIGHT AI — بداية إغلاق موانع Beta بعد تنفيذ 15 برومبت

**5 مطالبات تنفيذية مستقلة لـOpenCode** تشمل Staging وحماية Neon وRLS وRender Astro SSR واعتماد الـAI ودمج Sentry/PostHog. تنفيذ المستودع المحلي فقط؛ لا كتابة على GitHub أو Neon production أو Render أو مشروعات Sentry/PostHog دون موافقة منفصلة.

## لقطة الأدلة (9 نوفمبر 2026 بتوقيت السعودية)
- GitHub main `46ecaeae25368a467c30d27320978fb21aef2077`.
- Neon project `young-frog-60183055`؛ الفرع الوحيد production `protected=false`؛ 31 جدول AIGAS، سياستا RLS، Data API active on public، Neon Auth Better Auth. معلومات القراءة فقط، لا إثبات جاهزية.
- Go/No-Go RC أقدم: G1 PASS نطاق الموقع العام، G2–G8 BLOCKED، G9 NOT_VERIFIED. بقاء NO-GO حتى إعادة التقييم على SHA الحالي بعد أدلة وتوقيعات.
- Render MCP أعاد "no workspace selected"؛ تظهر مساحة عمل وحيدة باسم **Pro.Y's workspace**، لكن وفق ضوابط Render يجب أن **يؤكد المالك صراحةً** أنها المقصودة قبل الاستعلام عن خدماتها.
- Sentry وPostHog أضافهما المستخدم إلى OpenCode وفق إفادته؛ لا تظهر إضافتهما في `opencode.json` الموجود في مستودع GitHub، وقد يكونان في إعدادات محلية/عامة. الاتصال لا يثبت تشغيل SDK.

## الترتيب
1. `01-STAGING-PROTECTION-RESTORE.md` — المرحلة 1 — Staging / حماية production / خطة الاستعادة
2. `02-RLS-TENANT-ISOLATION.md` — المرحلة 2 — عزل المؤسسات وRLS بأقل صلاحيات
3. `03-RENDER-ASTRO-PORTAL.md` — المرحلة 3 — ربط Render وأصل Astro SSR وبوابة AIGAS
4. `04-AI-PROVIDERS-BETA-SCOPE.md` — المرحلة 4 — اعتماد التجربة والمزودين وخصوصية البيانات
5. `05-SENTRY-POSTHOG-OBSERVABILITY-AND-GONO.md` — المرحلة 5 — Sentry + PostHog + المراقبة وقرار Go/No-Go

لا تسمح لـOpenCode بأن يستنتج من صيغة البرومبت إذنًا لتغيير خدمات الإنتاج أو إنشاء بيئة تحوي بيانات فعلية. أي اختبار مُطلوب لإقرار Beta يتوقف حتى اعتماد المالك وجدولة التنفيذ.



---



---

# المرحلة 4 — اعتماد التجربة والمزودين وخصوصية البيانات

أنت OpenCode agent داخل المشروع المحلي. **ابدأ الآن بقراءة الملفات والأدلة، ثم طبّق التعديلات المحلية الآمنة التي يغطيها النطاق.** هذا برومبت مكتفٍ بذاته؛ لا تحتاج سياق محادثات سابقة.

## السياق الحاسم (مستقل عن المحادثة)
المستودع `YEEEAE/BRIGHTAI` ومشروع Neon `young-frog-60183055`، الفرع `production` (`br-young-bird-b43proeb`) وقاعدة `neondb`. آخر SHA مُشاهَد عند إعداد الحزمة `46ecaeae25368a467c30d27320978fb21aef2077` بتاريخ 2026-11-09 محليًا. استخدم `git rev-parse HEAD` للتحقق من SHA الحالي قبل أي إجراء؛ لا تعتمد على هذه اللقطة إن تغيّرت. النظام Astro 6 + Node standalone + Neon Auth + PostgreSQL، واجهة عربية RTL. الخمسة: Firewall/Ledger/Human Gate/Risk Engine/Secure Chat مع Kernel مركزي. الحالة المسجلة: Neon production فرع وحيد `protected=false`، 31 جدول AIGAS، RLS مفعل 31/31، سياستان، Data API نشط على `public`، دور مالك `neondb_owner` يتجاوز RLS، المستخدمون/المؤسسات/عمليات المنتجات صفر ضمن العد المفحوص. `/app/*` كانت 404 في فحص الموقع بتاريخ 2026-11-09 محليًا. مزودو Firewall وSecure Chat المعتمدون فارغون. الحزمة `docs/beta/RC-3eaf6907c35d0a138984defb5cf9f947f9520f82/GO-NO-GO-GATES.yaml` على SHA أقدم، ولا تعد دليلًا تلقائيًا على SHA الحالي.

## قواعد ملزمة
- لا `git commit/push/PR/deploy` أو تغيير DNS/Render/Neon production/Secrets/MCP settings من تلقاء نفسك. كتابة ملفات **المستودع المحلي** فقط لتنفيذ الكود الآمن الذي تحدده المهمة؛ كل أثر خارجي يتطلب تأكيدًا صريحًا منفصلًا من المالك. لا تستخدم اختبار بيانات حقيقية، لا تحمّل أسرارًا، لا تنسخ بيانات العملاء إلى Staging.
- افصل `SOURCE_PRESENT`/`SCHEMA_PRESENT`/`CONFIGURED`/`RUNTIME_VERIFIED`/`APPROVED` في كل مخرجاتك. لا ترفع قرار NO-GO إلى GO بدون أدلة مؤرخة على SHA فعلي وتوقيعات أصحاب السلطة.
- اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` و`docs/FINAL-RELEASE-HANDOFF.md` وملفات `docs/beta/**` ذات الصلة. اقرأ الحالة الحية عبر الأدوات المتصلة بصلاحية قراءة فقط. لا تعلن حدوث تشغيل أو حماية/استعادة أو ربط Sentry/PostHog إلا بدليل.
- الهيدر والهيرو المتحرك وConstellation والشعار وترتيب ونصوص أقسام الموقع العام **محمية**، ولا علاقة لها بإغلاق موانع Beta.
- تجنّب أي `test/build/lint/typecheck/Playwright` أو عمليات تغيّر الإنتاج من تلقاء نفسك في هذه الدفعة. أعدد **خطة تحقق قابلة للتنفيذ لاحقًا بإذن المالك**؛ لن يفتح Beta بدون التحقق المصرّح به.
- MCPs المتاحة لدى OpenCode حسب المستخدم: Neon وRender وSentry وPostHog (إضافة حديثة)، وقد تكون هناك GitHub وChrome DevTools. اكتشف الأسماء الفعلية للأدوات عند التشغيل؛ لا تخترع اسم دالة MCP ولا تعتبر الاتصال بحد ذاته نشر SDK أو مراقبة فعّالة.

## العمل المطلوب بالتحديد
1. استخدم `docs/ENTERPRISE-TRIAL-POLICY.md`, `docs/PRICING-AND-LICENSING.md` وأحدث `docs/beta/**`. لا تعِد العميل بتجربة 48 ساعة self-service أو تحويل مدفوع تلقائيًا. اقترح النطاق المقيد السابق (مؤسستان، خمسة مستخدمين كحد أقصى لكل مؤسسة، بيانات اصطناعية، دون إرسال خارجي أو دفع) **كطلب اعتماد** وليس كقرار نافذ.
2. `src/server/secure-chat/models.mjs` و`src/server/firewall/provider.mjs`: إذا بقيت registries فارغة فلا تضف مزودًا/نموذجًا افتراضيًا ولا تفعّل إرسالًا خارجيًا. جهز سجلاً لما يجب أن يوافق عليه المنتج/الأمن/الخصوصية/القانوني: provider, region, retention, no-training, DPA, scope, model IDs, rate/quota, endpoint, secret store reference, expiry.
3. راجع سياسة إقامة البيانات مع واقع Neon `aws-us-east-2`; لا تصف البنية بأنها مستضافة في السعودية قبل قرار موثق وتصحيح البيئة أو النص التجاري. لا تغيّر منطقة Neo​​n ولا تنقل قاعدة من تلقاء نفسك.
4. حدد موافقة دور المسؤول عن Gate وربط تجربة 48h بحالة منتج فعلي اجتاز اختبارًا بعد التفويض؛ لا تملأ جداول ترخيص تجريبي ببيانات وهمية على production.
5. صِغ شروط الحد الأدنى للتوقف الآمن fail-closed عند فقد مزود أو سياسة أو حد حصة، مع حماية Kernel الأساسية حتى بلا اشتراكات منتجات اختيارية.
**ناتج المرحلة:** سجل موافقات G6/التجربة وتبعياتها؛ لا يُغلق حتى توقيع الأطراف والدليل.

## رد قصير بعد التنفيذ
اذكر: Current SHA؛ المصادر التي قرأتها؛ الملفات المحلية التي تغيرت (إن وجدت)؛ نتيجة كل blocker بوسم الإثبات؛ القرارات التي تحتاج موافقة المالك. لا تعلن Beta READY.


---

# المرحلة 5 — Sentry + PostHog + المراقبة وقرار Go/No-Go

أنت OpenCode agent داخل المشروع المحلي. **ابدأ الآن بقراءة الملفات والأدلة، ثم طبّق التعديلات المحلية الآمنة التي يغطيها النطاق.** هذا برومبت مكتفٍ بذاته؛ لا تحتاج سياق محادثات سابقة.

## السياق الحاسم (مستقل عن المحادثة)
المستودع `YEEEAE/BRIGHTAI` ومشروع Neon `young-frog-60183055`، الفرع `production` (`br-young-bird-b43proeb`) وقاعدة `neondb`. آخر SHA مُشاهَد عند إعداد الحزمة `46ecaeae25368a467c30d27320978fb21aef2077` بتاريخ 2026-11-09 محليًا. استخدم `git rev-parse HEAD` للتحقق من SHA الحالي قبل أي إجراء؛ لا تعتمد على هذه اللقطة إن تغيّرت. النظام Astro 6 + Node standalone + Neon Auth + PostgreSQL، واجهة عربية RTL. الخمسة: Firewall/Ledger/Human Gate/Risk Engine/Secure Chat مع Kernel مركزي. الحالة المسجلة: Neon production فرع وحيد `protected=false`، 31 جدول AIGAS، RLS مفعل 31/31، سياستان، Data API نشط على `public`، دور مالك `neondb_owner` يتجاوز RLS، المستخدمون/المؤسسات/عمليات المنتجات صفر ضمن العد المفحوص. `/app/*` كانت 404 في فحص الموقع بتاريخ 2026-11-09 محليًا. مزودو Firewall وSecure Chat المعتمدون فارغون. الحزمة `docs/beta/RC-3eaf6907c35d0a138984defb5cf9f947f9520f82/GO-NO-GO-GATES.yaml` على SHA أقدم، ولا تعد دليلًا تلقائيًا على SHA الحالي.

## قواعد ملزمة
- لا `git commit/push/PR/deploy` أو تغيير DNS/Render/Neon production/Secrets/MCP settings من تلقاء نفسك. كتابة ملفات **المستودع المحلي** فقط لتنفيذ الكود الآمن الذي تحدده المهمة؛ كل أثر خارجي يتطلب تأكيدًا صريحًا منفصلًا من المالك. لا تستخدم اختبار بيانات حقيقية، لا تحمّل أسرارًا، لا تنسخ بيانات العملاء إلى Staging.
- افصل `SOURCE_PRESENT`/`SCHEMA_PRESENT`/`CONFIGURED`/`RUNTIME_VERIFIED`/`APPROVED` في كل مخرجاتك. لا ترفع قرار NO-GO إلى GO بدون أدلة مؤرخة على SHA فعلي وتوقيعات أصحاب السلطة.
- اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` و`docs/FINAL-RELEASE-HANDOFF.md` وملفات `docs/beta/**` ذات الصلة. اقرأ الحالة الحية عبر الأدوات المتصلة بصلاحية قراءة فقط. لا تعلن حدوث تشغيل أو حماية/استعادة أو ربط Sentry/PostHog إلا بدليل.
- الهيدر والهيرو المتحرك وConstellation والشعار وترتيب ونصوص أقسام الموقع العام **محمية**، ولا علاقة لها بإغلاق موانع Beta.
- تجنّب أي `test/build/lint/typecheck/Playwright` أو عمليات تغيّر الإنتاج من تلقاء نفسك في هذه الدفعة. أعدد **خطة تحقق قابلة للتنفيذ لاحقًا بإذن المالك**؛ لن يفتح Beta بدون التحقق المصرّح به.
- MCPs المتاحة لدى OpenCode حسب المستخدم: Neon وRender وSentry وPostHog (إضافة حديثة)، وقد تكون هناك GitHub وChrome DevTools. اكتشف الأسماء الفعلية للأدوات عند التشغيل؛ لا تخترع اسم دالة MCP ولا تعتبر الاتصال بحد ذاته نشر SDK أو مراقبة فعّالة.

## العمل المطلوب بالتحديد
1. المستخدم صرّح بأنه **أضاف Sentry MCP وPostHog MCP إلى OpenCode**. اكتشف اتصال الأدوات ومشروعاتها المتاحة بصلاحية قراءة فقط. لا تختر مشروعًا أو Organization لم يحدده المالك. لا تنشئ مفاتيح ولا تبدل feature flags أو تنشئ مشاريع خارجية تلقائيًا.
2. Sentry هو **تتبع أخطاء** الواجهة والخادم، وليس مخزن بيانات عملاء: أنشئ في **الكود المحلي فقط بعد اكتشاف نسخة Astro/Node وSDK** طبقة مراقبة *opt-in* للبيئات المعتمدة؛ تعطيل `sendDefaultPii`, request body capture, session replay, user email/IP, auth headers, cookies, DSN/DB errors, chat text, prompts, provider keys. Sanitization صريح قبل الإرسال لا يعتمد فقط على defaults. لا ترسل أي حدث فعلي خارج بيئة مخوّلة.
3. PostHog هو **تحليلات استخدام منتج**: في الـBeta المعتمد فقط، capture أحداث صريحة بحقول لا تحدد الأشخاص (مثل `portal_viewed`, `login_flow_result` مع `status_code` فقط, `product_opened` مع slug، `policy_action_result` مع action category، `quota_exhausted` بدون raw text). أوقف auto-capture, session recording/replay, heatmaps, user profile linking, form capture, web/vitals cross-domain tracking ما لم يعتمدها فريق الخصوصية. لا تبعث tenant/user ID الخام أو event metadata الحساس؛ وعند عدم وجود analytics approval ابقِه disabled.
4. ضع feature gating لطبقتي القياس مع kill switch مستقل عن `AIGAS_APP_ENABLED`. أخطاء 5xx وAuth/Invite وRLS deny وledger verification failure وAI provider timeout في Sentry؛ مسارات التحويل وزيارات أقسام المنتج في PostHog بعد تحقق الموافقة. لا ترسل متن المحادثة أو بيانات العملاء للتدريب، ولا تذكر أن الاتصال بـMCP يساوي تفعيل SDK.
5. حضّر إعدادات alert routing وon-call وincident response وفق `docs/PRE-BETA-SECURITY-AND-OPERATIONS-RUNBOOK.md`. لا تنشئ قناة إشعار أو تتصل بفريق خارجي بدون اعتماد. افصل CDN/Render health على `/` عن `/app/api/kernel/health`.
6. حدّث محليًا ملف Go/No-Go Gates مع SHA الحالي **والدليل الفعلي فقط**. الحد الأدنى: G1 PASS narrow public، G2–G8 BLOCKED ما لم توجد إثباتات تشغيلية جديدة، G9 NOT_VERIFIED حتى التوقيع. لا تحسب نسبة GO من مجرد كتابة كود، ولا تحرّر الختم اليدوي.
**ناتج المرحلة:** wiring opt-in آمن محليًا + خطة تحقّق ممنهجة في Staging + status gate G8/G9 بلا ادعاء نشر أو مراقبة Live.

## رد قصير بعد التنفيذ
اذكر: Current SHA؛ المصادر التي قرأتها؛ الملفات المحلية التي تغيرت (إن وجدت)؛ نتيجة كل blocker بوسم الإثبات؛ القرارات التي تحتاج موافقة المالك. لا تعلن Beta READY.
