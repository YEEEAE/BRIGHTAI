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
  // BAI-VOC-001-A (2026-07-18): per-sector hero lead that injects the 5 VOC
  // pillars (AI inventory, accountable owner, AI risk register, audit-ready
  // evidence, human oversight). Used by solutions/[sector].astro as the
  // hero paragraph; falls back to `description` if absent. tone = "يدعم
  // الجاهزية" — never "مضمون/كامل". The canonical `description` is kept for
  // SEO meta tags (title/description/og), so SEO anchor text is preserved.
  vocLead?: string;
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
  /** BAI-VOC-001-B (2026-07-18): city-level FAQ (Saudi dialect, 5 questions,
   *  40–60 word answers) for the visible <details> section + JSON-LD
   *  FAQPage. Mirrors `SolutionData.faqs` shape. Optional — if absent,
   *  the city page omits both the visible section and the JSON-LD node. */
  faqs?: { question: string; answer: string }[];
  /** BAI-VOC-001-D (2026-07-18): unique localized context paragraph
   *  (120–180 Saudi-dialect words) for the "local-context" section in
   *  solutions/[sector]/[city].astro. Must name the city + sector +
   *  appropriate regulator, and describe a persona, pain, and local use
   *  case. Replaces the previously generic repeated paragraph. */
  localContext?: string;
  /** BAI-SEO-003-S6 (2026-07-18): ≤60-word answer-first paragraph
   *  rendered inside the hero/intro (or as the first intro paragraph
   *  for migrated pages). Must be UNIQUE per city + sector — naming
   *  the city, sector, appropriate regulator, and the local
   *  operational/regulatory problem. NO claims of a physical office,
   *  client, or partnership in the city (SAB honesty). Replaces the
   *  previously generic 26-word paragraph that was repeated with only
   *  the city name substituted. */
  answerFirst?: string;
}

const S = 'https://brightai.site';

export const solutions: SolutionData[] = [
  {
    slug:'ai-governance-platform', href:'/solutions/ai-governance-platform/',
    title:'منصة حوكمة الذكاء الاصطناعي للشركات السعودية',
    h1:'منصة حوكمة الذكاء الاصطناعي للمؤسسات السعودية',
    description:'منصة حوكمة AI سعودية — BrightAI تمنح المؤسسات رؤية مركزية على استخدامات AI مع توافق كامل مع PDPL وNCA ECC. احجز ديمو حي لجاهزية التدقيق التنظيمي لمؤسستك اليوم.',
    canonical:`${S}/solutions/ai-governance-platform/`,
    icon:'mdi:scale-balance', chip:'المنصة الأم',
    shortDesc:'المنصة الشاملة اللي تجمع كل الحلول. رؤية مركزية لكل استخدامات AI، السياسات، والمخاطر.',
    whenNeeded:'لو عندك أكثر من ٢ حالة استخدام AI.',
    related:['ai-firewall','ai-audit-trail','human-approval-layer','ai-evidence-file'],
    docs:['/docs/ai-governance-platform/'], blog:['/blog/ai-governance/','/blog/what-is-ai-governance-saudi-companies/','/blog/best-ai-governance-platforms-2026/','/blog/sdaia-generative-ai-guidelines-practical-compliance/'], kernel:['/kernel/'],
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
    description:'AI Firewall للشركات السعودية — يفحص مدخلات ومخرجات LLM ويمنع تسريب البيانات الحساسة متوافقاً مع NCA ECC. احجز ديمو حي لتجربة الحماية على بيئة شركتك اليوم.',
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
    description:'سجل تدقيق AI مشفر SHA-256 وغير قابل للتعديل لكافة عمليات الذكاء الاصطناعي مع توافق PDPL وNCA في السعودية. احجز ديمو حي لترى التوثيق الكامل لكل طلب وقرار.',
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
    description:'ملف أدلة امتثال AI موقّع رقمياً للجهات التنظيمية السعودية SDAIA وNCA. يوثّق كل قرار ويختصر أيام التدقيق بساعات. احجز ديمو حي لجاهزية التدقيق الفورية لمؤسستك.',
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
    description:'طبقة موافقات بشرية للقرارات عالية المخاطر في المؤسسات السعودية — توقف مخرجات AI لين يراجعها مختص. متوافقة مع NCA ECC. احجز ديمو حي لتجربة سير الموافقة الذكي.',
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
    description:'حوكمة AI المستمرة للشركات السعودية — BrightAI يراقب ويحدّث السياسات تلقائياً مع تغير أنظمة PDPL وNCA. مو مشروع لمرة. احجز ديمو حي لامتثال مستمر دون عناء.',
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
    description:'تصنيف مخاطر AI للشركات السعودية — يصنّف كل استخدام حسب الخطورة عالي/متوسط/منخفض مع توافق PDPL وNCA. يحدد متى تحتاج موافقة بشرية. احجز ديمو حي لتصنيف مخاطرك.',
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
    description:'يكتشف Shadow AI في شركتك السعودية — الاستخدامات الخفية للذكاء الاصطناعي مع خريطة كاملة متوافقة مع PDPL. احجز ديمو حي وتعرف على كل استخدام AI في بيئتك.',
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
    description:'يحوّل سياسات الورق إلى ضوابط تقنية تنفذ نفسها للشركات السعودية. من السياسة للتنفيذ بكبسة مع توافق NCA ECC. احجز ديمو حي وحوّل سياساتك لضوابط آلية فوراً.',
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
    description:'ضوابط حوكمة AI للبنوك السعودية — امتثال SAMA وNCA ECC ومكافحة غسل الأموال مع حماية بيانات العملاء. احجز ديمو حي لتجربة الحوكمة المصرفية المخصصة لبيئة بنكك.',
    vocLead:'ضوابط استخدام AI مع بيانات العملاء، امتثال SAMA، NCA ECC، ومكافحة غسل الأموال في البنوك السعودية. يدعم المنشأة في جاهزية التدقيق عبر جرد AI شامل لمخاطر الائتمان والاحتيال، وتعيين مالك مسؤول للامتثال، وسجل مخاطر محدّث، وأدلة جاهزة للجهات التنظيمية (SAMA / NCA)، مع إشراف بشري على القرارات عالية المخاطر.',
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
        description:'حوكمة AI للبنوك في الرياض مع امتثال SAMA وNCA ECC وحماية بيانات العملاء. احجز ديمو حي مخصص لحوكمة AI المصرفية للبنوك والمؤسسات المالية في الرياض اليوم.',
        canonical:`${S}/solutions/banking-ai-governance/riyadh/`,
        cityAr:'الرياض', cityEn:'Riyadh', areaServed:'Riyadh', geoLat:24.7136, geoLng:46.6753,
        parentSlug:'banking-ai-governance', parentHref:'/solutions/banking-ai-governance/',
        // BAI-VOC-001-D (2026-07-18): localized context — Riyadh banking.
        localContext:'في الرياض، مقر كبرى البنوك ومقر مؤسسة النقد (ساما)، يواجه مسؤول الحوكمة تحدياً يومياً: لا يقدر يدافع عن قرار ذكاء اصطناعي أمام المدقق لأن الاستخدام موزع بين فرق الائتمان والاحتيال وخدمة العملاء بدون مالك موحد أو سجل مخاطر. الألم الحقيقي هو غياب الإثبات التشغيلي عند تدقيق ساما ونظام مكافحة غسل الأموال. حلنا يحوكم نماذج الائتمان والتقييم الآلي عبر طبقة وسطية تفرض موافقة بشرية على القرارات عالية المخاطر، وتصنّف كل طلب، وتربط الضابط بـ NCA ECC بدليل جاهز للجنة المخاطر خلال 24 ساعة.',
        // BAI-SEO-003-S6 (2026-07-18): unique ≤60-word answer-first for
        // Riyadh banking. Names the city, sector, SAMA + NCA regulators,
        // and the audit-trail problem. NO claim of an office, client, or
        // partnership in Riyadh. SAB honesty: Riyadh IS the company HQ
        // (حي الفيحاء, 14254) so the LocalBusiness schema stays valid.
        answerFirst:'حوكمة AI في البنوك والمؤسسات المالية بالرياض، حيث تتركز قرارات الائتمان والـ AML في مقار كبرى البنوك، مع ضرورة إثبات كل استخدام ذكاء اصطناعي أمام ساما وهيئة الأمن السيبراني وقت التدقيق. أداة تشغيلية موصولة بضوابط NCA ECC وملف أدلة موقّع رقمياً.',
      },
      {
        slug:'khobar', href:'/solutions/banking-ai-governance/khobar/',
        title:'حوكمة الذكاء الاصطناعي للبنوك في الخبر | BrightAI',
        h1:'حوكمة الذكاء الاصطناعي للبنوك والمؤسسات المالية في الخبر',
        description:'حوكمة AI للبنوك في الخبر مع امتثال SAMA وNCA ECC وحماية بيانات العملاء بالمنطقة الشرقية. احجز ديمو حي مخصص لحوكمة AI المصرفية للبنوك في الخبر والدمام.',
        canonical:`${S}/solutions/banking-ai-governance/khobar/`,
        cityAr:'الخبر', cityEn:'Khobar', areaServed:'Khobar', geoLat:26.2172, geoLng:50.1971,
        parentSlug:'banking-ai-governance', parentHref:'/solutions/banking-ai-governance/',
        // BAI-VOC-001-D (2026-07-18): localized context — Khobar banking (Eastern Province).
        localContext:'الخبر بقلب المنطقة الشرقية حيث تتركز البنوك والشركات النفطية، يقلق مدير المخاطر من أن نماذج التسعير والائتمان تعمل بدون تفسير يقدر يراجعه مدقق ساما. الألم هنا هو تشتت الأدلة بين فروع الخبر والدمام وغياب مالك واحد مسؤول عن كل نظام. حلنا يحوكم كل استخدام AI مصرفي عبر طبقة موحّدة ترصد الظل وتطبّق ضوابط NCA ECC آلياً، وتنتج ملف أدلة موقّع رقمياً يجمع كل الفروع في مكان واحد. هكذا يمر أي قرار عالي الأثر بموافقة بشرية موثّقة ويصير جاهز للتدقيق دون تجميع يدوي يأخذ أيام.',
        // BAI-SEO-003-S6 (2026-07-18): unique ≤60-word answer-first for
        // Khobar banking. Names the Eastern Province cluster, SAMA + NCA,
        // and the multi-branch evidence-fragmentation problem. NO claim of
        // a physical office in Khobar (SAB honesty — service area only).
        answerFirst:'حوكمة AI في البنوك بالخبر وبقية المنطقة الشرقية: فروع الخبر والدمام تعمل على نماذج تسعير وائتمان موزعة بدون مالك موحّد للأدلة. تطبّق ضوابط ساما وNCA ECC وتجمع ملف تدقيق واحداً موقّعاً رقمياً يخدم كل فروع المنطقة. أداة تشغيلية لا تستبدل التقييم النظامي.',
        // BAI-VOC-001-B (2026-07-18): 5 city-level FAQs powering both
        // the visible <details> section and the JSON-LD FAQPage node.
        faqs: [
          {
            question: 'ليش البنوك في الخبر تحتاج حوكمة AI مخصصة؟',
            answer: 'البنوك في الخبر تعمل في بيئة مالية منظمة تشمل SAMA وNCA ECC، إضافة لخصوصية المنطقة الشرقية كمنطقة اقتصادية متصلة بالدمام. حوكمة AI هنا تعني توثيق كل استخدام للنماذج، تصنيف مخاطر كل طلب، وحماية بيانات العملاء قبل إرسالها للنموذج. هذا يميز استخدامك لـ AI عن البنوك المنافسة ويعطيك سجلاً جاهزاً للجهات الرقابية.'
          },
          {
            question: 'هل BrightAI يخدم فروع البنوك في الخبر؟',
            answer: 'نعم. يعمل BrightAI كطبقة حوكمة مركزية تخدم كل فروع البنك في الخبر والدمام والمنطقة الشرقية، مع تجميع الأدلة في ملف واحد موقّع رقمياً. كل طلب AI يولّد سجل تدقيق (Hash Chain) يوضح من استخدم النظام، ماذا أرسل، ماذا أخرج النموذج، ومن وافق. الفروع تستفيد من نفس مستوى الحوكمة بغض النظر عن موقعها.'
          },
          {
            question: 'كيف يدعم BrightAI متطلبات NCA ECC في قطاع البنوك؟',
            answer: 'يساعد BrightAI البنوك في تطبيق ضوابط NCA ECC عبر توثيق استخدامات AI، تقييم مخاطر الأمن السيبراني، ومراقبة محاولات الوصول غير المصرح بها. يولّد سجل تدقيق غير قابل للتعديل يوضح كل نشاط، مع تنبيهات فورية عند محاولات تسريب بيانات. هذه الأدلة تساعد البنك في اجتياز مراجعات NCA بدون تجميع يدوي.'
          },
          {
            question: 'كم يأخذ تشغيل BrightAI في بنك متوسط الحجم؟',
            answer: 'يعتمد على حجم الاستخدامات وتعقيدها. نشر BrightAI مع أول حالة استخدام يستغرق عادة أسابيع، ثم تتوسع تدريجياً لباقي الاستخدامات. لا تحتاج تغيير البنية التحتية للبنك — فقط إضافة طبقة Kernel كوسيط بين المستخدمين والنماذج. الفريق المساند يرافق البنك في كل مرحلة حتى جاهزية التدقيق.'
          },
          {
            question: 'هل BrightAI يدعم العربية في سياساته؟',
            answer: 'نعم. كل السياسات والتنبيهات والأدلة في BrightAI بالعربية السعودية (عامية + فصحى حسب السياق). كما ندعم سيناريوهات مخصصة للبنوك السعودية مثل سياسات الإبلاغ عن الاحتيال، كشف الاحتيال عبر القنوات الرقمية، ومكافحة غسل الأموال وفق معايير SAMA. هذا يجعل الحوكمة مألوفة لفريقك بدلاً من ترجمة متكررة.'
          }
        ],
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
    description:'حوكمة AI للجهات الحكومية السعودية — امتثال DGA وPDPL ورؤية 2030 مع حماية بيانات المستفيدين. احجز ديمو حي لجاهزية التدقيق والحوكمة الرقمية في جهتك الحكومية.',
    vocLead:'حوكمة استخدامات AI في الخدمات الرقمية مع DGA وPDPL ورؤية 2030 وحماية بيانات المستفيدين في الجهات الحكومية. يدعم المنشأة في جاهزية التدقيق عبر جرد AI شفاف للأدوات المعتمدة والظليلة، وتعيين مالك مسؤول لكل خدمة رقمية، وسجل مخاطر محدّث، وأدلة جاهزة للجهات الإشرافية (DGA / SDAIA / NCA)، مع إشراف بشري على الخدمات والموافقات الحساسة.',
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
        description:'حوكمة AI للجهات الحكومية في الدمام مع امتثال DGA وPDPL وحماية بيانات المستفيدين بالشرقية. احجز ديمو حي لجاهزية التدقيق والحوكمة في جهتك الحكومية بالدمام.',
        canonical:`${S}/solutions/government-ai-governance/dammam/`,
        cityAr:'الدمام', cityEn:'Dammam', areaServed:'Dammam', geoLat:26.4207, geoLng:50.0888,
        parentSlug:'government-ai-governance', parentHref:'/solutions/government-ai-governance/',
        // BAI-VOC-001-D (2026-07-18): localized context — Dammam government.
        localContext:'في الدمام، حيث تتمركز إمارة المنطقة الشرقية وعدد من الجهات الحكومية الكبرى، يخشى ضابط الأمن السيبراني تسريب مستند مصنّف عبر أدوات الذكاء العامة لأن الموظفين يلصقون البيانات خارج القنوات المعتمدة. الألم هو غياب الجرد الموحّد لأدوات AI وعدم القدرة على إثبات الجاهزية أمام دايجا وسدايا ونظام الأمن السيبراني. حلنا يحوكم مساعدات خدمة المستفيدين عبر فحص كل طلب قبل النموذج، إخفاء المعرّفات الشخصية، وتسجيل سجل تدقيق غير قابل للتعديل. ينتج ملف أدلة واحد يثبت امتثال الجهة للضوابط الوطنية ويقلّل أيام الجمع اليدوي قبل التدقيق.',
        // BAI-SEO-003-S6 (2026-07-18): unique ≤60-word answer-first for
        // Dammam government. Names DGA + SDAIA + NCA, and the
        // Shadow-AI-by-employees problem. NO claim of a physical office
        // in Dammam (SAB honesty — service area only).
        answerFirst:'حوكمة AI في الجهات الحكومية بالدمام والمنطقة الشرقية: موظفون يلصقون بيانات مستفيدين في أدوات ذكاء عامة خارج القنوات المعتمدة فيتسرب مستند مصنّف. يفرض الجرد الموحّد وضوابط دايجا وسدايا وهيئة الأمن السيبراني قبل أي نموذج. أداة تشغيلية موصولة بـ PDPL.',
      },
      {
        slug:'madinah', href:'/solutions/government-ai-governance/madinah/',
        title:'حوكمة الذكاء الاصطناعي الحكومي في المدينة المنورة',
        h1:'حوكمة الذكاء الاصطناعي للجهات الحكومية في المدينة المنورة',
        description:'حوكمة AI للجهات الحكومية في المدينة المنورة مع امتثال DGA وPDPL وحماية بيانات المستفيدين. احجز ديمو حي مخصص لجاهزية التدقيق والحوكمة في المدينة المنورة.',
        canonical:`${S}/solutions/government-ai-governance/madinah/`,
        cityAr:'المدينة المنورة', cityEn:'Madinah', areaServed:'Madinah', geoLat:24.5247, geoLng:39.5692,
        parentSlug:'government-ai-governance', parentHref:'/solutions/government-ai-governance/',
        // BAI-VOC-001-D (2026-07-18): localized context — Madinah government.
        localContext:'الجهات الحكومية في المدينة المنورة تخدم زواراً ومعتمرين على مدار العام، ما يضاعف حجم البيانات الشخصية ويهدد بخرق ضوابط حماية البيانات إن لم يوثّق كل استخدام للذكاء. الألم عند مسؤول البيانات هو غياب الخريطة الواضحة لتدفق معلومات المستفيد بين المساعد والنموذج والجهة الرقابية. حلنا يحوكم مساعد خدمة المستفيدين والمساعد الداخلي عبر طبقة تحجب المعرّفات الشخصية وتسجّل كل قرار بصورة قابلة لإعادة البناء. ينتج أدلة جاهزة للعرض على دايجا وسدايا تثبت حماية بيانات الزائر وتسرّع أي تقييم رسمي بدون استبداله.',
        // BAI-SEO-003-S6 (2026-07-18): unique ≤60-word answer-first for
        // Madinah government. Names DGA + SDAIA, the pilgrim-data PDPL
        // pressure, and the inspection-readiness problem. NO claim of a
        // physical office in Madinah (SAB honesty).
        answerFirst:'حوكمة AI في الجهات الحكومية بالمدينة المنورة التي تخدم زواراً ومعتمرين: بيانات المستفيدين تتضاعف موسمياً فتضغط على PDPL. تفرض فحصاً قبل النموذج، وإخفاء المعرّفات، وسجل تدقيق يثبت الجاهزية أمام دايجا وسدايا وقت التقييم الرسمي. أداة تشغيلية موصولة بـ NCA ECC.',
        // BAI-VOC-001-B (2026-07-18): 5 city-level FAQs for Madinah —
        // government sector. Drives visible <details> + JSON-LD FAQPage.
        faqs: [
          {
            question: 'وش يميز الجهات الحكومية في المدينة المنورة من ناحية حوكمة AI؟',
            answer: 'الجهات الحكومية في المدينة المنورة تخدم زوار ومعتمرين على مدار العام، إضافة لخدمات المواطنين الدائمة. هذا يضاعف حجم البيانات الشخصية (PDPL) ويستلزم توثيقاً واضحاً لكل استخدام AI يلامس المستفيدين. حوكمة AI هنا تساعد الجهة على إثبات الجاهزية للجهات الإشرافية (DGA، SDAIA، NCA) مع حماية بيانات الزوار.'
          },
          {
            question: 'كيف يحمي BrightAI بيانات المستفيدين في الخدمات الحكومية؟',
            answer: 'يفحص BrightAI كل طلب AI قبل إرساله للنموذج، فيكتشف المعرفات الشخصية (الأسماء، أرقام الهوية، أرقام الجوال) ويخفيها أو يمنع الطلب حسب السياسة. كل عملية إخفاء أو منع تُسجَّل في سجل تدقيق غير قابل للتعديل. الجهة تقدر مراجعة السجل عند أي استفسار من المستفيد أو الجهة الرقابية.'
          },
          {
            question: 'هل يدعم BrightAI الربط مع DGA وSDAIA؟',
            answer: 'يدعم BrightAI جاهزية تقارير DGA وSDAIA عبر ملف أدلة موحّد يوضح كل نظام AI حكومي، مخاطره، ضوابطه، ومن وافق على تشغيله. الملف بصيغة PDF موقّعة رقمياً أو JSON قابل للتحقق، ما يسهّل على الجهة الإشرافية مراجعة الجاهزية بدون زيارة ميدانية. هذا لا يستبدل التقييم الرسمي للجهة بل يسرّعه.'
          },
          {
            question: 'وش أهم حالة استخدام تبدأ فيها الجهة الحكومية في المدينة المنورة؟',
            answer: 'تبدأ غالباً بحوكمة مساعد خدمة المستفيدين (مثل الرد على الاستفسارات) أو مساعد الموظفين الداخلي (تلخيص، صياغة). هاتان الحالتان تجمعان بيانات حساسة ومخرجات قد تؤثر على تجربة المستفيد، فيسهل قياس الأثر وإثبات القيمة. بعد تثبيت الحوكمة على هاتين الحالتين، تتوسع الجهة لباقي الإدارات تدريجياً.'
          },
          {
            question: 'كم تستغرق جاهزية الجهة لأول استخدام AI محكوم؟',
            answer: 'الأشهر الأولى تُركَّز على جرد استخدامات AI الحالية، تحديد المخاطر، وتطبيق سياسات الحوكمة الأساسية. النشر التشغيلي لأول حالة استخدام يستغرق أسابيع. كل حالة استخدام جديدة تضيف بعد ذلك بدون إعادة بناء المنظومة، لأن طبقة Kernel وسيطة بين الجهة والنموذج. الجهة تستفيد من تراكم الأدلة مع كل حالة استخدام لاحقة.'
          }
        ],
      },
    ],
    docs:['/docs/pdpl-ai-governance/'], blog:['/blog/ai-governance-saudi-arabia/','/blog/saudi-ai-regulators-guide/','/blog/sdaia-generative-ai-guidelines-practical-compliance/','/blog/sdaia-seven-principles-practical-guide/','/blog/sdaia-nca-pdpl-regulatory-map/','/blog/sdaia-90-day-implementation-plan/','/blog/sdaia-sector-compliance-healthcare-banking-government/','/blog/sdaia-allam-model-enterprise/','/blog/sdaia-audit-checklist-preparedness/','/blog/sdaia-international-standards-unesco-oecd/'],
    regulations: regulationsBySectorSlug['government-ai-governance'],
    faqs: faqsBySectorSlug['government-ai-governance'],
  },
  {
    slug:'healthcare-ai-governance', href:'/solutions/healthcare-ai-governance/',
    title:'حوكمة الذكاء الاصطناعي في المستشفيات والرعاية الصحية | BrightAI',
    h1:'حوكمة الذكاء الاصطناعي في القطاع الصحي',
    description:'حوكمة AI للمستشفيات السعودية — امتثال SFDA وISO 13485 مع حماية بيانات المرضى وسجلات أدلة الجودة. احجز ديمو حي لتجربة حوكمة الذكاء الاصطناعي الصحي في مستشفاك.',
    vocLead:'حوكمة استخدامات الذكاء الاصطناعي مع بيانات المرضى، امتثال SFDA، ISO 13485، وسجلات أدلة الجودة في المستشفيات السعودية. يدعم المنشأة الصحية في جاهزية التدقيق عبر جرد AI سريري شامل، وتعيين مالك مسؤول للقرارات الطبية، وسجل مخاطر محدّث، وأدلة جاهزة للمدققين (SFDA / CBAHI)، مع إشراف بشري من المختصين على التوصيات السريرية وبيانات المرضى.',
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
        description:'حوكمة AI للمستشفيات والمنشآت الصحية في جدة مع امتثال SFDA وISO 13485 وحماية بيانات المرضى. احجز ديمو حي لتجربة حوكمة الذكاء الاصطناعي الصحي لمستشفى في جدة.',
        canonical:`${S}/solutions/healthcare-ai-governance/jeddah/`,
        cityAr:'جدة', cityEn:'Jeddah', areaServed:'Jeddah', geoLat:21.4858, geoLng:39.1925,
        parentSlug:'healthcare-ai-governance', parentHref:'/solutions/healthcare-ai-governance/',
        // BAI-VOC-001-D (2026-07-18): localized context — Jeddah healthcare.
        localContext:'مستشفيات جدة الكبرى تشهد ضغطاً على البيانات الصحية الحساسة إذ تنتقل بين نظام المعلومات الصحية والنماذج والمورد الخارجي بدون خريطة واضحة. الألم عند ضابط البيانات الصحية هو عدم القدرة على إثبات مسار بيانات المريض أمام مدقق الهيئة والاعتماد. حلنا يحوكم كل استخدام للذكاء في التشخيص أو الجدولة عبر فحص يمنع خروج بيانات المرضى خارج المؤسسة، ويطبّق إشرافاً بشرياً من مختص على التوصيات عالية الأثر. ينتج سجلاً موثّقاً يدعم امتثال الهيئة العامة للغذاء والدواء واعتماد البورد الصحي وايزو 13485 وقت التدقيق.',
        // BAI-SEO-003-S6 (2026-07-18): unique ≤60-word answer-first for
        // Jeddah healthcare. Names SFDA + CBAHI + ISO 13485, and the
        // PHI-flow problem between HIS and external models. NO claim of
        // a physical office in Jeddah (SAB honesty).
        answerFirst:'حوكمة AI في المستشفيات والمنشآت الصحية بجدة: بيانات المرضى تنتقل بين نظام المعلومات الصحية والنماذج والمورّد بدون خريطة واضحة فيصعب إثبات مسارها أمام مدقق هيئة الغذاء والدواء واعتماد CBAHI وISO 13485. تطبّق إشرافاً بشرياً وفصلاً بين السريري والإداري.',
      },
      {
        slug:'mecca', href:'/solutions/healthcare-ai-governance/mecca/',
        title:'حوكمة الذكاء الاصطناعي للمستشفيات في مكة المكرمة | BrightAI',
        h1:'حوكمة الذكاء الاصطناعي للمستشفيات والمنشآت الصحية في مكة المكرمة',
        description:'حوكمة AI لمستشفيات مكة المكرمة مع امتثال SFDA وISO 13485 وحماية بيانات المرضى في مواسم الذروة. احجز ديمو حي لحوكمة AI الصحي الآمنة في مستشفى مكة المكرمة.',
        canonical:`${S}/solutions/healthcare-ai-governance/mecca/`,
        cityAr:'مكة المكرمة', cityEn:'Mecca', areaServed:'Mecca', geoLat:21.3891, geoLng:39.8579,
        parentSlug:'healthcare-ai-governance', parentHref:'/solutions/healthcare-ai-governance/',
        // BAI-VOC-001-D (2026-07-18): localized context — Mecca healthcare (seasonal load).
        localContext:'مستشفيات مكة تستقبل ملايين الحجاج والمعتمرين سنوياً، ما يضاعف الضغط الموسمي على البيانات الصحية ويرفع خطر خرق خصوصية المرضى إن لم يُحكَم الذكاء بشكل صارم. الألم عند رئيس الجودة هو غياب الإشراف البشري الموثّق على التوصيات السريرية وصعوبة إثبات الجاهزية أمام الهيئة العامة للغذاء والدواء. حلنا يحوكم المساعد الطبي الداخلي عبر طبقة تفرض موافقة مختص مؤهل قبل أي توصية عالية الأثر وتُخفي بيانات المريض. ينتج أدلة جودة جاهزة لاعتماد البورد الصحي تثبت سلامة المريض حتى في مواسم الذروة.',
        // BAI-SEO-003-S6 (2026-07-18): unique ≤60-word answer-first for
        // Mecca healthcare. Names SFDA + CBAHI, the seasonal pilgrim
        // pressure, and the human-oversight problem. NO claim of a
        // physical office in Mecca (SAB honesty).
        answerFirst:'حوكمة AI في مستشفيات مكة المكرمة خلال مواسم الحج والعمرة: ضغط موسمي على بيانات مرضى عالية الحساسية يرفع خطر خرق الخصوصية. تفرض موافقة مختص مؤهل قبل أي توصية عالية الأثر، وتُنتج أدلة جاهزة لهيئة الغذاء والدواء واعتماد CBAHI وISO 13485. أداة تشغيلية لا تستبدل الإشراف الطبي.',
        // BAI-VOC-001-B (2026-07-18): 5 city-level FAQs for Mecca —
        // healthcare sector. Drives visible <details> + JSON-LD FAQPage.
        faqs: [
          {
            question: 'وش يختلف استخدام AI في مستشفيات مكة عن غيرها؟',
            answer: 'مكة تستقبل ملايين الحجاج والمعتمرين سنوياً، ما يعني ضغطاً موسمياً على المستشفيات وبيانات صحية عالية الحساسية. أي نظام AI يلامس بيانات المرضى يحتاج حماية مضاعفة، سجل تدقيق قوي، وإشراف بشري من مختصين مؤهلين. BrightAI يفرض هذه الضوابط على كل استخدام AI سريري أو إداري داخل المنشأة الصحية في مكة.'
          },
          {
            question: 'كيف يحمي BrightAI بيانات المرضى في مكة؟',
            answer: 'يفحص BrightAI كل طلب AI سريري قبل إرساله للنموذج، فيكتشف بيانات المرضى (PHI) ويخفيها أو يمنع الطلب. كل عملية فحص تُسجَّل مع هوية المستخدم، الوقت، والسبب. هذه السجلات تساعد المستشفى في اجتياز مراجعات SFDA وCBAHI بسرعة وتزويد المرضى بإثبات أن بياناتهم محمية وفق أعلى المعايير.'
          },
          {
            question: 'هل يصلح BrightAI للأنظمة الطبية المعتمدة من SFDA؟',
            answer: 'نعم. يعمل BrightAI كطبقة حوكمة فوق أي نظام طبي معتمد من SFDA، فيضيف توثيقاً للإشراف البشري، فصل الاستخدام الإداري عن السريري، وسجل تدقيق مستمر. المستشفى يلتزم بمعايير ISO 13485 وSFDA دون الحاجة لاستبدال النظام الحالي. هذا يقلل المخاطر التشغيلية ويحافظ على استثمار المستشفى في أنظمتها المعتمدة.'
          },
          {
            question: 'كم يأخذ تشغيل BrightAI في مستشفى متوسط؟',
            answer: 'النشر الأولي يستغرق أسابيع مع تركيز على حالة استخدام عالية الأثر (مثل حوكمة مساعد طبي داخلي). ثم تتوسع تدريجياً لباقي الأقسام. BrightAI لا يلامس بيانات المرضى مباشرة — يبقى النظام الطبي مالكاً للبيانات، والطبقة الإضافية تضيف فقط الحوكمة والتدقيق. الفريق المساند يرافق المستشفى في الجاهزية والاختبار.'
          },
          {
            question: 'وش يضمن الإشراف البشري على التوصيات السريرية؟',
            answer: 'يفرض BrightAI موافقة بشرية من مختص مؤهل قبل أي توصية AI عالية الأثر (تشخيص، علاج، دواء). يسجل هوية المراجع، وقت المراجعة، قراره النهائي، وأي تعديل أجراه. إذا لم يوافق المختص، التوصية لا تُنفَّذ. هذا يدعم متطلبات SFDA وCBAHI للإشراف السريري ويحمي المستشفى قانونياً ومهنياً.'
          }
        ],
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
    description:'حوكمة AI للمصانع السعودية — ضبط الجودة والصيانة التنبؤية وسلامة IoT مع توافق معايير NCA ECC وSASO. احجز ديمو حي لترى كيف تحوكم توصيات التشغيل والسلامة الصناعية.',
    vocLead:'حوكمة AI في الجودة والصيانة التنبؤية وسلامة IoT وتوصيات التشغيل داخل المصانع السعودية. يدعم المنشأة الصناعية في جاهزية التدقيق عبر جرد AI تشغيلي شامل، وتعيين مالك مسؤول لكل خط إنتاج، وسجل مخاطر الأصول، وأدلة جاهزة للجهات التنظيمية (SFDA / SASO / NCA)، مع إشراف بشري على القرارات المؤثرة على السلامة والجودة.',
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
