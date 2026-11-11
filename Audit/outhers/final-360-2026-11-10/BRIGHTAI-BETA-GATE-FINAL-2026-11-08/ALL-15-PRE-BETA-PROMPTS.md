# 

---

---




---




---

# 

---

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
