export const knowledgeHubs = [
  {
    slug: 'ai-governance',
    title: 'حوكمة الذكاء الاصطناعي والرقابة البشرية',
    description: 'كيف تحدد الجهة مسؤوليات حوكمة الذكاء الاصطناعي وتوزع صلاحيات المراجعة والاعتماد وتوثق القرارات؟',
    summary: 'ابدأ بحصر استخدامات الذكاء الاصطناعي وتعيين مالك لكل استخدام. حدّد القرارات التي تحتاج اعتمادًا بشريًا، واحتفظ بمرجع الدليل الذي يوضح من اتخذ القرار ولماذا.',
    guides: [
      ['ai-governance-saudi', 'حوكمة الذكاء الاصطناعي في السعودية'],
      ['ai-governance-committee-raci', 'لجنة الحوكمة ومصفوفة المسؤوليات'],
      ['ai-use-policy-employees', 'سياسة استخدام الذكاء الاصطناعي للموظفين'],
      ['ai-audit-trail', 'سجل تدقيق الذكاء الاصطناعي'],
    ],
    products: [['human-gate', 'Human Gate'], ['ledger', 'Ledger']],
    source: ['NIST AI Risk Management Framework', 'https://www.nist.gov/itl/ai-risk-management-framework'],
  },
  {
    slug: 'ai-risk',
    title: 'مسار تقييم مخاطر الذكاء الاصطناعي',
    description: 'مسار عملي لتقييم مخاطر حالة استخدام الذكاء الاصطناعي ومراجعة الأثر والضوابط ومخاطر المورد.',
    summary: 'قيّم حالة استخدام محددة حسب غرضها وبياناتها والأطراف المتأثرة. سجّل الضرر المحتمل والضابط وصاحب القرار، ثم أعد التقييم عند تغير الغرض أو النموذج أو البيانات.',
    guides: [
      ['ai-risk-assessment', 'طريقة تقييم المخاطر'],
      ['ai-impact-assessment', 'تقييم أثر الذكاء الاصطناعي'],
      ['ai-vendor-assessment', 'تقييم مورّد الذكاء الاصطناعي'],
    ],
    products: [['risk-engine', 'Risk Engine']],
    source: ['NIST Generative AI Profile', 'https://doi.org/10.6028/NIST.AI.600-1'],
  },
  {
    slug: 'ai-data-security',
    title: 'أمان الذكاء الاصطناعي وحماية بيانات المنشأة',
    description: 'أدلة لتصنيف البيانات قبل استخدامها في مساعدات الذكاء الاصطناعي وفهم حقن التعليمات وحدود ضوابط المحادثة.',
    summary: 'حدّد فئات البيانات والوجهات المسموح بها قبل إرسال الطلب. اضبط صلاحيات الأدوات، وراجع المخرجات الحساسة، واختبر أثر الضوابط على بيانات اصطناعية قبل التفعيل.',
    guides: [
      ['data-classification-for-ai', 'تصنيف البيانات لاستخدامات الذكاء الاصطناعي'],
      ['prompt-injection', 'حقن التعليمات وطبقات الدفاع'],
      ['protect-company-data-chatgpt', 'حماية بيانات المنشأة عند استخدام مساعدات المحادثة'],
      ['pdpl-and-ai', 'حماية البيانات الشخصية واستخدامات الذكاء الاصطناعي'],
    ],
    products: [['firewall', 'Firewall'], ['secure-chat', 'Secure Chat']],
    source: ['NIST Generative AI Profile', 'https://doi.org/10.6028/NIST.AI.600-1'],
  },
] as const;

export const productGuides = {
  firewall: ['prompt-injection', 'حقن التعليمات وطبقات الدفاع'],
  'risk-engine': ['ai-risk-assessment', 'طريقة تقييم مخاطر الذكاء الاصطناعي'],
  'human-gate': ['ai-governance-committee-raci', 'لجنة الحوكمة ومصفوفة المسؤوليات'],
  ledger: ['ai-audit-trail', 'سجل تدقيق الذكاء الاصطناعي'],
  'secure-chat': ['protect-company-data-chatgpt', 'حماية بيانات المنشأة عند استخدام مساعدات المحادثة'],
} as const;

export const hubPath = (slug: string) => `/docs/topics/${slug}/`;
export const guidePath = (slug: string) => `/knowledge/${slug}/`;
