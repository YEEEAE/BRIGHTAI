# مطابقة مخطط Neon وترتيب migrations — 2026-11-08

## النطاق والدليل

- **النسخة المحلية:** branch `main`, HEAD `5404026c5f01172cd3175a66286d2375554b80d4`؛ working tree كان نظيفًا قبل هذه المهمة.
- **الفرع الحي المقروء فقط:** Neon project `young-frog-60183055`, branch `production` / `br-young-bird-b43proeb`, database `neondb`.
- الأدوات: Neon MCP `list_branches`, `get_database_tables`, `get_data_api`, وكتالوج PostgreSQL عبر استعلامات `SELECT` فقط. لم تُنفذ DDL/DML أو تُنشأ فروع أو snapshots أو اتصالات.
- `production` هو الفرع الوحيد المرئي و`protected=false`. عدد جداول `public` هو 31؛ RLS مفعّل على 31/31، وسياسات RLS اثنتان فقط على جدولي Secure Chat. سجل migrations غير موجود، لذا حالات الاكتمال أدناه **استنتاج كتالوجي** وليست إثبات تطبيق تاريخي.
- إعداد المشروع: `aws-us-east-2`، الاتصالات العامة غير محجوبة (`block_public_connections=false`)، قائمة IP فارغة، ونافذة تاريخ الفروع 21,600 ثانية (6 ساعات). هذه القيم لا تثبت إقامة سعودية أو وجود snapshot/restore point ملائم قبل التغيير.
- `authenticated` لديه SELECT/INSERT/UPDATE/DELETE على 31 جدولًا؛ دور `aigas_runtime` غير موجود؛ `neondb_owner` يملك `BYPASSRLS`. Neon Data API `active` على `public`, بدور anonymous، والتجميعات مفعّلة.
- العدّ الحي لجداول `aigas_ld_events`, `aigas_audit_events`, `aigas_sc_requests` أعاد صفرًا؛ هذا لا يثبت خلو جميع جداول Auth أو استمرار خلو الجداول مستقبلًا.

## مطابقة الترحيلات 0001–0023

| الترحيل | دلالته/الاعتماد | ما يدعمه المخطط الحالي | الحكم |
|---|---|---|---|
| `0001` | Kernel؛ يتطلب Neon Auth user | جداول Kernel الأساسية موجودة | `SCHEMA_PRESENT`، لا سجل تطبيق |
| `0002` | Firewall baseline؛ يتطلب `0001`; نسخة fresh install | قواعد وقرارات Firewall وقيود الحالات الخمس موجودة | `SCHEMA_PRESENT`؛ لا ينسب وحده إلى ملف محدد |
| `0003` | Ledger baseline؛ يتطلب `0001`; fresh install | جدولا Ledger وحقول SHA-256 موجودة، لكن قيد metadata يسمح بثلاث حالات Firewall القديمة | `PARTIAL` مع `0013` |
| `0004` | Human Gate؛ يتطلب `0001` | requests وdecisions موجودان | `SCHEMA_PRESENT` |
| `0005` | Risk Engine؛ يتطلب `0001` | الأصول والمراجعات والتقييمات موجودة | `SCHEMA_PRESENT` |
| `0006` | إدارة Kernel؛ يتطلب `0001` وNeon Auth | جداول grants/orgs/invitations وversion موجودة | `SCHEMA_PRESENT` |
| `0007` | Human Gate enforcement؛ يتطلب `0001/0004/0006` | سياسات وأحداث HG وقيود guard الأساسية موجودة | `SCHEMA_PRESENT` |
| `0008` | دورة Risk Engine؛ successor لـ`0005` | treatment revisions وguard موجودان | `SCHEMA_PRESENT` |
| `0009` | Secure Chat؛ يتطلب `0001/0006` | الجداول الأربع والسياسات الحالية موجودة | `SCHEMA_PRESENT` |
| `0010` | هرمية السياسات | جداول الإدارات والسياسات والقرارات موجودة | `SCHEMA_PRESENT` |
| `0011` | ترقية Firewall اختيارية لقاعدة legacy ذات binding ناقص | لا أثر مستقل مطلوب في المخطط الحالي | `SUPERSEDED/CONDITIONAL`؛ لا تشغّله بعد توافق `0012` |
| `0012` | Firewall five-state upgrade؛ مسار للنسخة القديمة؛ fresh install يستخدم `0002` الحالي | الحالات الخمس وحقول binding موجودة | `SCHEMA_PRESENT` |
| `0013` | Ledger five-state + chain guard؛ يتطلب `0003` القديم | الحقول وhash profile موجودة؛ metadata check قديم وحارس الدالة/trigger غائبان | `PARTIAL` |
| `0014` | إلغاء/تفويض HG؛ يتطلب `0004/0006/0007` | `aigas_hg_delegations`, `aigas_hg_grants` وأعمدة التوسعة غائبة | `NOT_PRESENT` |
| `0015` | سياق Risk Engine والمخاطر المتبقية | الأعمدة والـguard متوافقة مع أثر المصدر | `SCHEMA_PRESENT` |
| `0016` | دالة حصة Secure Chat v2 | `aigas_sc_usage_window_v2` غائبة؛ الدالة القديمة موجودة | `NOT_PRESENT` |
| `0017` | سياق Audit: UUID correlation وpolicy/idempotency | الأعمدة الثلاثة غائبة من `aigas_audit_events` | `NOT_PRESENT` |
| `0018` | سحب امتيازات Data API من `authenticated/anonymous` | منح authenticated الأربعة موجودة على كل الجداول | `NOT_PRESENT` |
| `0019` | دور التشغيل وRLS؛ يوصي صراحة بتطبيق `0018` أولًا | `aigas_runtime` وسياساته غير موجودة | `NOT_PRESENT`; لا تحويل اتصال |
| `0020` | متطلبات مراجعة السياسات؛ يتطلب `0010` | `required_approvals` موجود | `SCHEMA_PRESENT` |
| `0021` | حارس قبول Risk؛ يتطلب `0005/0008/0015` | دالة وtrigger العلاج موجودان | `SCHEMA_PRESENT` |
| `0022` | فهارس unique لنطاق المراجع | فهرسا Firewall/Secure Chat غير موجودين | `NOT_PRESENT`; يتطلب فحص تصادم قبل الإنشاء |
| `0023` | دورة التجربة المؤسسية | `aigas_trial_requests` والجداول التابعة غير موجودة | `NOT_PRESENT`; يحتاج اعتماد المنتج/المالية/القانوني والأمن |

## فجوات مهمة وملاحظات ترتيب

1. **`0016` قبل `0019`:** ملف `0019` يمنح EXECUTE إلى `aigas_sc_usage_window_v2` فقط إذا كانت الدالة موجودة. تطبيق `0019` أولًا يترك الدالة التي تنشأ لاحقًا بلا منح runtime المتوقعة. الترتيب المطلوب: `0016` ثم `0019`.
2. **`0018` قبل `0019`:** إزالة منح Data API عن أدوار العميل تسبق إنشاء grants runtime؛ التطبيق الحي يحتاج مراجعة أمنية منفصلة.
3. **قائمة RLS في `0019` ناقصة:** القائمة الثابتة لا تشمل `aigas_hg_delegations` و`aigas_hg_grants` (من `0014`)، ولا جداول trial الثلاثة (من `0023`). حتى لو طبق `0019`، لا يثبت ذلك وجود سياسات runtime لهذه الجداول. راجع/وسّع السياسة قبل اعتبار الدور أقل صلاحية أو توصيله بالخدمة.
4. **`0013` جزئي:** قيد metadata الحي لا يطابق تعريف `0013` المصدري، إضافة إلى غياب chain guard. مسودة `0024` تضيف guard والأعمدة المفقودة فقط؛ لا تستبدل قيد metadata ولا تكتمل بها `0013`.
5. **`0017` غير idempotent:** أعمدة المصدر `ADD COLUMN` غير محمية بـ`IF NOT EXISTS`. إذا استُخدمت `0024` لإضافة الأعمدة الثلاثة، لا تعِد تشغيل `0017` بعدها دون تسوية المصدر أو تسجيل معتمد لحالة الاكتمال.
6. **المنح الحالية:** `authenticated` له DML على 31 جدولًا، بينما `aigas_runtime` غير موجود. لا تضف grants أو revoke عبر `0024`؛ ذلك يحتاج اعتمادًا ومراجعة bootstrap وData API.
7. وجود الجداول أو القيود لا يثبت أن migration بعينها اكتملت. يلزم ledger موثوق مستقبلًا أو مطابقة كاملة قبل وبعد على فرع معتمد.

## قرار هذا العمل

- أُعدّت `migrations/0024_aigas_catalog_parity_repair.sql` محليًا لإضافة أعمدة Audit nullable الناقصة وحارس سلسلة Ledger، بعملية transactional، دون تحديث صفوف أو إسقاط كائنات.
- المراجعة والتجربة على staging والتطبيق والنسخ/الاستعادة وحماية الإنتاج **NOT PERFORMED**. لا Neon كتابة حية، ولا `commit/push/PR/deploy`.
- قبل Beta تبقى gates: staging اصطناعي معزول ومحمي بموافقة المالك؛ نقطة استعادة واختبار استعادة؛ مراجعة Data API وgrants/RLS؛ إكمال migrations الفعلية وفحص عدم التصادم؛ اعتماد الأمن والتشغيل والمنتج والقانوني حيث تنطبق.
