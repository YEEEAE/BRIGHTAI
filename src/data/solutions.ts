/**
 * solutions.ts — Single source of truth for all solution metadata
 */
import {
  content_ai_firewall,
  content_ai_audit_trail,
  content_ai_evidence_file,
  content_human_approval_layer,
  content_continuous_ai_governance,
  content_ai_risk_classification,
  content_ai_use_case_discovery,
  content_policy_to_control_mapping,
  regulationsBySectorSlug,
  faqsBySectorSlug,
} from './solutions-content-generated';

export interface SolutionData {
  slug: string;
  href: string;
  title: string;
  h1: string;
  description: string;
  canonical: string;
  icon: string;
  chip: string;
  shortDesc: string;
  whenNeeded: string;
  cardTitle?: string;
  whenLabel?: string;
  related: string[];
  docs?: string[];
  blog?: string[];
  kernel?: string[];
  content?: {
    lead: string[];
    sections: {
      title: string;
      intro?: string;
      paragraphs?: string[];
      cards?: { title: string; subtitle?: string; text?: string; items?: string[] }[];
    }[];
    faqs?: { question: string; answer: string }[];
    finalTitle: string;
    finalText: string;
  };
}

export interface SectorData {
  slug: string;
  href: string;
  title: string;
  h1: string;
  description: string;
  canonical: string;
  icon: string;
  chip: string;
  shortDesc: string;
  whenNeeded: string;
  related: string[];
  locals?: LocalData[];
  docs?: string[];
  blog?: string[];
  regulations?: { abbr: string; name: string; scope: string }[];
  faqs?: { question: string; answer: string }[];
}

export interface LocalData {
  slug: string;
  href: string;
  title: string;
  h1: string;
  description: string;
  canonical: string;
  cityAr: string;
  cityEn: string;
  areaServed: string;
  geoLat: number;
  geoLng: number;
  parentSlug: string;
  parentHref: string;
}

const S = 'https://brightai.site';

export const solutions: SolutionData[] = [
  {
    slug:'ai-governance-platform', href:'/solutions/ai-governance-platform/',
    title:'منصة حوكمة الذكاء الاصطناعي للشركات السعودية',
    h1:'منصة حوكمة الذكاء الاصطناعي للمؤسسات السعودية',
    description:'منصة BrightAI لحوكمة الذكاء الاصطناعي تمنح المؤسسات رؤية مركزية على استخدام AI، متوافقة مع نظام حماية البيانات الشخصية PDPL وضوابط الأمن السيبراني NCA.',
    canonical:`${S}/solutions/ai-governance-platform/`,
    icon:'mdi:scale-balance', chip:'المنصة الأم',
    shortDesc:'المنصة الشاملة اللي تجمع كل الحلول. رؤية مركزية لكل استخدامات AI، السياسات، والمخاطر.',
    whenNeeded:'لو عندك أكثر من ٢ حالة استخدام AI.',
    related:['ai-firewall','ai-audit-trail','human-approval-layer','ai-evidence-file'],
    docs:['/docs/ai-governance-platform/'], blog:['/blog/ai-governance/','/blog/what-is-ai-governance-saudi-companies/','/blog/best-ai-governance-platforms-2026/'], kernel:['/kernel/'],
    content: {
      lead: [
        'منصة حوكمة الذكاء الاصطناعي من BrightAI هي البنية التحتية المركزية لإدارة استخدام AI داخل المؤسسات السعودية. تساعدك على رصد كل أداة AI ومستخدم وقرار في مكان واحد، وتطبيق سياسات الاستخدام تلقائياً، مع التوافق الكامل مع PDPL وNCA ECC وISO/IEC 42001.',
        'نساعد مؤسستك تستخدم الذكاء الاصطناعي بدون ما تفقد السيطرة على البيانات. المنصة توفر رؤية مركزية على كل استخدام AI، تصنيف مخاطر تلقائي، سياسات واضحة، وسجلات مراجعة قابلة للتدقيق.',
        'حوكمة الذكاء الاصطناعي هنا مو وثيقة PDF؛ هي طبقة تشغيل يومية تربط الموظف بالنموذج بالبيانات بالموافقة البشرية.',
      ],
      sections: [
        {
          title: 'كيف تعمل منصة برايت آي كـ نظام أمان AI للشركات رائد في السوق السعودي؟',
          intro: 'إذا كانت أي من هذه السيناريوهات تصف واقع مؤسستك، فأنت في المكان الصحيح.',
          cards: [
            { title: 'لا رؤية مركزية', text: 'لا تعرف كم عدد الأدوات AI التي يستخدمها موظفوك ولا ما البيانات التي يشاركونها معها.' },
            { title: 'بيانات حساسة خارج السيطرة', text: 'الموظفون يرسلون عقوداً وبيانات عملاء وتقارير مالية إلى نماذج AI خارجية دون علمك.' },
            { title: 'غياب سجل التدقيق', text: 'لو سألك المدقق: من استخدم AI في قرار كذا ومتى؟ — لن تجد إجابة موثّقة.' },
            { title: 'سياسات بدون تطبيق فعلي', text: 'لديك سياسة لاستخدام AI لكنها على الورق فقط. لا يوجد آلية تطبيق تقنية فعلية.' },
            { title: 'تدقيق PDPL قادم', text: 'مؤسستك ستخضع لتدقيق PDPL أو NCA ECC وتحتاج دليلاً موثّقاً على امتثال استخدام AI.' },
            { title: 'توسع استخدام AI السريع', text: 'مؤسستك تتبنى AI بسرعة وتحتاج إطار حوكمة ينمو معها دون عرقلة الإنتاجية.' },
          ],
        },
        {
          title: 'رصد وتحليل الاستخدامات العشوائية وحجب تسريب البيانات الحساسة فورياً',
          intro: 'منصة BrightAI مصممة خصيصاً لهؤلاء القادة في المؤسسات السعودية',
          cards: [
            { title: 'CISOs', subtitle: 'مسؤولو أمن المعلومات', text: 'يحتاجون رؤية كاملة لكل نقطة تعرّض للبيانات عبر أدوات AI، وآلية تطبيق سياسات الأمن تقنياً لا يدوياً.' },
            { title: 'CDOs', subtitle: 'مسؤولو البيانات', text: 'يحتاجون خريطة كاملة لتدفق البيانات داخل وخارج نماذج AI، وضمان عدم مغادرة البيانات الحساسة حدود المؤسسة.' },
            { title: 'مسؤولو الامتثال', subtitle: 'Compliance Officers', text: 'يحتاجون تقارير امتثال جاهزة للتدقيق، وسجل تدقيق قابل للفحص يُثبت الالتزام بـ PDPL وNCA ECC وISO/IEC 42001.' },
          ],
          paragraphs: ['القطاعات المستهدفة: البنوك والمؤسسات المالية · المستشفيات والرعاية الصحية · الجهات الحكومية · شركات الطاقة والصناعة · شركات SaaS والتقنية'],
        },
        {
          title: 'ضمان الامتثال لضوابط الهيئات التنظيمية الوطنية بفضل أدوات حوكمة الذكاء الاصطناعي السعودية',
          intro: 'أربع مراحل تحوّل مؤسستك من استخدام AI عشوائي إلى حوكمة كاملة وامتثال موثّق',
          cards: [
            { title: 'رصد نقاط استخدام AI في المؤسسة', text: 'BrightAI تتصل بجميع أدوات AI المستخدمة في مؤسستك — سواء كانت رسمية أو Shadow AI — وترصد كل استخدام في الوقت الفعلي. تعطيك لوحة تحكم مركزية ترى من خلالها كل شيء.' },
            { title: 'تصنيف الاستخدامات حسب درجة المخاطر', text: 'كل استخدام AI يُحلَّل ويُصنَّف تلقائياً: ما نوع البيانات المشاركة؟ ما نوع القرار؟ ما نطاق التأثير؟ النتيجة: Risk Score من 0-100 لكل استخدام.' },
            { title: 'تطبيق السياسات تلقائياً', text: 'بناءً على درجة المخاطر، BrightAI تطبّق السياسة المناسبة تلقائياً: السماح، المنع، التحويل لموافقة بشرية، أو التسجيل فقط — بدون تدخل يدوي.' },
            { title: 'توليد تقارير الامتثال', text: 'عند الطلب أو بشكل دوري، BrightAI تولّد تقارير امتثال جاهزة لـ PDPL وNCA ECC وISO/IEC 42001 — مع Evidence File كامل لكل استخدام.' },
          ],
        },
        {
          title: 'جاهز ترى كيف تعمل المنصة في بيئتك؟',
          paragraphs: ['اطلب ديمو تنفيذي مخصص لمؤسستك. فريقنا يشرح كيف تتكامل المنصة مع أنظمتك الحالية وما ROI المتوقع.'],
        },
        {
          title: 'تكامل مرن مع البنى التحتية وأنظمة العمليات دون إبطاء إنتاجية الموظفين',
          intro: 'نظرة شاملة على القدرات الأربع الأساسية للمنصة',
          cards: [
            { title: 'ما الذي يكشفه BrightAI' },
            { title: 'ما الذي يتحكم فيه BrightAI' },
            { title: 'ما الذي يسجله BrightAI' },
            { title: 'ما الأدلة التي ينتجها BrightAI' },
          ],
        },
        {
          title: 'تقارير أداء ومخاطر تفصيلية تدعم اتخاذ القرارات وحماية الخصوصية الرقمية لمؤسستك',
          intro: 'كل قطاع له متطلباته الخاصة. BrightAI تتكيف مع طبيعة عملك ومتطلبات امتثالك.',
          cards: [
            { title: 'البنوك والمالية', text: 'حوكمة AI في نماذج الائتمان، كشف الاحتيال، خدمة العملاء. الامتثال مع متطلبات SAMA وFATF إلى جانب PDPL.' },
            { title: 'الرعاية الصحية', text: 'حماية بيانات المرضى (PHI) عند استخدام AI في التشخيص أو الجدولة. الامتثال مع SFDA وISO 13485.' },
            { title: 'الجهات الحكومية', text: 'ضمان استخدام AI في الخدمات الحكومية وفق السياسات الوطنية وNCA ECC مع توثيق كامل لكل قرار.' },
            { title: 'الطاقة والصناعة', text: 'حوكمة AI في العمليات الصناعية الحيوية، صيانة الأصول التنبؤية، وجدولة الإنتاج مع تدقيق كامل.' },
            { title: 'التعليم', text: 'ضبط استخدام AI في التقييم والمحتوى التعليمي مع حماية بيانات الطلاب وفق PDPL.' },
            { title: 'شركات التقنية والـ SaaS', text: 'حوكمة AI في تطوير البرمجيات واستخدام Copilot ونماذج LLM مع حماية الملكية الفكرية وبيانات العملاء.' },
          ],
        },
      ],
      faqs: [
        { question: 'ما الفرق بين BrightAI ونماذج AI التجارية مثل ChatGPT وCopilot؟', answer: 'BrightAI طبقة وسيطة (Middleware Layer) لا تستبدل نماذج الذكاء الاصطناعي التجارية، بل تتحكم في كيفية استخدامها داخل مؤسستك. تراقب الاستخدام، تطبق سياساتك، وتسجّل كل قرار في Immutable Audit Log. موظفوك يستمرون باستخدام الأدوات التي يحبونها، لكن تحت رقابة ومع حماية كاملة.' },
        { question: 'هل منصة BrightAI متوافقة مع نظام PDPL السعودي؟', answer: 'نعم، المنصة مصممة خصيصاً للامتثال مع نظام حماية البيانات الشخصية السعودي (PDPL) ومتطلبات الأمن السيبراني الوطنية (NCA ECC)، بالإضافة إلى ISO/IEC 42001 لحوكمة الذكاء الاصطناعي. نُصدر تقارير امتثال جاهزة للتدقيق في أي وقت.' },
        { question: 'كم يستغرق تطبيق المنصة في مؤسستي؟', answer: 'يستغرق التطبيق الأولي من أسبوعين إلى أربعة أسابيع، يشمل: التقييم الأولي لبيئة AI في مؤسستك، التكامل مع الأنظمة الحالية، تهيئة السياسات حسب احتياجاتك، والتدريب على الاستخدام. فريقنا يرافقك في كل خطوة.' },
        { question: 'هل تعمل المنصة مع أنظمة ERP الحالية في مؤسستي؟', answer: 'نعم، منصة BrightAI تتكامل مع SAP وOracle وMicrosoft 365 وغيرها من أنظمة ERP الشائعة في المؤسسات السعودية. كما تدعم التكامل عبر API مع أي نظام آخر. لا تحتاج لتغيير بنيتك التحتية الحالية.' },
        { question: 'من يحتاج حقاً إلى منصة حوكمة الذكاء الاصطناعي؟', answer: 'أي مؤسسة تُوظّف أكثر من 50 موظفاً وتستخدم الذكاء الاصطناعي في عمليات حيوية — خاصةً إذا كانت تتعامل مع بيانات العملاء أو بيانات الموظفين أو البيانات المالية أو الصحية. كلما زادت درجة الحساسية، زادت الحاجة للحوكمة.' },
        { question: 'هل تبقى بياناتنا داخل المملكة العربية السعودية؟', answer: 'نعم. BrightAI شركة سعودية 100% ومقرها الرياض. يمكن نشر المنصة داخل بيئتك التحتية المحلية (On-Premise) أو على سحابة في نطاق المملكة، مما يضمن عدم مغادرة بياناتك الحساسة للحدود السعودية.' },
      ],
      finalTitle: 'حوكمة AI مؤسستك تبدأ بمكالمة واحدة',
      finalText: 'فريق BrightAI جاهز لفهم بيئة AI في مؤسستك وتصميم مسار حوكمة تشغيلي مناسب بدون ادعاءات قانونية قاطعة.',
    },
  },
  {
    slug:'ai-firewall', href:'/solutions/ai-firewall/',
    title:'AI Firewall: حماية بيانات الشركات من التسريب',
    h1:'AI Firewall لحماية البيانات الحساسة قبل وصولها للنماذج',
    description:'جدار حماية الذكاء الاصطناعي (AI Firewall) يفحص مدخلات ومخرجات LLM ويمنع تسريب البيانات الحساسة للمؤسسات السعودية متوافقاً مع ضوابط الأمن السيبراني NCA.',
    canonical:`${S}/solutions/ai-firewall/`,
    icon:'mdi:shield-half-full', chip:'حماية البيانات',
    shortDesc:'يفحص كل طلب AI ويخفي البيانات الشخصية والحساسة قبل وصولها للنموذج. حماية في الزمن الفعلي.',
    whenNeeded:'من اليوم الأول لاستخدام AI.',
    related:['ai-audit-trail','ai-risk-classification','human-approval-layer'],
    docs:['/docs/ai-firewall/'], blog:['/blog/ai-firewall-why-you-need-it/','/blog/chatgpt-pdpl-data-compliance/','/blog/nca-cybersecurity-requirements-saudi/'], kernel:['/kernel/chat/'],
    content: content_ai_firewall,
  },
  {
    slug:'ai-audit-trail', href:'/solutions/ai-audit-trail/',
    title:'سجل تدقيق الذكاء الاصطناعي (AI Audit Trail) | امتثال NCA و PDPL',
    h1:'سجل تدقيق الذكاء الاصطناعي (AI Audit Trail)',
    description:'سجل تدقيق مشفر وغير قابل للتعديل لكافة عمليات الذكاء الاصطناعي داخل المؤسسة. يوثق طلبات وردود نماذج الذكاء الاصطناعي لضمان الامتثال التام للجهات التنظيمية.',
    canonical:`${S}/solutions/ai-audit-trail/`,
    icon:'mdi:file-sign', chip:'التوثيق',
    shortDesc:'سجل تدقيق غير قابل للتعديل (Append-only) محمي بـ SHA-256. كل طلب وقرار محفوظ مدى الحياة.',
    whenNeeded:'لو شركتك تحت NCA أو SFDA.',
    related:['ai-firewall','human-approval-layer','ai-evidence-file'],
    docs:['/docs/ai-audit-trail/'], blog:['/blog/ai-audit-trail-saudi/','/blog/ai-audit-trail-compliance-path/','/docs/ai-audit-trail/'], kernel:['/kernel/audit/'],
    content: content_ai_audit_trail,
  },
  {
    slug:'ai-evidence-file', href:'/solutions/ai-evidence-file/',
    title:'ملف أدلة امتثال الذكاء الاصطناعي (AI Evidence File)',
    h1:'ملف أدلة الامتثال للذكاء الاصطناعي (AI Evidence File)',
    description:'توليد ملفات أدلة الامتثال والتقارير الموقعة رقمياً لتقديمها للمدققين والجهات التنظيمية السعودية مثل سدايا (SDAIA) وهيئة الأمن السيبراني (NCA).',
    canonical:`${S}/solutions/ai-evidence-file/`,
    icon:'mdi:folder-open', chip:'الإثبات',
    shortDesc:'ملف PDF موقّع رقمياً يجمع كل البيانات والقرارات والموافقات. جاهز للمدقق أو الجهة التنظيمية.',
    whenNeeded:'قبل أي تدقيق خارجي.',
    related:['ai-audit-trail','human-approval-layer','continuous-ai-governance'],
    docs:['/docs/ai-evidence-file/'], blog:['/blog/ai-audit-trail-compliance-path/','/docs/ai-evidence-file/','/blog/banking-ai-governance-sama-requirements/'], kernel:['/kernel/evidence/'],
    content: content_ai_evidence_file,
  },
  {
    slug:'human-approval-layer', href:'/solutions/human-approval-layer/',
    title:'طبقة الموافقات البشرية لقرارات الذكاء الاصطناعي | BrightAI',
    h1:'طبقة الموافقات البشرية لقرارات الذكاء الاصطناعي',
    description:'أضف مسارات موافقة بشرية للقرارات عالية المخاطر قبل تنفيذ مخرجات الذكاء الاصطناعي داخل المؤسسة.',
    canonical:`${S}/solutions/human-approval-layer/`,
    icon:'mdi:account-check', chip:'السيطرة',
    shortDesc:'القرارات الحساسة تتوقف لين يراجعها شخص مخوّل. إشعارات فورية، توقيع رقمي، تفويض ذكي.',
    whenNeeded:'لما AI يأثر على قرارات مالية أو طبية.',
    cardTitle:'طبقة الموافقة البشرية',
    whenLabel:'متى تحتاجها؟',
    related:['ai-risk-classification','ai-firewall','ai-audit-trail'],
    docs:['/docs/human-approval-layer/'], blog:['/docs/human-approval-layer/','/blog/healthcare-ai-governance-saudi-hospitals/','/blog/banking-ai-governance-sama-requirements/'], kernel:['/kernel/approvals/'],
    content: content_human_approval_layer,
  },
  {
    slug:'continuous-ai-governance', href:'/solutions/continuous-ai-governance/',
    title:'حوكمة مستمرة للذكاء الاصطناعي في المنشآت | BrightAI',
    h1:'الحوكمة المستمرة للذكاء الاصطناعي',
    description:'حوكمة AI مو مشروع لمرة. حل BrightAI للمراقبة المستمرة وتحديث السياسات تلقائياً مع تغير الأنظمة والضوابط.',
    canonical:`${S}/solutions/continuous-ai-governance/`,
    icon:'mdi:refresh', chip:'الاستمرارية',
    shortDesc:'حوكمة AI مو مشروع لمرة. هذا الحل يراقب ويحدّث ويعدّل السياسات تلقائياً مع تغير الأنظمة.',
    whenNeeded:'بعد ما تطبق الحوكمة الأساسية.',
    related:['ai-governance-platform','policy-to-control-mapping','ai-risk-classification'],
    docs:['/docs/ai-governance-platform/'], blog:['/blog/pdpl-penalties-saudi-fines/','/blog/saudi-ai-landscape-sdaia-humain-allam-scai/','/blog/rpa-automation-saudi-savings/'], kernel:['/kernel/compliance/'],
    content: content_continuous_ai_governance,
  },
  {
    slug:'ai-risk-classification', href:'/solutions/ai-risk-classification/',
    title:'تصنيف مخاطر الذكاء الاصطناعي | AI Risk Classification | BrightAI',
    h1:'تصنيف وتقييم مخاطر الذكاء الاصطناعي',
    description:'يصنّف كل استخدام AI حسب مستوى الخطر: عالي، متوسط، منخفض. ويحدد متى يحتاج موافقة بشرية ومتى يمر تلقائياً.',
    canonical:`${S}/solutions/ai-risk-classification/`,
    icon:'mdi:alert-triangle', chip:'تصنيف المخاطر',
    shortDesc:'يصنّف كل استخدام AI: عالي، متوسط، منخفض. ويحدد متى يحتاج موافقة بشرية ومتى يمر تلقائياً.',
    whenNeeded:'لما يكثر عدد استخدامات AI.',
    cardTitle:'تصنيف مخاطر AI',
    related:['human-approval-layer','ai-use-case-discovery','continuous-ai-governance'],
    docs:['/docs/ai-risk-management/'], blog:['/docs/ai-risk-management/','/blog/hidden-ai-risks-saudi-organizations/','/blog/shadow-ai-discovery-saudi-company/'], kernel:['/kernel/policies/'],
    content: content_ai_risk_classification,
  },
  {
    slug:'ai-use-case-discovery', href:'/solutions/ai-use-case-discovery/',
    title:'اكتشاف استخدامات الذكاء الاصطناعي الخفية | Shadow AI | BrightAI',
    h1:'اكتشاف استخدامات الذكاء الاصطناعي (Shadow AI Discovery)',
    description:'يكتشف الاستخدامات الخفية للذكاء الاصطناعي داخل شركتك (Shadow AI) ويعطيك خريطة كاملة لكل استخدام.',
    canonical:`${S}/solutions/ai-use-case-discovery/`,
    icon:'mdi:magnify', chip:'الاكتشاف',
    shortDesc:'يكتشف الاستخدامات الخفية للذكاء الاصطناعي داخل شركتك (Shadow AI) ويعطيك خريطة كاملة.',
    whenNeeded:'لو ما عندك علم بكل استخدامات AI.',
    cardTitle:'اكتشاف استخدامات AI',
    related:['ai-risk-classification','ai-firewall','ai-governance-platform'],
    docs:['/docs/ai-governance-platform/'], blog:['/blog/shadow-ai-discovery-saudi-company/','/blog/digital-transformation-sme-saudi/','/blog/ai-implementation-cost-saudi/'], kernel:['/kernel/stats/'],
    content: content_ai_use_case_discovery,
  },
  {
    slug:'policy-to-control-mapping', href:'/solutions/policy-to-control-mapping/',
    title:'ربط السياسات بالضوابط التقنية | Policy to Control Mapping | BrightAI',
    h1:'ربط السياسات بالضوابط التقنية',
    description:'يحوّل سياسات الورق إلى ضوابط تقنية تطبق نفسها. من السياسة إلى التنفيذ بكبسة واحدة.',
    canonical:`${S}/solutions/policy-to-control-mapping/`,
    icon:'material-symbols:account-tree', chip:'الربط الذكي',
    shortDesc:'يحوّل سياسات الورق إلى ضوابط تقنية تطبق نفسها. من السياسة إلى التنفيذ بكبسة واحدة.',
    whenNeeded:'لو عندك سياسات ما تتنفذ.',
    related:['continuous-ai-governance','ai-governance-platform','ai-risk-classification'],
    docs:['/docs/nca-ecc-ai-controls-mapping/'], blog:['/blog/ai-usage-policy-template-saudi/','/blog/ndmo-roles-requirements-guide/','/docs/nca-ecc-ai-controls-mapping/'], kernel:['/kernel/policies/'],
    content: content_policy_to_control_mapping,
  },
];

export const sectors: SectorData[] = [
  {
    slug:'banking-ai-governance', href:'/solutions/banking-ai-governance/',
    title:'حوكمة الذكاء الاصطناعي في البنوك والقطاع المالي | BrightAI',
    h1:'حوكمة الذكاء الاصطناعي في القطاع المالي والبنكي',
    description:'ضوابط استخدام AI مع بيانات العملاء، امتثال SAMA، NCA ECC، ومكافحة غسل الأموال في البنوك السعودية.',
    canonical:`${S}/solutions/banking-ai-governance/`,
    icon:'mdi:bank', chip:'القطاع المالي',
    shortDesc:'ضوابط استخدام AI مع بيانات العملاء، امتثال SAMA، NCA ECC، ومكافحة غسل الأموال.',
    whenNeeded:'إذا كان AI يدخل في الائتمان أو AML أو خدمة العملاء.',
    related:['ai-firewall','ai-audit-trail','human-approval-layer','ai-evidence-file'],
    locals:[
      {
        slug:'riyadh', href:'/solutions/banking-ai-governance/riyadh/',
        title:'حوكمة الذكاء الاصطناعي للبنوك في الرياض | BrightAI',
        h1:'حوكمة الذكاء الاصطناعي للبنوك والمؤسسات المالية في الرياض',
        description:'خدمات حوكمة الذكاء الاصطناعي للبنوك والمؤسسات المالية في الرياض. امتثال SAMA وNCA ECC وحماية بيانات العملاء.',
        canonical:`${S}/solutions/banking-ai-governance/riyadh/`,
        cityAr:'الرياض', cityEn:'Riyadh', areaServed:'Riyadh', geoLat:24.7136, geoLng:46.6753,
        parentSlug:'banking-ai-governance', parentHref:'/solutions/banking-ai-governance/',
      },
      {
        slug:'khobar', href:'/solutions/banking-ai-governance/khobar/',
        title:'حوكمة الذكاء الاصطناعي للبنوك في الخبر | BrightAI',
        h1:'حوكمة الذكاء الاصطناعي للبنوك والمؤسسات المالية في الخبر',
        description:'خدمات حوكمة الذكاء الاصطناعي للبنوك والمؤسسات المالية في الخبر. امتثال SAMA وNCA ECC وحماية بيانات العملاء.',
        canonical:`${S}/solutions/banking-ai-governance/khobar/`,
        cityAr:'الخبر', cityEn:'Khobar', areaServed:'Khobar', geoLat:26.2172, geoLng:50.1971,
        parentSlug:'banking-ai-governance', parentHref:'/solutions/banking-ai-governance/',
      },
    ],
    docs:['/docs/nca-ecc-ai-governance/'], blog:['/blog/banking-ai-governance-sama-requirements/','/blog/ai-banking-saudi/','/blog/healthcare-ai-governance-saudi-hospitals/'],
    regulations: regulationsBySectorSlug['banking-ai-governance'],
    faqs: faqsBySectorSlug['banking-ai-governance'],
  },
  {
    slug:'government-ai-governance', href:'/solutions/government-ai-governance/',
    title:'حوكمة الذكاء الاصطناعي في الجهات الحكومية',
    h1:'حوكمة الذكاء الاصطناعي في الجهات الحكومية',
    description:'حوكمة استخدامات AI في الخدمات الرقمية مع DGA وPDPL ورؤية 2030 وحماية بيانات المستفيدين في الجهات الحكومية.',
    canonical:`${S}/solutions/government-ai-governance/`,
    icon:'mdi:domain', chip:'القطاع الحكومي',
    shortDesc:'حوكمة استخدامات AI في الخدمات الرقمية مع DGA وPDPL ورؤية 2030 وحماية بيانات المستفيدين.',
    whenNeeded:'إذا كان AI يدعم موظفين أو مستفيدين في جهة حكومية.',
    related:['ai-firewall','ai-audit-trail','ai-evidence-file','policy-to-control-mapping'],
    locals:[
      {
        slug:'dammam', href:'/solutions/government-ai-governance/dammam/',
        title:'حوكمة الذكاء الاصطناعي للجهات الحكومية في الدمام | BrightAI',
        h1:'حوكمة الذكاء الاصطناعي للجهات الحكومية في الدمام',
        description:'خدمات حوكمة الذكاء الاصطناعي للجهات الحكومية في الدمام. امتثال DGA وPDPL وحماية بيانات المستفيدين.',
        canonical:`${S}/solutions/government-ai-governance/dammam/`,
        cityAr:'الدمام', cityEn:'Dammam', areaServed:'Dammam', geoLat:26.4207, geoLng:50.0888,
        parentSlug:'government-ai-governance', parentHref:'/solutions/government-ai-governance/',
      },
      {
        slug:'madinah', href:'/solutions/government-ai-governance/madinah/',
        title:'حوكمة الذكاء الاصطناعي الحكومي في المدينة المنورة',
        h1:'حوكمة الذكاء الاصطناعي للجهات الحكومية في المدينة المنورة',
        description:'خدمات حوكمة الذكاء الاصطناعي للجهات الحكومية في المدينة المنورة. امتثال DGA وPDPL وحماية بيانات المستفيدين.',
        canonical:`${S}/solutions/government-ai-governance/madinah/`,
        cityAr:'المدينة المنورة', cityEn:'Madinah', areaServed:'Madinah', geoLat:24.5247, geoLng:39.5692,
        parentSlug:'government-ai-governance', parentHref:'/solutions/government-ai-governance/',
      },
    ],
    docs:['/docs/pdpl-ai-governance/'], blog:['/blog/ai-governance-saudi-arabia/','/blog/saudi-ai-regulators-guide/','/blog/sdaia-seven-principles-practical-guide/'],
    regulations: regulationsBySectorSlug['government-ai-governance'],
    faqs: faqsBySectorSlug['government-ai-governance'],
  },
  {
    slug:'healthcare-ai-governance', href:'/solutions/healthcare-ai-governance/',
    title:'حوكمة الذكاء الاصطناعي في المستشفيات والرعاية الصحية | BrightAI',
    h1:'حوكمة الذكاء الاصطناعي في القطاع الصحي',
    description:'حوكمة استخدامات الذكاء الاصطناعي مع بيانات المرضى، امتثال SFDA، ISO 13485، وسجلات أدلة الجودة في المستشفيات السعودية.',
    canonical:`${S}/solutions/healthcare-ai-governance/`,
    icon:'mdi:hospital-building', chip:'قطاع الرعاية الصحية',
    shortDesc:'حوكمة استخدامات الذكاء الاصطناعي مع بيانات المرضى، امتثال SFDA، ISO 13485، وسجلات أدلة الجودة.',
    whenNeeded:'إذا كان AI يلامس بيانات صحية أو توصيات سريرية.',
    related:['ai-firewall','ai-audit-trail','human-approval-layer','ai-evidence-file'],
    locals:[
      {
        slug:'jeddah', href:'/solutions/healthcare-ai-governance/jeddah/',
        title:'حوكمة الذكاء الاصطناعي للمستشفيات في جدة | BrightAI',
        h1:'حوكمة الذكاء الاصطناعي للمستشفيات والمنشآت الصحية في جدة',
        description:'خدمات حوكمة الذكاء الاصطناعي للمستشفيات والمنشآت الصحية في جدة. امتثال SFDA وISO 13485 وحماية بيانات المرضى.',
        canonical:`${S}/solutions/healthcare-ai-governance/jeddah/`,
        cityAr:'جدة', cityEn:'Jeddah', areaServed:'Jeddah', geoLat:21.4858, geoLng:39.1925,
        parentSlug:'healthcare-ai-governance', parentHref:'/solutions/healthcare-ai-governance/',
      },
      {
        slug:'mecca', href:'/solutions/healthcare-ai-governance/mecca/',
        title:'حوكمة الذكاء الاصطناعي للمستشفيات في مكة المكرمة | BrightAI',
        h1:'حوكمة الذكاء الاصطناعي للمستشفيات والمنشآت الصحية في مكة المكرمة',
        description:'خدمات حوكمة الذكاء الاصطناعي للمستشفيات والمنشآت الصحية في مكة المكرمة. امتثال SFDA وISO 13485 وحماية بيانات المرضى.',
        canonical:`${S}/solutions/healthcare-ai-governance/mecca/`,
        cityAr:'مكة المكرمة', cityEn:'Mecca', areaServed:'Mecca', geoLat:21.3891, geoLng:39.8579,
        parentSlug:'healthcare-ai-governance', parentHref:'/solutions/healthcare-ai-governance/',
      },
    ],
    docs:['/docs/ai-governance-saudi-arabia/'], blog:['/blog/healthcare-ai-governance-saudi-hospitals/','/blog/ai-healthcare-saudi/','/docs/human-approval-layer/'],
    regulations: regulationsBySectorSlug['healthcare-ai-governance'],
    faqs: faqsBySectorSlug['healthcare-ai-governance'],
  },
  {
    slug:'manufacturing-ai-governance', href:'/solutions/manufacturing-ai-governance/',
    title:'حوكمة الذكاء الاصطناعي في القطاع الصناعي | BrightAI',
    h1:'حوكمة الذكاء الاصطناعي في القطاع الصناعي',
    description:'حوكمة AI في الجودة والصيانة التنبؤية وسلامة IoT وتوصيات التشغيل داخل المصانع السعودية.',
    canonical:`${S}/solutions/manufacturing-ai-governance/`,
    icon:'mdi:factory', chip:'القطاع الصناعي',
    shortDesc:'حوكمة AI في الجودة والصيانة التنبؤية وسلامة IoT وتوصيات التشغيل داخل المصانع.',
    whenNeeded:'إذا كان AI يؤثر على خط إنتاج أو جودة أو أصل صناعي.',
    related:['ai-firewall','ai-audit-trail','ai-risk-classification','continuous-ai-governance'],
    docs:['/docs/ai-risk-management/'], blog:['/blog/computer-vision-saudi-factories/','/blog/ai-implementation-cost-saudi/','/blog/ai-vision-2030-saudi/'],
    regulations: regulationsBySectorSlug['manufacturing-ai-governance'],
    faqs: faqsBySectorSlug['manufacturing-ai-governance'],
  },
];

export function getSolution(slug: string) { return solutions.find(s => s.slug === slug); }
export function getSector(slug: string) { return sectors.find(s => s.slug === slug); }
export function getRelatedSolutions(slug: string): SolutionData[] {
  const sol = getSolution(slug);
  if (!sol) return [];
  return sol.related.map(r => getSolution(r)).filter((s): s is SolutionData => !!s);
}
export function getRelatedSectors(solutionSlug: string): SectorData[] {
  return sectors.filter(s => s.related.includes(solutionSlug));
}
