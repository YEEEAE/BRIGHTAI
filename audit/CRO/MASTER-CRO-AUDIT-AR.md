# التدقيق الرئيسي للتحويل CRO — BrightAI

> **التاريخ:** 18 يوليو 2026
>
> **النطاق:** تحليل المستودع الحالي بهدف تحسين تحويل الزائر إلى عميل محتمل مؤهل، مع الحفاظ على هوية BrightAI العربية السعودية وقيود الامتثال.
>
> **نوع القياس:** تدقيق استدلالي قائم على الشيفرة والمحتوى الحالي، وليس تقرير أداء مبيعات فعلي. النسب أدناه هي **درجات اكتمال/جاهزية** محسوبة من Rubric معلن، وليست معدلات Conversion Rate من Analytics.

---

## 1. الملخص التنفيذي

BrightAI يملك أساسًا قويًا جدًا في المحتوى المتخصص، التغطية التنظيمية، البنية العربية RTL، وصف المنتج، ومسارات التواصل. أكبر عائق تحويلي ليس نقص المعلومات؛ بل **تشتت الرسالة وكثرة المسارات قبل الوصول إلى قرار واحد واضح**. الصفحة الرئيسية تشرح المنتج بعمق، لكن كثرة الأقسام والروابط والـCTAs تجعل الزائر المؤسسي يبذل جهدًا ذهنيًا كبيرًا ليعرف: ما العرض الأساسي؟ لمن هو؟ ما الخطوة التالية؟ وما الدليل التجاري الذي يبرر التواصل الآن؟

### النتيجة الإجمالية

**درجة الجاهزية التحويلية الحالية: 68%**

تم احتسابها وفق الأوزان التالية:

| المحور | الوزن | الدرجة | المساهمة |
|---|---:|---:|---:|
| وضوح العرض والقيمة | 20% | 70% | 14.0 |
| ملاءمة الرسالة للشخصيات | 15% | 67% | 10.1 |
| الثقة والأدلة | 15% | 55% | 8.3 |
| قوة العرض والـCTA | 15% | 64% | 9.6 |
| سهولة نموذج التحويل | 10% | 72% | 7.2 |
| اتساق رحلة الصفحات | 10% | 61% | 6.1 |
| القياس والتحليلات | 10% | 58% | 5.8 |
| الأساس التقني وإمكانية الوصول | 5% | 82% | 4.1 |
| **الإجمالي** | **100%** |  | **65.2/100** |

أضيفت **3 نقاط نضج** بسبب وجود بنية قوية قابلة لإعادة الاستخدام (`LeadForm.astro`، بيانات UTM، صفحات قطاعية، Schema، RTL، وتدقيق سابق)، لتصبح الدرجة التنفيذية المقربة **68%**.

### توزيع الجاهزية

- **جاهزية الرسالة:** 69%
- **جاهزية الثقة:** 55%
- **جاهزية العرض التجاري:** 63%
- **جاهزية التقاط العميل المحتمل:** 72%
- **جاهزية القياس:** 58%
- **جاهزية SEO الداعمة للتحويل:** 84%
- **جاهزية الوصول والتجربة التقنية:** 82%
- **وضوح التخصص المؤسسي:** 76%
- **وضوح المنتج مقابل الخدمات العامة:** 52%

### تقدير الفجوة

الفجوة الحالية إلى تجربة CRO ناضجة هي **32 نقطة مئوية**. يمكن معالجة قرابة **18–22 نقطة** دون إعادة بناء المنتج، عبر توحيد الرسالة، تقليل التشتت، إعادة ترتيب الأدلة، تحسين عرض التسعير، توحيد التقاط العملاء، وربط الأحداث التحويلية بالتحليلات.

---

## 2. منهجية التحليل وحدود النسب

### ما تم تحليله

1. الصفحة الرئيسية ومحتواها وهيكلها.
2. صفحة الأسعار وعروضها ومساراتها.
3. صفحة التواصل ونموذجها.
4. مكوّن النموذج القابل لإعادة الاستخدام.
5. رأس الموقع والتنقل والـCTAs العامة.
6. طبقة Analytics الحالية.
7. Sitemap والانتشار الكبير للمحتوى والصفحات.
8. التقارير الحالية داخل المستودع كمرجع سياقي.

### معادلة التقييم

لكل محور مجموعة شروط ثنائية أو متدرجة:

- 0%: غير موجود.
- 25%: موجود بصورة ضعيفة أو غير متسقة.
- 50%: موجود لكن يحتاج قرارًا أو تحسينًا كبيرًا.
- 75%: جيد مع فجوات محددة.
- 100%: واضح، موحد، قابل للقياس، ومدعوم بأدلة.

### ما لا تعنيه النسب

- ليست Conversion Rate حقيقية.
- ليست توقعًا مضمونًا للإيرادات.
- ليست نتيجة A/B Test.
- لا تعكس جودة المبيعات أو سرعة إغلاق الصفقات.

للحصول على نسب أداء فعلية يجب قياس: `hero_cta_click`، `pricing_cta_click`، `form_start`، `form_error`، `form_submit`، `whatsapp_click`، `assessment_start`، `assessment_complete`، و`qualified_lead` لمدة كافية وبحجم زيارات مناسب.

---

## 3. ما يعمل جيدًا الآن

### 3.1 تخصص سعودي واضح

المحتوى يربط BrightAI مباشرة بـ PDPL وNCA وSDAIA والقطاعات المنظمة. هذا يرفع الصلة والثقة الأولية لدى الجمهور المحلي. يظهر ذلك في FAQ الصفحة الرئيسية وفي وصف المنتج وخصائصه (`src/pages/index.astro:14-24`, `40-69`).

### 3.2 وصف منتج تقني غني

المنتج ليس صندوقًا أسود؛ يتم شرح AI Firewall وPII Redaction وAudit Trail وHuman Approval وEvidence Files بوضوح (`src/pages/index.astro:51-60`). هذا أصل قوي للبيع المؤسسي.

### 3.3 وجود مسارات تواصل متعددة

واتساب، البريد، نموذج التواصل، وصفحة الأسعار موجودة. صفحة التواصل تعد برد خلال 24 ساعة وتشرح ما يحدث بعد التواصل (`src/pages/contact/index.astro:125-136`, `174-303`, `305-351`).

### 3.4 نموذج قابل لإعادة الاستخدام مع Attribution

`LeadForm.astro` يدعم source/medium/campaign ويرسل حقول Attribution، ويطبق موافقة PDPL وحقول وصول جيدة (`src/components/LeadForm.astro:1-28`, `63-85`, `91-179`). هذه بنية ممتازة لتوحيد مسارات الالتقاط.

### 3.5 أساس وصول وتقنية جيد

الرأس يدعم لوحة المفاتيح وARIA وTouch Targets بحجم 44px، والنماذج تربط الأخطاء بالحقول (`src/components/Header.astro:81-195`, `199-265`; `src/components/LeadForm.astro:94-179`).

### 3.6 بنية SEO ومحتوى واسعة

Sitemap كبير، صفحات حلول ومحتوى وقطاعات، Hreflang وSchema. هذا يخلق وصولًا عضويًا قويًا، لكن يحتاج توجيهًا تحويليًا موحدًا بعد الهبوط.

---

## 4. أهم 15 مشكلة مرتبة حسب الأثر

| # | المشكلة | الشدة | المحور | الأثر المتوقع | الدليل |
|---:|---|---|---|---|---|
| 1 | العرض الأساسي غير موحّد بين منصة حوكمة، Saudi AI Safety OS، استشارات، أتمتة، وكلاء AI، وشات بوت | حرج | الرسالة | تشويش الفئة وتقليل نية التواصل | `src/pages/index.astro:14-24`; `src/pages/pricing/index.astro:1-44` |
| 2 | الصفحة الرئيسية طويلة وكثيفة وتعرض خيارات كثيرة قبل ترسيخ قرار واحد | عالٍ | الحمل المعرفي | انخفاض النقر على CTA الأساسي | `src/pages/index.astro:178-248` والملف يمتد إلى 708 أسطر |
| 3 | دليل اجتماعي/تجاري قابل للتحقق أقل من قوة الادعاءات | عالٍ | الثقة | اعتراضات المشتري المؤسسي تبقى بلا إجابة | وجود `aggregateRating` داخل Schema في `src/pages/index.astro:70-76` دون إبراز مصدر موثق في الجزء المرئي المدقق |
| 4 | صفحة الأسعار تخلط بين منتج الحوكمة وخدمات AI عامة | عالٍ | العرض | جذب Leads غير مؤهلين وإضعاف تموضع المنتج | `src/pages/pricing/index.astro:9-44` |
| 5 | السعر الابتدائي 99 ريال يخلق Anchor منخفضًا لا يناسب منتج Enterprise Governance | عالٍ | التسعير | خفض القيمة المدركة وتوقعات غير مناسبة | `src/pages/pricing/index.astro:13-20`, FAQ التسعير |
| 6 | CTA الأساسي يتغير بين ديمو، واتساب، استشارة، عرض سعر، جلسة جاهزية، واستكشاف حلول | عالٍ | CTA | تشتت القرار وصعوبة Attribution | `src/pages/index.astro:226-241`; `src/pages/pricing/index.astro`؛ `src/components/Header.astro:162-180` |
| 7 | نموذج التواصل المباشر لا يستخدم مكوّن LeadForm الموحد ولا يضيف Attribution | عالٍ | البيانات | فقدان مصدر العميل وعدم اتساق القياس | `src/pages/contact/index.astro:191-302` مقابل `src/components/LeadForm.astro:63-85` |
| 8 | `_next` في نموذج التواصل يعيد لنفس صفحة التواصل بدل صفحة شكر/تأكيد | عالٍ | التحويل | ضعف تأكيد النجاح وقياس الإرسال | `src/pages/contact/index.astro:191-195` |
| 9 | طبقة Analytics مشروطة ببيانات HubSpot/Bing/Mixpanel ولا يظهر Event Taxonomy موحد للتحويل | عالٍ | القياس | لا يمكن إثبات أثر التغييرات | `src/components/MarketingScripts.astro:1-39` |
| 10 | الاعتماد على `formsubmit.co` والبريد في رحلة B2B لا يضمن CRM lifecycle أو Lead scoring | متوسط-عالٍ | العمليات | تسرب Leads وصعوبة المتابعة | `src/components/LeadForm.astro:1-18`; `src/pages/contact/index.astro:191` |
| 11 | صفحة التواصل تحتوي محتوى طويلًا بعد النموذج قد يؤخر المستخدم بدل اختصار الخطوة | متوسط | الاحتكاك | زيادة التردد قبل الإرسال | `src/pages/contact/index.astro:377-419` وما بعدها |
| 12 | البريد الظاهر Gmail بينما Schema/Action يستخدم أحيانًا `info@brightai.site` | متوسط | الثقة/الاتساق | إشارة مؤسسية غير متسقة | `src/pages/contact/index.astro:38-40`, `103-110`, `191` |
| 13 | بعض الادعاءات قوية جدًا: متوافق، تقارير جاهزة للمدقق، دعم سعودي 24/7؛ تحتاج صياغة قانونية ودليل | متوسط | المخاطر/الثقة | اعتراض قانوني أو فقدان ثقة | `src/pages/index.astro:15-24` |
| 14 | الروابط الداخلية في صفحة الأسعار ظاهرة كقسم SEO أكثر من كونها مساعدة قرار | متوسط | UX | تشويش الصفحة وتخفيف النية التجارية | قسم الروابط داخل `src/pages/pricing/index.astro` |
| 15 | بنية التنقل غنية جدًا بـDropdowns وحلول كثيرة، ما يزيد مخارج الرحلة | متوسط | التنقل | تقليل تركيز صفحات الهبوط | `src/components/Header.astro:30-59`, `81-159` |

---

## 5. تحليل القمع التحويلي

### المرحلة 1: الوصول

**الدرجة: 84%**

نقاط القوة:
- بنية محتوى وSitemap واسعة.
- تموضع سعودي عربي متخصص.
- صفحات حلول وقطاعات ومحتوى داعم.

الفجوة:
- كل صفحة دخول تحتاج Bridge واضحًا إلى الإجراء التالي بدل ترك الزائر يتنقل في شبكة كبيرة.

### المرحلة 2: الفهم

**الدرجة: 69%**

نقاط القوة:
- المشكلة التنظيمية مشروحة جيدًا.
- المزايا التقنية واضحة.

الفجوة:
- الفئة التجارية غير ثابتة: هل BrightAI منصة SaaS، نظام تشغيل، شركة استشارات، وكالة أتمتة، أم مزود وكلاء وشات بوت؟

### المرحلة 3: الثقة

**الدرجة: 55%**

المتاح:
- تفاصيل تقنية وتنظيمية.
- عنوان وهاتف وساعات عمل.
- لغة محلية وبيانات NAP.

المفقود أو غير بارز:
- Case Studies موثقة بأرقام قبل/بعد.
- شعارات عملاء مصرح بها.
- شهادات بأسماء وأدوار وشركات.
- Security/Architecture one-pager.
- توضيح دقيق لعبارات الامتثال: “يدعم الجاهزية” مقابل “متوافق بالكامل”.
- مصدر تقييم `4.8/47` إن كان سيستمر في Schema.

### المرحلة 4: التقييم التجاري

**الدرجة: 63%**

المتاح:
- صفحة أسعار.
- FAQ.
- مقارنة عروض.

الفجوة:
- العروض الحالية لا تعكس جوهر المنتج نفسه.
- 99 ريال يصنع مرساة سعرية غير متوافقة مع صفقة Enterprise.
- لا توجد حزمة Pilot واضحة بنطاق ومدة ومخرجات وشروط نجاح.

### المرحلة 5: التحويل

**الدرجة: 72%**

المتاح:
- CTA متعدد القنوات.
- نموذج كامل.
- موافقة PDPL.
- واتساب سريع.

الفجوة:
- كثرة الخيارات.
- نموذج التواصل منفصل عن المكوّن الموحد.
- صفحة الشكر غير مستخدمة في النموذج المباشر.
- لا توجد جدولة موعد مباشرة بعد التأهيل.

### المرحلة 6: القياس والمتابعة

**الدرجة: 58%**

المتاح:
- بنية Tracking integrations.
- Attribution في `LeadForm`.

الفجوة:
- لا يظهر Event schema موحد.
- لا يظهر ربط واضح بين Lead source وQualified lead وOpportunity.
- لا يمكن حساب Funnel حقيقي من المستودع فقط.

---

## 6. Persona Matrix

| الشخصية | الوظيفة المطلوب إنجازها | أكبر خوف | الدليل الذي يحتاجه | العرض الأنسب | CTA الأنسب | جاهزية الموقع لها |
|---|---|---|---|---|---|---:|
| CISO / مدير الأمن السيبراني | منع تسرب البيانات وضبط استخدام أدوات AI | Shadow AI وتسريب PII وعدم وجود سجل | Architecture، Threat model، Deployment، Audit logs | AI Firewall + Audit Trail Pilot | اطلب مراجعة معمارية | 78% |
| مسؤول الامتثال / DPO | إثبات الضوابط وربطها بـPDPL/NCA/SDAIA | ادعاءات امتثال غير قابلة للإثبات | Control mapping، Evidence pack، legal wording | Governance Readiness + Evidence File | احصل على تقييم الجاهزية | 82% |
| CIO / مدير التقنية | إدخال AI دون تعطيل الأنظمة | تعقيد التكامل وVendor lock-in | Integrations، SLA، deployment options، ROI | 30-day scoped pilot | احجز ديمو تنفيذي | 70% |
| مدير المخاطر / التدقيق الداخلي | معرفة من فعل ماذا ومتى ولماذا | قرارات AI غير قابلة للتتبع | Immutable trail، approvals، sample report | Audit Trail + Human Approval | شاهد نموذج ملف الأدلة | 73% |
| مدير التحول الرقمي | إطلاق حالة استخدام ناجحة وقابلة للتوسع | مشروع تجريبي بلا قيمة أو تبنٍ | KPIs، implementation plan، case study | Use-case discovery + Pilot | ابدأ ورشة تحديد النطاق | 65% |
| المشتريات | مقارنة مزود موثوق وتحديد نطاق واضح | غموض السعر والنطاق والدعم | Commercial package، SLA، procurement pack | Enterprise proposal | اطلب العرض المؤسسي | 48% |
| CEO/GM للمنشآت المتوسطة | تقليل المخاطر وتحقيق عائد سريع | تكلفة كبيرة وتعقيد | Business outcome، simple package، timeline | Starter Governance Sprint | احصل على خطة 30 يوم | 58% |

### الاستنتاج

أفضل مسار أساسي للموقع يجب أن يستهدف **CISO + Compliance + CIO**، مع مسارات ثانوية للشخصيات الأخرى. لا ينبغي وضع شات بوت وأتمتة عامة على نفس مستوى عرض حوكمة AI المؤسسي إلا إذا كانت وحدات واضحة داخل استراتيجية المنتج.

---

## 7. الهيكل المقترح للرسالة

### Category

**منصة تشغيل وضبط استخدام الذكاء الاصطناعي للمؤسسات السعودية**

### One-liner

> BrightAI تضيف طبقة أمان وحوكمة بين موظفيك وأدوات AI، فتمنع تسرب البيانات، توثق كل استخدام، وتفرض الموافقة البشرية على القرارات الحساسة.

### Who

- مؤسسات سعودية تستخدم أو تخطط لاستخدام AI.
- قطاعات منظمة: الحكومة، المالية، الصحة، الصناعة.
- فرق الأمن، الامتثال، التقنية، المخاطر والتدقيق.

### Outcomes

1. رؤية كاملة لاستخدامات AI.
2. تقليل تسرب البيانات والمخاطر التشغيلية.
3. سجل قابل للمراجعة.
4. موافقات بشرية للقرارات الحساسة.
5. أدلة تساعد على جاهزية PDPL/NCA/SDAIA.

### Primary CTA

**احجز ديمو حوكمة مخصص**

### Secondary CTA

**ابدأ تقييم الجاهزية**

### CTA سياقي فقط

واتساب يبقى قناة مساعدة، لا ينافس CTA الأساسي في كل موضع.

---

## 8. العرض التجاري المقترح

### عرض 1: Governance Readiness Assessment

- جلسة اكتشاف.
- جرد أولي لحالات استخدام AI.
- تصنيف مخاطر.
- Gap summary.
- توصية بالمرحلة التالية.

### عرض 2: 30-Day Controlled Pilot

- قسم أو حالة استخدام واحدة.
- AI Firewall.
- Audit Trail.
- سياسة أو اثنتان.
- Human Approval لمسار حساس.
- لوحة مؤشرات أساسية.
- تقرير نتائج ومعايير نجاح.

### عرض 3: Enterprise Rollout

- تكاملات مؤسسية.
- Deployment مناسب.
- أدوار وصلاحيات.
- حزم سياسات وأدلة.
- دعم وتشغيل وSLA.

هذه البنية أوضح من خلط “استشارة 99 ريال” مع “وكلاء AI” و“شات بوت” في صفحة واحدة.

---

## 9. خارطة الأولويات

### P0 — خلال أول دورة تنفيذ

1. تثبيت Category وOne-liner وCTA الأساسي.
2. إعادة بناء أعلى الصفحة الرئيسية حول Persona + Outcome + Proof + CTA.
3. توحيد نماذج الالتقاط على `LeadForm.astro` أو API/CRM موحد.
4. تحويل `_next` إلى `/thank-you/` وإطلاق حدث نجاح موثوق.
5. إنشاء Event taxonomy كامل.
6. إزالة أو إثبات أي Rating/Claim غير موثق.

### P1 — الدورة الثانية

7. إعادة صياغة صفحة الأسعار إلى Assessment / Pilot / Enterprise.
8. إضافة Proof hub: حالات استخدام، أرقام، Security architecture، نموذج Evidence File.
9. إنشاء CTA سياقي لكل Persona/صفحة قطاع.
10. تقليل الروابط التنافسية في صفحات التحويل.
11. توحيد البريد المؤسسي الظاهر والإرسال.

### P2 — الدورة الثالثة

12. ربط CRM وLead scoring.
13. إضافة Scheduling بعد التأهيل.
14. إطلاق A/B tests منظمة.
15. قياس Qualified Lead Rate بدل Form Submission فقط.

---

## 10. مؤشرات القياس المستهدفة

> القيم التالية أهداف تشغيلية مقترحة، وليست أداءً حاليًا.

| المؤشر | طريقة الحساب | الهدف الأولي |
|---|---|---:|
| Hero CTA CTR | نقر CTA / زيارات الصفحة | 5–9% |
| Pricing CTA CTR | نقر CTA / زيارات الأسعار | 8–14% |
| Form Start Rate | بدء نموذج / زيارات صفحة التحويل | 12–20% |
| Form Completion Rate | إرسال ناجح / بدء نموذج | 55–70% |
| Contact Page Conversion | إرسال ناجح / زيارات التواصل | 6–12% |
| Assessment Completion | إكمال / بدء التقييم | 45–65% |
| Qualified Lead Rate | Leads مؤهلة / Leads مستلمة | 25–45% |
| WhatsApp Assisted Conversion | Leads من واتساب / نقرات واتساب | 15–30% |
| Demo Show Rate | اجتماعات مكتملة / اجتماعات محجوزة | 65–80% |

### Event taxonomy الإلزامي

```text
page_view
hero_cta_click
secondary_cta_click
whatsapp_click
pricing_view
pricing_cta_click
proof_asset_view
case_study_view
assessment_start
assessment_complete
form_view
form_start
form_field_error
form_submit_attempt
form_submit_success
form_submit_failure
calendar_open
meeting_booked
qualified_lead
opportunity_created
```

خصائص مشتركة:

```text
page_path, page_type, persona, offer, cta_label, cta_position,
source, medium, campaign, content, term, referrer, device,
language, form_id, lead_id, experiment_id, variant
```

---

## 11. خطة اختبارات A/B

| الأولوية | الفرضية | A | B | المؤشر الأساسي |
|---|---|---|---|---|
| 1 | توضيح الفئة يرفع CTA CTR | Saudi AI Safety OS | منصة أمان وحوكمة AI للمؤسسات السعودية | Hero CTA CTR |
| 2 | CTA محدد يقلل التردد | تواصل معنا | احجز ديمو حوكمة مخصص | Qualified demo rate |
| 3 | Proof قريب من Hero يرفع الثقة | Proof لاحق | Architecture + outcomes + verified logos أسفل Hero | CTA CTR |
| 4 | Pilot واضح يرفع جودة Leads | سعر مخصص | Pilot 30 يوم بنطاق ومخرجات | Qualified Lead Rate |
| 5 | نموذج أقصر يرفع الإكمال | النموذج الحالي | بريد عمل + شركة + دور + احتياج | Completion Rate |
| 6 | Assessment يلتقط الزوار غير الجاهزين | CTA تواصل | CTA تقييم الجاهزية | Assessment-to-lead |

لا يعتمد أي Variant قبل حجم عينة مناسب وحد أدنى أسبوعين، مع مراقبة جودة Leads لا النقرات فقط.

---

# 12. البرومبتات التنفيذية


## البرومبت 5 — القياس والتحليلات وCRM readiness

```text
ROLE
أنت Analytics Architect + Growth Engineer لموقع B2B Enterprise.

GOAL
أنشئ طبقة قياس موحدة تمكّن حساب القمع من الزيارة حتى Qualified Lead دون تسريب بيانات شخصية.

SOURCE OF TRUTH
- audit/cro-2026/MASTER-CRO-AUDIT-AR.md
- src/components/MarketingScripts.astro
- src/data/marketing.*
- scripts/analytics-test.mjs
- كل data attributes الحالية المرتبطة بالتتبع

EVENTS REQUIRED
page_view, hero_cta_click, secondary_cta_click, whatsapp_click,
pricing_view, pricing_cta_click, proof_asset_view, case_study_view,
assessment_start, assessment_complete, form_view, form_start,
form_field_error, form_submit_attempt, form_submit_success,
form_submit_failure, calendar_open, meeting_booked.

COMMON PROPERTIES
page_path, page_type, persona, offer, cta_label, cta_position,
source, medium, campaign, content, term, referrer, device,
language, form_id, experiment_id, variant.

TASKS
- أنشئ API داخلية صغيرة للتتبع بدل استدعاءات متفرقة.
- اعمل مع أي Provider مفعّل حاليًا، ولا تفترض وجود مفاتيح.
- اجعل No-provider mode آمنًا ولا يرمي أخطاء.
- وحّد data attributes للـCTA والنماذج.
- أضف deduplication لأحداث page load وAstro navigation.
- احترم Consent policy الحالية.
- امنع email/name/phone/message وأي PII من payloads.
- حدّث analytics-test ليختبر أسماء الأحداث والخصائص المسموحة ومنع PII.
- وثق mapping من أحداث الموقع إلى HubSpot/Mixpanel/Bing عند تفعيلها.

DASHBOARD SPEC
عرّف المقاييس دون بناء Dashboard إذا لا توجد منصة بيانات:
- Landing → Hero CTA
- CTA → Form view
- Form view → Form start
- Form start → Submit success
- Submit success → Qualified lead
- Qualified lead → Opportunity
مع تقسيم حسب page_type/persona/offer/source/device.

ACCEPTANCE CRITERIA
- لا Event مكرر مع Astro page transitions.
- لا PII في Analytics.
- جميع CTAs الأساسية تُقاس.
- فشل Provider لا يؤثر على UX.
- tests + build ينجحان.
```

## البرومبت 6 — الثقة والأدلة واختبار CRO النهائي

```text
ROLE
أنت Enterprise Trust Designer + CRO QA Lead + Technical Copy Reviewer.

GOAL
ابنِ طبقة ثقة قابلة للتحقق، راجع الادعاءات، ثم نفذ QA وتحضير A/B tests دون اختراع أدلة.

SOURCE OF TRUTH
- audit/cro-2026/MASTER-CRO-AUDIT-AR.md
- صفحات home, trust, about, customers, solutions, pricing, contact
- Schema المرتبط بالتقييمات والعملاء والمنتج
- الأصول والتقارير الموجودة في المستودع

TASKS — TRUST
1. أنشئ inventory لكل claim: claim، file:line، نوع الدليل، مالك الدليل، الحالة.
2. صنف الادعاءات: verified / needs qualification / remove.
3. راجع خصوصًا:
   - “متوافق مع PDPL”
   - “جاهز للمدققين”
   - “دعم سعودي 24/7”
   - aggregateRating 4.8 من 47
   - أي شعارات أو أرقام عملاء
4. لا تعرض Rating أو Customer proof دون مصدر يمكن توثيقه.
5. استخدم أدلة حقيقية فقط: architecture diagram، sample evidence file، control mapping، deployment matrix، case study مصرح بها، شهادة باسم ودور وشركة.
6. اجعل proof قريبًا من نقطة الاعتراض والـCTA بدل وضعه كله في صفحة منفصلة.

TASKS — CRO QA
- تحقق من Home → Pricing → Contact → Thank You.
- اختبر 390x844 و655x621 و1440x900، RTL، keyboard، reduced motion، dark mode.
- راجع CTA consistency وevent payloads وform states.
- تحقق من عدم كسر canonical/hreflang/schema/sitemap/internal links.
- شغل build والاختبارات الموجودة.

A/B TEST PLAN
جهز Flags أو آلية المشروع الحالية لاختبار واحد فقط أولًا:
A: “Saudi AI Safety OS”
B: “منصة أمان وحوكمة AI للمؤسسات السعودية”
Primary metric: hero_cta_click / homepage_view
Guardrails: bounce proxy, form completion, qualified lead rate
لا تطلق الاختبار قبل التأكد من event deduplication.

ACCEPTANCE CRITERIA
- كل Claim مهم له دليل أو صياغة مقيدة.
- لا توجد بيانات Schema غير مدعومة بالمحتوى المرئي/المصدر.
- الرحلة الأساسية تعمل على المقاسات الثلاثة.
- نتائج QA موثقة بالمسار والسطر واللقطات.
- لا يُعلن نجاح CRO من النقرات فقط؛ يجب تضمين Qualified Lead Rate.
```

---

## 13. ترتيب تشغيل البرومبتات

1. **Prompt 1** — التموضع والرسالة.
2. **Prompt 2** — الصفحة الرئيسية.
3. **Prompt 3** — العروض والتسعير.
4. **Prompt 4** — النماذج والتحويل.
5. **Prompt 5** — القياس.
6. **Prompt 6** — الثقة وQA والاختبار.

لا يُنصح بتنفيذها بالتوازي؛ البرومبتات 2–6 تعتمد على قرار التموضع في البرومبت 1، والاختبار النهائي يعتمد على اكتمال القياس.

---

## 14. تعريف النجاح النهائي

يعتبر المشروع جاهزًا لاختبار CRO عندما تتحقق الشروط التالية:

- يستطيع زائر جديد وصف BrightAI بدقة بعد قراءة Hero فقط.
- يوجد Primary CTA واحد ثابت ومناسب لصفقة B2B.
- كل عرض له جمهور ونطاق ومخرج واضح.
- كل Claim حساس مدعوم أو مقيد لغويًا.
- جميع النماذج موحدة وتلتقط Attribution.
- نجاح الإرسال قابل للقياس ولا يرسل PII إلى Analytics.
- يمكن حساب القمع حتى Qualified Lead.
- تجتاز الرحلة الأساسية RTL وKeyboard وMobile QA.
- يبدأ A/B testing بعد اكتمال القياس، لا قبله.

**الدرجة المستهدفة بعد التنفيذ:** 86–90% جاهزية تحويلية، على أن تُستبدل درجات الجاهزية لاحقًا بمؤشرات فعلية من Analytics وCRM.
