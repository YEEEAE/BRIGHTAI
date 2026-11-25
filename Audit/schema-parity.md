# P0 — Schema contract & RLS parity

**الحالة: PARTIAL / NO-GO للربط المؤسسي.** Neon MCP: قراءات catalog فقط على فرعي production وstaging المحددين أدناه؛ لا DDL أو DML بعيد. Graphify لم يُستخدم لغياب الرسم المحلي؛ Linear وMagicPath لم يلزما لجرد قاعدة البيانات. مرجع المصدر `57153b52`.

| الدليل | production (`br-young-bird-b43proeb`) | staging (`br-rough-wind-bdkmg13n`) |
|---|---|---|
| `pg_constraint` — Ledger metadata | قيد validated قديم `ALLOW/BLOCK/REDACT` ولا يسمح بمفتاح `request_fingerprint` | validated بالحالات الخمس والبصمة الاختيارية بصيغة hex؛ قيد المرجع الاصطناعي `0029` غير validated |
| `pg_constraint` — Firewall binding | فحص 64 hex validated؛ `aigas_fw_decisions_guard_binding_check` موجود و`NOT VALID` | فحص الصيغة و`aigas_fw_decisions_check2` المكافئ للربط كلاهما validated |
| `pg_trigger` / `pg_proc` | append-only وno-truncate موجودان؛ `aigas_ld_events_chain_guard()` وtrigger الإدراج غائبان | الثلاثة موجودة |
| `pg_roles` / السياسات | 31 جدولًا، RLS على الكل، سياستان فقط، لا FORCE ولا `aigas_runtime`؛ `neondb_owner` يتجاوز RLS | 43 جدولًا عامًا و93 سياسة؛ FORCE على محادثات ورسائل Secure Chat؛ runtime يملك SELECT/INSERT على Ledger و`NOLOGIN/NOBYPASSRLS` |
| الجداول المطلوبة | delegations/grants، trial requests، self-service trials وexploration grants غائبة | موجودة |
| إيصالات migration | `ops.aigas_migration_ledger` غير موجود؛ لا نستنتج تطبيق ملف من وجود كائن | 32 إيصال `APPLIED` تتطابق مع SHA-256 لملفات الشجرة؛ `0024–0036` موجودة؛ `0013/0019` غير متوقعة على المسار fresh؛ `0037–0045` بلا إيصالات |

## Manifest قرار التنفيذ

- **SQL patch المقترح للـlegacy:** [0013](../migrations/0013_aigas_ledger_five_state_and_chain_guard.sql)، بعد مطابقة baseline فقط. يستبدل قيد metadata داخل معاملة ويضيف حارس السلسلة، دون تحديث أو حذف تاريخ. لا تشغله على staging ذي القيد الحديث؛ لا تعِد تشغيل `0003`. احتفظ بـ`BLOCK` التاريخي كما خُتم؛ عند العرض فقط يُترجم إلى تسمية المنع. قارئ Ledger الحالي لا يقبل `BLOCK` في `publicMetadata`؛ عرض تلك الحالات يحتاج projection منفصلًا دون تعديل canonical/export أو ادعاء تحقق لم يحصل.
- `NOT VALID` لا يفحص الصفوف التاريخية عند إضافة القيد؛ يفرضه على الكتابات الجديدة. لا تعمل `VALIDATE` تلقائيًا ولا تعِد كتابة hashes. وثّق أعداد مخالفات القيد قبل أي طلب validation، منفصلة عن فحص صيغة البصمة. قيد Firewall binding يطلب بصمة لصف القرار GUARD؛ قيد Ledger يفحص صيغة البصمة إن وُجدت، ولا يثبت تطابقها مع صف القرار.
- **Legacy delta المشروط:** [ترتيب المستودع](../scripts/migration-order.mjs) مرجع rehearsal وليس تفويضًا للتطبيق. `0014` بعد أساس HG؛ `0023` يضيف trial requests/events/entitlements قبل `0030`؛ `0033` يضيف exploration، و`0034` يضيف self-service قبل توسعة `0040`. `0018` و`0022` قبل `0025`؛ افحص تصادم الفهارس قبل الإنشاء. `0025` يحل محل `0019`، و`0027` يستكمل عزل Secure Chat. `0024` يصلح حارس السلسلة وحقول audit، لا قيد metadata؛ لا تضع `0017` بعد إضافة تلك الحقول عبر `0024`.
- **ذيل staging المرشح بعد إعادة فحص كل prerequisite وإيصال:** `0037` ربط تصعيد HG بقرار Firewall؛ `0038` قبول الدعوات بعد bootstrap `0036`؛ `0039` مراجعة Risk داخل HG؛ `0040` lifecycle فوق `0033/0034`؛ `0041` صلاحيات المشغّل فوق دورة trial؛ `0042` idempotency؛ `0043` سجل المحاولات؛ `0044` قراءة quota pilot؛ `0045` اشتراط SSO. غياب الإيصال وحده لا يبرر التطبيق: قارن الدوال والأعمدة والسياسات والمنح الخاصة بكل ملف قبل الاستئناف. لا تُنشئ إيصالات بأثر رجعي دون مراجعة المالك.

## خطة الاختبار والاستعادة

1. اعتمد هدفًا قابلًا للتخلص منه داخل مشروع staging، ببيانات اصطناعية وأسرار مستقلة. الفرع المقروء غير محمي؛ لا تستخدم الإنتاج كأصل بيانات. احفظ نقطة UTC/LSN ونسخة مخطط وإيصالات، واختبر الاستعادة إلى هدف منفصل قبل الكتابة؛ نافذة Neon المرئية ست ساعات.
2. قارِن manifest checksums عبر `shasum -a 256 migrations/*.sql`. ثبّت دور التطبيق كـlogin مخصص غير مالك ولا يتجاوز RLS، مع تفعيل `aigas_runtime` حسب التصميم. لا تمنح DML عامًا. تحقق من Data API ومن المنح الفعلية، بما فيها منح الأعمدة والدوال. اضبط actor/tenant محليًا لكل معاملة من هوية وعضوية تحقق منهما الخادم؛ لا تثق بقيم المتصفح. أبقِ FORCE على محتوى Secure Chat، وراجع أثره على دوال bootstrap وعضوية SECURITY DEFINER قبل توسيعه.
3. شغّل [اختبار عقد SQL](schema-parity-test.sql) تحت runtime بمعاملة تتراجع؛ يختبر الإدراج لا canonical hash أو HTTP. أضف فحص رفض GUARD دون بصمة في جدول القرار، واختبار API لحفظ الأدلة ذريًا، وقراءة عبر tenant آخر، ومقارنة أعداد الصفوف وhash heads قبل/بعد.
4. قبل commit: أي فشل يعني `ROLLBACK`. بعد commit: أوقف الكتابات أولًا؛ لا تعِد قيد الحالات الثلاث فوق أحداث جديدة ولا تحذف صفوفًا. استعد إلى هدف منفصل، وقارن المخطط والإيصالات والأدلة، وصالح أي كتابة لاحقة لنقطة الاستعادة قبل إعادة التوجيه. لا تبدّل اتصال التطبيق إلى دور المالك كحل مؤقت.
5. **MagicPath:** أبقِ Ledger/Human Gate مفصولين عن البيئة المؤسسية حتى مرور البوابة. واجهة React تعرض حالات الخادم فقط؛ mutations تمر عبر API الحالية مع تحقق الجلسة والعضوية والسياسة والـidempotency في الخادم. لا اتصال مباشر بقاعدة البيانات ولا صلاحيات مشتقة من حالة React.

| معيار القبول | النتيجة |
|---|---|
| PostgreSQL 18.6: fresh + legacy delta rehearsal | PASS |
| مصفوفة RLS محليًا | FAIL: `client-deny-restrictive` و`runtime-verb-matrix-exact` و`runtime-column-grants-exact`؛ لا تُعتمد baseline المصفوفة قبل تسوية الفروق |
| 5/5 على staging ورفض cross-tenant | NOT RUN؛ يلزم اعتماد هدف كتابة معزول |
| حفظ التاريخ وrollback | مقترح بلا DML على التاريخ؛ الاستعادة على الهدف لم تُختبر |
| نشر أو ربط مؤسسي | لم يحدث |
