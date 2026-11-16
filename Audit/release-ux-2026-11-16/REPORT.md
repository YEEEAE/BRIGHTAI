# مراجعة تجربة المستخدم والإتاحة والخصوصية والإطلاق — 2026-11-16

الحالة: **PARTIAL**. اكتمل الفحص المحلي المحدد أدناه؛ الرحلة المصادقة الجديدة وpayloads الخادمية وقياسات الحقل **NOT VERIFIED**.

| القرار المستقل | النتيجة | السبب الحاسم |
|---|---|---|
| PUBLIC_DEMO | **NO-GO** | رحلة Ledger القادمة من الكتالوج لا تقدم الإدخال والتشغيل المطلوبين؛ نسخ المختبرات غير متكافئة. |
| TRIAL_48H | **NO-GO** | `/app/trial/` و`/app/api/trial/` المنشوران 404 بكاش عام؛ لم تثبت بوابة الأمان والرحلة المصادقة على النسخة الحالية. |
| ENTERPRISE | **NO-GO** | لا دليل حالي على رحلة مؤسسية مصادقة وعزلها وتكامل المراجعة/المزود وخصوصية الإرسال الخادمي؛ نجاح المحاكاة لا يثبتها. |

هذه قرارات قبول للنطاق المطلوب، وليست ادعاء وجود تسريب أو اختراق. لا P0 مثبتًا في هذه الجولة.

## النسخة والطريقة

- الفرع `main`؛ HEAD والبناء المفحوص `738520067de19ae3bb5380beb292cd4d44861b69`؛ Node 22.22.2؛ وقت البناء `2026-11-16T13:48:18.114Z`.
- معاينة 4428 كانت تحمل version.json أقدم (`3f36390…`)؛ استُبعدت من اعتماد النتائج. بُني HEAD الحالي وشُغّل أصل مستقل `http://localhost:4429` دون تحميل `.env` أو بيانات اعتماد DB/Auth؛ App مفتوح لعرض واجهات الدخول مع بقاء حراس API. لا جلسة مستخدم مستعارة أو حقن هوية.
- Chrome headless بملفات مؤقتة مستقلة؛ 360/390/768/1440 × ارتفاع 900، وتحقق Keyboard إضافي على 360×844. هذا محاكاة لمقاسات، وليس أجهزة فعلية أو Safari/iOS.
- اكتشاف المهارات والمكونات تم؛ استُخدمت `accessibility-audit`. Browser MCP أعاد `NO_BROWSER_PROFILE`؛ استُخدم Playwright المثبت بالفعل دون تثبيت حزم. Graphify graph غير موجود. مهارة performance-profiling المكتشفة خاصة بـApple native فلا تنطبق على الويب.
- `npm run build`: PASS. اختبارات demo/navigation/observability: **45 PASS، 0 FAIL، 0 SKIP**؛ [السجل](tests.log).
- لم يُعدّل كود المنتج أو Hero أو Constellation أو tokens. لم تنفذ commit/push/deploy/DNS/Neon edits، ولا إرسال نموذج أو تسجيل حساب جديد.
- فحص خبير بمسارات اصطناعية؛ لا مشاركين بحثيين، ولا SUS/SEQ أو نتائج دراسة مستخدمين مختلقة.

## مصفوفة 6×9

الموبايل = المقاسات الأربعة بلا overflow في الحالة الأولية؛ الخصوصية = المتصفح المحلي فقط. «App» يصف واجهة مجهولة لا نجاح المنتج التشغيلي. سجل `browser.json` يحوي النتائج الفعلية والسبب وReset لكل رحلة.

| المنتج | مدخل demo | نجاح بدون حساب | تفاعلات | حالة التطبيق | Trial | موبايل | خصوصية | الدليل |
|---|---|---|---|---|---|---|---|---|
| Firewall | `/products/firewall/#lab`؛ `/demo/firewall/` | PASS محلي | مثال→تحرير→Enter للفحص→REDACT+سبب→Reset؛ رفض الفارغ. النسخة المنفصلة قواعد أبسط وBLOCK | `/app/firewall/`: غلاف محمي؛ تشغيل مصادق NOT VERIFIED | NO-GO؛ جلسة جديدة NOT RUN | PASS أولي ×4؛ Reset غير محجوب 360 | لا نقل قياس مرصود؛ server NOT VERIFIED | `browser.json`: Firewall full وlegacy demo firewall؛ `entry.json` |
| Ledger | `/products/ledger/#lab`؛ `/demo/ledger/` | PASS للمنفصل؛ PARTIAL من الكتالوج | منفصل: أضف→تحقق VALID→عدّل→ALTERED+موضع الخلل→Reset؛ المضمّن نتائج جاهزة فقط | `/app/ledger/`: غلاف محمي؛ تشغيل مصادق NOT VERIFIED | NO-GO | PASS أولي ×4؛ Reset غير محجوب 360 | لا نقل قياس مرصود؛ server NOT VERIFIED | `browser.json`: Ledger full وembedded ledger |
| Human Gate | `/products/human-gate/#lab`؛ `/demo/human-gate/` | PASS محلي | طلب→سبب→SELF_REVIEW_DENIED→مراجع→APPROVED→مقدم→EXECUTED→Reset PENDING | `/app/human-gate/`: غلاف محمي؛ تكامل مراجعة حقيقي NOT VERIFIED | NO-GO | PASS أولي ×4؛ Reset غير محجوب 360 | السبب الاصطناعي محلي؛ server NOT VERIFIED | `browser.json`: Human Gate full |
| Risk Engine | `/products/risk-engine/#lab`؛ `/demo/risk-engine/` | PASS محلي | أصل→احتمال/أثر/ضابط→حساب تفاعلي 6→3 مع سبب→إحالة→Reset؛ لا زر تشغيل مستقل | `/app/risk-engine/` ومسار أصل: غلاف محمي؛ البيانات المصادقة NOT VERIFIED | NO-GO | PASS أولي ×4؛ Reset غير محجوب 360 | لا نقل قياس مرصود؛ server NOT VERIFIED | `browser.json`: Risk full؛ `_demo_risk-engine_390.png` |
| Secure Chat | `/products/secure-chat/#lab`؛ `/demo/secure-chat/` | PASS محلي | مثال→نص اصطناعي→إرسال→رد محاكاة/REDACT+سبب قبل/بعد→Reset؛ لا نموذج حي | `/app/secure-chat/`: غلاف محمي؛ تنفيذ مزود NOT VERIFIED | NO-GO | PASS أولي ×4؛ Reset غير محجوب 360 | canary لم يخرج إلى قياس مرصود؛ server NOT VERIFIED | `browser.json`: Secure Chat full؛ `quality.json` |
| Kernel | `/kernel/#lab`؛ `/demo/kernel/` | PASS محلي | أصل/سياسة→تطبيق→موافقة محاكية→REQUEST_APPROVAL+سبب→Reset؛ المنفصل تحرير دور→PERMIT→Reset | `/app/` و`/app/kernel/`: غلاف محمي؛ عضوية فعلية NOT VERIFIED | NO-GO؛ مكوّن مشترك | PASS أولي ×4 | سياق سيناريو اصطناعي؛ server NOT VERIFIED | `browser.json`: Kernel full وlegacy demo kernel |

لا تعني PASS في عمود النجاح مساواة النسخ أو استيفاء كل معيار إصدار. `Risk` يعتمد إعادة الحساب فور تغيير الحقول، و`Ledger` المنفصل يستخدم أزرارًا كمدخلات أحداث؛ إذا كان المقصود زر Run موحدًا لكل تجربة، فـRisk أيضًا PARTIAL لهذا الشرط.

## التغطية الفعلية والرحلة

**92 ملاحظة عرض = 23 مسارًا ×4**: الكتالوج، خمس صفحات منتجات، Kernel، ستة demos، وعشرة مسارات App: `/app/`، `/app/trial/`، `/app/kernel/`، المنتجات الخمسة، `/app/operator/trials/`، ومسار تفاصيل أصل Risk اصطناعي. صفر overflow على مستوى document في الحالات الأولية. حالات النتيجة والسبب وReset اختُبرت على 390، وليست كل حالات كل مسار على كل مقاس.

النقر من `/products/` إلى مختبرات المنتجات الخمسة نجح، مع Reset مرئي وغير محجوب على 360 (`entry.json`). لا Sidebar يغطي هذه الأزرار في الفحص. هذا لا يثبت كل CTA وكل حالة أو safe-area فعليًا. روابط Trial لم تُتبع لإجراء كتابة خارجية.

13 سجل تفاعل في `browser.json`: ثمانية اختبارات رحلة/نسخ، أربعة فحوص للمضمّن، واختبار تنقل Keyboard. فحوص المضمّن المتخصص تثبت وجود المكوّن، ولا تُعد إعادة تنفيذ كاملة مستقلة للرحلة المشتركة. Ledger المضمّن هو الفجوة العملية الأوضح: زر «جرّب» من الكتالوج يصل إلى اختيار نتيجة جاهزة، بينما المختبر الكامل موجود في عنوان آخر.

## الإتاحة والاتجاه

- `dir=rtl` في جميع الصفحات؛ لا حقول بلا label أو أزرار فارغة في عينة 11 مسارًا. 18 انتقال Tab لكل مسار؛ Focus مرئي في العينة، وEnter شغّل الفحص/الموافقة، وEscape أغلق قائمة مساحة العمل وأعاد Focus إلى summary.
- Reduced Motion: صفر animations جارية في 92 ملاحظة أولية وفي قياسات الأداء. هذا لا يثبت كل انتقال بعد تفاعل.
- `bdi` موجود، لكن ليس كل نص مختلط معزولًا: شاشة Risk تُظهر تعبيرات المصفوفة مع اتجاه بصري ملتبس؛ Inspector Ledger يعرض timestamps/hashes من دون عزل حقول مستقل. يلزم `<bdi dir="ltr">` للقيم اللاتينية/الحسابية مع مراجعة بشرية؛ ليس مجرد عدّ العناصر.
- أداة center-hit أشارت إلى حجب رابط «شاهد Human Gate» داخل Ledger؛ إعادة التصوير أظهرت رابطًا inline ملتفًا على سطرين وFocus ظاهرًا. مركز bounding box يقع بين fragmentين فوق الأب، لذلك **ليست مخالفة حجب مثبتة**؛ `focus-recheck.json` و`ledger-focus.png`.
- بعض الروابط دون 24px في بُعد واحد؛ لم تُقَس استثناءات spacing/inline، فلا تُسجل تلقائيًا كمخالفة 2.5.8.
- قارئ شاشة فعلي، zoom/reflow عند 400%، contrast لكل حالة/تدرج، ترتيب القراءة الصوتية، ومصفوفة WCAG 2.2 AA الكاملة: **NOT VERIFIED**. لم يتوفر axe محليًا ولم تُثبّت أداة. لا شهادة امتثال.
- المرجع: [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)؛ خاصة 1.3.2، 1.4.3، 1.4.10، 2.1.1، 2.4.7، 2.4.11، 2.5.8، 4.1.3. فحص العينات لا يثبت استيفاء جميعها.

## الأداء مقابل baseline

52 قياسًا = 13 صفحة عامة × مقاسين × جولتين؛ localhost، Chrome مكتبي بلا throttling، إعادة استخدام نفس context/cache، انتظار 350ms ثم تفاعل محدود. الجولة الأولى baseline تشخيصي لهذه النسخة، والثانية تكرار لها؛ لا تغيير بينهما ولا ادعاء تحسين. لا يوجد baseline تاريخي بنفس بيئة القياس متاح للاعتماد.

| الجولة/العرض | نطاق LCP ms | أقصى CLS بنافذة جلسة | أقصى Event Timing ms |
|---|---:|---:|---:|
| baseline 390 | 24–144 | 0.00000330 | 32 |
| repeat 390 | 24–48 | 0.00000330 | 32 |
| baseline 1440 | 24–48 | 0.0000304 | 112 |
| repeat 1440 | 24–52 | 0.0000304 | 32 |

Event Timing هو أقصى duration لتفاعلات مرصودة ذات interactionId، بحد رصد 16ms؛ غياب entry ليس صفر زمن. **ليس INP نهائيًا أو p75**. INP مقابل baseline تاريخي وCWV الميدانية **NOT VERIFIED**؛ لا اعتماد لمكتبة web-vitals قديمة عُثر عليها لأنها لا تدعم INP.

لقطة الفحص الأولية لـ`/app/operator/trials/` على390 سجلت مجموع shifts=0.202؛ قياس قصير في `browser.json` يستدعي إعادة قياس تحميل الحالة المجهولة/الخطأ بنافذة كاملة، وليس نتيجة CWV نهائية. App المصادق خارج قياسات الأداء الحالية.

أهداف الأداء: LCP≤2500ms، INP≤200ms، CLS≤0.1 مع بيانات ممثلة؛ [مرجع Google](https://developers.google.com/search/docs/appearance/core-web-vitals). المقارنة المحلية لا تثبت نجاح الإنتاج. Hero وConstellation لم يُعدّلا في المصدر؛ pixel-diff مقابل baseline بصري قديم **NOT RUN**.

## SEO والـApp الخاص

- الكتالوج والمنتجات الخمسة وKernel: canonical و`og:url` صحيحان إلى `https://brightai.live`؛ `index, follow`. sitemap يحتوي ستة عناوين products مع الكتالوج وKernel.
- demos الستة: `noindex, follow`، بلا canonical أو `og:url`؛ مستبعدة عمدًا بواسطة `astro.config.mjs`. يناقض معاملتها كمختبرات عامة قابلة للفهرسة؛ إذا كانت aliases مقصودة يلزم تحديد عنوان مرجعي/تحويل واتساق الدعوات، لا إضافة نسخ مكررة تلقائيًا.
- عشرة مسارات App المحلية: `private, no-store, max-age=0` و`X-Robots-Tag: noindex, nofollow`، ومستبعدة من sitemap. هذه واجهات دون جلسة؛ الاستجابات المصادقة/كل الأخطاء والحافة **NOT VERIFIED**.
- المنشور: `/products/` و`/kernel/` و`/demo/firewall/` أعادت200؛ `/app/trial/` و`/app/api/trial/` أعادتا404 و`public, max-age=0, s-maxage=300` دون X-Robots-Tag مرصود. لا بيانات خاصة رُصدت في صفحتي404؛ لكن عقد no-store للـnamespace الخاص غير مثبت على الحافة. ليس فحصًا لكل URL منشور.

## الخصوصية وTrial

- لم تُرصد طلبات transport تطابق GA4/PostHog/Sentry أثناء الجولات والرحلات. في اختبار canary خاص بـquery على منتج وApp: صفر موارد خارج origin، وGA4 dataLayer احتوى مسار الصفحة العام فقط وreferrer فارغًا؛ لم يظهر canary في local/session storage. لا prompts حقيقية أو بريد مستخدم أو token فعلي استُخدمت.
- المصدر يعطل loader القياس الخارجي؛ محولات PostHog/Sentry الخادمية تستخدم allowlists، واختبارات observability ضمن45 نجحت. هذا يثبت العقد المحلي فقط.
- **GA4 payload مستلم: NOT VERIFIED؛ PostHog payload خادمي/مستلم: NOT VERIFIED؛ Sentry envelope خادمي/مستلم: NOT VERIFIED.** لا وصول لتسجيل egress الخادمي أو بيانات الوجهات في هذه الجولة؛ لا استنتاج من «لا طلبات في المتصفح» إلى «لا تسريب من الخادم».
- لم يُسجّل Trial جديد: الأصل المعزول الحالي بلا DB/Auth settings، وبوابة الإطلاق المنشورة فاشلة، ولم يثبت اعتماد الخروج/الاحتفاظ/الوجهات على النسخة الحالية. الشرط «تسجيل حقيقي عند اكتمال الأمان» لم يتحقق؛ لم تُرسل رسائل OTP ولم تُكتب بيانات Neon.
- [تقرير Trial السابق](../self-service-trial-2026-11-16/REPORT.md) يوثق OTP حقيقيًا وعزل Tenant وقراءات محدودة ورفض provider؛ **HISTORICAL لهذه المراجعة**، لم يُعد هنا، ولا يثبت مرور48h أو رحلة عودة أو جاهزية تشغيل المنتجات. لا نلغي الدليل السابق ولا نرفعه إلى نتيجة حالية.

## الموانع وأسلوب الإغلاق

| الأولوية/المعرف | النتيجة والأثر | الإغلاق المطلوب والمسؤول |
|---|---|---|
| P0 | لا P0 جديد مثبت؛ الأمان الخادمي الكامل غير متحقق، وليس PASS ضمنيًا | Security/DBA يقدمان أدلة البيئة المستهدفة دون إعادة استخدام لقطة تاريخية |
| P1 UX-01 | Ledger من مدخل الكتالوج لا يحقق إدخال→تشغيل→نتيجة؛ المسار الكامل منفصل | Frontend/Product: مدخل واضح ومتصل للمختبر الكامل أو توحيد المكوّن؛ إعادة رحلة من الكتالوج على المقاسات الأربعة |
| P1 REL-01 | Trial وAPI المنشوران404 بكاش عام؛ يمنع48hGO | Release/DevOps: أصل SSR معتمد وتفويض نشر مستقل، ثم readback وno-store/noindex لكل private response؛ لا نشر ضمن هذه المهمة |
| P1 SEC-01 | مصادق حالي وpayloads خادمية/استقبال وعزل/احتفاظ غير مثبتة | Privacy/Identity/DBA: بيئة معزولة معتمدة، canary خادمي، OTP حقيقي، A/B، expiry/no-renewal، provider denial، ثم قرار Trial محدود منفصل عن Enterprise |
| P1 EVD-01 | INP الحقيقي وWCAG AA الكاملة وقبول مؤسسي غير مثبتة | Accessibility/Performance: SR وcontrast وzoom وحالات النتائج والأخطاء وقياس INP ممثل؛ عدم تسمية فحص العينات امتثالًا |
| P2 SEO-01 | demos بلا canonical/OG وخارج sitemap وتحملnoindex | SEO/Product: اختيار indexed public labs أو aliases مقصودة وتوثيقها؛ تحقق artifact والحي |
| P2 RTL-01 | الحسابات/المراجع المختلطة لا تعزل كلها بـbdi؛ صورة Risk وLedger توضح الحاجة | Frontend/RTL: عزل قيم LTR وقراءة الحساب بالترتيب نفسه بصريًا وصوتيًا |
| P2 PERF-01 | لقطة operator trials: shifts0.202 | Frontend: إعادة إنتاج مع قياس جلسة/حالة تحميل وخطأ؛ معالجة الحركة التخطيطية إن تأكدت |
| P2 UX-02 | Risk يحسب تلقائيًا بلا Run منفصل، وFirewall/Kernel المنفصلان أبسط من المضمّن | Product: توضيح التشغيل التلقائي أو توحيد فعل Run حسب عقد القبول؛ لا تقديم النسخ كوظيفة متطابقة |

القرار PUBLIC_DEMO مستقل عن فشل Trial: حتى لو أزيلت دعوة Trial الآن، تبقى فجوة Ledger من مدخل الكتالوج. قرار ENTERPRISE مستقل عن نجاح Trial قراءة محدودة: يحتاج تكاملًا تشغيليًا وإثباتًا مؤسسيًا.

الأدلة: [browser.json](browser.json)، [quality.json](quality.json)، [entry.json](entry.json)، [build.log](build.log)، [tests.log](tests.log). Scripts محفوظة للتكرار وتستخدم Playwright من مسار البيئة الحالي؛ يلزم تعديل مساره على جهاز آخر. لا ترفع هذه الملفات باعتبارها بيانات إنتاج.
