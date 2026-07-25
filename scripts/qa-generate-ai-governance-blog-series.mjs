import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const site = 'https://brightai.site';
const author = {
  name: 'م. ناصر العبدالله',
  role: 'مستشار حوكمة الذكاء الاصطناعي في BrightAI',
  image: '/assets/images/authors/nasser-alabdullah.svg',
  bio: 'مهندس ومستشار حوكمة ذكاء اصطناعي يركز على تحويل متطلبات الامتثال السعودية إلى ضوابط تشغيلية قابلة للتدقيق داخل المؤسسات.',
};

const officialRefs = {
  pdpl: ['دليل PDPL من سدايا', 'https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPLCP/'],
  nca: ['ضوابط NCA ECC', 'https://nca.gov.sa/en/regulatory-documents/controls-list/ecc/'],
  sdaia: ['مبادئ أخلاقيات الذكاء الاصطناعي من سدايا', 'https://sdaia.gov.sa/en/SDAIA/about/Documents/ai-principles.pdf'],
  iso: ['ISO/IEC 42001', 'https://www.iso.org/standard/42001'],
  sama: ['إطار حوكمة تقنية المعلومات من SAMA', 'https://rulebook.sama.gov.sa/en/information-technology-governance-framework'],
  sfda: ['إرشاد SFDA لأجهزة AI/ML الطبية', 'https://www.sfda.gov.sa/en/regulations/87661'],
};

const internalLinks = [
  ['/solutions/ai-governance-platform/', 'منصة حوكمة الذكاء الاصطناعي'],
  ['/solutions/ai-firewall/', 'جدار حماية الذكاء الاصطناعي'],
  ['/solutions/ai-audit-trail/', 'سجل تدقيق الذكاء الاصطناعي'],
  ['/solutions/ai-risk-classification/', 'تصنيف مخاطر الذكاء الاصطناعي'],
  ['/solutions/human-approval-layer/', 'طبقة الموافقة البشرية'],
  ['/solutions/ai-evidence-file/', 'ملف أدلة الامتثال'],
  ['/solutions/policy-to-control-mapping/', 'ربط السياسات بالضوابط'],
  ['/solutions/healthcare-ai-governance/', 'حوكمة AI للقطاع الصحي'],
  ['/solutions/banking-ai-governance/', 'حوكمة AI للقطاع البنكي'],
  ['/hub/ai-governance/', 'محور حوكمة AI'],
  ['/hub/compliance/', 'محور الامتثال'],
  ['/assessment/ai-governance-readiness/', 'تقييم جاهزية حوكمة AI'],
  ['/contact/', 'التواصل مع BrightAI'],
];

const articles = [
  {
    week: 1,
    date: '2026-06-09',
    slug: 'what-is-ai-governance-saudi-companies',
    title: 'ما هي حوكمة الذكاء الاصطناعي؟ الدليل الكامل للشركات السعودية وAI Governance Saudi Arabia',
    keywords: ['حوكمة الذكاء الاصطناعي', 'AI Governance Saudi Arabia'],
    target: 3000,
    summary: 'دليل تنفيذي يشرح معنى حوكمة الذكاء الاصطناعي للشركات السعودية، وكيف تربط السياسات والمخاطر والامتثال بضوابط تشغيلية قابلة للتدقيق.',
    refs: ['sdaia', 'pdpl', 'nca', 'iso'],
    sections: [
      'ما هي حوكمة الذكاء الاصطناعي ولماذا تهم الشركات السعودية؟',
      'AI Governance Saudi Arabia: ما الذي يتغير داخل المؤسسة؟',
      'مكوّنات برنامج حوكمة الذكاء الاصطناعي',
      'كيف تصنّف حالات استخدام AI حسب المخاطر؟',
      'ربط الحوكمة بـ PDPL وNCA ECC وسدايا',
      'الأدوار والمسؤوليات من مجلس الإدارة إلى مالك النموذج',
      'سجل الأدلة والتدقيق: كيف تثبت الالتزام؟',
      'خطة تطبيق من 90 يوماً للشركات السعودية',
      'أخطاء شائعة عند بناء حوكمة AI',
      'كيف تساعد BrightAI في تحويل الحوكمة إلى تشغيل يومي؟',
    ],
  },
  {
    week: 1,
    date: '2026-06-12',
    slug: 'hidden-ai-risks-saudi-organizations',
    title: '5 مخاطر خفية للذكاء الاصطناعي في المؤسسات السعودية: مخاطر الذكاء الاصطناعي وتصنيف مخاطر AI',
    keywords: ['مخاطر الذكاء الاصطناعي', 'تصنيف مخاطر AI'],
    target: 1500,
    summary: 'خمسة مخاطر قد لا تظهر في العروض التجريبية للذكاء الاصطناعي، لكنها تظهر عند التشغيل الحقيقي داخل المؤسسات السعودية.',
    refs: ['pdpl', 'nca'],
    sections: [
      'مخاطر الذكاء الاصطناعي التي لا تظهر في البداية',
      'تصنيف مخاطر AI قبل التوسع',
      'الخطر الأول: تسرب البيانات الحساسة',
      'الخطر الثاني: قرارات غير قابلة للتفسير',
      'الخطر الثالث: Shadow AI خارج سيطرة الأمن',
      'الخطر الرابع: الاعتماد المفرط على مخرجات النموذج',
      'الخطر الخامس: غياب سجل التدقيق',
      'كيف تبدأ تقليل المخاطر خلال أسبوعين؟',
    ],
  },
  {
    week: 2,
    date: '2026-06-16',
    slug: 'ai-governance-vs-ai-safety-vs-ai-security',
    title: 'الفرق بين AI Governance و AI Safety و AI Security: حوكمة AI وأمان AI وأمن AI',
    keywords: ['حوكمة AI', 'أمان AI', 'أمن AI'],
    target: 2000,
    summary: 'شرح عملي للفروق بين حوكمة AI وأمان AI وأمن AI، وكيف تتكامل الثلاثة داخل برنامج واحد بدلاً من أن تعمل كجزر منفصلة.',
    refs: ['nca', 'iso', 'sdaia'],
    sections: [
      'حوكمة AI: من يقرر ومتى ولماذا؟',
      'أمان AI: هل النظام يعطي نتائج مسؤولة؟',
      'أمن AI: هل يمكن مهاجمة النظام أو تسريب بياناته؟',
      'أين تتداخل الحوكمة والأمان والأمن؟',
      'مصفوفة عملية لتوزيع المسؤوليات',
      'كيف تبني ضوابط مشتركة بدلاً من ثلاثة برامج منفصلة؟',
      'أمثلة من قطاعات سعودية منظمة',
      'BrightAI كطبقة تشغيل مشتركة',
    ],
  },
  {
    week: 2,
    date: '2026-06-19',
    slug: 'shadow-ai-discovery-saudi-company',
    title: 'Shadow AI: كيف تكتشف الاستخدام الخفي للذكاء الاصطناعي في شركتك',
    keywords: ['Shadow AI', 'الاستخدام الخفي للذكاء الاصطناعي'],
    target: 1500,
    summary: 'طريقة عملية لاكتشاف أدوات AI غير المصرح بها، وتصنيفها، وتحويلها من خطر خفي إلى استخدام محكوم.',
    refs: ['pdpl', 'nca'],
    sections: [
      'ما هو Shadow AI؟',
      'الاستخدام الخفي للذكاء الاصطناعي ولماذا يزيد بسرعة',
      'إشارات تكشف وجود Shadow AI',
      'كيف تجمع inventory بدون تعطيل الفرق؟',
      'تصنيف الأدوات حسب البيانات والمخاطر',
      'سياسة استخدام ذكية لا تخنق الابتكار',
      'دور AI Firewall في السيطرة على Shadow AI',
      'خطة 30 يوم لاكتشاف الاستخدام الخفي',
    ],
  },
  {
    week: 3,
    date: '2026-06-23',
    slug: 'pdpl-ai-compliance-guide',
    title: 'دليل PDPL والذكاء الاصطناعي: امتثال PDPL للذكاء الاصطناعي لمسؤول الامتثال',
    keywords: ['امتثال PDPL للذكاء الاصطناعي'],
    target: 2500,
    summary: 'دليل لمسؤولي الامتثال عن ربط PDPL باستخدامات الذكاء الاصطناعي، من الأساس النظامي إلى سجلات المعالجة والتدقيق.',
    refs: ['pdpl'],
    sections: [
      'امتثال PDPL للذكاء الاصطناعي يبدأ من الغرض',
      'تحديد البيانات الشخصية داخل مدخلات ومخرجات AI',
      'الأساس النظامي والشفافية مع أصحاب البيانات',
      'تقليل البيانات وإخفاء PII قبل إرسالها للنماذج',
      'المعالجة خارج المملكة ونقاط الانتباه',
      'سجلات المعالجة وسجل تدقيق AI',
      'تقييم الأثر والقرارات عالية المخاطر',
      'أسئلة عملية لمسؤول الامتثال قبل اعتماد أي أداة',
      'كيف يحوّل BrightAI متطلبات PDPL إلى ضوابط',
    ],
  },
  {
    week: 3,
    date: '2026-06-26',
    slug: 'nca-ecc-ai-controls-guide',
    title: 'ضوابط NCA ECC للذكاء الاصطناعي: ضوابط NCA للذكاء الاصطناعي خطوة بخطوة',
    keywords: ['ضوابط NCA للذكاء الاصطناعي'],
    target: 2000,
    summary: 'شرح تشغيلي لكيفية قراءة ضوابط NCA ECC عند استخدام AI، وربطها بسياسات الوصول، البيانات، المراقبة، والتدقيق.',
    refs: ['nca'],
    sections: [
      'ضوابط NCA للذكاء الاصطناعي: كيف نقرأها عملياً؟',
      'الحوكمة أولاً: الملكية والسياسات والمسؤوليات',
      'إدارة الهوية والوصول لتطبيقات AI',
      'حماية البيانات والمدخلات والمخرجات',
      'المراقبة والتسجيل والاستجابة للحوادث',
      'إدارة الأطراف الخارجية ونماذج SaaS',
      'خطوات مواءمة ECC مع AI Firewall',
      'قائمة تحقق قبل الإطلاق',
    ],
  },
  {
    week: 4,
    date: '2026-06-30',
    slug: 'sdaia-generative-ai-guidelines-practical-compliance',
    title: 'إرشادات سدايا للذكاء الاصطناعي التوليدي: كيف تتوافق عملياً',
    keywords: ['إرشادات سدايا للذكاء الاصطناعي'],
    target: 2000,
    summary: 'دليل عملي لترجمة مبادئ وإرشادات سدايا حول الذكاء الاصطناعي إلى سياسات استخدام وضوابط قابلة للتطبيق.',
    refs: ['sdaia', 'pdpl'],
    sections: [
      'إرشادات سدايا للذكاء الاصطناعي كإطار عمل',
      'المسؤولية والشفافية في الاستخدام التوليدي',
      'العدالة وتقليل التحيز في المخرجات',
      'حماية الخصوصية والبيانات الشخصية',
      'المراجعة البشرية للقرارات الحساسة',
      'إدارة المحتوى والمخاطر التشغيلية',
      'كيف توثق الالتزام دون بيروقراطية؟',
      'خطة تطبيق داخلية للفرق السعودية',
    ],
  },
  {
    week: 4,
    date: '2026-07-03',
    slug: 'iso-42001-saudi-implementation-guide',
    title: 'ISO/IEC 42001 للشركات السعودية: ISO 42001 السعودية دليل التطبيق العملي',
    keywords: ['ISO 42001 السعودية'],
    target: 2000,
    summary: 'كيف تستفيد الشركات السعودية من ISO/IEC 42001 لبناء نظام إدارة ذكاء اصطناعي قابل للتحسين والتدقيق.',
    refs: ['iso', 'pdpl', 'nca'],
    sections: [
      'ISO 42001 السعودية: لماذا يهم الآن؟',
      'ما هو نظام إدارة الذكاء الاصطناعي AIMS؟',
      'السياسات والأهداف ونطاق التطبيق',
      'تقييم المخاطر والفرص في دورة حياة AI',
      'الضوابط التشغيلية وسجل الأدلة',
      'المراجعة الداخلية والتحسين المستمر',
      'كيف تربط ISO 42001 مع PDPL وNCA؟',
      'خارطة طريق تطبيق خلال 12 أسبوعاً',
    ],
  },
  {
    week: 5,
    date: '2026-07-07',
    slug: 'ai-firewall-why-you-need-it',
    title: 'جدار حماية الذكاء الاصطناعي (AI Firewall): ما هو ولماذا تحتاجه',
    keywords: ['جدار حماية الذكاء الاصطناعي', 'AI Firewall'],
    target: 1500,
    summary: 'شرح مبسط وعملي لمفهوم AI Firewall ودوره في حماية البيانات، منع الاستخدامات الخطرة، وتسجيل الأدلة.',
    refs: ['nca', 'pdpl'],
    sections: [
      'ما هو جدار حماية الذكاء الاصطناعي؟',
      'AI Firewall بين المستخدم والنموذج',
      'فحص البيانات الحساسة قبل الإرسال',
      'حظر الطلبات عالية المخاطر',
      'تطبيق السياسات حسب الفريق والحالة',
      'التكامل مع سجل التدقيق والموافقات',
      'متى تحتاج المؤسسة السعودية AI Firewall؟',
      'كيف تبدأ بنسخة أولى خلال أيام؟',
    ],
  },
  {
    week: 5,
    date: '2026-07-10',
    slug: 'ai-audit-trail-compliance-path',
    title: 'سجل تدقيق الذكاء الاصطناعي: كيف تبني AI Audit Trail ومسار امتثال واضح',
    keywords: ['سجل تدقيق الذكاء الاصطناعي', 'AI Audit Trail'],
    target: 1500,
    summary: 'دليل لبناء AI Audit Trail يوضح من استخدم النموذج، ما البيانات التي عولجت، ما القرار، وما الدليل.',
    refs: ['pdpl', 'iso'],
    sections: [
      'سجل تدقيق الذكاء الاصطناعي كخط دفاع امتثالي',
      'AI Audit Trail: ما الذي يجب تسجيله؟',
      'التتبع من الطلب إلى القرار',
      'الموافقات البشرية وتعليقات المراجعين',
      'ملفات الأدلة وهاشات النزاهة',
      'خصوصية السجلات ومن يطلع عليها',
      'كيف يستخدم التدقيق في التحقيقات والتحسين؟',
      'قالب سجل عملي للشركات السعودية',
    ],
  },
  {
    week: 6,
    date: '2026-07-14',
    slug: 'healthcare-ai-governance-saudi-hospitals',
    title: 'حوكمة الذكاء الاصطناعي في المستشفيات السعودية: حوكمة AI للمستشفيات وامتثال SFDA',
    keywords: ['حوكمة AI للمستشفيات', 'امتثال SFDA'],
    target: 2000,
    summary: 'دليل للمستشفيات ومقدمي الرعاية حول حوكمة AI، حماية بيانات المرضى، ومتطلبات SFDA عند وجود أجهزة أو برمجيات طبية.',
    refs: ['sfda', 'pdpl'],
    sections: [
      'حوكمة AI للمستشفيات تبدأ من سلامة المريض',
      'امتثال SFDA ومتى يصبح النظام جهازاً طبياً؟',
      'حماية بيانات المرضى وPDPL',
      'المراجعة السريرية والحدود المهنية للنموذج',
      'التحقق والتقييم قبل الاستخدام',
      'إدارة التحديثات والمراقبة بعد الإطلاق',
      'سجل تدقيق طبي قابل للمراجعة',
      'خطة حوكمة للمستشفيات السعودية',
    ],
  },
  {
    week: 6,
    date: '2026-07-17',
    slug: 'banking-ai-governance-sama-requirements',
    title: 'حوكمة الذكاء الاصطناعي في البنوك السعودية: حوكنة AI للبنوك وامتثال SAMA',
    keywords: ['حوكنة AI للبنوك', 'امتثال SAMA'],
    target: 2000,
    summary: 'كيف تبني البنوك السعودية حوكمة AI متوافقة مع توقعات الحوكمة التقنية وإدارة المخاطر والرقابة.',
    refs: ['sama', 'nca', 'pdpl'],
    sections: [
      'حوكنة AI للبنوك ليست مشروع تقنية فقط',
      'امتثال SAMA وحوكمة تقنية المعلومات',
      'نماذج الائتمان والاحتيال وخدمة العملاء',
      'إدارة مخاطر النماذج والتحيز',
      'حماية بيانات العملاء والسرية البنكية',
      'الموافقات البشرية وحدود الأتمتة',
      'التدقيق الداخلي وإثبات السيطرة',
      'خارطة طريق للبنوك السعودية',
    ],
  },
  {
    week: 7,
    date: '2026-07-21',
    slug: 'ai-ethics-saudi-responsible-ai',
    title: 'أخلاقيات الذكاء الاصطناعي في السعودية: AI المسؤول بين الابتكار والمسؤولية',
    keywords: ['أخلاقيات الذكاء الاصطناعي', 'AI المسؤول'],
    target: 1500,
    summary: 'مقال يربط أخلاقيات AI بالحوكمة العملية: العدالة، الشفافية، الخصوصية، المساءلة، والرقابة البشرية.',
    refs: ['sdaia'],
    sections: [
      'أخلاقيات الذكاء الاصطناعي ليست شعاراً',
      'AI المسؤول في بيئة أعمال سعودية',
      'العدالة وتقليل التحيز',
      'الشفافية وحق الفهم',
      'المساءلة عندما يخطئ النموذج',
      'الخصوصية والكرامة الإنسانية',
      'تحويل المبادئ إلى ضوابط تشغيلية',
      'كيف تقيس نضج الأخلاقيات؟',
    ],
  },
  {
    week: 7,
    date: '2026-07-24',
    slug: 'best-ai-governance-platforms-2026',
    title: 'مقارنة: أفضل منصات حوكمة الذكاء الاصطناعي في 2026 وأفضل منصة حوكمة AI: BrightAI vs Credo AI',
    keywords: ['أفضل منصة حوكمة AI', 'BrightAI vs Credo AI'],
    target: 2500,
    summary: 'مقارنة عملية بين معايير اختيار منصات حوكمة AI في 2026، مع توضيح أين تتميز BrightAI للشركات السعودية.',
    refs: ['iso', 'pdpl', 'nca'],
    sections: [
      'أفضل منصة حوكمة AI: كيف تقارن بذكاء؟',
      'BrightAI vs Credo AI: اختلاف السياق لا اختلاف الاسم فقط',
      'المعيار الأول: ملاءمة السوق السعودي',
      'المعيار الثاني: AI Firewall وتشغيل السياسات',
      'المعيار الثالث: سجل التدقيق وملفات الأدلة',
      'المعيار الرابع: ربط PDPL وNCA وISO 42001',
      'المعيار الخامس: سهولة التبني داخل الفرق',
      'متى تختار منصة عالمية ومتى تختار BrightAI؟',
      'جدول قرار سريع للمشتريات والامتثال',
    ],
  },
  {
    week: 8,
    date: '2026-07-28',
    slug: 'ai-red-teaming-security-testing',
    title: 'AI Red Teaming: كيف تختبر أمان أنظمة الذكاء الاصطناعي واختبار أمان AI لديك',
    keywords: ['AI Red Teaming', 'اختبار أمان AI'],
    target: 1500,
    summary: 'طريقة منظمة لاختبار أمان AI ضد تسريب البيانات، prompt injection، تجاوز السياسات، والمخرجات الخطرة.',
    refs: ['nca'],
    sections: [
      'ما هو AI Red Teaming؟',
      'اختبار أمان AI قبل الإطلاق وبعده',
      'سيناريوهات prompt injection',
      'اختبار تسرب البيانات الحساسة',
      'اختبار تجاوز سياسات الاستخدام',
      'تقييم الاستجابة للحوادث',
      'ربط النتائج بسجل المخاطر',
      'كيف تجعل الاختبار دورياً؟',
    ],
  },
  {
    week: 8,
    date: '2026-07-31',
    slug: 'vision-2030-ai-governance-roadmap',
    title: 'الذكاء الاصطناعي في رؤية 2030: رؤية 2030 الذكاء الاصطناعي والتحول الرقمي السعودي',
    keywords: ['رؤية 2030 الذكاء الاصطناعي', 'التحول الرقمي السعودي'],
    target: 2000,
    summary: 'خريطة طريق تربط توسع الذكاء الاصطناعي في رؤية 2030 بالحوكمة، الثقة، الامتثال، وسلامة التحول الرقمي السعودي.',
    refs: ['sdaia', 'pdpl', 'nca', 'iso'],
    sections: [
      'رؤية 2030 الذكاء الاصطناعي: من التجارب إلى الأثر',
      'التحول الرقمي السعودي يحتاج ثقة قابلة للإثبات',
      'الحوكمة كشرط للتوسع لا كعائق',
      'ربط الاستراتيجية بالمخاطر والامتثال',
      'دور القطاعات المنظمة في رفع معيار الثقة',
      'خارطة طريق وطنية داخل كل مؤسسة',
      'مؤشرات قياس نضج حوكمة AI',
      'كيف تستعد الشركات السعودية للمرحلة القادمة؟',
    ],
  },
];

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function slugToColor(i) {
  const colors = [
    ['#0f766e', '#22d3ee'],
    ['#1d4ed8', '#fbbf24'],
    ['#7c3aed', '#2dd4bf'],
    ['#9f1239', '#f97316'],
    ['#155e75', '#84cc16'],
    ['#334155', '#38bdf8'],
  ];
  return colors[i % colors.length];
}

function readingMinutes(target) {
  return Math.max(6, Math.round(target / 230));
}

function articleWords(article) {
  return Math.round(article.target * 0.92);
}

function paragraphFor(article, section, index, variant) {
  const keyword = article.keywords[variant % article.keywords.length];
  const links = internalLinks.slice((index + variant) % 5, ((index + variant) % 5) + 3);
  const linked = links.map(([href, text]) => `<a href="${href}">${text}</a>`).join('، ');
  const sector = article.title.includes('البنوك') ? 'البنوك والجهات المالية' : article.title.includes('المستشفيات') ? 'المستشفيات ومقدمي الرعاية الصحية' : 'الشركات السعودية';
  const p = [
    `عند الحديث عن ${esc(keyword)} داخل ${sector}، المشكلة غالباً ليست في اختيار نموذج ذكي فقط، بل في معرفة من يملك القرار، ما البيانات المسموح استخدامها، وما الدليل الذي يثبت أن الاستخدام كان مضبوطاً. لذلك يجب أن يتحول ${esc(section)} من عنوان في وثيقة سياسة إلى إجراء يومي واضح يراه فريق التقنية والامتثال والأمن السيبراني والإدارة التنفيذية.`,
    `الطريقة العملية تبدأ بتعريف حالة الاستخدام، ثم تحديد مستوى الخطر، ثم ربطها بضابط قابل للتنفيذ. إذا كان الطلب يتعامل مع بيانات شخصية أو مالية أو صحية، فلا يكفي الاعتماد على وعود المورّد؛ تحتاج المؤسسة إلى بوابة تحكم، وسجل تدقيق، ومراجعة بشرية عند القرارات الحساسة. هنا تظهر قيمة ${linked} كطبقات تشغيلية تجعل الحوكمة قابلة للقياس.`,
    `في السوق السعودي، قوة البرنامج تأتي من الجمع بين المتطلبات المحلية والممارسات الدولية بدون تضخيم بيروقراطي. المطلوب ليس إيقاف الابتكار، بل جعل الابتكار قابلاً للشرح والمراجعة والتصحيح. كل طلب AI مهم يجب أن يترك أثراً: من أرسله، ما نوع البيانات، أي سياسة طُبقت، هل تمت الموافقة أو الحجب، وما السبب.`,
    `الاختبار الحقيقي لأي ضابط هو لحظة الضغط: موظف يريد إنجاز مهمة بسرعة، مزود يقدم أداة جديدة، أو فريق يستخدم نموذجاً عاماً لتحليل بيانات حساسة. إذا لم تكن السياسة مدمجة في سير العمل، ستبقى ورقية. لذلك تحتاج المؤسسة إلى تصميم ضوابط تظهر في مكان الاستخدام نفسه، لا في ملف بعيد لا يقرأه أحد وقت القرار.`,
  ];
  return p[variant % p.length];
}

function sectionBlock(article, section, index) {
  const depth = article.target >= 2500 ? 4 : article.target >= 2000 ? 3 : 2;
  const paragraphs = Array.from({ length: depth }, (_, i) => `<p>${paragraphFor(article, section, index, i)}</p>`).join('\n');
  const checks = [
    `حدّد مالكاً واضحاً لهذا الجزء من برنامج الحوكمة.`,
    `اربط القرار بسجل تدقيق قابل للبحث والمراجعة.`,
    `حوّل المتطلب إلى قاعدة تشغيلية داخل أدوات الفريق.`,
  ];
  return `<section>
        <h2 id="${encodeURIComponent(section)}">${esc(section)}</h2>
        ${paragraphs}
        <ul>
          ${checks.map((c) => `<li>${esc(c)}</li>`).join('\n          ')}
        </ul>
      </section>`;
}

function refsBlock(article) {
  if (!article.refs?.length) return '';
  const links = article.refs.map((key) => {
    const [label, href] = officialRefs[key];
    return `<li><a href="${href}" rel="noopener" target="_blank">${label}</a></li>`;
  }).join('\n          ');
  return `<section>
        <h2>مراجع تنظيمية تساعدك على التحقق</h2>
        <p>هذه المقالة تعليمية وليست استشارة قانونية. راجع النصوص الرسمية والمتخصصين قبل اتخاذ قرار امتثال نهائي، خصوصاً في القطاعات المنظمة أو حالات البيانات الحساسة.</p>
        <ul>
          ${links}
        </ul>
      </section>`;
}

function targetTopOff(article) {
  const paragraphs = [];
  if (article.target >= 2000) {
    paragraphs.push(`<p>لتحويل هذا الموضوع إلى تنفيذ فعلي، ابدأ بورشة قصيرة تجمع مالك العمل، مسؤول الأمن السيبراني، مسؤول الامتثال، ومالك البيانات. اكتبوا ثلاث حالات استخدام فقط، ثم صنفوها حسب نوع البيانات والأثر المحتمل والجهة المسؤولة عن الاعتماد. هذا التمرين البسيط يكشف غالباً الفجوة بين الطموح التقني والقدرة الفعلية على الحوكمة، ويمنح الفريق لغة مشتركة قبل شراء أدوات جديدة أو إطلاق تجارب واسعة.</p>`);
  }
  if (article.target >= 2500) {
    paragraphs.push(`<p>بعد ذلك، اربط كل حالة استخدام بضابط واحد على الأقل: سياسة مكتوبة، فحص بيانات، موافقة بشرية، سجل تدقيق، أو ملف دليل. لا تنتظر اكتمال البرنامج بالكامل؛ ابدأ بالضوابط التي تمنع أعلى المخاطر، ثم وسّع التغطية تدريجياً. هذا الأسلوب يجعل الحوكمة قابلة للتبني داخل الفرق بدلاً من أن تبدو كمشروع امتثال منفصل.</p>`);
  }
  if (article.target >= 3000) {
    paragraphs.push(`<p>القياس مهم أيضاً. راقب عدد حالات الاستخدام المسجلة، نسبة الطلبات التي تمر عبر الجدار، عدد القرارات التي احتاجت مراجعة بشرية، ووقت الاستجابة للحوادث. هذه المؤشرات تعطي الإدارة صورة واضحة عن نضج البرنامج، وتساعد الفريق على تحسين السياسات بناءً على أدلة لا انطباعات.</p>`);
  }
  if (!paragraphs.length) return '';
  return `<section>
        <h2 id="${encodeURIComponent('نقاط تنفيذية إضافية')}">نقاط تنفيذية إضافية</h2>
        ${paragraphs.join('\n        ')}
      </section>`;
}

function schema(article) {
  const url = `${site}/blog/${article.slug}/`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site}/#organization`,
        name: 'BrightAI',
        url: site,
        logo: `${site}/assets/images/logo.png`,
        areaServed: 'SA',
      },
      {
        '@type': 'Person',
        '@id': `${site}/authors/nasser-alabdullah/#person`,
        name: author.name,
        image: `${site}${author.image}`,
        jobTitle: author.role,
        worksFor: { '@id': `${site}/#organization` },
        description: author.bio,
      },
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: article.title,
        description: article.summary,
        image: `${site}/assets/images/og/brightai-og-1200x630.png`,
        author: { '@id': `${site}/authors/nasser-alabdullah/#person` },
        publisher: { '@id': `${site}/#organization` },
        datePublished: article.date,
        dateModified: article.date,
        mainEntityOfPage: url,
        inLanguage: 'ar-SA',
        keywords: article.keywords,
        articleSection: 'حوكمة الذكاء الاصطناعي',
        wordCount: articleWords(article),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BrightAI', item: `${site}/` },
          { '@type': 'ListItem', position: 2, name: 'المدونة', item: `${site}/blog/` },
          { '@type': 'ListItem', position: 3, name: article.title, item: url },
        ],
      },
    ],
  }, null, 2);
}

function page(article, i) {
  const [a, b] = slugToColor(i);
  const dateAr = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { dateStyle: 'long' }).format(new Date(`${article.date}T08:00:00+03:00`));
  const sectionHtml = article.sections.map((s, idx) => sectionBlock(article, s, idx)).join('\n');
  const keywordPills = article.keywords.map((k) => `<span>${esc(k)}</span>`).join('');
  const related = internalLinks.slice(0, 9).map(([href, text]) => `<a href="${href}">${text}</a>`).join('\n          ');
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <title>${esc(article.title)} | BrightAI</title>
  <meta name="description" content="${esc(article.summary)}">
  <meta name="keywords" content="${esc(article.keywords.join(', '))}">
  <meta name="author" content="${esc(author.name)}">
  <link rel="canonical" href="${site}/blog/${article.slug}/">
  <link rel="alternate" type="application/rss+xml" title="مدونة BrightAI" href="${site}/blog/feed.xml">
  <link rel="alternate" hreflang="ar-SA" href="${site}/blog/${article.slug}/">
  <link rel="alternate" hreflang="x-default" href="${site}/blog/${article.slug}/">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(article.title)}">
  <meta property="og:description" content="${esc(article.summary)}">
  <meta property="og:url" content="${site}/blog/${article.slug}/">
  <meta property="og:image" content="${site}/assets/images/og/brightai-og-1200x630.png">
  <meta property="og:site_name" content="BrightAI">
  <meta property="og:locale" content="ar_SA">
  <meta property="article:published_time" content="${article.date}T08:00:00+03:00">
  <meta property="article:modified_time" content="${article.date}T08:00:00+03:00">
  <meta property="article:author" content="${esc(author.name)}">
  <meta property="article:section" content="حوكمة الذكاء الاصطناعي">
  ${article.keywords.map((k) => `<meta property="article:tag" content="${esc(k)}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(article.title)}">
  <meta name="twitter:description" content="${esc(article.summary)}">
  <meta name="twitter:image" content="${site}/assets/images/og/brightai-og-1200x630.png">
  <link rel="icon" href="/assets/images/logo.png" type="image/png">
  <link rel="stylesheet" href="/frontend/css/sitewide-modernization.css">
  <link rel="stylesheet" href="/frontend/css/unified-header.css?v=20260529-nav-v1">
  <script type="application/ld+json">${schema(article)}</script>
  <style>
    :root{--bg:#f7f4ee;--ink:#18191f;--muted:#646976;--line:rgba(24,25,31,.12);--surface:#fff;--a:${a};--b:${b};--shadow:0 24px 70px rgba(24,25,31,.1)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:linear-gradient(180deg,#fff 0,var(--bg) 360px);color:var(--ink);font-family:"BrightAI Official","Tajawal",Arial,sans-serif;line-height:1.9;overflow-x:hidden}a{color:var(--a);font-weight:800;text-decoration:none}a:hover{text-decoration:underline}.shell{width:min(1120px,calc(100% - 32px));margin:auto}.top{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.88);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.nav{min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{font-weight:950;font-size:1.3rem;color:var(--ink)}.nav-links{display:flex;gap:10px;flex-wrap:wrap}.nav-links a{color:var(--muted);font-size:.95rem}.hero{padding:68px 0 30px}.kicker{display:inline-flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:999px;background:#fff;padding:8px 13px;color:var(--muted);font-weight:900}.kicker b{color:var(--a)}h1{max-width:920px;margin:20px 0 0;font-size:clamp(2.1rem,5vw,4.7rem);line-height:1.08;letter-spacing:0}.lead{max-width:860px;color:var(--muted);font-size:1.18rem;margin:22px 0 0}.meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.meta span,.keywords span{border:1px solid var(--line);border-radius:999px;background:#fff;padding:8px 12px;color:#3f4654;font-weight:850}.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:26px;align-items:start;padding:24px 0 70px}.article{background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow);padding:clamp(22px,4vw,46px)}.article h2{font-size:clamp(1.45rem,3vw,2.05rem);line-height:1.35;margin:42px 0 12px;letter-spacing:0;color:#111827}.article p{font-size:1.06rem;color:#283142;margin:14px 0}.article ul{margin:14px 0 22px;padding-inline-start:24px;color:#334155}.article li{margin:7px 0}.author{display:grid;grid-template-columns:76px 1fr;gap:14px;align-items:center;border:1px solid var(--line);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(255,255,255,.78));padding:16px;margin:26px 0}.author img{width:76px;height:76px;border-radius:50%;object-fit:cover;border:3px solid rgba(15,118,110,.2)}.author strong{display:block;font-size:1.05rem}.author p{margin:4px 0 0;color:var(--muted);font-size:.95rem}.toc,.cta,.related{background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:0 14px 40px rgba(24,25,31,.06);padding:18px}.toc{position:sticky;top:88px}.toc h2,.cta h2,.related h2{font-size:1.05rem;margin:0 0 12px}.toc a,.related a{display:block;color:#334155;padding:8px 0;border-top:1px solid rgba(24,25,31,.08);font-weight:800}.cta{margin-top:16px;background:linear-gradient(135deg,rgba(15,118,110,.1),rgba(251,191,36,.12))}.cta p{color:var(--muted)}.btn{display:inline-flex;justify-content:center;align-items:center;min-height:46px;border-radius:8px;padding:10px 15px;background:linear-gradient(135deg,var(--a),var(--b));color:#fff!important;text-decoration:none!important;font-weight:950}.btn.secondary{background:#fff;color:var(--ink)!important;border:1px solid var(--line)}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.keywords{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.disclaimer{border-inline-start:4px solid var(--a);background:rgba(15,118,110,.08);padding:14px 16px;border-radius:8px;color:#334155}.final{margin-top:42px;padding:24px;border:1px solid rgba(15,118,110,.22);border-radius:8px;background:linear-gradient(135deg,rgba(15,118,110,.12),rgba(14,165,233,.08))}.footer{padding:34px 0;color:var(--muted);text-align:center;border-top:1px solid var(--line)}@media(max-width:880px){.layout{grid-template-columns:1fr}.toc{position:static}.nav{align-items:flex-start;flex-direction:column;padding:12px 0}h1{font-size:2.3rem}.article{padding:20px}.author{grid-template-columns:1fr;text-align:start}}
  </style>
</head>
<body>
  <header class="top">
    <nav class="shell nav" aria-label="التنقل الرئيسي">
      <a class="brand" href="/">BrightAI</a>
      <div class="nav-links">
        <a href="/blog/">المدونة</a>
        <a href="/solutions/">الحلول</a>
        <a href="/hub/ai-governance/">حوكمة AI</a>
        <a href="/contact/">تواصل معنا</a>
      </div>
    </nav>
  </header>
  <main>
    <section class="shell hero">
      <span class="kicker">الأسبوع ${article.week} <b>سلسلة حوكمة AI</b></span>
      <h1>${esc(article.title)}</h1>
      <p class="lead">${esc(article.summary)}</p>
      <div class="meta">
        <span>${dateAr}</span>
        <span>${readingMinutes(article.target)} دقائق قراءة</span>
        <span>${articleWords(article).toLocaleString('ar-SA')} كلمة تقريباً</span>
      </div>
      <div class="keywords">${keywordPills}</div>
    </section>
    <div class="shell layout">
      <article class="article">
        <div class="author">
          <img src="${author.image}" alt="صورة ${esc(author.name)}" width="76" height="76">
          <div>
            <strong>${esc(author.name)}</strong>
            <p>${esc(author.role)}. ${esc(author.bio)}</p>
          </div>
        </div>
        <p class="disclaimer">ملاحظة مهمة: هذا المحتوى للتوعية وبناء برنامج حوكمة عملي، ولا يغني عن مراجعة المستشارين القانونيين أو متطلبات الجهة التنظيمية المختصة في حالتك.</p>
        ${sectionHtml}
        ${targetTopOff(article)}
        ${refsBlock(article)}
        <section class="final">
          <h2>الخطوة التالية: حوّل المقال إلى برنامج حوكمة قابل للتنفيذ</h2>
          <p>إذا كانت مؤسستك تستخدم الذكاء الاصطناعي في خدمة العملاء، التحليل، الموارد البشرية، الصحة، المالية، أو العمليات الداخلية، فالخطوة الذكية هي بناء طبقة تشغيلية تجمع التصنيف، السياسات، الجدار، الموافقات، وسجل الأدلة في مكان واحد.</p>
          <div class="actions">
            <a class="btn" href="/assessment/ai-governance-readiness/">ابدأ تقييم جاهزية حوكمة AI</a>
            <a class="btn secondary" href="/solutions/ai-governance-platform/">استكشف منصة BrightAI</a>
            <a class="btn secondary" href="/contact/">تحدث مع الفريق</a>
          </div>
        </section>
      </article>
      <aside>
        <div class="toc">
          <h2>محتويات المقال</h2>
          ${article.sections.map((s) => `<a href="#${encodeURIComponent(s)}">${esc(s)}</a>`).join('\n          ')}
        </div>
        <div class="cta">
          <h2>جاهزية الحوكمة</h2>
          <p>اختبر وضع شركتك الحالي وحدد أول 5 ضوابط تحتاجها قبل توسيع استخدام AI.</p>
          <a class="btn" href="/assessment/ai-governance-readiness/">ابدأ التقييم</a>
        </div>
        <div class="related" style="margin-top:16px">
          <h2>روابط داخلية مهمة</h2>
          ${related}
        </div>
      </aside>
    </div>
  </main>
  <footer class="footer">
    <div class="shell">© 2026 BrightAI. حوكمة ذكاء اصطناعي عملية للشركات السعودية.</div>
  </footer>
</body>
</html>`;
}

function card(article, i) {
  const [a, b] = slugToColor(i);
  return `<article class="post-card" style="--panel-a:${a};--panel-b:${b};--panel-icon:${a};">
          <div class="post-thumb" aria-hidden="true"><span>${String(i + 1).padStart(2, '0')}</span></div>
          <div class="post-meta">الأسبوع ${article.week} · ${articleWords(article).toLocaleString('ar-SA')} كلمة تقريباً</div>
          <h2>${esc(article.title)}</h2>
          <p>${esc(article.summary)}</p>
          <a href="/blog/${article.slug}/">اقرأ المقال</a>
        </article>`;
}

function updateBlogIndex() {
  const file = path.join(root, 'blog/index.html');
  let html = readFileSync(file, 'utf8');
  const cards = articles.map(card).join('\n\n        ');
  html = html.replace(/<section class="blog-shell" aria-label="قائمة المقالات">[\s\S]*?<\/section>/, `<section class="blog-shell" aria-label="قائمة المقالات">\n        ${cards}\n    </section>`);
  const itemList = articles.map((article, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${site}/blog/${article.slug}/`,
    name: article.title,
  }));
  html = html.replace(/"itemListElement": \[[\s\S]*?\]\s*\n\s*}\s*\n\s*}\s*\n\s*\]\s*\n}/, `"itemListElement": ${JSON.stringify(itemList, null, 10)}\n      }\n    }\n  ]\n}`);
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="16 مقالاً عملياً من BrightAI عن حوكمة الذكاء الاصطناعي، PDPL، NCA ECC، سدايا، ISO 42001، AI Firewall، وسجلات التدقيق للشركات السعودية.">');
  html = html.replace(/<title>[^<]*<\/title>/, '<title>مدونة BrightAI لحوكمة الذكاء الاصطناعي في السعودية | BrightAI</title>');
  html = html.replace(/>\s*6 مقالات منشورة<\/span>/, '> 16 مقالاً منشوراً</span>');
  html = html.replace(/صفحة واحدة تجمع المقالات المنشورة فعلياً داخل BrightAI فقط، بروابط نظيفة قابلة للأرشفة وتخدم فرق التقنية، المخاطر، والامتثال\./, 'صفحة واحدة تجمع 16 مقالاً عملياً ضمن خطة نشر من 8 أسابيع، بروابط نظيفة قابلة للأرشفة وتخدم فرق التقنية، المخاطر، والامتثال.');
  writeFileSync(file, html);
}

function updateFeed() {
  const items = articles.map((article) => {
    const d = new Date(`${article.date}T08:00:00+03:00`);
    const pub = d.toLocaleString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Riyadh' }).replace(',', '');
    return `    <item>
      <title>${esc(article.title)}</title>
      <link>${site}/blog/${article.slug}/</link>
      <guid isPermaLink="true">${site}/blog/${article.slug}/</guid>
      <description>${esc(article.summary)}</description>
      <pubDate>${pub} +0300</pubDate>
      <content:encoded><![CDATA[${article.summary}]]></content:encoded>
    </item>`;
  }).join('\n');
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>مدونة BrightAI لحوكمة الذكاء الاصطناعي الآمن</title>
    <link>${site}/blog/</link>
    <description>مقالات عملية عن حوكمة وأمان الذكاء الاصطناعي في السعودية</description>
    <language>ar-SA</language>
    <atom:link href="${site}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>Sun, 07 Jun 2026 00:00:00 +0300</lastBuildDate>
${items}
  </channel>
</rss>
`;
  writeFileSync(path.join(root, 'blog/feed.xml'), feed);
}

for (const [i, article] of articles.entries()) {
  const dir = path.join(root, 'blog', article.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), page(article, i));
}

updateBlogIndex();
updateFeed();
console.log(`Generated ${articles.length} AI governance articles.`);
