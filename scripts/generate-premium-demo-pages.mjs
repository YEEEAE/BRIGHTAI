#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const today = "2026-04-28";
const site = "https://brightai.site";
const wa = "https://wa.me/966538229013";

const sharedFaq = [
  ["هل التجربة مجانية؟", "نعم، التجربة العامة مجانية ومصممة لإظهار شكل التقرير وطريقة التفكير قبل طلب نسخة مخصصة."],
  ["هل يمكن ربطها ببيانات الشركة؟", "نعم، النسخة المخصصة يمكن ربطها بمصادر الشركة مثل الأنظمة التشغيلية، ملفات البيانات، أو واجهات البرمجة بعد مراجعة الصلاحيات."],
  ["هل يدعم العربية؟", "نعم، التجربة مهيأة للعربية والسوق السعودي مع إمكانية التعامل مع نصوص عربية وإنجليزية عند الحاجة."],
  ["هل البيانات آمنة؟", "لا ترفع بيانات حساسة في النسخة العامة. النسخة المخصصة تُصمم بصلاحيات وصول، سجل تدقيق، وضوابط مشاركة مناسبة."],
  ["ما الفرق بين الديمو والنسخة المخصصة؟", "الديمو يوضح الفكرة بعينات مبسطة، بينما النسخة المخصصة تُبنى على بياناتك وتكاملاتك ومؤشرات الأداء الفعلية."]
];

const serviceMap = {
  "data-analyzer": "/services/data-platform.html",
  "smart-medical-archive": "/services/medical-archive.html",
  "ocr-demo": "/services/document-automation.html",
  "opportunity-discovery-agent": "/services/lead-hunter.html"
};

const demos = [
  {
    slug: "smart-hiring-system",
    name: "نظام التوظيف الذكي",
    type: "smart-hiring-system",
    schema: "smart_hiring_demo_schema",
    sector: "الموارد البشرية",
    audience: "مديري الموارد البشرية والرؤساء التنفيذيين في الشركات السعودية",
    problem: "بطء فرز السير الذاتية وصعوبة توحيد تقييم المرشحين",
    outcome: "قائمة مختصرة عادلة، مؤشرات جاهزية، وأسئلة مقابلة مرتبطة بالوظيفة",
    answer: "هذا الديمو يساعدك على تقييم ملاءمة المرشحين خلال دقائق عبر إدخال وصف وظيفة وعينة سيرة ذاتية، ثم يعرض ملخصاً تنفيذياً ومخاطر وتوصيات مقابلة قابلة للمراجعة البشرية.",
    description: "جرّب نظام التوظيف الذكي من Bright AI لفرز المرشحين وبناء قائمة مختصرة وتوصيات مقابلة للشركات السعودية دون الاعتماد على وعود توظيف آلية.",
    service: "/services/smart-hiring-system.html",
    samples: [
      ["شركة خدمات", "وظيفة مدير عمليات. المرشح لديه ٦ سنوات في إدارة فرق ميدانية ومؤشرات جودة وخبرة متوسطة في لوحات البيانات."],
      ["جهة تدريبية", "وظيفة منسق تدريب. المرشح لديه خبرة في جدولة الدورات وخدمة المتدربين وتقارير الحضور."],
      ["مصنع", "وظيفة مشرف إنتاج. المرشح لديه خبرة في السلامة والجودة وتخطيط الورديات."]
    ],
    related: ["data-analyzer", "hr-automation", "operational-reports-automation"],
    faq: [["كيف يساعد نظام التوظيف الذكي؟", "يساعد على ترتيب المرشحين حسب المتطلبات، كشف الفجوات، وتجهيز أسئلة مقابلة موحدة مع إبقاء القرار النهائي للفريق البشري."]]
  },
  {
    slug: "data-analyzer",
    name: "منصة تحليل البيانات",
    type: "data-analyzer",
    schema: "data_analyzer_demo_schema",
    sector: "الإدارة والبيانات",
    audience: "الإدارة التنفيذية وفرق التحليل في الشركات السعودية",
    problem: "تشتت البيانات بين ملفات وتقارير لا تقود إلى قرار واضح",
    outcome: "ملخص تنفيذي، مؤشر جاهزية، شذوذ محتمل، ولوحات مقترحة",
    answer: "هذا الديمو يساعدك على تحليل عينة بيانات خلال دقائق عبر وصف الأعمدة أو لصق عينة جدولية، ثم يحولها إلى مؤشرات ومخاطر وخطوات عمل بدل عرض أرقام خام فقط.",
    description: "جرّب منصة تحليل البيانات من Bright AI لاكتشاف جودة البيانات والفرص والمخاطر ولوحات القرار المناسبة للشركات السعودية.",
    service: "/services/data-platform.html",
    samples: [
      ["متجر إلكتروني", "الشهر، الزيارات، الطلبات، المرتجعات، الإيراد: يناير ٩٢٠٠، ٤٢٠، ٢٨، ٣٢٠٠٠٠. فبراير ١١٠٠٠، ٥١٠، ٥٧، ٣٨٠٠٠٠."],
      ["شركة خدمات", "مصدر العملاء: إعلانات، واتساب، توصيات. معدل التحويل ٤٪، ١٢٪، ١٨٪. تكلفة العميل متفاوتة بين القنوات."],
      ["مصنع", "إنتاج يومي، هدر، توقفات، طلبات متأخرة. ارتفاع التوقفات في وردية المساء."]
    ],
    related: ["operational-reports-automation", "data-quality", "marketing-ai-agent"],
    faq: [["كيف أحلل بيانات شركتي؟", "ابدأ بعينة صغيرة من الأعمدة المهمة، ثم استخدم النتيجة لتحديد مؤشرات القرار والبيانات الناقصة قبل الربط الكامل."]]
  },
  {
    slug: "customer-service-automation",
    name: "أتمتة خدمة العملاء",
    type: "customer-service-automation",
    schema: "customer_service_demo_schema",
    sector: "خدمة العملاء",
    audience: "مديري تجربة العميل والمتاجر الإلكترونية وشركات الخدمات",
    problem: "تكرار الاستفسارات وتأخر الرد وصعوبة التصعيد المنظم",
    outcome: "تصنيف النية، أولوية التذكرة، رد مقترح، وقواعد تصعيد",
    answer: "هذا الديمو يساعدك على تحويل رسالة عميل إلى رد منظم خلال دقائق عبر فهم النية وتحديد الأولوية واقتراح مسار تصعيد واضح عند الحاجة.",
    description: "جرّب أتمتة خدمة العملاء بالذكاء الاصطناعي لتصنيف المحادثات واقتراح ردود آمنة وربطها بسير عمل خدمة العملاء.",
    service: "/services/customer-service-automation.html",
    samples: [
      ["متجر إلكتروني", "عميل يسأل عن شحنة متأخرة منذ يومين ويريد معرفة التعويض المتاح."],
      ["شركة خدمات", "عميل لديه اشتراك متوقف ويريد تصعيد الطلب لمدير الحساب."],
      ["عيادة", "مراجع يريد تغيير الموعد ومعرفة سياسة الإلغاء."]
    ],
    related: ["brightsales", "marketing-automation", "custom-ai-agent"],
    faq: [["كيف تستخدم أتمتة خدمة العملاء؟", "أدخل نص رسالة العميل أو سياسة الخدمة، ثم راجع الرد المقترح وقواعد التصعيد قبل استخدامها مع العملاء."]]
  },
  {
    slug: "custom-ai-agent",
    name: "وكيل ذكاء اصطناعي مخصص",
    type: "custom-ai-agent",
    schema: "custom_agent_demo_schema",
    sector: "وكلاء الذكاء الاصطناعي",
    audience: "أصحاب القرار الذين يحتاجون وكيل عمل مرتبط بإجراءات الشركة",
    problem: "الاعتماد على أدوات عامة لا تفهم سياسات الشركة أو صلاحياتها",
    outcome: "تعريف وكيل، مهامه، حدوده، وخطة ربطه بالأنظمة",
    answer: "هذا الديمو يساعدك على تصور وكيل ذكاء اصطناعي مخصص خلال دقائق عبر وصف المهمة والأنظمة الحالية، ثم يعرض حدود الصلاحيات وخطة التكامل والمخاطر.",
    description: "جرّب تصميم وكيل ذكاء اصطناعي مخصص من Bright AI يربط المهام اليومية ببيانات الشركة وصلاحياتها وسجل التدقيق.",
    service: "/services/custom-ai-agent.html",
    samples: [
      ["مقاولات", "وكيل يتابع طلبات المشاريع، يلخص التعثرات، ويطلب مستندات ناقصة من الفرق."],
      ["تعليم", "وكيل يجيب عن استفسارات المتدربين ويصعد الحالات المالية والإدارية."],
      ["خدمات", "وكيل داخلي يساعد الموظفين في السياسات والإجراءات المتكررة."]
    ],
    related: ["customer-service-automation", "opportunity-discovery-agent", "seo-ai-agent"],
    faq: [["كيف أصمم وكيل ذكاء اصطناعي لشركتي؟", "ابدأ بمهمة محددة، مصادر بيانات معروفة، وصلاحيات واضحة؛ ثم اختبر الوكيل على سيناريوهات واقعية قبل التوسع."]]
  },
  {
    slug: "competitor-analysis-agent",
    name: "وكيل تحليل المنافسين",
    type: "competitor-analysis-agent",
    schema: "competitor_analysis_demo_schema",
    sector: "الاستراتيجية والتسويق",
    audience: "فرق النمو والإدارة التجارية في السوق السعودي",
    problem: "صعوبة متابعة عروض المنافسين ورسائلهم ومخاطرهم بشكل منتظم",
    outcome: "ملخص منافسة، فجوات تموضع، مخاطر، وخطوات تسويقية",
    answer: "هذا الديمو يساعدك على تحليل منافس أو سوق خلال دقائق عبر إدخال وصف المنافسين والعروض، ثم يخرج بفجوات تموضع وفرص عملية لفريق التسويق أو المبيعات.",
    description: "جرّب وكيل تحليل المنافسين من Bright AI لاستخراج فرص التموضع والمخاطر ورسائل السوق المناسبة للشركات السعودية.",
    service: "/services/competitor-analysis-agent.html",
    samples: [
      ["متجر إلكتروني", "منافسان يركزان على السعر والشحن المجاني، بينما علامتنا تملك خدمة ما بعد البيع."],
      ["شركة خدمات", "منافس يقدم باقات أرخص لكن دون تقارير أداء أو مدير حساب."],
      ["تعليم", "منصات تدريب تقدم شهادات قصيرة ولا تبرز أثر التدريب على العمل."]
    ],
    related: ["marketing-ai-agent", "seo-ai-agent", "opportunity-discovery-agent"],
    faq: [["كيف أحلل منافساً بالذكاء الاصطناعي؟", "اكتب اسم المنافس أو وصف عرضه ورسائله وسعره، ثم راجع الفجوات والفرص دون اعتبارها بديلاً عن بحث السوق الكامل."]]
  },
  {
    slug: "seo-ai-agent",
    name: "وكيل SEO",
    type: "seo-ai-agent",
    schema: "seo_agent_demo_schema",
    sector: "السيو والظهور العضوي",
    audience: "فرق التسويق وأصحاب المواقع في السعودية",
    problem: "ضعف وضوح الصفحة لمحركات البحث ومحركات الإجابة",
    outcome: "تقييم جاهزية، مشكلات أولوية، توصيات محتوى وروابط داخلية",
    answer: "هذا الديمو يساعدك على مراجعة صفحة أو فكرة محتوى خلال دقائق عبر تحليل النية والعناوين والروابط والأسئلة الشائعة، ثم يعطيك خطوات قابلة للتنفيذ.",
    description: "جرّب وكيل SEO من Bright AI لتحليل صفحة أو خدمة وتحسين جاهزيتها للفهرسة والظهور في محركات البحث ومحركات الإجابة.",
    service: "/services/seo-ai-agent.html",
    samples: [
      ["عيادة", "صفحة خدمة زراعة الأسنان في الرياض، تحتاج عنواناً واضحاً وأسئلة شائعة وروابط داخلية."],
      ["متجر إلكتروني", "صفحة فئة عطور رجالية لا تحتوي وصفاً كافياً ولا إجابات عن الشحن والاسترجاع."],
      ["مقاولات", "صفحة خدمة ترميم مبانٍ تحتاج حالات استخدام ومناطق خدمة."]
    ],
    related: ["marketing-ai-agent", "competitor-analysis-agent", "data-analyzer"],
    faq: [["كيف أستخدم وكيل SEO؟", "أدخل رابط الصفحة أو وصفها والهدف التجاري، ثم راجع الأولويات الفنية والمحتوى المقترح دون حشو كلمات مفتاحية."]]
  },
  {
    slug: "marketing-ai-agent",
    name: "وكيل تسويق",
    type: "marketing-ai-agent",
    schema: "marketing_agent_demo_schema",
    sector: "التسويق والنمو",
    audience: "مديري التسويق والمبيعات في الشركات السعودية",
    problem: "تشتت الرسائل والقنوات وضعف الربط بين الحملة والعائد",
    outcome: "خطة حملة، قنوات مقترحة، رسائل، ومؤشرات قياس",
    answer: "هذا الديمو يساعدك على بناء تصور حملة خلال دقائق عبر إدخال المنتج والجمهور والهدف، ثم يعرض رسائل وقنوات ومؤشرات قابلة للاختبار.",
    description: "جرّب وكيل تسويق من Bright AI لبناء حملات موجهة وقياس أثرها التجاري للشركات السعودية دون مبالغة في وعود النتائج.",
    service: "/services/marketing-ai-agent.html",
    samples: [
      ["شركة خدمات", "خدمة اشتراك شهري للشركات الصغيرة، الهدف حجز عروض مباشرة من أصحاب القرار."],
      ["متجر إلكتروني", "منتج عناية موسمي، الجمهور نساء من ٢٥ إلى ٤٠، الهدف رفع متوسط السلة."],
      ["تعليم", "دورة مهنية للموظفين، الهدف جذب مديري التدريب في الجهات الخاصة."]
    ],
    related: ["marketing-automation", "seo-ai-agent", "brightsales"],
    faq: [["كيف يساعد وكيل التسويق؟", "يساعد على تحويل الهدف والجمهور إلى رسائل وقنوات ومؤشرات قياس قابلة للمراجعة والتجربة."]]
  },
  {
    slug: "opportunity-discovery-agent",
    name: "وكيل اكتشاف الفرص",
    type: "opportunity-discovery-agent",
    schema: "opportunity_agent_demo_schema",
    sector: "المبيعات والنمو",
    audience: "فرق المبيعات وتطوير الأعمال في السوق السعودي",
    problem: "ضياع فرص مبيعات محتملة بسبب ضعف التأهيل أو البحث اليدوي",
    outcome: "فرص أولية، أولويات متابعة، رسائل تواصل، ومخاطر",
    answer: "هذا الديمو يساعدك على اكتشاف عملاء أو فرص محتملة خلال دقائق عبر وصف القطاع والعميل المثالي، ثم يعطيك أولويات متابعة ورسائل تواصل مبدئية.",
    description: "جرّب وكيل اكتشاف الفرص من Bright AI لتحديد قطاعات واعدة ورسائل متابعة قابلة للتخصيص لفرق المبيعات السعودية.",
    service: "/services/lead-hunter.html",
    samples: [
      ["لوجستيات", "نبحث عن شركات تجارة إلكترونية تحتاج تحسين الشحن وخدمة العملاء في الرياض وجدة."],
      ["تعليم", "نستهدف جهات تدريبية تحتاج أتمتة التسجيل والتقارير."],
      ["مصانع", "نريد فرصاً لدى مصانع تحتاج تحليل توقفات الإنتاج والمخزون."]
    ],
    related: ["brightsales", "competitor-analysis-agent", "marketing-ai-agent"],
    faq: [["كيف أكتشف عملاء محتملين بالذكاء الاصطناعي؟", "حدد القطاع والعميل المثالي والقيمة التي تقدمها، ثم استخدم النتيجة لتجهيز قائمة بحث ورسائل تواصل بشرية المراجعة."]]
  },
  {
    slug: "marketing-automation",
    name: "نظام التسويق الذكي",
    type: "marketing-automation",
    schema: "marketing_automation_demo_schema",
    sector: "أتمتة التسويق",
    audience: "الشركات التي تحتاج متابعة العملاء المحتملين بعد الحملات",
    problem: "فقدان العملاء المحتملين بعد التسجيل وضعف المتابعة بين القنوات",
    outcome: "مسار متابعة، نقاط أتمتة، مؤشرات تحويل، وخطة ربط",
    answer: "هذا الديمو يساعدك على تحويل حملة تسويقية إلى مسار متابعة خلال دقائق عبر تحديد القنوات والرسائل ونقاط التحويل والتصعيد للمبيعات.",
    description: "جرّب نظام التسويق الذكي من Bright AI لبناء مسارات متابعة وربط الحملات بالمبيعات ومؤشرات التحويل.",
    service: "/services/marketing-automation.html",
    samples: [
      ["متجر إلكتروني", "زائر أضاف منتجاً للسلة ولم يكمل الشراء. نحتاج رسائل متابعة خلال ٤٨ ساعة."],
      ["شركة خدمات", "نموذج طلب ديمو يصل من الإعلان ويحتاج تأهيل ثم تذكير واتساب."],
      ["تعليم", "مسار تسجيل دورة يبدأ من إعلان وينتهي بدفع الرسوم."]
    ],
    related: ["marketing-ai-agent", "brightsales", "customer-service-automation"],
    faq: [["ما فائدة أتمتة التسويق؟", "تقلل التسرب بين الاهتمام والشراء عبر متابعة منظمة ومقاسة لا تعتمد على التذكير اليدوي فقط."]]
  },
  {
    slug: "supply-chain-optimization",
    name: "تحسين سلسلة التوريد",
    type: "supply-chain-optimization",
    schema: "supply_chain_demo_schema",
    sector: "اللوجستيات والمخزون",
    audience: "مديري العمليات وسلاسل الإمداد والمصانع",
    problem: "نفاد المخزون أو تراكمه بسبب ضعف توقع الطلب والربط بين المصادر",
    outcome: "مخاطر مخزون، إجراءات إعادة طلب، أثر مالي، وخطة تكامل",
    answer: "هذا الديمو يساعدك على قراءة بيانات مخزون مبسطة خلال دقائق عبر تحليل الطلب والرصيد ومدة التوريد، ثم يوضح مخاطر النفاد والتكدس وخطوات العمل.",
    description: "جرّب تحسين سلسلة التوريد من Bright AI لاكتشاف مخاطر المخزون وتوصيات إعادة الطلب وربطها بالأثر التجاري.",
    service: "/services/supply-chain-optimization.html",
    samples: [
      ["مستودع", "الصنف أ: طلب شهري ٩٠٠، مخزون ١٢٠، مدة توريد ٢١ يوم. الصنف ب: طلب ٢٠٠، مخزون ٧٠٠."],
      ["مصنع", "مادة خام تتأخر ١٠ أيام وتسبب توقف خط إنتاج مرتين شهرياً."],
      ["تجارة إلكترونية", "مبيعات موسمية عالية مع مرتجعات تؤثر على توفر المنتج."]
    ],
    related: ["data-analyzer", "operational-reports-automation", "ai-tenders-analysis"],
    faq: [["كيف يساعد الذكاء الاصطناعي في سلسلة التوريد؟", "يساعد على كشف مخاطر النفاد والتكدس مبكراً، لكنه يحتاج بيانات مبيعات ومخزون وموردين دقيقة."]]
  },
  {
    slug: "smart-medical-archive",
    name: "الأرشيف الطبي الذكي",
    type: "smart-medical-archive",
    schema: "medical_archive_demo_schema",
    sector: "الصحة",
    audience: "العيادات والمراكز الطبية وإدارات الأرشفة",
    problem: "صعوبة البحث في الملفات الطبية الورقية أو غير المنظمة",
    outcome: "حقول مستخرجة، جودة ملف، مخاطر خصوصية، وخطة ربط",
    answer: "هذا الديمو يساعدك على تنظيم وصف سجل طبي خلال دقائق عبر استخراج الحقول المهمة وتحديد النواقص والتنبيه إلى حماية البيانات، دون تقديم تشخيص طبي.",
    description: "جرّب الأرشيف الطبي الذكي من Bright AI لتنظيم السجلات واستخراج الحقول ومراجعة جاهزية الربط مع أنظمة العيادات.",
    service: "/services/medical-archive.html",
    samples: [
      ["عيادة", "تقرير متابعة سكري يتضمن قياس تراكمي وأدوية وموعد مراجعة مع نقص رقم الملف."],
      ["مركز أشعة", "تقرير تصوير يحتوي نتيجة مختصرة وتوصية مراجعة الطبيب."],
      ["طوارئ", "ملخص زيارة يتضمن أعراضاً وإجراءات وملاحظات خروج."]
    ],
    related: ["smart-hospital-management", "ocr-demo", "data-analyzer"],
    faq: [["هل يقدم الأرشيف الطبي تشخيصاً؟", "لا، الديمو ينظم المعلومات ويدعم الأرشفة والبحث ولا يستبدل الطبيب أو السجل الطبي المعتمد."]]
  },
  {
    slug: "smart-hospital-management",
    name: "إدارة المستشفى الذكية",
    type: "smart-hospital-management",
    schema: "hospital_management_demo_schema",
    sector: "تشغيل المنشآت الصحية",
    audience: "مديري المستشفيات والجودة والعمليات",
    problem: "صعوبة رؤية الاختناقات التشغيلية بين الانتظار والأسرة والجودة",
    outcome: "مؤشرات تشغيلية، مخاطر، أولويات، وأثر على تجربة المريض",
    answer: "هذا الديمو يساعدك على قراءة مؤشرات تشغيل مستشفى خلال دقائق عبر تحويل الأرقام إلى أولويات تنفيذية وتحذيرات جودة وخطة تحسين.",
    description: "جرّب إدارة المستشفى الذكية من Bright AI لتحليل مؤشرات التشغيل والانتظار والجودة وتحديد أولويات التحسين.",
    service: "/services/smart-hospital-management.html",
    samples: [
      ["طوارئ", "١٨٠ مراجع يومياً، متوسط انتظار ٧٢ دقيقة، ضغط مرتفع في وردية المساء."],
      ["تنويم", "إشغال الأسرة ٨٨٪، تأخر الخروج ٩٠ دقيقة، رضا المرضى ٧٨٪."],
      ["جودة", "ارتفاع إعادة الدخول خلال ٧ أيام في قسم محدد يحتاج مراجعة."]
    ],
    related: ["smart-medical-archive", "data-analyzer", "operational-reports-automation"],
    faq: [["كيف تستخدم إدارة المستشفى الذكية؟", "أدخل مؤشرات تشغيلية غير حساسة، ثم راجع أولويات التحسين مع فريق الجودة والعمليات قبل التطبيق."]]
  },
  {
    slug: "ocr-demo",
    name: "تجربة OCR للوثائق",
    type: "ocr-demo",
    schema: "ocr_document_demo_schema",
    sector: "الوثائق والأرشفة",
    audience: "المالية، المشتريات، والأرشفة في الشركات السعودية",
    problem: "الإدخال اليدوي للوثائق وما ينتج عنه من أخطاء وتأخير",
    outcome: "حقول مستخرجة، نواقص، قواعد تحقق، وجاهزية ربط",
    answer: "هذا الديمو يساعدك على تحويل نص مستند أو وصف فاتورة إلى حقول منظمة خلال دقائق مع إظهار النواقص وقواعد التحقق قبل الربط مع الأنظمة.",
    description: "جرّب OCR للوثائق من Bright AI لاستخراج الحقول من الفواتير والعقود والمستندات وتجهيزها للمراجعة والربط.",
    service: "/services/document-automation.html",
    samples: [
      ["فاتورة", "فاتورة ضريبية: المورد شركة النور، الإجمالي ١٨٤٠٠ ريال، الضريبة ١٥٪، رقم أمر الشراء غير مذكور."],
      ["عقد", "عقد توريد لمدة ١٢ شهراً، دفعات ربع سنوية، غرامة تأخير ٢٪."],
      ["إيصال", "إيصال دفع نقدي باسم عميل ورقم مرجعي وتاريخ غير واضح."]
    ],
    related: ["smart-medical-archive", "data-analyzer", "approvals-automation"],
    faq: [["هل يعرض الديمو JSON خام؟", "لا، النتيجة تظهر كلوحة منظمة للحقول والمخاطر والإجراءات، ويمكن تنزيل التقرير بصيغة نصية قابلة للمشاركة."]]
  },
  {
    slug: "ai-scolecs",
    name: "منصة التعليم الذكي",
    type: "ai-scolecs",
    schema: "education_demo_schema",
    sector: "التعليم والتدريب",
    audience: "المدارس والجهات التدريبية ومراكز التعليم",
    problem: "استهلاك وقت المعلم في التخطيط والتقييم والمتابعة",
    outcome: "خطة درس، أسئلة تقييم، توصيات دعم، وضوابط خصوصية",
    answer: "هذا الديمو يساعدك على توليد خطة تعليمية أولية خلال دقائق عبر إدخال المرحلة والهدف، ثم يعرض أسئلة وتوصيات دعم تحتاج اعتماد المعلم.",
    description: "جرّب منصة التعليم الذكي من Bright AI لإعداد خطط تعليمية وتقييمات وتوصيات دعم للمدارس والجهات التدريبية.",
    service: "/services/ai-scolecs.html",
    samples: [
      ["مدرسة", "ثالث متوسط، درس المعادلات الخطية، الحصة ٤٥ دقيقة، نحتاج أسئلة متدرجة."],
      ["جهة تدريبية", "دورة خدمة عملاء، المتدربون موظفون جدد، الهدف قياس التعامل مع الشكاوى."],
      ["تعليم إلكتروني", "مسار قصير في تحليل البيانات يحتاج اختبار قبلي وبعدي."]
    ],
    related: ["data-analyzer", "custom-ai-agent", "operational-reports-automation"],
    faq: [["هل يستبدل الذكاء الاصطناعي المعلم؟", "لا، الديمو يساعد في التخطيط والتقييم الأولي، وتبقى مراجعة المعلم واعتماده جزءاً أساسياً."]]
  },
  {
    slug: "brightproject",
    name: "BrightProject لإدارة المشاريع",
    type: "brightproject",
    schema: "brightproject_demo_schema",
    sector: "إدارة المشاريع",
    audience: "مديري المشاريع والمقاولات وفرق التنفيذ",
    problem: "تأخر معرفة التعثرات والمخاطر حتى تظهر في نهاية المشروع",
    outcome: "ملخص حالة، مخاطر، أولويات، وخطة متابعة",
    answer: "هذا الديمو يساعدك على تحويل وصف مشروع إلى لوحة متابعة خلال دقائق عبر تحليل الحالة والمخاطر والتوصيات التنفيذية.",
    description: "جرّب BrightProject من Bright AI لتحليل حالة المشاريع والمخاطر والتوصيات التنفيذية لفرق العمل في السعودية.",
    service: "/services/brightproject.html",
    samples: [
      ["مقاولات", "مشروع تسليم مبنى، تقدم ٦٢٪، تأخر توريد المصاعد، ضغط على الجدول."],
      ["تقنية", "إطلاق نظام داخلي خلال ٨ أسابيع مع مخاطر تكامل وموارد محدودة."],
      ["تدريب", "برنامج تدريبي لثلاث مناطق يحتاج متابعة حضور ومخرجات."]
    ],
    related: ["operational-reports-automation", "approvals-automation", "data-analyzer"],
    faq: [["كيف يساعد BrightProject؟", "يساعد على تلخيص حالة المشروع والمخاطر والإجراءات التالية، لكنه لا يغني عن متابعة مدير المشروع واعتماد الخطة."]]
  },
  {
    slug: "brightsales",
    name: "BrightSales للمبيعات الذكية",
    type: "brightsales",
    schema: "brightsales_demo_schema",
    sector: "المبيعات",
    audience: "فرق المبيعات وتطوير الأعمال",
    problem: "ضعف تأهيل العملاء المحتملين وتفاوت رسائل المتابعة",
    outcome: "درجة أولوية، اعتراضات محتملة، رسالة متابعة، وخطة إغلاق",
    answer: "هذا الديمو يساعدك على تأهيل فرصة مبيعات خلال دقائق عبر وصف العميل والاحتياج، ثم يعرض الأولوية وخطوات المتابعة.",
    description: "جرّب BrightSales من Bright AI لتأهيل العملاء المحتملين وبناء رسائل متابعة وخطة إغلاق مبيعات قابلة للمراجعة.",
    service: "/services/brightsales.html",
    samples: [
      ["شركة خدمات", "عميل طلب عرض سعر لكنه لم يحدد الميزانية ويريد تطبيقاً خلال شهر."],
      ["لوجستيات", "عميل لديه مشكلة تأخر شحن ويريد نظام متابعة آلي."],
      ["تعليم", "جهة تدريبية تسأل عن منصة تسجيل وتقارير حضور."]
    ],
    related: ["opportunity-discovery-agent", "marketing-automation", "customer-service-automation"],
    faq: [["كيف يؤهل BrightSales الفرص؟", "يراجع الاحتياج والميزانية والوقت والمخاطر ثم يقترح أولوية متابعة ورسالة مناسبة."]]
  },
  {
    slug: "ai-tenders-analysis",
    name: "تحليل المناقصات بالذكاء الاصطناعي",
    type: "ai-tenders-analysis",
    schema: "tenders_demo_schema",
    sector: "المناقصات والمشتريات",
    audience: "شركات المقاولات والخدمات والموردين",
    problem: "قراءة مستندات المناقصات يدوياً وفقدان شروط أو مخاطر مهمة",
    outcome: "ملخص متطلبات، مخاطر امتثال، درجة جاهزية، وخطوات تقديم",
    answer: "هذا الديمو يساعدك على فهم فرصة مناقصة خلال دقائق عبر إدخال ملخص الكراسة أو الشروط، ثم يعرض المتطلبات والمخاطر وخطوات القرار.",
    description: "جرّب تحليل المناقصات من Bright AI لاستخراج المتطلبات والمخاطر ودرجة الجاهزية قبل قرار التقديم.",
    service: "/services/ai-tenders-analysis.html",
    samples: [
      ["مقاولات", "مناقصة صيانة مرافق حكومية، مدة ٢٤ شهراً، ضمان ابتدائي، خبرة مطلوبة ٣ مشاريع مشابهة."],
      ["تقنية", "مشروع منصة داخلية يتطلب تكاملات أمنية وتدريب المستخدمين ودعم سنة."],
      ["توريد", "مناقصة توريد أجهزة مع جدول تسليم مرحلي وغرامات تأخير."]
    ],
    related: ["supply-chain-optimization", "brightproject", "ocr-demo"],
    faq: [["كيف أحلل مناقصة بالذكاء الاصطناعي؟", "أدخل ملخص الشروط أو بنود الكراسة غير الحساسة، ثم راجع المتطلبات والمخاطر مع فريق العطاءات قبل القرار."]]
  },
  {
    slug: "hr-automation",
    name: "أتمتة الموارد البشرية",
    type: "hr-automation",
    schema: "hr_automation_demo_schema",
    sector: "الموارد البشرية",
    audience: "فرق الموارد البشرية والشؤون الإدارية",
    problem: "تكرار إجراءات الموظفين وتأخر الموافقات والتحديثات",
    outcome: "مسار إجراء، نقاط أتمتة، مخاطر امتثال، ومؤشرات متابعة",
    answer: "هذا الديمو يساعدك على تحويل إجراء موارد بشرية إلى مسار أتمتة خلال دقائق مع تحديد الخطوات والصلاحيات ومؤشرات القياس.",
    description: "جرّب أتمتة الموارد البشرية من Bright AI لبناء مسارات ذكية للطلبات والموافقات والتقارير.",
    service: "/services/hr-automation.html",
    samples: [["إجازات", "طلب إجازة يحتاج موافقة المدير والتحقق من الرصيد وإشعار الرواتب."], ["انضمام موظف", "موظف جديد يحتاج حسابات وأجهزة وتوقيع سياسات خلال أسبوع."], ["تدريب", "ترشيح موظفين لدورة خارجية مع موافقة ميزانية."]],
    related: ["smart-hiring-system", "approvals-automation", "operational-reports-automation"],
    faq: [["ما أول إجراء مناسب للأتمتة؟", "ابدأ بإجراء متكرر وواضح القواعد مثل الإجازات أو الانضمام أو طلبات الخطابات."]]
  },
  {
    slug: "approvals-automation",
    name: "أتمتة الموافقات",
    type: "approvals-automation",
    schema: "approvals_demo_schema",
    sector: "العمليات الداخلية",
    audience: "الإدارة المالية والتشغيلية والموارد البشرية",
    problem: "تأخر الطلبات بسبب موافقات متفرقة ورسائل غير موثقة",
    outcome: "مسار موافقة، صلاحيات، شروط تصعيد، وسجل تدقيق",
    answer: "هذا الديمو يساعدك على تصميم مسار موافقة خلال دقائق عبر وصف الطلب والمستويات، ثم يعرض الصلاحيات والتصعيد وسجل التدقيق المطلوب.",
    description: "جرّب أتمتة الموافقات من Bright AI لتسريع الطلبات الداخلية مع صلاحيات وسجل تدقيق واضح.",
    service: "/services/approvals-automation.html",
    samples: [["مشتريات", "طلب شراء ٨٥ ألف ريال يحتاج مدير القسم والمالية والإدارة التنفيذية."], ["موارد بشرية", "طلب توظيف بديل يحتاج اعتماد الميزانية والمدير المباشر."], ["مشروع", "تغيير نطاق مشروع يحتاج اعتماد العميل والعمليات."]],
    related: ["hr-automation", "brightproject", "ocr-demo"],
    faq: [["هل تدعم الموافقات صلاحيات مختلفة؟", "نعم، النسخة المخصصة يمكن أن تحدد مستويات وصلاحيات وتصعيد حسب قيمة الطلب ونوعه."]]
  },
  {
    slug: "operational-reports-automation",
    name: "أتمتة التقارير التشغيلية",
    type: "operational-reports-automation",
    schema: "operational_reports_demo_schema",
    sector: "العمليات والتقارير",
    audience: "مديري العمليات والإدارات التنفيذية",
    problem: "إعداد التقارير المتكررة يدوياً وتأخر ظهور المخاطر",
    outcome: "ملخص تنفيذي، مؤشرات، مخاطر، وتوصيات أسبوعية",
    answer: "هذا الديمو يساعدك على تحويل وصف أداء أسبوعي إلى تقرير تنفيذي خلال دقائق يبرز المؤشرات والمخاطر والخطوات التالية.",
    description: "جرّب أتمتة التقارير التشغيلية من Bright AI لتلخيص الأداء والمخاطر والتوصيات للإدارة.",
    service: "/services/operational-reports-automation.html",
    samples: [["خدمات", "أسبوعياً: ١٢٠٠ طلب، التزام ٨٢٪، شكاوى ٤٥، ضغط يوم الخميس."], ["مصنع", "إنتاج ٩٢٠٠ وحدة، هدر ٣٪، توقفات ٤ ساعات."], ["لوجستيات", "تسليم في الوقت ٨٧٪ وتأخير في منطقة محددة."]],
    related: ["data-analyzer", "brightproject", "smart-hospital-management"],
    faq: [["ما مخرجات التقرير التشغيلي؟", "يعرض ملخصاً تنفيذياً ومؤشرات ومخاطر وإجراءات مقترحة قابلة للمراجعة."]]
  },
  {
    slug: "data-quality",
    name: "فحص جودة البيانات",
    type: "data-quality",
    schema: "data_quality_demo_schema",
    sector: "حوكمة البيانات",
    audience: "فرق البيانات والتحول الرقمي",
    problem: "قرارات ضعيفة بسبب بيانات ناقصة أو مكررة أو غير موحدة",
    outcome: "درجة جودة، مشاكل رئيسية، قواعد تنظيف، وخطة حوكمة",
    answer: "هذا الديمو يساعدك على فحص عينة بيانات خلال دقائق وتحديد النواقص والتكرار والتوحيد المطلوب قبل بناء لوحات أو نماذج ذكاء اصطناعي.",
    description: "جرّب فحص جودة البيانات من Bright AI لاكتشاف النواقص والتكرار ومشكلات الحوكمة قبل التحليل أو الأتمتة.",
    service: "/services/data-platform.html",
    samples: [["عملاء", "أسماء عملاء مكررة، أرقام جوال بصيغ مختلفة، بريد إلكتروني ناقص."], ["مبيعات", "طلبات بلا قناة مصدر وقيم مرتجعات غير موحدة."], ["مخزون", "وحدات قياس مختلفة للصنف نفسه بين المستودعات."]],
    related: ["data-analyzer", "operational-reports-automation", "custom-ai-agent"],
    faq: [["لماذا جودة البيانات مهمة؟", "لأن التقارير والذكاء الاصطناعي يعتمدان على دقة واكتمال واتساق البيانات المدخلة."]]
  },
  {
    slug: "social-data-analysis",
    name: "تحليل بيانات التواصل الاجتماعي",
    type: "social-data-analysis",
    schema: "social_data_demo_schema",
    sector: "التسويق والسمعة",
    audience: "فرق التسويق وخدمة العملاء",
    problem: "صعوبة فهم التفاعل والسمعة من تعليقات ورسائل كثيرة",
    outcome: "اتجاهات، مشاعر، مخاطر سمعة، وفرص محتوى",
    answer: "هذا الديمو يساعدك على تلخيص تعليقات أو منشورات خلال دقائق لاكتشاف المشاعر والموضوعات المتكررة وفرص التحسين.",
    description: "جرّب تحليل بيانات التواصل الاجتماعي من Bright AI لاستخراج الاتجاهات والمخاطر وفرص المحتوى من تعليقات الجمهور.",
    service: "/services/social-data-analysis.html",
    samples: [["متجر إلكتروني", "تعليقات تمدح سرعة الشحن وتشتكي من سياسة الاسترجاع."], ["عيادة", "مراجعات إيجابية عن الطبيب وسلبية عن الانتظار."], ["تعليم", "تفاعل مرتفع مع قصص النجاح وضعيف مع الإعلانات المباشرة."]],
    related: ["marketing-ai-agent", "customer-service-automation", "competitor-analysis-agent"],
    faq: [["هل التحليل يعطي حكماً نهائياً على السمعة؟", "لا، يعطي قراءة أولية تساعد الفريق على تحديد ما يحتاج مراجعة أو رد أو محتوى إضافي."]]
  },
  {
    slug: "ai-consulting",
    name: "استشارة ذكاء اصطناعي",
    type: "ai-consulting",
    schema: "ai_consulting_demo_schema",
    sector: "التحول الذكي",
    audience: "المدراء التنفيذيون وفرق التحول الرقمي",
    problem: "صعوبة اختيار أول حالة استخدام مناسبة للذكاء الاصطناعي",
    outcome: "أولوية حالات استخدام، مخاطر، خارطة طريق، ومؤشرات نجاح",
    answer: "هذا الديمو يساعدك على تقييم فكرة ذكاء اصطناعي خلال دقائق عبر وصف المشكلة والبيانات المتاحة، ثم يعرض أولوية التنفيذ والمخاطر.",
    description: "جرّب استشارة ذكاء اصطناعي من Bright AI لتحديد حالات الاستخدام ذات الأثر وخارطة طريق أولية للشركات السعودية.",
    service: "/services/ai-consulting.html",
    samples: [["شركة خدمات", "نريد تقليل وقت الرد وخفض التذاكر المتكررة دون التأثير على جودة الخدمة."], ["مصنع", "نريد توقع الأعطال أو الهدر لكن البيانات موزعة بين ملفات."], ["تعليم", "نريد أتمتة التسجيل والتقارير وخدمة المتدربين."]],
    related: ["custom-ai-agent", "data-analyzer", "marketing-automation"],
    faq: [["كيف أختار أول مشروع ذكاء اصطناعي؟", "ابدأ بمشكلة متكررة، بيانات متاحة، أثر قابل للقياس، ومخاطر محدودة."]]
  },
  {
    slug: "pricing",
    name: "مقدر تكلفة حلول الذكاء الاصطناعي",
    type: "pricing",
    schema: "pricing_demo_schema",
    sector: "التسعير والتخطيط",
    audience: "أصحاب القرار الذين يريدون تصور نطاق وتكلفة تقريبية",
    problem: "عدم وضوح نطاق المشروع والتكاملات قبل طلب عرض سعر",
    outcome: "نطاق أولي، عوامل تكلفة، جاهزية، وخطوات طلب عرض",
    answer: "هذا الديمو يساعدك على تقدير نطاق مشروع ذكاء اصطناعي خلال دقائق عبر تحديد القطاع والبيانات والتكاملات المطلوبة، دون تقديم سعر نهائي.",
    description: "جرّب مقدر تكلفة حلول الذكاء الاصطناعي من Bright AI لفهم عوامل النطاق والتكامل قبل طلب عرض سعر مخصص.",
    service: "/services/",
    samples: [["دعم عملاء", "شات بوت واتساب وموقع، ربط بسيط مع قاعدة معرفة، تصعيد بشري."], ["تحليل بيانات", "لوحة تنفيذية لمبيعات ومخزون من مصدرين بيانات."], ["أتمتة", "مسار موافقات مشتريات بثلاثة مستويات وصلاحيات."]],
    related: ["ai-consulting", "custom-ai-agent", "data-analyzer"],
    faq: [["هل يعطي المقدر سعراً نهائياً؟", "لا، يعطي تصوراً أولياً لعوامل النطاق، والسعر النهائي يحتاج مراجعة متطلبات وتكاملات."]]
  },
  {
    slug: "text-analysis",
    name: "تحليل النصوص بالذكاء الاصطناعي",
    type: "text-analysis",
    schema: "text_analysis_demo_schema",
    sector: "المحتوى وخدمة العملاء",
    audience: "فرق المحتوى والتسويق وخدمة العملاء",
    problem: "صعوبة تلخيص النصوص الطويلة واستخراج النبرة والمخاطر",
    outcome: "ملخص، نبرة، نقاط مهمة، ومخاطر صياغة",
    answer: "هذا الديمو يساعدك على تحليل نص عربي خلال دقائق عبر استخراج المعنى والنبرة والإجراءات المقترحة بشكل قابل للمراجعة.",
    description: "جرّب تحليل النصوص من Bright AI لتلخيص الرسائل والمحتوى واستخراج النبرة والنقاط المهمة.",
    service: "/services/ai-automation-saudi.html",
    samples: [["خدمة عملاء", "رسالة عميل طويلة تتضمن شكوى من تأخر التسليم وطلب تعويض."], ["تسويق", "مسودة حملة تحتاج تقليل المبالغة وتوضيح القيمة."], ["إدارة", "محضر اجتماع يحتاج تلخيص قرارات ومهام."]],
    related: ["customer-service-automation", "marketing-ai-agent", "operational-reports-automation"],
    faq: [["هل يمكن تحليل نصوص عربية؟", "نعم، الديمو مصمم للعربية ويمكنه التعامل مع نصوص مختلطة عند الحاجة."]]
  }
];

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attr(value) {
  return esc(value).replace(/'/g, "&#39;");
}

function slugTitle(slug) {
  return demos.find((demo) => demo.slug === slug)?.name || slug;
}

function servicePath(demo) {
  return serviceMap[demo.slug] || demo.service || `/services/${demo.slug}.html`;
}

function relatedLinks(demo) {
  return (demo.related || [])
    .filter((slug) => slug !== demo.slug)
    .slice(0, 3)
    .map((slug) => `<a href="/demo/${slug}/">${esc(slugTitle(slug))}</a>`)
    .join("");
}

function schemaGraph(demo, faqs) {
  const url = `${site}/demo/${demo.slug}/`;
  const serviceUrl = servicePath(demo).startsWith("http") ? servicePath(demo) : `${site}${servicePath(demo)}`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organization`,
        "name": "Bright AI",
        "url": `${site}/`,
        "logo": `${site}/assets/images/logo.PNG`,
        "areaServed": { "@type": "Country", "name": "Saudi Arabia" },
        "contactPoint": { "@type": "ContactPoint", "telephone": "+966538229013", "contactType": "sales", "areaServed": "SA", "availableLanguage": ["Arabic"] }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#software`,
        "name": demo.name,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": url,
        "inLanguage": "ar-SA",
        "description": demo.description,
        "provider": { "@id": `${site}/#organization` },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "SAR", "description": "تجربة عامة مجانية قبل طلب نسخة مخصصة" }
      },
      {
        "@type": "Service",
        "@id": `${serviceUrl}#service`,
        "name": demo.name,
        "serviceType": demo.sector,
        "url": serviceUrl,
        "description": demo.description,
        "provider": { "@id": `${site}/#organization` },
        "areaServed": { "@type": "Country", "name": "Saudi Arabia" },
        "mainEntityOfPage": url
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": faqs.map(([q, a]) => ({
          "@type": "Question",
          "name": q,
          "acceptedAnswer": { "@type": "Answer", "text": a }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": `${site}/` },
          { "@type": "ListItem", "position": 2, "name": "الديموهات", "item": `${site}/demo/` },
          { "@type": "ListItem", "position": 3, "name": demo.name, "item": url }
        ]
      }
    ]
  }, null, 2);
}

function fallback(demo) {
  return {
    executiveSummary: [
      `توضح التجربة أن ${demo.name} مناسب لمعالجة مشكلة ${demo.problem} عند توفر بيانات أولية واضحة.`,
      `النتيجة المتوقعة هي ${demo.outcome} مع مراجعة بشرية قبل أي قرار تشغيلي.`
    ],
    score: 82,
    keyInsights: [
      `القطاع المستهدف هو ${demo.sector} داخل السوق السعودي.`,
      "العينة كافية لإثبات الفكرة لكنها لا تمثل كل بيانات الشركة.",
      "الربط مع أنظمة الشركة يرفع دقة المؤشرات ويقلل العمل اليدوي."
    ],
    risks: [
      "لا ترفع بيانات حساسة في النسخة العامة.",
      "النتائج تقديرية وتحتاج اعتماد صاحب القرار.",
      "ضعف جودة البيانات قد يغير التوصيات."
    ],
    recommendedActions: [
      "ابدأ بعينة بيانات غير حساسة.",
      "حدد مؤشر نجاح واحد قبل التوسع.",
      "اطلب نسخة مخصصة عند الحاجة إلى ربط الأنظمة والصلاحيات."
    ],
    businessImpact: "تقليل وقت التحليل اليدوي وتحويل التجربة إلى قرار قابل للقياس حسب حجم البيانات وتكرار العملية.",
    integrationReadiness: ["جاهز لربط واجهات البرمجة", "يدعم صلاحيات الوصول", "يدعم سجل التدقيق", "قابل للتصدير كتقرير"],
    nextSteps: ["راجع التقرير مع الفريق", "حدد الأنظمة المطلوب ربطها", "احجز ديمو مباشر مع Bright AI"]
  };
}

function page(demo) {
  const faqs = [...sharedFaq.slice(0, 5), ...(demo.faq || [])].slice(0, 6);
  const url = `${site}/demo/${demo.slug}/`;
  const title = /ذكاء اصطناعي|الذكاء الاصطناعي/i.test(demo.name)
    ? `جرّب ${demo.name} | Bright AI`
    : `جرّب ${demo.name} بالذكاء الاصطناعي | Bright AI`;
  const service = servicePath(demo);
  const config = {
    slug: demo.slug,
    demoType: demo.type,
    agentType: demo.type,
    schemaName: demo.schema,
    locale: "ar-SA",
    sourcePage: `/demo/${demo.slug}/`,
    title: demo.name,
    problem: demo.problem,
    outcome: demo.outcome,
    fallbackResult: fallback(demo)
  };
  const whats = `${wa}?text=${encodeURIComponent(`السلام عليكم، أريد نسخة مخصصة من ${demo.name} عبر Bright AI`)}`;

  return `<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
  <meta charset="UTF-8">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-8LLESL207Q');
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Bright AI">
  <meta name="theme-color" content="#07111f">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(demo.description)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="ar-SA" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${url}">
  <link rel="sitemap" type="application/xml" href="${site}/sitemap.xml">
  <link rel="preconnect" href="https://www.googletagmanager.com">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Bright AI">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${attr(demo.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site}/assets/images/logo.PNG">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${attr(demo.description)}">
  <meta name="twitter:image" content="${site}/assets/images/logo.PNG">
  <link rel="icon" href="/assets/images/logo.PNG" type="image/png">
  <link rel="stylesheet" href="/assets/css/design-tokens.css">
  <link rel="stylesheet" href="/assets/css/demo-premium.css">
  <script type="application/ld+json">${schemaGraph(demo, faqs)}</script>
</head>
<body class="premium-demo" data-demo-slug="${attr(demo.slug)}">
  <a class="skip-link" href="#demo-form">تجاوز إلى التجربة</a>
  <header class="demo-nav" aria-label="تنقل الديمو">
    <a class="brand" href="/" aria-label="Bright AI الرئيسية">
      <img src="/assets/images/logo.PNG" width="36" height="36" alt="شعار Bright AI">
    </a>
    <nav class="nav-links" aria-label="روابط داخلية">
      <a href="/demo/">كل الديموهات</a>
      <a href="/services/">الخدمات</a>
      <a href="${service}">صفحة الخدمة</a>
      <a href="/contact/">تواصل معنا</a>
    </nav>
  </header>

  <main>
    <section class="hero section">
      <div class="hero-copy">
        <p class="eyebrow">تجربة ذكاء اصطناعي للسوق السعودي</p>
        <h1>${esc(demo.name)}</h1>
        <p class="direct-answer">${esc(demo.answer)}</p>
        <div class="hero-points" aria-label="قيمة الديمو">
          <span>المشكلة: ${esc(demo.problem)}</span>
          <span>النتيجة: ${esc(demo.outcome)}</span>
          <span>الفئة: ${esc(demo.audience)}</span>
        </div>
        <div class="hero-actions">
          <button class="btn btn-secondary" type="button" data-load-first-sample>استخدم مثال جاهز</button>
          <a class="btn btn-primary" href="#demo-form">ابدأ التجربة</a>
          <a class="btn btn-outline" href="${whats}" target="_blank" rel="noopener">اطلب نسخة مخصصة</a>
        </div>
      </div>
      <aside class="quick-answer" aria-label="إجابة سريعة">
        <img src="/assets/images/logo.PNG" width="96" height="96" alt="رمز Bright AI" loading="eager">
        <h2>إجابة سريعة</h2>
        <dl>
          <div><dt>لمن هذه التجربة؟</dt><dd>${esc(demo.audience)}</dd></div>
          <div><dt>ماذا تحتاج لتجربتها؟</dt><dd>وصف مختصر أو عينة بيانات غير حساسة.</dd></div>
          <div><dt>ماذا ستحصل بعد التشغيل؟</dt><dd>${esc(demo.outcome)}.</dd></div>
          <div><dt>هل يمكن تخصيصها؟</dt><dd>نعم، يمكن تخصيصها وربطها بأنظمة الشركة بعد مراجعة المتطلبات.</dd></div>
        </dl>
      </aside>
    </section>

    <section class="section quote-summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">ملخص التجربة</h2>
      <ul>
        <li>Bright AI يقدم ${esc(demo.name)} كتجربة عملية موجهة للسوق السعودي.</li>
        <li>الديمو يعالج ${esc(demo.problem)} من خلال مدخلات بسيطة وقابلة للمراجعة.</li>
        <li>المخرجات تشمل ${esc(demo.outcome)} دون عرض بيانات خام للمستخدم النهائي.</li>
        <li>النسخة العامة لا تتطلب رفع بيانات حساسة، والنسخة المخصصة تدعم الصلاحيات وسجل التدقيق.</li>
      </ul>
    </section>

    <section class="section" aria-labelledby="what-heading">
      <h2 id="what-heading">ما الذي يفعله الديمو؟</h2>
      <div class="two-col">
        <p>${esc(demo.name)} يحوّل مدخلات قصيرة من قطاع ${esc(demo.sector)} إلى تقرير تنفيذي يساعد صاحب القرار السعودي على فهم المشكلة والنتيجة والخطوة التالية. المحتوى المهم مكتوب داخل الصفحة حتى يكون قابلاً للفهرسة والاقتباس من محركات الإجابة.</p>
        <div class="trust-list" aria-label="مؤشرات ثقة">
          <span>يدعم العربية</span>
          <span>قابل للربط مع أنظمة الشركة</span>
          <span>صلاحيات وصول</span>
          <span>سجل تدقيق</span>
          <span>لا ترفع بيانات حساسة في النسخة العامة</span>
        </div>
      </div>
    </section>

    <section class="section steps" aria-labelledby="usage-heading">
      <h2 id="usage-heading">كيف تستخدم التجربة؟</h2>
      <ol>
        <li><strong>اختر السيناريو</strong><span>ابدأ بعينة سعودية جاهزة أو اكتب سياقك.</span></li>
        <li><strong>أدخل بيانات بسيطة</strong><span>استخدم وصفاً مختصراً ولا ترفع معلومات حساسة.</span></li>
        <li><strong>شغّل الذكاء الاصطناعي</strong><span>الطلب يمر عبر المسار الخلفي الآمن فقط.</span></li>
        <li><strong>شاهد التقرير واطلب النسخة المخصصة</strong><span>راجع المؤشرات ثم اختر خطوة تجارية واضحة.</span></li>
      </ol>
    </section>

    <section class="section demo-workspace" aria-labelledby="samples-heading">
      <div class="workspace-copy">
        <h2 id="samples-heading">جرّب بسيناريو جاهز</h2>
        <p>اختر مثالاً مناسباً لقطاع سعودي، أو اكتب وصفاً قصيراً. الوضع السريع ظاهر أولاً، والتفاصيل المتقدمة مخفية لتقليل الاحتكاك.</p>
        <div class="sample-grid">
          ${demo.samples.map(([label, text], index) => `<button type="button" class="sample-card" data-sample="${index}"><strong>${esc(label)}</strong><span>${esc(text)}</span></button>`).join("\n          ")}
        </div>
      </div>
      <form class="demo-form" id="demo-form" data-demo-form>
        <input type="hidden" name="demoType" value="${attr(demo.type)}">
        <label for="scenario">السيناريو</label>
        <select id="scenario" name="scenario" aria-label="اختر السيناريو">
          ${demo.samples.map(([label]) => `<option>${esc(label)}</option>`).join("")}
        </select>
        <label for="demo-input">البيانات المختصرة</label>
        <textarea id="demo-input" name="input" rows="7" required placeholder="اكتب وصفاً مختصراً أو استخدم مثالاً جاهزاً. لا تضع بيانات حساسة.">${esc(demo.samples[0][1])}</textarea>
        <details class="advanced-settings">
          <summary>الإعدادات المتقدمة</summary>
          <label for="goal">هدف القرار</label>
          <input id="goal" name="goal" value="${attr(demo.outcome)}">
          <label for="systems">الأنظمة المحتملة للربط</label>
          <input id="systems" name="systems" value="نظام داخلي، ملفات بيانات، واتساب، أو واجهة برمجة">
        </details>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">شغّل التحليل</button>
          <button class="btn btn-secondary" type="button" data-reset-demo>إعادة ضبط</button>
        </div>
        <p class="privacy-note">استخدم بيانات افتراضية أو منزوعة الحساسية في هذه النسخة العامة.</p>
      </form>
    </section>

    <section class="section result-zone" aria-labelledby="result-heading">
      <div>
        <h2 id="result-heading">ماذا ستظهر النتيجة؟</h2>
        <p>تظهر النتيجة كلوحة قرار، وليست ملفاً خاماً. عند تعذر الاتصال، تعرض الصفحة نتيجة بديلة آمنة مع زر إعادة المحاولة.</p>
        <ul class="result-promises">
          <li>ملخص تنفيذي</li>
          <li>مؤشر جاهزية</li>
          <li>رؤى رئيسية</li>
          <li>مخاطر</li>
          <li>إجراءات موصى بها</li>
          <li>أثر تجاري أو عائد متوقع</li>
          <li>جاهزية تكامل</li>
          <li>خطوات تالية ودعوة إجراء</li>
        </ul>
      </div>
      <div class="loading-box" data-loading-box hidden>
        <p>جارٍ تجهيز التقرير</p>
        <ol>
          <li data-stage="0">فهم السياق</li>
          <li data-stage="1">تحليل البيانات</li>
          <li data-stage="2">بناء المؤشرات</li>
          <li data-stage="3">توليد التوصيات</li>
          <li data-stage="4">تجهيز التقرير</li>
        </ol>
      </div>
      <div class="result-panel" data-result-panel aria-live="polite">
        <div class="empty-state">
          <strong>ابدأ التجربة لعرض التقرير.</strong>
          <p>ستظهر هنا لوحة تنفيذية قابلة للمشاركة مع روابط طلب نسخة مخصصة.</p>
        </div>
      </div>
    </section>

    <section class="section comparison" aria-labelledby="compare-heading">
      <h2 id="compare-heading">قبل Bright AI / بعد Bright AI</h2>
      <div class="compare-grid">
        <article><h3>قبل Bright AI</h3><p>العمل اليدوي يستهلك وقتاً، المخرجات غير موحدة، والقرار يعتمد على متابعة متفرقة بين الملفات والرسائل.</p></article>
        <article><h3>بعد Bright AI</h3><p>تبدأ من تجربة واضحة، تحصل على تقرير منظم، ثم تنتقل إلى نسخة مخصصة مرتبطة بالأنظمة والصلاحيات.</p></article>
      </div>
    </section>

    <section class="section use-cases" aria-labelledby="use-cases-heading">
      <h2 id="use-cases-heading">حالات استخدام منظمة</h2>
      <div class="case-grid">
        ${demo.samples.map(([label, text]) => `<article><h3>${esc(label)}</h3><p><strong>الحالة:</strong> ${esc(demo.problem)}.</p><p><strong>المدخلات:</strong> ${esc(text)}</p><p><strong>مخرجات الديمو:</strong> ${esc(demo.outcome)}.</p><p><strong>الأثر التجاري:</strong> قرار أسرع وتجربة قابلة للتخصيص.</p></article>`).join("\n        ")}
      </div>
    </section>

    <section class="section" aria-labelledby="why-heading">
      <h2 id="why-heading">لماذا Bright AI؟</h2>
      <p>Bright AI يبني تجارب ذكاء اصطناعي عربية أولاً للشركات السعودية، مع تركيز على قابلية الزحف والفهرسة، وضوح القرار، وإمكانية الربط مع الأنظمة بدل الاكتفاء بعرض تجريبي منعزل.</p>
      <div class="internal-links">
        <a href="${service}">صفحة الخدمة الرسمية</a>
        <a href="/services/">كل خدمات Bright AI</a>
        <a href="/demo/">مركز الديموهات</a>
        <a href="/contact/">تواصل معنا</a>
        <a href="${whats}" target="_blank" rel="noopener">واتساب</a>
        ${relatedLinks(demo)}
      </div>
    </section>

    <section class="section faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">الأسئلة الشائعة</h2>
      ${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </section>

    <section class="section final-cta" aria-label="خطوة تجارية">
      <h2>حوّل الديمو إلى نسخة تعمل داخل شركتك</h2>
      <p>جرّب، شاهد النتيجة، ثم اطلب نسخة مخصصة مرتبطة ببياناتك وصلاحياتك ومؤشراتك.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/contact/">احجز ديمو مباشر</a>
        <a class="btn btn-secondary" href="${whats}" target="_blank" rel="noopener">اطلب عرض سعر</a>
        <button class="btn btn-outline" type="button" data-download-report>حمّل التقرير</button>
      </div>
    </section>
  </main>

  <footer class="demo-footer">
    <p>© 2026 Bright AI. تجربة ${esc(demo.name)} مخصصة للمراجعة الأولية ولا تقدم ضمانات نتائج.</p>
    <a href="/docs/privacy-policy.html">سياسة الخصوصية</a>
  </footer>

  <script type="application/json" id="demo-config">${JSON.stringify(config)}</script>
  <script type="application/json" id="demo-samples">${JSON.stringify(demo.samples)}</script>
  <script defer src="/frontend/js/runtime-config.min.js"></script>
  <script defer src="/frontend/js/api-gateway.min.js"></script>
  <script defer src="/assets/js/demo-premium.js"></script>
</body>
</html>
`;
}

for (const demo of demos) {
  const dir = path.join(repoRoot, "demo", demo.slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, "index.html"), page(demo), "utf8");
}

console.log(`تم توليد ${demos.length} صفحة ديمو محسنة.`);
