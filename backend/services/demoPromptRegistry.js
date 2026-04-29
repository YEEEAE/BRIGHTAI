const { extractJsonObject } = require('../utils/safeJson');

const RESPONSE_SCHEMA_DESCRIPTION = `{
  "summary": "string من 50 إلى 300 حرف",
  "items": [
    {
      "title": "string",
      "description": "string",
      "status": "good|warning|critical"
    }
  ],
  "metrics": [
    {
      "label": "string",
      "value": "string",
      "level": "low|medium|high",
      "trend": "up|down|stable"
    }
  ],
  "recommendations": [
    {
      "text": "string",
      "priority": "low|medium|high",
      "effort": "low|medium|high"
    }
  ],
  "nextActions": ["string"],
  "report": "formatted Arabic report",
  "confidence": 0.85,
  "riskLevel": "low|medium|high|critical"
}`;

const BASE_SYSTEM_INSTRUCTION = [
  'أنت BrightAI — مساعد ذكاء اصطناعي للشركات السعودية.',
  'نبرتك سعودية مرحّبة، شبابية، واثقة، واحترافية.',
  'تكلّم كزميل متمكن، وليس كموظف رسمي.',
  'استخدم عبارات مثل: خلّنا، تمام، جاهز، نشتغل عليها.',
  'تجنب: حضراتكم، نتشرف، بكل سرور.',
  'لا تعد بنتائج مبالغ فيها.',
  'لا تدّعي أن AI يتخذ القرار بدلاً من البشر.',
  'لا تخرج عن JSON أبداً.',
  'ممنوع Markdown أو code blocks أو أي نص خارج JSON أو raw Gemini response.',
  `يجب أن يطابق الرد هذا المخطط فقط: ${RESPONSE_SCHEMA_DESCRIPTION}`
].join('\n');

const ALLOWED_DEMO_TYPES = Object.freeze([
  'ai-agent',
  'tenders-analysis',
  'data-analysis',
  'smart-automation',
  'ai-workflows',
  'smart-education-platform',
  'smart-hospital-management'
]);

const DEMO_TYPE_ALIASES = Object.freeze({
  'ai-tenders-analysis': 'tenders-analysis'
});

const PRO_MODEL_DEMOS = new Set(['tenders-analysis', 'smart-hospital-management']);

const STATUS_VALUES = new Set(['good', 'warning', 'critical']);
const LEVEL_VALUES = new Set(['low', 'medium', 'high']);
const TREND_VALUES = new Set(['up', 'down', 'stable']);
const RISK_VALUES = new Set(['low', 'medium', 'high', 'critical']);

const DEMO_BLUEPRINTS = Object.freeze({
  'ai-agent': {
    title: 'وكيل ذكاء اصطناعي للمؤسسات',
    schemaName: 'custom_ai_agent',
    safetyProfile: 'business',
    sector: 'وكلاء الأعمال',
    audience: 'الإدارة التشغيلية وفرق خدمة العملاء والمبيعات',
    problem: 'تكرار المهام والأسئلة بين الفرق بدون ذاكرة أو صلاحيات واضحة',
    outcome: 'تعريف وكيل، حدود صلاحيات، خطة تكامل، ومؤشر جاهزية',
    focus: 'صمم تصور وكيل ذكاء اصطناعي مؤسسي مناسب للسوق السعودي، مع التركيز على القيمة، التكاملات، الحوكمة، والمخاطر.',
    disclaimer: 'هذا الديمو تصور أولي لحدود الوكيل وصلاحياته، ولا يعني تشغيله الفعلي أو تفويضه باتخاذ قرارات بدون اعتماد بشري.',
    scenarios: ['خدمة عملاء', 'عمليات داخلية', 'مبيعات'],
    variations: [
      {
        summary: 'تمام، السيناريو مناسب لوكيل مساعد يخفف التكرار ويرفع وضوح التصعيد بدون ما يستبدل قرار الفريق.',
        items: [
          ['نطاق الوكيل', 'يرد على الأسئلة المتكررة ويجمع البيانات الناقصة ثم يرفع الحالات الحساسة للموظف المختص.', 'good'],
          ['حدود الصلاحية', 'يحتاج قواعد واضحة لما يسمح له بتنفيذه وما يجب تصعيده قبل أي إجراء.', 'warning'],
          ['الربط التشغيلي', 'أفضل نقطة بداية هي ربط نموذج الطلبات مع CRM أو نظام التذاكر.', 'good']
        ],
        metrics: [
          ['جاهزية السيناريو', '78%', 'high', 'up'],
          ['تعقيد التكامل', 'متوسط', 'medium', 'stable'],
          ['حاجة التصعيد البشري', 'مرتفعة للحالات الحساسة', 'high', 'stable']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، المدخلات تكشف فرصة واضحة لبناء وكيل داخلي يختصر المتابعة ويترك الاعتماد النهائي للبشر.',
        items: [
          ['مسار المحادثة', 'ابدأ بأسئلة تأهيل قصيرة ثم ملخص قابل للإرسال للفريق المسؤول.', 'good'],
          ['جودة المعرفة', 'قاعدة المعرفة تحتاج تحديثاً أسبوعياً حتى لا يرد الوكيل بمعلومة قديمة.', 'warning'],
          ['الحوكمة', 'سجل المحادثات والصلاحيات ضروري قبل ربط أي إجراء تنفيذي.', 'warning']
        ],
        metrics: [
          ['قابلية الأتمتة', 'عالية', 'high', 'up'],
          ['اعتماد البيانات', 'متوسط', 'medium', 'stable'],
          ['أثر وقت الفريق', 'واضح', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نشتغل عليها كنسخة أولى محدودة: وكيل يجمع، يلخص، ويقترح الخطوة التالية بدون اتخاذ القرار.',
        items: [
          ['بداية عملية', 'اختر مساراً واحداً عالي التكرار بدل فتح كل الطلبات من البداية.', 'good'],
          ['التجربة العامة', 'لا تستخدم بيانات عملاء حساسة في الديمو العام.', 'warning'],
          ['قياس النجاح', 'اربط التجربة بزمن الرد ونسبة التصعيد الصحيح.', 'good']
        ],
        metrics: [
          ['وضوح نطاق البداية', 'جيد', 'high', 'up'],
          ['مخاطر الخصوصية', 'متوسطة', 'medium', 'stable'],
          ['سرعة تجربة أولية', 'أسبوعان إلى أربعة', 'medium', 'down']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'tenders-analysis': {
    title: 'تحليل المناقصات',
    schemaName: 'tenders_demo_schema',
    safetyProfile: 'legal',
    sector: 'المناقصات والمشتريات',
    audience: 'شركات المقاولات والخدمات والموردين',
    problem: 'قراءة كراسات وشروط طويلة مع احتمال تفويت متطلبات أو مخاطر تعاقدية',
    outcome: 'ملخص متطلبات، مخاطر امتثال، جاهزية تقديم، وخطة قرار',
    focus: 'حلل فرصة المناقصة من منظور تنفيذي، واذكر أن المخرجات لا تغني عن مراجعة قانونية أو امتثال رسمي.',
    disclaimer: 'هذا تحليل أولي للمساعدة في الفرز، ولا يغني عن مراجعة قانونية أو مالية أو امتثال من مختصين داخل الشركة.',
    scenarios: ['مقاولات', 'تقنية', 'توريد'],
    variations: [
      {
        summary: 'تمام، الفرصة تبدو قابلة للدراسة لكن فيها متطلبات امتثال وجدول تسليم تحتاج مراجعة دقيقة قبل التقديم.',
        items: [
          ['جاهزية التقديم', 'المتطلبات الأساسية واضحة، لكن يلزم تأكيد الخبرات والضمانات قبل قرار الدخول.', 'warning'],
          ['المخاطر التعاقدية', 'غرامات التأخير وشروط القبول تحتاج مراجعة قانونية وتشغيلية.', 'critical'],
          ['نقطة القوة', 'وجود مشاريع مشابهة أو شركاء تنفيذ يرفع قابلية المنافسة.', 'good']
        ],
        metrics: [
          ['ملاءمة الفرصة', '74%', 'medium', 'up'],
          ['مخاطر الالتزام', 'مرتفعة', 'high', 'stable'],
          ['وضوح المتطلبات', 'جيد', 'high', 'stable']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'جاهز، التحليل يشير أن القرار الأفضل هو استكمال قائمة نواقص قبل التسعير النهائي أو الالتزام بالتقديم.',
        items: [
          ['نواقص القرار', 'تحتاج قائمة تحقق للضمانات، الخبرات، الجدول، وشروط التسليم.', 'warning'],
          ['التسعير', 'لا ينصح بتسعير نهائي قبل احتساب مخاطر التأخير والدعم.', 'warning'],
          ['المراجعة البشرية', 'أي بند قانوني أو غرامة يجب أن يمر على مختص قبل الاعتماد.', 'critical']
        ],
        metrics: [
          ['ثقة القراءة الأولية', '82%', 'high', 'up'],
          ['تعقيد العقد', 'متوسط إلى مرتفع', 'high', 'stable'],
          ['جاهزية المستندات', 'متوسطة', 'medium', 'up']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'خلّنا نرتبها كقرار إداري: الفرصة واعدة إذا تم إغلاق متطلبات التأهيل والمخاطر قبل العرض.',
        items: [
          ['قرار مبدئي', 'أكمل التحليل إذا كانت القدرة التنفيذية والضمانات متوفرة.', 'good'],
          ['مخاطر الجدول', 'التسليم المرحلي قد يرفع تكلفة التشغيل إذا لم تضبط الموارد.', 'warning'],
          ['الامتثال', 'يلزم فحص الشروط الخاصة والملحقات قبل رفع العرض.', 'critical']
        ],
        metrics: [
          ['قابلية المنافسة', 'متوسطة', 'medium', 'up'],
          ['حساسية السعر', 'عالية', 'high', 'stable'],
          ['حاجة مراجعة مختص', 'عالية', 'high', 'stable']
        ],
        riskLevel: 'high'
      }
    ]
  },
  'data-analysis': {
    title: 'تحليل البيانات',
    schemaName: 'data_analyzer_demo_schema',
    safetyProfile: 'business',
    sector: 'البيانات والقرار',
    audience: 'الإدارة التنفيذية وفرق التحليل والعمليات',
    problem: 'وجود أرقام كثيرة لا تتحول إلى قرار واضح أو مؤشر قابل للمتابعة',
    outcome: 'رؤى، شذوذ، مؤشرات مقترحة، وخطوات تحسين جودة البيانات',
    focus: 'حوّل وصف البيانات إلى رؤى تنفيذية، مؤشرات قابلة للقياس، ومقترح لوحة متابعة.',
    disclaimer: 'هذا تحليل تقديري مبني على عينة أو وصف مختصر، ولا يمثل حكماً نهائياً على كامل البيانات.',
    scenarios: ['مبيعات', 'تشغيل', 'تسويق'],
    variations: [
      {
        summary: 'تمام، البيانات تكشف اتجاهات قابلة للمتابعة، لكن جودة القرار تعتمد على اكتمال العينة وتعريف المؤشرات.',
        items: [
          ['مؤشر أولي', 'يوجد تباين واضح بين الحجم والنتيجة، وهذا يحتاج فصل القنوات أو الفروع.', 'warning'],
          ['فرصة لوحة متابعة', 'يمكن بناء لوحة تنفيذية تربط التحويل، التكلفة، والجودة في شاشة واحدة.', 'good'],
          ['جودة البيانات', 'يلزم توحيد أسماء الحقول والفترات قبل الاعتماد.', 'warning']
        ],
        metrics: [
          ['وضوح النمط', 'جيد', 'high', 'up'],
          ['اكتمال العينة', 'متوسط', 'medium', 'stable'],
          ['قابلية القياس', 'عالية', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، العينة تشير إلى سبب محتمل للتغير وتحتاج مقارنة زمنية أوسع قبل تثبيت التوصية النهائية.',
        items: [
          ['الشذوذ', 'هناك نقطة تحتاج مراجعة لأنها قد تكون موسمية أو خطأ إدخال.', 'warning'],
          ['مؤشرات القرار', 'اقترح متابعة معدل التحويل، تكلفة النتيجة، وزمن الدورة.', 'good'],
          ['التفسير', 'لا تربط السبب بالنتيجة بدون بيانات إضافية أو اختبار تحقق.', 'warning']
        ],
        metrics: [
          ['ثقة القراءة', '80%', 'high', 'up'],
          ['مخاطر الاستنتاج', 'متوسطة', 'medium', 'stable'],
          ['جاهزية التقرير', 'عالية', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نحولها لتقرير تنفيذي: الصورة العامة واضحة، والأولوية الآن تنظيف البيانات وربطها بمؤشر نجاح.',
        items: [
          ['الأولوية', 'ابدأ بالسؤال التجاري قبل اختيار الرسوم أو الجداول.', 'good'],
          ['الفجوات', 'تحتاج حقول مصدر العميل والفترة والفرع حتى يصبح التحليل أدق.', 'warning'],
          ['التنفيذ', 'تقرير أسبوعي مختصر أفضل من تحليل كبير لا يتكرر.', 'good']
        ],
        metrics: [
          ['جاهزية لوحة البيانات', '76%', 'medium', 'up'],
          ['تعقيد التنظيف', 'متوسط', 'medium', 'stable'],
          ['الأثر المتوقع', 'مرتفع عند التكرار', 'high', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'smart-automation': {
    title: 'الأتمتة الذكية',
    schemaName: 'approvals_demo_schema',
    safetyProfile: 'business',
    sector: 'العمليات والأتمتة',
    audience: 'مديرو العمليات والتحول الرقمي والفرق الإدارية',
    problem: 'مهام متكررة بين البريد والواتساب والملفات تؤخر القرار وتزيد الأخطاء',
    outcome: 'خريطة سير عمل، نقاط أتمتة، مخاطر، ومؤشر جاهزية',
    focus: 'حلل العملية اليدوية وحدد فرص الأتمتة، التكاملات، الضوابط، ومكاسب الوقت.',
    disclaimer: 'هذا تصور أتمتة أولي، وأي تشغيل فعلي يحتاج اختبار صلاحيات وتدقيق خطوات واعتماد أصحاب العملية.',
    scenarios: ['اعتمادات', 'تقارير', 'خدمة'],
    variations: [
      {
        summary: 'تمام، العملية مناسبة كبداية أتمتة لأنها متكررة وواضحة، لكن تحتاج ضوابط اعتماد قبل التشغيل.',
        items: [
          ['نقطة البداية', 'ابدأ بجمع الطلب والتحقق من الحقول الناقصة قبل تمرير الاعتماد.', 'good'],
          ['مخاطر الصلاحيات', 'أي موافقة مالية يجب أن تبقى بتأكيد بشري وسجل تدقيق.', 'critical'],
          ['الربط', 'التكامل مع البريد أو النماذج الداخلية يعطي أثر أسرع.', 'good']
        ],
        metrics: [
          ['قابلية الأتمتة', '84%', 'high', 'up'],
          ['حاجة الضوابط', 'عالية', 'high', 'stable'],
          ['تعقيد الربط', 'متوسط', 'medium', 'stable']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، يوجد هدر وقت واضح في النقل اليدوي، والأفضل أتمتة التنبيه والتلخيص قبل القرار النهائي.',
        items: [
          ['تقليل التكرار', 'أتمتة التذكير وتجميع البيانات تخفف المتابعة اليدوية اليومية.', 'good'],
          ['القرار', 'لا تجعل النظام يعتمد الطلب وحده؛ خله يجهز السياق لصاحب الصلاحية.', 'warning'],
          ['القياس', 'قِس زمن الدورة ونسبة الطلبات الراجعة بسبب نقص المعلومات.', 'good']
        ],
        metrics: [
          ['خفض العمل اليدوي', 'واضح', 'high', 'up'],
          ['جاهزية البيانات', 'متوسطة', 'medium', 'up'],
          ['مخاطر الاعتماد الآلي', 'متوسطة', 'medium', 'stable']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نشتغل عليها على مرحلتين: توحيد المدخلات أولاً، ثم تشغيل تنبيهات وربط أنظمة بشكل مضبوط.',
        items: [
          ['مرحلة أولى', 'وحّد النموذج والحقول المطلوبة لتقليل الأخطاء.', 'good'],
          ['مرحلة ثانية', 'اربط الإشعارات مع النظام الداخلي بعد اختبار الصلاحيات.', 'warning'],
          ['تجربة عامة', 'استخدم بيانات وهمية أو منزوعة الحساسية في الديمو.', 'good']
        ],
        metrics: [
          ['وضوح العملية', 'عال', 'high', 'up'],
          ['زمن التجربة', 'قصير', 'medium', 'down'],
          ['أثر الجودة', 'متوسط إلى عال', 'high', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'ai-workflows': {
    title: 'تدفقات عمل الذكاء الاصطناعي',
    schemaName: 'operational_reports_demo_schema',
    safetyProfile: 'business',
    sector: 'سير العمل المؤسسي',
    audience: 'فرق المنتج والعمليات والتحول الرقمي',
    problem: 'تداخل الخطوات بين البشر والأنظمة والذكاء الاصطناعي بدون ترتيب واضح',
    outcome: 'تصميم سير عمل، أدوار، نقاط قرار، ومخرجات قابلة للقياس',
    focus: 'صمم تدفق عمل ذكاء اصطناعي متعدد الخطوات يربط البيانات والقرارات والموافقات والتقارير.',
    disclaimer: 'هذا تصميم أولي لسير العمل، ويحتاج تجربة تشغيلية قبل اعتماده داخل بيئة الإنتاج.',
    scenarios: ['تأهيل عميل', 'مراجعة مستند', 'إطلاق خدمة'],
    variations: [
      {
        summary: 'تمام، سير العمل يحتاج فصل واضح بين جمع البيانات، التحليل، الاعتماد، والتنفيذ حتى لا تختلط المسؤوليات.',
        items: [
          ['ترتيب الخطوات', 'ابدأ بمدخل موحد ثم تحليل ثم مراجعة بشرية قبل الإجراء.', 'good'],
          ['نقطة القرار', 'حدد من يعتمد المخرجات ومتى يتم التصعيد.', 'warning'],
          ['المخرجات', 'اجعل كل خطوة تنتج ملخصاً أو مهمة قابلة للتتبع.', 'good']
        ],
        metrics: [
          ['وضوح التدفق', '79%', 'high', 'up'],
          ['تعقيد التنسيق', 'متوسط', 'medium', 'stable'],
          ['جاهزية القياس', 'جيدة', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، التصميم الأنسب هو تدفق خفيف يبدأ بالتلخيص والتصنيف ثم يرسل قراراً مقترحاً للمسؤول.',
        items: [
          ['دور الذكاء الاصطناعي', 'يلخص ويصنف ويقترح، ولا يعتمد القرار النهائي.', 'good'],
          ['دور الإنسان', 'يراجع الحالات عالية الأثر أو منخفضة الثقة.', 'good'],
          ['التكامل', 'اربط النظام بأداة مهام أو CRM قبل التوسع.', 'warning']
        ],
        metrics: [
          ['ثقة التصميم', '83%', 'high', 'up'],
          ['اعتماد بشري مطلوب', 'متوسط', 'medium', 'stable'],
          ['قابلية التوسع', 'جيدة', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نبنيه كسير عمل قابل للتجربة: مدخل واضح، مخرجات قصيرة، ومراجعة بشرية عند انخفاض الثقة.',
        items: [
          ['النطاق', 'اختر حالة استخدام واحدة قبل ربط كل الأنظمة.', 'good'],
          ['المخاطر', 'الغموض في المسؤوليات يسبب تعثر حتى لو كان النموذج جيداً.', 'warning'],
          ['المتابعة', 'لوحة صغيرة للحالات المفتوحة أهم من تقرير طويل.', 'good']
        ],
        metrics: [
          ['نضج الفكرة', 'عال', 'high', 'up'],
          ['مخاطر التشغيل', 'متوسطة', 'medium', 'stable'],
          ['سرعة الإطلاق التجريبي', 'جيدة', 'medium', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'smart-education-platform': {
    title: 'منصة تعليم ذكية',
    schemaName: 'education_demo_schema',
    safetyProfile: 'education',
    sector: 'التعليم والتدريب',
    audience: 'المدارس الأهلية ومراكز التدريب والجامعات',
    problem: 'صعوبة متابعة أداء المتعلمين وتخصيص الدعم وتلخيص تقدم الدورات',
    outcome: 'خطة تعلم، مؤشرات متابعة، تدخلات مبكرة، وتقارير إدارية',
    focus: 'صمم تجربة تعليمية ذكية تحمي خصوصية الطلاب، وتستخدم بيانات افتراضية فقط، وتدعم المعلم والإدارة.',
    disclaimer: 'هذا الديمو تعليمي تشغيلي ولا يستخدم بيانات طلاب حقيقية أو يقدم حكماً نهائياً على أداء طالب بعينه.',
    scenarios: ['مدرسة', 'مركز تدريب', 'جامعة'],
    variations: [
      {
        summary: 'تمام، الحالة مناسبة لمتابعة تعليمية مبكرة بشرط استخدام بيانات منزوعة الهوية واعتماد المعلم للخطة.',
        items: [
          ['مؤشر تعلم', 'تابع الالتزام والإنجاز والفجوات بدلاً من الاعتماد على درجة واحدة.', 'good'],
          ['التدخل المبكر', 'اقترح دعم أسبوعي للمتعثرين مع مراجعة المعلم.', 'good'],
          ['الخصوصية', 'لا تستخدم أسماء أو هويات طلاب في الديمو العام.', 'critical']
        ],
        metrics: [
          ['جاهزية المتابعة', '81%', 'high', 'up'],
          ['حساسية البيانات', 'مرتفعة', 'high', 'stable'],
          ['وضوح التدخلات', 'جيد', 'high', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'جاهز، المدخلات تكفي لبناء ملخص تعليمي إداري، لكن القرار التربوي يبقى للمعلم أو المشرف.',
        items: [
          ['تقسيم المتعلمين', 'قسّم الدعم حسب مستوى التقدم والحضور وتسليم المهام.', 'good'],
          ['إنذار مبكر', 'انخفاض الإنجاز مع حضور جيد قد يشير لحاجة تدريب عملي إضافي.', 'warning'],
          ['اعتماد بشري', 'لا تعتمد توصية تخص طالباً بدون مراجعة تربوية.', 'critical']
        ],
        metrics: [
          ['قابلية التقرير', 'عالية', 'high', 'up'],
          ['مخاطر الخصوصية', 'متوسطة', 'medium', 'stable'],
          ['حاجة بيانات إضافية', 'متوسطة', 'medium', 'up']
        ],
        riskLevel: 'medium'
      },
      {
        summary: 'خلّنا نشتغل عليها كلوحة متابعة: مؤشرات بسيطة، تدخلات واضحة، وتقرير مختصر للإدارة كل أسبوع.',
        items: [
          ['لوحة الإدارة', 'اعرض التقدم والحضور والإنجاز في مؤشرات قليلة.', 'good'],
          ['خطة الدعم', 'حدد مجموعة دعم للمتعثرين بدل توصيات عامة لكل الصف.', 'good'],
          ['جودة المدخلات', 'وصف عام بدون بيانات شخصية يكفي للديمو.', 'warning']
        ],
        metrics: [
          ['وضوح الخطة', 'جيد', 'high', 'up'],
          ['تعقيد التطبيق', 'متوسط', 'medium', 'stable'],
          ['أثر المتابعة', 'مرتفع عند الالتزام', 'high', 'up']
        ],
        riskLevel: 'medium'
      }
    ]
  },
  'smart-hospital-management': {
    title: 'إدارة المستشفيات الذكية',
    schemaName: 'hospital_management_demo_schema',
    safetyProfile: 'medical',
    sector: 'الرعاية الصحية',
    audience: 'إدارة المستشفيات والعيادات وفرق الجودة',
    problem: 'صعوبة رؤية الاختناقات بين الانتظار والأسرة والعيادات والجودة التشغيلية',
    outcome: 'مؤشرات تشغيلية، مخاطر جودة، أولويات تحسين، وخطة متابعة',
    focus: 'حلل مؤشرات تشغيل المستشفى فقط. لا تقدم تشخيصاً أو علاجاً أو نصيحة طبية فردية، وصعّد الحالات الحساسة لمختص بشري.',
    disclaimer: 'هذا الديمو تشغيلي فقط ولا يقدم تشخيصاً أو علاجاً أو نصيحة طبية، وأي حالة صحية يجب أن يراجعها مختص مرخص.',
    scenarios: ['طوارئ', 'عيادات', 'جودة'],
    variations: [
      {
        summary: 'تمام، المؤشرات تكشف ضغطاً تشغيلياً واضحاً، والأولوية تحسين التدفق والتصعيد بدون أي توصية طبية فردية.',
        items: [
          ['اختناق تشغيلي', 'زمن الانتظار أو إشغال الأسرة يحتاج متابعة يومية وربطاً بالطاقة الاستيعابية.', 'warning'],
          ['جودة الخدمة', 'الشكاوى أو التأخير المتكرر مؤشر إداري يحتاج خطة تحسين.', 'warning'],
          ['السلامة', 'أي قرار يؤثر على رعاية مريض يجب أن يبقى بيد مختص مرخص.', 'critical']
        ],
        metrics: [
          ['ضغط التشغيل', 'مرتفع', 'high', 'up'],
          ['وضوح المؤشرات', 'جيد', 'high', 'stable'],
          ['حاجة التصعيد', 'عالية', 'high', 'stable']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'جاهز، القراءة التشغيلية تشير إلى فرص تحسين في الجدولة وتوزيع الموارد مع إبقاء القرار السريري للمختصين.',
        items: [
          ['الجدولة', 'راجع توزيع المواعيد حسب الذروة ونسبة عدم الحضور.', 'warning'],
          ['الموارد', 'اربط مؤشرات الانتظار بالكوادر والغرف المتاحة قبل أي تغيير.', 'good'],
          ['الحدود الطبية', 'التحليل لا يقيّم حالات مرضى ولا يقترح علاجاً.', 'critical']
        ],
        metrics: [
          ['جاهزية لوحة التشغيل', '86%', 'high', 'up'],
          ['مخاطر الجودة', 'متوسطة إلى عالية', 'high', 'stable'],
          ['تعقيد الربط', 'متوسط', 'medium', 'stable']
        ],
        riskLevel: 'high'
      },
      {
        summary: 'خلّنا نرتبها كمراجعة تشغيلية: مؤشرات انتظار، طاقة، رضا، وخطة أسبوعية تعتمدها إدارة المستشفى.',
        items: [
          ['مؤشر رئيسي', 'ابدأ بزمن الانتظار ونسبة الإشغال لأنها تؤثر على تجربة المراجع.', 'warning'],
          ['خطة متابعة', 'اجتماع أسبوعي قصير مع لوحة مؤشرات أفضل من تقارير متفرقة.', 'good'],
          ['بيانات حساسة', 'استخدم مؤشرات مجمعة فقط في الديمو العام.', 'critical']
        ],
        metrics: [
          ['أولوية التحسين', 'عالية', 'high', 'up'],
          ['حساسية البيانات', 'مرتفعة', 'high', 'stable'],
          ['قابلية التنفيذ', 'متوسطة', 'medium', 'up']
        ],
        riskLevel: 'high'
      }
    ]
  }
});

function normalizeDemoType(demoType) {
  const key = String(demoType || '').trim().toLowerCase();
  return DEMO_TYPE_ALIASES[key] || key;
}

function clampText(value, fallback, max = 300) {
  const text = String(value || fallback || '').replace(/\s+/g, ' ').trim();
  return text.slice(0, max);
}

function normalizeSummary(value, fallback) {
  const text = clampText(value, fallback, 300);
  if (text.length >= 50) return text;
  return clampText(`${text} ${fallback}`, fallback, 300);
}

function takeArray(value, fallback, limit) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return source.slice(0, limit);
}

function selectVariation(blueprint, input = {}, scenarioData = {}) {
  const seed = [
    input.scenarioId,
    input.message,
    input.locale,
    scenarioData.scenario,
    scenarioData.title,
    Date.now().toString().slice(-4)
  ].filter(Boolean).join('|');
  let score = 0;
  for (const char of seed) score += char.charCodeAt(0);
  return blueprint.variations[score % blueprint.variations.length];
}

function toItem(tuple) {
  return {
    title: clampText(tuple?.title || tuple?.[0], 'مؤشر مهم', 90),
    description: clampText(tuple?.description || tuple?.[1], 'تحتاج هذه النقطة مراجعة قبل التوسع.', 260),
    status: STATUS_VALUES.has(tuple?.status || tuple?.[2]) ? (tuple.status || tuple[2]) : 'warning'
  };
}

function toMetric(tuple) {
  return {
    label: clampText(tuple?.label || tuple?.[0], 'مؤشر', 80),
    value: clampText(tuple?.value || tuple?.[1], 'متوسط', 80),
    level: LEVEL_VALUES.has(tuple?.level || tuple?.[2]) ? (tuple.level || tuple[2]) : 'medium',
    trend: TREND_VALUES.has(tuple?.trend || tuple?.[3]) ? (tuple.trend || tuple[3]) : 'stable'
  };
}

function toRecommendation(tuple) {
  return {
    text: clampText(tuple?.text || tuple?.[0], 'ابدأ بتجربة محدودة ومراجعة بشرية للمخرجات.', 220),
    priority: LEVEL_VALUES.has(tuple?.priority || tuple?.[1]) ? (tuple.priority || tuple[1]) : 'medium',
    effort: LEVEL_VALUES.has(tuple?.effort || tuple?.[2]) ? (tuple.effort || tuple[2]) : 'medium'
  };
}

function buildArabicReport({ blueprint, input, scenarioData, response }) {
  const scenario = clampText(
    scenarioData?.scenario || input?.scenarioId || blueprint.scenarios[0],
    blueprint.scenarios[0],
    120
  );
  const lines = [
    `تقرير ${blueprint.title}`,
    `السيناريو: ${scenario}`,
    `الملخص: ${response.summary}`,
    `أهم الملاحظات: ${response.items.map(item => `${item.title}: ${item.description}`).join(' | ')}`,
    `المؤشرات: ${response.metrics.map(metric => `${metric.label}: ${metric.value}`).join(' | ')}`,
    `التوصيات: ${response.recommendations.map(item => item.text).join(' | ')}`,
    `الخطوة التالية: ${response.nextActions[0] || 'راجع التقرير مع الفريق وحدد تجربة محدودة.'}`,
    `تنبيه: ${blueprint.disclaimer}`
  ];
  return lines.join('\n');
}

function createFallbackResponse(blueprint, input = {}, scenarioData = {}) {
  const variation = selectVariation(blueprint, input, scenarioData);
  const scenario = scenarioData?.scenario || input?.scenarioId || blueprint.scenarios[0];
  const response = {
    summary: normalizeSummary(
      variation.summary,
      `جاهز، هذا تحليل أولي لديمو ${blueprint.title} على سيناريو ${scenario} مع توصيات قابلة للمراجعة البشرية.`
    ),
    items: takeArray(variation.items, [], 3).map(toItem),
    metrics: takeArray(variation.metrics, [], 3).map(toMetric),
    recommendations: [
      ['ابدأ بسيناريو واحد عالي الأثر وبيانات غير حساسة.', 'high', 'low'],
      ['حدد مؤشر نجاح واضح قبل ربط الأنظمة أو التوسع.', 'medium', 'medium'],
      ['راجع النتائج مع صاحب القرار قبل أي إجراء تشغيلي.', 'high', 'low']
    ].map(toRecommendation),
    nextActions: [
      'راجع التقرير مع الفريق',
      'حدد الأنظمة والبيانات المطلوبة للربط',
      'احجز مكالمة 15 دقيقة مع BrightAI لتحديد النسخة المخصصة'
    ],
    report: '',
    confidence: PRO_MODEL_DEMOS.has(blueprint.demoType) ? 0.87 : 0.85,
    riskLevel: RISK_VALUES.has(variation.riskLevel) ? variation.riskLevel : 'medium'
  };
  response.report = buildArabicReport({ blueprint, input, scenarioData, response });
  return response;
}

function normalizeResponse(raw, blueprint, input = {}, scenarioData = {}) {
  const parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : extractJsonObject(raw);
  if (!parsed) return createFallbackResponse(blueprint, input, scenarioData);

  const fallback = createFallbackResponse(blueprint, input, scenarioData);
  const response = {
    summary: normalizeSummary(parsed.summary, fallback.summary),
    items: takeArray(parsed.items, fallback.items, 6).map(toItem),
    metrics: takeArray(parsed.metrics, fallback.metrics, 6).map(toMetric),
    recommendations: takeArray(parsed.recommendations, fallback.recommendations, 6).map(toRecommendation),
    nextActions: takeArray(parsed.nextActions, fallback.nextActions, 5).map(item => clampText(item, '', 160)).filter(Boolean),
    report: clampText(parsed.report, fallback.report, 2400),
    confidence: Number.isFinite(Number(parsed.confidence)) ? Math.min(1, Math.max(0, Number(parsed.confidence))) : fallback.confidence,
    riskLevel: RISK_VALUES.has(parsed.riskLevel) ? parsed.riskLevel : fallback.riskLevel
  };

  if (!response.nextActions.length) response.nextActions = fallback.nextActions;
  if (!response.report || response.report.length < 40) {
    response.report = buildArabicReport({ blueprint, input, scenarioData, response });
  }
  return response;
}

function buildPromptForDemo(blueprint, input = {}, scenarioData = {}) {
  const scenario = scenarioData?.scenario || input?.scenarioId || blueprint.scenarios[0];
  const message = input?.message || scenarioData?.message || scenarioData?.sample || '';
  const metadata = input?.metadata || scenarioData?.metadata || {};
  return [
    blueprint.systemInstruction,
    `نوع الديمو: ${blueprint.demoType}`,
    `اسم الديمو: ${blueprint.title}`,
    `القطاع: ${blueprint.sector}`,
    `الجمهور: ${blueprint.audience}`,
    `المشكلة: ${blueprint.problem}`,
    `المخرج المطلوب: ${blueprint.outcome}`,
    `السيناريو: ${scenario}`,
    message ? `مدخل المستخدم: ${message}` : '',
    Object.keys(metadata).length ? `سياق إضافي: ${JSON.stringify(metadata)}` : '',
    `تنبيه إلزامي داخل التقرير: ${blueprint.disclaimer}`,
    'أعد JSON صالحاً فقط، بدون Markdown وبدون أي نص خارجي.',
    'لا تذكر أنك استخدمت fallback أو مزود وهمي.',
    'اجعل report تقريراً عربياً منسقاً بأسطر نصية عادية لا Markdown.'
  ].filter(Boolean).join('\n');
}

function createDemoConfig(demoType, blueprint) {
  const model = PRO_MODEL_DEMOS.has(demoType) ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const config = {
    demoType,
    model,
    title: blueprint.title,
    schemaName: blueprint.schemaName,
    safetyProfile: blueprint.safetyProfile,
    systemInstruction: `${BASE_SYSTEM_INSTRUCTION}\n\n${blueprint.focus}`,
    system: `${BASE_SYSTEM_INSTRUCTION}\n\n${blueprint.focus}`,
    validationRules: {
      locale: ['ar-SA', 'en-SA'],
      maxInputLength: 3000,
      requiresHumanReview: true,
      prohibitSensitiveData: true,
      outputSchema: RESPONSE_SCHEMA_DESCRIPTION,
      forbiddenOutput: ['Markdown', 'code blocks', 'raw Gemini response', 'text outside JSON']
    },
    buildPrompt(input, scenarioData) {
      return buildPromptForDemo(config, input, scenarioData);
    },
    generationConfig: {
      temperature: model.includes('pro') ? 0.18 : 0.24,
      topP: 0.9,
      topK: 32,
      maxOutputTokens: model.includes('pro') ? 2200 : 1800,
      responseMimeType: 'application/json'
    },
    normalizeGeminiResponse(raw, input, scenarioData) {
      return normalizeResponse(raw, config, input, scenarioData);
    },
    fallbackResponse(input, scenarioData) {
      return createFallbackResponse(config, input, scenarioData);
    },
    disclaimer: blueprint.disclaimer,
    sector: blueprint.sector,
    audience: blueprint.audience,
    problem: blueprint.problem,
    outcome: blueprint.outcome,
    scenarios: blueprint.scenarios,
    variations: blueprint.variations
  };
  return Object.freeze(config);
}

const DEMO_PROMPTS = Object.freeze(
  Object.fromEntries(ALLOWED_DEMO_TYPES.map(demoType => [
    demoType,
    createDemoConfig(demoType, DEMO_BLUEPRINTS[demoType])
  ]))
);

function isSupportedDemoType(demoType) {
  return Boolean(DEMO_PROMPTS[normalizeDemoType(demoType)]);
}

function getDemoPrompt(demoType) {
  return DEMO_PROMPTS[normalizeDemoType(demoType)] || null;
}

function getModelForDemo(demoType) {
  const prompt = getDemoPrompt(demoType);
  return prompt?.model || 'gemini-2.5-flash';
}

module.exports = {
  ALLOWED_DEMO_TYPES,
  DEMO_KEYS: ALLOWED_DEMO_TYPES,
  DEMO_PROMPTS,
  DEMO_TYPE_ALIASES,
  BASE_SYSTEM_INSTRUCTION,
  RESPONSE_SCHEMA_DESCRIPTION,
  getDemoPrompt,
  getModelForDemo,
  isSupportedDemoType,
  normalizeDemoType
};
