# المراقبة والتحليلات — Wiring محلي وآمن (Sentry + PostHog)

> **الحالة العامة:** `SOURCE_PRESENT` فقط. لا `CONFIGURED`، ولا `RUNTIME_VERIFIED`، ولا `APPROVED`.
> **تاريخ الإعداد:** 2026-11-09 (محلي). **HEAD المرصود:** `9bee68f450a55396528819d738e728b438475973` (`main`).
> **ملاحظة SHA:** اللقطة المذكورة في الطلب `46ecaeae…` والمرشح `3eaf6907…` تاريخيان. لم يُنتج أي دليل تشغيلي على الـSHA الحالي.
> **قاعدة ملزمة:** لا حدث فعلي يُرسل من هذه الدفعة. كل الطبقتين مطفأتان ما لم تُستوفَ بوابات الاعتماد أدناه. اتصال MCP ببيئة لا يعني أن SDK منشور أو أن المراقبة تعمل.

---

## 1. حصيلة الاكتشاف (قراءة فقط)

| البند | الحقيقة المرصودة | التصنيف |
|---|---|---|
| Astro | `astro ^6.0.0`، `output: 'server'`، `@astrojs/node` standalone | `SOURCE_PRESENT` |
| Node | `22.x` (Render يثبت `22.22.2`) | `CONFIGURED` في القالب فقط |
| حزم Sentry/PostHog | **لا يوجد** `@sentry/*` ولا `posthog-js`/`posthog-node` في `package.json` | `NOT_CONFIGURED` |
| Sentry MCP | متصل. مستخدم `yazeaqssffy@gmail.com`. منظمة واحدة `659ec3bf0cec` | متصل، ليس نشرًا |
| مشاريع Sentry | **صفر مشاريع** في المنظمة | `NOT_CONFIGURED` |
| PostHog MCP | متصل. مشروع واحد `Default project` (`id 720936`)، `ingested_event=false` | متصل، بلا أحداث |
| إعدادات PostHog الحالية | `autocapture_opt_out=null`، `capture_console_log_opt_in=true`، `capture_performance_opt_in=true`، `heatmaps_opt_in=null`، `anonymize_ips=false`، `session_recording_opt_in=false` | تحتاج تقوية قبل أي SDK عميل |
| اختيار مشروع/منظمة | **لم يحدد المالك** مشروع Sentry أو إعداد PostHog المعتمد للـBeta | `BLOCKED` |

**قرار هذه الدفعة:** لا إنشاء مشروع Sentry، ولا مفاتيح، ولا تغيير إعدادات PostHog، ولا اختيار منظمة/مشروع نيابةً عن المالك.

---

## 2. البنية المضافة

| الملف | الدور |
|---|---|
| `src/server/observability/config.mjs` | بوابات الاعتماد، تحليل DSN/API key، أسماء البيئات المسموحة |
| `src/server/observability/redact.mjs` | قوائم سماح للمسارات والأكواد والخصائص، وتنقية stack |
| `src/server/observability/sentry.mjs` | عميل Sentry أدنى بلا SDK: حدث واحد، Envelope، بلا breadcrumbs/PII |
| `src/server/observability/posthog.mjs` | Capture صريح لأحداث محددة فقط، بلا profilers أو replay |
| `src/server/observability/index.mjs` | واجهة استيراد موحدة |

**لم تُضف أي حزمة جديدة.** الاعتماد على `fetch` المدمج في Node 22 و`node:crypto`.

---

## 3. بوابات التشغيل (كلها افتراضيًا مغلقة)

كل طبقة تحتاج **الثلاثة معًا**: مرجع اعتماد + بيئة معتمدة + علم الطبقة. مفتاح الإيقاف مستقل تمامًا عن `AIGAS_APP_ENABLED`.

| المتغير | الغرض | افتراضي |
|---|---|---|
| `AIGAS_MONITORING_APPROVAL_REF` | مرجع قرار الخصوصية/التحليلات المعتمد (غير سري) | غائب ⇒ معطّل |
| `AIGAS_MONITORING_ENVIRONMENT` | `staging` \| `beta` \| `production` فقط | غائب ⇒ معطّل |
| `AIGAS_MONITORING_RELEASE` | وسم إصدار اختياري `[A-Za-z0-9._-]{1,80}` | غائب |
| `AIGAS_SENTRY_ENABLED` | `true` لتفعيل Sentry | غير `true` ⇒ معطّل |
| `AIGAS_SENTRY_DSN` | DSN بصيغة HTTPS فقط | غائب/غير صالح ⇒ معطّل |
| `AIGAS_SENTRY_KILL_SWITCH` | `true` يوقف Sentry فورًا | غير `true` |
| `AIGAS_POSTHOG_ENABLED` | `true` لتفعيل PostHog | غير `true` ⇒ معطّل |
| `AIGAS_POSTHOG_API_KEY` | مفتاح مشروع `phc_…` | غائب/غير صالح ⇒ معطّل |
| `AIGAS_POSTHOG_HOST` | أصل HTTPS فقط (بلا credentials/query) | غائب/غير صالح ⇒ معطّل |
| `AIGAS_POSTHOG_KILL_SWITCH` | `true` يوقف PostHog فورًا | غير `true` |

**لا تُضاف هذه القيم إلى `render.yaml` أو `.env.example` في هذه الدفعة.** تُضبط في Secret/Config المعتمد فقط بعد موافقة المالك، مع بقاء `AIGAS_APP_ENABLED` مستقلًا.

### 3.1 الإيقاف الفوري

```text
AIGAS_SENTRY_KILL_SWITCH=true
AIGAS_POSTHOG_KILL_SWITCH=true
```

يُعاد النشر/التشغيل بعدها. لا يحتاج إيقاف المراقبة إلى إغلاق البوابة، ولا يحتاج فتح البوابة إلى تشغيل المراقبة.

---

## 4. حدود البيانات — Sentry (تتبع أخطاء فقط)

### 4.1 ما يُرسل

- `event_id`, `timestamp`, `level`, `platform`, `logger`, `environment`, `release` (اختياري).- `transaction`: تسمية مسار ثابتة من قائمة (`app.api.kernel`, `app.api.ledger.verify`, …).
- `tags`: `surface`, `status_code`, `dependency`, `operation` فقط.
- `exception.value`: **رمز ثابت** مثل `KERNEL_DB_PRIVILEGE` أو `LEDGER_VERIFICATION_MISMATCH`.
- `fingerprint`: `[surface, code]`.
- Stack frames من `src/` أو `dist/` أو `scripts/` فقط، بلا وسائط ولا متغيرات.

### 4.2 ما لا يُرسل مطلقًا

- `error.message` الخام، SQL، رسالة السائق، جسم الطلب، الاستجابة.
- `Authorization`, `Cookie`, `Referer`, IP، بريد، اسم، هوية، `tenant_id`, `user_id`.
- DSN، مفاتيح المزود، نصوص المحادثة، prompts، مخرجات النموذج.
- Session replay، breadcrumbs، console logs، فيتال، request bodies.
- `sendDefaultPii` غير مستخدم إطلاقًا: العميل لا يجمع PII أصلًا.

### 4.3 متى يُرسل

- كل استجابة **5xx**.
- أكواد محددة صراحة: `AUTH_UNAVAILABLE`, `AUTH_SETUP_REQUIRED`, `INVITATION_*`, `TENANT_*`, `RLS_*`, `*_DB_PRIVILEGE`, `*_SCHEMA_MISSING`, `*_INTEGRITY_INVALID`, `PROVIDER_TIMEOUT`, `LEDGER_VERIFICATION_MISMATCH`.
- `401 UNAUTHORIZED` العادي **لا يُرسل** لتجنب ضجيج الجلسات المنتهية؛ يُرسل فقط كخطأ إعداد/خدمة (5xx).

### 4.4 نقاط الوصل

| الملف | الحدث |
|---|---|
| `src/server/kernel/http.mjs` | كل أخطاء Kernel/Auth/Invite/RLS |
| `src/server/human-gate/http.mjs` | أخطاء Human Gate + `policy_action_result` |
| `src/server/ledger/http.mjs` | أخطاء Ledger + `captureIntegritySignal` عند `mismatch`/`BLOCKED` |
| `src/server/risk-engine/http.mjs` | أخطاء Risk Engine |
| `src/server/firewall/http.mjs` | أخطاء Firewall + timeout المزود |
| `src/server/secure-chat/service.mjs` | أخطاء Secure Chat + `quota_exhausted` |

كل الاستدعاءات `void`/fire-and-forget: فشل المراقبة لا يغيّر الاستجابة ولا يرمي.

**حدود صريحة:** هذه الطبقة **خادمية فقط**. أخطاء الواجهة في المتصفح (JS، تفاعل، render) غير مغطاة حتى يُعتمد SDK عميل ويُقيّد وفق CSP والخصوصية. لا ندّعي أن Sentry يغطي الواجهة الآن.

---

## 5. حدود البيانات — PostHog (تحليلات استخدام فقط)

### 5.1 الأحداث المسموحة

| الحدث | الخصائص المسموحة |
|---|---|
| `portal_viewed` | `section` ∈ {public, portal, kernel, firewall, ledger, human-gate, risk-engine, secure-chat, auth} |
| `product_opened` | `product` ∈ المنتجات الخمسة + kernel |
| `login_flow_result` | `status_code` فقط |
| `policy_action_result` | `action_category` ∈ {policy_publish, policy_update, decision, delegation, execution, revoke} + `status_code` |
| `quota_exhausted` | `product` فقط |

أي حدث أو خاصية خارج القائمة **يُسقط بالكامل**، لا يُمرر جزئيًا.

### 5.2 الافتراضات الصلبة

- `distinct_id` عشوائي جديد لكل حدث (UUID).
- `$process_person_profile: false` و`$geoip_disable: true`.
- لا `tenant_id`, `user_id`, `email`, IP، `request_id`, نص، slug حر، أو metadata حساسة.
- لا auto-capture، ولا session recording، ولا heatmaps، ولا form capture، ولا web vitals، ولا cross-domain، ولا client SDK.
- القيم المسموحة تأتي من المسار أو ثوابت الكود، لا من جسم الطلب.

### 5.3 ما لم يُوصل بعد (بصراحة)

- `login_flow_result`: تسجيل الدخول يتم من المتصفح مباشرة إلى Neon Auth، فالخادم لا يرى نتيجته. يحتاج مسار عميل معتمدًا أو Webhook من مزود الهوية بعد موافقة الخصوصية. **غير موصول.**
- `portal_viewed` و`product_opened`: موصولان على مستوى عرض الصفحة في `AppLayout`.
- `policy_action_result`: موصول لعمليات Human Gate فقط حاليًا.
- `quota_exhausted`: موصول لـ`USAGE_LIMIT_REACHED` في Secure Chat.

---

## 6. المراقبة التشغيلية والتنبيه — خطة لا تنفيذ

### 6.1 فصل الفحوص

| المستوى | المسار | يثبت |
|---|---|---|
| CDN/Render public | `GET /` | الموقع العام يستجيب |
| Portal gate | `GET /app/` | البوابة 503 مغلقة أو مفتوحة، مع الترويسات |
| Kernel health | `GET /app/api/kernel/health/` | حالة الإعداد/المخطط/القاعدة (أكواد فقط) |
| Product smoke | نداء مصادق ببيانات اصطناعية | وظيفة فعلية — لاحقًا فقط |

`healthCheckPath: /` في `render.yaml` **لا** يثبت `/app/api/kernel/health`. لا تُبنى جهوزية المنتج عليه.

### 6.2 قواعد التنبيه المقترحة (تحتاج مالكًا)

| القاعدة | الشرط المقترح | الوجهة |
|---|---|---|
| 5xx spike | ≥ 5 أخطاء/5 دقائق على أي `surface` | Operations on-call |
| Auth/Invite failure | أي `AUTH_UNAVAILABLE`/`INVITATION_*` متكرر | Security + Platform |
| RLS/Privilege denial | أي `*_DB_PRIVILEGE`/`TENANT_*`/`RLS_*` | Security (S1 محتمل) |
| Ledger integrity | أي `LEDGER_VERIFICATION_MISMATCH` | Security + Compliance |
| Provider timeout | `PROVIDER_TIMEOUT` فوق العتبة | Product + Operations |
| Portal gate deviation | `/app/` ترجع غير 503 عند العلم مغلق | Operations |
| Kernel health | `blocked` أو `degraded` متتالٍ | Operations |

**لا تُنشأ قنوات Slack/بريد/PagerDuty في هذه الدفعة.** المالك يحدد الوجهات (قرارات 96/97) قبل أي ربط.

### 6.3 on-call والحوادث

يُستخدم قالب `docs/PRE-BETA-SECURITY-AND-OPERATIONS-RUNBOOK.md` §5 كما هو. الحقول التالية **فارغة عمدًا** حتى التوقيع:

- Incident owner، قناة الأمن، قناة إعلان الأعطال، on-call/escalation، نافذة الإخطار، نص الإخطار.
- التصنيف S1–S4 مقترح وغير معتمد.

### 6.4 Incident Response عند إشارة Sentry

1. تحقق أن الإشارة من بيئة معتمدة وSHA معلوم (`environment`/`release`).
2. لا تنسخ محتوى عميل إلى التذكرة؛ استخدم الرمز والوقت والمسار.
3. عزل الجلسة/المفتاح/المستأجر المتأثر فقط عند وجود أثر بيانات.
4. تصعيد إلى Incident owner والقانوني عند أثر بيانات.
5. بعد الاحتواء: سبب جذري + CAPA + تحديث السجل.

---

## 7. خطة تحقق Staging (NOT RUN — تحتاج إذنًا)

> كل ما يلي **لم يُنفّذ**. لا تُشغّل أي خطوة قبل تفويض المالك وبيانات اصطناعية فقط.

### V1 — ثبات التعطيل الافتراضي

```bash
# متوقع: لا شبكة، ولا تغيير سلوك
env -u AIGAS_SENTRY_ENABLED -u AIGAS_POSTHOG_ENABLED npm start
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:10000/
```

**قبول:** 200/503 المتوقع، وبلا محاولات خروج إلى Sentry/PostHog (يُثبت بمراقبة الشبكة أو proxy محلي).

### V2 — بناء حدث Sentry بلا إرسال

```bash
node --input-type=module -e "
import { describeSentryEventForTest } from './src/server/observability/sentry.mjs';
console.log(describeSentryEventForTest({ code:'KERNEL_DB_PRIVILEGE', status:503, surface:'kernel', pathname:'/app/api/kernel/' }));
"
```

**قبول:** الحدث يحتوي `exception.value=KERNEL_DB_PRIVILEGE` فقط، ولا `user`, `request`, `breadcrumbs`, `message`, `extra`.

### V3 — رفض DSN/مفتاح غير صالح

```bash
AIGAS_SENTRY_ENABLED=true AIGAS_SENTRY_DSN=http://insecure@example.test/1 npm start
```

**قبول:** لا إرسال؛ الطبقة `DSN_INVALID`.

### V4 — إرسال تجريبي مخوّل

على مشروع Sentry/PostHog **المعتمد فقط**:

1. اضبط `AIGAS_MONITORING_APPROVAL_REF` و`AIGAS_MONITORING_ENVIRONMENT=staging`.
2. أرسل حدثًا اصطناعيًا واحدًا عبر `AIGAS_SENTRY_ENABLED=true`.
3. تحقق من وصوله، ومن خلوّه من PII، ومن `release`.
4. اختبر `AIGAS_SENTRY_KILL_SWITCH=true` ثم أعد المحاولة.

**قبول:** حدث واحد، صفر PII، Kill Switch يوقف الإرسال فورًا.

### V5 — PostHog بعد موافقة التحليلات

1. فعّل `AIGAS_POSTHOG_ENABLED=true` بمفتاح مشروع معتمد.
2. افتح `/app/kernel/` بجلسة مصطنعة.
3. تحقق من `portal_viewed` + `product_opened` فقط.
4. تحقق من عدم وجود autocapture/replay/console/heatmap events.

**قبول:** حدثان فقط، `distinct_id` مختلف، بلا هوية أو tenant، وبلا شخص مُنشأ.

### V6 — التحقق من فصل الصحة

```bash
curl -sS -D - -o /dev/null https://<staging-host>/
curl -sS -D - -o /dev/null https://<staging-host>/app/
curl -sS -D - -o /dev/null https://<staging-host>/app/api/kernel/health/
```

**قبول:** `/` متاح، `/app/` 503 عند إغلاق العلم، Health JSON بأكواد فقط.

---

## 8. مصفوفة الحالة

| العنصر | SOURCE_PRESENT | SCHEMA_PRESENT | CONFIGURED | RUNTIME_VERIFIED | APPROVED |
|---|---|---|---|---|---|
| Sentry adapter + sanitization | YES | N/A | NO (لا DSN/مشروع) | NO | NO |
| Sentry wiring لمسارات الخادم | YES | N/A | NO | NO | NO |
| PostHog adapter + allowlist | YES | N/A | NO (لا مشروع معتمد) | NO | NO |
| PostHog wiring (portal/product/quota/policy) | YES | N/A | NO | NO | NO |
| `login_flow_result` | NO | N/A | NO | NO | NO |
| Alert routing / on-call | NO | N/A | NO | NO | NO |
| PostHog project hardening | N/A | N/A | NO | NO | NO |

**النتيجة:** G8 يبقى `BLOCKED`، وG9 يبقى `NOT_VERIFIED`. لا GO.

---

## 9. شروط الاعتماد قبل أي تفعيل

1. **Sentry:** مشروع محدد من المالك، DSN في Secret Store، سياسة احتفاظ، بيئة `staging` أولًا، وموافقة أمن/خصوصية.
2. **PostHog:** مشروع محدد صراحة (لا يُفترض `Default project`)، قرار تحليلات موقّع، وتعطيل `autocapture`/`console`/`performance`/`heatmaps`، وضبط `anonymize_ips=true` قبل أي SDK عميل.
3. **PII:** مراجعة payload فعلي (V2/V4/V5) قبل الإنتاج.
4. **On-call:** Incident owner + قنوات + تصعيد موقّعة.
5. **Kill switches:** اختبار إيقاف مستقل عن البوابة.
6. **عدم الإرسال:** لا بيانات عملاء، لا نصوص محادثة، لا معرفات خام، لا مفاتيح.

أي بند ناقص = المراقبة تبقى مطفأة.
