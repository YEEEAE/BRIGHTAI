# E09 — مراقبة منقاة وخصوصية URL: تقرير تنفيذ محلي

- **التاريخ (UTC):** 2026-11-11T03:15Z
- **البيئة:** macOS محلي؛ Node `v22.22.2`
- **SHA عند القياس:** `4a5a085b0b5ed625215bae51419ae8b4d4dcec28` + working tree
- **خط الأساس في البرومبت:** `6a3d53f41b5bd1af59eb320245745498765bd320` — **انحراف مؤكد:** HEAD الحالي بعده بـ7 commits. أُعيد فحص الانحراف قبل التنفيذ، والقياسات أدناه على HEAD الحالي لا على خط الأساس.
- **الحالة:** `PARTIAL` — الإصلاح المحلي DONE؛ canary/ingestion/تنبيه `NOT RUN` بسبب غياب وجهة معتمدة وتفويض إرسال.

## 1. ما تغيّر ولماذا

| # | التغيير | السبب الجذري |
|---|---|---|
| 1 | `page_referrer` يُرسل دائمًا من snippet GA4: أصل+مسار مسموح أو `''` صريحة | حذف الحقل عند رفض المُحيل كان يجعل `gtag` يعود إلى `document.referrer` الخام (بما فيه query) — أي القيمة التي تمنعها السياسة. الثغرة كانت موثقة كـ«غير مثبتة» في P13، وأصبحت مغلقة باختبار على الـsnippet. |
| 2 | طي المسارات الخاصة `/auth/*`, `/app/*`, `/api/*` إلى جذر القسم قبل الإرسال | رمز callback أو معرف سجل قد يكون في **مقطع مسار** لا في query؛ تمرير pathname كما هو كان يسرّبه. يطابق الآن route labels الثابتة في `redact.mjs`. |
| 3 | رفض المسارات العامة المُرمّزة أو الأطول من 200 محرف إلى `/` | منع `%2e%2e%2f` وأي بايت مُرمّز قد يحمل معرفًا. |
| 4 | تصحيح hash الـCSP القديم للـsnippet في `src/middleware.ts` + اختبار يمنع انحرافه | الـhash المخزّن لم يطابق المصدر أصلًا؛ تفعيل `AIGAS_CSP_ENFORCE=true` كان سيعطّل GA4 بصمت. |
| 5 | توسيع معاينة الحمولة والاختبارات وتحديث الوثيقة | إثبات ما يُحذف قبل أي إرسال، وتوثيق قرارات الوجهة/الاحتفاظ/التنبيه كمسودة للاعتماد. |

لم تُلمس Hero أو الهيدر أو الشعار أو Constellation أو نصوصها/أزرارها/روابطها، ولا CSS المشتركة. التغيير في snippet الـhead والوحدة الخادمية فقط.

## 2. الملفات

- `src/server/observability/url-policy.mjs` — `safeAnalyticsPath` + تطبيقه على page/referrer + `describeUrlPolicy`.
- `src/layouts/BaseLayout.astro` — مرآة السياسة في snippet GA4 + `page_referrer` صريح.
- `src/middleware.ts` — hash الـCSP المطابق.
- `tests/observability.test.mjs` — 3 اختبارات جديدة/محدّثة.
- `scripts/preview-observability-payload.mjs` — حالات سلبية إضافية + عقد GA4.
- `docs/MONITORING-AND-ANALYTICS-WIRING.md` — عقد URL المصحّح + §2.2 توصية الاعتماد + المصفوفة.
- `Audit/observability-privacy-2026-11-11/payload-preview.json` — معاينة الحمولة.

## 3. الأدلة المنفذة

### اختبارات (محلي، بلا شبكة عبر `tests/helpers/no-egress.mjs`)

```bash
node --import ./tests/helpers/no-egress.mjs --test tests/observability.test.mjs
node --import ./tests/helpers/no-egress.mjs scripts/preview-observability-payload.mjs \
  --out Audit/observability-privacy-2026-11-11/payload-preview.json
```

- `tests: 18 PASS / 0 FAIL / 0 SKIP` (كان 16/16 قبل التغيير).
- المعاينة: `6/6` Sentry، `6/6` PostHog، `10` حالات سلبية (5 `null`، 5 منقّحة/عامة بالتصميم).
- حالات الإثبات: `page_referrer: ''` عند مُحيل مرفوض، `/auth/callback/<code>` ⇒ `/auth/`، `/app/kernel/<uuid>` ⇒ `/app/`، `/docs/%2e%2e%2f…` ⇒ `/`، تطابق hash CSP.
- اختبار الانحدار ذو القيمة: اختبار تطابق hash الـCSP **يفشل** على المصدر السابق (الهاش المخزّن لم يكن مطابقًا) وينجح الآن.

### NOT RUN (لا يُعدّ PASS)

- canary/ingestion إلى Sentry/PostHog، فحص Network لحمولة حقيقية.
- تغيير إعدادات مشروع PostHog (`anonymize_ips`, console/perf, retention) — إعداد حساب خارجي.
- إنشاء مشروع Sentry أو DSN.
- إرسال تنبيه/تمرين alert acknowledgment.
- build كامل وE2E: لم يُشغّل (التغيير snippet + وحدة، والتحقق الأقرب هو تنفيذ الـsnippet فعليًا في `vm` + اختبارات المحولات).

## 4. المانع الحالي وصاحبه

| المانع | المطلوب | صاحب القرار |
|---|---|---|
| لا وجهة أخطاء (Sentry صفر مشاريع) | إنشاء مشروع staging داخل المنظمة `659ec3bf0cec` ثم DSN في Secret | المالك / Platform |
| مشروع PostHog `720936` على حد الخطة بإعدادات غير معتمدة | اعتماد إعادة الاستخدام مع `environment` + ضبط `anonymize_ips=true` وتعطيل console/perf/replay/autocapture + retention | المالك / Privacy |
| لا قناة تنبيه ولا on-call | تعيين وجهة، Incident commander، rollback owner (قرارات 96/97) | العمليات / الأمن |
| canary | تفويض إرسال حدث واحد لكل طبقة من staging بـSHA كامل | المالك |

`ingested_event=false` في E09 يوصف كـ**حالة إعداد تاريخية**، ولا يُفسَّر كقياس شامل لتاريخ الأحداث.

## 5. التراجع

- تعطيل الإرسال للطبقة المتأثرة وحدها عبر `AIGAS_SENTRY_KILL_SWITCH` / `AIGAS_POSTHOG_KILL_SWITCH` مع بقاء المراقبة المحلية (`/healthz/`, logs) فعّالة.
- إرجاع `page_referrer` إلى السلوك السابق غير مستحسن لأنه يعيد الثغرة؛ التراجع الوحيد الآمن هو إيقاف وسم GA4 أو إبقاء الحقل الفارغ.
- لا حذف أحداث عن بُعد دون تفويض.

## 6. قرارات منفصلة

- **Internal:** تحسّن خصوصية محلي مثبت باختبارات؛ لا تغيير في جاهزية المنتج الداخلية (`NOT READY` لم يتغير).
- **Public:** لا ادعاء علني جديد؛ سياسة URL ما زالت مسودة بلا وثيقة P21 معتمدة، وGA4 غير مثبت شبكيًا.
- **Commercial:** لا أثر؛ لا وجهة معتمدة ولا تنبيهات حيّة، و`PASS ≠ RELEASED`.
