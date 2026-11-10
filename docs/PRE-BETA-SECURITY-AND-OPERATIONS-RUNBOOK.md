# Pre-Beta — الأمن والخصوصية والتشغيل: تحضير محدود وبوابات اعتماد

> **الحالة:** `SOURCE_PRESENT` للترويسات وسياسة CSP المعرّفة؛ `TARGET_REQUIREMENT` لسياسات الاحتفاظ/الحذف/التصدير/Legal Hold والحوادث وon-call؛ `NOT_VERIFIED` لكل سلوك تشغيلي أو منشور.
> **الغرض:** تجهيز ما يمكن تجهيزه محليًا قبل Beta، وتحديد ما **لا** يجوز تنفيذه أو ادعاءه دون توقيع صاحب الصلاحية.
> **ليس:** اعتماد أمني، نتيجة اختبار اختراق، سياسة خصوصية نهائية، SLA، أو تصريح إطلاق.
> **التاريخ:** 2026-11-08 | **HEAD المحلي عند المراجعة:** `fd6d4645` (يُعاد التحقق منه قبل أي استخدام).
> **مراجع:** `docs/DATA-PRIVACY-AND-SECURITY.md`، `docs/APP-PORTAL-RUNTIME-HANDOFF.md`، `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md`، `render.yaml`.

---

## 1. سياسة CSP — الجرد والقرار

### 1.1 ما هو مفروض الآن (`SOURCE_PRESENT`)

`src/middleware.ts` يفرض على كل استجابة:

| التوجيه | القيمة |
|---|---|
| `frame-ancestors` | `'none'` لمنطقة `/app`، `'self'` للعام |
| `base-uri` | `'self'` |
| `form-action` | `'self'` |
| `object-src` | `'none'` |

لا تُستبدل سياسة يضيفها المسار؛ يُضاف فقط التوجيه الغائب.

### 1.2 سياسة الموارد الكاملة — `Content-Security-Policy-Report-Only` افتراضيًا

| التوجيه | القيمة | سبب كل مصدر |
|---|---|---|
| `default-src` | `'self'` | لا مصدر افتراضي خارجي |
| `script-src` | `'self'` + `https://www.googletagmanager.com` + بصمتان SHA-256 لسكربتين inline ثابتين | سكربتات الموقع كلها حزم same-origin من Astro. GTM هو المحمّل الخارجي الوحيد (وسم GA4 `G-9LMB4PGTWJ`). الصفحات العامة prerendered، فلا يصلح nonce؛ لذلك الهاش. |
| `connect-src` | `'self'` + مضيفات جمع GA4 + أصل Neon Auth وقت التشغيل | نداءات المنتجات same-origin تحت `/app/api`. عميل الدخول يتصل بـ`NEON_AUTH_BASE_URL`، ويُقرأ على الخادم فقط. |
| `img-src` | `'self'` + `data:` + مضيفات GA4 | لا صور خارجية في المصدر |
| `font-src` | `'self'` | خط IBM Plex Arabic محلي |
| `style-src` | `'self'` + `'unsafe-inline'` | Astro يضمّن أوراق أنماط صغيرة، وواجهة الدخول تعتمد عليها. **تخفيف معروف وموثق**، وليس ادعاء حماية أنماط كاملة. |
| `frame-ancestors` | كما في 1.1 | — |

**السكربتات inline الثلاثة التي تغطيها البصمات:**

1. كتلة تهيئة GA4 في `src/layouts/BaseLayout.astro` (`sha256-HJkD1lF4177kuaga0wHI556h4MfrYdnXNWbSalg2REQ=`).
2. و3. `document.documentElement.classList.add('js');` في صفحتي معرفة (`sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw=`).

أي تعديل على نص أي كتلة inline يُبطل بصمتها. **لا تُفرض السياسة قبل إعادة حساب البصمات وفحص المتصفح.**

### 1.3 بوابة الترقية إلى الفرض

- الافتراضي: `Content-Security-Policy-Report-Only`. لا تكسر Analytics أو الدخول؛ تُظهر المخالفات في وحدة تحكم المتصفح فقط.
- الفرض يتطلب `AIGAS_CSP_ENFORCE=true` بعد تحقق مخوّل. **لم يُضبط في `render.yaml`، ولم يُفرض في أي بيئة.**
- الفرض يتطلب أيضًا أن يكون `NEON_AUTH_BASE_URL` مضبوطًا بـHTTPS على الخادم؛ بدونه لا يُضاف أصل Auth إلى `connect-src` فيتعطل الدخول. السياسة تفشل مغلقة لهذا الأصل بدل توسيعها.
- قبل الفرض يلزم: بناء الموقع، فحص صفحة عامة + `/auth/sign-up/` + `/app/kernel/` بمتصفح حقيقي، وتأكيد عدم وجود مخالفة `script-src`/`connect-src`، وتوثيق النتيجة.
- **ممنوع** إضافة `'unsafe-eval'` أو `'unsafe-inline'` إلى `script-src` لتجاوز مخالفة.

### 1.4 فجوات معروفة

- بصمات inline غير متحققة على مخرجات build (لم يُشغّل build في هذه المهمة). عدم تطابقها يظهر كمخالفة report-only فقط.
- لا يوجد `report-to`/`report-uri`: لا نقطة جمع بلاغات، ولا نظام SIEM.
- `style-src 'unsafe-inline'` يبقي حماية الأنماط ضعيفة.

---

## 2. ترويسات الاستجابة — المصفوفة

| الترويسة | العام | `/app/*` و`/app/api/*` |
|---|---|---|
| `Cache-Control` | حسب المسار | `private, no-store, max-age=0` |
| `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control` | — | `no-store` |
| `X-Robots-Tag` | حسب الصفحة | `noindex, nofollow` |
| `X-Content-Type-Options` | `nosniff` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `no-referrer` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | نفسها |
| `Strict-Transport-Security` | `max-age=15552000` عند تأكيد HTTPS فقط | نفسها |
| `Cross-Origin-Resource-Policy` | `same-origin` | `same-origin` |
| `X-Permitted-Cross-Domain-Policies` | `none` | `none` |

الحالة: `SOURCE_PRESENT` في `src/middleware.ts` + `src/server/kernel/http.mjs` + `src/server/kernel/unavailable.mjs`.
**غير متحقق:** الاستجابة الفعلية من الخدمة المنشورة، وأن المنشور هو HEAD نفسه.

---

## 3. السجلات: لا أسرار ولا محتوى عميل

### 3.1 القواعد الملزمة

1. لا JWT ولا `Authorization` ولا DSN ولا مفاتيح مزود في أي سجل.
2. لا متن محادثة AI، ولا prompt، ولا نتيجة مزود، ولا مرفقات، ولا بريد/هاتف/هوية في السجلات التطبيقية أو سياسات الدعم.
3. سجّل المعرّفات والرموز فقط: `request_id`، `correlation_id`، `tenant_id`، `user_id`، `code`، `status`.
4. عند تشخيص خطأ: سجّل نوعه ورمزه، لا رسالته الخام ولا stack مع بيانات طلب.
5. `console.*` ممنوع في `src/` إلا بعد مراجعة صريحة. الاستثناء الحالي: سطر تشغيل الخادم في `scripts/server.mjs` عند الإقلاع/فشل فتح المنفذ.
6. ما لا نتحكم به (Render، الشبكة/CDN، Neon، مزود AI) لا يُوصف بأنه «بلا PII»؛ يحتاج سياسة احتفاظ من المشغّل.

### 3.2 فحص مصدري متكرر

```bash
rg -n "console\.(log|error|warn|info|debug)" src         # المتوقع: لا نتائج
rg -n "DATABASE_URL|NEON_AUTH|API_KEY|Bearer" src/pages  # المتوقع: لا قيم أسرار
```

النتيجة وقت هذه المراجعة: لا `console.*` في `src/`. **لا يمثل ذلك تحققًا من سجلات المنصة.**

---

## 4. الاحتفاظ والحذف والتصدير وLegal Hold — مصفوفة اعتماد

> لا توجد مدة معتمدة في المشروع. كل خلية أدناه **فارغة عمدًا** وتُملأ بقرار موقّع. لا تُكتب مدة في الكود أو الموقع أو العقد قبل ذلك.

| فئة البيانات | مدة الاحتفاظ | أساس الاحتفاظ | Legal Hold | الحذف/التصدير | مالك الاعتماد | الحالة |
|---|---|---|---|---|---|---|
| أحداث Audit في Kernel (Metadata) | `[PENDING]` | `[PENDING]` | `[PENDING]` | `[PENDING]` | المالك + القانوني | `BLOCKED` |
| حزم أدلة Ledger | `[PENDING]` | `[PENDING]` | `[PENDING]` | `[PENDING]` | المالك + القانوني + الأمن | `BLOCKED` |
| طلبات Secure Chat الوصفية | `[PENDING]` | `[PENDING]` | `[PENDING]` | `[PENDING]` | المالك + الخصوصية | `BLOCKED` |
| متن المحادثة | **لا يُخزّن حاليًا** (`contentStored=false`) | — | — | — | المالك + الخصوصية | `SOURCE_PRESENT` كإقرار، لا كسياسة retention |
| سجلات المنصة/الشبكة | `[PENDING]` | `[PENDING]` | `[PENDING]` | `[PENDING]` | المشغّل (Render/CDN) | `BLOCKED` |
| سجلات الدعم/التذاكر | `[PENDING]` | `[PENDING]` | `[PENDING]` | `[PENDING]` | الدعم + الخصوصية | `BLOCKED` |
| النسخ الاحتياطية | `[PENDING]` | `[PENDING]` | `[PENDING]` | `[PENDING]` | مالك قاعدة البيانات | `BLOCKED` |

### 4.1 شروط سياسة الحذف/التصدير

1. تعريف نطاق الحذف: ما يُحذف، وما يبقى تحت Legal Hold أو التزام نظامي.
2. مسار تصدير خروج (بيانات + سياسات + أصول + أدلة) كحزمة موثقة، دون كشف مستأجر آخر.
3. إثبات: تقرير حذف + حدث Audit Metadata، بلا متن أو PII.
4. النسخ الاحتياطية تُعالج بجدول مستقل؛ **لا وعد حذف فوري**.
5. لا تنفّذ أي أداة حذف أو `DELETE` على الإنتاج في هذه المرحلة.

### 4.2 Legal Hold

- لا سلطة Legal Hold معيّنة اليوم.
- أي طلب حذف يتعارض مع Hold أو التزام نافذ يُرفض ويُوثّق.
- تفعيل/رفع Hold يحتاج قرارًا موثقًا من المالك + القانوني قبل التنفيذ.

---

## 5. الحوادث وon-call — قالب جاهز للملء

| البند | القيمة | الحالة |
|---|---|---|
| Incident owner (اسم/دور) | `[PENDING]` | `BLOCKED` |
| قناة الإبلاغ الأمني | `[PENDING]` (بريد مخصص بحسب القرار 97) | `BLOCKED` |
| قناة إبلاغ العملاء بالأعطال | `[PENDING]` (بريد بحسب القرار 96) | `BLOCKED` |
| on-call وجدول التصعيد | `[PENDING]` | `BLOCKED` |
| نافذة الإخطار التعاقدية | `[PENDING — قرار قانوني]` | `BLOCKED` |
| نص إخطار الحادث | `[PENDING — مراجعة قانونية]` | `BLOCKED` |

### 5.1 تصنيف شدة **مقترح** (ليس SLA)

| المستوى | المعنى التشغيلي | مثال |
|---|---|---|
| S1 | تعرض بيانات أو تعطل كامل أو تجاوز صلاحيات | وصول لمؤسسة أخرى، تسريب مفتاح |
| S2 | تعطل منتج أساسي مع بديل أو أثر محدود | فشل Firewall لمسار واحد |
| S3 | تدهور جزئي/أداء | زمن استجابة مرتفع بلا فقد بيانات |
| S4 | ملاحظة أو طلب معلومات | خطأ عرض غير مؤثر |

التصنيف والأزمنة **غير معتمدة**؛ تحتاج توقيع Incident owner.

### 5.2 تسلسل الاستجابة

1. احتواء: عزل الجلسة/المفتاح/المستأجر المتأثر فقط.
2. حفظ أدلة Metadata دون نسخ محتوى العميل.
3. تصعيد إلى Incident owner والقانوني عند أثر على بيانات أو التزام إخطار.
4. إخطار الأطراف المتأثرة عبر القناة المعتمدة وحدها.
5. مراجعة سبب جذري وCAPA، وتحديث السجل.

---

## 6. المراقبة والفحص التشغيلي — تعريفات لا ادعاءات

### 6.1 ما يثبته `healthCheckPath: /`

يثبت **توفر الموقع العام** فقط. لا يثبت صحة `/app/api/*` ولا اتصال قاعدة البيانات ولا المخطط ولا المنتجات. لا تُبنى عليه ادعاءات جهوزية.

### 6.2 مؤشرات دنيا مقترحة (بلا SIEM)

| المؤشر | التعريف | المصدر |
|---|---|---|
| `http_5xx_rate` | نسبة استجابات 5xx من إجمالي طلبات المسار | سجلات/مقاييس المشغّل |
| `http_4xx_rate` | نسبة 4xx، مع فصل 401/403 عن 404 | نفسها |
| `latency_p95` | زمن الاستجابة p95 لمسارات `/` و`/app/api/kernel/health/` | نفسها |
| `portal_gate_state` | 503 `APP_UNAVAILABLE` متوقع عند `AIGAS_APP_ENABLED=false` | فحص دوري |
| `health_state` | `ready/degraded/blocked/unconfigured` من `operationalHealth()` | `/app/api/kernel/health/` |
| `db_reachable` | نجاح استعلام فحص واحد بصلاحية قراءة | Health/فحص مشغّل |

**عتبات مقترحة للتنبيه (تحتاج اعتماد المالك، وليست SLA):** أي 5xx متكرر، أو `blocked`، أو فشل Health متتالٍ، أو p95 يتجاوز الميزانية المعتمدة. لا تُعلن أرقامًا خارجية.

### 6.3 فصل مستويات الفحص

| المستوى | الطلب | يثبت |
|---|---|---|
| L1 عام | `GET /` | الويب العام يستجيب |
| L2 بوابة | `GET /app/` | البوابة مغلقة 503 أو مفتوحة، مع الترويسات |
| L3 صحة | `GET /app/api/kernel/health/` | حالة الإعداد/المخطط/القاعدة (أكواد فقط) |
| L4 منتج | نداء منتج مصادق ببيانات اصطناعية | وظيفة فعلية — **لا يُنفّذ الآن** |

### 6.4 أوامر تحقق جاهزة (لم تُشغّل)

```bash
# L1/L2: الترويسات والحالة (قراءة فقط)
curl -sS -D - -o /dev/null https://brightai.live/
curl -sS -D - -o /dev/null https://brightai.live/app/
curl -sS -D - -o /dev/null https://brightai.live/app/api/kernel/health/
```

شروط القبول المتوقعة لـL2 عند البوابة المغلقة: `503` + `Cache-Control: private, no-store` + `X-Robots-Tag: noindex, nofollow`. أي انحراف يُسجّل، ولا يُعاد تعريفه كنجاح.

---

## 7. الدعم والوصول والأدلة

1. **قناة الدعم:** البريد المعتمد فقط؛ لا نظام تذاكر منشور. لا يُدّعى وصول طلب أو زمن استجابة.
2. **محتوى التذكرة:** معرفات ورموز وحالة فقط. يُمنع لصق محادثات AI أو prompts أو مستندات عميل أو مفاتيح.
3. **بيانات اصطناعية افتراضيًا:** أي استكشاف أو عرض أو اختبار يستخدم بيانات مُصطنعة. لا بيانات عميل حقيقية في بيئة تطوير أو عرض.
4. **لا تدريب:** محادثات العملاء ومستنداتهم وبياناتهم لا تُستخدم لتدريب النماذج؛ هذا التزام تعاقدي وموردي، وليس ميزة منفذة في الكود.
5. **تشفير السجلات:** النقل HTTPS مفروض عند الحافة. التشفير عند التخزين وسياسة المفاتيح والتدوير **مسؤولية مشغّل** ولم تُتحقق.
6. **وصول الدعم:** أقل صلاحية، بموافقة العميل، محدد المدة، قابل للإلغاء ومدقق (القرار 92). لا وصول خفي.
7. **Audit:** Metadata فقط (`tenant_id`, `actor_user_id`, `action`, `correlation_id`, `policy_version`, `idempotency_key`). لا أجسام طلبات ولا نصوص.

---

## 8. بوابات الإيقاف قبل التشغيل الفعلي

لا يبدأ تشغيل فعلي قبل توقيع/إتمام كل بند. أي خانة فارغة = توقف.

| # | البوابة | معيار الإغلاق | المالك | الحالة |
|---|---|---|---|---|
| G1 | موافقة الأمن | مراجعة CSP/الترويسات ومسارات الكتابة وRLS | مسؤول الأمن | `PENDING` |
| G2 | تدوير الأسرار | تدوير `DATABASE_URL`/`NEON_AUTH_*` لُمس في سياقات غير إنتاجية، وإبطال القديم، وتوثيق التاريخ بلا قيم | المشغّل + الأمن | `PENDING` |
| G3 | Incident owner وon-call | اسم/دور/قناة/تصعيد موثقة | المالك | `PENDING` |
| G4 | موافقة الخصوصية | مصفوفة الاحتفاظ/الحذف/التصدير/Legal Hold موقعة | المالك + القانوني + الخصوصية | `PENDING` |
| G5 | قاعدة بيانات التشغيل | دور `aigas_runtime` بلا `BYPASSRLS`، وData API مقيّد/مغلق، وفرع staging قابل للاستعادة | مالك قاعدة البيانات | `PENDING` |
| G6 | فحص تشغيلي | L1–L3 على نسخة معروفة SHA، وفحص متصفح لـCSP/الدخول | مشغّل معتمد | `PENDING` |
| G7 | إثبات المزود | مزود/نموذج/منطقة/No-Training/مفتاح معتمد | المالك + الأمن | `PENDING` |

### 8.1 نماذج توقيع

```text
G1 Security approval:  name / role / date / scope
G2 Secret rotation:    keys rotated (no values) / old keys revoked / date
G3 Incident owner:     name / role / channel / on-call schedule
G4 Privacy approval:   retention & deletion matrix version / approver / date
```

---

## 9. ما لا يدّعيه هذا المستند

- لا اعتماد أمني ولا نتيجة اختبار اختراق.
- لا امتثال PDPL/NCA/سدايا ولا ISO 42001.
- لا إقامة بيانات سعودية (المشروع المفحوص سابقًا في `aws-us-east-2`).
- لا SLA ولا RPO/RTO ولا zero retention.
- لا تشغيل أو نشر: كل ما سبق `SOURCE_PRESENT` أو `NOT_VERIFIED` فقط.

---

## 10. طبقتا المراقبة والتحليلات (Sentry/PostHog) — بوابات مستقلة

> **الحالة:** `SOURCE_PRESENT` فقط. لا مشروع Sentry، ولا مشروع PostHog معتمد، ولا إرسال. التفاصيل الكاملة في `docs/MONITORING-AND-ANALYTICS-WIRING.md`.

### 10.1 الفصل الملزم

1. **Sentry** = تتبع أخطاء الخادم وإشارات ثابتة للواجهة في App/Auth خلف علم متصفح إضافي؛ لا SDK ولا stack أو بيانات عملاء أو أجسام طلبات أو هوية. `SOURCE_PRESENT` فقط.
2. **PostHog** = أحداث استخدام صريحة فقط. لا auto-capture، لا replay، لا heatmaps، لا person profiles، لا tenant/user ID.
3. **مفتاح إيقاف مستقل** لكل طبقة (`AIGAS_SENTRY_KILL_SWITCH` / `AIGAS_POSTHOG_KILL_SWITCH`) ولا يعتمد على `AIGAS_APP_ENABLED`.
4. **صحة CDN/Render على `/`** لا تثبت `/app/api/kernel/health/`؛ يجب مراقبة المسارين منفصلين.
5. **مراجعة 2026-11-10:** اعتماد منفصل لكل طبقة وrelease SHA كامل؛ PostHog في staging/beta فقط. مسودة إعدادات التوجيه والتصعيد في `docs/beta/MONITORING-OPERATIONS-PLAN.yaml`، بلا وجهات أو توقيعات. الجرد الفعلي في `docs/beta/MONITORING-READONLY-STATUS-2026-11-10.md`؛ لا monitoring Live أو إثبات نشر.

### 10.2 بوابات التفعيل (كلها مغلقة الآن)

| # | البوابة | معيار الإغلاق | المالك | الحالة |
|---|---|---|---|---|
| M1 | Sentry approval | مشروع محدد + DSN في Secret Store + سياسة احتفاظ + موافقة أمن/خصوصية | المالك + الأمن | `BLOCKED` |
| M2 | Analytics approval | مشروع PostHog محدد + قرار تحليلات موقّع + تقوية إعدادات المشروع | المالك + الخصوصية | `BLOCKED` |
| M3 | Alert routing | وجهات 5xx/Auth/RLS/Ledger/Provider معتمدة (قرارات 96/97) | العمليات + الأمن | `BLOCKED` |
| M4 | On-call | Incident owner + جدول تصعيد + قناة إخطار موثقة | المالك | `BLOCKED` |
| M5 | Payload review | فحص حدث Sentry وأحداث PostHog فعليًا وخلوّها من PII | الخصوصية | `BLOCKED` |

### 10.3 قواعد تنبيه لا تُنشأ تلقائيًا

1. أي `5xx` متكرر على أي `surface`.
2. `AUTH_UNAVAILABLE` أو `INVITATION_*` متكرر.
3. أي `*_DB_PRIVILEGE` أو `TENANT_*` أو `RLS_*`.
4. أي `LEDGER_VERIFICATION_MISMATCH`.
5. `PROVIDER_TIMEOUT` فوق العتبة المعتمدة.
6. انحراف `/app/` عن 503 عند `AIGAS_APP_ENABLED=false`.
7. `operationalHealth()` بحالة `blocked`/`degraded` متتالية.

**لا تُضاف قنوات Slack/بريد/PagerDuty ولا أرقام on-call في هذه المرحلة.** أي ربط خارجي يحتاج تفويضًا منفصلًا.

### 10.4 الإيقاف والتراجع

```text
AIGAS_SENTRY_KILL_SWITCH=true
AIGAS_POSTHOG_KILL_SWITCH=true
```

لا يغيّر هذا البوابة أو المنتجات؛ يوقف الإرسال فقط. يُتحقق من التوقف بحدث اصطناعي واحد بعد إعادة التشغيل في بيئة معتمدة.
