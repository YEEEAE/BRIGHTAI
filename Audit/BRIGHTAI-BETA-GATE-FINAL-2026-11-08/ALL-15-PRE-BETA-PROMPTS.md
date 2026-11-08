# 

---

---



---

# BRIGHT AI / AIGAS — FINAL PRE-BETA PROMPT 10/15

**المهمة:** إغلاق سلامة Ledger وسلاسل الأدلة والتحقق المستقل  
**الأولوية:** P0  
**الوكيل:** OpenCode أو ما يكافئه، داخل نسخة العمل المحلية.

## السياق اللازم للعمل — لا تحتاج أي ملف من محادثة ChatGPT
- المشروع: **مؤسسة مُشرقة / BRIGHT AI**؛ التخصص **AIGAS (AI Governance and Safety)**، و**AIGAS Kernel** مشترك، والمنتجات الخمسة: Firewall, Ledger, Human Gate, Risk Engine, Secure Chat.
- المستودع: `YEEEAE/BRIGHTAI`، Astro 6 + `@astrojs/node` standalone + Neon PostgreSQL / Auth، واجهات عربية RTL. آخر SHA تمت مراجعته: `7994d3ce9df4797630d4dc9a2c51d2c141dedcab` بتاريخ 8 نوفمبر 2026. **أعد قراءة HEAD الحالي ولا تفترض أنه لم يتغير.**
- قاعدة البيانات المتصلة عبر Neon للمراجعة فقط: مشروع `young-frog-60183055`، قاعدة `neondb`، فرع `production`. فحص 8 نوفمبر أظهر **31 جدولًا `public.aigas_*` بلا سجلات**، ولا مستخدمين أو جلسات Auth، و31/31 RLS enabled مع **سياستين فقط**، ودور `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا، ومالك DB يتجاوز RLS. هذه نتائج مخطط لا إثبات ثغرة مُستغلة.
- قالب النشر `render.yaml` يحتوي `AIGAS_APP_ENABLED=false`، ولا يوجد برهان أن خدمة Node المنشورة هي نفسها HEAD. على 3 نوفمبر أعادت `/app/*` مسارات 404؛ أعد التحقق ولا تعتبرها حقيقة أبدية.
- Secure Chat: `src/server/secure-chat/models.mjs` يعرض `APPROVED_MODELS=[]`. Firewall: `src/server/firewall/provider.mjs` قائمة approvedProviders فارغة. لا تخترع اعتماد مزود AI أو أسعارًا أو بيانات عملاء.
- سجلات المشروع: `docs/RELEASE-BLOCKERS-REGISTER.md`, `docs/FINAL-RELEASE-HANDOFF.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/DATA-ACCESS-AND-RLS.md`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`. بعضها يعود ليوم 3 نوفمبر؛ لا تتعامل معه باعتباره أحدث من الحقيقة التي تفحصها.
- واجهة التصميم الحالية لها هيدر وشعار وHero/Constellation محمية. **يُمنع تغييرها**، ويُمنع تغيير نصوص أو مواقع أو ترتيب أقسام الصفحات العامة؛ يسمح صقل العناصر في مواضعها فقط وإضافات تعليمية اختيارية بعد المحتوى إن كانت تفيد ولا تستبدله.

## صلاحيات العمل وقواعد صارمة
1. أنت **OpenCode / Codex / أي وكيل تنفيذ** داخل **نسخة محلية** من المستودع. اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` وكل سياسة متعلقة بالمهمة. اكتشف MCP/Skills المتاحة، ثم نفّذ التعديل البرمجي **محليًا فقط**. **ممنوع تغيير GitHub البعيد: لا commit أو push أو PR أو merge أو deployment.**
2. Neon MCP وأي خدمة حية = **قراءة فقط**. لا تشغّل `CREATE/ALTER/UPDATE/DELETE/GRANT/REVOKE` ولا تطبّق migrations ولا تعِد تهيئة أو نقل بيانات/أسرار دون موافقة صريحة. إذا تطلب التنفيذ شيئًا في الإنتاج، حضّر Migration/Runbook محليين واترك التنفيذ للمالك لاحقًا.
3. احفظ البيانات الاصطناعية افتراضيًا. لا تُرسل بيانات حقيقية إلى مزود، ولا ترفع مستندات عميل أو تستخدم محادثات العميل للتدريب، ولا تكشف Credentials/DSN/مفاتيح في log أو browser أو Markdown.
4. افصل `SOURCE_PRESENT`, `SCHEMA_PRESENT`, `CONFIGURED`, `RUNTIME_VERIFIED`, `APPROVED`. لا تصف أي منتج بأنه متاح أو آمن أو معتمد من مجرد وجود كود أو جدول. عند غياب التهيئة أبقِ النظام Fail-Closed مع رسالة واضحة.
5. **لا تنفّذ اختبارات أو Build أو Lint أو نشرًا تلقائيًا** في برومبتات الإغلاق هذه التزامًا بنطاق عملك السابق؛ إن احتاج الإصدار تحققًا تشغيليًا، جهّز خطة وأوامر تحقق قابلة للتشغيل بواسطة جهة مخوّلة في مرحلة منفصلة. **لا توصي بإطلاق Beta قبل ظهور أدلة تحقق أمنية وتشغيلية فعلية**.
6. لا تغيّر الـHero المتحرك أو Constellation أو الهيدر أو الشعار أو ترتيب/محتوى الأقسام العامة. لا تغيّر API أو مؤشرات الصلاحية خارج ضرورة تصحيح خلل موثق داخل نطاق المهمة. لا تنقل مكونات React من 21st إلى Astro دون اعتبار التكلفة وملكية المكتبة.
7. نفّذ مسارًا واحدًا في هذه المهمة ثم توقف. خاتمة قصيرة: (أ) الملفات المحلية المعدلة، (ب) ما أصبح `SOURCE_PRESENT`، (ج) ما بقي `NOT_VERIFIED/BLOCKED` ومن صاحب الموافقة. لا تقل إن البيئة المنشورة تغيرت.

## الملفات المرجعية المقصودة
- `src/server/ledger/core.mjs`
- `src/server/ledger/writer.mjs`
- `src/server/ledger/service.mjs`
- `src/pages/app/api/ledger/events/[eventId]/verify.ts`
- `src/pages/app/api/ledger/events/[eventId]/export.ts`
- `src/pages/app/ledger/index.astro`
- `public/downloads/aigas-ledger-verifier.mjs`
- `migrations/0013_aigas_ledger_five_state_and_chain_guard.sql`

## التنفيذ المطلوب الآن
1. تحقق من Canonical hashing profile وتسلسل Tenant/Source/Time/Version الصحيح، ولا تعدّل أحداثًا موقّعة أو تضعف ربط chain.
2. دعم `VERIFIED / UNVERIFIED / BLOCKED` الحقيقي في UI حسب استجابة الخادم، لا تجعل كل حدث Verified بمجرد تحميله.
3. أكمل تصدير حزمة دليل صالحة للتحقق مستقلاً باستخدام أداة موجودة، مع توضيح أن SHA-256 لا يعادل توقيعًا خارجيًا مستقلًا أو عدم قابلية تلاعب مطلقة.
4. عالج idempotency وduplicate event وتتابع Transaction، واجعل عدم توفر سجل مطلوب يوقف العملية المعنية وفق السياسة وليس كل البوابة.
5. راجع 0013 محليًا وتبعياتها ولا تنفذها على production؛ حضّر خطوات مشغّل لتجربة export/verify على بيانات مصطنعة بعد الموافقة.
6. لا تنشئ شهادات امتثال/احتفاظ غير محدد، ولا تجعل Ledger شرطًا لتدقيق Kernel الأساسي.

## معيار الانتهاء
أدلة قابلة للتفسير والتحقق ضمن حدود تقنية موثقة؛ لا إعلان سلامة تشغيلية بدون حزمة فعلية.

**ابدأ بتنفيذ التغيير المحلي المحدد. لا تقدم خطة نظرية فقط. وأظهر أي شرط يحتاج إذنًا منفصلًا بدل تجاوزه.**


---

# BRIGHT AI / AIGAS — FINAL PRE-BETA PROMPT 11/15

**المهمة:** إغلاق دورة Human Gate والفصل بين مقدم الطلب والموافق والمنفذ  
**الأولوية:** P0  
**الوكيل:** OpenCode أو ما يكافئه، داخل نسخة العمل المحلية.

## السياق اللازم للعمل — لا تحتاج أي ملف من محادثة ChatGPT
- المشروع: **مؤسسة مُشرقة / BRIGHT AI**؛ التخصص **AIGAS (AI Governance and Safety)**، و**AIGAS Kernel** مشترك، والمنتجات الخمسة: Firewall, Ledger, Human Gate, Risk Engine, Secure Chat.
- المستودع: `YEEEAE/BRIGHTAI`، Astro 6 + `@astrojs/node` standalone + Neon PostgreSQL / Auth، واجهات عربية RTL. آخر SHA تمت مراجعته: `7994d3ce9df4797630d4dc9a2c51d2c141dedcab` بتاريخ 8 نوفمبر 2026. **أعد قراءة HEAD الحالي ولا تفترض أنه لم يتغير.**
- قاعدة البيانات المتصلة عبر Neon للمراجعة فقط: مشروع `young-frog-60183055`، قاعدة `neondb`، فرع `production`. فحص 8 نوفمبر أظهر **31 جدولًا `public.aigas_*` بلا سجلات**، ولا مستخدمين أو جلسات Auth، و31/31 RLS enabled مع **سياستين فقط**، ودور `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا، ومالك DB يتجاوز RLS. هذه نتائج مخطط لا إثبات ثغرة مُستغلة.
- قالب النشر `render.yaml` يحتوي `AIGAS_APP_ENABLED=false`، ولا يوجد برهان أن خدمة Node المنشورة هي نفسها HEAD. على 3 نوفمبر أعادت `/app/*` مسارات 404؛ أعد التحقق ولا تعتبرها حقيقة أبدية.
- Secure Chat: `src/server/secure-chat/models.mjs` يعرض `APPROVED_MODELS=[]`. Firewall: `src/server/firewall/provider.mjs` قائمة approvedProviders فارغة. لا تخترع اعتماد مزود AI أو أسعارًا أو بيانات عملاء.
- سجلات المشروع: `docs/RELEASE-BLOCKERS-REGISTER.md`, `docs/FINAL-RELEASE-HANDOFF.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/DATA-ACCESS-AND-RLS.md`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`. بعضها يعود ليوم 3 نوفمبر؛ لا تتعامل معه باعتباره أحدث من الحقيقة التي تفحصها.
- واجهة التصميم الحالية لها هيدر وشعار وHero/Constellation محمية. **يُمنع تغييرها**، ويُمنع تغيير نصوص أو مواقع أو ترتيب أقسام الصفحات العامة؛ يسمح صقل العناصر في مواضعها فقط وإضافات تعليمية اختيارية بعد المحتوى إن كانت تفيد ولا تستبدله.

## صلاحيات العمل وقواعد صارمة
1. أنت **OpenCode / Codex / أي وكيل تنفيذ** داخل **نسخة محلية** من المستودع. اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` وكل سياسة متعلقة بالمهمة. اكتشف MCP/Skills المتاحة، ثم نفّذ التعديل البرمجي **محليًا فقط**. **ممنوع تغيير GitHub البعيد: لا commit أو push أو PR أو merge أو deployment.**
2. Neon MCP وأي خدمة حية = **قراءة فقط**. لا تشغّل `CREATE/ALTER/UPDATE/DELETE/GRANT/REVOKE` ولا تطبّق migrations ولا تعِد تهيئة أو نقل بيانات/أسرار دون موافقة صريحة. إذا تطلب التنفيذ شيئًا في الإنتاج، حضّر Migration/Runbook محليين واترك التنفيذ للمالك لاحقًا.
3. احفظ البيانات الاصطناعية افتراضيًا. لا تُرسل بيانات حقيقية إلى مزود، ولا ترفع مستندات عميل أو تستخدم محادثات العميل للتدريب، ولا تكشف Credentials/DSN/مفاتيح في log أو browser أو Markdown.
4. افصل `SOURCE_PRESENT`, `SCHEMA_PRESENT`, `CONFIGURED`, `RUNTIME_VERIFIED`, `APPROVED`. لا تصف أي منتج بأنه متاح أو آمن أو معتمد من مجرد وجود كود أو جدول. عند غياب التهيئة أبقِ النظام Fail-Closed مع رسالة واضحة.
5. **لا تنفّذ اختبارات أو Build أو Lint أو نشرًا تلقائيًا** في برومبتات الإغلاق هذه التزامًا بنطاق عملك السابق؛ إن احتاج الإصدار تحققًا تشغيليًا، جهّز خطة وأوامر تحقق قابلة للتشغيل بواسطة جهة مخوّلة في مرحلة منفصلة. **لا توصي بإطلاق Beta قبل ظهور أدلة تحقق أمنية وتشغيلية فعلية**.
6. لا تغيّر الـHero المتحرك أو Constellation أو الهيدر أو الشعار أو ترتيب/محتوى الأقسام العامة. لا تغيّر API أو مؤشرات الصلاحية خارج ضرورة تصحيح خلل موثق داخل نطاق المهمة. لا تنقل مكونات React من 21st إلى Astro دون اعتبار التكلفة وملكية المكتبة.
7. نفّذ مسارًا واحدًا في هذه المهمة ثم توقف. خاتمة قصيرة: (أ) الملفات المحلية المعدلة، (ب) ما أصبح `SOURCE_PRESENT`، (ج) ما بقي `NOT_VERIFIED/BLOCKED` ومن صاحب الموافقة. لا تقل إن البيئة المنشورة تغيرت.

## الملفات المرجعية المقصودة
- `src/server/human-gate/core.mjs`
- `src/server/human-gate/service.mjs`
- `src/pages/app/api/human-gate/requests/[requestId]/decide.ts`
- `src/pages/app/api/human-gate/requests/[requestId]/execute.ts`
- `src/pages/app/human-gate/index.astro`
- `migrations/0014_aigas_human_gate_cancellation_delegation_and_grant.sql`

## التنفيذ المطلوب الآن
1. حافظ على الحالة الفعلية `PENDING/APPROVED/REJECTED/EXPIRED/CANCELLED/EXECUTED` عند وجودها، وارفض انتقالات غير صالحة أو مكررة.
2. طبّق Separation of Duties: المراجع ليس مقدم الطلب عند اشتراط السياسة، وراجع دوره داخل المؤسسة والمدة وسقف التفويض قبل كل قرار.
3. اربط الموافقة بهوية العملية وبصمة payload والـpolicy version، وتأكد أن execute ينفّذ نفس العملية مرة واحدة بعد تحقق خادمي متجدد.
4. اعرض طلبات المراجعة والطابور وسبب الرفض/التصعيد وحالة الانتهاء برسائل عربية واضحة، دون نقل مكان الأزرار أو تغيير نصوص المعايير.
5. راجع الترحيل 0014 محليًا ولا تدّعِ إتمام دورة الموافقة حتى توجد تجربة مؤسسات مفوضة بعد الاعتماد.
6. عند الحاجة إلى مستويات متعددة غير متوفرة، وضّح الحد الحالي ولا تصطنع سلسلة موافقات كاملة.

## معيار الانتهاء
دورة مراجعة خادمية غير قابلة لإعادة استخدام الموافقة، وواجهة تعكس حالتها؛ E2E مؤجل للبيئة المعتمدة.

**ابدأ بتنفيذ التغيير المحلي المحدد. لا تقدم خطة نظرية فقط. وأظهر أي شرط يحتاج إذنًا منفصلًا بدل تجاوزه.**


---

# BRIGHT AI / AIGAS — FINAL PRE-BETA PROMPT 12/15

**المهمة:** إغلاق سجل الأصول والمخاطر والمعالجة والتصدير  
**الأولوية:** P1  
**الوكيل:** OpenCode أو ما يكافئه، داخل نسخة العمل المحلية.

## السياق اللازم للعمل — لا تحتاج أي ملف من محادثة ChatGPT
- المشروع: **مؤسسة مُشرقة / BRIGHT AI**؛ التخصص **AIGAS (AI Governance and Safety)**، و**AIGAS Kernel** مشترك، والمنتجات الخمسة: Firewall, Ledger, Human Gate, Risk Engine, Secure Chat.
- المستودع: `YEEEAE/BRIGHTAI`، Astro 6 + `@astrojs/node` standalone + Neon PostgreSQL / Auth، واجهات عربية RTL. آخر SHA تمت مراجعته: `7994d3ce9df4797630d4dc9a2c51d2c141dedcab` بتاريخ 8 نوفمبر 2026. **أعد قراءة HEAD الحالي ولا تفترض أنه لم يتغير.**
- قاعدة البيانات المتصلة عبر Neon للمراجعة فقط: مشروع `young-frog-60183055`، قاعدة `neondb`، فرع `production`. فحص 8 نوفمبر أظهر **31 جدولًا `public.aigas_*` بلا سجلات**، ولا مستخدمين أو جلسات Auth، و31/31 RLS enabled مع **سياستين فقط**، ودور `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا، ومالك DB يتجاوز RLS. هذه نتائج مخطط لا إثبات ثغرة مُستغلة.
- قالب النشر `render.yaml` يحتوي `AIGAS_APP_ENABLED=false`، ولا يوجد برهان أن خدمة Node المنشورة هي نفسها HEAD. على 3 نوفمبر أعادت `/app/*` مسارات 404؛ أعد التحقق ولا تعتبرها حقيقة أبدية.
- Secure Chat: `src/server/secure-chat/models.mjs` يعرض `APPROVED_MODELS=[]`. Firewall: `src/server/firewall/provider.mjs` قائمة approvedProviders فارغة. لا تخترع اعتماد مزود AI أو أسعارًا أو بيانات عملاء.
- سجلات المشروع: `docs/RELEASE-BLOCKERS-REGISTER.md`, `docs/FINAL-RELEASE-HANDOFF.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/DATA-ACCESS-AND-RLS.md`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`. بعضها يعود ليوم 3 نوفمبر؛ لا تتعامل معه باعتباره أحدث من الحقيقة التي تفحصها.
- واجهة التصميم الحالية لها هيدر وشعار وHero/Constellation محمية. **يُمنع تغييرها**، ويُمنع تغيير نصوص أو مواقع أو ترتيب أقسام الصفحات العامة؛ يسمح صقل العناصر في مواضعها فقط وإضافات تعليمية اختيارية بعد المحتوى إن كانت تفيد ولا تستبدله.

## صلاحيات العمل وقواعد صارمة
1. أنت **OpenCode / Codex / أي وكيل تنفيذ** داخل **نسخة محلية** من المستودع. اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` وكل سياسة متعلقة بالمهمة. اكتشف MCP/Skills المتاحة، ثم نفّذ التعديل البرمجي **محليًا فقط**. **ممنوع تغيير GitHub البعيد: لا commit أو push أو PR أو merge أو deployment.**
2. Neon MCP وأي خدمة حية = **قراءة فقط**. لا تشغّل `CREATE/ALTER/UPDATE/DELETE/GRANT/REVOKE` ولا تطبّق migrations ولا تعِد تهيئة أو نقل بيانات/أسرار دون موافقة صريحة. إذا تطلب التنفيذ شيئًا في الإنتاج، حضّر Migration/Runbook محليين واترك التنفيذ للمالك لاحقًا.
3. احفظ البيانات الاصطناعية افتراضيًا. لا تُرسل بيانات حقيقية إلى مزود، ولا ترفع مستندات عميل أو تستخدم محادثات العميل للتدريب، ولا تكشف Credentials/DSN/مفاتيح في log أو browser أو Markdown.
4. افصل `SOURCE_PRESENT`, `SCHEMA_PRESENT`, `CONFIGURED`, `RUNTIME_VERIFIED`, `APPROVED`. لا تصف أي منتج بأنه متاح أو آمن أو معتمد من مجرد وجود كود أو جدول. عند غياب التهيئة أبقِ النظام Fail-Closed مع رسالة واضحة.
5. **لا تنفّذ اختبارات أو Build أو Lint أو نشرًا تلقائيًا** في برومبتات الإغلاق هذه التزامًا بنطاق عملك السابق؛ إن احتاج الإصدار تحققًا تشغيليًا، جهّز خطة وأوامر تحقق قابلة للتشغيل بواسطة جهة مخوّلة في مرحلة منفصلة. **لا توصي بإطلاق Beta قبل ظهور أدلة تحقق أمنية وتشغيلية فعلية**.
6. لا تغيّر الـHero المتحرك أو Constellation أو الهيدر أو الشعار أو ترتيب/محتوى الأقسام العامة. لا تغيّر API أو مؤشرات الصلاحية خارج ضرورة تصحيح خلل موثق داخل نطاق المهمة. لا تنقل مكونات React من 21st إلى Astro دون اعتبار التكلفة وملكية المكتبة.
7. نفّذ مسارًا واحدًا في هذه المهمة ثم توقف. خاتمة قصيرة: (أ) الملفات المحلية المعدلة، (ب) ما أصبح `SOURCE_PRESENT`، (ج) ما بقي `NOT_VERIFIED/BLOCKED` ومن صاحب الموافقة. لا تقل إن البيئة المنشورة تغيرت.

## الملفات المرجعية المقصودة
- `src/server/risk-engine/core.mjs`
- `src/server/risk-engine/service.mjs`
- `src/pages/app/api/risk-engine/assets/[assetId]/assessments.ts`
- `src/pages/app/api/risk-engine/assets/[assetId]/treatments.ts`
- `src/pages/app/api/risk-engine/export.ts`
- `src/components/RiskWorkspace.astro`
- `migrations/0021_aigas_risk_engine_acceptance_guard.sql`

## التنفيذ المطلوب الآن
1. أبقِ محرك التقييم القائم قائمًا على likelihood × impact أو المعادلة المعتمدة الفعلية؛ لا تدعِ أن AI يقيم المخاطر دون نموذج.
2. أكمل سجل الأصول، versioned revisions، تقييم المخاطر الأصلية والمتبقية، مالك المعالجة، موعد المراجعة، وسبب قبول المخاطر المرتفعة.
3. افرض تحقق الدور وسياسة المؤسسة قبل Risk Acceptance، واستفد من guard موجود في ترحيل 0021، دون تغيير الإنتاج.
4. أضف حالات UI لفشل/انتهاء/تحديث سجل، مع بقاء أعمدة المصفوفة وألوانها الدلالية ومواقعها.
5. أكمل تصدير بيانات المشروع المسموح به ضمن نفس Tenant وتجنب تضمين معلومات حساسة أو قيم غير موثقة.
6. حضّر تجربة staging بمخاطر اصطناعية بعد الموافقة، ولا تصف كل تقييم بأنه مراجعة معيار ISO مكتملة.

## معيار الانتهاء
سجل مخاطر وتقييمات مصدرية مكتملة ضمن المنهج المقيد؛ لا إثبات تشغيل أو اعتماد تنظيمي حتى تحقق خارجي.

**ابدأ بتنفيذ التغيير المحلي المحدد. لا تقدم خطة نظرية فقط. وأظهر أي شرط يحتاج إذنًا منفصلًا بدل تجاوزه.**


---

# BRIGHT AI / AIGAS — FINAL PRE-BETA PROMPT 13/15

**المهمة:** إغلاق Secure Chat والخصوصية والنماذج والحصص دون مخاطر تسريب  
**الأولوية:** P0  
**الوكيل:** OpenCode أو ما يكافئه، داخل نسخة العمل المحلية.

## السياق اللازم للعمل — لا تحتاج أي ملف من محادثة ChatGPT
- المشروع: **مؤسسة مُشرقة / BRIGHT AI**؛ التخصص **AIGAS (AI Governance and Safety)**، و**AIGAS Kernel** مشترك، والمنتجات الخمسة: Firewall, Ledger, Human Gate, Risk Engine, Secure Chat.
- المستودع: `YEEEAE/BRIGHTAI`، Astro 6 + `@astrojs/node` standalone + Neon PostgreSQL / Auth، واجهات عربية RTL. آخر SHA تمت مراجعته: `7994d3ce9df4797630d4dc9a2c51d2c141dedcab` بتاريخ 8 نوفمبر 2026. **أعد قراءة HEAD الحالي ولا تفترض أنه لم يتغير.**
- قاعدة البيانات المتصلة عبر Neon للمراجعة فقط: مشروع `young-frog-60183055`، قاعدة `neondb`، فرع `production`. فحص 8 نوفمبر أظهر **31 جدولًا `public.aigas_*` بلا سجلات**، ولا مستخدمين أو جلسات Auth، و31/31 RLS enabled مع **سياستين فقط**، ودور `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا، ومالك DB يتجاوز RLS. هذه نتائج مخطط لا إثبات ثغرة مُستغلة.
- قالب النشر `render.yaml` يحتوي `AIGAS_APP_ENABLED=false`، ولا يوجد برهان أن خدمة Node المنشورة هي نفسها HEAD. على 3 نوفمبر أعادت `/app/*` مسارات 404؛ أعد التحقق ولا تعتبرها حقيقة أبدية.
- Secure Chat: `src/server/secure-chat/models.mjs` يعرض `APPROVED_MODELS=[]`. Firewall: `src/server/firewall/provider.mjs` قائمة approvedProviders فارغة. لا تخترع اعتماد مزود AI أو أسعارًا أو بيانات عملاء.
- سجلات المشروع: `docs/RELEASE-BLOCKERS-REGISTER.md`, `docs/FINAL-RELEASE-HANDOFF.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/DATA-ACCESS-AND-RLS.md`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`. بعضها يعود ليوم 3 نوفمبر؛ لا تتعامل معه باعتباره أحدث من الحقيقة التي تفحصها.
- واجهة التصميم الحالية لها هيدر وشعار وHero/Constellation محمية. **يُمنع تغييرها**، ويُمنع تغيير نصوص أو مواقع أو ترتيب أقسام الصفحات العامة؛ يسمح صقل العناصر في مواضعها فقط وإضافات تعليمية اختيارية بعد المحتوى إن كانت تفيد ولا تستبدله.

## صلاحيات العمل وقواعد صارمة
1. أنت **OpenCode / Codex / أي وكيل تنفيذ** داخل **نسخة محلية** من المستودع. اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` وكل سياسة متعلقة بالمهمة. اكتشف MCP/Skills المتاحة، ثم نفّذ التعديل البرمجي **محليًا فقط**. **ممنوع تغيير GitHub البعيد: لا commit أو push أو PR أو merge أو deployment.**
2. Neon MCP وأي خدمة حية = **قراءة فقط**. لا تشغّل `CREATE/ALTER/UPDATE/DELETE/GRANT/REVOKE` ولا تطبّق migrations ولا تعِد تهيئة أو نقل بيانات/أسرار دون موافقة صريحة. إذا تطلب التنفيذ شيئًا في الإنتاج، حضّر Migration/Runbook محليين واترك التنفيذ للمالك لاحقًا.
3. احفظ البيانات الاصطناعية افتراضيًا. لا تُرسل بيانات حقيقية إلى مزود، ولا ترفع مستندات عميل أو تستخدم محادثات العميل للتدريب، ولا تكشف Credentials/DSN/مفاتيح في log أو browser أو Markdown.
4. افصل `SOURCE_PRESENT`, `SCHEMA_PRESENT`, `CONFIGURED`, `RUNTIME_VERIFIED`, `APPROVED`. لا تصف أي منتج بأنه متاح أو آمن أو معتمد من مجرد وجود كود أو جدول. عند غياب التهيئة أبقِ النظام Fail-Closed مع رسالة واضحة.
5. **لا تنفّذ اختبارات أو Build أو Lint أو نشرًا تلقائيًا** في برومبتات الإغلاق هذه التزامًا بنطاق عملك السابق؛ إن احتاج الإصدار تحققًا تشغيليًا، جهّز خطة وأوامر تحقق قابلة للتشغيل بواسطة جهة مخوّلة في مرحلة منفصلة. **لا توصي بإطلاق Beta قبل ظهور أدلة تحقق أمنية وتشغيلية فعلية**.
6. لا تغيّر الـHero المتحرك أو Constellation أو الهيدر أو الشعار أو ترتيب/محتوى الأقسام العامة. لا تغيّر API أو مؤشرات الصلاحية خارج ضرورة تصحيح خلل موثق داخل نطاق المهمة. لا تنقل مكونات React من 21st إلى Astro دون اعتبار التكلفة وملكية المكتبة.
7. نفّذ مسارًا واحدًا في هذه المهمة ثم توقف. خاتمة قصيرة: (أ) الملفات المحلية المعدلة، (ب) ما أصبح `SOURCE_PRESENT`، (ج) ما بقي `NOT_VERIFIED/BLOCKED` ومن صاحب الموافقة. لا تقل إن البيئة المنشورة تغيرت.

## الملفات المرجعية المقصودة
- `src/server/secure-chat/models.mjs`
- `src/server/secure-chat/adapter.mjs`
- `src/server/secure-chat/policy.mjs`
- `src/server/secure-chat/requests.mjs`
- `src/server/secure-chat/service.mjs`
- `src/pages/app/api/secure-chat/messages.ts`
- `src/pages/app/secure-chat/index.astro`
- `migrations/0016_aigas_sc_user_token_quota.sql`

## التنفيذ المطلوب الآن
1. لا ترسل أي رسالة إلى مزود لم توافق عليه الجهة: `APPROVED_MODELS=[]` يجب أن يبقى Fail-Closed حتى اعتماد model/provider/retention/no-training.
2. حافظ على حفظ الرسائل الخاصة بصاحب المحادثة فقط، وعزل tenant/user، ولا تُسجل text/PII في Kernel Audit أو Analytics.
3. استكمل حصة request/token reservation/cancellation/idempotency وفق جداول Neo​​n الفعلية؛ لا تعرض أرقام usage وهمية.
4. في UI اجعل `NO_APPROVED_MODEL`, timeout, no quota, canceled, provider offline صريحة ولا تفعّل زر الإرسال عبر CSS فقط.
5. لا تضف RAG أو Files أو Share/Export أو Streaming أو مزودًا آخر حتى تقر السياسة ذلك، ولا تستخدم بيانات حقيقية لإثبات التهيئة.
6. راجع 0016 محليًا ولا تشغلها على production؛ حضّر سيناريو إرسال بيانات اصطناعية بعد موافقة موقّعة من مالك النموذج.

## معيار الانتهاء
واجهة وخادم محادثة بحماية موثقة وباب إرسال مغلق إلى حين اعتماد مزود وبيئة تشغيل.

**ابدأ بتنفيذ التغيير المحلي المحدد. لا تقدم خطة نظرية فقط. وأظهر أي شرط يحتاج إذنًا منفصلًا بدل تجاوزه.**


---

# BRIGHT AI / AIGAS — FINAL PRE-BETA PROMPT 14/15

**المهمة:** إغلاق الثقة والأمن والترويسات والاحتفاظ واستعداد التشغيل  
**الأولوية:** P0  
**الوكيل:** OpenCode أو ما يكافئه، داخل نسخة العمل المحلية.

## السياق اللازم للعمل — لا تحتاج أي ملف من محادثة ChatGPT
- المشروع: **مؤسسة مُشرقة / BRIGHT AI**؛ التخصص **AIGAS (AI Governance and Safety)**، و**AIGAS Kernel** مشترك، والمنتجات الخمسة: Firewall, Ledger, Human Gate, Risk Engine, Secure Chat.
- المستودع: `YEEEAE/BRIGHTAI`، Astro 6 + `@astrojs/node` standalone + Neon PostgreSQL / Auth، واجهات عربية RTL. آخر SHA تمت مراجعته: `7994d3ce9df4797630d4dc9a2c51d2c141dedcab` بتاريخ 8 نوفمبر 2026. **أعد قراءة HEAD الحالي ولا تفترض أنه لم يتغير.**
- قاعدة البيانات المتصلة عبر Neon للمراجعة فقط: مشروع `young-frog-60183055`، قاعدة `neondb`، فرع `production`. فحص 8 نوفمبر أظهر **31 جدولًا `public.aigas_*` بلا سجلات**، ولا مستخدمين أو جلسات Auth، و31/31 RLS enabled مع **سياستين فقط**، ودور `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا، ومالك DB يتجاوز RLS. هذه نتائج مخطط لا إثبات ثغرة مُستغلة.
- قالب النشر `render.yaml` يحتوي `AIGAS_APP_ENABLED=false`، ولا يوجد برهان أن خدمة Node المنشورة هي نفسها HEAD. على 3 نوفمبر أعادت `/app/*` مسارات 404؛ أعد التحقق ولا تعتبرها حقيقة أبدية.
- Secure Chat: `src/server/secure-chat/models.mjs` يعرض `APPROVED_MODELS=[]`. Firewall: `src/server/firewall/provider.mjs` قائمة approvedProviders فارغة. لا تخترع اعتماد مزود AI أو أسعارًا أو بيانات عملاء.
- سجلات المشروع: `docs/RELEASE-BLOCKERS-REGISTER.md`, `docs/FINAL-RELEASE-HANDOFF.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/DATA-ACCESS-AND-RLS.md`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`. بعضها يعود ليوم 3 نوفمبر؛ لا تتعامل معه باعتباره أحدث من الحقيقة التي تفحصها.
- واجهة التصميم الحالية لها هيدر وشعار وHero/Constellation محمية. **يُمنع تغييرها**، ويُمنع تغيير نصوص أو مواقع أو ترتيب أقسام الصفحات العامة؛ يسمح صقل العناصر في مواضعها فقط وإضافات تعليمية اختيارية بعد المحتوى إن كانت تفيد ولا تستبدله.

## صلاحيات العمل وقواعد صارمة
1. أنت **OpenCode / Codex / أي وكيل تنفيذ** داخل **نسخة محلية** من المستودع. اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` وكل سياسة متعلقة بالمهمة. اكتشف MCP/Skills المتاحة، ثم نفّذ التعديل البرمجي **محليًا فقط**. **ممنوع تغيير GitHub البعيد: لا commit أو push أو PR أو merge أو deployment.**
2. Neon MCP وأي خدمة حية = **قراءة فقط**. لا تشغّل `CREATE/ALTER/UPDATE/DELETE/GRANT/REVOKE` ولا تطبّق migrations ولا تعِد تهيئة أو نقل بيانات/أسرار دون موافقة صريحة. إذا تطلب التنفيذ شيئًا في الإنتاج، حضّر Migration/Runbook محليين واترك التنفيذ للمالك لاحقًا.
3. احفظ البيانات الاصطناعية افتراضيًا. لا تُرسل بيانات حقيقية إلى مزود، ولا ترفع مستندات عميل أو تستخدم محادثات العميل للتدريب، ولا تكشف Credentials/DSN/مفاتيح في log أو browser أو Markdown.
4. افصل `SOURCE_PRESENT`, `SCHEMA_PRESENT`, `CONFIGURED`, `RUNTIME_VERIFIED`, `APPROVED`. لا تصف أي منتج بأنه متاح أو آمن أو معتمد من مجرد وجود كود أو جدول. عند غياب التهيئة أبقِ النظام Fail-Closed مع رسالة واضحة.
5. **لا تنفّذ اختبارات أو Build أو Lint أو نشرًا تلقائيًا** في برومبتات الإغلاق هذه التزامًا بنطاق عملك السابق؛ إن احتاج الإصدار تحققًا تشغيليًا، جهّز خطة وأوامر تحقق قابلة للتشغيل بواسطة جهة مخوّلة في مرحلة منفصلة. **لا توصي بإطلاق Beta قبل ظهور أدلة تحقق أمنية وتشغيلية فعلية**.
6. لا تغيّر الـHero المتحرك أو Constellation أو الهيدر أو الشعار أو ترتيب/محتوى الأقسام العامة. لا تغيّر API أو مؤشرات الصلاحية خارج ضرورة تصحيح خلل موثق داخل نطاق المهمة. لا تنقل مكونات React من 21st إلى Astro دون اعتبار التكلفة وملكية المكتبة.
7. نفّذ مسارًا واحدًا في هذه المهمة ثم توقف. خاتمة قصيرة: (أ) الملفات المحلية المعدلة، (ب) ما أصبح `SOURCE_PRESENT`، (ج) ما بقي `NOT_VERIFIED/BLOCKED` ومن صاحب الموافقة. لا تقل إن البيئة المنشورة تغيرت.

## الملفات المرجعية المقصودة
- `src/middleware.ts`
- `src/server/kernel/http.mjs`
- `src/server/kernel/events.mjs`
- `docs/DATA-PRIVACY-AND-SECURITY.md`
- `docs/PRODUCT-TRUST-CONTRACT-RUNBOOK.md`
- `render.yaml`
- `docs/INTEGRATION-AND-DEPLOYMENT.md`

## التنفيذ المطلوب الآن
1. راجع CSP الحالية وحدّد `script-src/connect-src` المطلوبة بأقل صلاحية بعد جرد الموارد المسموحة؛ لا تضف unsafe-eval أو سياسة تكسر Auth أو Analytics دون مراجعة.
2. تأكد من no-store/noindex/HSTS/frame/referrer للبوابة الخاصة، وعدم تسريب أسرار الخطأ أو محتوى محادثات AI أو prompt إلى logs.
3. جهّز سياسات Retention/Delete/Export/Legal Hold وIncident Contact/response وOn-call بأماكن اعتماد المالك والقانوني والأمن؛ لا تحدد مدة قانونية أو ادعاء استضافة غير مثبت.
4. عرّف مراقبة 4xx/5xx/Latency وhealth runtime app/DB من دون نشر نظام SIEM كامل، والتزم بأن `healthCheckPath=/` لا يثبت صحة API.
5. جهّز مسارات طلب الدعم والسجلات المشفرة والتدقيق المسموح دون حفظ بيانات العميل للتدريب، والحفاظ على بيانات مصطنعة افتراضيًا.
6. أضف نقاط إيقاف واضحة قبل التشغيل الفعلي: موافقة الأمن، خطة تدوير الأسرار، Incident owner، موافقة الخصوصية.

## معيار الانتهاء
تحضيرات خصوصية وأمن وتشغيل محدودة وواضحة، بلا ادعاء اعتماد قبل توقيع أصحاب القرار.

**ابدأ بتنفيذ التغيير المحلي المحدد. لا تقدم خطة نظرية فقط. وأظهر أي شرط يحتاج إذنًا منفصلًا بدل تجاوزه.**


---

# BRIGHT AI / AIGAS — FINAL PRE-BETA PROMPT 15/15

**المهمة:** إعداد قرار الإطلاق التجريبي المقيد دون تنفيذ إطلاق تلقائي  
**الأولوية:** P0  
**الوكيل:** OpenCode أو ما يكافئه، داخل نسخة العمل المحلية.

## السياق اللازم للعمل — لا تحتاج أي ملف من محادثة ChatGPT
- المشروع: **مؤسسة مُشرقة / BRIGHT AI**؛ التخصص **AIGAS (AI Governance and Safety)**، و**AIGAS Kernel** مشترك، والمنتجات الخمسة: Firewall, Ledger, Human Gate, Risk Engine, Secure Chat.
- المستودع: `YEEEAE/BRIGHTAI`، Astro 6 + `@astrojs/node` standalone + Neon PostgreSQL / Auth، واجهات عربية RTL. آخر SHA تمت مراجعته: `7994d3ce9df4797630d4dc9a2c51d2c141dedcab` بتاريخ 8 نوفمبر 2026. **أعد قراءة HEAD الحالي ولا تفترض أنه لم يتغير.**
- قاعدة البيانات المتصلة عبر Neon للمراجعة فقط: مشروع `young-frog-60183055`، قاعدة `neondb`، فرع `production`. فحص 8 نوفمبر أظهر **31 جدولًا `public.aigas_*` بلا سجلات**، ولا مستخدمين أو جلسات Auth، و31/31 RLS enabled مع **سياستين فقط**، ودور `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا، ومالك DB يتجاوز RLS. هذه نتائج مخطط لا إثبات ثغرة مُستغلة.
- قالب النشر `render.yaml` يحتوي `AIGAS_APP_ENABLED=false`، ولا يوجد برهان أن خدمة Node المنشورة هي نفسها HEAD. على 3 نوفمبر أعادت `/app/*` مسارات 404؛ أعد التحقق ولا تعتبرها حقيقة أبدية.
- Secure Chat: `src/server/secure-chat/models.mjs` يعرض `APPROVED_MODELS=[]`. Firewall: `src/server/firewall/provider.mjs` قائمة approvedProviders فارغة. لا تخترع اعتماد مزود AI أو أسعارًا أو بيانات عملاء.
- سجلات المشروع: `docs/RELEASE-BLOCKERS-REGISTER.md`, `docs/FINAL-RELEASE-HANDOFF.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/DATA-ACCESS-AND-RLS.md`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`. بعضها يعود ليوم 3 نوفمبر؛ لا تتعامل معه باعتباره أحدث من الحقيقة التي تفحصها.
- واجهة التصميم الحالية لها هيدر وشعار وHero/Constellation محمية. **يُمنع تغييرها**، ويُمنع تغيير نصوص أو مواقع أو ترتيب أقسام الصفحات العامة؛ يسمح صقل العناصر في مواضعها فقط وإضافات تعليمية اختيارية بعد المحتوى إن كانت تفيد ولا تستبدله.

## صلاحيات العمل وقواعد صارمة
1. أنت **OpenCode / Codex / أي وكيل تنفيذ** داخل **نسخة محلية** من المستودع. اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` وكل سياسة متعلقة بالمهمة. اكتشف MCP/Skills المتاحة، ثم نفّذ التعديل البرمجي **محليًا فقط**. **ممنوع تغيير GitHub البعيد: لا commit أو push أو PR أو merge أو deployment.**
2. Neon MCP وأي خدمة حية = **قراءة فقط**. لا تشغّل `CREATE/ALTER/UPDATE/DELETE/GRANT/REVOKE` ولا تطبّق migrations ولا تعِد تهيئة أو نقل بيانات/أسرار دون موافقة صريحة. إذا تطلب التنفيذ شيئًا في الإنتاج، حضّر Migration/Runbook محليين واترك التنفيذ للمالك لاحقًا.
3. احفظ البيانات الاصطناعية افتراضيًا. لا تُرسل بيانات حقيقية إلى مزود، ولا ترفع مستندات عميل أو تستخدم محادثات العميل للتدريب، ولا تكشف Credentials/DSN/مفاتيح في log أو browser أو Markdown.
4. افصل `SOURCE_PRESENT`, `SCHEMA_PRESENT`, `CONFIGURED`, `RUNTIME_VERIFIED`, `APPROVED`. لا تصف أي منتج بأنه متاح أو آمن أو معتمد من مجرد وجود كود أو جدول. عند غياب التهيئة أبقِ النظام Fail-Closed مع رسالة واضحة.
5. **لا تنفّذ اختبارات أو Build أو Lint أو نشرًا تلقائيًا** في برومبتات الإغلاق هذه التزامًا بنطاق عملك السابق؛ إن احتاج الإصدار تحققًا تشغيليًا، جهّز خطة وأوامر تحقق قابلة للتشغيل بواسطة جهة مخوّلة في مرحلة منفصلة. **لا توصي بإطلاق Beta قبل ظهور أدلة تحقق أمنية وتشغيلية فعلية**.
6. لا تغيّر الـHero المتحرك أو Constellation أو الهيدر أو الشعار أو ترتيب/محتوى الأقسام العامة. لا تغيّر API أو مؤشرات الصلاحية خارج ضرورة تصحيح خلل موثق داخل نطاق المهمة. لا تنقل مكونات React من 21st إلى Astro دون اعتبار التكلفة وملكية المكتبة.
7. نفّذ مسارًا واحدًا في هذه المهمة ثم توقف. خاتمة قصيرة: (أ) الملفات المحلية المعدلة، (ب) ما أصبح `SOURCE_PRESENT`، (ج) ما بقي `NOT_VERIFIED/BLOCKED` ومن صاحب الموافقة. لا تقل إن البيئة المنشورة تغيرت.

## الملفات المرجعية المقصودة
- `docs/FINAL-RELEASE-HANDOFF.md`
- `docs/RELEASE-BLOCKERS-REGISTER.md`
- `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md`
- `docs/APP-PORTAL-RUNTIME-HANDOFF.md`
- `docs/PRODUCT-TRUST-CONTRACT-RUNBOOK.md`
- `package.json`
- `.github/workflows/`

## التنفيذ المطلوب الآن
1. حضّر Release Candidate فريد باسم SHA الحالي، وقائمة تغييرات المرحلة، ومصفوفة المنتج/الخطر/المالك/الدليل. لا تنسب SHA تاريخية للحالة الحالية.
2. اكتب خطة **تحقق حاكمة غير منفّذة**: build clean، تسجيل دخول ودعوات مصطنعة، عزل مؤسستين، Test provider closed ثم approved، Ledger export verify، HG SoD، RE accept، Chat quota، فحص Chrome mobile وKeyboard وReduced Motion، CSP، timeouts، Restore rehearsal.
3. عرّف 9 Go/No-Go Gates: وصول الموقع، مطابقة Source/Artifact، App SSR + Auth، RLS role + tenant isolation، schema staging، providers and privacy approvals، backups/restore، incident monitoring، operator signoff. اجعل كل Gate `PASS / BLOCKED / NOT_VERIFIED` مع صاحب قرار ودليل.
4. حدّد نطاق Beta الأول: عدد مؤسسات محدود، بيانات اصطناعية، منتجات المسموح بها فقط، no real customer data، لا تفعيل ذاتي لأي منتج غير معتمد، 48h PoV لا يبدأ إلا بعد approval.
5. اكتب خطة Rollback وFeature Flags وCustomer Notification وOncall. لا تنشر، لا ترفع `AIGAS_APP_ENABLED=true` ولا تفتح Data API ولا تحوّل الاختبارات إلى PASS من غير تشغيلها بواسطة جهة مأذونة.
6. آخر سطر في الملف يجب أن يكون قرارًا مشروطًا: `NO-GO` حتى تحقق جميع بوابات P0 المطلوبة فعليًا. لا يختصر تحقيق التغييرات المحلية هذا الشرط.

## معيار الانتهاء
حزمة قرار Beta قابلة للتوقيع لاحقًا؛ لا نشر ولا شهادة جاهزية وهمية.

**ابدأ بتنفيذ التغيير المحلي المحدد. لا تقدم خطة نظرية فقط. وأظهر أي شرط يحتاج إذنًا منفصلًا بدل تجاوزه.**

## حالة مرجعية للإغلاق 8 نوفمبر 2026
فحص المتصفح العام: 15/15 مسارات عامة 200، 0/7 مسارات AIGAS محمية متاحة (جميعها 404). خلل `aria-expanded` في قائمة الجوال قائم. اجعل بوابة SSR الخاصة `BLOCKED` لا `PASS`، واطلب مراجعة وصول الهيدر عند تفويض مناسب، ثم لا Go قبل المرور على بقية بوابات الأمن والخصوصية.
