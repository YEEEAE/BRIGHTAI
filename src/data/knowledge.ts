import { newGuides } from './knowledge-guides';

export const articles = [
  { href: '/knowledge/ai-governance-saudi/', topic: 'governance', tag: 'إطار عمل', title: 'حوكمة الذكاء الاصطناعي في السعودية', text: 'مسار عملي يبدأ بتحديد الاستخدام والمسؤوليات، ويمر بتقييم المخاطر والمعالجة، وينتهي بالمراجعة والتحسين.' },
  { href: '/knowledge/protect-company-data-chatgpt/', topic: 'privacy', tag: 'قائمة قرار', title: 'حماية بيانات المنشأة عند استخدام ChatGPT', text: 'أسئلة قصيرة تساعد الموظف على التمييز بين المعلومات العامة والداخلية والشخصية قبل إدخالها في أداة خارجية.' },
  { href: '/knowledge/ai-risk-assessment/', topic: 'safety', tag: 'مصفوفة تعليمية', title: 'تقييم مخاطر الذكاء الاصطناعي', text: 'طريقة مبسطة لتوثيق الخطر والأثر والضوابط والمالك؛ ليست تصنيفاً رسمياً أو نتيجة تقييم آلي.' },
  { href: '/knowledge/prompt-injection/', topic: 'technical', tag: 'شرح تقني', title: 'Prompt Injection وطبقات الحماية', text: 'كيف قد تحاول مدخلات غير موثوقة تغيير سلوك النموذج، وأين توضع ضوابط التحقق والمراجعة.' },
  { href: '/knowledge/ai-use-policy-employees/', topic: 'policy', tag: 'سياسة داخلية', title: 'سياسة استخدام الذكاء الاصطناعي للموظفين', text: 'خطوات لبناء سياسة مفهومة تشمل الاستخدام المسموح والمشروط والمحظور وآلية التصعيد.' },
  { href: '/knowledge/sdaia-ai-adoption-framework/', topic: 'governance', tag: 'شرح عملي', title: 'إطار تبني الذكاء الاصطناعي من سدايا', text: 'ما يعنيه إطار سدايا لمنشأتك عملياً: محاوره ومستويات النضج، وترتيب البداية للمنشآت الصغيرة والكبيرة، وخطة 90 يوماً.' },
  { href: '/knowledge/saudi-ai-ethics-principles/', topic: 'governance', tag: 'مصفوفة تعليمية', title: 'مبادئ أخلاقيات الذكاء الاصطناعي في السعودية', text: 'سبعة مبادئ بمسمياتها الرسمية، وكيف يحوّل كل مبدأ إلى سؤال ودليل ومالك، مع مستويات المخاطر وأسئلة التحقق.' },
  { href: '/knowledge/sdaia-generative-ai-guidelines/', topic: 'governance', tag: 'شرح عملي', title: 'مبادئ الذكاء الاصطناعي التوليدي من سدايا: نسختان', text: 'الفرق بين نسخة العموم ونسخة الجهات الحكومية: من تنطبق عليه كل واحدة، وأمثلة مسموح وبشروط وممنوع، وخطوات التطبيق.' },
  { href: '/knowledge/pdpl-and-ai/', topic: 'privacy', tag: 'شرح عملي', title: 'PDPL والذكاء الاصطناعي: متى يخضع إدخال البيانات؟', text: 'رحلة من الموظف إلى النموذج عبر ست نقاط فحص، وموقع منشأتك بين المتحكم والمعالج، وأساس المعالجة والموافقة والنقل خارج المملكة.' },
  { href: '/knowledge/saudi-ai-law-binding-vs-guidance/', topic: 'governance', tag: 'شرح عملي', title: 'هل في السعودية قانون للذكاء الاصطناعي؟', text: 'طبقات الالتزام الثلاث: أنظمة نافذة، ووثائق سدايا الإرشادية، ومسودات لم تصدر. جدول للوثائق وأداة لترتيب الأسئلة قبل القرار.' },
  { href: '/knowledge/sdaia-ai-ethics-self-assessment/', topic: 'safety', tag: 'مصفوفة تعليمية', title: 'أداة التقييم الذاتي لأخلاقيات الذكاء الاصطناعي من سدايا', text: 'ما تجهزه قبل الدخول: الجرد والمالكين والوثائق والقرارات، مع فحص جاهزية من عشرة أسئلة وطريقة لقراءة النتيجة ومعالجة الفجوات.' },
  { href: '/knowledge/iso-42001-saudi/', topic: 'governance', tag: 'شرح عملي', title: 'ISO/IEC 42001 للمنشآت السعودية: ما هو نظام إدارة الذكاء الاصطناعي ومتى تحتاجه؟', text: 'شرح عملي لمتطلبات AIMS وAnnex A ورحلة الشهادة، مع مقارنة ISO 27001 وNIST AI RMF وحدود الإلزام في السعودية.' },
  ...newGuides.map(guide => ({ href: `/knowledge/${guide.slug}/`, topic: guide.topic, tag: guide.tag, title: guide.title, text: guide.description })),
];
export const topics = [
  ['governance', 'حوكمة الذكاء الاصطناعي'], ['safety', 'السلامة والموثوقية'],
  ['transparency', 'الشفافية والمساءلة'], ['privacy', 'الخصوصية وحماية البيانات'],
  ['technical', 'الأدلة والإرشادات التقنية'], ['policy', 'السياسات'], ['faq', 'الأسئلة الشائعة'],
] as const;
export const products = [
  ['kernel', 'Kernel'], ['firewall', 'Firewall'], ['ledger', 'Ledger'],
  ['human-gate', 'Human Gate'], ['risk-engine', 'Risk Engine'], ['secure-chat', 'Secure Chat'],
] as const;
