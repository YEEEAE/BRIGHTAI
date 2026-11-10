# تشغيل بوابة التجربة المحلية — 2026-11-11

الفرع `main`، HEAD عند الفحص `6f9785a6238374f873e88be13aa8ba322973bd55` + working tree. توجيه المستخدم: إصلاح بوابة الدخول المعروضة في الصورة؛ مؤسسة `BRIGHT AI`؛ استخدام Groq، ثم اختيار `qwen/qwen3.8-27b` بدل نموذج .env غير المتاح.

- أصل الصورة: خادم فحص أنشأه الوكيل على127.0.0.1:4416 مع `AIGAS_APP_ENABLED=false`؛ الخطأ503 قرار gate وليس كسر href.
- أُلغيت تعديلات روابط أسماء المنتجات التي أجراها الوكيل قبل التوضيح؛ عاد تنقلها كما كان. لم تتغير صفحات المنتجات أو صلاحياتها.
- أُضيف `npm run start:trial` ← `scripts/local-trial.mjs`؛ يحمّل `.env`، يفتح Portal، يفرض `HOST=127.0.0.1` وPORT4416 مستقلًا عن PORT النشر داخل .env؛ يمكن تخصيص المنفذ عبر `AIGAS_LOCAL_TRIAL_PORT`. أوامر النشر الأصلية وحراس الوصول دون تغيير. تشغيله لا يفعّل Trial أو ينشئ عضوية/منحة.
- عُدّل `GROQ_MODEL` فقط في `.env` إلى اختيار المستخدم؛ لم تتغير المفاتيح، ولم تُطبع، والملف بقيignored وصلاحيات600.
- Groq: النموذج السابق `llama-3.3-70b-versatile` أعاد404/model_not_found؛ GET models أعاد200. النموذج المختار أعاد200/stop/`GROQ_OK` و31رمزًا على نص اصطناعي واحد، بسقف128رمزًا. هذا فحص upstream مباشر، لا عملية Secure Chat من داخل المنتج.
- المتصفح: Kernel يعرض نموذج الدخول، ويحفظ returnTo=/app/secure-chat/؛ لا جلسة في متصفح الفحص. HTTP: صفحةKernel200 وSecureChat200، Cache-Control private/no-store، وAPI models401 بلا هوية. لا كشف بيانات مؤسسة.
- فحص `tests/secure-chat.test.mjs`: 6 PASS/0 FAIL/0 SKIP. `node --check scripts/local-trial.mjs` وdiff-check PASS. البناء56 PASS قبل إضافة launcher (لا تعديل في source البناء منذئذ).
- مصدر Secure Chat الحالي: `APPROVED_MODELS=[]` و`requireChatPolicyIntegration()` يرفض الإرسال دائمًا بـCHAT_POLICY_INTEGRATION_REQUIRED؛ `listModels` يضعsendable=false. مفتاح Groq العام موجود، وموصل `AIGAS_SC_GROQ_API_KEY` غير مهيأ؛ لا قيمة سرية في هذا التقرير.
- قاعدة .env خارجية؛ معاملة BEGIN READ ONLY/ROLLBACK أثبتت وجودaigas_tenants، وغيابaigas_trial_requests/aigas_trial_operators/aigas_release_readiness/aigas_trial_quota_limits؛ لا مؤسسة تطابقBRIGHT AI. لم تُنفذ DDL/DML أو تفعيل أو ترحيلات أو إنشاء هوية.

**DONE LOCAL:** فتح البوابة وإصلاح تشغيلها المتكرر؛ تغيير النموذج الذي اختاره المستخدم وإثبات رد upstream.

**PARTIAL / BLOCKED:** تجربة Secure Chat الفعلية داخل مؤسسةBRIGHT AI. تتطلب مسار هوية ومؤسسة معتمدًا، قاعدة تجربة مهيأة، استحقاقًا وحصة، إدخال مزود/نموذج ذي نطاق مؤسسة واعتماد معالجة، واستكمال تكامل Kernel/Firewall واختباره. لم تُنشأ مراجع موافقة أو readiness أو نتائج تشغيل وهمية. اسم المؤسسة واختيار النموذج وحدهما لا ينشئان هذه السجلات.

مرجع بيانات المزود: [Groq — Your Data](https://console.groq.com/docs/your-data)؛ الصفحة العامة تصف retention controls ولا تثبت إعدادات حساب المستخدم أو منطقة معالجة مثبتة لطلب بعينه.

لا commit/push/deploy، ولا تعديل للأعمال المتزامنة فيrestore rehearsal.
