# Analytics, search visibility & documentation — 2026-11-26

الحالة: **PARTIAL**. تنفيذ محلي موثّق؛ البيانات الحية والتقارير الخارجية لم تُتحقق. تبعية المرحلتين 03 و10 مُراعاة: لم يُمسّ Request Access ولا shell الـMagicPath، ولم يُحذف أي ملف.

## النطاق والأدوات

- متاح فعليًا في هذه الجلسة: PostHog، Sentry، Playwright، MagicPath، وأوامر المشروع المحلية.
- غير متاح في هذه الجلسة: Windsor وOpenSEO وFirecrawl وchrome-devtools وLinear. هذه مُعدّة في `opencode.json` داخل المشروع لكنها غير محمّلة هنا، لذلك لم تُستخدم ولم يُدعَ استخدامها.
- الأرقام الواردة في الطلب (Windsor: 152 جلسة brightai.live و48 local؛ GSC: 783 impressions و12 clicks بين 26 أكتوبر و22 نوفمبر) عُوملت كمعطى من مالك المشروع، لا كقيمة تحققتُ منها.
- لا ضمان ترتيب (ranking) ولا ادعاء امتثال أو جاهزية إنتاج.

## قبل / بعد

| البند | قبل | بعد |
|---|---|---|
| نطاق GA4 | وسم واحد `G-9LMB4PGTWJ` يُحمّل على كل مضيف، بما فيه localhost وstaging، فتختلط جلسات التطوير بتقارير التسويق | وسم واحد بلا تكرار: SSR يحذف السكربتات تمامًا خارج `brightai.live` و`www.brightai.live`، وفي HTML المُجمّد يضبط الحارس `ga-disable` قبل تحميل gtag على أي مضيف غير معتمد |
| CSP | تجزئة `GA_INIT` تطابق المقتطف القديم | تجزئة محدَّثة للمقتطف نفسه؛ لم يُضف نطاق ولا `unsafe-*` ولا توسيع `connect-src` |
| README | تنبيه 2026-07-18 في الأعلى بوصفه الوصف التشغيلي، بلا قسم معماري حالي | `Current Architecture` أولًا، ثم `Protected surfaces`، ثم `Historical archive` واضحًا، ثم `Current operating checks`؛ كل النص الأصلي محفوظ |
| MagicPath / التجربة | بيانات الجلسة المحلية لا تُرسل؛ زر الموافقة خاص بالتصدير المحلي فقط | لم يُضف متتبع ولا حدث جديد؛ لا واجهة موافقة تحليلات معتمدة بعد، فأُبقي telemetry العام منفصلًا عن بيانات التجربة |
| فهرسة | فحص بناء يفرض 67 صفحة وcanonical ذاتيًا | بلا تغيير: البناء PASS والفحص نفسه PASS |

## الأدلة

- `npm run build`: **PASS** — 67 صفحة قابلة للفهرسة في sitemap وllms.txt، وتغطية aliases عبر redirects.
- اختبارات مستهدفة: **65/66 PASS**. الفشل الواحد قديم قبل هذا العمل في `tests/ga4-attribution.test.mjs:30` (تأكيد stale على `{!confidential && <GoogleAnalytics />}` في AppLayout)؛ لم أعدّل الاختبار ولا الكود المرتبط به لإخفائه.
- حارس المضيف، مُنفَّذ على المقتطف نفسه بـ`vm`:
  - `http://localhost:4321/about/` → `disabled:true`, `configs:0`
  - `https://brightai.live/about/` → `disabled:false`, `configs:1`
  - `https://staging.example.test/about/` → `disabled:true`, `configs:0`
- لا وسم GA4 مكرر: `GoogleAnalytics.astro` هو المكوّن الوحيد المستخدم؛ ملف `GoogleAnalytics 2.astro` ما زال موجودًا ولم يُحذف، ولا يشير إليه أي مصدر (يمنع اختبار `ga4-attribution` ضمنيًا استخدامه).
- خصوصية الحمولة: قوائم السماح في `measurement-core.mjs` و`url-policy.mjs` و`redact.mjs` ترفض النص الحر والاستعلامات غير المعتمدة والمعرفات؛ لم يُرسل prompt ولا reason ولا بريد ولا hash ولا token.
- مراقبة متاحة للقراءة فقط: PostHog project 768444 بـ`ingested_event:false`؛ منظمة Sentry `659ec3bf0cec` بلا مشاريع مرئية. لم تُعرض رموز أو مفاتيح في هذا التقرير.
- Secure Chat: `AppLayout` يمرر `confidential` فيمنع GA4 وMonitoringGate، وCSP يبقى `'self'` للسكربت والاتصال. لم يُخفَّف.

## مفتوح / غير متحقق

- خدمات Windsor وGSC وOpenSEO وFirecrawl وchrome-devtools وLinear غير متاحة هنا: لا فحص URL حي، لا URL inspections، لا ربط نطاق OpenSEO (Default بلا domain)، ولا تقارير قبل/بعد حية. لا ضمان ترتيب.
- لا معرّف stream مخصص مقدم من المالك؛ لذلك اختير تعطيل التطوير بدل اختراع معرّف ثانٍ. تحويل المضيف إلى stream مستقل يحتاج إذنًا ومعرّفًا معتمدًا.
- أحداث navigation/start/evaluate/review/export/CTA تحتاج قرار مالك حول واجهة موافقة تحليلات مستقلة؛ مربع موافقة الحالي في `/demo/governance/` خاص بتصدير المحاكاة إلى جهاز المستخدم، ولا يجوز خلطه بالموافقة على القياس.
- ملفات اللاحقة ` 2` لم تُحذف، التزامًا بالطلب؛ أي حذف مستقبلي يتحقق أولًا من dynamic routes وimports والبناء.
- لم يُنشر ولا غيّر إعدادات Cloudflare أو Render أو السحابة؛ حالة الإنتاج ما زالت NOT VERIFIED.

## الملفات المعدّلة

- `src/components/GoogleAnalytics.astro`
- `src/server/kernel/unavailable.mjs`
- `src/server/observability/security-policy.mjs`
- `README.md`
- `Audit/analytics-seo-2026-11-26/REPORT.md`
