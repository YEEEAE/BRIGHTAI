# تدقيق تجربة المستخدم والمسارات — BRIGHTAI

**نافذة فحص الموقع المنشور:** 17 نوفمبر 2026، قرابة 23:06–23:14 بتوقيت السعودية؛ استُكملت الاختبارات المحلية بعدها.  
**النسخة المحلية ومرجع GitHub `main`:** `4c53c08ac900f9544ad0e0ec2f25be6767ff71e0`؛ مطابقة الرأسين بقراءة `git ls-remote`، وكانت شجرة العمل نظيفة عند بدء الفحص.  
**حالة التدقيق:** PARTIAL؛ حجب Cloudflare يمنع إثبات الرحلات العامة المنشورة، بينما فُحصت نسخة محلية معزولة بلا أسرار أو بيانات مؤسسات.

## النتيجة

تظهر للمستخدمين من نقاط الفحص المستخدمة صفحة Cloudflare `Error 1000` باستجابة HTTP `403` بدل الموقع. تأكد ذلك من المتصفح وطلبات HTTP وFirecrawl، في نافذة الفحص أعلاه. لذلك لا يمكن الجزم بوضع 404 أو التحويلات أو التطبيق خلف الحجب في الإنتاج. صفحة Cloudflare تعرض أن النطاق يشير إلى IP محظور؛ توثيق Cloudflare يذكر عدة أسباب ممكنة لهذا الخطأ [1]. قراءة إعدادات منطقة `brightai.live` عبر Cloudflare، دون كتابة، وجدت سجلّي A مفعّلين عبر البروكسي بقيمتين `104.21.27.121` و`172.67.169.70`، وسجلّي AAAA بالقيمتين `2606:4700:3035::6815:1b79` و`2606:4700:3033::ac43:a946`. جميعها تقع ضمن شبكات Cloudflare المنشورة [2] [3]. هذا سبب مرجّح قوي، وليس إثباتًا مستقلًا لعنوان الأصل الصحيح أو تفويضًا بتغيير DNS. لا تستبدل السجلات حتى يؤكد مالك الاستضافة الأصل المعتمد والربط الصحيح.

في نسخة مؤقتة معزولة من المصدر نفسه، وبدون ملفات `.env` أو اعتماد قاعدة بيانات، نجح البناء باستخدام Node `22.22.3` وAstro `6.4.8` المطابقين لـ`package-lock.json`. سجل البناء 64 صفحة عامة في sitemap؛ هذا **دليل محلي لا دليل نشر**. في معاينة Astro عُرضت 80 صفحة بحالة 200، و`/app/` بحالة 302 إلى `/app/kernel/`، و`/404/` بحالة 404، من أصل 82 مسار صفحة محددًا؛ هذه الاستجابات لا تثبت جلسة أو وصولًا مخوّلًا. في خادم Node المبني محليًا بدون إعداد بوابة أو أسرار، أعاد `/app/` و`/app/api/kernel/` و`/healthz/` الحالة 503، بما يتفق مع بيئة غير مهيأة، لا مع حالة الإنتاج.

في نسخة Node المحلية فقط، نجح اختبار 152 تحويلًا بـGET وHEAD، أي 304 طلبات: كلها `301` إلى الوجهة المسجلة مع الاحتفاظ بـ`?audit=1`. أمّا وضع تطوير Astro فأظهر 150 تحويلًا يفقد الاستعلام، ومسارين أعادا 404؛ هذه نتيجة خاصة بوضع التطوير ولا تنقض نتيجة خادم Node ولا تثبت حالة الحافة الحية. المسار غير الموجود و`/404/` أعادا 404 في Node المحلي.

## حدود الأدلة والأدوات

- GitHub للقراءة فقط: مقارنة SHA لفرع `main` عبر `git ls-remote` بالمستودع المحلي؛ لم يُدفع أو يُنشر أي شيء.
- Firecrawl Map أعاد 45 رابطًا مفهرسًا تقريبًا مع عناوين وأوصاف؛ هو فهرس قابل للتقادم وليس جردًا مثبتًا للحي. `firecrawl_scrape` مع `maxAge: 0` أعاد خطأ Cloudflare نفسه للرئيسية والمنتجات، لذلك لم تُجرد روابط الصفحات الحية من محتواها الحالي.
- المتصفح فحص صفحة الحجب الحية، ثم مسارات اصطناعية في المعاينة المحلية: Firewall وKernel وRisk Engine وHuman Gate وLedger والمحاكي الافتراضي لـSecure Chat؛ النتائج التفصيلية أدناه لا تثبت تشغيل الحي أو الأمان الإنتاجي، ولم يُفعّل مزود حي.
- جرد HTML المحلي الآلي شمل 82 مسارًا و3,072 ظهورًا لرابط داخلي ثابت، بما في ذلك صفحات البوابة المعروضة في وضع التطوير؛ لا يشمل الروابط التي لا يولدها HTML إلا بتفاعل أو جلسة. ربط المسارات بالمصدر لم يجد مسار رابط ثابتًا غير معروف، لكنه كشف مرساتين مفقودتين. لا يعني ذلك أن جميع الروابط الحية تعمل.
- طُبقت مهارات المشروع `accessibility-audit` و`heuristic-evaluation` و`keyboard-review` و`responsive-review` و`wayfinding-navigation` و`ui-ux-pro-max/design-system` مع إرشادات web.dev وWCAG 2.2 [4] [5] [6]. لم تظهر أداة مستقلة باسم Modern Web Guidance؛ استُخدمت إرشادات web.dev بدلًا منها. روجعت أيضًا رحلة تسجيل مرجعية من **UI by Made Good Designs** للمقارنة، لا كدليل على تنفيذ BRIGHTAI [7].
- لم تُختبر جلسة حقيقية، قاعدة بيانات، إرسال استفسار، دفع، إنتاج، قارئ شاشة حقيقي، أو جميع مقاسات الجوال والتكبير. لا توجد شهادة WCAG أو إثبات جاهزية إنتاج في هذا التدقيق.

## Findings

**معيار الأولوية:** P0 انقطاع عام في نقاط الفحص أو عائق تشغيلي حرج؛ P1 تضليل مهم في رحلة أساسية أو إفصاح بيانات؛ P2 احتكاك محدود أو مشكلة اتساق في التطوير. تعذر الاختبار وحده ليس Finding بفشل مثبت.

| ID | severity | URL | file | evidence | user impact | recommendation | acceptance criteria |
|---|---|---|---|---|---|---|---|
| UX-01 | P0 | `https://brightai.live/` وباقي المسارات المفحوصة | إعدادات Cloudflare DNS للنطاق؛ ليس خللًا مثبتًا في ملف مصدر | المتصفح وFirecrawl وHTTP أعادوا `403 / Error 1000`؛ سجلا A وسجلا AAAA المشار إليها أعلاه ضمن شبكات Cloudflare [1] [2] [3]. | لا يصل الزائر لمحتوى الموقع أو للمنتجات أو التواصل من نقاط الفحص. | راجع مع مالك DNS والاستضافة عنوان الأصل المعتمد وCloudflare for SaaS أو الحلقات المحتملة، ثم عالج التوجيه بإجراء تشغيلي منفصل معتمد. لا تخمّن IP ولا تعدّل DNS ضمن التدقيق. | من شبكتين مستقلتين: الرئيسية والصفحات العامة تعرض محتواها المتوقع، و404 حقيقي للمفقود، والتحويلات والـAPI حسب بيئة النشر؛ تحقق DNS والأصل دون حلقات. |
| UX-02 | P1 | `/pricing/` و`/contact/` → `/products/#lab` | `src/pages/pricing.astro:11`، `src/pages/contact.astro:30`، `src/pages/products/index.astro` | HTML المحلي والمتصفح: الرابط ينتهي عند `/products/#lab` لكن `document.getElementById('lab')` يساوي null. | يصل الزائر للكتالوج لكن لا ينتقل إلى الموضع الموعود ولا يحصل على هدف تركيز للمرساة. | اجعل الرابط إلى قسم موجود وواضح أو أنشئ مرساة وصفية قابلة للتركيز في الكتالوج. | الرابطان يفتحان القسم الصحيح ويضعان التركيز المرئي المناسب؛ اختبر مع JavaScript وبدونه وعلى لوحة المفاتيح والجوال. |
| UX-03 | P2 | `/knowledge` و`/docs/حوكمة الذكاء الاصطناعي في السعودية`، والتحويلات في وضع التطوير | `redirects.json`، `src/middleware.ts:96-106`، `scripts/server.mjs:72-75` | في `astro dev`: أول مسارين 404 و150 تحويلًا يفقد `?audit=1`. في خادم Node المبني نفسه نجحت كل 304 طلبات GET/HEAD على 152 alias وحُفظ الاستعلام. | اختلاف وضع التطوير عن مسار النشر المقصود يجعل اختبارات الروابط المحلية مضللة، وقد يفقد سياقًا أثناء تجربة المطور. | اختبر عقد التحويل بخادم Node المبني بدل الاعتماد على dev؛ وإن كان توافق dev مطلوبًا أصلح السلوك مع اختبار منفصل. | اختبار مميز للبيئتين يحدد الحالة والوجهة والاستعلام، مع `301` صحيح على خادم الإصدار؛ الحافة المنشورة تُفحص بعد استعادة الموقع. |
| UX-04 | P1 | `/products/secure-chat/` | `src/components/LabShell.astro:15`، `src/components/SecureChatDemo.astro:5-9,41-46`، `src/server/ai/public-sandbox-limiter.mjs:8,13-16,27` | الحاوية تقول دائمًا «دون اتصال بخدمة»، لكن المختبر يحتوي مسارًا اختياريًا بموافقة يرسل نص الإدخال إلى خادم الموقع؛ عند تفعيل إعدادات الخادم وتجاوز الحماية قد يرسل الخادم النص المعالج إلى Groq. زر الموافقة والنص التحذيري موجودان؛ لم نفعّل المسار أو نتحقق من إتاحته حيًا. | العبارة العامة تصبح مضللة عند تفعيل المسار؛ قد لا يفهم الزائر أن النص يغادر المتصفح إلى خادم الموقع حتى لو كان إرسال المزود معطّلًا. | سمِّ الوضع الافتراضي «محلي» وميّز بوضوح قبل التفعيل بين المتصفح وخادم الموقع والمزود، والحالة الفعلية والفشل، مع موافقة منفصلة وحدود البيانات. | اختبارات واجهة وشبكة بمزود وهمي تثبت عدم الإرسال افتراضيًا، وظهور الوجهتين قبل الموافقة، وتحديث وصف الحالة، ومعالجة الإلغاء والإخفاق دون بيانات حقيقية. |
| UX-05 | P1 | `/privacy/` | `src/pages/privacy.astro:11-21`، `src/pages/api/measurement-status.ts:5-6`، `src/components/GoogleAnalytics.astro:15`، `public/measurement.mjs:22-39` | الصفحة مسودة غير معتمدة، وتقول إن مفاتيح إيقاف المراقبة لا توقف GA؛ لكن مفتاح `AIGAS_MONITORING_KILL_SWITCH` في المصدر يعطل حالة GA، و`utm_term` مذكور في النص بينما ليس ضمن قائمة تنقية `page_location` المحلية. لا يثبت هذا وحده طريقة معالجة Google لكل الحقول أو وضع الإنتاج. | تضارب الإفصاح مع سلوك الإعداد يربك المستخدم والمشغّل في مسار بيانات حساس، كما لا تكتمل معلومات الحقوق والاحتفاظ والجهة المتحكمة. | طابق الإشعار مع السلوك المنشور بعد فحص الشبكة وإعدادات المشغّل؛ اعتمد الإشعار وقناة الحقوق وآلية الاختيار مع المالك والمختص قبل أي ادعاء قانوني. | مستند معتمد لكل بيئة يصف مفاتيح الإيقاف والحقول والجهات والحقوق؛ تؤكد اختبارات شبكة تشغيل القياس وإيقافه والتنقية، دون افتراض امتثال قانوني. |
| UX-06 | P2 | `/products/` بعد مختبر `/products/firewall/` | `src/components/ProductCatalog.astro:12,30-34`، `src/components/LabShell.astro:13` | عقب زيارة Firewall وتشغيل مثال والعودة في المتصفح المحلي بقي رابط «أكمل آخر مختبر» مخفيًا. بحث نصي في `src` و`public` و`scripts` وجد قراءة المفتاح `aigas:lab:last` دون كتابة مقابلة بالاسم نفسه. | لا يظهر اختصار العودة المتوقع؛ كما توحي عبارة حفظ الخطوة باستمرارية أوسع مما أثبتناه. | حدد ما الذي يُحفظ دون بيانات حساسة، واربطه بكتابة متسقة أو احذف وعد الاستئناف غير المنفذ. | رحلة مختبر ← كتالوج تعرض وجهة آخر مختبر الصحيحة، أو يعرض التصميم بديلًا صريحًا عند منع التخزين؛ لا تحفظ نصوص المستخدم. |
| UX-07 | P2 | `/auth/sign-up/` | `src/pages/auth/sign-up.astro:8-9,29,78-80`، `src/server/kernel/env.mjs:9-13` | شرط إظهار النموذج يجمع بين وجود عنوان Auth وفتح البوابة، لكن رسالة الفرع الآخر تنسب التعذر دائمًا لعدم ضبط العنوان؛ في حالة وجود عنوان وإغلاق البوابة يكون السبب المعروض غير دقيق. هذه نتيجة تحليل شرط المصدر، ولم تُختبر بإعداد إنتاجي. | المستخدم أو الدعم قد يبحث عن خطأ تهيئة غير موجود بدل معرفة أن البوابة مغلقة. | افصل الرسائل حسب غياب إعداد Auth أو إغلاق البوابة، دون كشف تفاصيل حساسة. | اختبارات حالات وجود/غياب العنوان × فتح/إغلاق البوابة تعرض رسالة صحيحة ورابط بديل، مع التحقق من لوحة المفاتيح. |

## سلم الأولوية

- **P0:** UX-01 — استعادة وصول الموقع والتحقق من DNS والأصل، دون تغيير آلي أو افتراض عنوان الخادم.
- **P1:** UX-02 وUX-04 وUX-05 — تصحيح رابط المختبر وإفصاحات المسار الاختياري والخصوصية؛ أعد التحقق من الحي بعد زوال الحجب.
- **P2:** UX-03 وUX-06 وUX-07 — عقد dev، واختصار استئناف المختبر، ورسالة إغلاق التسجيل.

### متابعة تنفيذ UX-06 — 2026-11-18

- عند دخول مختبر عام، يُحفظ slug المنتج المسموح فقط في `sessionStorage`؛ لا تُحفظ نصوص المثال أو بياناته.
- عند العودة إلى `/products/` يظهر رابط للمختبر الأحدث؛ وإذا منع المتصفح الوصول إلى التخزين تظهر رسالة بديلة واضحة.
- **التحقق المحلي:** اختبارات الاستئناف والتنقل `7/7 PASS`، وفحص whitespace للملفات المستهدفة PASS.
- **الحالة:** PARTIAL — لم يُنفذ build أو فحص متصفح؛ بيئة Node/Astro الحالية لا تطابق النسخ المقفلة، والنشر غير مفحوص.

### متابعة تنفيذ UX-07 — 2026-11-18

- صفحة التسجيل تميز بين خدمة حسابات غير مهيأة وبوابة تسجيل مغلقة، مع رابط تواصل بديل ودون عرض عنوان الخدمة أو متغيرات البيئة.
- **التحقق المحلي:** مصفوفة الإعدادات الأربع واختبار ربط الصفحة `3/3 PASS`؛ JavaScript وwhitespace PASS.
- **الحالة:** PARTIAL — build والمتصفح وإعدادات البيئة المنشورة NOT RUN؛ Node/Astro المثبتان لا يطابقان النسخ المقفلة.

## تقييم الصفحات الـ16 المطلوبة

**طريقة قراءة الجدول:** «مصدر + DOM ضيق» تعني أن الصفحة رُوجعت من المصدر وفتحت في معاينة محلية معزولة، بقياس عرض نافذة `484×519` CSS px. تساوى `scrollWidth` الجذر مع عرض النافذة في الصفحات الـ14 التي أمكن عرضها؛ هذا فحص أولي للتمرير الخارجي فقط وليس تدقيقًا لكل العناصر أو المقاسات. اختبار التفاعل اقتصر على الرحلات المذكورة صراحة. حالة الحي `403` تعني وجود طلب مباشر إلى المسار نفسه في نافذة الفحص، لا قياسًا من جميع الشبكات؛ «غير متحقق» تعني عدم إثبات حالته بعد عبور Cloudflare.

| الصفحة | CTA والغرض كما في المصدر | ما فُحص وحدود النتيجة | الحي |
|---|---|---|---|
| `/` | استكشاف المنتجات أو طلب معلومات/عرض سعر؛ النص يصف عدم تحقق الإتاحة التشغيلية (`src/pages/index.astro:29-32`). | مصدر + DOM ضيق؛ لا يثبت محتوى النشر. | 403 |
| `/products/` | البدء بـFirewall، ثم المختبرات الخمسة وKernel؛ طلب الاستكشاف ليس تفعيلًا (`ProductCatalog.astro:12-26`). | مصدر + DOM ضيق؛ اختُبر الدخول إلى Firewall والعودة، ولا يظهر استئناف آخر مختبر؛ UX-06. | 403 |
| `/kernel/` | تطبيق سياسة اصطناعية، مع رابط المنتج التالي وخيار التسجيل (`src/pages/kernel.astro:9-22`). | مصدر + DOM ضيق؛ تطبيق سياسة التنقيح أظهر `REDACT` ودليلًا موسومًا اصطناعيًا؛ لم يُختبر حساب أو كل السياسات. | 403 |
| `/products/firewall/` | اختيار مثال وفحصه محليًا، ثم Human Gate عند حالة التصعيد. | مصدر + DOM ضيق؛ `REDACT` ثم إعادة الضبط وفحص التركيز اختُبرت محليًا. المطابقة حرفية وليست كشف بيانات شخصية أو ضمان أمني (`FirewallWorkspace.astro:9-30`). | 403 |
| `/products/risk-engine/` | اختيار أصل واحتمال وأثر وضابط ومحاكاة قرار؛ تصدير Synthetic فقط. | مصدر + DOM ضيق؛ اختيار خلية `2×2` غيّر النتيجة المحلية من `9/9` إلى `4/9` مع حالة غير مقبول؛ ليس تقييم قبول مؤسسي (`RiskDemo.astro:5-15`). | غير متحقق منفردًا |
| `/products/human-gate/` | تجربة مقدم طلب ومراجع افتراضي وإجراءات الموافقة أو الرفض. | مصدر + DOM ضيق؛ محاولة اعتماد مقدم الطلب طلبه أعادت `SELF_REVIEW_DENIED` في المحاكاة، ولا تثبت صلاحيات خادمية (`HumanGateDemo.astro:1-12`). | غير متحقق منفردًا |
| `/products/ledger/` | إضافة أحداث والتحقق من السلسلة أو تغييرها وإعادة ضبطها. | مصدر + DOM ضيق؛ إضافة حدثين أعطت `VALID` لثلاثة أحداث، وبعد تعديل حدث أعاد المثال `ALTERED`؛ لا يثبت سلامة سجل إنتاجي (`LedgerDemo.astro:1-7,23-33`). | غير متحقق منفردًا |
| `/products/secure-chat/` | اختيار محاكاة؛ تفعيل مسار حي اختياري بموافقة منفصلة. | مصدر + DOM ضيق؛ السيناريو العام عرض حالة تحميل ثم «رد محاكاة»، دون تفعيل المسار الحي أو اختبار للمزوّد؛ راجع UX-04. | غير متحقق منفردًا |
| `/docs/` | البحث وتصفية الأدلة وفتح المقال أو الأصول. | مصدر + DOM ضيق؛ الأدلة قابلة للقراءة دون JavaScript، بينما البحث والمعاينة يعتمدان عليه (`docs.astro:54-84`). لم تُفحص جميع حالات الفلاتر. | 403 |
| `/pricing/` | تجهيز استفسار، لا دفع ولا سعر معتمد؛ المختبر العام. | مصدر + DOM ضيق؛ نُقر رابط المختبر في المتصفح المحلي ووصل إلى مرساة مفقودة UX-02. | 403 |
| `/trust/` | عرض حالة الأدلة والتواصل بطلب عام. | مصدر + DOM ضيق؛ الصفحة تميّز غير المثبت من الشهادات والتشغيل (`trust.astro:7-18`). | غير متحقق منفردًا |
| `/privacy/` | شرح محدود للقياس والتواصل والحقوق. | مصدر + DOM ضيق؛ الإشعار نفسه مسودة، وتفاوت وصف مفاتيح القياس عن المصدر UX-05. | غير متحقق منفردًا |
| `/contact/` | مسودة محلية، ثم نسخها يدويًا وإرسالها من البريد أو واتساب. | مصدر + DOM ضيق؛ يظهر تنبيه النسخ والبديل اليدوي في الكود، ولم تُرسل رسالة. رابط المختبر UX-02. | 403 |
| `/app/` | مدخل مساحة العمل، وليس دليل جلسة. | في dev المحلي `302` إلى Kernel؛ في خادم الإصدار المعزول والبوابة المغلقة `503`، وهو السلوك المتوقع لتلك البيئة. | 403 |
| `/app/trial/` | بدء استكشاف محدود أو تحديث حالة الخادم بعد الهوية. | مصدر وHTML في dev؛ بوابة خادم الإصدار المحلي مغلقة. لم يُنشأ حساب أو Tenant أو طلب تجربة (`app/trial/index.astro:7-18`). | 403 |
| `/auth/sign-up/` | إنشاء حساب أو تسجيل دخول، ثم توثيق البريد للرحلة المشروطة. | مصدر + DOM ضيق؛ الخادم المعزول يعرض عدم الإتاحة، ولم تُختبر خدمة الهوية؛ راجع رسالة السبب المشروطة UX-07. | 403 |

### الوصولية والاستجابة وحالات الواجهة

- **RTL:** قوالب الواجهة العامة والتطبيق تضبط `lang="ar-SA"` و`dir="rtl"` (`BaseLayout.astro:35-39`, `AppLayout.astro:29-32`)؛ قيس اتجاه 14 صفحة محلية مفتوحة وكان RTL. هذا لا يثبت سلامة ترتيب جميع النصوص المختلطة أو قارئ الشاشة.
- **لوحة المفاتيح:** في `/products/` المحلي، الضغط على Enter فوق رابط التخطي نقل التركيز إلى `main#main`. المختبرات ونماذج الحساب تعرّف `:focus-visible` وحقولًا مسماة وحالات `role=status` في المصدر؛ هذا وجود آلية وليس اجتياز تدقيق شامل لتسلسل Tab أو قارئ شاشة. راجع UX-02 بالنسبة للمرساة.
- **التحميل والخطأ:** Firewall يعلن البدء والنتيجة، وLedger يعرف حالات فارغ/جارٍ/خلل وفشل Web Crypto، وتسجيل الحساب وطلب التجربة يتضمنان حالة جلسة وفشل. تشغيل كل حالات التعطل والشبكة البطيئة وبدون JavaScript وتوافق التقنيات المساعدة **NOT VERIFIED**.
- **عرض ضيق:** قيس 484×519 فقط لـ14 صفحة عامة/حساب على الخادم المحلي؛ لم يظهر تمرير أفقي لجذر الصفحة، وفُحصت لقطة أول الشاشة للمنتجات والتسجيل. هذا ليس جهاز جوال حقيقيًا، ولا يغطي 320px أو 200–400% zoom أو التداخل الداخلي أو اللمس؛ يلزم اختبارها بعد إزالة حجب الحي.
- **CTA:** الفصل بين «جرّب» و«اطلب» و«سجّل» واضح غالبًا في المصدر، لكن الرابط المعطوب UX-02 ووصف الاتصال UX-04 يضعفان الرحلة. لا يُعتبر فتح بريد أو واتساب إرسالًا أو استلامًا.

## حدود أنواع التجربة

| النوع | ما يثبته التدقيق وما لا يثبته | الانتقال والحواجز |
|---|---|---|
| Educational demo | مثال اصطناعي محدد القواعد؛ نتيجة Firewall المحلية اختُبرت، ولا تثبت دقة نموذج أو حماية أو اعتمادًا. | غالبًا بلا حساب؛ بعض الاختيارات تعتمد JavaScript. |
| Public lab | واجهة عامة تضم محاكاة وتذكر حدودها؛ `secure-chat` يحوي خيارًا حيًا منفصلًا مشروطًا، ولم يُفعّل أو يُثبت وصوله للمزود. | اختيار مثال دون حساب؛ لأي إرسال اختياري يجب إفصاح وموافقة وشروط خادم. |
| Authenticated exploration | يوجد في المصدر تدفق 48 ساعة بقراءة محدودة وبيانات اصطناعية؛ لم تُثبت جلسة أو بدء مدة على المنشور. | بريد موثّق، بوابة متاحة، جلسة وعضوية وصلاحية وقرار خادمي. |
| Enterprise trial / Pilot | وصف استفسار وتجربة تشغيلية منفصلة مشروطة باتفاق وموافقة؛ ليس دليل تفعيل أو إذن لمعالجة بيانات مؤسسة. | استفسار ثم موافقة مشغّل واتفاق على النطاق والمدة والبيئة والبيانات والتكلفة. |
| Production service | الكود والـAPI لا يثبتان مزودًا أو تكاملًا أو إطلاقًا أو SLA أو شهادة أو جاهزية. | يتطلب إثبات بيئة وإعدادات وصلاحيات واختبارات قبول وأمن ودعم مستقلة قبل أي ادعاء. |

### الروابط المكررة والـ404

من 3,072 ظهور رابط داخلي محلي، وُجد 233 اقتران صفحة/وجهة تكرر فيه الرابط ثلاث مرات أو أكثر؛ مثل رابط `/products/` في الهيدر والمحتوى والفوتر للرئيسية. التكرار وحده ليس رابطًا مكسورًا ولا خللًا مثبتًا؛ افحصه عند إرباك التسمية أو المسار. الفحص الآلي لم يجد مسارًا ثابتًا مجهولًا، لكنه لم ينفذ JavaScript لكل الحالات ولا يثبت الصحة الحية. المرستان المفقودتان في UX-02. عينة مسارات غير موجودة و`/404/` أعادت 404 محليًا في dev وNode المبني؛ أما الرد الحي على المسار الوهمي فكان 403 من Cloudflare، **وليس دليل 404 حيًا**.

## جرد الصفحات في المصدر

الأعداد التالية توسعة للمسارات المعرفة في `src/pages`، لا دليل على النشر. **64 صفحة** ضمن sitemap المحلي، إضافة إلى **6 مختبرات** مستثناة من الفهرسة، و**11 مسار واجهة تطبيق أو تسجيل محددًا**، وصفحة 404؛ المجموع **82 مسارًا محددًا**. يوجد أيضًا مسار تطبيق ديناميكي آخر بمعرّف غير محدود `/app/risk-engine/[assetId]/` لا يُحصى كصفحة محددة. سياسة الفهرسة في `src/server/seo/indexability.mjs:3-4` تستبعد `/demo/` و`/app/` و`/auth/` و`/api/` و`/healthz/` و`/404/` من الفهرسة.

**العامة الأساسية:** `/`, `/about/`, `/compliance/`, `/contact/`, `/docs/`, `/kernel/`, `/pricing/`, `/privacy/`, `/products/`, `/resources/`, `/services/`, `/solutions/`, `/terms/`, `/trust/`, `/authors/`.

**المنتجات:** `/products/firewall/`, `/products/risk-engine/`, `/products/human-gate/`, `/products/ledger/`, `/products/secure-chat/` — جميعها من `src/pages/products/[product].astro:8-16`.

**المختبرات العامة غير المفهرسة:** `/demo/firewall/`, `/demo/risk-engine/`, `/demo/human-gate/`, `/demo/ledger/`, `/demo/secure-chat/`, `/demo/kernel/` — من `src/pages/demo/[product].astro:10-17`. كما توجد تجارب مدمجة داخل صفحات المنتجات وKernel. تستخدم الأمثلة بيانات اصطناعية، مع خيار إرسال حي مشروط في Secure Chat كما في UX-04؛ وجود المختبر لا يثبت تشغيل خدمة فعلية.

**القطاعات والركائز والمؤلفون:** `/solutions/government/`, `/solutions/finance/`, `/solutions/healthcare/`, `/solutions/enterprise/`; `/pillars/safety/`, `/pillars/transparency/`, `/pillars/privacy/`; `/authors/brightai-team/`, `/authors/yazeed-alshareef/`.

**الأصول:** `/resources/ai-use-policy/`, `/resources/ai-risk-register/`, `/resources/responsibility-evidence-matrix/`، إضافة إلى الملفات القابلة للتنزيل في `public/resources/`، وهي أصول وليست صفحات Astro إضافية.

**الأدلة الثابتة الـ12:** `/knowledge/ai-governance-saudi/`, `/knowledge/ai-risk-assessment/`, `/knowledge/ai-use-policy-employees/`, `/knowledge/iso-42001-saudi/`, `/knowledge/pdpl-and-ai/`, `/knowledge/prompt-injection/`, `/knowledge/protect-company-data-chatgpt/`, `/knowledge/saudi-ai-ethics-principles/`, `/knowledge/saudi-ai-law-binding-vs-guidance/`, `/knowledge/sdaia-ai-adoption-framework/`, `/knowledge/sdaia-ai-ethics-self-assessment/`, `/knowledge/sdaia-generative-ai-guidelines/`.

**الأدلة المولدة الـ20** من `src/data/knowledge-guides.ts` عبر `src/pages/knowledge/[article].astro`: `/knowledge/shadow-ai-detection/`, `/knowledge/ai-hallucinations-controls/`, `/knowledge/deepfake-policy-organizations/`, `/knowledge/ai-inventory-register/`, `/knowledge/ai-employee-training/`, `/knowledge/ai-vendor-assessment/`, `/knowledge/data-classification-for-ai/`, `/knowledge/ai-governance-committee-raci/`, `/knowledge/ai-impact-assessment/`, `/knowledge/ai-audit-trail/`, `/knowledge/saudi-ai-regulators-map/`, `/knowledge/choose-ai-governance-platform/`, `/knowledge/ai-cybersecurity-nca/`, `/knowledge/ai-governance-financial-sector/`, `/knowledge/ai-governance-healthcare/`, `/knowledge/ai-bias-fairness/`, `/knowledge/ai-contract-clauses/`, `/knowledge/data-breach-72-hours-ai/`, `/knowledge/ai-data-residency-saudi/`, `/knowledge/data-governance-vs-ai-governance/`.

**التطبيق والهوية:** `/app/`, `/app/kernel/`, `/app/firewall/`, `/app/risk-engine/`, `/app/risk-engine/[assetId]/`, `/app/human-gate/`, `/app/ledger/`, `/app/secure-chat/`, `/app/trial/`, `/app/operator/trials/`, `/auth/sign-up/`, `/auth/accept-invitation/`. الاستجابة في dev لا تثبت صلاحية المستخدم أو إعداد الخدمة. `/404/` صفحة الخطأ؛ المسارات غير الموجودة تختبر بصورة منفصلة.

## جرد واجهات API في المصدر

الجدول يسرد **43 ملف endpoint** وطرائق HTTP المصدّرة، لا جاهزيتها أو إمكانية الوصول إليها. `[id]` متغير مسار وليس قيمة حقيقية. معظم `/app/api/` يتعلق بالبوابة الخاصة؛ لا يُستنتج من هذا الجدول تفعيل الهوية أو صلاحية البيانات.

| المسار | methods | الملف تحت `src/pages/` |
|---|---|---|
| `/api/measurement-status/` | GET | `api/measurement-status.ts` |
| `/api/observability/` | POST | `api/observability.ts` |
| `/api/public-demo/groq-sandbox/` | POST | `api/public-demo/groq-sandbox.ts` |
| `/app/api/firewall/evaluate/` | POST | `app/api/firewall/evaluate.ts` |
| `/app/api/firewall/guarded-executions/` | POST | `app/api/firewall/guarded-executions.ts` |
| `/app/api/firewall/rules/` | GET, POST, PATCH, DELETE | `app/api/firewall/rules.ts` |
| `/app/api/human-gate/delegations/` | GET, POST | `app/api/human-gate/delegations/index.ts` |
| `/app/api/human-gate/delegations/[delegationId]/revoke/` | POST | `app/api/human-gate/delegations/[delegationId]/revoke.ts` |
| `/app/api/human-gate/policy/` | POST | `app/api/human-gate/policy.ts` |
| `/app/api/human-gate/requests/` | GET, POST | `app/api/human-gate/requests/index.ts` |
| `/app/api/human-gate/requests/[requestId]/cancel/` | POST | `app/api/human-gate/requests/[requestId]/cancel.ts` |
| `/app/api/human-gate/requests/[requestId]/decide/` | POST | `app/api/human-gate/requests/[requestId]/decide.ts` |
| `/app/api/human-gate/requests/[requestId]/execute/` | POST | `app/api/human-gate/requests/[requestId]/execute.ts` |
| `/app/api/kernel/` | GET, POST | `app/api/kernel.ts` |
| `/app/api/kernel/health/` | GET | `app/api/kernel/health.ts` |
| `/app/api/kernel/invitations/` | GET | `app/api/kernel/invitations.ts` |
| `/app/api/kernel/members/` | GET, POST | `app/api/kernel/members.ts` |
| `/app/api/kernel/policies/` | GET, POST | `app/api/kernel/policies.ts` |
| `/app/api/kernel/products/` | PATCH | `app/api/kernel/products.ts` |
| `/app/api/kernel/trials/` | GET, POST | `app/api/kernel/trials/index.ts` |
| `/app/api/kernel/trials/[trialId]/cancel/` | POST | `app/api/kernel/trials/[trialId]/cancel.ts` |
| `/app/api/kernel/trials/[trialId]/submit/` | POST | `app/api/kernel/trials/[trialId]/submit.ts` |
| `/app/api/ledger/events/` | GET, POST | `app/api/ledger/events/index.ts` |
| `/app/api/ledger/events/[eventId]/` | GET | `app/api/ledger/events/[eventId]/index.ts` |
| `/app/api/ledger/events/[eventId]/export/` | GET | `app/api/ledger/events/[eventId]/export.ts` |
| `/app/api/ledger/events/[eventId]/verify/` | POST | `app/api/ledger/events/[eventId]/verify.ts` |
| `/app/api/operator/trials/` | GET | `app/api/operator/trials/index.ts` |
| `/app/api/operator/trials/[trialId]/activate/` | POST | `app/api/operator/trials/[trialId]/activate.ts` |
| `/app/api/operator/trials/[trialId]/close/` | POST | `app/api/operator/trials/[trialId]/close.ts` |
| `/app/api/operator/trials/[trialId]/decide/` | POST | `app/api/operator/trials/[trialId]/decide.ts` |
| `/app/api/operator/trials/[trialId]/expire/` | POST | `app/api/operator/trials/[trialId]/expire.ts` |
| `/app/api/risk-engine/actions/` | GET | `app/api/risk-engine/actions.ts` |
| `/app/api/risk-engine/assets/` | GET, POST | `app/api/risk-engine/assets/index.ts` |
| `/app/api/risk-engine/assets/[assetId]/` | PATCH, DELETE | `app/api/risk-engine/assets/[assetId]/index.ts` |
| `/app/api/risk-engine/assets/[assetId]/assessments/` | GET, POST | `app/api/risk-engine/assets/[assetId]/assessments.ts` |
| `/app/api/risk-engine/assets/[assetId]/revisions/` | GET | `app/api/risk-engine/assets/[assetId]/revisions.ts` |
| `/app/api/risk-engine/assets/[assetId]/treatments/` | GET, POST, PATCH | `app/api/risk-engine/assets/[assetId]/treatments.ts` |
| `/app/api/risk-engine/assist/` | POST | `app/api/risk-engine/assist.ts` |
| `/app/api/risk-engine/export/` | GET | `app/api/risk-engine/export.ts` |
| `/app/api/secure-chat/messages/` | POST, DELETE | `app/api/secure-chat/messages.ts` |
| `/app/api/secure-chat/models/` | GET | `app/api/secure-chat/models.ts` |
| `/app/api/trial/` | GET, POST | `app/api/trial.ts` |
| `/healthz/` | GET, HEAD | `healthz.ts` |

## References

[1]: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1000/ "Cloudflare Error 1000"
[2]: https://www.cloudflare.com/ips-v4 "Cloudflare IPv4 ranges"
[3]: https://www.cloudflare.com/ips-v6 "Cloudflare IPv6 ranges"
[4]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines 2.2"
[5]: https://web.dev/articles/keyboard-access "Keyboard access fundamentals"
[6]: https://web.dev/articles/accessible-responsive-design "Accessible responsive design"
[7]: https://madegooddesigns.com/inspiration/ui/flows/sign-up?platform=web&style=corporate&utm_source=mcp&utm_medium=referral&utm_campaign=get_ui_flow "UI by Made Good Designs — sign-up flow"
