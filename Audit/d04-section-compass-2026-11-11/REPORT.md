# D04 — Section compass collision closure

- الحالة: DONE محليًا للنطاق المقاس؛ PASS ≠ RELEASED.
- التاريخ: 2026-11-11؛ أوقات القياس أدناه UTC (الرياض +03:00).
- الفرع: `main`؛ SHA قبل/بعد: `9bda61d288746c5392a2bdc0da8162910407a94b` + التعديلات المحلية. خط الأساس المطلوب `6a3d53f41b5bd1af59eb320245745498765bd320` مختلف؛ أُعيد فحص HEAD وworking tree قبل التحرير؛ البداية نظيفة.
- البيئة: Node v22.22.2، Astro dev من المصدر الحالي، `http://127.0.0.1:4424/products/`؛ Chrome DevTools viewport emulation، deviceScaleFactor=1. لا بيانات عملاء أو اتصال بقاعدة بيانات ضمن الاختبار.

## السبب والتغيير

E12 تاريخي؛ أُعيد الإنتاج محليًا: عند innerWidth=390/innerHeight=844، القائمة المفتوحة كانت x12/y506.328/w337.055/h325.672 وتحجب روابط Human Gate/Ledger/Secure Chat ورابط استكشاف Firewall. الحارس القديم يفحص `.button` فقط ويستثني القائمة المفتوحة. عند 1440×770 لم يظهر تقاطع في نقطتي التمرير المقاسوَتين؛ لا ادعاء إعادة إنتاج اصطدام الديسكتوب التاريخي.

نُقل disclosure إلى أسفل breadcrumb داخل تدفق PageShell. فتحه يحجز مساحة بدل تغطية المحتوى، ولا يبقى مثبتًا أثناء القراءة. أُزيل حارس الاصطدام ومراقب footer غير اللازمين. بقي Escape واختيار القسم، وأُصلح تركيز الغلق خارج القائمة، وأُضيف focus-visible للرابط. CSS محصور في section-compass؛ safe-area يمين/يسار/أسفل محفوظ عبر env(). لم تُعدّل Hero/Header/Logo/Constellation أو نصوصها وروابطها؛ الصفحة الرئيسية لا تستورد interior.css.

## دليل النسخة النهائية

جميع الصفوف على SHA والبيئة أعلاه مع working tree النهائي؛ لم يتغير المصدر بعد هذه القياسات.

| الوقت UTC | الفحص | النتيجة |
|---|---|---|
| 11:47:30 | 390×844 فعلي؛ closed؛ position static | PASS؛ scrollWidth=390؛ rect x20/y226/w350/h62.695 |
| 11:48:26 | 390×844 فعلي؛ فتح disclosure؛ تقاطع rect مع main h1/h2/p/a خارج الفهرس | PASS؛ open=true؛ rect x20/y226/w350/h325.672؛ overlap=[]؛ scrollWidth=390 |
| 11:56:56 (وقت قراءة الغلق) | Tab إلى أول رابط ثم Escape بمفاتيح المتصفح | PASS؛ focus-visible=true، إطار rgb(255,184,41) solid 2px؛ closed، focus=SUMMARY وإطار ظاهر |
| 11:57:34 | 1440×770 فعلي؛ القائمة مفتوحة؛ نفس فحص التقاطع | PASS؛ rect x80/y225/w1280/h325.672؛ overlap=[]؛ scrollWidth=1440 |
| 11:59:51 | اختيار أول رابط بالقائمة؛ فحص زر «اطلب عرض سعر» بعد تمرير إليه | PASS؛ closed=true؛ focus=H2#catalog-title؛ hash مطابق؛ elementFromPoint يصل إلى الزر؛ scrollWidth=1440 |
| 12:01:57 | 390×844 فعلي؛ زر «اطلب عرض سعر» في العرض | PASS؛ elementFromPoint يصل إلى الزر؛ scrollWidth=390؛ الفهرس أعلى منطقة العرض، لا يغطيه |
| 12:07:22 | pointerdown اصطناعي خارج القائمة مع تركيز رابط داخلي | PASS للمعالج؛ closed=true وfocus=SUMMARY؛ ليس اختبار لمس مادي |
| 11:59:52 | git diff --check على المصدر النهائي | PASS |

safe-area: المصدر يحافظ على env(safe-area-inset-*). المحاكاة تعطي inset=0؛ جهاز ذو notch/inset غير صفري NOT RUN، ولا ندعي قياسه. 320px/zoom وbuild/E2E/unit suite NOT RUN: لا خطر إضافي محدد يستدعي مصفوفة أو حزمة اختبارات. لم تُضف اختبارات آلية لتغيير CSS؛ السيناريو القصير يغطي تغيير التركيز.

## الأدوات والحدود

Modern Web Guidance وKeyboard Navigation قُرئتا؛ بحث npm offline فشل ENOTCACHED، واستُخدمت أدلة scrollspy/navigation-drawer المرفقة بالمهارة، مع الإبقاء على details وIntersectionObserver المتوافقين بدل إدخال drawer أو اعتماد جديد. graphify-out/graph.json غير موجود. Chrome DevTools استُخدم فعليًا؛ تعثر بعض الاستدعاءات في مراجعة الموافقة التلقائية قبل التنفيذ، ثم نجحت المحاولات المسموحة؛ لا تُحسب المحاولات المتعثرة PASS. لا داعي لبيانات Neon/SEO/analytics أو تصميم خارجي لهذا العيب.

## المصدر والمحلي والمنشور والاعتماد

- المصدر: تغيير محلي في PageShell/InteriorController/interior.css فقط، مع هذا التقرير والعقل.
- المحلي: الصفحات العامة باستخدام PageShell؛ التحقق السلوكي على `/products/` بالمقاسين المذكورين. لا شهادة لكل صفحة أو متصفح أو جهاز.
- المنشور: NOT RUN؛ لا push/deploy أو قياس جديد للموقع المنشور. مانع نقل الإصلاح للحي: تفويض وتنفيذ النشر؛ المالك/DevOps.
- Internal: قبول محلي لهذا العيب فقط؛ جاهزية النظام الكلية لم تتغير.
- Public: لا GO جديد؛ الإصلاح غير منشور.
- Commercial: لا GO جديد؛ لا اعتماد تجاري ناتج عن هذا الفحص.

## التراجع

أعد تغييرات هذا النطاق في الملفات الثلاثة فقط دون reset/stash أو مسّ عمل آخر. إذا عُدّل الموضع مجددًا، احتفظ بـsafe-area insets؛ لا تستعد CSS ثابتة دون إعادة قياس الاصطدام. لا branch/commit/push/PR/merge/deploy أو تغييرات env/workflows.
