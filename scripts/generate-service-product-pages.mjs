import fs from "node:fs";

const SITE = "https://brightai.site";
const DATE = "2026-04-25";
const WHATSAPP = "https://wa.me/966538229013";
const servicesPath = "services/index.html";
const sitemapPath = "sitemap.xml";
const renderPath = "render.yaml";
const redirectsPath = "_redirects";
const redirectsJsonPath = "redirects.json";

const source = fs.readFileSync(servicesPath, "utf8");
const productsMatch = source.match(/const products = (\[.*?\]);\n\s*let cart/s);
if (!productsMatch) throw new Error("تعذر استخراج قائمة المنتجات من صفحة الخدمات.");
const rawProducts = Function(`return ${productsMatch[1]}`)();

const slugOverrides = {
  "social-data-pro": "social-data-analysis",
  "operational-reports": "operational-reports-automation"
};

const related = {
  "data-analyst-agent": ["data-platform", "operational-reports-automation", "custom-ai-agent"],
  "custom-ai-agent": ["data-analyst-agent", "document-automation", "customer-service-automation"],
  "competitor-analysis-agent": ["seo-agent", "marketing-agent", "lead-hunter"],
  "seo-agent": ["marketing-agent", "marketing-automation", "social-data-analysis"],
  "social-data-analysis": ["marketing-agent", "marketing-automation", "seo-agent"],
  "health-data-analysis": ["medical-archive", "data-platform", "document-automation"],
  "marketing-agent": ["seo-agent", "marketing-automation", "lead-hunter"],
  "document-automation": ["data-platform", "approvals-automation", "medical-archive"],
  "smart-hiring-system": ["hr-automation", "custom-ai-agent", "document-automation"],
  "medical-archive": ["health-data-analysis", "document-automation", "data-platform"],
  "data-platform": ["data-analyst-agent", "operational-reports-automation", "health-data-analysis"],
  "lead-hunter": ["marketing-agent", "competitor-analysis-agent", "customer-service-automation"],
  "customer-service-automation": ["lead-hunter", "marketing-agent", "custom-ai-agent"],
  "hr-automation": ["smart-hiring-system", "approvals-automation", "document-automation"],
  "marketing-automation": ["marketing-agent", "seo-agent", "social-data-analysis"],
  "approvals-automation": ["hr-automation", "document-automation", "operational-reports-automation"],
  "operational-reports-automation": ["data-platform", "data-analyst-agent", "approvals-automation"],
  "supply-chain-optimization": ["operational-reports-automation", "data-platform", "data-analyst-agent"],
  "ai-consulting": ["custom-ai-agent", "data-platform", "smart-automation"]
};

const meta = {
  "data-analyst-agent": {
    primary: "وكيل محلل بيانات",
    secondary: ["تحليل بيانات الشركات", "داشبورد KPI", "مؤشرات أداء بالذكاء الاصطناعي"],
    intent: "شركة تبحث عن وكيل ذكاء اصطناعي يقرأ بياناتها التشغيلية ويحولها إلى مؤشرات قابلة للتنفيذ.",
    audience: "الإدارة التنفيذية، فرق البيانات، التشغيل، والمالية في الشركات السعودية.",
    goal: "طلب استشارة لتطبيق وكيل تحليل بيانات داخل الشركة.",
    problem: "تتأخر قرارات كثيرة لأن البيانات موزعة بين ملفات وأنظمة وتقارير يدوية. النتيجة أن الإدارة ترى الصورة بعد فوات الفرصة، أو تعتمد على اجتهادات لا تعكس الأداء الحقيقي.",
    solution: "يربط Bright AI مصادر البيانات المهمة، يجهز مؤشرات الأداء، ويبني وكيل تحليل يجيب عن الأسئلة التشغيلية ويبرز الأنماط والتنبيهات بلغة عربية واضحة.",
    useCases: ["لوحات أداء للإدارة التنفيذية", "تنبيهات عند تغير مؤشرات المبيعات أو التشغيل", "تحليل فروع أو مناطق داخل السعودية", "أسئلة فورية عن الإيرادات والمخزون والتكاليف"],
    benefits: ["رؤية أسرع لمؤشرات الأداء", "تقليل الاعتماد على التقارير اليدوية", "توحيد لغة الأرقام بين الإدارات", "دعم قرارات مبنية على بيانات"]
  },
  "custom-ai-agent": {
    primary: "وكيل ذكاء اصطناعي مخصص",
    secondary: ["AI Agent مخصص", "وكيل ذكاء اصطناعي للشركات", "أتمتة مهام بالذكاء الاصطناعي"],
    intent: "منشأة تحتاج وكيل AI مبني على سياساتها وبياناتها بدلاً من أداة عامة.",
    audience: "الشركات والجهات التي لديها إجراءات داخلية أو معرفة مؤسسية خاصة.",
    goal: "فتح نقاش لتصميم وكيل مخصص حسب بيانات الشركة.",
    problem: "الأدوات العامة لا تفهم سياسات الشركة، صلاحياتها، نبرة علامتها، ولا تفاصيل عملياتها اليومية. لذلك يبقى استخدامها محدوداً أو يحتاج مراجعة بشرية مستمرة.",
    solution: "يبني Bright AI وكيلاً مخصصاً حول بياناتك وسياساتك، مع قواعد استخدام واضحة وتكامل تدريجي مع الأنظمة أو الملفات التي يعتمد عليها فريقك.",
    useCases: ["مساعد داخلي للسياسات والإجراءات", "وكيل يراجع طلبات العملاء أو الموظفين", "أتمتة ردود متوافقة مع نبرة العلامة", "تلخيص مستندات ومعرفة مؤسسية"],
    benefits: ["تخصيص حسب بيئة العمل", "إجابات أكثر اتساقاً", "تقليل الوقت في المهام المتكررة", "إطلاق تدريجي قابل للتحسين"]
  },
  "competitor-analysis-agent": {
    primary: "وكيل تحليل المنافسين",
    secondary: ["تحليل المنافسين بالذكاء الاصطناعي", "مراقبة المنافسين", "تحليل السوق السعودي"],
    intent: "فريق تسويق أو إدارة يبحث عن رصد منظم للمنافسين وفرص السوق.",
    audience: "التسويق، المبيعات، تطوير الأعمال، والإدارة التجارية.",
    goal: "طلب وكيل يرصد المنافسين ويحول البيانات إلى توصيات.",
    problem: "متابعة المنافسين غالباً تتم بشكل متقطع عبر ملفات وملاحظات فردية. هذا يجعل الفرص والتهديدات تظهر متأخرة، خصوصاً في الأسواق السعودية السريعة.",
    solution: "ينظم Bright AI مصادر الرصد، يصنف إشارات المنافسين، ويقدم ملخصات وتوصيات تساعد فرق التسويق والمبيعات على اتخاذ خطوات واضحة.",
    useCases: ["رصد أسعار أو عروض المنافسين", "تحليل محتوى الحملات", "متابعة تقييمات العملاء", "استخراج فجوات في الرسائل التسويقية"],
    benefits: ["رؤية أوضح للسوق", "تحويل الرصد إلى قرارات", "توحيد تقارير المنافسين", "تحديد فرص نمو قابلة للتنفيذ"]
  },
  "seo-agent": {
    primary: "وكيل SEO",
    secondary: ["تحسين محركات البحث السعودية", "AEO وGEO", "AI Search Optimization"],
    intent: "شركة تريد تحسين ظهور موقعها في Google ومحركات الإجابة والبحث بالذكاء الاصطناعي.",
    audience: "فرق التسويق، المحتوى، التجارة الإلكترونية، وشركات الخدمات.",
    goal: "طلب خطة أو تطبيق وكيل SEO للموقع.",
    problem: "تحسين محركات البحث لم يعد مقتصراً على الكلمات المفتاحية. المواقع تحتاج بنية واضحة، إجابات مباشرة، Schema، وربطاً داخلياً يساعد Google وAI Search على فهم المحتوى.",
    solution: "يجهز Bright AI وكيل SEO يراجع الصفحات، يقترح محتوى قابل للفهرسة والاقتباس، وينظم العمل حول الكلمات والنية والربط الداخلي.",
    useCases: ["تحسين صفحات خدمات سعودية", "بناء FAQ وإجابات مباشرة", "اقتراح Schema وبيانات منظمة", "تخطيط محتوى يدعم AI Overviews"],
    benefits: ["استهداف بحث أدق", "صفحات أوضح لمحركات الإجابة", "تحسين الربط الداخلي", "تقليل هدر المحتوى غير المفهرس"]
  },
  "social-data-analysis": {
    primary: "تحليل بيانات وسائل التواصل",
    secondary: ["تحليل السوشيال ميديا", "تحليل تفاعل الجمهور", "رؤى حملات التواصل"],
    intent: "فريق تسويق يريد فهم أداء المحتوى والجمهور على منصات التواصل.",
    audience: "التسويق، المحتوى، التجارة الإلكترونية، والعلاقات العامة.",
    goal: "طلب تحليل بيانات اجتماعية أو لوحة متابعة للحملات.",
    problem: "الأرقام المتاحة في المنصات كثيرة لكنها متفرقة. بدون تحليل موحد يصعب معرفة ما الذي جذب الجمهور السعودي، وما الذي يحتاج تعديل في الرسائل أو الجدولة أو الاستهداف.",
    solution: "يجمع Bright AI إشارات التفاعل والحملات، يحللها حسب المنصة والجمهور والمحتوى، ويحول النتائج إلى توصيات قابلة للتطبيق.",
    useCases: ["تحليل أداء الحملات", "فهم المحتوى الأعلى تفاعلاً", "قياس ردود الجمهور على العروض", "مقارنة المنصات والقنوات"],
    benefits: ["قرارات محتوى أوضح", "تحسين الاستهداف", "تحديد فرص التفاعل", "تقليل الاعتماد على القراءة اليدوية"]
  },
  "health-data-analysis": {
    primary: "تحليل البيانات الصحية",
    secondary: ["ذكاء اصطناعي صحي", "تحليل تقارير طبية", "بيانات صحية السعودية"],
    intent: "منشأة صحية تبحث عن قراءة منظمة وآمنة للبيانات والتقارير الطبية.",
    audience: "المستشفيات، المراكز الطبية، إدارات الجودة، والتحول الرقمي الصحي.",
    goal: "مناقشة تطبيق تحليل بيانات صحي مخصص وآمن.",
    problem: "البيانات الصحية حساسة ومتشعبة بين سجلات وتقارير وأقسام. عندما لا تكون منظمة، تتأخر مؤشرات الجودة والتشغيل وتتكرر الجهود اليدوية.",
    solution: "يساعد Bright AI في تحليل البيانات الصحية ضمن نطاق متفق عليه، مع تركيز على التنظيم، مؤشرات الجودة، وربط الرؤى باحتياج المنشأة.",
    useCases: ["تحليل مؤشرات العيادات", "تصنيف التقارير الطبية", "دعم فرق الجودة", "قراءة أنماط تشغيلية في المنشآت الصحية"],
    benefits: ["تنظيم أفضل للبيانات", "رؤية أسرع للمؤشرات", "دعم القرار الصحي", "قابلية تخصيص حسب سياسات المنشأة"]
  },
  "marketing-agent": {
    primary: "وكيل تسويق بالذكاء الاصطناعي",
    secondary: ["وكيل تسويق", "حملات رقمية بالذكاء الاصطناعي", "تسويق ذكي السعودية"],
    intent: "شركة تريد مساعداً ذكياً يدعم التخطيط والتنفيذ وتحليل الحملات.",
    audience: "فرق التسويق، النمو، التجارة الإلكترونية، والمبيعات.",
    goal: "طلب وكيل تسويق أو ربطه بحملات الشركة.",
    problem: "فرق التسويق تعمل غالباً بين أفكار محتوى، إعلانات، تقارير، ورسائل متعددة. التشتت يجعل التحسين بطيئاً ويزيد الهدر في وقت الفريق والميزانية.",
    solution: "يبني Bright AI وكيلاً يساعد في توليد أفكار، تنظيم الرسائل، قراءة الأداء، وربط النتائج بخطوات تحسين واضحة.",
    useCases: ["تخطيط حملات شهرية", "اقتراح رسائل إعلانية", "تحليل أداء القنوات", "دعم فرق المبيعات بالمحتوى"],
    benefits: ["تنظيم العمل التسويقي", "تسريع إنتاج المحتوى", "تحسين قراءة الأداء", "ربط التسويق بالمبيعات"]
  },
  "document-automation": {
    primary: "أتمتة إدارة الوثائق",
    secondary: ["أرشفة المستندات بالذكاء الاصطناعي", "OCR عربي", "استخراج بيانات العقود والفواتير"],
    intent: "إدارة لديها مستندات كثيرة وتريد تحويلها إلى بيانات قابلة للبحث والمعالجة.",
    audience: "الشؤون الإدارية، المالية، القانونية، التشغيل، والقطاع الصحي.",
    goal: "طلب أتمتة وثائق أو تجربة على نوع مستندات محدد.",
    problem: "المستندات الورقية أو ملفات PDF غير المنظمة تستهلك وقتاً كبيراً في الفرز والإدخال والبحث، وتزيد احتمالات فقدان المعلومات أو تكرارها.",
    solution: "يجهز Bright AI مسار أتمتة يقرأ المستندات، يصنفها، يستخرج الحقول المهمة، ويربطها بسجلات قابلة للبحث والمراجعة.",
    useCases: ["استخراج بيانات الفواتير", "فرز العقود والملفات", "أرشفة معاملات داخلية", "تحويل ملفات الأقسام إلى سجلات منظمة"],
    benefits: ["بحث أسرع في المستندات", "تقليل الإدخال اليدوي", "تصنيف موحد للملفات", "جاهزية أعلى للمراجعة والتدقيق"]
  },
  "smart-hiring-system": {
    primary: "نظام توظيف ذكي",
    secondary: ["فرز السير الذاتية بالذكاء الاصطناعي", "ATS AI", "الاستقطاب الذكي"],
    intent: "فريق موارد بشرية يريد تسريع الفرز والمقابلات الأولية دون فقدان جودة الاختيار.",
    audience: "الموارد البشرية، مسؤولو التوظيف، والشركات ذات الشواغر المتكررة.",
    goal: "طلب نظام توظيف ذكي أو تجربة على وظائف محددة.",
    problem: "فرز السير الذاتية والمقابلات الأولية يستهلك وقتاً كبيراً، وقد تختلف معايير التقييم بين مسؤول وآخر، مما يبطئ إغلاق الشواغر.",
    solution: "ينظم Bright AI مسار الاستقطاب من استقبال المرشحين إلى الفرز والمقارنة والتقارير، مع إبقاء القرار النهائي بيد فريق التوظيف.",
    useCases: ["فرز السير الذاتية", "أسئلة مقابلة أولية", "مقارنة المرشحين", "لوحة متابعة لكل وظيفة"],
    benefits: ["فرز أسرع", "معايير أكثر اتساقاً", "تتبع أفضل للشواغر", "تقارير تساعد متخذ القرار"]
  },
  "medical-archive": {
    primary: "أرشيف طبي ذكي",
    secondary: ["سجلات طبية رقمية", "أرشفة ملفات المرضى", "ذكاء اصطناعي للمستشفيات"],
    intent: "منشأة صحية تريد تنظيم السجلات الطبية وربط الملفات بين الأقسام.",
    audience: "المستشفيات، المراكز الطبية، العيادات، وإدارات السجلات.",
    goal: "طلب نقاش حول أرشفة طبية ذكية وآمنة.",
    problem: "السجلات الطبية المتفرقة تجعل البحث والمتابعة بين الأقسام أبطأ، وتزيد عبء الإدارة عند الحاجة إلى مراجعة أو استرجاع معلومات المريض.",
    solution: "يوفر Bright AI نموذج أرشفة ذكي يساعد على تصنيف الملفات، استخراج بيانات أساسية، وربط السجلات بطريقة تناسب سياسات المنشأة.",
    useCases: ["تصنيف ملفات المرضى", "استخراج بيانات سريرية", "ربط ملفات الأقسام", "دعم فرق السجلات والجودة"],
    benefits: ["بحث أسرع في السجلات", "تنظيم أعلى للملفات", "تقليل التكرار اليدوي", "تخصيص حسب إجراءات المنشأة"]
  },
  "data-platform": {
    primary: "منصة بيانات مؤسسية",
    secondary: ["مستودع بيانات للشركات", "لوحات تحليل بيانات", "Data Platform Saudi"],
    intent: "شركة تريد توحيد مصادر البيانات وبناء رؤية إدارية مشتركة.",
    audience: "الإدارة التنفيذية، تقنية المعلومات، البيانات، والعمليات.",
    goal: "طلب تصميم منصة بيانات أو توحيد مصادر بيانات الشركة.",
    problem: "عندما تبقى البيانات موزعة بين أنظمة وملاك مختلفين، يصبح بناء تقرير موثوق أو مقارنة الأداء بين الإدارات عملية بطيئة ومكلفة.",
    solution: "يصمم Bright AI منصة بيانات تجمع المصادر المهمة، تنظم الصلاحيات، وتبني لوحات تحليل تساعد كل إدارة على قراءة ما يخصها.",
    useCases: ["توحيد بيانات المبيعات والتشغيل", "لوحات أداء للإدارة", "صلاحيات حسب الإدارة", "ربط التقارير التشغيلية بالمصدر"],
    benefits: ["مصدر بيانات أوضح", "لوحات أداء متسقة", "تحكم أفضل بالصلاحيات", "أساس قوي لوكلاء AI"]
  },
  "lead-hunter": {
    primary: "وكيل اكتشاف العملاء",
    secondary: ["توليد العملاء المحتملين", "Lead Generation AI", "اكتشاف فرص المبيعات"],
    intent: "فريق مبيعات يبحث عن طريقة منظمة لاكتشاف فرص وعملاء محتملين.",
    audience: "المبيعات، تطوير الأعمال، التسويق، وشركات B2B.",
    goal: "طلب وكيل يكتشف العملاء ويصنف فرص المتابعة.",
    problem: "البحث عن العملاء المحتملين يستهلك وقتاً طويلاً، وغالباً تختلط الفرص الجادة بالبيانات الضعيفة وغير المؤهلة.",
    solution: "يساعد Bright AI على جمع إشارات العملاء، تصنيفها، وإعداد قائمة متابعة تساعد فريق المبيعات على التركيز على الفرص الأوضح.",
    useCases: ["اكتشاف شركات مستهدفة", "تصنيف Leads حسب الملاءمة", "إعداد رسائل متابعة", "تغذية CRM بفرص أولية"],
    benefits: ["تدفق فرص أكثر تنظيماً", "تركيز أعلى لفريق المبيعات", "تقليل البحث اليدوي", "تأهيل أولي قبل التواصل"]
  },
  "customer-service-automation": {
    primary: "أتمتة خدمة العملاء",
    secondary: ["شات بوت خدمة العملاء", "أتمتة واتساب", "خدمة عملاء بالذكاء الاصطناعي"],
    intent: "منشأة تريد تقليل وقت انتظار العملاء وتنظيم الردود والتصعيد.",
    audience: "خدمة العملاء، المبيعات، التجارة الإلكترونية، والدعم الفني.",
    goal: "طلب أتمتة قناة خدمة عملاء أو ربطها بالموقع وواتساب.",
    problem: "تكرار الأسئلة، ضغط أوقات الذروة، وتفاوت جودة الردود يجعل تجربة العميل غير مستقرة ويزيد عبء الفريق.",
    solution: "يبني Bright AI مسار أتمتة يرد على الأسئلة الشائعة، يجمع بيانات الطلب، ويصعد الحالات التي تحتاج موظفاً مختصاً.",
    useCases: ["ردود واتساب والموقع", "تصعيد الحالات المعقدة", "جمع بيانات طلب الخدمة", "تقارير عن أكثر الأسئلة تكراراً"],
    benefits: ["رد أسرع للعملاء", "اتساق أعلى في الإجابات", "تخفيف الضغط عن الفريق", "تتبع أوضح للحالات"]
  },
  "hr-automation": {
    primary: "أتمتة الموارد البشرية",
    secondary: ["HR Automation السعودية", "أتمتة الإجازات والموافقات", "أتمتة عمليات HR"],
    intent: "إدارة موارد بشرية تريد رقمنة الإجراءات اليومية وتقليل المتابعة اليدوية.",
    audience: "الموارد البشرية، الإدارة، الشؤون الإدارية، والشركات متوسطة وكبيرة الحجم.",
    goal: "طلب تقييم عمليات HR المرشحة للأتمتة.",
    problem: "طلبات الإجازات، الترشيحات، الموافقات، المتابعة، والتقارير غالباً تنتقل بين رسائل وملفات وأنظمة مختلفة، مما يبطئ الاستجابة ويصعب التتبع.",
    solution: "ينظم Bright AI عمليات الموارد البشرية في مسارات واضحة، مع أتمتة الطلبات المتكررة وربط التقارير بما يحتاجه مسؤولو HR.",
    useCases: ["طلبات الإجازات", "موافقات HR", "متابعة التوظيف", "تقارير أداء وغياب"],
    benefits: ["تتبع أفضل للطلبات", "تقليل العمل اليدوي", "تجربة أوضح للموظف", "تقارير HR أكثر انتظاماً"]
  },
  "marketing-automation": {
    primary: "أتمتة التسويق الرقمي",
    secondary: ["Marketing Automation السعودية", "أتمتة الحملات", "إعادة الاستهداف"],
    intent: "فريق تسويق يريد تنظيم النشر والحملات والمتابعة عبر قنوات متعددة.",
    audience: "فرق التسويق، التجارة الإلكترونية، النمو، والوكالات.",
    goal: "طلب أتمتة قنوات أو حملات تسويقية محددة.",
    problem: "إدارة الحملات عبر قنوات متعددة تخلق فجوات في المتابعة والجدولة وقياس العائد، خصوصاً عندما يتم العمل يدوياً بين عدة أدوات.",
    solution: "يساعد Bright AI في بناء مسار تسويق مؤتمت ينظم التقويم، الشرائح، الرسائل، وإشارات الأداء التي تحتاج تحسيناً.",
    useCases: ["جدولة المحتوى", "رسائل متابعة للعملاء المهتمين", "تقارير حملات", "تقسيم جمهور حسب السلوك"],
    benefits: ["انتظام أعلى للحملات", "متابعة أسرع للعملاء", "قراءة أوضح للعائد", "تقليل المهام المتكررة"]
  },
  "approvals-automation": {
    primary: "أتمتة الموافقات الإدارية",
    secondary: ["Workflow الموافقات", "نظام موافقات ذكي", "أتمتة الإجراءات الإدارية"],
    intent: "منشأة تريد تسريع دورة الموافقات وتتبع الطلبات بين الإدارات.",
    audience: "الإدارة، العمليات، المالية، الموارد البشرية، والمشتريات.",
    goal: "طلب تصميم Workflow موافقات مناسب للمنشأة.",
    problem: "الموافقات اليدوية تضيع بين البريد والرسائل، ولا يعرف صاحب الطلب أين وصل الإجراء أو من المسؤول عن التأخير.",
    solution: "يبني Bright AI مسار موافقات واضحاً يحدد المراحل والمسؤوليات والتنبيهات، مع سجل تتبع لكل طلب.",
    useCases: ["موافقات مالية", "طلبات مشتريات", "اعتمادات HR", "طلبات تشغيلية بين الإدارات"],
    benefits: ["وضوح حالة الطلب", "تقليل التأخير", "سجل مراجعة أفضل", "توحيد إجراءات الاعتماد"]
  },
  "operational-reports-automation": {
    primary: "أتمتة التقارير التشغيلية",
    secondary: ["تقارير KPI تلقائية", "تقارير تشغيلية للشركات", "أتمتة لوحات الأداء"],
    intent: "إدارة تريد تقارير تشغيلية دورية دون جمع يدوي من الأنظمة.",
    audience: "العمليات، الإدارة التنفيذية، المالية، وتقنية المعلومات.",
    goal: "طلب أتمتة تقارير أو مؤشرات محددة.",
    problem: "التقارير التشغيلية غالباً تُجمع من مصادر متعددة في نهاية اليوم أو الأسبوع، فيتأخر القرار وتظهر أخطاء بسبب النسخ اليدوي.",
    solution: "يربط Bright AI مصادر البيانات الأساسية ويجهز تقارير دورية منظمة تعرض المؤشرات والتنبيهات لصناع القرار.",
    useCases: ["تقارير يومية للإدارة", "مؤشرات تشغيل وفروع", "تنبيهات تغير الأداء", "ملخصات أسبوعية للفرق"],
    benefits: ["تقارير أسرع", "أخطاء يدوية أقل", "رؤية دورية أوضح", "وقت أكثر للتحليل لا للجمع"]
  },
  "supply-chain-optimization": {
    primary: "تحسين سلسلة التوريد بالذكاء الاصطناعي",
    secondary: ["Supply Chain AI", "التنبؤ بالطلب", "تحسين المخزون"],
    intent: "شركة تريد تقليل نفاد المخزون والهدر وتحسين قرارات الطلب والتوزيع.",
    audience: "التجزئة، التجارة الإلكترونية، اللوجستيات، التصنيع، والمشتريات.",
    goal: "طلب تحليل سلسلة توريد أو نموذج تنبؤ بالطلب.",
    problem: "الطلب يتغير حسب المواسم والعروض والمناطق. الاعتماد على تقديرات يدوية قد يؤدي إلى نفاد مخزون أو زيادة تخزين مكلفة.",
    solution: "يساعد Bright AI على تحليل الطلب والمخزون وإشارات السوق لبناء توصيات طلب وتوزيع أكثر انتظاماً.",
    useCases: ["تنبؤ الطلب الموسمي", "متابعة نفاد المخزون", "تحسين إعادة الطلب", "تحليل أداء الفروع والمستودعات"],
    benefits: ["قرارات مخزون أوضح", "تقليل نفاد المنتجات", "تحسين التوزيع", "دعم فرق المشتريات والتشغيل"]
  },
  "ai-consulting": {
    primary: "استشارات الذكاء الاصطناعي",
    secondary: ["استشارة AI للشركات", "خطة تطبيق ذكاء اصطناعي", "تحول رقمي بالذكاء الاصطناعي"],
    intent: "شركة لا تعرف من أين تبدأ وتحتاج تحديد أفضل فرص تطبيق AI.",
    audience: "الملاك، الإدارة التنفيذية، التحول الرقمي، وتقنية المعلومات.",
    goal: "حجز استشارة لتحديد أولويات تطبيق الذكاء الاصطناعي.",
    problem: "كثير من الشركات تعرف أهمية الذكاء الاصطناعي لكنها لا تعرف أي عملية تبدأ بها، أو كيف توازن بين التكلفة والمخاطر والعائد المتوقع.",
    solution: "تقدم Bright AI استشارة عملية لتحديد الحالات المناسبة، ترتيب الأولويات، وتوضيح المسار الأنسب قبل بناء وكيل أو نظام كامل.",
    useCases: ["تقييم جاهزية البيانات", "اختيار أول مشروع AI", "خريطة أتمتة مبدئية", "تحديد مخاطر وتكاملات"],
    benefits: ["بداية أوضح", "تجنب حلول غير مناسبة", "ترتيب أولويات عملي", "خطة قابلة للتنفيذ"]
  }
};

const products = rawProducts.map((product) => {
  const slug = slugOverrides[product.id] || product.id;
  return {
    ...product,
    id: slug,
    slug,
    sku: slug,
    url: `${SITE}/services/${slug}/`,
    meta: meta[slug]
  };
});

const bySlug = new Map(products.map((product) => [product.slug, product]));

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonLd(data) {
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}

function textList(items) {
  return items.map((item) => `<li>${esc(item)}</li>`).join("\n");
}

function relatedLinks(product) {
  return (related[product.slug] || [])
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, 3);
}

function makeSchema(product, rels, faqs) {
  const url = `${SITE}/services/${product.slug}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        "name": "Bright AI",
        "alternateName": ["برايت AI", "مشرقة للذكاء الاصطناعي"],
        "url": `${SITE}/`,
        "logo": `${SITE}/assets/images/Gemini.png`,
        "image": `${SITE}/assets/images/Gemini.png`,
        "areaServed": { "@type": "Country", "name": "Saudi Arabia" },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+966538229013",
          "contactType": "sales",
          "areaServed": "SA",
          "availableLanguage": ["ar", "en"]
        }
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        "url": `${SITE}/`,
        "name": "Bright AI",
        "inLanguage": "ar-SA",
        "publisher": { "@id": `${SITE}/#organization` }
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": product.title,
        "description": product.description,
        "inLanguage": "ar-SA",
        "isPartOf": { "@id": `${SITE}/#website` },
        "about": { "@id": `${url}#service` },
        "dateModified": DATE,
        "breadcrumb": { "@id": `${url}#breadcrumb` },
        "significantLink": rels.map((item) => item.url)
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": `${SITE}/` },
          { "@type": "ListItem", "position": 2, "name": "الخدمات", "item": `${SITE}/services/` },
          { "@type": "ListItem", "position": 3, "name": product.name, "item": url }
        ]
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        "name": product.name,
        "description": product.description,
        "url": url,
        "provider": { "@id": `${SITE}/#organization` },
        "serviceType": product.category,
        "category": product.category,
        "sku": product.sku,
        "areaServed": { "@type": "Country", "name": "Saudi Arabia" },
        "audience": { "@type": "Audience", "audienceType": product.meta.audience },
        "offers": {
          "@type": "Offer",
          "url": url,
          "price": String(product.price),
          "priceCurrency": "SAR",
          "availability": "https://schema.org/InStock",
          "seller": { "@id": `${SITE}/#organization` }
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": { "@type": "Answer", "text": faq.a }
        }))
      }
    ]
  };
}

function makeFaqs(product) {
  const m = product.meta;
  return [
    { q: `ما هو ${product.name} من Bright AI؟`, a: `${product.name} هو حل من Bright AI يساعد ${m.audience} على معالجة مشكلة محددة: ${m.problem}` },
    { q: `لمن يناسب ${product.name}؟`, a: `يناسب ${m.audience} خصوصاً عندما يكون الهدف هو ${m.intent}` },
    { q: "كيف يبدأ تنفيذ الخدمة؟", a: "يبدأ التنفيذ بفهم الاحتياج، ثم مراجعة البيانات أو الأنظمة المتاحة، وبعدها إعداد الحل واختباره قبل الإطلاق والتحسين المستمر." },
    { q: "هل الخدمة مناسبة للسوق السعودي؟", a: "نعم، Bright AI شركة سعودية وتركز على اللغة العربية واحتياجات الشركات والجهات في السعودية مع قابلية تخصيص عالية." },
    { q: "هل أحتاج بيانات جاهزة قبل البدء؟", a: "وجود بيانات منظمة يساعد على تسريع التنفيذ، لكن يمكن البدء بجلسة تشخيص لتحديد مصادر البيانات والملفات والأنظمة المطلوبة." },
    { q: "هل يمكن ربط الخدمة بأنظمة الشركة؟", a: "يمكن مناقشة الربط حسب الأنظمة والصلاحيات ونوع البيانات. يتم تحديد نطاق التكامل بعد فهم البنية الحالية ومتطلبات الأمان." }
  ];
}

function makePage(product) {
  const m = product.meta;
  const url = `${SITE}/services/${product.slug}/`;
  const rels = relatedLinks(product);
  const faqs = makeFaqs(product);
  const schema = makeSchema(product, rels, faqs);
  const title = `${m.primary} في السعودية | ${product.name} من Bright AI`;
  const description = `${product.name} من Bright AI: ${product.answer} صفحة مخصصة تشرح المشكلة والحل وحالات الاستخدام وخطوات التنفيذ للشركات في السعودية.`;
  const relatedHtml = rels.map((item) => `<a class="related-card" href="/services/${item.slug}/"><strong>${esc(item.name)}</strong><span>${esc(item.answer)}</span></a>`).join("\n");
  const faqHtml = faqs.map((faq) => `<details class="faq-item"><summary>${esc(faq.q)}</summary><p>${esc(faq.a)}</p></details>`).join("\n");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar-SA">
<head>
  <meta charset="UTF-8" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-8LLESL207Q');
  </script>
  <meta http-equiv="x-ua-compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <!--
    Primary Keyword: ${m.primary}
    Secondary Keywords: ${m.secondary.join(" | ")}
    Search Intent: ${m.intent}
    Target Audience: ${m.audience}
    Conversion Goal: ${m.goal}
  -->
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="theme-color" content="#020617" />
  <meta name="ai-search-topic" content="${esc(`${m.primary} للشركات في السعودية`)}" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="ar-SA" href="${url}" />
  <link rel="alternate" hreflang="x-default" href="${url}" />
  <meta property="og:locale" content="ar_SA" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bright AI" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/assets/images/Gemini.png" />
  <meta property="og:image:alt" content="${esc(product.name)} من Bright AI" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${SITE}/assets/images/Gemini.png" />
  <script type="application/ld+json">
${jsonLd(schema)}
  </script>
  <style>
    :root { --bg:#020617; --panel:rgba(15,23,42,.76); --line:rgba(148,163,184,.18); --text:#f8fafc; --muted:#94a3b8; --soft:#c7d2fe; --primary:#6366f1; --green:#10b981; --cyan:#06b6d4; --container:1120px; }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; font-family:"IBM Plex Sans Arabic","Segoe UI",Arial,sans-serif; color:var(--text); line-height:1.85; background:radial-gradient(circle at 80% -10%, rgba(99,102,241,.28), transparent 34%), radial-gradient(circle at 12% 12%, rgba(16,185,129,.14), transparent 28%), linear-gradient(180deg,#020617,#07111f 52%,#020617); }
    a { color:inherit; text-decoration:none; }
    .container { width:min(var(--container), calc(100% - 32px)); margin-inline:auto; }
    .nav { position:sticky; top:0; z-index:10; border-bottom:1px solid rgba(255,255,255,.08); background:rgba(2,6,23,.86); backdrop-filter:blur(18px); }
    .nav-inner { min-height:74px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
    .brand { display:flex; align-items:center; gap:10px; font-weight:950; }
    .brand-mark { width:40px; height:40px; border-radius:14px; display:grid; place-items:center; background:linear-gradient(135deg,var(--primary),#8b5cf6,var(--green)); }
    .nav-links { display:flex; align-items:center; gap:8px; flex-wrap:wrap; color:#cbd5e1; font-weight:850; font-size:14px; }
    .btn { border:0; border-radius:999px; padding:12px 18px; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:900; min-height:48px; }
    .btn-primary { background:linear-gradient(135deg,var(--primary),#8b5cf6); color:#fff; box-shadow:0 18px 44px rgba(99,102,241,.28); }
    .btn-soft { background:rgba(99,102,241,.14); border:1px solid rgba(129,140,248,.28); color:#e0e7ff; }
    .btn-wa { background:#25d366; color:#052e16; }
    .hero { padding:72px 0 34px; }
    .hero-grid { display:grid; grid-template-columns:1.08fr .92fr; gap:22px; align-items:stretch; }
    .glass, .card, .table-wrap, .faq-item, .answer { border:1px solid var(--line); background:linear-gradient(180deg,rgba(15,23,42,.84),rgba(15,23,42,.58)); box-shadow:0 24px 80px rgba(0,0,0,.28); backdrop-filter:blur(16px); }
    .hero-copy, .hero-side { border-radius:28px; padding:clamp(24px,4vw,44px); }
    .eyebrow { display:inline-flex; gap:8px; margin-bottom:18px; padding:8px 12px; border-radius:999px; background:rgba(99,102,241,.14); border:1px solid rgba(129,140,248,.24); color:#c7d2fe; font-weight:950; }
    h1 { margin:0; font-size:clamp(34px,5vw,60px); line-height:1.15; letter-spacing:0; }
    .lead { margin:18px 0 0; color:#cbd5e1; font-size:18px; max-width:780px; }
    .hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:28px; }
    .intent-list { display:grid; gap:12px; margin:0; padding:0; list-style:none; }
    .intent-list li { padding:14px; border-radius:16px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); }
    section { padding:34px 0; }
    .section-head { margin-bottom:18px; }
    .section-head h2 { margin:0; font-size:clamp(26px,3.4vw,42px); line-height:1.25; }
    .section-head p { margin:8px 0 0; color:var(--muted); max-width:760px; }
    .answer { border-radius:24px; padding:22px; color:#e2e8f0; }
    .answer strong { color:#fff; }
    .grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
    .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    .card { border-radius:22px; padding:20px; }
    .card h3 { margin:0 0 8px; color:#c7d2fe; font-size:20px; }
    .card p, .card li { color:#cbd5e1; }
    .card ul, .steps { margin:0; padding:0; list-style:none; display:grid; gap:10px; }
    .card li, .step { padding:12px; border-radius:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); }
    .steps { counter-reset:step; }
    .step { counter-increment:step; display:grid; grid-template-columns:auto 1fr; gap:12px; align-items:start; }
    .step::before { content:counter(step); width:34px; height:34px; border-radius:12px; display:grid; place-items:center; background:rgba(16,185,129,.14); color:#d1fae5; font-weight:950; }
    .table-wrap { border-radius:22px; overflow:hidden; }
    table { width:100%; border-collapse:collapse; min-width:680px; }
    th,td { padding:16px; text-align:start; border-bottom:1px solid rgba(148,163,184,.14); vertical-align:top; }
    th { color:#c7d2fe; background:rgba(99,102,241,.08); }
    td { color:#cbd5e1; }
    .related-card { display:grid; gap:6px; padding:18px; border-radius:20px; background:rgba(15,23,42,.68); border:1px solid rgba(129,140,248,.22); }
    .related-card strong { color:#fff; }
    .related-card span { color:#94a3b8; font-size:14px; }
    .faq-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
    .faq-item { border-radius:18px; overflow:hidden; }
    .faq-item summary { cursor:pointer; padding:16px 18px; font-weight:950; }
    .faq-item p { margin:0; padding:0 18px 18px; color:#cbd5e1; }
    .final { text-align:center; border-radius:28px; padding:34px; background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(16,185,129,.12)); border:1px solid rgba(129,140,248,.24); }
    .breadcrumbs { color:#94a3b8; font-size:14px; margin-bottom:18px; }
    .breadcrumbs a { color:#c7d2fe; }
    footer { padding:34px 0 48px; color:#94a3b8; border-top:1px solid rgba(255,255,255,.08); }
    @media (max-width:900px) { .hero-grid,.grid-2,.grid-3,.faq-grid { grid-template-columns:1fr; } .nav-inner { align-items:flex-start; flex-direction:column; padding:14px 0; } .table-wrap { overflow-x:auto; } }
  </style>
</head>
<body>
  <header class="nav">
    <div class="container nav-inner">
      <a class="brand" href="/" aria-label="Bright AI">
        <span class="brand-mark">AI</span>
        <span>Bright AI</span>
      </a>
      <nav class="nav-links" aria-label="روابط رئيسية">
        <a href="/services/">الخدمات</a>
        <a href="/data-analysis/">تحليل البيانات</a>
        <a href="/smart-automation/">الأتمتة الذكية</a>
        <a href="/contact/">تواصل معنا</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy glass">
          <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">الرئيسية</a> / <a href="/services/">الخدمات</a> / ${esc(product.name)}</nav>
          <div class="eyebrow">${esc(product.category)} للشركات في السعودية</div>
          <h1>${esc(product.title)}</h1>
          <p class="lead">${esc(product.description)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${WHATSAPP}?text=${encodeURIComponent(`السلام عليكم، أحتاج تفاصيل عن ${product.name}`)}">اطلب الخدمة</a>
            <a class="btn btn-soft" href="/services/">العودة إلى كل خدمات Bright AI</a>
          </div>
        </div>
        <aside class="hero-side glass">
          <h2 style="margin-top:0">ملخص نية البحث</h2>
          <ul class="intent-list">
            <li><strong>الكلمة الرئيسية:</strong> ${esc(m.primary)}</li>
            <li><strong>الجمهور:</strong> ${esc(m.audience)}</li>
            <li><strong>هدف التحويل:</strong> ${esc(m.goal)}</li>
            <li><strong>السعر الابتدائي:</strong> ${esc(product.price)} ${esc(product.currency)}</li>
          </ul>
        </aside>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="section-head"><h2>إجابة مختصرة</h2></div>
        <div class="answer">
          <strong>${esc(product.name)}</strong> من Bright AI هو حل ذكاء اصطناعي يساعد ${esc(m.audience)} على ${esc(product.answer)} يعالج الحل مشكلة ${esc(m.problem)} والنتيجة المتوقعة هي ${esc(m.benefits.slice(0, 2).join(" و"))} دون الاعتماد الكامل على العمل اليدوي.
        </div>
      </div>
    </section>

    <section>
      <div class="container grid-2">
        <article class="card"><h2>المشكلة</h2><p>${esc(m.problem)}</p></article>
        <article class="card"><h2>حل Bright AI</h2><p>${esc(m.solution)}</p></article>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="section-head"><h2>حالات استخدام في السعودية</h2><p>أمثلة عملية تساعد الفرق السعودية على فهم أين يمكن تطبيق الخدمة داخل الشركة أو الجهة.</p></div>
        <div class="grid-2">${m.useCases.map((item) => `<article class="card"><h3>${esc(item)}</h3><p>يمكن تخصيص ${esc(product.name)} لهذا السيناريو حسب بياناتك وأنظمتك وصلاحيات الفريق.</p></article>`).join("\n")}</div>
      </div>
    </section>

    <section>
      <div class="container grid-2">
        <article class="card"><h2>الفوائد</h2><ul>${textList(m.benefits)}</ul></article>
        <article class="card"><h2>لمن هذه الخدمة؟</h2><p>${esc(m.audience)}</p><p>هذه الصفحة تستهدف نية بحث محددة: ${esc(m.intent)}</p></article>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="section-head"><h2>كيف يعمل التنفيذ؟</h2><p>مسار عملي قابل للتخصيص حسب نضج بيانات الشركة والأنظمة المتاحة.</p></div>
        <div class="steps">
          <div class="step"><strong>فهم الاحتياج</strong><span>تحديد الهدف، المستخدمين، ومؤشرات النجاح.</span></div>
          <div class="step"><strong>ربط البيانات أو الأنظمة</strong><span>مراجعة الملفات أو الأنظمة ومصادر البيانات المناسبة.</span></div>
          <div class="step"><strong>إعداد الوكيل أو النظام</strong><span>بناء التدفق، التعليمات، الصلاحيات، وقواعد الاستخدام.</span></div>
          <div class="step"><strong>الاختبار</strong><span>اختبار المخرجات مع الفريق وتعديل السلوك قبل الإطلاق.</span></div>
          <div class="step"><strong>الإطلاق</strong><span>تفعيل الحل على نطاق متفق عليه وربطه بطريقة العمل اليومية.</span></div>
          <div class="step"><strong>التحسين المستمر</strong><span>مراجعة الاستخدام والمخرجات وتحسينها حسب التغذية الراجعة.</span></div>
        </div>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="section-head"><h2>مقارنة الطريقة التقليدية مع Bright AI</h2></div>
        <div class="table-wrap"><table>
          <thead><tr><th>العنصر</th><th>الطريقة التقليدية</th><th>استخدام Bright AI</th></tr></thead>
          <tbody>
            <tr><td>السرعة</td><td>اعتماد أكبر على جمع يدوي ومتابعات متكررة.</td><td>تنظيم المسار وتقليل الخطوات المتكررة.</td></tr>
            <tr><td>الاتساق</td><td>تختلف النتائج حسب الشخص والوقت وطريقة التوثيق.</td><td>قواعد أوضح ومخرجات قابلة للمراجعة والتحسين.</td></tr>
            <tr><td>قابلية التوسع</td><td>تحتاج زيادة الفريق مع زيادة الحجم.</td><td>قابلة للتوسع تدريجياً حسب البيانات والأنظمة.</td></tr>
          </tbody>
        </table></div>
      </div>
    </section>

    <section>
      <div class="container grid-2">
        <article class="card"><h2>إشارات الثقة</h2><ul>
          <li>شركة سعودية تركز على احتياجات السوق السعودي.</li>
          <li>دعم عربي ومحتوى مناسب للفرق المحلية.</li>
          <li>حلول قابلة للتخصيص حسب البيانات والإجراءات.</li>
          <li>لا يتم افتراض تكاملات أو نتائج قبل مراجعة الواقع التشغيلي.</li>
        </ul></article>
        <article class="card"><h2>روابط داخلية قريبة</h2><div class="grid-1">${relatedHtml}</div></article>
      </div>
    </section>

    <section>
      <div class="container">
        <div class="section-head"><h2>الأسئلة الشائعة</h2></div>
        <div class="faq-grid">${faqHtml}</div>
      </div>
    </section>

    <section>
      <div class="container final">
        <h2>ناقش احتياج شركتك في ${esc(product.name)}</h2>
        <p>أرسل لنا وصفاً مختصراً للعملية أو البيانات أو المشكلة، وسنقترح مساراً عملياً يناسب شركتك في السعودية.</p>
        <div class="hero-actions" style="justify-content:center">
          <a class="btn btn-wa" href="${WHATSAPP}?text=${encodeURIComponent(`السلام عليكم، أريد مناقشة ${product.name} لشركتي.`)}">تواصل عبر واتساب</a>
          <a class="btn btn-soft" href="/services/">استكشف كل الحلول</a>
        </div>
      </div>
    </section>
  </main>

  <footer><div class="container">© Bright AI. صفحة ${esc(product.name)} ضمن خدمات Bright AI في السعودية.</div></footer>
</body>
</html>
`;
}

for (const product of products) {
  fs.writeFileSync(`services/${product.slug}.html`, makePage(product));
}

function makeServicesSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        "name": "Bright AI",
        "alternateName": ["برايت AI", "مشرقة للذكاء الاصطناعي"],
        "url": `${SITE}/`,
        "logo": `${SITE}/assets/images/Gemini.png`,
        "image": `${SITE}/assets/images/Gemini.png`,
        "areaServed": { "@type": "Country", "name": "Saudi Arabia" },
        "contactPoint": { "@type": "ContactPoint", "telephone": "+966538229013", "contactType": "sales", "areaServed": "SA", "availableLanguage": ["ar", "en"] }
      },
      { "@type": "WebSite", "@id": `${SITE}/#website`, "url": `${SITE}/`, "name": "Bright AI", "inLanguage": "ar-SA", "publisher": { "@id": `${SITE}/#organization` } },
      {
        "@type": "WebPage",
        "@id": `${SITE}/services/#webpage`,
        "url": `${SITE}/services/`,
        "name": "خدمات ومنتجات Bright AI للذكاء الاصطناعي في السعودية",
        "description": "صفحة خدمات Bright AI الرئيسية تربط إلى صفحات تفصيلية لكل وكيل ونظام وأتمتة للشركات في السعودية.",
        "inLanguage": "ar-SA",
        "isPartOf": { "@id": `${SITE}/#website` },
        "about": { "@id": `${SITE}/#organization` },
        "dateModified": DATE,
        "breadcrumb": { "@id": `${SITE}/services/#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE}/services/#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": `${SITE}/` },
          { "@type": "ListItem", "position": 2, "name": "الخدمات", "item": `${SITE}/services/` }
        ]
      },
      {
        "@type": "ItemList",
        "@id": `${SITE}/services/#products`,
        "name": "قائمة خدمات ومنتجات Bright AI",
        "description": "خدمات ووكلاء وأنظمة ذكاء اصطناعي وأتمتة أعمال للشركات في السعودية.",
        "numberOfItems": products.length,
        "itemListElement": products.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": product.url,
          "item": {
            "@type": "Service",
            "name": product.name,
            "description": product.description,
            "url": product.url,
            "sku": product.sku,
            "category": product.category,
            "provider": { "@id": `${SITE}/#organization` },
            "areaServed": { "@type": "Country", "name": "Saudi Arabia" },
            "offers": { "@type": "Offer", "url": product.url, "price": String(product.price), "priceCurrency": "SAR", "availability": "https://schema.org/InStock", "seller": { "@id": `${SITE}/#organization` } }
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE}/services/#faq`,
        "mainEntity": [
          { "@type": "Question", "name": "ما هي خدمات Bright AI في السعودية؟", "acceptedAnswer": { "@type": "Answer", "text": "Bright AI تقدم وكلاء ذكاء اصطناعي وأنظمة تحليل وأتمتة أعمال للشركات في السعودية، ولكل خدمة صفحة تفصيلية تشرح نية البحث والمشكلة والحل وحالات الاستخدام." } },
          { "@type": "Question", "name": "كيف أختار صفحة الخدمة المناسبة؟", "acceptedAnswer": { "@type": "Answer", "text": "ابدأ من احتياجك: تحليل بيانات، تسويق، موارد بشرية، خدمة عملاء، وثائق، تقارير تشغيلية، سلسلة توريد، أو استشارة AI، ثم افتح صفحة المنتج التفصيلية." } },
          { "@type": "Question", "name": "هل يمكن طلب الخدمة مباشرة؟", "acceptedAnswer": { "@type": "Answer", "text": "نعم، يمكن استخدام زر التواصل أو إضافة الخدمة للسلة ثم إرسال الطلب عبر واتساب. روابط المنتجات الأساسية داخلية ولا تخرج إلى Salla." } },
          { "@type": "Question", "name": "هل المنتجات مناسبة للشركات السعودية؟", "acceptedAnswer": { "@type": "Answer", "text": "نعم، الصفحات والخدمات موجهة للشركات والجهات في السعودية مع دعم عربي وقابلية تخصيص حسب البيانات والأنظمة." } },
          { "@type": "Question", "name": "هل توجد صفحة تفصيلية لكل خدمة؟", "acceptedAnswer": { "@type": "Answer", "text": "نعم، كل كرت خدمة في صفحة الخدمات يربط إلى صفحة فرعية مخصصة بدون .html في الرابط النهائي." } }
        ]
      }
    ]
  };
}

let updatedServices = source;
updatedServices = updatedServices.replace(/<script type="application\/ld\+json">\s*{[\s\S]*?\n\s*<\/script>/, `<script type="application/ld+json">\n${jsonLd(makeServicesSchema())}\n  </script>`);
updatedServices = updatedServices.replace(/<section class="answer-section">/, `<section class="answer-section">`);
const hubLinks = `
                <div class="answer-lists" aria-label="روابط صفحات المنتجات التفصيلية">
                    <article class="answer-list-card">
                        <h3>استكشف حلول Bright AI حسب احتياجك</h3>
                        <ul>
${products.map((product) => `                            <li><a href="/services/${product.slug}/"><strong>${esc(product.name)}</strong><span>${esc(product.answer)}</span></a></li>`).join("\n")}
                        </ul>
                    </article>
                </div>`;
if (!updatedServices.includes("استكشف حلول Bright AI حسب احتياجك")) {
  updatedServices = updatedServices.replace(/(\s*<section id="products" class="products-section">)/, `${hubLinks}\n$1`);
}
updatedServices = updatedServices.replace(/اختر المنتج، اضغط إضافة للسلة، راجع الإجمالي، ثم أرسل الطلب عبر واتساب\. الدفع الحالي متاح عبر التحويل البنكي فقط\./g, "افتح صفحة الخدمة التفصيلية لمعرفة الاستخدامات، ثم أضف الخدمة للسلة أو أرسل الطلب عبر واتساب. الدفع الحالي متاح عبر التحويل البنكي فقط.");
updatedServices = updatedServices.replace(/اختر المنتج، اضغط إضافة للسلة، راجع الإجمالي، ثم أرسل الطلب عبر واتساب/g, "افتح صفحة الخدمة التفصيلية، ثم أضف الخدمة للسلة أو أرسل الطلب عبر واتساب");
updatedServices = updatedServices.replace(/const products = \[.*?\];\n\s*let cart/s, `const products = ${JSON.stringify(products.map(({ meta: _meta, ...product }) => product))};\n        let cart`);
updatedServices = updatedServices.replace('<a class="mini-link" href="${escapeAttribute(product.url)}" target="_blank" rel="noopener">عرض صفحة المنتج ↗</a>', '<a class="mini-link" href="${escapeAttribute(product.url)}">اعرف المزيد عن ${escapeHtml(product.name)}</a>');
updatedServices = updatedServices.replace('<a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${createWhatsAppProductLink(product)}">💬 تواصل</a>', '<a class="btn btn-soft" href="${escapeAttribute(product.url)}">اعرف المزيد</a>');
updatedServices = updatedServices.replace("الرابط: ${product.url}", "صفحة الخدمة: ${product.url}");
fs.writeFileSync(servicesPath, updatedServices);

const productUrls = products.map((product) => `  <url>
    <loc>${SITE}/services/${product.slug}/</loc>
    <xhtml:link rel="alternate" hreflang="ar-SA" href="${SITE}/services/${product.slug}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/services/${product.slug}/" />
    <lastmod>${DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${["data-analyst-agent", "custom-ai-agent", "seo-agent", "data-platform", "customer-service-automation", "ai-consulting"].includes(product.slug) ? "0.80" : "0.70"}</priority>
  </url>`).join("\n");
let sitemap = fs.readFileSync(sitemapPath, "utf8");
sitemap = sitemap.replace(/\n\s*<url>\s*<loc>https:\/\/brightai\.site\/services\/(?:[^<]+)\/<\/loc>[\s\S]*?<\/url>/g, "");
sitemap = sitemap.replace(/(\s*<url>\s*<loc>https:\/\/brightai\.site\/smart-automation\/<\/loc>)/, `\n${productUrls}\n$1`);
fs.writeFileSync(sitemapPath, sitemap);

const rewrites = products.map((product) => `      - type: rewrite
        source: /services/${product.slug}/
        destination: /services/${product.slug}.html
      - type: redirect
        source: /services/${product.slug}.html
        destination: /services/${product.slug}/
        status: 301`).join("\n");
let render = fs.readFileSync(renderPath, "utf8");
if (!render.includes("# === Product service landing pages ===")) {
  render = render.replace(/(\s*# ملاحظة تشغيلية: بعد أي Sync\/Deploy)/, `\n      # === Product service landing pages ===\n${rewrites}\n$1`);
}
fs.writeFileSync(renderPath, render);

let redirects = fs.readFileSync(redirectsPath, "utf8");
const redirectLines = products.map((product) => `/services/${product.slug}/ /services/${product.slug}.html 200\n/services/${product.slug}.html /services/${product.slug}/ 301`).join("\n");
if (!redirects.includes("# Product service landing pages")) {
  redirects = redirects.replace(/(\n\/smart-automation\.html \/smart-automation\/ 301)/, `\n# Product service landing pages\n${redirectLines}\n$1`);
}
fs.writeFileSync(redirectsPath, redirects);

const redirectsJson = JSON.parse(fs.readFileSync(redirectsJsonPath, "utf8"));
const existing = new Set(redirectsJson.redirects.map((item) => item.from));
for (const product of products) {
  const from = `/services/${product.slug}.html`;
  if (!existing.has(from)) redirectsJson.redirects.push({ from, to: `/services/${product.slug}/` });
}
fs.writeFileSync(redirectsJsonPath, `${JSON.stringify(redirectsJson, null, 2)}\n`);

console.log(JSON.stringify(products.map((product) => ({
  product: product.name,
  file: `services/${product.slug}.html`,
  url: `/services/${product.slug}/`,
  primary: product.meta.primary,
  secondary: product.meta.secondary,
  intent: product.meta.intent,
  related: relatedLinks(product).map((item) => `/services/${item.slug}/`)
})), null, 2));
