# عقد BRIGHTAI HTTP API

هذا العقد يصف مدخل Node عند تشغيل `npm start` وواجهات Astro المسجلة في المصدر. يعرض [سجل المسارات](../src/server/api/routes.mjs) الطرق ومعاملات الاستعلام، وتحدد [مخططات الطلب](../src/server/api/request-schemas.mjs) أجسام الكتابة وحدودها. تصف [مخططات النجاح](../src/server/api/response-schemas.mjs) الحقول الأساسية لكل عملية. بعض السجلات المتداخلة، وأجسام الاستجابات المملوكة لمزوّد المصادقة، معرّفة ككائنات JSON عامة في هذا الإصدار.

## الطلب

- استخدم المسارات المنتهية بـ `/` في الجدول. يقبل مدخل Node صيغتي `/healthz` و`/readyz` مباشرة.
- تستخدم الكتابة `application/json` مع UTF‑8 صالح. الاستثناء هو بلاغ CSP الذي يستخدم `application/csp-report`. يستخدم طلب خالٍ من الحقول الكائن `{}` متى كانت العملية تتوقع جسمًا.
- ترفض المخططات الحقول غير المعروفة، ويرفض حد HTTP معاملات الاستعلام الزائدة والمتكررة والمعرّفات غير المطابقة لصيغة UUID. تقبل معاملات الصفحة أعدادًا عشرية موجبة ضمن حد المورد.
- أقصى حجم للجسم 4,096 بايت لـKernel وOperator وبدء التجربة، و8,192 لـAuth وHuman Gate وLedger وRisk Engine وCSP، و18,000 لـFirewall، و131,072 لـSecure Chat، و256 لبلاغات Observability عند تفعيلها. تبقى حدود حقول النص والقيود على العمليات مرتبطة بالمخطط وسياسات المنتج.
- تستخدم واجهات مساحة العمل Bearer JWT. يحدد `workspace` مؤسسة من عضويات صاحب الرمز، ويعيد الخادم التحقق من الصلاحية ودور المؤسسة. عمليات Operator تستعمل صلاحية المشغّل المنفصلة.
- الأصل الافتراضي هو `https://brightai.live` أو `https://www.brightai.live`. يمكن ضبط أصول HTTPS المعتمدة للاختبار المرحلي في `AIGAS_API_ORIGINS` كسلسلة أصول دقيقة مفصولة بفواصل. يجب أن يتطابق `Origin` مع أصل الطلب المعتمد بكامله. يمكن لخادم التطوير قبول loopback، ويقبله خادم الإنتاج المحلي عند الربط عليه صراحةً وبالمنفذ المضبوط.
- لا ينعكس `Origin` في ترويسات CORS. يجيب `OPTIONS` بـ`405` و`Allow` لمسار معروف. يقبل Firewall Guard طلب خدمة يحمل Bearer وJSON دون `Origin`. يتحقق الخادم من الرمز والصلاحية بالطريقة المعتادة.

## الاستجابة

لكل استجابة API تمر عبر العقد ترويسة `X-Request-ID` من الخادم بصيغة UUIDv4. تتطابق قيمة `requestId` في الخطأ مع الترويسة. تحمل الأخطاء ترويسة `X-AIGAS-Error-Contract: aigas-error-v2`. يُولد معرّف جديد لكل محاولة، بما فيها محاولات إعادة الإرسال بالمفتاح نفسه. معرّف عملية Secure Chat في جسم الطلب والنجاح مستقل عن معرّف HTTP.

```json
{
  "code": "INVALID_REQUEST",
  "message": "بيانات الطلب غير صالحة.",
  "dependencyStatus": null,
  "requestId": "11111111-1111-4111-8111-111111111111"
}
```

`dependencyStatus` إما `null` أو `available` أو `not configured` أو `degraded` أو `blocked` أو `access denied` أو `expired` أو `temporarily unavailable`. اعتمد على `code` وHTTP في منطق العميل. النص موجّه للعرض وقد يتغير. تعيد الاستثناءات غير المعالجة رسالة عامة. طلبات `HEAD` واستجابات `204` خالية من الجسم.

| HTTP | استخدامه |
|---|---|
| 200 | قراءة أو تعديل أو اكتمال عملية بمخرجات |
| 201 | إنشاء مساحة أو قاعدة أو طلب مراجعة أو حدث أو أصل أو تقييم، وكذلك حفظ نسخة معالجة |
| 202 | طلب مراجعة مرتبط في Firewall Guard. التنفيذ الخارجي غير مؤكد بهذه الحالة |
| 204 | قبول بلاغ مراقبة أو CSP دون استجابة JSON |
| 301/308 | تحويل canonical عند استخدام بعض المسارات بلا شرطة ختامية |
| 400 | مسار ذو معرّف غير صالح، أو حقول استعلام أو جسم مرفوضة |
| 401 / 403 | دخول مطلوب، أو رفض أصل أو إذن أو سياسة |
| 404 / 405 | مسار أو مورد غير متاح، أو طريقة مرفوضة. يتضمن 405 ترويسة `Allow` |
| 408 | انتهت مهلة قراءة بلاغ CSP |
| 409 | تعارض نسخة أو حالة أو مفتاح منع التكرار |
| 410 | انتهت صلاحية إجراء Human Gate أو إحدى نوافذ الموافقة |
| 413 / 415 | تجاوز حجم الجسم أو التصدير، أو صيغة محتوى غير مدعومة |
| 422 | مخرجات Firewall محجوبة، أو رفض من مزوّد Auth |
| 429 | تجاوز حصة تشغيل أو حد الطلبات |
| 500 | فشل غير متوقع |
| 503 | بوابة مغلقة أو اعتماد تشغيلي غير جاهز أو متعطل |

قد يرد Node قبل العقد عند تلف صياغة الطلب على مستوى النقل، مثل `Host` غير قابل للتحليل. يستمر مسار Sandbox العام في إرجاع `503 DISABLED` بلا استدعاء مزوّد.

## العمليات المسجلة

تسري حالات التحقق والصلاحية والأعطال المشتركة أعلاه على الجدول. عمود النتيجة يبيّن حالة النجاح، أو الحالة الوحيدة لمسار مغلق. يبين [اختبار العقود](../tests/api-contract.test.mjs) استجابة كل زوج طريقة ومسار في السياق المحلي المحدد، ويضبط [مخطط النجاح](../src/server/api/response-schemas.mjs) شكل المخرجات.

| الطريقة | المسار | النتيجة |
|---|---|---|
| `GET`, `HEAD` | `/api/measurement-status/` | 200 |
| `POST` | `/api/observability/` | 204 |
| `POST` | `/api/public-demo/groq-sandbox/` | 503 |
| `POST` | `/api/security/csp-report/` | 204 |
| `POST` | `/app/api/firewall/evaluate/` | 200 |
| `POST` | `/app/api/firewall/guarded-executions/` | 200 / 202 |
| `GET`, `HEAD`, `PATCH`, `DELETE` | `/app/api/firewall/rules/` | 200 |
| `POST` | `/app/api/firewall/rules/` | 201 |
| `GET`, `HEAD`, `POST` | `/app/api/human-gate/delegations/` | 200 |
| `POST` | `/app/api/human-gate/delegations/[delegationId]/revoke/` | 200 |
| `POST` | `/app/api/human-gate/policy/` | 200 |
| `GET`, `HEAD` | `/app/api/human-gate/requests/` | 200 |
| `POST` | `/app/api/human-gate/requests/` | 201 |
| `POST` | `/app/api/human-gate/requests/[requestId]/cancel/` | 200 |
| `POST` | `/app/api/human-gate/requests/[requestId]/decide/` | 200 |
| `POST` | `/app/api/human-gate/requests/[requestId]/execute/` | 200 |
| `GET`, `HEAD` | `/app/api/kernel/` | 200 |
| `POST` | `/app/api/kernel/` | 201 |
| `GET`, `HEAD` | `/app/api/kernel/health/` | 200 |
| `GET`, `HEAD` | `/app/api/kernel/invitations/` | 200 |
| `GET`, `HEAD`, `POST` | `/app/api/kernel/members/` | 200 |
| `GET`, `HEAD`, `POST` | `/app/api/kernel/policies/` | 200 |
| `PATCH` | `/app/api/kernel/products/` | 200 |
| `GET`, `HEAD`, `POST` | `/app/api/kernel/trials/` | 200 |
| `POST` | `/app/api/kernel/trials/[trialId]/cancel/` | 200 |
| `POST` | `/app/api/kernel/trials/[trialId]/submit/` | 200 |
| `GET`, `HEAD` | `/app/api/ledger/events/` | 200 |
| `POST` | `/app/api/ledger/events/` | 201 |
| `GET`, `HEAD` | `/app/api/ledger/events/[eventId]/` | 200 |
| `GET`, `HEAD` | `/app/api/ledger/events/[eventId]/export/` | 200 |
| `POST` | `/app/api/ledger/events/[eventId]/verify/` | 200 |
| `GET`, `HEAD` | `/app/api/operator/trials/` | 200 |
| `POST` | `/app/api/operator/trials/[trialId]/activate/` | 200 |
| `POST` | `/app/api/operator/trials/[trialId]/close/` | 200 |
| `POST` | `/app/api/operator/trials/[trialId]/decide/` | 200 |
| `POST` | `/app/api/operator/trials/[trialId]/expire/` | 200 |
| `GET`, `HEAD` | `/app/api/risk-engine/actions/` | 200 |
| `GET`, `HEAD` | `/app/api/risk-engine/assets/` | 200 |
| `POST` | `/app/api/risk-engine/assets/` | 201 |
| `PATCH`, `DELETE` | `/app/api/risk-engine/assets/[assetId]/` | 200 |
| `GET`, `HEAD` | `/app/api/risk-engine/assets/[assetId]/assessments/` | 200 |
| `POST` | `/app/api/risk-engine/assets/[assetId]/assessments/` | 201 |
| `GET`, `HEAD` | `/app/api/risk-engine/assets/[assetId]/revisions/` | 200 |
| `GET`, `HEAD` | `/app/api/risk-engine/assets/[assetId]/treatments/` | 200 |
| `POST`, `PATCH` | `/app/api/risk-engine/assets/[assetId]/treatments/` | 201 |
| `POST` | `/app/api/risk-engine/assist/` | 200 |
| `GET`, `HEAD` | `/app/api/risk-engine/export/` | 200 |
| `POST`, `DELETE` | `/app/api/secure-chat/messages/` | 200 |
| `GET`, `HEAD` | `/app/api/secure-chat/models/` | 200 |
| `GET`, `HEAD`, `POST` | `/app/api/trial/` | 200 |
| `GET`, `HEAD` | `/healthz/` | 200 |
| `GET`, `HEAD` | `/readyz/` | 200 / 503 |
| `GET` | `/auth/api/get-session/` | 200 |
| `GET` | `/auth/api/token/` | 200 |
| `GET` | `/auth/api/organization/list/` | 200 |
| `GET` | `/auth/api/organization/list-invitations/` | 200 |
| `POST` | `/auth/api/sign-up/email/` | 200 |
| `POST` | `/auth/api/sign-in/email/` | 200 |
| `POST` | `/auth/api/sign-in/email-otp/` | 200 |
| `POST` | `/auth/api/sign-out/` | 200 |
| `POST` | `/auth/api/email-otp/send-verification-otp/` | 200 |
| `POST` | `/auth/api/email-otp/verify-email/` | 200 |
| `POST` | `/auth/api/organization/accept-invitation/` | 200 |
| `POST` | `/auth/api/organization/cancel-invitation/` | 200 |
| `POST` | `/auth/api/organization/invite-member/` | 200 |
| `POST` | `/auth/api/organization/create/` | 200 |

## الصفحات والحدود

| المورد | حجم الصفحة | آخر صفحة | مؤشر المتابعة |
|---|---:|---:|---|
| نسخ سياسة Kernel وموافقاتها | 50 لكل مجموعة | 999 | `hasMoreVersions` و`hasMoreApprovals` |
| أعضاء Kernel وطلبات Operator | 100 | 999 | `hasMore` |
| قرارات Firewall ضمن Rules | 12 | 10,000 | `hasNext` |
| طلبات Human Gate وأحداث Ledger | 25 | 100 | `hasMore` |
| أصول Risk Engine والإجراءات والتقييمات والمراجعات والمعالجات | 25 | 10,000 | `hasMore` |

القيمة الافتراضية لـ`page` هي 1. عند تحديد `policy_id` في GET للسياسات استخدم `versions_page` و`approvals_page` لترقيم المجموعتين بشكل مستقل. في POST مع `operation: "history"` الحقلان الرقميان هما `versionsPage` و`approvalsPage`. تعتمد صفحات الإزاحة ترتيبًا مستقرًا مع مرجع فاصل عند تساوي الوقت. يمكن أن تتحرك النتائج عند إضافة سجلات بين طلبين. يبقى سجل قواعد Firewall محدودًا بـ25 قاعدة. حد تفويضات Human Gate في العرض 100 سجل. يتوقف تصدير Ledger وRisk Engine عن إنتاج مستند جزئي عند تجاوز 10,000 سجل. بعض القوائم المتداخلة، مثل أقسام Kernel وبعض قوائم Neon Auth، تحتاج عقد صفحات مستقل.

## منع التكرار

- `POST /app/api/kernel/` يقبل `Idempotency-Key` من 1 إلى 128 محرفًا وفق `[A-Za-z0-9_.:-]`. ترسل واجهة Kernel مفتاحًا عشوائيًا وتعيد استخدامه عند محاولة إنشاء الاسم نفسه بعد تعذر تأكيد النتيجة. يربط PostgreSQL المفتاح بالحساب وبصمة الاسم الذي جرى التحقق منه. ينشئ طلبان متزامنان مساحة واحدة وسجل تدقيق واحدًا. يعيد المفتاح والاسم نفسيهما معرّف المساحة نفسها بعد التحقق من العضوية الحالية، وقد تتغير لقطة لوحة المعلومات. يعيد تغيير الاسم مع المفتاح نفسه `409 IDEMPOTENCY_CONFLICT`. تدعم الطلبات القديمة بلا مفتاح الإنشاء التقليدي.
- يقبل إنشاء طلب Human Gate وإنشاء أصل Risk Engine الترويسة نفسها. يتأكد الخادم من إذن الكتابة قبل إعادة قراءة المورد السابق. يمنع المفتاح تكرار الإنشاء والتدقيق داخل الحساب والمؤسسة والعملية. تحمل الإعادة `replayed: true` والحالة الحالية للمورد. استخدام الترويسة في عملية خارج المسارات الموثقة يعيد `400`.
- يقبل Risk Assist ترويسة `Idempotency-Key`. ترسل واجهة المخاطر المفتاح وتحافظ عليه لإعادة المحاولة نفسها عند غياب نتيجة مؤكدة. يحجز الخادم المفتاح في PostgreSQL قبل الاتصال بالمزوّد، بلا حفظ نص الطلب أو الرد. تُرجع الإعادة `409 ASSIST_ALREADY_ATTEMPTED` دون اتصال آخر، ويُرجع تغيير الحمولة `409 IDEMPOTENCY_CONFLICT`. يستخدم مسار الصياغة اليدوية إذا فُقد الرد. يبقى إرسال المفتاح اختياريًا للتوافق مع العملاء الحاليين.
- يستخدم Ledger `idempotency_key`، ويستخدم Firewall Guard `request_id`، ويستخدم Secure Chat `requestId` في العقود الموجودة. يحتفظ كل منتج بدلالاته، ومنها رفض إعادة تشغيل المزود أو إعادة نتيجة Ledger الموثقة. بدء التجربة وقبول دعوة Kernel لهما إعادة طلب مقيدة بالحالة.
- بعض عمليات إنشاء الموارد وتحريرها تستعمل أقفالًا أو نسخًا متوقعة أو انتقالات حالة. هذه الضوابط تقلل الازدواجية لبعض العمليات. تبقى بعض الأوامر، ومنها عمليات Auth الخارجية، دون ضمان إعادة عام على مستوى HTTP. لا تعِد كتابةً ذات نتيجة غير مؤكدة تلقائيًا إلا إذا كان مسارها يدعم إعادة آمنة موثقة.

## التحقق المحلي

```sh
npm run build
node --test tests/api-contract.test.mjs
API_IDEMPOTENCY_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/bright_api_local \
  node --test tests/api-idempotency-db.test.mjs
npm run test:healthz
```

في التحقق المحلي بتاريخ 2026-11-25 اجتازت حزمة العقد 167 حالة تغطي 59 مسارًا. اجتازت اختبارات PostgreSQL 18 إعادة الإنشاء المتزامن في Kernel وHuman Gate وRisk Engine. اجتازت رحلة Auth الاصطناعية في Chrome التسجيل والدعوة وفتح المنتجات.

يجب أن تكون قاعدة اختبار منع التكرار PostgreSQL 18 فارغة ومخصصة للاختبار. يختبر HTTP كل مسار وطريقة مسجلين، ومعامل الاستعلام الزائد ورفض preflight. تختلف الاختبارات الإيجابية باختلاف الاعتمادية. تغطي الاختبارات المحلية لبعض المنتجات منطق النجاح باستخدام PostgreSQL وAuth اصطناعيًا، بينما يحتاج النجاح المصرح به لكل عملية إلى بيانات اختبار مستقلة وتهيئة كل اعتماد خاص بها.

راجع [تغييرات التوافق وخطة الترحيل](API-CONTRACT-MIGRATION.md).
