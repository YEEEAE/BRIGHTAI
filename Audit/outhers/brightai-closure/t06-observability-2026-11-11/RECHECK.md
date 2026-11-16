# T06 — إعادة تحقق التنفيذ المحلي

- الحالة: PARTIAL؛ لا عيب محلي جديد ثبت؛ لا إعادة إصلاح أو تغيير وظيفي شكلي.
- SHA النهائي: `b0c1bd415911aec4d24326a7c89dc5f3811c8ae8`، main؛ مختلف عن baseline `6a3d53f41b5bd1af59eb320245745498765bd320`. تغييرات D07 الموجودة محفوظة.
- البيئة: macOS، Node v22.22.2، Astro dev الحالي على127.0.0.1:4426، Chrome157 بسياق معزول؛ 2026-11-11T17:39–17:41Z (20:39–20:41 السعودية).

| الفحص | الوقت UTC | النتيجة |
|---|---|---|
| `node --import ./tests/helpers/no-egress.mjs --test tests/observability.test.mjs` |17:39:16| PASS19/19،0FAIL،0SKIP؛ gates/opt-out/kill switches/collector500+throw/redaction |
| معاينة payload بالسكربت نفسه معno-egress |17:39:16| PASS؛6Sentry+6PostHog؛10حالات سلبية؛ `recheck-payload-preview.json`؛ IDs اصطناعية وليست ingestion |
| Chrome علىdocs معq/token/fragment/utm اصطناعية |17:39:57| PASS احتواء محلي؛ صفرanalytics requests وصفرexternal scripts؛ dataLayer محلية تحذفq/token/fragment، وتبقيutm_source؛ referrer فارغ |
| POST اصطناعي واحد إلىrelay المحلي المعطل |17:40:28| PASS204 بلاbody؛ Networkreqid57: لاCookie/Authorization وReferer فارغ؛ لا إرسال مزود |
| Sentry `find_projects(fresh=true)` |هذه الجولة| projects=[]،hasMore=false |
| PostHog `projects-get` |هذه الجولة| مشروع وحيد720936؛ingested_event=false؛ ليس تعدادًا تاريخيًا للأحداث |
| PostHog `events-retention-get` |17:40| project/organization retention=null؛default12month؛plan max12؛default_period_deletes=false؛retention_months/retained_from/next_deletion_on=null؛first_pass_on2027-03-03؛ لا إثبات حذف فعلي أو سياسة30يوم معتمدة |
| Canary/eventID/alert/deployed journey |—| NOT RUN؛ الوجهة والاحتفاظ والقناة والتفويض غير معتمدة |
| Build/E2E |—| NOT RUN؛ لا تغيير منطق يقتضيهما |

## حدود الإثبات

- POST المتصفح أُنشئ يدويًا بحقولq/token لا ينبغي أن يرسلها العميل الفعلي؛ لا نعتبره إثبات تنقية العميل. عند التعطيل تعيدAPI204 قبل parsing وتتخلص من الطلب؛ ليس إثبات رفض400 في الوضع المفعّل. رفض الحقول بالمحول مثبت باختبارات منفصلة؛ لا إثبات استقبال خارجي.
- Network عرض طلبrelay المحلي وحده معطلبات شعار محلية؛ لم يُرسل marker إلىSentry/PostHog/Google. نجاح204 ليسcanary ولاeventID.
- لا تغير فيGA4/الموافقة/معالجة فشل الوجهة؛ إعادة التحقق مرتبطة باختلافHEAD، لا تعويضًا لغياب القياس الخارجي. قيمUTM والمسارات العامة تبقى غير معتمدة للنقل، وloader مازال غائبًا.
- إعداداتIP/console/perf/replay السابقة HISTORICAL في هذه الجولة؛ لم تُقرأ project-get لأنه يعيدtoken، ولم نحتج قراءة credential. لا استعلام أحداث عملاء.
- لم تُنشأ مشاريع أوتُغير إعدادات أوتُرسلcanary/alert؛ لا.env/workflow/branch/commit/push/deploy. Hero/header/logo/Constellation/CSS بلا تغيير.

## خطوات خارجية محددة تنتظر التفويض

1. Privacy/المالك: اعتمادPostHog720936 للـstaging/Beta فقط، والأحداث الخمسة الحالية، واحتفاظ شهر واحد؛ اعتمادSentry للأخطاء معاحتفاظ90يوم إذا سمحت الخطة بلا تكلفة. إنشاءSentry project يحتاج تفويضًا منفصلًا، ولا نفترض فريقًا مخولًا.
2. Privacy/المالك: تفويضanonymize_ips=true وتعطيلconsole/performance/replay/autocapture بالمشروع؛ لا تغيير الآن.
3. Observability/SRE: بعد اعتماد الوجهة وحقن الأسرار عبرقناة مخولة، تفويضcanary اصطناعي واحد لكلطبقة معreadback؛ دونترقية أوشراء أوتعديل.env تلقائي.
4. SRE/المالك: تسميةon-call وincident commander وrollback owner وقناةتنبيه؛ تفويضalert واحد إلىالوجهة المحددة. القناة المقترحة#ops-alerts ليست قناةعاملة.
5. T01/T03: رحلةحقيقية علىنسخةمنشورة وجلسةمخولة؛ لا نشرضمنT06 المحلي.

القرار: Internal NOT READY لقبولالمراقبة؛ Public NO-GO لإغلاقT06؛ Commercial NO-GO. التراجع: لاشيفرةتغيرت؛ أبقِloader معطلًا واستخدمkill switch للطبقةالمتأثرة عندتفعيلها مستقبلًا، بلاحذفأحداثبعيدة.
