# Route parity — P10

**ملاحظة:** توثيق مصدر محلي فقط؛ لم يُجر HTTP probe، ولم يُتحقق من auth/session في بيئة تشغيل. المسارات التالية من `src/server/api/routes.mjs` و`request-schemas.mjs` ما لم يُذكر غير ذلك. تظهر في route registry بلا slash أخير ويقوم `resolveRoute()` بتطبيع slash الأخير؛ تحقق فعليًا من renderer قبل اعتماد الروابط.

| مقصد واجهة المرجع | Public synthetic | Enterprise route/methods من المصدر | Request constraints / ملاحظات |
|---|---|---|---|
| Overview | `/demo/governance/#overview` | `GET /app/api/kernel`؛ وقراءات API المنتجات | enterprise يتطلب جلسة/مساحة مصرح بها؛ تفاصيل authorization لا تستنتج من هذا الجدول |
| Kernel | `/demo/governance/` | `/app/api/kernel` GET/POST؛ policies GET/POST؛ products PATCH؛ members GET/POST | Kernel trial: `/app/api/kernel/trials` GET/POST، submit/cancel POST؛ `/app/api/trial` GET/POST (`start` أو `open`) |
| Firewall | `/demo/governance/#firewall`؛ `/demo/firewall/` | `/app/api/firewall/evaluate` POST؛ `/guarded-executions` POST؛ `/rules` GET/POST/PATCH/DELETE | evaluate schema strict؛ guarded execution يحتاج request_id؛ عدم استخدام app routes من الزائر |
| Risk Engine | `/demo/governance/#risk-engine`؛ `/demo/risk-engine/` | `/app/api/risk-engine/assets` GET/POST؛ `assets/[assetId]` PATCH/DELETE؛ assessments GET/POST؛ revisions GET؛ treatments GET/POST/PATCH؛ assist POST؛ export GET | `assetId` route ID؛ assessment يطلب asset_version وlikelihood/impact 1..3 وأسبابًا وsynthetic confirmation |
| Human Gate | `/demo/governance/#human-gate`؛ `/demo/human-gate/` | requests GET/POST؛ `[requestId]/decide` POST؛ `/execute` POST؛ `/cancel` POST؛ policy POST؛ delegations GET/POST/revoke POST | decision `APPROVE|REJECT`؛ reason إلزامي؛ execute body فارغ؛ يظل القرار مرهونًا بالـauth والسياسة |
| Ledger | `/demo/governance/#ledger`؛ `/demo/ledger/` | events GET/POST؛ `[eventId]` GET؛ `/export` GET؛ `/verify` POST | verify يقبل candidate اختياريًا بهيكل مصدر صارم؛ لا توقيع على export local |
| Secure Chat | `/demo/secure-chat/` | `/app/api/secure-chat/models` GET؛ messages POST/DELETE | POST يتطلب requestId/modelId/message وsyntheticAcknowledged؛ لا ادعاء نجاح قبل رد الخادم |
| Registry | `/demo/governance/#inventory` (جلسة synthetic) | `/app/api/risk-engine/assets` GET/POST؛ detail PATCH/DELETE؛ revisions GET | لا يوجد route باسم `/registry` مثبت في route inventory |
| Policy library | `/demo/governance/#policies` | `/app/api/kernel/policies` GET/POST؛ Firewall `/rules` | policy endpoint discriminated operations؛ template لا يساوي policy approved |
| Developer Workbench | لا route عامة محددة في ملفات الفحص | توليد الأمثلة ينبغي أن يعتمد `routes.mjs` + `request-schemas.mjs`؛ لا API Workbench خاص | لا نسخ لأسرار ولا استعمال endpoint غير موجود |
| Trust Center | `/trust/` | لا API خاصة مطلوبة في route registry المفحوص | محتوى public static فقط بعد التحقق من الدليل والروابط |
| Enterprise request | `/request-access/`, `/contact/` | `/api/enterprise-inquiry` GET/POST؛ availability `/api/trial-availability` GET؛ authenticated trial `/app/api/trial` GET/POST | inquiry strict body: `submissionId` UUIDv4, `email`, `message`; تسليم inquiry لا يعني تفعيل trial |

## Source-contract checks قبل الربط

- اقرأ handler الفعلي لكل مسار، وليس schema فقط، للتحقق من Origin/Auth، workspace/tenant، role، Idempotency-Key، error envelope، cache/no-store، وحدود البيانات.
- استبدل placeholders `[assetId]`, `[requestId]`, `[eventId]` بمعرفات ناتجة من استجابة موثوقة، لا بقيم ثابتة.
- لا توسّع public demo إلى `/app/api/*` ولا تُدخل أرقام مستخدمين حقيقية في URL/analytics.
- يلزم E2E لعقد route، لكنه تعذر هنا بسبب منع سياسة الجهاز فتح منفذ محلي.