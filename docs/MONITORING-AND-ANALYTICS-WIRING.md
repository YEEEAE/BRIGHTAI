> **الحالة الأحدث T06 — 2026-11-11:** أزيل تحميل GA4 الخارجي غير المشروط؛ dataLayer محلية فقط ولا تُرسل. لا تعيد loader قبل اعتماد موافقة مستقلة وعقد URL (UTM والمسارات العامة ما زالت حرة محليًا). اختبارات19/19 وشبكةBrowser بلاطلباتقياس PASS؛ canary/eventID والتنبيه NOT RUN. Sentry fresh صفرمشاريع؛ PostHog720936 metadata بلا تغيير: IPغيرمجهول/console+perfمفعلان/replayمغلق؛ recording retention30d ليست event retention. أرقام التشغيل السابقة أدناه تاريخية؛ [دليل T06](../Audit/t06-observability-2026-11-11/REPORT.md) يحدد الحدود والمالكين.

# المراقبة والتحليلات — ربط محلي اختياري

> **تصحيح P13:** سياسة URL أدناه مسودة غير معتمدة وغير كافية لإثبات الخصوصية: مسارات وقيم UTM حرة قد تحمل بيانات حساسة، ولا يثبت حذف `page_referrer` منع إرسال GA4 للقيمة الافتراضية. لم يُختبر SDK أو الشبكة بمتصفح؛ لا تعتمد ادعاءات منع URL/referrer أدناه إلى حين P21 واختبار النقل الفعلي.
>
> **تحديث 2026-11-11 (خصوصية URL):** أُغلق ثغرة الرجوع الضمني: كان حقل `page_referrer` يُحذف عند رفض المُحيل، فيعود `gtag` إلى `document.referrer` الخام — أي القيمة نفسها التي تمنعها السياسة. الآن يُرسل الحقل دائمًا: أصل+مسار مسموح أو سلسلة فارغة صريحة. كما تُطوى المسارات الخاصة (`/auth/*`, `/app/*`, `/api/*`) إلى جذر القسم قبل الإرسال، لأن رمز callback أو معرف سجل قد يكون في مقطع مسار لا في query. صُحح hash الـCSP القديم للـsnippet وأُضيف اختبار يمنع انحرافه. الحمولة/الوجهة/الاستقبال لم تُختبر شبكيًا بعد.

> تحديث 2026-11-10 (P13)؛ أساس HEAD `c5ef5547143c4acb35b568a350e9ae4aa019a184` (`main`، شجرة عمل معدّلة محليًا). المرجع التاريخي `00d6de9` لم يعد أساس القراءة.
> `SOURCE_PRESENT=YES`؛ `SCHEMA_PRESENT=N/A` للربط؛ `CONFIGURED=NOT_VERIFIED` (لا وجهة معتمدة، لا أسرار)؛ `RUNTIME_VERIFIED=NO` (لا إرسال خارجي)؛ `ADAPTER_VERIFIED=LOCAL PASS`؛ `APPROVED=NO`.
> نُفّذ محليًا بلا شبكة خارجية: 15/15 اختبار عقد، build، 55 مسارًا عامًا، واستقبال `POST /api/observability/` بالحالات السلبية. لم يُرسل حدث خارجي. G8=`BLOCKED`، G9=`NOT_VERIFIED`، القرار `NO-GO`.

## 0. حصيلة P13 — ما هو مثبت وما هو غير مثبت

| البند | الحالة | الدليل |
|---|---|---|
| بوابات الطبقتين وكيل الإيقاف | LOCAL PASS | `tests/observability.test.mjs` (15/15) |
| منع URL/query/fragment/referrer غير المعتمد | LOCAL PASS — قائمة سماح واحدة + طي المسارات الخاصة + `page_referrer` فارغ صريح | `src/server/observability/url-policy.mjs` + `tests/observability.test.mjs` (18/18) |
| الحمولة: لا chat/body/token/SQL/docs ولا stack أو replay | LOCAL PASS | معاينة `Audit/p13-observability-2026-11-10/payload-preview.json` |
| استقبال الواجهة والرفض | LOCAL PASS | 403/415/413/400/429 على `127.0.0.1` |
| الوجهة والاعتماد والتكلفة | BLOCKED | لا مشروع Sentry، ومشروع PostHog الوحيد بلغ حد الخطة |
| الوصول الفعلي (ingestion) وrelease/environment | NOT RUN | يحتاج تفويضًا بعد مراجعة الحمولة |

## 1. الواقع والحدود

- `package-lock.json`: Astro **6.4.8**، adapter Node **10.1.4**؛ `astro.config.mjs`: Node standalone. عقد Node `22.x`؛ لا ادعاء إصدار runtime منشور.
- لا حزم `@sentry/*` أو `posthog-js/node` في manifest. حافظنا على محولات `fetch` الموجودة، بلا تثبيت SDK أو تعديل lockfile.
- جرد القراءة الحالي (MCP، 2026-11-10): Sentry منظمة واحدة `659ec3bf0cec` في `us.sentry.io` و**صفر مشاريع** ⇒ لا DSN موجود. PostHog منظمة واحدة ومشروع واحد `720936` (Default project)، وحد الخطة `organizations_projects=1`؛ الخطة `free`، أحداث الشهر `0/1,000,000`. لا وجهة معتمدة لأي طبقة، ولا تُختار نيابة عن المالك.
- إعدادات مشروع PostHog الحالي لا تصلح للإرسال كما هي: `anonymize_ips=false`، `capture_console_log_opt_in=true`، `capture_performance_opt_in=true`، الاحتفاظ الافتراضي 12 شهرًا. `session_recording_opt_in=false` حاليًا، لكن هذا إعداد مشروع لا يمنع autocapture من SDK آخر. أي تغيير إعداد يحتاج تفويضًا مستقلًا بعد اعتماد الحمولة.
- تقسيم GA4: وسم `G-9LMB4PGTWJ` العام في `BaseLayout` **مستقل تمامًا** عن بوابات PostHog؛ لا يقرأ أي `AIGAS_*` ولا يتوقف معها. P13 لا يفعّله ولا يعطله، ويقيّد فقط ما يرسله من URL/referrer عبر قائمة السماح المشتركة.
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

### 2.1 قرار الوجهة والتكلفة — غير محسوم

| السؤال | الواقع | القرار المطلوب من المالك |
|---|---|---|
| Sentry destination | صفر مشاريع؛ لا DSN | إنشاء مشروع staging/beta (أو ربط مشروع قائم) قبل توليد DSN |
| PostHog destination | مشروع واحد `720936` وحد الخطة 1 | إعادة استخدام Default project مع خلط بيئات، أو ترقية مدفوعة لمشروع مستقل |
| PostHog settings | IP غير مجهول، console/performance مفعّلان، retention 12 شهرًا | اعتماد القيم المستهدفة قبل أول إرسال |
| الحجم المتوقع | أحداث صريحة فقط (page/product/login/policy/quota) | تقدير Beta منخفض؛ لا حجز مدفوع تلقائي |

لا تُرقّى أي خطة تلقائيًا، ولا يُنشأ مشروع أو مفتاح أو إعداد قبل تفويض هذه العملية نفسها. حدّ الخطة الحالي يجعل «مشروع PostHog staging مستقل» ترقيةً مدفوعة، لا خطوة مجانية.

### 2.2 توصية محلية للاعتماد — بلا ترقية مدفوعة (غير معتمدة)

هذه توصية تنفيذية، ليست قرارًا: كل بند يحتاج توقيع صاحب السلطة قبل أي إرسال.

| البند | التوصية | حالة الاعتماد |
|---|---|---|
| وجهة الأخطاء | إنشاء مشروع Sentry واحد `brightai-staging` داخل المنظمة `659ec3bf0cec` (الخطة المجانية تتسع لمشروع)، ثم DSN عبر Secret | `NOT APPROVED` — إنشاء مشروع خارجي يحتاج تفويضًا |
| وجهة التحليلات | إعادة استخدام المشروع `720936` مع `environment` ثابت لكل بيئة بدل مشروع ثانٍ (لا ترقية مدفوعة) | `NOT APPROVED` — خلط البيئات قرار مالك |
| إعدادات PostHog الإلزامية | `anonymize_ips=true`، `capture_console_log_opt_in=false`، `capture_performance_opt_in=false`، `session_recording_opt_in=false`، `autocapture_opt_out=true` | `NOT APPROVED` — تغيير إعداد حساب خارجي |
| الاحتفاظ | 30 يومًا للتحليلات و90 يومًا للأخطاء كسقف أدنى متوافق مع التحقيق، بلا أرشفة طويلة | `NOT APPROVED` |
| allowlist الأحداث | الخمسة الحالية فقط (`portal_viewed`, `login_flow_result`, `product_opened`, `policy_action_result`, `quota_exhausted`) | مطابق للمصدر؛ الاعتماد `NOT APPROVED` |
| قناة التنبيه | `#ops-alerts` + بريد on-call، مع Incident commander وrollback owner بالاسم | `NOT ASSIGNED` — يحتاج قرارات 96/97 |
| canary | حدث واحد لكل طبقة من بيئة staging مع SHA كامل، ثم إثبات `event_id`/`distinct_id` في المشروع الصحيح | `NOT RUN` — يحتاج تفويض إرسال |

فشل الوجهة: `send` يعيد `false` بعد 2 ثانية بلا retry أو throw، فلا تتغير استجابة المنتج. تعطيل الطبقة وحدها عبر kill switch المعني مع بقاء المراقبة المحلية (logs/healthz) فعّالة.

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

### عقد URL وreferrer — قائمة سماح واحدة

`src/server/observability/url-policy.mjs` هو التمثيل الوحيد المسموح لقناة ترسل عنوانًا. القاعدة: إمّا أصل ومسار مسموحان مع مفاتيح استعلام مسموحة، أو لا يُرسل الحقل. لا يوجد فرع «نحذف q/from ونمرّر الباقي».

| الحقل | المسموح | المرفوض |
|---|---|---|
| `page_location` | `origin + pathname` + `utm_source/medium/campaign/term/content` بقيمة `[A-Za-z0-9._~-]{1,64}`؛ المسارات الخاصة تُطوى إلى `/auth/` أو `/app/` أو `/api/` | أي مفتاح آخر، fragment، credentials، non-http(s)، مسار خاص مفصّل، مسار مُرمّز أو أطول من 200 محرف (يُستبدل بـ`/`) |
| `page_referrer` | نفس الأصل، أو `brightai.live`/`www.brightai.live`، ثم `origin + pathname` (بنفس قاعدة الطي) | أي مضيف آخر ⇒ سلسلة فارغة صريحة `""`؛ لا يُحذف الحقل أبدًا |
| Sentry/PostHog | لا حقل URL إطلاقًا؛ route label ثابت من `redact.mjs` | query، fragment، ID، بريد، token |

**سبب إلزام الحقل الفارغ:** حذف `page_referrer` لا يعني «بلا مُحيل» في GA4؛ بل يجعل gtag يستخدم `document.referrer` الخام بما فيه query. لذلك يُرسل `page_referrer: ''` عند الرفض. هذا عقد محلي مثبت باختبار على الـsnippet، وليس إثباتًا لسلوك شبكة GA4 — يبقى إثباته ضمن O8.

ملاك القرار: P21 (عقد خصوصية URL). لم يُنتج P21 وثيقة بعد؛ القائمة أعلاه هي الافتراضي المحلي، وتوسيعها قرار خصوصية لا تغيير كود. `BaseLayout` يطبّق نفس القائمة على وسم GA4 العام، و`tests/observability.test.mjs` يثبت السلوك (18/18 محليًا، منها اختبار تطابق hash الـCSP).

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

## 5. خطة Staging القابلة للتنفيذ — O1–O5 LOCAL، O6–O8 NOT RUN

هذه الخطة تحتاج تفويضًا جديدًا؛ لا تشغيل ضمن هذه الدفعة. كل بياناتها اصطناعية، لا نسخ production. يسجل المشغّل SHA النهائي وpatch/artifact manifest وUTC والمضيف والنسخ والنتيجة والتوقيعات تحت `audit/observability/<final-sha>/` بلا أسرار.

1. **O1 أساس مغلق:** في checkout معتمد ونظيف يطابق artifact، سجّل `git rev-parse HEAD` و`git status --short`؛ ابنِ بـ`npm ci` ثم `npm run build`، وشغّل بـ`npm start` على staging فقط بعد إذن المالك. لا يوجد script test/lint/typecheck في manifest الحالي؛ لا تخترع أوامرها.
2. **O2 بلا شبكة:** اعترض `globalThis.fetch` قبل dynamic import للمحولات في process معزول، وامنع الشبكة على مستوى sandbox أيضًا. امسح أعلام القياس ثم استدع capture: متوقع false وصفر طلبات. فعّل كل الإعدادات الاصطناعية اللازمة، مع release كامل ومرجعي موافقة منفصلين وأصل DSN متطابق؛ لا تستخدم أسرار البيئة الحقيقية.
3. **O3 مصفوفة الرفض:** لكل طبقة احذف approval/env/release/credential بالتتابع؛ جرّب مرجع Sentry وحده مع analytics flag، وPostHog في production، وDSN بكلمة مرور أو query، وhost بمسار، وkill switch مع flag مفعّل. متوقع صفر خروج في كل حالة. اختبر كل kill switch بينما الأخرى تعمل، وكرر مع app flag=true/false.
4. **O4 الحمولة:** على fetch مزيف، مرر خطأ اصطناعيًا يحوي email/SQL/DSN/chat/key markers في message/stack/context. افحص Envelope وJSON حرفيًا: غياب markers والهوية والطلب والـstack. تحقق أن رمزًا مجهولًا وsurface/dependency/operation غير معروفة لا تسرب. جرّب event name=`__proto__`/`constructor` وخصائص غير مسموحة؛ متوقع الرفض. لكل حدث صحيح افحص القائمة والـUUID الجديد وأعلام منع profiles/GeoIP.
5. **O5 فشل collector:** اجعل fetch المزيف يعيد 400/429/500 ويرمي network error/timeout. متوقع false بلا رمي أو retry أو قراءة/تسجيل body، واستجابة المنتج محفوظة. نجاح 2xx يقبل النقل فقط.
6. **O6 استقبال/متصفح:** بعد البناء المعتمد، افتح App/Auth على staging بمتصفح؛ مع التعطيل لا نداء telemetry أو vendor. بعد اعتماد browser gate ولّد JS error/rejection اصطناعيين؛ افحص الطلب same-origin بلا Cookie/Authorization/Referer. اختبر Origin خاطئ (403)، نوع خاطئ (415)، body>256 (413)، JSON/حقول/section/status خاطئة (400)، وإفراط 31 طلبًا (429). تأكد من بلا خروج vendor في الرفض؛ اختبر قراءة بطيئة والذاكرة المحدودة. غيّر kill switches وأعد تشغيل الخادم، ثم استخدم تبويبًا قديمًا: لا خروج خارجي.
7. **O7 مسارات الاستخدام:** بجلسات اصطناعية، AppLayout يرسل portal/product فقط؛ Auth نداء ناجح/مرفوض/MFA/استثناء يرسل status فقط دون تغيير النتيجة الأصلية؛ Human Gate success/failure يرسل category/status؛ quota يرسل product فقط. لا أحداث marketing أو replay أو form/console/network capture. افحص أحداث الخادم Auth/Invite/RLS/Ledger/provider timeout ببدائل محلية دون إرسال AI خارجي.
8. **O8 إرسال مخوّل وتوجيه:** لا ينفذ إلا بعد تعيين مشروعات معتمدة وأسرار خادمية وسياسة retention ومراجعة payload. أرسل حدثًا اصطناعيًا محددًا لكل طبقة، وأثبت وجوده في المشروع الصحيح وrelease الصحيح وعدم profile/PII، ثم اختبر الإيقاف لكل طبقة. فحص `/` منفصل عن Health JSON و503 البوابة؛ اعتمد قواعد التنبيه والوجهات أولًا، ثم نفذ تمرين alert acknowledgment/escalation/rollback بتفويض منفصل. سجّل مستقلًا نتيجة النقل والوصول والتنبيه وتوقيع المشغّل.

**مصفوفة التنفيذ (P13، 2026-11-10):** O1 `PASS LOCAL` (build + خادم loopback)؛ O2–O5 `PASS LOCAL` بلا شبكة عبر `tests/observability.test.mjs` و`scripts/preview-observability-payload.mjs`؛ O6 `PARTIAL` — استقبال `/api/observability/` على loopback PASS (403/415/413/400/429) وBrowser/JS error NOT RUN؛ O7–O8 `NOT RUN`. لا يغلق G8 إلا دليل استقبال وتنبيه وإيقاف فعلي وتوقيع العمليات/الأمن؛ G9 يبقى `NOT_VERIFIED` حتى توقيع صاحب السلطة. لا تعديل للختم اليدوي أو نسبة GO.

### أوامر O2–O5 المنفذة — بلا شبكة

```bash
node --import ./tests/helpers/no-egress.mjs --test tests/observability.test.mjs
node --import ./tests/helpers/no-egress.mjs scripts/preview-observability-payload.mjs
```

النتيجة: 15/15 PASS، وملف معاينة `Audit/p13-observability-2026-11-10/payload-preview.json` يحتوي 6/6 حمولات Sentry و6/6 أحداث PostHog و7 حالات سلبية موثقة. `fetch` مستبدل والبيئة اصطناعية، ولم يُقرأ أي ملف أسرار. هذه فحوص محولات فقط؛ لا تستبدل O6–O8 أو تثبت SDK/تنبيه Live.

**تحديث 2026-11-11:** `18/18 PASS` على نفس الأمر، ومعاينة جديدة `Audit/observability-privacy-2026-11-11/payload-preview.json` (6/6 Sentry، 6/6 PostHog، 10 حالات سلبية: 5 `null` و5 منقّحة/عامة بالتصميم). أُضيفت حالات طي المسار الخاص ومنع المسار المُرمّز، واختبار تطابق hash الـCSP. الشبكة والوجهة وcanary ما زالت `NOT RUN`.

## 6. مصفوفة الحالة النهائية

| النطاق | SOURCE_PRESENT | SCHEMA_PRESENT | CONFIGURED | LOCAL_ADAPTER | RUNTIME_VERIFIED | APPROVED |
|---|---|---|---|---|---|---|
| Sentry server + browser relay | YES | N/A | NOT_VERIFIED | PASS (18/18 tests) | NO | NO |
| PostHog explicit events + login result | YES | N/A | NOT_VERIFIED | PASS (18/18 tests) | NO | NO |
| URL/referrer allowlist | YES | N/A | NOT_VERIFIED (P21 بلا وثيقة) | PASS — طي المسارات الخاصة + `page_referrer` فارغ صريح + hash CSP | NOT VERIFIED خارجيًا | NO |
| Alert/on-call plan | YES (مسودة) | N/A | NO | N/A | NO | NO |
| canary/ingestion | N/A | N/A | NO | N/A | NO — يحتاج تفويض إرسال ووجهة | NO |
| مشروعات/retention وقنوات خارجية | N/A | N/A | NOT_VERIFIED | N/A | NO | NO |

`CONFIGURED` يبقى `NOT_VERIFIED` لأن كل الاختبارات استخدمت بيئة اصطناعية وقيمًا وهمية؛ لا مشروع أو DSN أو مفتاح حقيقي. `RUNTIME_VERIFIED=NO` يعني عدم وجود دليل ingestion، وليس صفر أحداث: الإرسال لم يُفعّل أصلًا، فلا يجوز استنتاج «لا أحداث» من تعطيل البوابة. إغلاق التنبيهات وack وrunbook مسؤولية P22.


مراجع البيانات: [PostHog capture API](https://posthog.com/docs/api/capture#single-event)، [الأحداث المجهولة](https://posthog.com/docs/product-analytics/capture-events#advanced-anonymous-vs-identified-events)، [Sentry data collection](https://docs.sentry.io/platforms/javascript/guides/connect/configuration/options). راجعت الوثائق عبر MCP؛ لا SDK مثبت أو مفعل من ذلك.
