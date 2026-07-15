# BrightAI Kernel

توثيق واجهات نواة BrightAI داخل المسار `kernel/`.

آخر تحديث توثيقي: 2026-05-31

## الهدف

`kernel/` هو سطح HTML ثابت لواجهة حوكمة استخدامات الذكاء الاصطناعي في BrightAI. الواجهات هنا تعرض رحلة تشغيل كاملة تشمل المحادثة، الإحصائيات، الموافقات، سجل التدقيق، الأدلة، التقارير، السيناريوهات، الامتثال، السياسات، والموصلات.

هذا المسار يعتمد على HTML/CSS/JavaScript مباشرة بدون React أو إطار Frontend داخل نفس المسار. كل صفحة تستخدم وحدات JavaScript مشتركة تحت `kernel/assets/js/`، وتتصل افتراضياً بواجهة الإنتاج `/api/kernel`.

## الأرشفة والـ Quarantine (KRN-005 / EXEC-05 — 2026-07-15 → CLEANUP-2026-07-15)

> **ملاحظة:** محتوى `kernel/` المؤرشف (HTML، JS، manifest، SW، mock data) **حُذف نهائياً من الـ repo** في CLEANUP-2026-07-15. الـ git history يحتفظ بكل الـ files لو احتجنا يوماً. الـ snapshot الكامل محفوظ في `.agents/snapshots/brightai-kernel-legacy-2026-07-15.tar.gz` + docs/archived-artifacts.md. الـ Astro kernel الأَحياء يعيش في `src/pages/kernel/` + `src/components/kernel/` + `src/pages/api/`.

الملفات اللي حُذفت (كانت في `kernel/legacy-disabled/` الأرشيف):

- الـ SW script في `kernel/sw.js` (legacy service worker كان يـ cache `/api/kernel/*` ويصطفّ mutations مع PII في IndexedDB)
- الـ PWA manifest في `kernel/manifest.json` (legacy PWA manifest، `share_target` POST لـ `/kernel/chat/` = 404)
- وحدات JS الـ 17 في `kernel/assets/js/` (تشمل `kernel-pwa.js` و `kernel-api.js` و `kernel-mock-handlers.js` و `kernel-demo-store.js` إلخ)
- mock JSON seeds (8 ملفات) في `kernel/api/mock/`
- legacy perf instrumentation (`kernel-perf.js` + `kernel-web-vitals.js`)
- legacy tests (6 ملفات `.test.js`) في `kernel/tests/`

ما تبقّى في `kernel/` الأَحياء (يرثه Astro build من `src/pages/kernel/`):

- `README.md` (هذا الملف)
- `api/mock/` (فارغ بعد الـ cleanup، للأمان)
- `assets/css/` (`kernel.css` + `pages/*.css` — مستخدم من Astro kernel layouts)
- ~~`assets/screenshots/`~~ (حُذف — 0 references في الـ live code)

**CI guard:** `node scripts/verify-no-legacy-sw.mjs` يفحص ملفات الكود فقط (`.html`, `.js`, `.ts`, `.css`, `.json`, إلخ) داخل `kernel/` recursive بالكامل، ويتجاهل `.md` — التوثيق مسموح له يصف الـ patterns بدون trigger. الفحص يفشل لو ظهر:

1. أي استدعاء من نوع "register" على `navigator.serviceWorker` داخل ملف كود
2. ربط بمسار الـ legacy PWA manifest داخل مجلد `kernel/`
3. ربط بمسار الـ legacy SW script داخل مجلد `kernel/`
4. ربط بمسار الـ legacy PWA module داخل `kernel/assets/js/`

**Migration path** لو احتجت أي ملف من الأرشيف في المستقبل:

```bash
tar xzf .agents/snapshots/brightai-kernel-legacy-2026-07-15.tar.gz -C /tmp/
cp /tmp/kernel/legacy-disabled/<file> kernel/<file>
node scripts/verify-no-legacy-sw.mjs   # يبقى pass لو ما في SW registration في الملف
```

التفاصيل الكاملة في `docs/archived-artifacts.md` (دليل الأرشيف الرسمي).

## عزل الـ Mock Handlers (KRN-006 / EXEC-06 — 2026-07-15)

> **ملاحظة:** 3 ملفات mock/demo من `kernel/assets/js/` انتقلت للأرشيف ثم حُذفت نهائياً في CLEANUP-2026-07-15. الـ snapshot محفوظ في `.agents/snapshots/brightai-kernel-legacy-2026-07-15.tar.gz`. الملفات المعنية:
>
> - `kernel-mock-handlers.js` — كان يسجّل `fetch` interceptor على الـ window
> - `kernel-demo-store.js` — مصدر الـ toggle (localStorage)
> - `kernel-api.js` — `shouldUseDemoData()` decision point

**الـ risk:** أي XSS injection أو مستخدم يفتح DevTools يقدر يقلب الـ localStorage flag → يحقن mock data في كل `fetch` call داخل الـ app → مستخدم production يشوف بيانات وهمية في مكان بيانات حقيقية.

**CI guard ثاني:** `node scripts/verify-no-legacy-mock.mjs` (sibling للـ sw guard) يفحص `kernel/` لأي:
- مرجع للـ fetch global عبر `window` (read أو patch)
- ذكر للـ localStorage flag للـ demo mode (الاسم الفعلي موثّق في `kernel/legacy-disabled/mock/README.md` — لا يُذكر هنا حرفياً لتفادي الـ attack surface)

التفاصيل الكاملة في `kernel/legacy-disabled/mock/README.md`.

## القاعدة التشغيلية الحالية

- الوضع الافتراضي هو Production API عبر `/api/kernel`.
- بيانات المحاكاة لا تعمل إلا عند تفعيل toggle واضح باسم `بيانات تجريبية`.
- عند فتح الصفحات مباشرة عبر `file://` يتم تفعيل البيانات التجريبية تلقائياً حتى تبقى المعاينة المحلية شغالة بدون backend.
- لا يتم تحويل جلسة HTTP/HTTPS إلى demo بصمت عند فشل Production API.
- `kernel-api.js` هو API client وتطبيع البيانات فقط، بينما demo store وmock interception وبانر البيانات التجريبية مفصولة في ملفات مستقلة.

## إعداد مزود NVIDIA

تم توحيد موديل NVIDIA المستخدم في المحلي والإنتاج على:

```text
minimaxai/minimax-m2.7
```

مصادر الحقيقة الحالية:

- المحلي: `.env` يضبط `NVIDIA_MODEL=minimaxai/minimax-m2.7`.
- الإنتاج: `render.yaml` يضبط `NVIDIA_MODEL` لنفس القيمة داخل خدمة `brightai-api`.
- fallback داخل الخادم: `frontend/config/index.js` يستخدم نفس الموديل إذا لم تصل قيمة `NVIDIA_MODEL` من البيئة.

مسار `/api/kernel/providers` لا يملك إعداد موديل مستقل؛ هو يرجع `config.nvidia.model` من `frontend/config/index.js`. لذلك أي تغيير مستقبلي على موديل NVIDIA لازم يتحدث في المصادر الثلاثة أعلاه، ثم يتم التحقق من الاستجابة التالية:

```bash
curl -s http://127.0.0.1:3000/api/kernel/providers
```

القيمة المتوقعة داخل الاستجابة:

```json
{
  "activeProvider": {
    "name": "nvidia",
    "model": "minimaxai/minimax-m2.7"
  },
  "providers": {
    "nvidia": {
      "model": "minimaxai/minimax-m2.7"
    }
  }
}
```

ملاحظة تشغيلية: `frontend/config/index.js` يعمل `trim()` لقيمة `NVIDIA_URL` حتى لا تسبب المسافات الزائدة في `.env` المحلي endpoint غير صالح.

## تكامل NVIDIA عبر Backend Proxy

تكامل NVIDIA الخاص بسطح Kernel يتم عبر backend proxy فقط، خارج مسار `kernel/` الثابت. الواجهة لا تقرأ مفاتيح NVIDIA ولا تحفظها ولا تمررها في أي HTML أو JavaScript.

المسارات المخصصة:

| Endpoint | Method | الاستخدام |
| --- | --- | --- |
| `/api/kernel/nvidia/status` | `GET` | يرجع حالة NVIDIA الآمنة للواجهة: `configured`, `model`, و`mode` فقط. |
| `/api/kernel/nvidia/chat` | `POST` | يستقبل الرسالة من الواجهة، ثم يضيف مفتاح NVIDIA من بيئة الخادم حصراً قبل استدعاء NVIDIA. |

قواعد الأمان والتشغيل:

- المفتاح يبقى في بيئة الخادم فقط، ولا يظهر في `kernel/*.html` أو `kernel/assets/js/*.js`.
- `status` لا يرجع أي secret أو raw provider payload؛ فقط `configured`, `model`, و`mode`.
- `chat` يستخدم `config.nvidia.model` من الخادم، ولا يسمح للمتصفح بفرض موديل مختلف على البروكسي.
- عند غياب مفتاح NVIDIA في بيئة الخادم يرجع endpoint رسالة واضحة للمستخدم مع `503` و`NVIDIA_NOT_CONFIGURED`.
- عند انتهاء المهلة يرجع `504` و`NVIDIA_TIMEOUT`.
- logging في الخادم يطبع الحدث، الموديل، الوضع، عدد الرسائل، الحالة، والمدة فقط؛ بدون مفاتيح وبدون نصوص المستخدم.
- `.env.example` في جذر المشروع يوثق المتغيرات المطلوبة بقيم فارغة أو افتراضية غير سرية.

تكامل الواجهة:

- `kernel/assets/js/kernel-api.js` يحتوي `getNvidiaStatus()` لاستدعاء مسار الحالة.
- `kernel/assets/js/kernel-api.js` يحتوي `nvidiaChat(message, options)` لاستدعاء مسار المحادثة عبر البروكسي.
- `kernel/chat.html` يعرض بطاقة حالة NVIDIA داخل لوحة Kernel الجانبية، وتعرض فقط `configured`, `model`, و`mode` مع حالات loading/error ورسالة واضحة عند غياب المفتاح.

## هيكل الملفات

> **مُحدَّث 2026-07-15:** الشجرة أدناه تصف **البنية التاريخية** لـ `kernel/`. البنية الفعلية الحالية: الـ HTML والـ JS والـ manifest والـ SW انتقلوا لـ `kernel/legacy-disabled/` (KRN-005). اللي تبقّى في `kernel/`: `assets/css/` (kernel.css + 13 page CSS)، `assets/screenshots/`، `api/mock/` (فارغ، الـ mock JSONs في الأرشيف)، `assets/js/` (فارغ).

```text
kernel/
├── README.md
├── manifest.json              # أرشيف (kernel/legacy-disabled/)
├── index.html                 # أرشيف (HTML files removed)
├── chat.html                  # أرشيف
├── stats.html                 # أرشيف
├── approvals.html             # أرشيف
├── audit.html                 # أرشيف
├── evidence.html              # أرشيف
├── reports.html
├── scenarios.html
├── compliance.html
├── policies.html
├── connectors.html
├── assets/
│   ├── css/
│   │   └── kernel.css
│   └── js/
│       ├── kernel-api.js
│       ├── kernel-chat-client.js
│       ├── kernel-compliance.js
│       ├── kernel-demo-banner.js
│       ├── kernel-demo-store.js
│       ├── kernel-mobile.js
│       ├── kernel-mock-handlers.js
│       ├── kernel-nav.js
│       ├── kernel-reports.js
│       ├── kernel-stats.js
│       └── kernel-utils.js
└── api/
    └── mock/
        ├── approvals.json
        ├── audit.json
        ├── compliance.json
        ├── connectors.json
        ├── evidence.json
        ├── policies.json
        ├── scenarios.json
        └── stats.json
```

## الصفحات

| الملف | الدور |
| --- | --- |
| `index.html` | Dashboard تشغيلية مختصرة: status strip، ثلاثة إجراءات رئيسية، مؤشرات، وآخر traces. |
| `chat.html` | واجهة محادثة آمنة مع تحليل مخاطر، PII، سياسات، مزود، وسجل trace. |
| `stats.html` | Dashboard للإحصائيات، توزيع الحالات، المخاطر، الأقسام، وآخر Trace IDs. |
| `approvals.html` | لوحة الموافقات البشرية للطلبات عالية المخاطر أو المعلقة. |
| `audit.html` | عارض سلسلة التدقيق والتحقق من سلامة السجلات. |
| `evidence.html` | عرض الأدلة المرتبطة بالقرارات، مع تصدير PDF داخل المتصفح عند الحاجة. |
| `reports.html` | واجهة التقارير، الفلاتر، التحميل، الإنشاء، والجدولة. |
| `scenarios.html` | سيناريوهات اختبار جاهزة ترسل المستخدم إلى `chat.html` مع prompt محدد. |
| `compliance.html` | عرض حزم الامتثال وحالة المتطلبات حسب الإطار التنظيمي. |
| `policies.html` | محرر سياسات بصري مع CRUD، preview محلي، وtoggle `بيانات تجريبية`. |
| `connectors.html` | عرض موصلات قراءة تجريبية لأنظمة المؤسسة بدون الوصول لبيانات حقيقية. |

## تحديث Dashboard الرئيسية

تمت إعادة تنظيم `kernel/index.html` كصفحة dashboard عملية بدل صفحة landing مزخرفة.

ترتيب الصفحة الحالي:

1. `status strip`: يعرض حالة المزود، قاعدة البيانات، ووقت آخر تحديث.
2. `primary actions`: ثلاثة مسارات تشغيل مباشرة فقط:
   - تشغيل محادثة آمنة عبر `/kernel/chat/`.
   - مراجعة الموافقات عبر `/kernel/approvals/`.
   - فتح سجل التدقيق عبر `/kernel/audit/`.
3. `metrics`: إجمالي الطلبات، الطلبات بانتظار الموافقة، متوسط المخاطر، ونسبة كشف `PII`.
4. `recent traces`: آخر خمسة سجلات من `latestTraces`، مع fallback إلى `/api/kernel/audit` إذا لم ترجع الإحصائيات traces.

قواعد التنفيذ:

- لا توجد مكتبات جديدة؛ الصفحة تعتمد على وحدات Kernel المشتركة تحت `kernel/assets/js/` بدون إطار Frontend إضافي.
- الصفحة تستخدم نفس هوية BrightAI الداكنة مع تقليل الزخرفة والحفاظ على سطح تشغيلي واضح.
- `Production API` يبقى الافتراضي، ولا يتم تفعيل demo بصمت عند فشل الاتصال.
- القيم المختلطة مثل `Trace ID` معزولة بصرياً باتجاه `LTR` داخل الواجهة العربية.
- روابط الأدلة في جدول traces تمرر `trace_id` إلى `/kernel/evidence/`.
- تم تحديث head للصفحة بإزالة منع التكبير من viewport، وإضافة Open Graph/Twitter tags، وتحويل JSON-LD إلى صيغة array صالحة للفحص المحلي.

## تحديث تجربة الجوال داخل Kernel

تمت إضافة طبقة تحسين جوال موحدة داخل `kernel/assets/css/kernel.css` مع تحسينات سلوكية صغيرة في `kernel/assets/js/kernel-nav.js`.

نطاق التحسين:

- منع horizontal overflow على مستوى `html`, `body`, الحاويات الرئيسية، صفحات `kernel-layout`، صفحة المحادثة، والكروت المتكررة.
- جعل الجداول والواجهات الشبكية العريضة تتمرر أفقياً داخل حاويتها فقط، مثل جداول `reports.html` و`policies.html` وheatmap في `stats.html`.
- ضبط drawer الجوال بعرض آمن لا يتجاوز الشاشة، مع `aria-hidden` صحيح، قفل تمرير الصفحة أثناء فتحه، وإغلاقه بعد اختيار رابط.
- تحسين bottom nav على الجوال باستخدام grid ثابت حتى تبقى العناصر الخمسة الظاهرة قابلة للمس بدون ضغط أو تمدد خارج الشاشة.
- تحسين more menu/dropdowns حتى لا تتجاوز عرض الشاشة.
- فرض حد أدنى `44px` لعناصر اللمس الأساسية: الروابط، الأزرار، الفلاتر، الحقول، عناصر drawer، عناصر bottom nav، وأزرار المحادثة.
- إعادة ترتيب الفلاتر والنماذج في الشاشات الصغيرة بحيث تصبح كاملة العرض، مع تكديس آمن للفلاتر والبحث والـ sort controls.
- تحسين سلوك chat mobile: تقليل هوامش الإدخال، إخفاء تلميح الاختصار على الشاشات الصغيرة، وضمان عدم خروج الرسائل أو بطاقات الحوكمة عن عرض الشاشة.

نقاط breakpoint المعتمدة للتحقق:

- `320px`
- `375px`
- `720px`
- `1024px`

قواعد مستقبلية:

- أي جدول جديد داخل `kernel/` يجب أن يكون داخل حاوية تسمح بـ `overflow-x: auto` أو يستخدم `.card:has(table)` / `.table-container`.
- أي فلتر أو نموذج جديد يجب أن يستخدم أنماط `.filters-bar`, `.filter-group`, `.filter-select`, `.search-box`, `.form-control`, أو `.input` حتى يرث تكديس الجوال.
- لا تضف عناصر تفاعلية أقل من `44px` في الارتفاع أو العرض الفعلي على الجوال.
- لا تضف `width: 100vw` داخل عناصر nested؛ استخدم `width: 100%`, `max-width: 100%`, و`min-width: 0`.
- عند إضافة صفحة Kernel جديدة، اختبرها على الأقل عند `320/375/720/1024px` وتأكد أن `document.documentElement.scrollWidth <= window.innerWidth` إلا إذا كان التمرير داخل جدول/حاوية مقصودة.

## تحديث الوصولية في Audit وEvidence

تم تحسين الوصولية داخل `kernel/audit.html`, `kernel/evidence.html`, `kernel/assets/js/kernel-nav.js`, `kernel/assets/js/kernel-mobile.js`, و`kernel/assets/css/kernel.css` بدون تغيير وظائف API أو تدفقات البيانات.

نطاق التحسين:

- إضافة semantic landmarks و`skip-link` و`aria-labelledby` للصفحات، مع إبقاء breadcrumb المرئية كجزء ثابت من تجربة التنقل.
- تحويل العناصر التفاعلية في `audit.html` و`evidence.html` من `div/span` قابلة للنقر إلى `button` فعلي عند نسخ التجزئات أو اختيار سجل دليل.
- توحيد حالة الفلاتر والأزرار عبر `aria-pressed`، وتوحيد قيم `aria-expanded` نصياً باستخدام `String(...)` داخل JavaScript.
- إضافة focus trap مع إعادة التركيز للعناصر التي فتحت الـ mobile drawer والـ more dropdown في `kernel-nav.js`، وتطبيق نفس نمط focus trap للـ drawer في `kernel-mobile.js`.
- إضافة `aria-label` للأزرار والـ toggles والـ badges التي تحتاج وصفاً أوضح لقارئ الشاشة.
- ضبط النصوص اللاتينية مثل `Trace`, `Trace ID`, `Audit`, وحقول `Hash/Provider/Model` باستخدام `lang="en"` و`dir="ltr"` عند الحاجة.
- تقوية focus states في `kernel.css` وتحسين تباين tags/badges لحالات الخطر والموافقة والحظر.

قواعد مستقبلية:

- لا تضف `div` أو `span` مع `onclick` لعناصر يمكن تفعيلها؛ استخدم `button` أو أضف `role`, `tabindex`, ومعالجة keyboard إذا كان العنصر غير قياسي.
- أي drawer أو dropdown جديد يجب أن يدعم `Escape`, حصر التركيز أثناء الفتح، وإعادة التركيز للزر الذي فتحه عند الإغلاق.
- أي toggle أو badge يحمل حالة مهمة يجب أن يملك `aria-label` أو نصاً واضحاً كافياً لقارئ الشاشة.
- أي نص لاتيني داخل واجهة عربية، خصوصاً معرفات `trace_id` وحقول hash/model/provider، يجب عزله باتجاه `LTR` ولغة مناسبة.

## تحديث الروابط الداخلية والاكتشاف

تم توحيد link graph داخل `kernel/` بحيث تغطي كل صفحة HTML الصفحات الإحدى عشرة الأساسية:

- `/kernel/`
- `/kernel/chat/`
- `/kernel/audit/`
- `/kernel/evidence/`
- `/kernel/approvals/`
- `/kernel/stats/`
- `/kernel/compliance/`
- `/kernel/policies/`
- `/kernel/connectors/`
- `/kernel/scenarios/`
- `/kernel/reports/`

قواعد الربط الحالية:

- كل قسم `BRIGHTAI_INTERNAL_LINKS` في صفحات `kernel/*.html` يحتوي نفس الصفحات الإحدى عشرة بنمط الدليل trailing slash.
- كل صفحة تحتوي breadcrumb مرئية واحدة عبر `.kernel-breadcrumb`، وتطابق أسماء `BreadcrumbList` في JSON-LD.
- الصفحات الأقل ارتباطاً سابقاً (`scenarios`, `connectors`, `compliance`, `reports`) تحتوي CTA وروابط سياقية داخل المحتوى تربطها بسجل التدقيق، الأدلة، السياسات، الموصلات، والتقارير حسب السياق.
- الصفحات التشغيلية التي تحتاج قراراً أو مراجعة (`approvals`, `audit`, `evidence`, `policies`, `stats`) تحتوي الآن CTA سياقية داخل المحتوى حتى لا تكون صفحة نهائية بلا مسار عمل واضح.
- لا توجد صفحة orphan داخل سطح Kernel؛ كل صفحة تستقبل روابط داخلية من بقية صفحات Kernel.
- روابط `trace_id` هي الصيغة القياسية للانتقال بين `Audit`, `Evidence`, `Approvals`, و`Policies`. لا تضف روابط جديدة بصيغة `traceId` في query string.

## تحديث الجاهزية الإنتاجية داخل Kernel

تم تنفيذ إصلاحات محدودة داخل `kernel/` فقط لرفع جاهزية الصفحات بدون تغيير بنية API أو mock schema.

نطاق الإصلاح:

- إضافة CTAs سياقية إلى `approvals.html`, `audit.html`, `evidence.html`, `policies.html`, و`stats.html`.
- تحويل أزرار كانت صامتة إلى أفعال واضحة: تعديل السيناريو يفتح مسار محرر السياسات، إنشاء التقرير يشغّل flow إنشاء التقرير، وتعديل الجدولة يبدّل حالة الجدولة بين نشط ومتوقف.
- تقليل احتمال horizontal overflow على الجوال في grids الخاصة بـ `reports.html`, `scenarios.html`, و`connectors.html` باستخدام `minmax(min(100%, ...), 1fr)`.
- إزالة مثال secret وهمي صريح من سيناريو فحص الكود، مع إبقاء المثال كـ `[CREDENTIAL]` حتى لا يلتقطه فحص الأسرار كقيمة حساسة.
- تأكيد أن `.env.example` يستخدم مفاتيح فارغة للأسرار ولا يحتوي قيماً حقيقية.

التحقق المنفذ:

- static audit للـ breadcrumb والـ CTA مرّ على كل صفحات `kernel/*.html`.
- static audit للروابط الداخلية داخل `kernel/` وأزرار HTML بلا marker وظيفي مرّ.
- فحص `.env.example` أكد أن مفاتيح الأسرار فارغة.

التحقق غير المكتمل:

- فحص فتح كل صفحة في متصفح حقيقي، console errors، وmobile overflow لم يكتمل لأن المستخدم طلب إيقاف التحقق أثناء التنفيذ.

## تحديث واجهة المحادثة

تم تحسين `kernel/chat.html` و`kernel/assets/js/kernel-chat-client.js` بحيث تعرض واجهة المحادثة بطاقة حوكمة بعد كل طلب تتم معالجته أو تعليقه أو حظره.

البطاقة تعرض القيم التالية بشكل ثابت:

- `Risk score`: درجة المخاطر كنسبة مئوية مع لون مناسب لمستوى الخطر.
- `PII detected`: هل تم كشف بيانات شخصية أو حساسة، مع عرض نوع البيانات عند توفره.
- `Firewall action`: قرار جدار الحوكمة مثل `allowed`, `blocked`, أو `pending_approval`.
- `Trace ID`: معرف التتبع بصيغة قابلة للقراءة والنسخ البصري، مع عزل اتجاهه كـ LTR داخل واجهة RTL.

وتوفر البطاقة ثلاثة إجراءات مباشرة:

- `Audit`: يفتح سجل التدقيق مع تمرير `trace_id` عند توفره.
- `Evidence`: يفتح صفحة الأدلة المرتبطة بنفس `trace_id`.
- `Create Policy`: يفتح محرر السياسات في وضع إنشاء سياسة جديدة مع ربطها بالسياق عند توفر `trace_id`.

قواعد العرض المهمة:

- البطاقة تظهر في الردود العادية، الطلبات المعلقة للموافقة، ورسائل الحظر.
- تصميم البطاقة يحافظ على `dir="rtl"` مع عزل القيم المختلطة مثل `Trace ID`.
- أزرار `Audit`, `Evidence`, و`Create Policy` تستخدم grid responsive: ثلاثة أعمدة على الشاشات الواسعة، عمودين على الجوال المتوسط، وعمود واحد تحت `420px` لمنع التداخل.
- `kernel-chat-client.js` يحتوي نسخة DOM مستقلة من منطق البطاقة حتى تبقى الرسائل التي ينشئها client module متسقة مع بطاقة `chat.html`.

## تحديث سجل التدقيق

تم تطوير `kernel/audit.html` ليعرض `Trace Timeline` واضح لكل طلب، مع المحافظة على سجل الأحداث والتحقق من سلسلة التدقيق الموجودة.

المسار الجديد في الصفحة:

- اختيار `trace_id` من الرابط عند توفره، مثل `/kernel/audit/?trace_id=AI-2026-10493`.
- إذا لم يوجد `trace_id` في الرابط، تختار الصفحة أحدث trace صالح من السجلات المحملة.
- زر نسخ مباشر لمعرف التتبع يعرض `Trace ID` بصيغة LTR داخل واجهة RTL.
- عرض مراحل التتبع الست بالترتيب:
  - `REQUEST_RECEIVED`
  - `PII_SCANNED`
  - `RISK_SCORED`
  - `APPROVAL_REQUESTED`
  - `MODEL_CALLED`
  - `EVIDENCE_GENERATED`
- كل مرحلة تعرض حالة مختصرة مثل مكتمل، غير مطلوب، بانتظار الموافقة، أو تم الحظر حسب بيانات السجل.
- كل مرحلة تعرض سياقاً مختصراً من السجل، مثل المستخدم، أنواع `PII`، درجة المخاطر، حالة الموافقة، النموذج، أو hash الدليل.
- يوجد fallback منظم: إذا كانت `/api/kernel/chain` ترجع audit events فعلية تستخدم الصفحة `eventType`، وإذا كانت ترجع interaction rows فقط تبني timeline من `action` وحقول السجل المتاحة.

التحقق البصري من `hash chain`:

- أسفل timeline يوجد شريط visual hash chain يعرض آخر hashes المحملة كنقاط مترابطة.
- إذا رجعت API حالة `VALID` أو `valid: true` يظهر المؤشر الأخضر `Hash chain مطابق بصرياً`.
- إذا رجعت API حالة `INVALID` أو `valid: false` يظهر مؤشر أحمر مع سبب مختصر.
- عند غياب حالة التحقق من API، تقارن الصفحة `previousHash` مع `recordHash` للسجلات المتتابعة المعروضة.

قواعد مهمة لسجل التدقيق:

- لا تغيّر صيغة `trace_id` المتوقعة؛ الواجهة تعتمد على نمط `AI-YYYY-00000`.
- أي إضافة مستقبلية لمراحل جديدة لازم تحافظ على المراحل الست الأساسية أعلاه لأنها تمثل مسار الحوكمة التشغيلي.
- لا تعتمد على `hash` وحده؛ دوال العرض تدعم `recordHash`, `record_hash`, و`hash` حتى تبقى متوافقة مع الإنتاج والـ mock.
- copy trace id يجب أن ينسخ قيمة `activeTraceId` فقط، وليس النص المعروض بعد تنسيقه.

## تحديث واجهة الموافقات

تم تطوير `kernel/approvals.html` لتكون لوحة مراجعة تشغيلية أوضح للطلبات التي تحتاج موافقة بشرية قبل التنفيذ.

الإضافات الحالية:

- `tabs` للحالات مع عدّادات مباشرة: قيد الانتظار، حرجة، الكل، مكتملة، مرفوضة، منتهية، ومصعّدة.
- ترتيب الطلبات حسب `riskScore`، افتراضياً من الأعلى خطراً إلى الأقل، مع خيار عكس الترتيب.
- تحديد جماعي للطلبات الظاهرة غير الحرجة فقط، حتى لا تدخل طلبات `critical` في الموافقة الجماعية بشكل افتراضي.
- شريط `bulk action` يظهر عند تحديد طلبات، ويدعم الموافقة الجماعية أو الرفض الجماعي بعد confirmation.
- رفض bulk يتطلب سبباً واضحاً حتى يبقى القرار قابلاً للتدقيق.
- منع `bulk approve` إذا تضمنت الطلبات المحددة أي طلب critical؛ هذه الطلبات تحتاج مراجعة فردية.
- كل بطاقة طلب تحتوي روابط مباشرة إلى `Audit` و`Evidence` باستخدام `trace_id` عند توفره.
- كل طلب يعرض سبب التصعيد بناءً على `riskScore`، البيانات الحساسة المكتشفة، السياسات المطابقة، حزمة الامتثال، وحالة SLA.

قواعد مهمة للموافقات:

- لا تجعل اعتماد الطلبات الحرجة ضمن أي تحديد افتراضي.
- أي تغيير في مسار approve/reject لازم يحافظ على الربط بين الطلب و`Audit` و`Evidence`.
- إذا تغير شكل payload القادم من `/api/kernel/approvals`، حدّث دوال التطبيع أو helpers داخل الصفحة بحيث تبقى `riskScore`, `riskLevel`, `traceId`, `requestId`, و`status` مدعومة.

كل صفحات HTML تعتمد على:

- `/kernel/assets/css/kernel.css`
- `/kernel/assets/js/kernel-utils.js`
- `/kernel/assets/js/kernel-api.js`
- `/kernel/assets/js/kernel-demo-store.js`
- `/kernel/assets/js/kernel-mock-handlers.js`
- `/kernel/assets/js/kernel-demo-banner.js`
- `/kernel/assets/js/kernel-nav.js`
- `/frontend/js/unified-header.js`
- `/frontend/js/production-runtime.v20260427.js`

بعض الصفحات تضيف وحدات مخصصة مثل `kernel-stats.js`, `kernel-reports.js`, `kernel-compliance.js`, `kernel-chat-client.js`, و`kernel-mobile.js`.

## وحدات JavaScript

| الملف | المسؤولية | أهم exports |
| --- | --- | --- |
| `kernel/assets/js/kernel-api.js` | API client للإنتاج، config runtime، timeout/retry، أخطاء API، وتطبيع بيانات الإحصائيات والسجلات. | `window.kernelAPI`, `window.KernelAPI`, `window.APIError`, `window.KernelRuntimeConfig`, `window.normalizeStats`, `window.KernelApiHelpers` |
| `kernel/assets/js/kernel-demo-store.js` | حالة demo mode، تحميل mock database عبر مسارات JSON نسبية، hardcoded fallback، localStorage، live feed، وتحديثات `kernel-demo-update`. | `window.KernelDemoStore`, `window.kernelShouldUseDemoData`, `window.kernelDemoDataSelected` |
| `kernel/assets/js/kernel-mock-handlers.js` | اعتراض `/api/kernel` عند تفعيل demo فقط، ومحاكاة chat/approvals/evidence/policies/providers/health مع HTTP status مطابق للأخطاء. | `window.KernelMockHandlers` |
| `kernel/assets/js/kernel-demo-banner.js` | واجهة banner وتبديل `بيانات تجريبية` وإعادة تعيين قاعدة demo. | `window.KernelDemoBanner` |
| `kernel/assets/js/kernel-utils.js` | أدوات مشتركة: escape HTML، formatters، debounce/throttle، theme، clipboard، animations. | `window.KernelUtils` |
| `kernel/assets/js/kernel-nav.js` | تعريف صفحات Kernel، بناء navigation، active route، عداد الموافقات، وشريط حالة المزود/قاعدة البيانات المشترك. | `window.KernelNav` |
| `kernel/assets/js/kernel-mobile.js` | drawer، bottom nav، touch gestures، pull-to-refresh، وسلوك الجوال. | `window.KernelMobile` |
| `kernel/assets/js/kernel-chat-client.js` | واجهة المحادثة، retry، typewriter، history، approve/reject من داخل المحادثة. | `window.KernelChatClient` |
| `kernel/assets/js/kernel-stats.js` | تحميل الإحصائيات، refresh دوري، charts، وتفاعل مع حدث `kernel-demo-update`. | `window.KernelStats` |
| `kernel/assets/js/kernel-reports.js` | تحميل التقارير، إنشاء تقرير، تحميل، جدولة، وفلاتر. | `window.KernelReports` |
| `kernel/assets/js/kernel-compliance.js` | تعريف أطر الامتثال ومتطلبات كل إطار وحساب الدرجات وعرض البطاقات. | `KernelCompliance` |

## CSS والتصميم

`kernel/assets/css/kernel.css` هو ملف التصميم الأساسي للواجهات. أهم ما يغطيه:

- متغيرات ألوان ومسافات وظلال داخل `:root`.
- دعم RTL عبر `html[dir="rtl"]`.
- layout مشترك للـ sidebar، main content، cards، tables، forms، badges، buttons، modals، toasts.
- responsive breakpoints للجوال والتابلت.
- حالات status/risk للموافقات، الإحصائيات، وسجل التدقيق.

الهوية البصرية الحالية داكنة ومؤسسية، مع cyan كـ brand color ودرجات success/warning/danger واضحة.

## تحديث توحيد واجهات Kernel

تمت إضافة طبقة `Kernel UI Unification Layer` في نهاية `kernel/assets/css/kernel.css` لتوحيد الشكل عبر صفحات Kernel بدون تغيير وظائف JavaScript أو مسارات API.

التحديث يغطي:

- توحيد radius البطاقات والأزرار والنماذج والجداول على نمط تشغيلي هادئ، مع حدود وتباين أوضح للحالات الداكنة والفاتحة.
- ضبط typography بدون scaling حسب عرض الشاشة، وإلغاء أي `letter-spacing` غير ضروري في العناوين والعناصر التشغيلية.
- إخفاء الـ legacy sidebar داخل صفحات Kernel لأن `kernel-nav.js` يرسم التنقل العلوي والـ mobile drawer حالياً، مع تصفير هامش `kernel-main`.
- منع horizontal overflow عبر `kernel-layout`, `kernel-main`, و`main-content`، وتقليل عرض grid الافتراضي للبطاقات في `scenarios`, `reports`, و`compliance`.
- توحيد أزرار `primary/secondary` في صفحات `scenarios`, `reports`, `evidence`, و`compliance` مع focus states واضحة.
- توحيد حالات `empty`, `loading`, `error`, و`skeleton` بحيث تعرض مظهراً ثابتاً قبل وصول بيانات JavaScript.

تحديثات الصفحات المرتبطة:

- `scenarios.html`: إصلاح التلف في زر إنشاء السيناريو داخل header وإكمال إغلاق `header/main-content` بشكل صحيح.
- `evidence.html`: استبدال الأدلة الثابتة وتفاصيل `EVD-001` بحالة skeleton أولية، ثم تعبئة القائمة والتفاصيل من `kernelAPI`.
- `reports.html`: استبدال كروت التقارير والجدول المجدول الثابت بحالات skeleton، وتفعيل `KernelReports.init()` لتحميل البيانات من `/api/kernel/reports`.
- `kernel-reports.js`: إضافة `renderScheduledReports()` لعرض التقارير المجدولة من البيانات القادمة أو إظهار empty state عند عدم وجودها، بدون تغيير endpoints.
- `compliance.html`: استبدال بطاقات الامتثال الثابتة وسجلات النسب بحالات skeleton، ثم تعبئتها من `KernelCompliance`.

قواعد مهمة لأي تعديل لاحق:

- لا تعيد إدخال بيانات HTML ثابتة داخل `evidence.html`, `reports.html`, أو `compliance.html` إذا كانت البيانات لها مصدر JS قائم.
- لا تضف sidebar جديد داخل HTML؛ التنقل الموحد مصدره `kernel-nav.js`.
- أي styles محلية داخل صفحة يجب أن تبقى قابلة للتجاوز من `kernel.css`، لأن طبقة التوحيد في نهاية الملف هي مصدر الشكل المشترك.
- لا تغيّر روابط الصفحات أو endpoints أثناء تعديل الواجهة؛ التعديل البصري يجب أن يبقى presentation-only.

## شريط حالة Kernel المشترك

تمت إضافة status bar مشترك لكل صفحات `kernel/` عبر `kernel/assets/js/kernel-nav.js`، ويظهر مباشرة أسفل تنقل Kernel العلوي. الشريط يقرأ حالتين فقط من واجهات الإنتاج:

- `/api/kernel/providers` لمعرفة المزود النشط وحالته.
- `/api/kernel/health` لمعرفة حالة قاعدة البيانات وصحة Kernel.

قواعد العرض:

- لا يعرض أي API key أو secrets أو raw provider payload.
- يعرض NVIDIA بصيغة `NVIDIA · Connected` فقط إذا كان `configured=true` و`mode=production`.
- يعرض حالة قاعدة البيانات كـ `Connected` أو `Degraded` بناءً على health response.
- يعرض `Degraded` بشكل واضح إذا كان المزود fallback أو `local` أو demo adapter.
- يعرض `Fallback / Local demo` في خانة mode عند تفعيل fallback أو local demo.
- عند تعذر الوصول إلى endpoints، يتحول الشريط إلى degraded state بدل fallback صامت.

التنسيق الخاص بالشريط موجود داخل `kernel/assets/css/kernel.css` تحت قسم `Shared Kernel Status Bar`.

## Production API

الواجهات تتعامل مع API تحت `/api/kernel`. أهم المسارات المستخدمة أو المدعومة من client/mock layer:

| Endpoint | الاستخدام |
| --- | --- |
| `/api/kernel/providers` | حالة المزود النشط وقائمة المزودين. |
| `/api/kernel/health` | صحة Kernel والمزود. |
| `/api/kernel/nvidia/status` | حالة NVIDIA الآمنة: `configured`, `model`, و`mode` فقط. |
| `/api/kernel/nvidia/chat` | محادثة NVIDIA عبر backend proxy فقط، مع حقن المفتاح من بيئة الخادم. |
| `/api/kernel/stats` | مؤشرات الاستخدام، المخاطر، PII، وأحدث traces. |
| `/api/kernel/audit` | سجل التدقيق مع فلاتر search/department/risk. |
| `/api/kernel/chain` | سلسلة التدقيق. |
| `/api/kernel/chain/verify` | التحقق من سلسلة التدقيق. |
| `/api/kernel/approvals` | جلب، اعتماد، أو رفض الطلبات. |
| `/api/kernel/pending` | alias للطلبات المعلقة. |
| `/api/kernel/evidence` | أدلة القرارات مع دعم `traceId` و`trace_id`. |
| `/api/kernel/evidence/:id` | تفاصيل أو تصدير سجل دليل واحد. |
| `/api/kernel/compliance` | حالة الامتثال. |
| `/api/kernel/compliance/check` | فحص امتثال. |
| `/api/kernel/chat` | إرسال رسالة chat إلى Kernel. |
| `/api/kernel/policies` | قراءة/إضافة سياسات. |
| `/api/kernel/policies/:id` | تعديل أو حذف سياسة. |
| `/api/kernel/reports` | تحميل التقارير من صفحة reports. |
| `/api/kernel/reports/generate` | إنشاء تقرير. |
| `/api/kernel/reports/:id/download` | تحميل تقرير. |
| `/api/kernel/reports/schedule` | جدولة تقرير. |

ملاحظة مهمة: mock handler داخل `kernel-mock-handlers.js` يغطي مسارات Kernel الأساسية مثل stats/audit/chain/approvals/evidence/compliance/chat/policies/providers/health. أما reports فتملك fallback محلي داخل `kernel-reports.js` عندما تكون `بيانات تجريبية` مفعلة أو عند `file://`.

## وضع البيانات التجريبية

المفتاح المستخدم (الاسم الفعلي موثّق في `kernel/legacy-disabled/mock/README.md` لأسباب أمنية — لا يُذكر هنا حرفياً لتفادي الـ attack surface):

```text
<localStorage flag — see kernel/legacy-disabled/mock/README.md>
```

القيم:

- `false`: الوضع الافتراضي. استخدم Production API ولا تعترض `/api/kernel`.
- `true`: فعّل mock interception واستخدم بيانات محلية صناعية.
- `file://`: يعتبر demo active تلقائياً مهما كانت قيمة localStorage، لأن fetch إلى API لا يكون متاحاً عادة.

Config runtime الواضح موجود في `kernel-api.js` عبر `window.BrightAIKernelConfig` قبل تحميل السكربت، ثم يقرأه `window.KernelRuntimeConfig` بعد التحميل:

```js
window.BrightAIKernelConfig = {
  baseURL: '/api/kernel',
  mode: 'auto', // auto | demo | mock | live | production
  demoStorageKey: '<localStorage flag — see kernel/legacy-disabled/mock/README.md>',
  timeout: 30000,
  retryAttempts: 3,
  retryDelays: [500, 1000, 2000],
  retryMethods: ['GET', 'HEAD', 'OPTIONS'],
};
```

معنى `mode`:

- `auto`: السلوك الافتراضي؛ يستخدم live في HTTP/HTTPS ما لم يفعّل المستخدم demo من localStorage، ويستخدم demo تلقائياً مع `file://`.
- `demo` أو `mock`: فعّل mock interception صراحة.
- `live` أو `production`: اجعل HTTP/HTTPS يستخدم production API ولا يفعل demo بسبب localStorage، مع بقاء `file://` fallback محمياً.

الفصل بين live وmock:

- `kernel-api.js` مسؤول عن production client فقط: timeout فعلي، retry فعلي للطلبات الآمنة، وتطبيع الاستجابات.
- `kernel-demo-store.js` مسؤول عن حالة demo وبياناتها المحلية، ولا يقرر أخطاء HTTP.
- `kernel-mock-handlers.js` مسؤول عن اعتراض fetch عندما تكون demo مفعلة فقط، ويرجع `Response` محلية بنفس شكل production قدر الإمكان.

مفاتيح localStorage ذات علاقة:

| المفتاح | الغرض |
| --- | --- |
| `<localStorage flag — see kernel/legacy-disabled/mock/README.md>` | اختيار المستخدم لوضع البيانات التجريبية. |
| `brightai_kernel_mock_db` | قاعدة mock موحدة بعد تحميل ملفات JSON أو hardcoded fallback. |
| `brightai-chat-<sessionId>` | سجل محادثة محلي داخل `kernel-chat-client.js`. |

قواعد مهمة:

- لا تجعل demo هو الافتراضي في HTTP/HTTPS.
- لا تضبط الـ localStorage flag لوضع demo إلى `true` عند فشل production API (الاسم موثّق في `kernel/legacy-disabled/mock/README.md`).
- لا تضف fallback تلقائي من live إلى mock داخل `kernel-api.js`؛ أخطاء live يجب أن تظهر كـ loading/error واضحة في الواجهة.
- حافظ على حالات loading/error متسقة: ابدأ بـ skeleton أو نص loading واضح، ثم اعرض empty/error بدون تغيير demo mode صامت.
- عند إضافة صفحة جديدة تستخدم `/api/kernel`، تأكد أنها تحمل `kernel-api.js` قبل أي سكربت يعتمد على `kernelAPI`.
- إذا احتجت fallback بصري، اربطه بـ `window.kernelShouldUseDemoData()` بدل fallback صامت دائماً.

## Mock Data

ملفات mock موجودة في `kernel/api/mock/`.

| الملف | الشكل | الاستخدام |
| --- | --- | --- |
| `kernel/api/mock/stats.json` | object | مؤشرات عامة وتوزيع حالات ومخاطر وأقسام. |
| `kernel/api/mock/audit.json` | object | `rows` و`entries` لسجل التدقيق. |
| `kernel/api/mock/approvals.json` | object | `pending`, `recent`, `summary`. |
| `kernel/api/mock/evidence.json` | object | قائمة أدلة وتفاصيل حسب trace/id. |
| `kernel/api/mock/compliance.json` | object | حالة أطر الامتثال. |
| `kernel/api/mock/policies.json` | array | 10 سياسات PII/امتثال افتراضية. |
| `kernel/api/mock/connectors.json` | array | fixture للموصلات. |
| `kernel/api/mock/scenarios.json` | array | fixture للسيناريوهات. |

عند تفعيل demo، يحاول `kernel-demo-store.js` تحميل:

- `stats.json`
- `audit.json`
- `approvals.json`
- `evidence.json`
- `compliance.json`
- `policies.json`

إذا فشل تحميل هذه الملفات، يستخدم hardcoded fallback داخل `kernel-demo-store.js`.

مهم لمسارات JSON:

- التحميل يستخدم مسارات نسبية مشتقة من موقع `kernel-demo-store.js` نفسه، مثل `../../api/mock/stats.json`.
- هذا ينتج `/kernel/api/mock/stats.json` على HTTP/HTTPS، وينتج مسار `file://.../kernel/api/mock/stats.json` عند فتح الصفحة محلياً.
- لا ترجع لاستخدام مسارات مطلقة داخل demo store مثل `/kernel/api/mock/*.json` لأنها تكسر `file://` fallback.

سلوك أخطاء mock:

| الحالة | HTTP status | errorCode |
| --- | --- | --- |
| JSON body غير صالح | `400` | `INVALID_JSON` |
| action غير مدعوم في approvals | `400` | `INVALID_ACTION` |
| body مطلوب وغير موجود | `400` | `BAD_REQUEST` |
| record أو policy غير موجود | `404` | `NOT_FOUND` |
| endpoint mock غير موجود | `404` | `MOCK_NOT_FOUND` |
| method غير مدعوم مثل `GET /chat` | `405` | `METHOD_NOT_ALLOWED` |

`kernel-mock-handlers.js` يجب ألا يرجع `200` لأخطاء منطقية؛ هذا ضروري حتى حالات error في الواجهة تكون متطابقة بين live وdemo.

ملاحظات عدادات demo:

- `recalculateSummaryStats()` يعد كل request مرة واحدة حتى لو كان له audit row وpending approval في نفس الوقت.
- `updateStatsDOMDirectly()` يتعامل مع `stat-pending` حسب الصفحة: dashboard يعرض `stats.pendingApproval`، وصفحة approvals تعرض `approvals.summary.totalPending`.

## Manifest

> **مُحدَّث 2026-07-15:** `kernel/manifest.json` انتقل إلى `kernel/legacy-disabled/manifest.json` (KRN-005). المحتوى أدناه وصفي للملف الأُرشيفي — ما يُستخدم في الـ Astro build.

`kernel/legacy-disabled/manifest.json` كان يعرّف تجربة PWA باسم:

```text
BrightAI Kernel - Enterprise AI Governance
```

ويحتوي على:

- `start_url: /kernel/`
- `scope: /kernel/`
- display standalone
- أيقونات inline SVG
- shortcuts إلى `/kernel/chat/` و`/kernel/stats/`

قاعدة manifest الحالية: استخدم نمط الدليل public route، وليس مسارات `.html` المباشرة، حتى يبقى متسقاً مع الروابط الداخلية وcanonical URLs داخل صفحات Kernel.

## إضافة صفحة جديدة

اتبع هذا النمط:

1. أنشئ HTML داخل `kernel/`.
2. استخدم `dir="rtl"` و`lang="ar"` أو ما يطابق الصفحة الحالية.
3. اربط `/kernel/assets/css/kernel.css`.
4. حمّل `kernel-utils.js`, ثم `kernel-api.js`, ثم `kernel-demo-store.js`, ثم `kernel-mock-handlers.js`, ثم `kernel-demo-banner.js`, ثم `kernel-nav.js`.
5. استدع `KernelNav.init('sidebarNav')` واضبط الصفحة النشطة عبر `KernelNav.setActive('<page-id>')`.
6. أضف الصفحة إلى `KernelNav.config.pages` داخل `kernel-nav.js`.
7. أضف الصفحة إلى قسم `BRIGHTAI_INTERNAL_LINKS` الموحد في كل صفحات `kernel/*.html`، وتأكد أن كل الروابط تستخدم نمط `/kernel/<page>/`.
8. أضف breadcrumb مرئية تطابق `BreadcrumbList` في JSON-LD.
9. إذا استخدمت `/api/kernel` لا تضف fallback demo صامت؛ اعتمد على `window.kernelShouldUseDemoData()`.
10. حدّث هذا README إذا تغيرت البنية أو ظهرت واجهة جديدة.

## تعديل API أو demo mode

قبل تعديل API أو demo mode راجع هذه المناطق:

- `normalizeStats`
- `KernelAPI` داخل `kernel-api.js`
- `DEFAULT_RUNTIME_CONFIG` و`KernelRuntimeConfig` داخل `kernel-api.js`
- `getHardcodedDefaults` و`ensureDBInitialized` داخل `kernel-demo-store.js`
- مسارات mock JSON النسبية داخل `kernel-demo-store.js`
- `handleMockRequest` وfetch wrapper (حول الـ fetch global) داخل `kernel-mock-handlers.js`
- HTTP status في `jsonResponse()` داخل `kernel-mock-handlers.js`
- `injectBannerUI` و`updateBannerUI` داخل `kernel-demo-banner.js`
- exports في نهاية كل ملف مشترك

قواعد القبول الأساسية لأي تعديل هنا:

- production request timeout/retry يبقى داخل `kernel-api.js`.
- mock لا يعمل إلا عندما `window.kernelShouldUseDemoData()` ترجع `true`.
- `file://` يبقى demo fallback تلقائي.
- أخطاء mock ترجع HTTP status صحيح ولا تتنكر كـ `200`.
- لا تستخدم نفس DOM id مثل `stat-pending` لمعنيين في نفس الصفحة بدون guard واضح.

بعد التعديل، شغّل:

```bash
node -c kernel/assets/js/kernel-api.js
node -c kernel/assets/js/kernel-demo-store.js
node -c kernel/assets/js/kernel-mock-handlers.js
node -c kernel/assets/js/kernel-demo-banner.js
```

وشغّل syntax check لأي JS آخر تغير.

## أوامر التحقق

الأوامر الموصى بها بعد أي تعديل في `kernel/`:

```bash
git diff --check
node -c kernel/assets/js/kernel-api.js
node -c kernel/assets/js/kernel-demo-store.js
node -c kernel/assets/js/kernel-mock-handlers.js
node -c kernel/assets/js/kernel-demo-banner.js
node -c kernel/assets/js/kernel-stats.js
node -c kernel/assets/js/kernel-reports.js
npm run seo:gate
```

بعد تعديل `kernel/index.html` تحديداً، تحقق أيضاً من السكربت المضمن وSEO المحلي:

```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('kernel/index.html','utf8'); const scripts=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]); const json=scripts.find(s=>s.includes('schema.org')); JSON.parse(json); scripts.filter(s=>!s.trim().startsWith('{')&&!s.trim().startsWith('[')).forEach(s=>new Function(s)); console.log('json-ld and inline scripts ok');"
node scripts/seo-health-check.mjs
```

وإذا كانت أداة `google-indexing-seo-guardian` متاحة داخل `.agents/skills`، شغّل فحص الصفحة المباشر:

```bash
python3 .agents/skills/google-indexing-seo-guardian/scripts/google_indexing_audit.py kernel/index.html
```

إذا تغيرت روابط داخل HTML أو بنية navigation، شغّل أيضاً:

```bash
npm run internal-links:audit
```

إذا كان التعديل أوسع أو يمس سطح النشر، شغّل:

```bash
npm run verify:all
```

## ملاحظات نشر

- السطح هنا HTML ثابت ويُعامل كجزء من سطح SEO/Render static.
- لا تفترض أن README أو logs القديمة تعكس الحالة الحالية؛ شغّل gate الحي قبل الحكم.
- `render.yaml` هو مصدر الحقيقة لمسار النشر العام في المشروع.
- لا تضع أسرار أو مفاتيح API داخل ملفات `kernel/`؛ واجهات HTML عامة.

## قائمة صيانة سريعة

عند أي تغيير مستقبلي:

- تأكد أن production هو الافتراضي.
- تأكد أن `بيانات تجريبية` اختيار صريح.
- حافظ على fallback `file://`.
- لا تكسر `kernel-demo-update` لأنه ينعش الإحصائيات والموافقات عند demo.
- لا تغيّر mock schema بدون تحديث normalize functions والصفحات المستهلكة.
- حدّث README مع أي صفحة أو ملف mock أو endpoint جديد.

### التعديلات المنفذة

- إزالة `user-scalable=no` و`maximum-scale=1.0` من صفحات Kernel التي كانت تمنع التكبير.
- تحديث `kernel/assets/js/kernel-mobile.js` حتى لا يعيد فرض منع التكبير ديناميكياً.
- إضافة `aria-label` للأزرار الأيقونية المستهدفة مثل تبديل المظهر، فتح القائمة، إغلاق المودال، إغلاق التنبيه، وقائمة المزيد.
- تقوية focus states في CSS المشترك وتحسين ظهور focus في dropdown.
- إضافة landmarks وbreadcrumb مرئية محسنة في `audit.html` و`evidence.html`.
- تحويل عناصر `audit/evidence` التفاعلية إلى أزرار فعلية ودعم حالة `aria-pressed`.
- إضافة focus trap وإعادة التركيز للـ drawer/dropdown في `kernel-nav.js` و`kernel-mobile.js`.
- توحيد `aria-expanded` كنصوص، وإضافة `lang="en"` للنصوص اللاتينية داخل صفحات التدقيق والأدلة.
- تحسين contrast لأزرار success/danger وأزرار primary المحلية في صفحات reports/scenarios/compliance.
- احترام `prefers-reduced-motion` في عدادات JS، تأثير typewriter، وscroll smooth في connectors.
- رفع touch targets للأزرار الأساسية إلى 44px أو أكثر.
