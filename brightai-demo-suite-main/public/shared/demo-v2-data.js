/**
 * BrightAI Demo — Page Anatomy v2 Configuration
 * Shared data: scenarios, trust layer, related demos, JSON-LD metadata
 * RTL Arabic content tailored to Saudi business context.
 */

// ── Demo Meta (titles, descriptions for canvas headers + JSON-LD) ─────────
export const DEMOS_META = {
  'ai-agent': {
    titleAr: 'وكيل الذكاء الاصطناعي للشركات',
    descriptionAr: 'وكيل ذكي مؤسسي يقدم استشارات استراتيجية مبنية على السياق.',
    canvasTitleAr: 'تقرير الوكيل الاستراتيجي',
    color: '#0F6FEC',
    href: '/demos/ai-agent/',
  },
  'ai-tenders-analysis': {
    titleAr: 'تحليل المناقصات بالذكاء الاصطناعي',
    descriptionAr: 'تحليل ذكي لوثائق المناقصات الحكومية والخاصة.',
    canvasTitleAr: 'تقرير تحليل المناقصة',
    color: '#0F6FEC',
    href: '/demos/ai-tenders-analysis/',
  },
  'ai-workflows': {
    titleAr: 'سير العمل الذكي',
    descriptionAr: 'تصميم وتحسين تدفقات العمل المؤسسية.',
    canvasTitleAr: 'تصميم سير العمل المُولَّد',
    color: '#0F6FEC',
    href: '/demos/ai-workflows/',
  },
  'data-analysis': {
    titleAr: 'تحليل البيانات الذكي',
    descriptionAr: 'استخراج رؤى قابلة للتنفيذ من البيانات الخام.',
    canvasTitleAr: 'تقرير الرؤى التحليلية',
    color: '#0F6FEC',
    href: '/demos/data-analysis/',
  },
  'smart-automation': {
    titleAr: 'الأتمتة الذكية للعمليات',
    descriptionAr: 'تصميم حلول أتمتة لتحسين كفاءة العمليات.',
    canvasTitleAr: 'خطة الأتمتة المُقترحة',
    color: '#0F6FEC',
    href: '/demos/smart-automation/',
  },
  'smart-education-platform': {
    titleAr: 'منصة التعليم الذكي',
    descriptionAr: 'مسارات تعلم مخصصة بالذكاء الاصطناعي.',
    canvasTitleAr: 'خطة التعلم المُخصصة',
    color: '#0F6FEC',
    href: '/demos/smart-education-platform/',
  },
  'smart-hospital-management': {
    titleAr: 'إدارة المستشفى الذكي',
    descriptionAr: 'دعم القرارات الإدارية والتشغيلية للمنشآت الصحية.',
    canvasTitleAr: 'تقرير الإدارة التشغيلية',
    color: '#0F6FEC',
    href: '/demos/smart-hospital-management/',
  },
};

// ── Scenarios (7 per demo × 7 demos = 49 scenarios) ───────────────────────
// Each scenario: { id, category, titleAr, descAr, promptAr, outcome, durationSec }
export const SCENARIOS = {
  'ai-agent': [
    { id: 'sales-perf', category: 'مبيعات', titleAr: 'تحليل أداء فريق المبيعات', descAr: 'مراجعة شاملة لمؤشرات الأداء وتحديد فرص التحسين.', promptAr: 'حلل أداء فريق المبيعات في الربع الأخير وقدم خطة تحسين معدل التحويل بمقدار 25% خلال 90 يوماً، مع تحديد المؤشرات الرئيسية والأنشطة الأسبوعية.', outcome: 'خطة تحسين 90 يوم', durationSec: 5 },
    { id: 'hr-plan', category: 'موارد بشرية', titleAr: 'خطة تطوير الكوادر', descAr: 'بناء خطة تطوير شاملة للموظفين بناءً على الفجوات.', promptAr: 'ابن خطة تطوير الكوادر البشرية للربع القادم لشركة سعودية متوسطة الحجم في القطاع التقني، مع دمج Vision 2030 ومعايير KPMG.', outcome: 'خطة تطوير ربع سنوية', durationSec: 5 },
    { id: 'expansion', category: 'استراتيجية', titleAr: 'استراتيجية التوسع', descAr: 'خطة دخول الأسواق السعودية والخليجية.', promptAr: 'ما هي أفضل استراتيجيات توسيع نطاق الأعمال في السوق السعودي للقطاع المالي مع مراعاة المنافسة المحلية والتنظيم؟', outcome: 'خارطة طريق توسع', durationSec: 6 },
    { id: 'cost-reduction', category: 'تحسين تكلفة', titleAr: 'تخفيض التكاليف التشغيلية', descAr: 'تحديد فرص توفير دون التأثير على الجودة.', promptAr: 'حدد لي 10 فرص لتخفيض التكاليف التشغيلية بنسبة 15% في شركة خدمات سعودية، مع تقدير الأثر المالي وأولوية التنفيذ.', outcome: 'قائمة فرص ترتيب', durationSec: 5 },
    { id: 'okr-build', category: 'حوكمة', titleAr: 'بناء OKRs ربعية', descAr: 'تحويل الأهداف الاستراتيجية إلى OKRs قابلة للقياس.', promptAr: 'حول الهدف الاستراتيجي "زيادة الحصة السوقية" إلى 4 OKRs ربعية بمؤشرات قياس واضحة، وفرّق بين Lead/Lag indicators.', outcome: '4 OKRs قابلة للقياس', durationSec: 4 },
    { id: 'crisis-mgmt', category: 'إدارة أزمات', titleAr: 'خطة إدارة الأزمات', descAr: 'الاستجابة للحوادث المؤسسية الحرجة.', promptAr: 'صمم لي خطة إدارة أزمة لتوقف نظام ERP الرئيسي لمدة 8 ساعات في شركة تجارية كبيرة، مع أدوار ومسؤوليات وقنوات اتصال.', outcome: 'بروتوكول استجابة', durationSec: 5 },
    { id: 'board-deck', category: 'تقارير تنفيذية', titleAr: 'إعداد عرض مجلس الإدارة', descAr: 'هيكلة عرض ربعي للقيادة العليا.', promptAr: 'صمم هيكل عرض ربعي لمجلس الإدارة من 12 شريحة يغطي الأداء، المخاطر، الفرص، والتوصيات الاستراتيجية. اكتب العناوين والنقاط الرئيسية.', outcome: 'هيكل عرض 12 شريحة', durationSec: 4 },
  ],
  'ai-tenders-analysis': [
    { id: 'eligibility', category: 'أهلية', titleAr: 'تقييم أهلية المناقصة', descAr: 'تحقق من تطابق متطلبات المناقصة مع قدرات شركتك.', promptAr: 'حلل متطلبات الأهلية في مناقصة وزارة الصحة لتوريد أجهزة طبية بقيمة 5 مليون ريال، وحدد ما إذا كانت شركتنا (خبرة 6 سنوات، رأسمال 10 مليون) قادرة على التقدم.', outcome: 'تقرير أهلية', durationSec: 6 },
    { id: 'risk-scan', category: 'مخاطر', titleAr: 'رصد المخاطر التعاقدية', descAr: 'تحليل البنود الحرجة في وثيقة المناقصة.', promptAr: 'ما هي المخاطر الرئيسية في عقد توريد لمدة 3 سنوات مع غرامات تأخير 5% أسبوعياً وضمان أداء 10%، وكيف نخفف منها؟', outcome: 'مصفوفة مخاطر مرجحة', durationSec: 5 },
    { id: 'pricing', category: 'تسعير', titleAr: 'استراتيجية التسعير', descAr: 'تسعير العرض لتحقيق توازن الفوز والربحية.', promptAr: 'ما استراتيجية التسعير الأنسب لمناقصة بقيمة تقديرية 12 مليون ريال في قطاع تقنية المعلومات، مع 3 منافسين معروفين وهامش ربح مستهدف 18%؟', outcome: 'نموذج تسعير 3 سيناريوهات', durationSec: 5 },
    { id: 'docs-checklist', category: 'وثائق', titleAr: 'قائمة المستندات المطلوبة', descAr: 'تجهيز الملف الفني والمالي المتكامل.', promptAr: 'ما المستندات المطلوبة لتقديم عرض كامل في منصة اعتماد لمناقصة خدمات استشارية، وما الترتيب الأمثل لتجهيزها قبل 14 يوماً من الإغلاق؟', outcome: 'قائمة مرجعية', durationSec: 4 },
    { id: 'win-prob', category: 'احتمال الفوز', titleAr: 'تقدير احتمالية الفوز', descAr: 'تحليل العوامل المؤثرة على فرص الفوز.', promptAr: 'قدر احتمالية فوزنا في مناقصة صيانة شبكات بقيمة 3 مليون ريال، علماً بأن لدينا 4 سنوات خبرة، 8 منافسين، وعلاقة سابقة جيدة مع الجهة.', outcome: 'تقدير احتمالي + توصيات', durationSec: 6 },
    { id: 'compare-mkt', category: 'مقارنة سوقية', titleAr: 'مقارنة شروط المناقصة', descAr: 'مقارنة البنود مع معايير السوق المعتادة.', promptAr: 'قارن شروط ضمان الأداء (10%) ومدة الصلاحية (180 يوم) في هذه المناقصة مع المتوسطات في السوق السعودي، وما البنود غير المعتادة؟', outcome: 'تقرير مقارنة', durationSec: 4 },
    { id: 'tech-proposal', category: 'عرض فني', titleAr: 'هيكل العرض الفني', descAr: 'بناء عرض فني تنافسي ومنظم.', promptAr: 'صمم لي هيكل العرض الفني لمناقصة تطوير منصة رقمية لجهة حكومية، مع 8 أقسام رئيسية، وما النقاط التي تستحق التركيز عليها لتفوق على المنافسين؟', outcome: 'هيكل عرض فني', durationSec: 5 },
  ],
  'ai-workflows': [
    { id: 'po-flow', category: 'مشتريات', titleAr: 'سير عمل طلبات الشراء', descAr: 'من الطلب حتى الاستلام مع نقاط القرار.', promptAr: 'صمم سير عمل لمعالجة طلبات الشراء من الطلب حتى الاستلام، مع 3 مستويات موافقة بناءً على القيمة (أقل من 10K، 10K-100K، أكثر من 100K) ومعالجة استثناءات.', outcome: 'BPMN كامل', durationSec: 6 },
    { id: 'onboarding', category: 'موارد بشرية', titleAr: 'تأهيل الموظفين الجدد', descAr: 'برنامج onboarding متكامل أول 30 يوم.', promptAr: 'كيف أبني workflow لتأهيل الموظفين الجدد (Onboarding) خلال 30 يوماً، يشمل HR، IT، الفريق المباشر، والتدريب الإلزامي؟', outcome: 'خارطة 30 يوم', durationSec: 5 },
    { id: 'incident', category: 'حوادث', titleAr: 'إدارة الحوادث التقنية', descAr: 'استلام، تصنيف، حل، وتوثيق الحوادث.', promptAr: 'أريد تصميم سير عمل لإدارة الحوادث التقنية وحلها وفق ITIL، مع 4 مستويات أولوية، SLAs، وتصعيد تلقائي.', outcome: 'workflow ITIL', durationSec: 6 },
    { id: 'content-review', category: 'محتوى', titleAr: 'مراجعة المحتوى قبل النشر', descAr: 'تدفق موافقة على محتوى التواصل الاجتماعي.', promptAr: 'صمم workflow لمراجعة المحتوى قبل النشر في وسائل التواصل، يشمل المراجعة اللغوية، الموافقة من العلاقات العامة، والامتثال القانوني.', outcome: 'تدفق 5 خطوات', durationSec: 4 },
    { id: 'budget-approval', category: 'مالية', titleAr: 'موافقة الميزانيات', descAr: 'موافقة متعددة المستويات على الميزانيات.', promptAr: 'كيف نبني سير عمل لموافقة الميزانيات متعدد المستويات حسب القيمة، مع توقيعات إلكترونية وسجل تدقيق متوافق مع SOX؟', outcome: 'workflow حوكمة', durationSec: 5 },
    { id: 'leave-req', category: 'إجازات', titleAr: 'طلبات الإجازات', descAr: 'تقديم، موافقة، تحديث الرصيد.', promptAr: 'صمم workflow لطلبات الإجازات يشمل التحقق من الرصيد، موافقة المدير المباشر، إشعار HR، وتحديث نظام الحضور تلقائياً.', outcome: 'workflow بسيط', durationSec: 4 },
    { id: 'customer-complaint', category: 'خدمة عملاء', titleAr: 'معالجة شكاوى العملاء', descAr: 'استقبال، تصنيف، حل، إغلاق.', promptAr: 'كيف نصمم workflow لمعالجة شكاوى العملاء عبر 4 قنوات (هاتف، إيميل، تواصل اجتماعي، حضوري) مع SLA 24 ساعة وتصعيد لمستويين؟', outcome: 'workflow متعدد القنوات', durationSec: 5 },
  ],
  'data-analysis': [
    { id: 'sales-anomaly', category: 'مبيعات', titleAr: 'تفسير شذوذ المبيعات', descAr: 'تحليل الانحرافات والأسباب الجذرية.', promptAr: 'مبيعاتنا ارتفعت 40% في مارس ثم انخفضت 25% في أبريل في قطاع التجزئة بالرياض. حلل الأسباب المحتملة وقدم 5 فرضيات قابلة للاختبار.', outcome: '5 فرضيات + خطة تحقق', durationSec: 5 },
    { id: 'churn', category: 'موظفين', titleAr: 'تحليل تذبذب الموظفين', descAr: 'فهم أسباب الاستقالات وتقليلها.', promptAr: 'لدينا معدل تذبذب موظفين 30% سنوياً في شركة تقنية بالرياض (200 موظف). كيف نحلل الأسباب الجذرية ونحدد الفئات الأكثر عرضة للاستقالة؟', outcome: 'تحليل جذري + خطة', durationSec: 6 },
    { id: 'kpi-design', category: 'KPI', titleAr: 'تصميم KPIs خدمة العملاء', descAr: 'مؤشرات قياس فعّالة للأداء.', promptAr: 'ما مؤشرات KPI الأنسب لقياس أداء فريق خدمة العملاء (مكون من 25 شخص) في قطاع البنوك؟ اقترح 8 KPIs مع صيغ الحساب والمستهدفات.', outcome: '8 KPIs + لوحة', durationSec: 5 },
    { id: 'correlation', category: 'ارتباط', titleAr: 'تحليل الارتباط', descAr: 'العلاقة بين رضا العملاء والإيرادات.', promptAr: 'كيف نفسر الارتباط بين رضا العملاء (NPS) وإيرادات الاشتراك في خدمة SaaS؟ هل توجد علاقة سببية أم مجرد ترابط، وكيف نختبر ذلك؟', outcome: 'تقرير ارتباط/سببية', durationSec: 5 },
    { id: 'dashboard', category: 'لوحات', titleAr: 'لوحة بيانات سلسلة التوريد', descAr: 'تصميم Dashboard متكامل.', promptAr: 'ساعدني في تصميم لوحة بيانات لمتابعة أداء سلسلة التوريد في شركة توزيع، مع 12 مؤشراً موزعة على 4 محاور (وقت، تكلفة، جودة، مرونة).', outcome: 'Wireframe لوحة', durationSec: 4 },
    { id: 'forecast', category: 'تنبؤ', titleAr: 'تنبؤ الطلب الموسمي', descAr: 'توقع المبيعات في فترات الذروة.', promptAr: 'كيف نتنبأ بالطلب على منتجات سعودية خلال رمضان والعيدين بناءً على بيانات 3 سنوات سابقة، وما النموذج الإحصائي الأنسب؟', outcome: 'نموذج تنبؤ', durationSec: 6 },
    { id: 'cohort', category: 'سلوك', titleAr: 'تحليل أفواج العملاء', descAr: 'مقارنة سلوك مجموعات العملاء بمرور الوقت.', promptAr: 'صف لي خطوات تحليل أفواج (Cohort Analysis) لتطبيق جوال سعودي، لقياس الاحتفاظ بالمستخدمين خلال 12 شهراً، وما الرؤى المتوقعة؟', outcome: 'منهجية + توقعات', durationSec: 5 },
  ],
  'smart-automation': [
    { id: 'leave-auto', category: 'موارد بشرية', titleAr: 'أتمتة طلبات الإجازة', descAr: 'تقديم وموافقة وإشعار آلي.', promptAr: 'صمم لي أتمتة كاملة لعملية مراجعة طلبات الإجازة من تقديم الطلب حتى التحديث في نظام الحضور، باستخدام Microsoft Power Automate، مع حساب ROI لشركة 500 موظف.', outcome: 'أتمتة + ROI', durationSec: 6 },
    { id: 'invoicing', category: 'مالية', titleAr: 'أتمتة الفوترة', descAr: 'إنشاء وإرسال الفواتير تلقائياً.', promptAr: 'كيف نؤتمت عملية الفوترة وإرسال الفواتير للعملاء في شركة خدمات سعودية (تصدر 800 فاتورة شهرياً)، مع التكامل مع منصة فاتورة (هيئة الزكاة والضريبة)؟', outcome: 'أتمتة متوافقة', durationSec: 5 },
    { id: 'lead-followup', category: 'مبيعات', titleAr: 'متابعة العملاء المحتملين', descAr: 'تدفق متابعة آلي بعد المعارض والفعاليات.', promptAr: 'صمم لي تدفق أتمتة لمتابعة العملاء المحتملين بعد معرض LEAP، يشمل تصنيف الـ leads، رسائل ذكية مخصصة، وتسليم لفريق المبيعات حسب الجاهزية.', outcome: 'تدفق Lead Nurturing', durationSec: 5 },
    { id: 'weekly-reports', category: 'تقارير', titleAr: 'أتمتة التقارير الأسبوعية', descAr: 'توليد وإرسال تقارير دورية.', promptAr: 'أريد أتمتة تقارير الأداء الأسبوعية لفريق المبيعات (15 شخص) بدمج بيانات Salesforce وExcel، وإرسالها كل أحد عبر بريد منظم.', outcome: 'تقرير آلي', durationSec: 4 },
    { id: 'l1-support', category: 'دعم فني', titleAr: 'أتمتة الدعم المستوى الأول', descAr: 'حل المشكلات الشائعة آلياً.', promptAr: 'ما أفضل طريقة لأتمتة دعم العملاء من المستوى الأول في شركة اتصالات سعودية، يستقبل 5000 تذكرة شهرياً، باستخدام chatbot ذكي وتكامل مع CRM؟', outcome: 'أتمتة دعم متعددة القنوات', durationSec: 6 },
    { id: 'onboarding-auto', category: 'موارد بشرية', titleAr: 'أتمتة تأهيل الموظفين', descAr: 'إنشاء حسابات وتجهيز معدات.', promptAr: 'صمم أتمتة تكامل لتأهيل موظف جديد: إنشاء بريد، حسابات الأنظمة، طلب أجهزة، تقويم تدريبي، خلال أقل من 30 دقيقة بدلاً من 5 أيام عمل.', outcome: 'تكامل أنظمة', durationSec: 5 },
    { id: 'roi-calc', category: 'حساب جدوى', titleAr: 'حاسبة ROI الأتمتة', descAr: 'تقدير العائد قبل التطبيق.', promptAr: 'احسب لي ROI أتمتة عملية معالجة الفواتير في شركة سعودية (200 فاتورة يومياً، 15 دقيقة لكل فاتورة، تكلفة موظف 8 آلاف ريال شهرياً) خلال 12 شهر.', outcome: 'تقرير ROI رقمي', durationSec: 4 },
  ],
  'smart-education-platform': [
    { id: 'python-plan', category: 'برمجة', titleAr: 'خطة تعلم Python', descAr: 'إتقان Python خلال 90 يوماً.', promptAr: 'ابن لي خطة تعلم لإتقان Python خلال 3 أشهر للمبتدئين بمعدل 7 ساعات أسبوعياً، الهدف العمل في علم البيانات، مع موارد عربية وإنجليزية موصى بها.', outcome: 'خطة 12 أسبوع', durationSec: 5 },
    { id: 'digital-mkt-curriculum', category: 'منهج', titleAr: 'منهج التسويق الرقمي', descAr: 'تصميم مادة جامعية تفاعلية.', promptAr: 'كيف أصمم منهجاً تفاعلياً لتعليم التسويق الرقمي للطلاب الجامعيين السعوديين (فصل دراسي 14 أسبوع)، مع مشاريع تطبيقية على شركات محلية؟', outcome: 'منهج 14 أسبوع', durationSec: 6 },
    { id: 'pm-assess', category: 'تقييم', titleAr: 'استراتيجيات تقييم إدارة المشاريع', descAr: 'قياس فعّال لتعلم الطلاب.', promptAr: 'ما أفضل استراتيجيات التقييم لدورة إدارة المشاريع المهنية (PMP)، مع موازنة بين التقييم التكويني والختامي، وكيف نضمن نزاهة التقييم عن بُعد؟', outcome: 'مصفوفة تقييم', durationSec: 5 },
    { id: 'ai-activities', category: 'أنشطة', titleAr: 'أنشطة تعليم الذكاء الاصطناعي', descAr: 'أنشطة تفاعلية للطلاب.', promptAr: 'اقترح 10 أنشطة تعليمية تفاعلية لموضوع الذكاء الاصطناعي للطلاب من سن 16-22 سنة، تجمع بين النظري والتطبيقي، ولا تتطلب معدات متخصصة.', outcome: '10 أنشطة جاهزة', durationSec: 4 },
    { id: 'training-effectiveness', category: 'قياس أثر', titleAr: 'قياس فاعلية التدريب', descAr: 'منهجية Kirkpatrick للتدريب المؤسسي.', promptAr: 'كيف نقيس فاعلية برنامج التدريب المؤسسي لـ 200 موظف في شركة بنكية سعودية، باستخدام نموذج Kirkpatrick بمستوياته الأربعة، خلال 6 أشهر؟', outcome: 'منهجية 4 مستويات', durationSec: 5 },
    { id: 'kids-coding', category: 'أطفال', titleAr: 'مسار تعلم البرمجة للأطفال', descAr: 'منهج مرئي تطبيقي للأعمار 8-14.', promptAr: 'صمم لي مسار تعلم برمجة للأطفال السعوديين (أعمار 8-14)، يبدأ بـ Scratch ثم Python، خلال عام دراسي، مع مشاريع تخدم اللغة العربية.', outcome: 'مسار سنوي', durationSec: 5 },
    { id: 'corporate-academy', category: 'أكاديمية', titleAr: 'بناء أكاديمية مؤسسية', descAr: 'استراتيجية L&D متكاملة.', promptAr: 'كيف أبني أكاديمية تعلم وتطوير داخلية لشركة سعودية كبيرة (3000 موظف)، مع 5 مسارات وظيفية، وتحقيق ROI خلال سنتين؟', outcome: 'استراتيجية L&D', durationSec: 6 },
  ],
  'smart-hospital-management': [
    { id: 'bed-turnover', category: 'تشغيلي', titleAr: 'تحسين دوران الأسرّة', descAr: 'تقليل وقت الانتظار وزيادة الكفاءة.', promptAr: 'كيف نحسن معدل دوران الأسرّة في مستشفى عام بـ 300 سرير في الرياض، وتقليل وقت انتظار المرضى من 8 ساعات إلى أقل من 3، خلال 6 أشهر؟', outcome: 'خطة تحسين', durationSec: 6 },
    { id: 'er-kpi', category: 'KPI', titleAr: 'KPIs قسم الطوارئ', descAr: 'مؤشرات أداء حرجة للطوارئ.', promptAr: 'ما مؤشرات KPI الأساسية لتقييم أداء قسم الطوارئ في مستشفى ثانوي سعودي، يستقبل 300 حالة يومياً، متوافقة مع معايير CBAHI؟', outcome: '12 KPI + مستهدفات', durationSec: 5 },
    { id: 'crisis-plan', category: 'أزمات', titleAr: 'خطة إدارة الكوارث', descAr: 'استعداد المستشفى للأزمات الكبرى.', promptAr: 'كيف نبني خطة لإدارة الكوارث والأزمات في مستشفى تعليمي (500 سرير)، تشمل سيناريوهات الزلازل، الحرائق، والأوبئة، متوافقة مع وزارة الصحة؟', outcome: 'بروتوكول كامل', durationSec: 6 },
    { id: 'shift-mgmt', category: 'كوادر', titleAr: 'إدارة شِفتات الكوادر الطبية', descAr: 'توزيع عادل وفعّال للأطباء والممرضين.', promptAr: 'ما أفضل استراتيجيات إدارة الكوادر الطبية وتوزيع الشِفتات لـ 80 طبيب و200 ممرض، مع مراعاة قانون العمل السعودي والإرهاق المهني؟', outcome: 'نموذج جدولة', durationSec: 5 },
    { id: 'jci-cbahi', category: 'جودة', titleAr: 'تطبيق معايير JCI/CBAHI', descAr: 'مسار اعتماد فعّال للجودة.', promptAr: 'كيف نطبق معايير الجودة الدولية JCI ومعايير CBAHI السعودية في مستشفى متوسط (250 سرير) لم يحصل على الاعتماد سابقاً، خلال 18 شهراً؟', outcome: 'خارطة 18 شهر', durationSec: 6 },
    { id: 'patient-flow', category: 'تجربة', titleAr: 'تحسين رحلة المريض', descAr: 'من الحجز حتى الخروج.', promptAr: 'حلل رحلة المريض في عيادات خارجية لمستشفى سعودي، وحدد 5 نقاط احتكاك رئيسية مع توصيات لتحسين التجربة وقياس NPS.', outcome: 'خارطة رحلة', durationSec: 4 },
    { id: 'expansion-plan', category: 'توسعة', titleAr: 'خطة توسعة المستشفى', descAr: 'تخطيط الطاقة الاستيعابية المستقبلية.', promptAr: 'ساعدني في تخطيط توسعة مستشفى بـ 200 سرير في جدة لإضافة 100 سرير، مع تقدير الاحتياجات من الكوادر، الأجهزة، والميزانية خلال 3 سنوات.', outcome: 'دراسة جدوى توسعية', durationSec: 5 },
  ],
};

// ── AI Thinking Theater Stages (5 stages, shared across demos) ────────────
export const THINKING_STAGES = [
  { id: 's1', titleAr: 'استلام طلبك',         descAr: 'تحليل البنية اللغوية والنية',           icon: 'inbox' },
  { id: 's2', titleAr: 'فهم السياق',           descAr: 'دمج معلومات الجلسة والقطاع',           icon: 'brain' },
  { id: 's3', titleAr: 'استدعاء قاعدة المعرفة', descAr: 'مراجعة معايير ومراجع متخصصة',         icon: 'database' },
  { id: 's4', titleAr: 'التحليل والاستنتاج',   descAr: 'بناء توصيات قابلة للتنفيذ',           icon: 'cpu' },
  { id: 's5', titleAr: 'صياغة التقرير',        descAr: 'هيكلة المخرجات بصيغة عربية واضحة',     icon: 'sparkle' },
];

// ── Trust Layer (shared across demos) ─────────────────────────────────────
export const TRUST_LAYER = {
  testimonials: [
    {
      quote: 'وفّر علينا BrightAI أسابيع من التحليل اليدوي. التوصيات دقيقة ومبنية على فهم حقيقي لقطاع الأعمال السعودي.',
      author: 'م. خالد الزهراني',
      role: 'مدير تحول رقمي',
      org: 'مجموعة تجزئة كبرى — الرياض',
    },
    {
      quote: 'الفرق بين BrightAI ومساعدات الذكاء الاصطناعي العامة هو السياق — يفهم الواقع المحلي ولوائح هيئاتنا التنظيمية.',
      author: 'د. سارة الشمري',
      role: 'مستشارة استراتيجية',
      org: 'مستشفى تعليمي — جدة',
    },
    {
      quote: 'ساعدنا في رفع جودة عروضنا الفنية في المناقصات الحكومية ورفع نسبة الفوز بشكل ملحوظ.',
      author: 'أ. عبدالله القحطاني',
      role: 'مدير المناقصات',
      org: 'شركة مقاولات — الدمام',
    },
  ],
  badges: [
    { label: 'تشفير AES-256',       sublabel: 'في النقل والتخزين' },
    { label: 'متوافق مع PDPL',       sublabel: 'حماية البيانات السعودية' },
    { label: 'استضافة سعودية',       sublabel: 'سيادة بيانات' },
    { label: 'تدقيق وصول كامل',      sublabel: 'سجلات قابلة للمراجعة' },
    { label: 'تدريب على بياناتك',    sublabel: 'دون مشاركة خارجية' },
  ],
};

// ── Related Demos (3 per demo) ────────────────────────────────────────────
export const RELATED_DEMOS = {
  'ai-agent':                   ['ai-tenders-analysis', 'data-analysis', 'ai-workflows'],
  'ai-tenders-analysis':        ['ai-agent', 'data-analysis', 'smart-automation'],
  'ai-workflows':               ['smart-automation', 'ai-agent', 'data-analysis'],
  'data-analysis':              ['ai-agent', 'smart-hospital-management', 'ai-workflows'],
  'smart-automation':           ['ai-workflows', 'data-analysis', 'ai-agent'],
  'smart-education-platform':   ['ai-agent', 'data-analysis', 'smart-automation'],
  'smart-hospital-management':  ['data-analysis', 'smart-automation', 'ai-agent'],
};

// ── CTA Strip Items (shared structure, 5 CTAs per demo) ───────────────────
export const CTA_STRIP = [
  {
    id: 'try-another',
    labelAr: 'جرّب سيناريو آخر',
    sublabelAr: 'استكشف باقي القدرات',
    icon: 'shuffle',
    variant: 'primary',
    href: '#demo-section',
  },
  {
    id: 'talk-expert',
    labelAr: 'تحدث مع خبير',
    sublabelAr: 'استشارة 30 دقيقة مجانية',
    icon: 'phone',
    variant: 'outline',
    href: 'mailto:hello@brightai.sa?subject=طلب استشارة',
  },
  {
    id: 'book-demo',
    labelAr: 'احجز جلسة عمل',
    sublabelAr: 'تطبيق على بياناتك الفعلية',
    icon: 'calendar',
    variant: 'outline',
    href: 'mailto:hello@brightai.sa?subject=طلب جلسة عمل',
  },
  {
    id: 'whatsapp',
    labelAr: 'واتساب',
    sublabelAr: 'رد فوري خلال ساعات العمل',
    icon: 'message',
    variant: 'outline',
    href: 'https://wa.me/966500000000?text=استفسار%20من%20نموذج%20BrightAI',
  },
  {
    id: 'case-study',
    labelAr: 'دراسة حالة',
    sublabelAr: 'كيف طبقها عملاؤنا',
    icon: 'file',
    variant: 'ghost',
    href: '/case-studies',
  },
];
