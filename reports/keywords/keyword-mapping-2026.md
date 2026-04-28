# توزيع الكلمات المفتاحية على صفحات BrightAI - 2026

المصدر: `reports/keywords strategy 2026.xlsx`، ورقة `الكلمات المفتاحية الاستراتيجية`.

ملاحظة تنفيذية: لم يتم تعديل صفحات HTML في هذه المرحلة. التوزيع أدناه يعالج الاستهداف وCannibalization على مستوى الخريطة فقط، لأن إدخال الكلمات داخل النص دون حاجة تحريرية سيكون حشواً. عند التنفيذ اللاحق، يكون التعديل فقط في `title` أو `H1` أو فقرة توضيحية موجودة إذا كانت الصفحة لا تعكس النية فعلاً.

## قاعدة التصنيف

- `Main`: الكلمة الأساسية المرشحة لصفحة مال أو صفحة قطاع مهمة.
- `Secondary`: كلمة داعمة لصفحة قائمة ولا تستحق صفحة مستقلة حالياً.
- `Long-tail`: عبارة طويلة أو مركبة ذات نية دقيقة.
- `Question`: لا توجد صيغة سؤال صريحة داخل جدول الكلمات الاستراتيجية؛ توجد أسئلة في ورقة حجم البحث العام مثل `ما هو الذكاء الاصطناعي`.
- `Commercial`: نية مقارنة/اختيار مورد.
- `Informational`: نية فهم أو بحث.
- `Transactional`: نية طلب حل أو أداة أو تنفيذ.
- `B2B`: موجهة للشركات.
- `B2G`: موجهة أو مناسبة للجهات الحكومية والمناقصات والامتثال.
- `Saudi local`: مرتبطة بالسعودية أو الرياض أو أنظمة محلية مثل `NCA`, `NDMO`, `PDPL`, `Etimad`.

## جدول التوزيع

| الكلمة | النية | الصفحة النهائية | هل تم تعديل الصفحة؟ | سبب الاختيار | خطر Cannibalization |
|---|---|---|---|---|---|
| استشارات الذكاء الاصطناعي السعودية | Main, Long-tail, Commercial, B2B, B2G, Saudi local | `/consultation/` | لا | الصفحة تحمل الكلمة تقريباً في `title` و`H1` وهي صفحة تحويل مباشرة للاستشارات. | متوسط مع `/docs/consultation/`؛ اجعل الوثائق داعمة لا صفحة مال. |
| التحول الرقمي رؤية 2030 | Secondary, Long-tail, Informational, Commercial, B2B, B2G, Saudi local | `/blog/vision-2030-ai-opportunities/` | لا | النية معلوماتية استراتيجية، والصفحة الحالية عن رؤية 2030 والذكاء الاصطناعي أنسب من صفحة الخدمات. | منخفض؛ اربطها داخلياً بـ`/consultation/` عند نية التنفيذ. |
| شركات الذكاء الاصطناعي في الرياض | Main, Long-tail, Commercial, B2B, Saudi local | `/about/` | لا | صفحة `about` تستهدف شركة ذكاء اصطناعي وطنية في الرياض وتناسب نية التحقق من المورد المحلي. | متوسط مع `/` و`/contact/`؛ الصفحة الرئيسية تبقى للعلامة الأوسع. |
| تطوير نماذج تعلم الآلة السعودية | Main, Long-tail, Commercial, B2B, Saudi local | `/machine-learning/` | لا | الصفحة مخصصة للكلمة نفسها تقريباً، وهي أفضل من مقالات التعلم الآلي العامة. | منخفض مع مقالات ML؛ اجعل المقالات داعمة لا منافسة. |
| أتمتة التسويق بالذكاء الاصطناعي | Main, Long-tail, Commercial, Transactional, B2B | `/sectors/ecommerce/` | لا | صفحة التجارة الإلكترونية تحمل الكلمة في `title` و`H1` وتناسب فرق التسويق والتجارة. | متوسط مع `/blog/الذكاء-الاصطناعي-و-التسويق/`؛ المقالة للتثقيف فقط. |
| استراتيجية البيانات والذكاء الاصطناعي | Main, Long-tail, Commercial, Informational, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/data-ai-strategy/` | لا | لا توجد صفحة متخصصة لاستراتيجية البيانات والذكاء الاصطناعي؛ ذكر حوكمة البيانات متفرق داخل صفحات أخرى. | متوسط مع `/consultation/`؛ اجعل الصفحة الجديدة صفحة منهج/استراتيجية وتحيل للاستشارة. |
| Saudi AI Adoption Framework | Secondary, Long-tail, Informational, B2B, B2G, Saudi local | `/en/consultation/` | لا | النية إنجليزية ومؤسسية؛ أنسب صفحة حالية هي الاستشارات الإنجليزية. | متوسط؛ إذا توسع المحتوى الإنجليزي أنشئ `/en/saudi-ai-adoption-framework/`. |
| خدمات التحول الرقمي للشركات | Main, Long-tail, Transactional, Commercial, B2B, Saudi local | `/services/` | لا | صفحة الخدمات هي صفحة المال الأوسع للحلول والتحول الرقمي. | متوسط مع `/smart-automation/` و`/consultation/`؛ اجعل الخدمات بوابة عامة. |
| تحليل البيانات الضخمة السعودية | Secondary, Long-tail, Commercial, B2B, Saudi local | `/data-analysis/` | لا | صفحة تحليل البيانات للشركات السعودية تغطي التحليلات وBI، وهي أقرب صفحة مال. | متوسط مع `/blog/big-data-analysis/`؛ المقالة تشرح المفهوم والصفحة التجارية تستقبل التحويل. |
| حوكمة البيانات NDMO | Main, Long-tail, Informational, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/data-governance-ndmo/` | لا | لا توجد صفحة مخصصة لـ`NDMO`؛ الذكر الحالي متفرق داخل صفحات الخدمات. | متوسط مع `/privacy-cookies/` و`/consultation/`؛ اجعل الجديدة للحكومة والحوكمة لا سياسة خصوصية. |
| ذكاء الأعمال والتحليلات التنبؤية | Main, Long-tail, Commercial, B2B | `/docs/solutions-bi/` | لا | توجد صفحة BI متخصصة، لكنها وثائقية؛ تصلح حالياً حتى إنشاء صفحة مال BI مستقلة. | مرتفع مع `/data-analysis/`؛ الأفضل مستقبلاً إنشاء `/business-intelligence/` كصفحة مال وجعل الوثائق داعمة. |
| الامتثال لنظام حماية البيانات PDPL | Main, Long-tail, Transactional, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/pdpl-ai-data-compliance/` | لا | صفحة الخصوصية لا تصلح كصفحة خدمة امتثال، والنية تجارية/قانونية. | متوسط مع `/privacy-cookies/`؛ يجب فصل سياسة الموقع عن خدمة الامتثال. |
| تأسيس مكتب إدارة البيانات | Secondary, Long-tail, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/data-governance-ndmo/` | لا | نفس عنقود `NDMO`، ولا يستحق صفحة منفصلة قبل وجود عرض خدمة واضح. | منخفض إذا كانت الكلمة داعمة داخل صفحة NDMO. |
| أدوات تحليل البيانات بالذكاء الاصطناعي | Main, Long-tail, Commercial, Informational, B2B | `/tools/` | لا | الصفحة تحمل الكلمة في `title` و`H1` وتناسب نية الأدوات. | متوسط مع `/try/` و`/data-analysis/`؛ اجعل `/tools/` دليل أدوات و`/data-analysis/` خدمة. |
| Data Sovereignty Cloud Solutions KSA | Main, Long-tail, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/en/data-sovereignty-cloud-ksa/` | لا | لا توجد صفحة إنجليزية مخصصة للسيادة السحابية؛ الذكر الحالي متفرق داخل AI Agent والوثائق. | متوسط مع `/en/ai-agent/`؛ اجعل الجديدة امتثال واستضافة لا منتج وكيل. |
| لوحات معلومات تفاعلية للشركات | Secondary, Long-tail, Commercial, B2B | `/data-analysis/` | لا | تدخل ضمن عروض تحليل البيانات ولوحات BI التنفيذية. | متوسط مع `/docs/solutions-bi/`؛ اجعل الوثائق شرحاً تقنياً والصفحة التجارية للتحويل. |
| نظام تحليل المناقصات بالذكاء الاصطناعي | Main, Long-tail, Transactional, B2B, B2G, Saudi local | `/tenders/` | لا | الصفحة تحمل الكلمة نفسها تقريباً وهي صفحة المنتج الأساسية. | متوسط مع `/tenders/landing/`؛ اجعل `/tenders/` canonical/بوابة أساسية و`landing` صفحة عرض داعمة. |
| منصة اعتماد للمنافسات الحكومية | Secondary, Long-tail, Informational, B2G, Saudi local | صفحة جديدة مقترحة: `/blog/etimad-tenders-ai-guide/` | لا | لا يجب استهداف اسم منصة رسمية بصفحة منتج توحي بملكية؛ الأنسب دليل معلوماتي يشرح الاستخدام حول اعتماد. | متوسط؛ تجنب منافسة `/tenders/` واحذر الانطباع الرسمي. |
| تحليل العقود الذكية السعودية | Secondary, Long-tail, Commercial, B2B, B2G, Saudi local | `/tenders/landing/` | لا | الصفحة تشرح تحليل العقود والمناقصات داخل السعودية. | متوسط مع `/tenders/compare/`؛ اجعل `compare` لسيناريو المقارنة لا الكلمة العامة. |
| أتمتة المشتريات للشركات | Main, Long-tail, Commercial, B2B | صفحة جديدة مقترحة: `/procurement-automation/` | لا | توجد إشارات داخل الأتمتة والمناقصات، لكن لا توجد صفحة مال واضحة للمشتريات. | متوسط مع `/smart-automation/`؛ الجديدة للمشتريات، والقديمة للأتمتة العامة. |
| Etimad Tender Translation AI | Secondary, Long-tail, Transactional, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/en/etimad-tender-translation-ai/` | لا | نية إنجليزية دقيقة ولا توجد صفحة مناسبة حالية. | منخفض إذا بقيت صفحة إنجليزية متخصصة وتحيل إلى `/tenders/`. |
| إعداد العروض الفنية والمالية | Secondary, Long-tail, Informational, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/blog/technical-financial-proposals-ai/` | لا | نية تعليمية/تجارية تحتاج دليلاً لا صفحة منتج مباشرة. | منخفض مع `/tenders/`; اجعلها مرحلة قبل التحويل. |
| استكشاف مناقصات اعتماد بالذكاء الاصطناعي | Secondary, Long-tail, Commercial, B2B, B2G, Saudi local | `/tenders/landing/` | لا | الصفحة تتحدث عن مراقبة/تحليل المنافسات ولا تدعي صفة رسمية. | متوسط مع `/tenders/`; أبقِ `/tenders/` للكلمة الرئيسية العامة. |
| إدارة مخاطر الموردين AI | Main, Long-tail, Commercial, B2B, B2G | صفحة جديدة مقترحة: `/supplier-risk-ai/` | لا | لا توجد صفحة متخصصة لمخاطر الموردين؛ الموضوع أوسع من المناقصات فقط. | منخفض مع `/tenders/` إذا تم ربطها كسلسلة إمداد ومخاطر. |
| الأرشيف الطبي الذكي بالذكاء الاصطناعي | Main, Long-tail, Commercial, B2B, Saudi local | `/smart-medical-archive/` | لا | الصفحة تحمل الكلمة في `title` و`H1` وهي صفحة المنتج/الحل المناسبة. | منخفض مع صفحات الصحة؛ صفحة الصحة تبقى قطاعية. |
| الذكاء الاصطناعي في التشخيص الطبي | Secondary, Long-tail, Informational, Commercial, B2B, Saudi local | `/sectors/healthcare/` | لا | صفحة القطاع الصحي أقرب للموضوع الواسع من الأرشيف الطبي. | متوسط مع مدونات الصحة؛ اجعل المقالات لحالات الاستخدام لا صفحة القطاع. |
| السجلات الصحية الإلكترونية السعودية EHR | Secondary, Long-tail, Transactional, B2B, Saudi local | `/smart-medical-archive/` | لا | الصفحة تذكر EHR والتكامل، لكنها ليست نظام EHR كامل؛ استخدمها بحذر كدعم لا وعد منتج. | متوسط؛ إذا ظهر عرض EHR فعلي فأنشئ صفحة مستقلة. |
| نظام معلومات المستشفيات HIS | Secondary, Long-tail, Commercial, B2B, Saudi local | `/smart-medical-archive/` | لا | الصفحة تذكر التكامل مع HIS ولا تقدم HIS كامل؛ مناسبة ككلمة داعمة فقط. | متوسط؛ لا تستهدفها كـMain حتى لا توحي بمنتج HIS. |
| التحول الرقمي في الرعاية الصحية | Main, Long-tail, Informational, B2B, B2G, Saudi local | `/health/` | لا | الصفحة تحمل الكلمة نفسها تقريباً وتخدم النية القطاعية. | متوسط مع `/sectors/healthcare/`؛ اجعل `/health/` للتحول الرقمي و`sectors` لحالات AI القطاعية. |
| تحليل البيانات الجينية AI | Main, Long-tail, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/genomic-data-ai/` | لا | لا توجد صفحة جينية أو بحثية مناسبة؛ لا ينبغي تحميلها على صفحة الصحة العامة. | منخفض إذا أنشئت فقط عند وجود خدمة/خبرة فعلية. |
| أتمتة مواعيد المرضى | Main, Long-tail, Transactional, B2B, Saudi local | صفحة جديدة مقترحة: `/patient-appointment-automation/` | لا | توجد دراسة حالة عن جدولة مستشفى، لكن لا توجد صفحة حل قابلة للتحويل. | متوسط مع `/smart-medical-archive/` و`/health/`؛ افصلها كحل جدولة. |
| أتمتة العمليات الروبوتية RPA | Secondary, Long-tail, Informational, Commercial, B2B | `/smart-automation/` | لا | الصفحة تتحدث عن RPA والأتمتة الذكية وتناسب النية. | متوسط مع `/ai-workflows/`؛ اجعل RPA داخل الأتمتة، وworkflows لسير العمل. |
| الذكاء الاصطناعي في الخدمات اللوجستية | Main, Long-tail, Commercial, B2B, Saudi local | `/sectors/logistics/` | لا | الصفحة تحمل الكلمة نفسها تقريباً وتستهدف القطاع. | منخفض مع مقالات اللوجستيات؛ المقالات داعمة. |
| تحسين سلاسل الإمداد AI | Main, Long-tail, Commercial, B2B | `/docs/solutions-supply-chain/` | لا | توجد صفحة حلول سلسلة الإمداد لكنها وثائقية؛ تصلح مؤقتاً حتى إنشاء صفحة قطاع/حل تجاري. | مرتفع مع `/sectors/logistics/`؛ الأفضل صفحة مال مستقلة `/supply-chain-ai/`. |
| الأتمتة الذكية للعمليات | Main, Long-tail, Informational, Commercial, B2B | `/smart-automation/` | لا | صفحة الأتمتة الذكية هي الصفحة التجارية الأقرب. | متوسط مع `/ai-workflows/`; لا تستخدم نفس العنوان الرئيسي في الصفحتين. |
| أتمتة الفواتير والمشتريات | Secondary, Long-tail, Transactional, B2B | `/smart-automation/` | لا | توجد قوالب ومحتوى عن الفواتير والمشتريات داخل الصفحة. | متوسط؛ عند التوسع اجعلها قسماً داخل `/procurement-automation/`. |
| دمج الأنظمة القديمة RPA | Secondary, Long-tail, Informational, B2B | `/ai-workflows/` | لا | صفحة سير العمل تتحدث عن التكامل وربط الأنظمة أكثر من صفحة الأتمتة العامة. | متوسط مع `/smart-automation/`; اجعلها داعمة لا عنواناً رئيسياً. |
| إدارة المخزون بالذكاء الاصطناعي | Main, Long-tail, Commercial, B2B | `/blog/smart-inventory-management/` | لا | توجد صفحة محتوى متخصصة، ولا توجد صفحة حل تجاري للمخزون حالياً. | متوسط؛ إذا تحول المنتج لخدمة، أنشئ `/inventory-ai/` واجعل المقالة داعمة. |
| منصة توظيف بالذكاء الاصطناعي | Main, Long-tail, Commercial, B2B, Saudi local | `/interview/` | لا | الصفحة تحمل الكلمة نفسها تقريباً وهي صفحة المنتج/الحل. | متوسط مع `/ai-bots/BrightRecruiter/`؛ اجعل `/interview/` المنصة وBrightRecruiter روبوتاً داخل المنظومة. |
| نظام تتبع المتقدمين ATS السعودية | Secondary, Long-tail, Transactional, B2B, Saudi local | `/ai-bots/BrightRecruiter/` | لا | صفحة BrightRecruiter أقرب للـATS وفرز المتقدمين. | متوسط مع `/interview/`; لا تجعل الصفحتين تستهدفان ATS كـMain. |
| فرز السير الذاتية بالذكاء الاصطناعي | Secondary, Long-tail, Commercial, B2B | `/ai-bots/BrightRecruiter/` | لا | نية دقيقة ضمن روبوت التوظيف الذكي. | منخفض مع `/interview/` إذا بقيت كلمة داعمة. |
| التوظيف الذكي السعودية | Secondary, Long-tail, Informational, Commercial, B2B, Saudi local | `/interview/` | لا | الكلمة أوسع من روبوت واحد وتناسب صفحة المنصة. | متوسط مع `/docs/solutions-interview/`; الوثائق للدعم فقط. |
| تقييم المقابلات بالذكاء الاصطناعي | Main, Long-tail, Commercial, B2B | صفحة جديدة مقترحة: `/ai-interview-assessment/` | لا | توجد صفحات مقابلات، لكن لا توجد صفحة واضحة لتقييم المقابلات كحل مستقل. | متوسط مع `/interview/`; الجديدة لحالة الاستخدام الدقيقة. |
| AI Saudization Compliance Tools | Secondary, Long-tail, Transactional, B2B, Saudi local | صفحة جديدة مقترحة: `/en/saudization-compliance-ai-tools/` | لا | لا توجد صفحة إنجليزية عن السعودة والامتثال. | منخفض؛ اربطها بـBrightRecruiter ولا تكرر صفحة التوظيف. |
| الامتثال لمعايير NCA | Main, Long-tail, Commercial, B2B, B2G, Saudi local | `/blog/nca-compliance/` | لا | توجد صفحة متخصصة للدليل، لكن ليست صفحة خدمة. | متوسط؛ إذا كانت BrightAI تقدم خدمة امتثال فعلية فأنشئ `/nca-compliance-ai/`. |
| ضوابط الأمن السيبراني الأساسية ECC | Secondary, Long-tail, Informational, Commercial, B2B, B2G, Saudi local | `/blog/nca-compliance/` | لا | ECC جزء من عنقود NCA الحالي. | منخفض إذا بقيت داخل دليل NCA. |
| استشارات الأمن السيبراني السعودية | Main, Long-tail, Transactional, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/cybersecurity-consulting-saudi/` | لا | لا توجد صفحة خدمة أمن سيبراني صريحة؛ المدونة لا تكفي لنية معاملاتية. | متوسط مع `/blog/nca-compliance/`; افصل الخدمة عن الدليل. |
| حماية البنية التحتية الحساسة | Secondary, Long-tail, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/cybersecurity-consulting-saudi/` | لا | تنتمي لخدمة أمن سيبراني مؤسسية ولا تستحق صفحة منفصلة حالياً. | منخفض إذا بقيت كقسم داخل صفحة الأمن السيبراني. |
| أمن الحوسبة السحابية CCC | Secondary, Long-tail, Commercial, B2B, B2G, Saudi local | صفحة جديدة مقترحة: `/cybersecurity-consulting-saudi/` | لا | تنتمي لامتثال السحابة الوطنية، ولا توجد صفحة متخصصة حالياً. | متوسط مع صفحة السيادة السحابية الإنجليزية؛ افصل العربي الأمني عن الإنجليزي السحابي. |
| إدارة المخاطر السيبرانية بالذكاء الاصطناعي | Secondary, Long-tail, Commercial, B2B, B2G | صفحة جديدة مقترحة: `/cybersecurity-consulting-saudi/` | لا | حالة استخدام ضمن الأمن السيبراني AI، وليست موجودة كصفحة حالية. | منخفض إذا عولجت كقسم داخل الصفحة المقترحة. |

## الكلمات التي لا تملك صفحة مناسبة فعلية

هذه الكلمات تحتاج صفحة جديدة فقط إذا كان لدى BrightAI عرض خدمة أو خبرة قابلة للإثبات؛ وإلا تبقى ضمن خطة محتوى مستقبلية:

- `استراتيجية البيانات والذكاء الاصطناعي` -> `/data-ai-strategy/`
- `حوكمة البيانات NDMO` و`تأسيس مكتب إدارة البيانات` -> `/data-governance-ndmo/`
- `الامتثال لنظام حماية البيانات PDPL` -> `/pdpl-ai-data-compliance/`
- `Data Sovereignty Cloud Solutions KSA` -> `/en/data-sovereignty-cloud-ksa/`
- `منصة اعتماد للمنافسات الحكومية` -> `/blog/etimad-tenders-ai-guide/`
- `أتمتة المشتريات للشركات` -> `/procurement-automation/`
- `Etimad Tender Translation AI` -> `/en/etimad-tender-translation-ai/`
- `إعداد العروض الفنية والمالية` -> `/blog/technical-financial-proposals-ai/`
- `إدارة مخاطر الموردين AI` -> `/supplier-risk-ai/`
- `تحليل البيانات الجينية AI` -> `/genomic-data-ai/`
- `أتمتة مواعيد المرضى` -> `/patient-appointment-automation/`
- `تقييم المقابلات بالذكاء الاصطناعي` -> `/ai-interview-assessment/`
- `AI Saudization Compliance Tools` -> `/en/saudization-compliance-ai-tools/`
- `استشارات الأمن السيبراني السعودية` وما يتبعها من `حماية البنية التحتية الحساسة` و`أمن الحوسبة السحابية CCC` و`إدارة المخاطر السيبرانية بالذكاء الاصطناعي` -> `/cybersecurity-consulting-saudi/`

## Cannibalization المعالج بالخريطة

- `/consultation/` هي صفحة المال للاستشارات؛ `/docs/consultation/` دعم وثائقي فقط.
- `/services/` صفحة الخدمات العامة؛ `/smart-automation/`, `/data-analysis/`, `/ai-agent/`, `/ai-workflows/` صفحات حلول فرعية.
- `/tenders/` الصفحة الرئيسية لنظام تحليل المناقصات؛ `/tenders/landing/` صفحة عرض/تفصيل، لا تستهدف نفس الكلمة الرئيسية.
- `/interview/` صفحة منصة التوظيف؛ `/ai-bots/BrightRecruiter/` روبوت/حالة استخدام داخل التوظيف.
- `/data-analysis/` صفحة مال لتحليل البيانات؛ `/docs/solutions-bi/` شرح BI، ولا ينبغي أن ينافسها على التحويل.
- `/health/` للتحول الرقمي الصحي؛ `/sectors/healthcare/` للذكاء الاصطناعي في قطاع الرعاية الصحية.
