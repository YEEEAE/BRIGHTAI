# P13 — تهيئة Sentry وPostHog وعقد الأحداث

> **تصحيح مهم:** مراجعة لاحقة وجدت أن سياسة URL المقترحة غير معتمدة من P21 وغير كافية للخصوصية: تسمح بقيم UTM ومسارات حرة قد تحتوي بيانات حساسة، وحذف `page_referrer` من إعداد GA4 لا يثبت منع القيم الافتراضية أو طلبات SDK. لم يُفحص النقل بمتصفح. لا تعتمد أي ادعاء أدناه بمنع تسرب URL/referrer أو اكتمال O2–O5؛ الاختبارات محلية بمداخل محدودة واعتراض `fetch` وليست عزل شبكة على مستوى النظام. التغييرات مسودة محلية وليست صالحة للتفعيل قبل P21 والتحقق المستقل.
>
> **إفصاح:** استدعاء `project-get` أعاد معرّف مشروع PostHog في نتيجة الأداة؛ لم يُنسخ إلى التقرير أو ملفات المشروع. لا يُعاد عرضه هنا.

> **الحالة:** `PARTIAL` — العقد والبوابات والـpayload مثبتة **محليًا**؛ الوجهة والاعتماد وingestion **BLOCKED** بانتظار قرار المالك.
> **التاريخ (UTC):** 2026-11-10T19:40Z تقريبًا. **البيئة:** macOS محلي معزول، Node `v22.22.2`، npm `10.9.7`.
> **SHA:** `c5ef5547143c4acb35b568a350e9ae4aa019a184` (`main`) + شجرة عمل معدّلة محليًا. المرجع `7b1f533f71c7b1f41884790366a4d5967c85a87b` سلف مباشر (12 commit قبله)، وليس HEAD.
> **لم يُنفّذ:** commit / push / deploy / إنشاء مشروع / تغيير إعداد / إرسال حدث خارجي / ترقية مدفوعة. `PASS ≠ RELEASED`.

## 1. الانحراف عن الحالة المرجعية

| البند | القيمة |
|---|---|
| `git rev-parse HEAD` | `c5ef5547143c4acb35b568a350e9ae4aa019a184` |
| `7b1f533` سلفًا لـHEAD | نعم |
| عدد الـcommits بعده | 12، كلها `update site` |
| شجرة العمل قبل P13 | نظيفة |
| `git status --short` بعد P13 | 4 معدّل + 4 جديد (أدناه) |

الملفات المرجعية `src/server/observability/*`، `MonitoringGate`، relay، `BaseLayout` موجودة على HEAD بنفس العقد العام؛ لم يُعتمد التقرير القديم كحقيقة حالية.

## 2. جرد المشاريع (MCP قراءة فقط، 2026-11-10)

| المزود | القراءة | النتيجة | الأثر |
|---|---|---|---|
| Sentry | `find_organizations`, `find_projects` | منظمة `659ec3bf0cec` في `https://us.sentry.io`؛ **صفر مشاريع**، `hasMore=false` | لا DSN موجود؛ إنشاء مشروع قرار مالك |
| PostHog | `organization-get`, `project-get`, `events-retention-get`, `billing-overview-get` | منظمة `01a1bd00-…`؛ مشروع واحد `720936` (Default project)؛ `organizations_projects=1`؛ خطة `free`؛ أحداث `0/1,000,000` | مشروع staging مستقل = ترقية مدفوعة، لا خطوة مجانية |
| PostHog settings | `project-get` | `anonymize_ips=false`، `capture_console_log_opt_in=true`، `capture_performance_opt_in=true`، `session_recording_opt_in=false`، retention افتراضي 12 شهرًا | لا يصلح للإرسال كما هو؛ تغيير الإعداد يحتاج تفويضًا |
| PostHog usage | `billing-usage-get` | لا سلسلة استخدام (صفر) | لا تكلفة حالية |

لم يُقرأ أي token أو DSN في التقرير. مفتاح المشروع الذي أعاده `project-get` لم يُنسخ إلى أي ملف أو مخرج.

## 3. النواقص الحقيقية

1. **لا وجهة معتمدة:** Sentry بلا مشروع، وPostHog على حد مشروع واحد. لا يجوز اختيار وجهة نيابة عن المالك.
2. **P21 غير منفّذ:** لا وثيقة عقد خصوصية URL. عقد P13 يستهلك افتراضيًا محليًا (`url-policy.mjs`) ويصرّح بأن P21 هو مالك القائمة.
3. **GA4 منفصل لكنه كان يمرّر query حرًا:** `BaseLayout` كان يحذف `q/from` فقط على `/docs|/knowledge`، ويترك أي مفتاح آخر وfragment وreferrer عشوائي. أُصلح محليًا بقائمة سماح (أدناه).
4. **إعدادات مشروع PostHog الحالي** تتعارض مع عقد «بلا IP/PII/console»؛ لم تُعدّل.
5. **التنبيهات/ack/runbook** ليست في نطاق P13؛ تبقى P22.
6. **`verify-routes.mjs` الكامل** يتوقف على مجلدات مكررة موجودة في `dist/client` (`* 2`، `* 3`، أثر مزامنة iCloud أثناء البناء) وليست من تغيير P13؛ استُبدل بفحص HTTP مباشر لـ55 مسارًا (PASS).

## 4. ما تغيّر (diff محدود)

| الملف | التغيير | السبب |
|---|---|---|
| `src/server/observability/url-policy.mjs` (جديد) | قائمة سماح واحدة لـ`page_location`/`page_referrer`: مفاتيح UTM فقط بقيمة مقيّدة، حذف fragment، حذف referrer لمضيف غير معتمد | استهلاك عقد P21 محليًا ومنع query الحر |
| `src/server/observability/redact.mjs` | `barePath()` يقصّ `?`/`#` قبل اختيار label في `safeRoute`/`productSlug`/`sectionFor` | يمنع أن يغيّر query أو fragment التصنيف، ويثبت أن label ثابت |
| `src/layouts/BaseLayout.astro` | استبدال `analyticsLocation` بمرشّح قائمة سماح مطابق؛ `page_location` لا يسقط أبدًا إلى `href` خام | GA4 العام يبقى منفصلًا عن بوابات PostHog لكنه لا يمرّر URL غير معتمد |
| `tests/observability.test.mjs` (جديد) | 15 اختبار عقد | إثبات البوابات والـkill switches والتنقيح والـURL |
| `scripts/preview-observability-payload.mjs` (جديد) | معاينة payload بلا شبكة وبلا أسرار | مادة مراجعة/موافقة قابلة للتكرار |
| `docs/MONITORING-AND-ANALYTICS-WIRING.md` | جرد اليوم، قرار التكلفة، عقد URL، مصفوفة O1–O8 | تحديث الوثيقة من «لم يُشغّل» إلى الحالة المقيسة |

لم يُضف SDK، ولا اعتمادية، ولا متغير بيئة، ولا سر، ولا تعديل على `.env*` أو `render.yaml`.

## 5. عقد الحمولة — ما يخرج بالضبط

المعاينة الكاملة: `Audit/p13-observability-2026-11-10/payload-preview.json`.

### Sentry (6 مسارات مطلوبة)

- `AUTH_UNAVAILABLE` / 503 → `surface=server`, `transaction=app.page`.
- `KERNEL_DB_PRIVILEGE` / 503 → `RLS_DENIED` (رمز ثابت)، `surface=kernel`.
- `PROVIDER_TIMEOUT` / 504 (AI) → `surface=secure-chat`.
- `LEDGER_VERIFICATION_MISMATCH` / 500 → `surface=ledger`, `transaction=app.api.ledger.verify`.
- منتج بلا رمز معروف / 503 → `UNEXPECTED_FAILURE`, `surface=risk-engine`.
- `CLIENT_AUTH_FAILURE` / 401 من المتصفح → `surface=browser`.

كل حدث: UUID جديد، `release` = SHA كامل، `environment=staging`، tags من قوائم محددة، `exception.value` رمز ثابت فقط. **لا** `stacktrace`، `request`، `user`، `extra`، breadcrumbs، رسالة خطأ، SQL، token، DSN، chat، أو نص مستخدم. مفتاح DSN العام يظهر فقط في ترويسة `X-Sentry-Auth` للنقل، وليس في الحدث.

### PostHog (5 أحداث فقط)

| الحدث | الخصائص | ملاحظة |
|---|---|---|
| `portal_viewed` | `section` | من AppLayout عند GET |
| `product_opened` | `product` | من AppLayout عند GET |
| `login_flow_result` | `status_code` | لا section/بريد/رسالة |
| `policy_action_result` | `action_category`, `status_code` | نجاح ورفض |
| `quota_exhausted` | `product` | Secure Chat |

كل حدث: `distinct_id` UUID جديد، `$process_person_profile=false`، `$geoip_disable=true`، `$lib=aigas-server`، `release`, `environment`. لا `$current_url`، `$referrer`، user/tenant/session، session replay، autocapture، heatmaps، form capture، ولا SDK عميل.

### عقد URL/referrer

- `page_location`: `origin + pathname` + `utm_source/medium/campaign/term/content` بقيمة `[A-Za-z0-9._~-]{1,64}`.
- `page_referrer`: نفس الأصل أو `brightai.live`/`www.brightai.live`، ثم `origin + pathname` فقط؛ أي مضيف آخر يُحذف الحقل.
- Sentry/PostHog: **صفر حقل URL**؛ route labels ثابتة.

## 6. الدليل — أوامر ونتائج

| الأمر | النتيجة |
|---|---|
| `node --import ./tests/helpers/no-egress.mjs --test tests/observability.test.mjs` | **15/15 PASS**، 0 fail |
| `node --import ./tests/helpers/no-egress.mjs --test --test-concurrency=1 tests/*.test.mjs` | **70 اختبارًا: 61 PASS، 0 FAIL، 9 SKIP** (DB بلا هدف) |
| `node --import ./tests/helpers/no-egress.mjs scripts/preview-observability-payload.mjs` | **6/6** Sentry، **6/6** PostHog، 7 حالات سلبية موثقة؛ لا `phc_` ولا مفتاح في الملف |
| `npm run build` | **PASS**؛ `55 public pages`؛ `version.json: c5ef5547143c` |
| فحص HTTP لـ55 مسارًا على `127.0.0.1:4387` | **55/55** status 200 + locale + canonical + robots + نداء analytics واحد |
| `POST /api/observability/` سلبيًا | 403 (Origin/Sec-Fetch)، 415 (type)، 413 (>256B)، 400 (حقل زائد/section public/kind/status)، 429 بعد 30/دقيقة |
| `git diff --stat` | 4 ملفات معدّلة: 114 إدراجًا/105 حذفًا؛ + 4 ملفات جديدة |

### بوابات الرفض والـkill switches المثبتة

- بلا `AIGAS_MONITORING_APPROVAL_REF` أو environment غير معتمد أو release ليس 40 hex ⇒ `enabled=false` ولا طلب.
- DSN: يرفض HTTP، password، port، query، fragment، مسار غير رقمي، مفتاح قصير، وأصلًا لا يطابق `AIGAS_SENTRY_APPROVED_ORIGIN`.
- PostHog: يرفض HTTP، path، port، credentials، مفتاحًا لا يبدأ `phc_`، و`production` (BETA_SCOPE_REQUIRED).
- `AIGAS_SENTRY_KILL_SWITCH=true` يوقف Sentry ويُبقي PostHog يعمل؛ والعكس صحيح. لا يقرأ أي منهما `AIGAS_APP_ENABLED`.
- فشل collector (500/throw) يعيد `false` بلا رمي أو retry؛ استجابة المنتج لا تتغير.

### حالات سلبية للحمولة

`buildProductEvent` يرفض: حدثًا غير مدرج، `__proto__`، `constructor`، `toString`، خاصية زائدة، `section` خارج القائمة، `product` غير معروف، `status_code` خارج 100–599. `safeCode` يحوّل الرموز المجهولة إلى `null` ⇒ `UNEXPECTED_FAILURE`، ولا يمرّر نصًا حرًا.

## 7. ما لم يُثبت

- **ingestion:** لم يُرسل أي حدث؛ لا وجود في مشروع Sentry/PostHog، ولا release/environment مقروء من اللوحة.
- **Browser:** لم يُشغّل Playwright/Chrome؛ توليد JS error/rejection وفحص same-origin بلا Cookie/Referer غير منفذ.
- **التنبيهات/ack/runbook:** P22.
- **P21:** لا وثيقة عقد؛ القائمة المحلية افتراضية وليست معتمدة.
- **`CONFIGURED`:** كل القيم المستخدمة اصطناعية؛ لا سر حقيقي ولا مشروع.

## 8. المطلوب للانتقال من PARTIAL إلى DONE

تفويض صريح لهذه العمليات بعينها، بعد مراجعة `payload-preview.json`:

1. اختيار وجهة Sentry (إنشاء مشروع staging/beta) وتوليد DSN.
2. قرار PostHog: إعادة استخدام `720936` أم ترقية مدفوعة لمشروع مستقل؛ واعتماد `anonymize_ips=true` وتعطيل console/performance وضبط retention.
3. تزويد الأسرار بأسمائها: `AIGAS_SENTRY_DSN`، `AIGAS_SENTRY_APPROVED_ORIGIN`، `AIGAS_POSTHOG_API_KEY`، `AIGAS_POSTHOG_HOST`، `AIGAS_MONITORING_APPROVAL_REF/RELEASE/ENVIRONMENT`، ومراجع الطبقتين.
4. تفويض إرسال حدث اصطناعي واحد لكل مسار (Auth/DB/AI/منتج/رحلة) وإثبات الوصول بالـrelease/environment، ثم اختبار kill switch.
5. اعتماد P21 أو تثبيت قائمة URL الحالية كعقد.

## 9. التراجع

- إيقاف مستقل: `AIGAS_SENTRY_KILL_SWITCH=true` و/أو `AIGAS_POSTHOG_KILL_SWITCH=true` ثم إعادة تشغيل الخدمة بالطريقة المعتمدة. لا يغلق البوابة ولا يغيّر `AIGAS_APP_ENABLED`.
- إرجاع كود: `url-policy.mjs` + سطر GA4 + `barePath` في `redact.mjs` هي التغييرات السلوكية الوحيدة؛ إرجاعها يعيد السلوك السابق دون لمس أي مورد خارجي.
- لا يمكن سحب حدث أُرسل. لا إعادة إرسال تلقائية بعد فشل النقل.

## 10. الملفات

- `Audit/p13-observability-2026-11-10/REPORT.md` (هذا الملف)
- `Audit/p13-observability-2026-11-10/payload-preview.json`
- `src/server/observability/url-policy.mjs`
- `src/server/observability/redact.mjs`
- `src/layouts/BaseLayout.astro`
- `tests/observability.test.mjs`
- `scripts/preview-observability-payload.mjs`
- `docs/MONITORING-AND-ANALYTICS-WIRING.md`
