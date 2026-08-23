# تدقيق `/answer/`: تعارض الكلمات وضعف المحتوى

**التاريخ:** 2026-08-23  
**النطاق:** جميع صفحات `/answer/` (17 صفحة)، مع مقارنة مالك النية داخل `/solutions/` و`/hub/` و`/docs/` و`/blog/` و`/assessment/`.  
**نوع العمل:** تدقيق وقرار معلوماتي فقط؛ لا تغييرات URL أو `noindex` أو redirects أو deploy.

## الخلاصة التنفيذية

القرار ليس حذفًا جماعيًا. توجد 12 صفحة يمكن أن تبقى كإجابات مختصرة إذا صارت تؤدي وظيفة جوابية حقيقية ومربوطة بمالكها الكنسي، وصفحتان قطاعيتان وثلاث صفحات منتجية لا تضيف نية جوابية مستقلة ويجب دمج محتواها ثم تحويلها لاحقًا.

أكبر مشكلة مشتركة ليست عدد الكلمات: القالب الحالي يكرر الإجابة نفسها في الـ hero وفي الجسم، ولا يقدّم روابط مصادر أو روابط للمرجع الكنسي، وجميع الصفحات تربط فقط بـ`/kernel/chat/`. لذلك لا يثبت للقارئ أو لمحرك البحث لماذا توجد الصفحة إلى جانب الـ hub أو الدليل أو صفحة الحل.

لا توجد بيانات GSC أو backlinks أو تحقق حي متاح في هذه البيئة؛ لا impressions/clicks/query data ولا URL Inspection، وDNS للإنتاج غير متحقق. استُخدم بدل ذلك دليل المستودع والبناء المحلي: النية، المحتوى، الـ canonical المحلي، sitemap، الروابط الداخلية، و`llms.txt`/`llms-full.txt`. قبل تنفيذ أي redirect، يجب استيراد 90 يومًا من GSC لكل URL ومراجعة backlinks من الأداة المتاحة.

## دليل التدقيق

- البناء المحلي الحالي يحتوي **17** صفحة جواب؛ كلها self-canonical وindexable وموجودة ضمن surface محلي متحقق سابقًا.
- النص المرئي لكل صفحة بين **122 و151 كلمة**، لكنه مكرر عمليًا مرتين داخل الصفحة؛ لا يُستخدم الرقم وحده للحكم.
- الروابط الخارجة الموضوعية في الصفحات = **0**؛ الرابط الوحيد في كل صفحة هو CTA عام إلى `/kernel/chat/`.
- الروابط الداخلية الواردة من HTML المبني بين **1 و3** لكل URL، وهي إشارات ضعيفة وليست سببًا كافيًا للإبقاء أو الإزالة.
- `public/llms-full.txt` يسمي الأدلة/المقالات التالية كـ citation anchors للأسئلة نفسها: `/hub/ai-governance/` و`/docs/pdpl-ai-complete-guide/` و`/docs/nca-ecc-ai-controls/` و`/docs/sdaia-generative-ai-guidelines/` و`/blog/iso-42001-saudi-implementation-guide/`. هذا يثبت وجود owners أقوى، لكنه لا يمنع وجود quick answer مميز يرسل إليها.
- لا توجد إشارات `hreflang` صريحة بين أزواج answer الإنجليزية/العربية في ملف الأزواج؛ كما أن قالب answer يثبت `lang="ar" dir="rtl"` لجميع الصفحات. هذا خلل لغة/تدويل يجب إصلاحه قبل اعتبار الزوجين بديلين متكافئين.

## قرارات URL

| URL | القرار | النية والمالك الكنسي | الدليل والشرط قبل التنفيذ |
|---|---|---|---|
| `/answer/ai-governance-saudi-arabia/` | **KEEP** | تعريف إنجليزي سريع؛ المرجع المعلوماتي `/hub/ai-governance/`، مع `/blog/ai-governance-saudi-arabia/` للتفصيل السعودي. | يحافظ على نية إنجليزية منفصلة عن العربية. لا يبقى بشكله الحالي: إنجليزي فعليًا، مصدران رسميان/أوليان، ورابط مباشر إلى الـ hub. |
| `/answer/ai-governance-saudi-arabia-ar/` | **KEEP** | تعريف عربي سريع؛ `/hub/ai-governance/` هو الـ pillar. | لا يُحوّل فقط لأن النص قريب من النسخة الإنجليزية؛ العربية نية مستقلة. أضف `hreflang` ثنائيًا وغيّر السؤال إلى عربي طبيعي. |
| `/answer/ai-governance-framework/` | **KEEP** | سؤال تعريفي أضيق عن مكوّنات الإطار؛ المالك `/hub/ai-governance/`. | قيمة فريدة ممكنة إذا اقتصر على «ما مكوّنات الإطار؟» بدل إعادة تعريف الحوكمة العامة. |
| `/answer/ai-firewall-saudi/` | **KEEP** | تعريف إنجليزي لطبقة تحكم؛ المالك التجاري `/solutions/ai-firewall/` والشرح التقني في docs. | احتفظ بسؤال “what is”، لا وعود منتجية مطلقة، واربط بالحل والدليل/المصدر. |
| `/answer/ai-firewall-saudi-ar/` | **KEEP** | تعريف عربي لجدار حماية AI؛ المالك `/solutions/ai-firewall/`. | نية لغة مستقلة؛ صحح خلط العربية/الإنجليزية، وضع رابط حل + مصدر موثوق للضوابط المذكورة. |
| `/answer/pdpl-ai-compliance/` | **KEEP** | تعريف إنجليزي مختصر؛ المالك الفني `/docs/pdpl-ai-complete-guide/`، والمرجعي `/pdpl-statement/`. | لا يصف أي حزمة كإثبات امتثال؛ أضف رابط النظام/البيان والدليل. |
| `/answer/pdpl-ai-compliance-ar/` | **KEEP** | تعريف عربي مختصر؛ نفس المالك الفني. | أبقه بالعربية الكاملة، مع `hreflang` مقابل النسخة الإنجليزية ورابط next-step إلى دليل PDPL. |
| `/answer/iso-42001/` | **KEEP** | سؤال تعريف المعيار، بينما التطبيق الكامل يملكه `/blog/iso-42001-saudi-implementation-guide/`. | قيمة answer فريدة إذا اقتصر على تعريف AIMS وما لا يغطيه؛ يربط للدليل ومرجع ISO الرسمي، بلا ادعاء شهادة/امتثال. |
| `/answer/nca-ecc-controls/` | **KEEP** | سؤال محدد عن ECC؛ المالك الفني `/docs/nca-ecc-ai-controls/` والمدونة الداعمة `/blog/nca-ecc-ai-controls-guide/`. | هو الجواب الأقوى من زوج NCA، بشرط استبدال ادعاءات controls غير الموثقة بروابط NCA/docs. |
| `/answer/nca-compliance/` | **MERGE** | نفس تعريف تطبيق ECC على AI تقريبًا؛ المالك الأسرع للجواب هو `/answer/nca-ecc-controls/`، والتفصيل `/docs/nca-ecc-ai-controls/`. | انقل أي صياغة مفيدة إلى صفحة ECC، واجعلها تجيب صراحة عن “كيف يرتبط امتثال NCA بـ ECC؟”. بعدها يراجع GSC/backlinks قبل 301 إلى `/answer/nca-ecc-controls/`. |
| `/answer/audit-trail-saudi-ar/` | **KEEP** | تعريف «ما هو سجل التدقيق؟»؛ الحل التجاري `/solutions/ai-audit-trail/` والدليل `/docs/ai-audit-trail/`. | نية تعريفية مختلفة عن طلب شراء الحل. أزل ادعاءات التخزين/المفاتيح غير المثبتة وأضف مصدرًا + next step. |
| `/answer/sdaia-generative-ai/` | **KEEP** | سؤال مباشر عن الإرشادات؛ المالك الفني `/docs/sdaia-generative-ai-guidelines/` والمقال الداعم. | أبقه جوابًا للمبادئ والنطاق فقط؛ يربط إلى الدليل ومرجع SDAIA الرسمي، ولا يخلط الإرشاد بالتزام قانوني عام. |
| `/answer/sama-ai/` | **KEEP** | سؤال محدد عن حوكمة AI في السياق المصرفي؛ المالك التحليلي `/blog/sama-ai/` والحل القطاعي `/solutions/banking-ai-governance/`. | يبقى كإجابة عن النطاق والضوابط، لا كصفحة “SAMA Pack”. يلزم مصدر SAMA ورابط إلى المقال ثم الحل كخطوة تالية. |
| `/answer/ai-banking/` | **REDIRECT** | صفحة قطاعية تجارية تتطابق H1/نيةً مع `/lp/banking/` وتنافس `/solutions/banking-ai-governance/`. | ادمج أي فقرة تعريفية نافعة داخل صفحة الحل القطاعي، ثم 301 إلى `/solutions/banking-ai-governance/` بعد فحص GSC/backlinks. لا redirect قبل الفحص. |
| `/answer/ai-healthcare/` | **REDIRECT** | صفحة قطاعية تجارية تتطابق H1/نيةً مع `/lp/healthcare/` وتنافس `/solutions/healthcare-ai-governance/`. | ادمج فقرة التعريف في صفحة الحل القطاعي، ثم 301 إلى `/solutions/healthcare-ai-governance/` بعد فحص GSC/backlinks. |
| `/answer/ai-safety-platform-enterprise/` | **REDIRECT** | صفحة اختيار منصة/منتج، لا جواب مستقل؛ المالك التجاري `/solutions/ai-governance-platform/`. | انقل أي شرح غير مكرر إلى صفحة الحل، ثم 301 بعد التحقق؛ لا تحولها إلى `noindex` لأن ذلك لا ينقل equity. |
| `/answer/saudi-ai-safety-os/` | **REDIRECT** | استعلام branded/product positioning، لا quick answer محايد؛ المالك `/solutions/ai-governance-platform/`. | استبدل ادعاءات الاستضافة/التوجيه غير المثبتة بنص منتج دقيق في المالك، ثم 301 بعد فحص الأداء والروابط الخارجية. |

**NOINDEX: لا شيء.** لا توجد حالة مثبتة تستحق إسقاط URL من الفهرسة بدل توحيده أو الإبقاء عليه. وغياب GSC/backlink data يجعل `noindex` قرارًا عالي المخاطرة.

## خريطة الملكية المقترحة

```text
quick definition (/answer) ──→ informational owner (/hub, /docs, /blog)
                                   └──→ commercial next step (/solutions or /assessment)

/answer/ai-banking, /answer/ai-healthcare,
/answer/ai-safety-platform-enterprise, /answer/saudi-ai-safety-os/
                                   └──→ merge copy → 301 to /solutions owner
```

## قالب answer الإلزامي للصفحات التي تبقى

لا يحتاج تصميمًا تسويقيًا أو JavaScript. استخدم صفحة خفيفة فيها، بالترتيب:

1. **الإجابة المباشرة:** فقرة واحدة فريدة لا تُعرض مرة ثانية في الصفحة.
2. **ليش يهم بالسعودية:** سطران مرتبطان بالنطاق، مع تجنب صياغة الامتثال كضمان.
3. **نقاط أساسية:** 3–5 نقاط فقط، مختلفة حسب السؤال.
4. **مصادر:** روابط رسمية أو أولية مناسبة للسؤال، مع وسم أنها مراجع وليست استشارة قانونية.
5. **الخطوة الجاية:** رابط واحد وصفي للـ pillar أو الدليل أولًا؛ ثم رابط ثانوي اختياري للحل أو `/assessment/ai-governance-readiness/` عندما تكون النية تحويلية.

متطلبات مشتركة: `lang` مطابق للغة الفعلية، `hreflang` فقط للأزواج الحقيقية، عنوان ووصف لا يكرران الـ owner، BreadcrumbList للصفحات الداخلية، وWebPage schema فقط ما لم توجد أسئلة متعددة ظاهرة. لا تضف FAQ schema بسؤال واحد فقط من أجل النتيجة الغنية.

## ترتيب التنفيذ الآمن

1. استخرج 90 يومًا من GSC لكل URL: clicks, impressions, top queries, Google-selected canonical؛ وافحص backlinks من الأداة المتاحة.
2. نفذ قالب keep على صفحة نموذجية (مثل `/answer/iso-42001/`) وتحقق من HTML، اللغة، الروابط، وcanonical قبل تعميمه.
3. انقل المحتوى الفريد من صفحات REDIRECT/MERGE إلى الـ owner المحدد، ثم أضف redirect فرديًا واختبر المصدر والوجهة وغياب السلاسل.
4. لا تنفذ redirects بالجملة، ولا تستخدم `noindex`. راقب GSC 28–56 يومًا بعد كل دفعة صغيرة.

## حدود الثقة

- لا GSC، لا backlink export، ولا HTTP production check في بيئة التدقيق؛ لذلك قرارات redirect مشروطة بالفحص السابق.
- وجود inbound internal links من البناء المحلي (1–3 لكل answer) لا يساوي قيمة بحثية أو backlink خارجي.
- التقرير لا يصادق على أي claim تنظيمي أو تقني موجود في النسخ الحالية؛ بعض claims المنتجية/التخزينية تحتاج إثباتًا أو إزالة عند إعادة كتابة القالب.
