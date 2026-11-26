# Developer Workbench — نقاط النهاية الحقيقية

**المصدر:** `src/server/api/routes.mjs` و`src/server/api/request-schemas.mjs` | **الحالة:** VERIFIED_SOURCE؛ لم يُجرَّب runtime هنا.

## القاعدة

المسار `/api/governance/evaluate` المذكور في نموذج MagicPath **غير موجود** في هذا المستودع. لا يعرض Workbench سوى المسارات المسجلة في `routes.mjs`. ولا تُخترع endpoints لعمليات المنتج.

## مسارات حقيقية (مختارة)

| المسار | الطرق | ملاحظة |
|---|---|---|
| `/api/enterprise-inquiry` | GET POST | استفسار عام؛ مخطط صارم بـ`submissionId` و`email` و`message` |
| `/api/trial-availability` | GET | حالة إتاحة التجربة |
| `/api/observability`, `/api/security/csp-report`, `/api/public-demo/groq-sandbox` | POST | مسارات تشغيلية/تجريبية |
| `/app/api/kernel` | GET POST | بوابة Kernel |
| `/app/api/kernel/policies` | GET POST | عمليات السياسات (list/history/create/revise/publish...) |
| `/app/api/firewall/evaluate` | POST | تقييم قاعدة أو `tool_call` مع `synthetic` |
| `/app/api/firewall/guarded-executions` | POST | يتطلب `request_id` |
| `/app/api/firewall/rules` | GET POST PATCH DELETE | إدارة القواعد |
| `/app/api/human-gate/requests` | GET POST | طلبات البشر |
| `/app/api/human-gate/requests/[requestId]/decide|execute|cancel` | POST | قرار/تنفيذ/إلغاء |
| `/app/api/ledger/events` | GET POST | أحداث مع `idempotency_key` |
| `/app/api/ledger/events/[eventId]/verify|export` | POST / GET | تحقق/تصدير مستقل |
| `/app/api/risk-engine/assets` | GET POST | أصول مع `workspaceQuery` |
| `/app/api/risk-engine/assist`, `/export`, `/actions` | POST/GET | مساعد/تصدير/إجراءات |
| `/app/api/secure-chat/models`, `/messages` | GET / POST DELETE | يتطلب اعتمادًا ومفتاحًا وسياسات وحصة |
| `/auth/api/[...operation]` | حسب العملية | تسجيل/دخول/OTP/دعوات |
| `/healthz`, `/readyz` | GET HEAD | liveness/readiness |

## أمثلة

```bash
curl -sS https://<host>/healthz/
curl -sS https://<host>/readyz/
curl -sS -X POST https://<host>/api/enterprise-inquiry -H 'Content-Type: application/json' -d '{"submissionId":"<uuid>","email":"name@example.com","message":"inquiry"}'
```

## قواعد العرض

1. لا مفاتيح أو رموز أو بيانات اعتماد في الأمثلة.
2. لا وصف أي مثال بأنه حي دون تنفيذ موثّق.
3. لا CORS grant؛ كتابة المصادر ترفض Origin غير المطابق عدا استثناء Firewall المقصود.
4. مسارات `/app/api/*` خاصة ومحكومة بـRLS واعتماد المؤسسة؛ لا تعرضها كأمثلة عامة.
