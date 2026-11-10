# المراقبة والتحليلات — ربط محلي اختياري

> مراجعة 2026-11-10؛ أساس HEAD `00d6de9197836179ecebcca46a2c731cc961a260` (`main`) مع تعديلات محلية غير ملتزمة. ليست نسخة منشورة أو artifact معتمدًا.
> `SOURCE_PRESENT=YES`؛ `SCHEMA_PRESENT=N/A` للربط؛ `CONFIGURED=NOT_VERIFIED`؛ `RUNTIME_VERIFIED=NO`؛ `APPROVED=NO`.
> لم يُشغّل test/build/lint/typecheck/Playwright أو خادم، ولم يُرسل حدث. اتصال MCP لا يعني تفعيل SDK. G8=`BLOCKED`، G9=`NOT_VERIFIED`، القرار `NO-GO`.

## 1. الواقع والحدود

- `package-lock.json`: Astro **6.4.8**، adapter Node **10.1.4**؛ `astro.config.mjs`: Node standalone. عقد Node `22.x`؛ لا ادعاء إصدار runtime منشور.
- لا حزم `@sentry/*` أو `posthog-js/node` في manifest. حافظنا على محولات `fetch` الموجودة، بلا تثبيت SDK أو تعديل lockfile.
- [جرد MCP المؤرخ](beta/MONITORING-READONLY-STATUS-2026-11-10.md): Sentry بلا مشاريع؛ PostHog متصل لكن إضافة مشروع تتجاوز حد الخطة الحالي. لا مشروع معتمد لأي طبقة، ولا أسرار مقروءة أو محملة.
- لم يُختر Organization/project للإرسال، ولم تُعدّل Render/Neon/Secrets/MCP أو إعدادات مشروع خارجي.
- الهيدر والهيرو وConstellation والشعار وأقسام الموقع العام محفوظة. الربط الجديد للمتصفح في AppLayout وصفحة Auth الديناميكية فقط؛ لا تغطية لأخطاء JavaScript في صفحات التسويق.

## 2. بوابات التشغيل — التعطيل افتراضيًا

| المتغير | شرط السماح |
|---|---|
| `AIGAS_MONITORING_APPROVAL_REF` | مرجع قرار تشغيل عام، لا يغني عن قرار كل طبقة |
| `AIGAS_MONITORING_ENVIRONMENT` | Sentry: staging/beta/production؛ PostHog: staging/beta فقط |
| `AIGAS_MONITORING_RELEASE` | SHA كامل من 40 خانة hex؛ إلزامي؛ يطابق artifact الذي سيعتمده المالك |
| `AIGAS_SENTRY_ENABLED` | `true` حرفيًا |
| `AIGAS_SENTRY_APPROVAL_REF` | قرار أمن/خصوصية خاص بتتبع الأخطاء |
| `AIGAS_SENTRY_DSN` | HTTPS، مشروع رقمي، بلا password/port/query/fragment |
| `AIGAS_SENTRY_APPROVED_ORIGIN` | أصل ingestion معتمد يطابق أصل DSN حرفيًا |
| `AIGAS_SENTRY_BROWSER_ENABLED` | `true` لتفعيل إشارات الواجهة، بالإضافة إلى جميع بوابات Sentry |
| `AIGAS_SENTRY_KILL_SWITCH` | `true` يمنع الإرسال ولو اكتملت سائر الإعدادات |
| `AIGAS_POSTHOG_ENABLED` | `true` حرفيًا |
| `AIGAS_ANALYTICS_APPROVAL_REF` | قرار تحليلات مستقل؛ اعتماد Sentry وحده لا يكفي |
| `AIGAS_POSTHOG_API_KEY` | مفتاح مشروع معتمد `phc_…`؛ خادمي فقط |
| `AIGAS_POSTHOG_HOST` | أصل HTTPS معتمد فقط؛ بلا path/port/credentials/query؛ لا قيمة افتراضية |
| `AIGAS_POSTHOG_KILL_SWITCH` | `true` يمنع الإرسال مستقلًا عن Sentry |

القيم الفعلية تُضبط لاحقًا بواسطة المشغّل في Secret/Config المعتمد، ولا تضاف إلى `.env*` أو `render.yaml` في هذه الدفعة. مرجع ذو صيغة صالحة ليس إثبات توقيع؛ التحقق من قرار صاحب السلطة إلزام تشغيلي. لا تعتمد أي بوابة قياس على `AIGAS_APP_ENABLED`.

الإيقاف: ضبط kill switch المعني ثم إعادة تشغيل الخدمة بالطريقة المعتمدة. يعاد فحص البوابات عند كل إرسال؛ تبويب قديم لا يستطيع تجاوز إيقاف الخادم. لا ادعاء أن تغيير متغير في Render يغيّر بيئة process قائم فورًا؛ لا يمكن سحب حدث أُرسل أو طلب قيد التنفيذ.

## 3. عقد البيانات — تنقيح قبل الإرسال

### Sentry: أخطاء فقط

`src/server/observability/sentry.mjs` يبني Envelope محددًا من الصفر؛ لا نسخ لحدث SDK أو Error. `sendDefaultPii` وrequest body capture وreplay وdefault integrations **غير مفعلة وغير مستعملة لعدم وجود SDK**؛ لا نعتمد على defaults.

- المسموح: event UUID عشوائي، timestamp، release SHA، environment محدد، level، platform، logger ثابت، route label ثابت، fingerprint، tags من قوائم محدودة.
- الاستثناء يحوي رمزًا ثابتًا فقط: Auth، Invitation category، RLS deny category، schema category، Ledger mismatch، provider timeout أو `UNEXPECTED_FAILURE` للـ5xx الآخر.
- لا تُقرأ `error.message` أو `error.stack`؛ حتى أسماء الملفات/functions قد تتضمن أسرارًا، لذلك **لا stacktrace يرسل**. أكواد غير معروفة لا تُمرر حتى لو كانت uppercase.
- لا `request`, `user`, `extra`, breadcrumbs، headers/cookies/auth tokens، email/IP، DSN/DB errors، SQL، prompt، chat text، provider keys أو مخرجات نموذج. DSN public key يستعمل فقط لمصادقة النقل إلى وجهة معتمدة، لا كحقل حدث.
- خادميًا: handlers للمنتجات الخمسة وKernel، Ledger integrity signal، وfallback لأخطاء صفحات البوابة وHealth في middleware. 503 المتوقع عند إغلاق البوابة مستبعد.
- واجهة App/Auth: `CLIENT_ERROR`, `CLIENT_REJECTION`, `CLIENT_AUTH_FAILURE` فقط، دون السبب الخام أو filename/URL/DOM. لا تغطية للأخطاء السابقة لتحميل observer.
- إشارات المتصفح غير مصادق عليها؛ ليست إثبات RLS breach أو حادث حقيقي، ولا تحل محل إشارات الخادم.

### PostHog: أحداث استخدام صريحة فقط

| الحدث | الحقول المسموحة | نقطة الوصل |
|---|---|---|
| `portal_viewed` | section من قائمة ثابتة | AppLayout عند GET |
| `product_opened` | product slug من قائمة ثابتة | AppLayout عند GET |
| `login_flow_result` | status_code فقط | sign-up/sign-in، Kernel وSecure Chat عبر wrapper |
| `policy_action_result` | action_category + status_code | عمليات Human Gate المحددة، نجاحًا ورفضًا |
| `quota_exhausted` | product فقط | حصة Secure Chat |

- لا auto-capture أو form capture أو heatmaps أو recordings/replay أو web vitals أو cross-domain أو identify/alias أو person linking. لا SDK عميل خارجي.
- كل حدث `distinct_id` عشوائي مستقل، `$process_person_profile=false` و`$geoip_disable=true`؛ لا tenant/user ID ولا metadata حساسة. لا نقل query/referrer/session.
- اسم الحدث يجب أن يكون own property في القائمة؛ مفاتيح زائدة أو قيم خارج القائمة ترفض الحدث. `login_flow_result` لا يحمل section أو success/email/message، فقط الحالة الرقمية.
- status 200 يصف نتيجة نداء Auth فقط، لا نجاح عضوية/session؛ تحدي MFA يصنف 409، والفشل بلا status رقمي 400، والاستثناء 503. لا يقيس wrapper رحلة جلسة مكتملة.
- page views الخادمية قد تشمل bots/prefetch/صفحة دخول بلا جلسة؛ لا تعتبر مستخدمين فريدين أو دليل تفاعل بشري.

### نقطة استقبال الواجهة

`POST /api/observability/` تعمل خارج portal gate حتى تخدم Auth، لكنها تفحص موافقات القياس وkill switches بنفسها. المتصفح يرسل JSON صغيرًا من ثوابت + رقم إلى نفس الأصل، `credentials=omit` و`referrerPolicy=no-referrer`؛ لا مفاتيح تظهر في DOM.

الاستقبال: Origin مطابق + Sec-Fetch-Site same-origin، JSON فقط، حد 256 byte، مهلة قراءة ثانية، وحد 30 طلبًا/دقيقة **لكل process** بلا تخزين IP/هوية. المتصفح محدود بعشر إشارات لكل تحميل صفحة. لا إعادة محاولة؛ حد العملية ليس WAF موزعًا وقد يسقط إشارات تحت الضغط. الحقول الزائدة تُرفض ولا تسجل.

نقل المزود يرفض redirects ويتوقف بعد ثانيتين. HTTP غير 2xx يعيد false؛ نجاح النقل لا يثبت التخزين أو التسليم النهائي. لا تتغير استجابة المنتج بسبب رفض collector. IP الخادم يبقى ظاهرًا لمزود القياس على مستوى الشبكة؛ احتفاظه وإعدادات المشروع تحتاج اعتمادًا، ولا ندّعي غياب PII لدى CDN/Render أو تسجيلاتهما.

## 4. العمليات والحوادث — مسودة غير مفعّلة

[إعدادات الخطة](beta/MONITORING-OPERATIONS-PLAN.yaml) تربط فئات التنبيه بأدوار دون إنشاء قنوات أو اختراع أسماء أو أزمنة SLA. مرجع السلطة: [Runbook §5/§10](PRE-BETA-SECURITY-AND-OPERATIONS-RUNBOOK.md).

- 5xx متكرر → Platform/Operations؛ Auth/Invite → Security/Platform؛ RLS denial → Security؛ Ledger mismatch → Security/Compliance؛ Provider timeout → Product/Operations.
- `/` فحص CDN/Render عام؛ `/app/api/kernel/health` فحص Kernel مستقل؛ `/app/` لبوابة 503 المتوقعة. success في `/` لا يغلق G3 أو G8.
- لا قياس latency/tracing في هذا المحول؛ p95 من فحص المشغّل فقط بعد الاعتماد. لا اعتبار عدد Sentry events إجمالي أخطاء HTTP، لأن النقل best effort والإشارات محدودة.
- Incident commander، on-call، جهات البريد وفق القرارين 96/97، توقيت التصعيد وrollback authority: غير معيّنة، لا تنبيه Live.
- عند حادث: إثبات environment/release أولًا، حفظ رموز ووقت فقط، احتواء بإذن صاحب السلطة، تصعيد للأمن/القانوني، إخطار عبر قناة معتمدة، ثم RCA/CAPA. لا إرسال بيانات عميل أو تدريب عليها.

## 5. خطة Staging القابلة للتنفيذ — NOT RUN

هذه الخطة تحتاج تفويضًا جديدًا؛ لا تشغيل ضمن هذه الدفعة. كل بياناتها اصطناعية، لا نسخ production. يسجل المشغّل SHA النهائي وpatch/artifact manifest وUTC والمضيف والنسخ والنتيجة والتوقيعات تحت `audit/observability/<final-sha>/` بلا أسرار.

1. **O1 أساس مغلق:** في checkout معتمد ونظيف يطابق artifact، سجّل `git rev-parse HEAD` و`git status --short`؛ ابنِ بـ`npm ci` ثم `npm run build`، وشغّل بـ`npm start` على staging فقط بعد إذن المالك. لا يوجد script test/lint/typecheck في manifest الحالي؛ لا تخترع أوامرها.
2. **O2 بلا شبكة:** اعترض `globalThis.fetch` قبل dynamic import للمحولات في process معزول، وامنع الشبكة على مستوى sandbox أيضًا. امسح أعلام القياس ثم استدع capture: متوقع false وصفر طلبات. فعّل كل الإعدادات الاصطناعية اللازمة، مع release كامل ومرجعي موافقة منفصلين وأصل DSN متطابق؛ لا تستخدم أسرار البيئة الحقيقية.
3. **O3 مصفوفة الرفض:** لكل طبقة احذف approval/env/release/credential بالتتابع؛ جرّب مرجع Sentry وحده مع analytics flag، وPostHog في production، وDSN بكلمة مرور أو query، وhost بمسار، وkill switch مع flag مفعّل. متوقع صفر خروج في كل حالة. اختبر كل kill switch بينما الأخرى تعمل، وكرر مع app flag=true/false.
4. **O4 الحمولة:** على fetch مزيف، مرر خطأ اصطناعيًا يحوي email/SQL/DSN/chat/key markers في message/stack/context. افحص Envelope وJSON حرفيًا: غياب markers والهوية والطلب والـstack. تحقق أن رمزًا مجهولًا وsurface/dependency/operation غير معروفة لا تسرب. جرّب event name=`__proto__`/`constructor` وخصائص غير مسموحة؛ متوقع الرفض. لكل حدث صحيح افحص القائمة والـUUID الجديد وأعلام منع profiles/GeoIP.
5. **O5 فشل collector:** اجعل fetch المزيف يعيد 400/429/500 ويرمي network error/timeout. متوقع false بلا رمي أو retry أو قراءة/تسجيل body، واستجابة المنتج محفوظة. نجاح 2xx يقبل النقل فقط.
6. **O6 استقبال/متصفح:** بعد البناء المعتمد، افتح App/Auth على staging بمتصفح؛ مع التعطيل لا نداء telemetry أو vendor. بعد اعتماد browser gate ولّد JS error/rejection اصطناعيين؛ افحص الطلب same-origin بلا Cookie/Authorization/Referer. اختبر Origin خاطئ (403)، نوع خاطئ (415)، body>256 (413)، JSON/حقول/section/status خاطئة (400)، وإفراط 31 طلبًا (429). تأكد من بلا خروج vendor في الرفض؛ اختبر قراءة بطيئة والذاكرة المحدودة. غيّر kill switches وأعد تشغيل الخادم، ثم استخدم تبويبًا قديمًا: لا خروج خارجي.
7. **O7 مسارات الاستخدام:** بجلسات اصطناعية، AppLayout يرسل portal/product فقط؛ Auth نداء ناجح/مرفوض/MFA/استثناء يرسل status فقط دون تغيير النتيجة الأصلية؛ Human Gate success/failure يرسل category/status؛ quota يرسل product فقط. لا أحداث marketing أو replay أو form/console/network capture. افحص أحداث الخادم Auth/Invite/RLS/Ledger/provider timeout ببدائل محلية دون إرسال AI خارجي.
8. **O8 إرسال مخوّل وتوجيه:** لا ينفذ إلا بعد تعيين مشروعات معتمدة وأسرار خادمية وسياسة retention ومراجعة payload. أرسل حدثًا اصطناعيًا محددًا لكل طبقة، وأثبت وجوده في المشروع الصحيح وrelease الصحيح وعدم profile/PII، ثم اختبر الإيقاف لكل طبقة. فحص `/` منفصل عن Health JSON و503 البوابة؛ اعتمد قواعد التنبيه والوجهات أولًا، ثم نفذ تمرين alert acknowledgment/escalation/rollback بتفويض منفصل. سجّل مستقلًا نتيجة النقل والوصول والتنبيه وتوقيع المشغّل.

**مصفوفة التنفيذ:** O1–O8 كلها `NOT RUN`. لا يغلق G8 إلا دليل استقبال وتنبيه وإيقاف فعلي وتوقيع العمليات/الأمن؛ G9 يبقى `NOT_VERIFIED` حتى توقيع صاحب السلطة. لا تعديل للختم اليدوي أو نسبة GO.

### أمر معزول جاهز لـO2–O5 — لم يُشغّل

ينفذه المشغّل فقط بعد التفويض ومن جذر checkout المعتمد، داخل sandbox يمنع الشبكة. `fetch` مستبدل قبل الاستيراد؛ كل القيم اصطناعية، ولا تُقرأ ملفات أسرار. هذه فحوص محولات فقط؛ لا تستبدل O6–O8 أو تثبت SDK/تنبيه Live.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
for (const key of Object.keys(process.env)) {
  if (/^AIGAS_(MONITORING|SENTRY|POSTHOG|ANALYTICS)_/.test(key)) delete process.env[key];
}
const calls = [];
globalThis.fetch = async (url, init) => {
  assert.equal(new URL(url).hostname, 'collector.invalid');
  calls.push(JSON.parse(init.body.split('\n').at(-1)));
  return new Response(null, { status: 200 });
};
const { captureServerFailure } = await import('./src/server/observability/sentry.mjs');
const { captureProductEvent, buildProductEvent } = await import('./src/server/observability/posthog.mjs');
const failure = () => captureServerFailure(new Error('SYNTHETIC_SECRET_MARKER'), {
  code: 'KERNEL_DB_PRIVILEGE', status: 503, surface: 'kernel',
  pathname: '/app/api/kernel/?secret=SYNTHETIC_SECRET_MARKER',
  dependency: 'SYNTHETIC_SECRET_MARKER', operation: 'SYNTHETIC_SECRET_MARKER',
});
const usage = () => captureProductEvent('login_flow_result', { status_code: 200 });
assert.equal(await failure(), false);
assert.equal(await usage(), false);
assert.equal(calls.length, 0);
Object.assign(process.env, {
  AIGAS_MONITORING_APPROVAL_REF: 'SYNTHETIC-OPS',
  AIGAS_MONITORING_ENVIRONMENT: 'staging',
  AIGAS_MONITORING_RELEASE: '0'.repeat(40),
  AIGAS_SENTRY_ENABLED: 'true',
  AIGAS_SENTRY_APPROVAL_REF: 'SYNTHETIC-ERRORS',
  AIGAS_SENTRY_DSN: `https://${'a'.repeat(32)}@collector.invalid/1`,
  AIGAS_SENTRY_APPROVED_ORIGIN: 'https://collector.invalid',
  AIGAS_POSTHOG_ENABLED: 'true',
  AIGAS_POSTHOG_API_KEY: `phc_${'b'.repeat(32)}`,
  AIGAS_POSTHOG_HOST: 'https://collector.invalid',
});
// An error-tracking approval never authorizes analytics.
assert.equal(await usage(), false);
process.env.AIGAS_ANALYTICS_APPROVAL_REF = 'SYNTHETIC-ANALYTICS';
assert.equal(await failure(), true);
assert.equal(await usage(), true);
assert.equal(calls[0].exception.values[0].value, 'RLS_DENIED');
assert.equal(calls[0].exception.values[0].stacktrace, undefined);
assert.equal(JSON.stringify(calls).includes('SYNTHETIC_SECRET_MARKER'), false);
for (const key of ['request', 'user', 'extra', 'breadcrumbs', 'message']) assert.equal(calls[0][key], undefined);
assert.equal(calls[1].properties.$process_person_profile, false);
assert.equal(calls[1].properties.$geoip_disable, true);
assert.equal(buildProductEvent('__proto__', {}), null);
assert.equal(buildProductEvent('constructor', {}), null);
assert.equal(buildProductEvent('login_flow_result', { status_code: 200, user_id: 'synthetic' }), null);
process.env.AIGAS_MONITORING_ENVIRONMENT = 'production';
assert.equal(await usage(), false);
process.env.AIGAS_MONITORING_ENVIRONMENT = 'staging';
process.env.AIGAS_SENTRY_KILL_SWITCH = 'true';
assert.equal(await failure(), false);
assert.equal(await usage(), true);
process.env.AIGAS_SENTRY_KILL_SWITCH = 'false';
process.env.AIGAS_POSTHOG_KILL_SWITCH = 'true';
assert.equal(await usage(), false);
assert.equal(await failure(), true);
process.env.AIGAS_POSTHOG_KILL_SWITCH = 'false';
globalThis.fetch = async () => new Response(null, { status: 503 });
assert.equal(await failure(), false);
assert.equal(await usage(), false);
globalThis.fetch = async () => { throw new Error('SYNTHETIC_NETWORK_FAILURE'); };
assert.equal(await failure(), false);
assert.equal(await usage(), false);
console.log('Adapter checks PASS — mocked transport only');
NODE
```

## 6. مصفوفة الحالة النهائية

| النطاق | SOURCE_PRESENT | SCHEMA_PRESENT | CONFIGURED | RUNTIME_VERIFIED | APPROVED |
|---|---|---|---|---|---|
| Sentry server + browser relay | YES | N/A | NOT_VERIFIED | NO | NO |
| PostHog explicit events + login result | YES | N/A | NOT_VERIFIED | NO | NO |
| Alert/on-call plan | YES (مسودة) | N/A | NO | NO | NO |
| مشروعات/retention وقنوات خارجية | N/A | N/A | NOT_VERIFIED | NO | NO |

مراجع البيانات: [PostHog capture API](https://posthog.com/docs/api/capture#single-event)، [الأحداث المجهولة](https://posthog.com/docs/product-analytics/capture-events#advanced-anonymous-vs-identified-events)، [Sentry data collection](https://docs.sentry.io/platforms/javascript/guides/connect/configuration/options). راجعت الوثائق عبر MCP؛ لا SDK مثبت أو مفعل من ذلك.
