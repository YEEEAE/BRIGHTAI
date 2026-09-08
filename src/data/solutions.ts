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

const S = 'https://brightai.live';

export const solutions: SolutionData[] = [
  {
    slug:'ai-governance-platform', href:'/solutions/ai-governance-platform/',
    title:'منصة حوكمة الذكاء الاصطناعي للشركات السعودية | BRIGHTAI',
    h1:'منصة حوكمة الذكاء الاصطناعي للشركات السعودية',
    description:'منصة حوكمة الذكاء الاصطناعي للشركات السعودية لإدارة حوكمة البيانات ومخاطر الذكاء الاصطناعي وربط الموظفين والبيانات والنماذج بالمراجعة البشرية.',
    canonical:`${S}/solutions/ai-governance-platform/`,
    icon:'mdi:scale-balance', chip:'المنصة الأم',
    shortDesc:'طبقة حوكمة تشغيلية تربط استخدامات AI بالمخاطر والضوابط والموافقات وسجل الأدلة.',
    whenNeeded:'إذا صار عندك أكثر من استخدام AI، أو صار أحدها يلامس بيانات حساسة أو قراراً عالي الأثر.',
    related:['ai-firewall','ai-risk-classification','human-approval-layer','ai-audit-trail','ai-evidence-file'],
    docs:['/docs/ai-governance-platform/'], blog:['/blog/ai-governance/','/blog/what-is-ai-governance-saudi-companies/','/blog/best-ai-governance-platforms-2026/','/blog/sdaia-generative-ai-guidelines-practical-compliance/'], kernel:['/kernel/'],
    content: {
      lead: [
        'منصة حوكمة الذكاء الاصطناعي من BrightAI هي طبقة تشغيلية بين الموظفين وأنظمة AI وبيانات المؤسسة وسياساتها. تربط كل استخدام بمالك واضح، وتحوّل القرار من سياسة مكتوبة إلى ضابط يُطبّق وسجل دليل يُراجع.',
        'تبدأ من جرد الاستخدامات، ثم تصنيف المخاطر، ثم تحديد الضابط المناسب: سماح، حجب، إخفاء بيانات، أو موافقة بشرية. بعدها تحفظ المنصة ما حدث ومن اعتمد ولماذا في سجل قابل للمراجعة.',
        'المراجع التنظيمية مثل PDPL وNCA ECC وإرشادات SDAIA ومعيار ISO/IEC 42001 تعطيك سياقاً للسياسات والضوابط. المنصة تساعدك توثّق التطبيق والجاهزية، لكنها ما تستبدل التقييم القانوني أو شهادة المطابقة.',
      ],
      sections: [
        {
          title: 'كيف تعمل منصة برايت آي كنظام أمان AI للشركات في السوق السعودي؟',
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
        { question: 'ما الفرق بين BrightAI ونماذج AI التجارية مثل ChatGPT وCopilot؟', answer: 'BrightAI طبقة تشغيلية ما تستبدل نماذج الذكاء الاصطناعي اللي تستخدمها، بل تنظم استخدامها داخل مؤسستك حسب التكاملات والسياسات اللي تفعلها. تساعدك تسجل الاستخدام والقرارات والموافقات في سجل مراجعة واحد، وموظفينك يكملون شغلهم داخل حدود واضحة بدل المنع الكامل.' },
        { question: 'وش المقصود بمنصة حوكمة الذكاء الاصطناعي؟', answer: 'هي طبقة تشغيلية بين الموظفين وأدوات AI وبيانات المؤسسة. تسجل الاستخدامات، تصنّف مخاطرها، تربطها بالسياسات والضوابط، توقف الحالات التي تحتاج مراجعة، وتحفظ دليلاً يوضح وش صار ومَن اعتمد القرار.' },
        { question: 'هل BrightAI تغني عن التقييم القانوني أو شهادة ISO/IEC 42001؟', answer: 'لا. BrightAI تساعد فريقك يترجم متطلبات الحوكمة إلى إجراءات وضوابط وسجلات قابلة للمراجعة، لكنها ما تقدم رأياً قانونياً ولا تدّعي إصدار شهادة. نطاق الجاهزية النهائي يعتمد على بيئتك وتقييم الجهة المختصة.' },
        { question: 'كيف تتعامل المنصة مع Shadow AI وتسريب البيانات الحساسة؟', answer: 'تبدأ بجرد الاستخدامات والأدوات المعتمدة وغير المعتمدة، ثم تربط كل مسار بضابط مناسب. عند رصد بيانات حساسة أو استخدام عالي المخاطر، يمكن تطبيق الإخفاء أو الحجب أو تحويل الطلب لموافقة بشرية حسب السياسة التي تعتمدها مؤسستك.' },
        { question: 'متى يحتاج قرار AI إلى موافقة بشرية؟', answer: 'لما يكون القرار عالي الأثر أو يمس بيانات حساسة أو يغيّر حالة عميل أو موظف أو مستفيد. تصنيف المخاطر يحدد الحالات، وطبقة الموافقة توثق صاحب الصلاحية وسبب الاعتماد والتوقيت قبل استمرار المسار.' },
        { question: 'هل تقدر فرق الأمن والامتثال استخدام نفس الأدلة؟', answer: 'نعم، المنصة تجمع سجل الاستخدام، تصنيف المخاطر، الضابط المطبق، الموافقات، والاستثناءات في سياق واحد. تقدر الفرق تستخدمه كنقطة عمل مشتركة للجاهزية والمراجعة، مع بقاء تفسير المتطلبات مسؤولية المؤسسة ومستشاريها.' },
        { question: 'كيف أبدأ بدون ما أوقف استخدام AI في المؤسسة؟', answer: 'ابدأ بتقييم جاهزية قصير يحدد الأدوات والاستخدامات الأعلى خطراً، ثم طبّق ضوابط تدريجية على الحالات الحساسة. الهدف هو توجيه الاستخدام ومراقبته، مع ترك المسارات منخفضة المخاطر تعمل ضمن سياسة واضحة.' },
      ],
      finalTitle: 'خلّ الحوكمة تصير جزءاً من التشغيل اليومي',
      finalText: 'اطلب جلسة ديمو أو تقييم جاهزية ونبني معك صورة أولية عن الاستخدامات والمخاطر والضوابط والأدلة المطلوبة — بدون افتراضات قانونية قبل فهم بيئتك.',
    },
  },
  {
    slug:'ai-firewall', href:'/solutions/ai-firewall/',
    title:'جدار حماية الذكاء الاصطناعي AI Firewall | حماية بيانات العملاء',
    h1:'جدار حماية الذكاء الاصطناعي (AI/LLM Firewall) للمنشآت السعودية',
    description:'جدار حماية الذكاء الاصطناعي AI Firewall يحمي بيانات العملاء قبل وصولها للنموذج ويفرض سياسات الاستخدام على نماذج LLM. تكمل WAF وDLP ولا تدّعي منع كل تسريب.',
    canonical:`${S}/solutions/ai-firewall/`,
    icon:'mdi:shield-half-full', chip:'حماية البيانات',
    shortDesc:'يفحص تفاعلات AI المهيأة وينقّح البيانات الحساسة قبل وصولها للنموذج حسب سياسة مؤسستك.',
    whenNeeded:'من اليوم الأول لاستخدام AI.',
    related:['ai-audit-trail','ai-risk-classification','human-approval-layer'],
    docs:['/docs/ai-firewall/','/docs/pdpl-chatgpt-data-protection/'], blog:['/blog/ai-firewall-why-you-need-it/','/blog/chatgpt-pdpl-data-compliance/','/blog/nca-cybersecurity-requirements-saudi/'], kernel:['/kernel/chat/'],
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
        // (رويغب الفيحاء، الرياض) so the LocalBusiness schema stays valid.
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
    docs:['/docs/pdpl-ai-governance/','/docs/nca-ecc-ai-controls/','/docs/nca-ecc-ai-controls-mapping/','/docs/nca-ecc-ai-governance/','/docs/nca-ecc-ai-guide/'], blog:['/blog/ai-governance-saudi-arabia/','/blog/saudi-ai-regulators-guide/','/blog/sdaia-seven-principles-practical-guide/','/blog/nca-cybersecurity-requirements-saudi/','/blog/nca-ecc-ai-controls-guide/','/blog/ecc-vs-cscc-cybersecurity-controls/','/blog/cloud-cybersecurity-controls-ccc-saudi/','/blog/iso-42001-nca-ecc-saudi/','/blog/sdaia-nca-pdpl-regulatory-map/','/blog/ai-firewall-why-you-need-it/','/blog/ai-red-teaming-security-testing/','/blog/ai-governance-vs-ai-safety-vs-ai-security/','/blog/what-is-ai-governance-saudi-companies/','/blog/best-ai-governance-platforms-2026/','/blog/vision-2030-ai-governance-roadmap/','/blog/iso-42001-saudi-implementation-guide/','/blog/banking-ai-governance-sama-requirements/','/blog/shadow-ai-discovery-saudi-company/','/blog/hidden-ai-risks-saudi-organizations/'],
    regulations: regulationsBySectorSlug['government-ai-governance'],
    faqs: faqsBySectorSlug['government-ai-governance'],
    content: {
      lead: [
        'في الجهات الحكومية السعودية، استخدام الذكاء الاصطناعي في الخدمات الرقمية يتطلب حوكمة متكاملة تواكب متطلبات الهيئة الوطنية للأمن السيبراني (NCA ECC)، هيئة الحكومة الرقمية (DGA)، وسدايا (SDAIA). BrightAI يساعد الجهات الحكومية على بناء طبقة حوكمة تضبط استخدامات AI وتوثّق الامتثال للجهات الإشرافية وتحمي بيانات المستفيدين.',
        'حوكمة الذكاء الاصطناعي في الجهات الحكومية مو وثيقة PDF؛ هي طبقة تشغيلية يومية تربط الموظف الحكومي بالنموذج بالبيانات بالموافقة البشرية. معايير NCA ECC تفرض 114 ضابطاً أساسياً تشمل إدارة الهوية، حماية البيانات، المراقبة والتسجيل، وإدارة الأطراف الخارجية.',
      ],
      sections: [
        {
          title: 'عنقود NCA ECC الشامل — 8 أدلة ومقالات عن ضوابط الأمن السيبراني',
          intro: 'هذا العنقود التنظيمي يغطي كل زاوية من زوايا تطبيق ضوابط NCA على الذكاء الاصطناعي في الجهات الحكومية والقطاعات الحيوية. كل صفحة تستهدف نية بحث مختلفة لتسهيل الوصول للمعلومة المناسبة للمسؤول.',
          cards: [
            { title: '1. الدليل الشامل لضوابط NCA ECC على AI', text: 'يشرح بالتفصيل المحاور الخمسة لـ ECC (الحوكمة، الحماية، الكشف، الاستجابة، الاستعادة) مع جداول ربط لكل ضابط بحالة استخدام AI. اقرأ <a href="/docs/nca-ecc-ai-controls/">الدليل الشامل NCA ECC والذكاء الاصطناعي</a>.' },
            { title: '2. الهيئة الوطنية للأمن السيبراني ومتطلباتها', text: 'دليل تعريفي بالهيئة وأدوارها والمحاور الخمسة لضوابط ECC وتاريخها وتطورها وصلاحياتها الرقابية. اقرأ <a href="/blog/nca-cybersecurity-requirements-saudi/">دليل NCA الكامل</a>.' },
            { title: '3. ضوابط الأمن السيبراني الأساسية وتطبيقها على AI', text: 'مقال تشغيلي يشرح الحوكمة والوصول والبيانات والمراقبة لمديري الجهات الحكومية، مع 5 خطوات عملية لتطبيق ECC على AI. اقرأ <a href="/blog/nca-ecc-ai-controls-guide/">دليل التطبيق العملي</a>.' },
            { title: '4. ECC vs CSCC — اختيار الضوابط الصحيحة', text: 'مقارنة بين ضوابط ECC للجهات العامة وCSCC للقطاعات الحساسة مع 3 سيناريوهات عملية من السوق السعودي. اقرأ <a href="/blog/ecc-vs-cscc-cybersecurity-controls/">مقارنة الضوابط</a>.' },
            { title: '5. خريطة ربط NCA ECC مع AI', text: 'جدول عملي يربط كل متطلب أمني بضابط BrightAI وخطر AI المقابل — أداة للفرق التقنية في الجهات الحكومية. اقرأ <a href="/docs/nca-ecc-ai-controls-mapping/">خريطة ربط الضوابط</a>.' },
            { title: '6. حوكمة AI وفق NCA ECC', text: 'يربط فرق الأمن بالعمليات التشغيلية ويعرض أثر الضابط على أرض الواقع، مع أمثلة سعودية من الجهات الحكومية. اقرأ <a href="/docs/nca-ecc-ai-governance/">دليل الحوكمة التنفيذي</a>.' },
            { title: '7. خطة 90 يوماً لتطبيق NCA ECC على AI', text: 'خطة تنفيذ تدريجية تشمل AI Gateway، سجلات التدقيق، إدارة الموردين، واختبار الهجمات مثل prompt injection. اقرأ <a href="/docs/nca-ecc-ai-guide/">خطة الـ 90 يوم</a>.' },
            { title: '8. ضوابط الأمن السيبراني للحوسبة السحابية CCC', text: 'تغطية ضوابط DCC وCCC للجهات الحكومية التي تستخدم الحوسبة السحابية لأنظمة AI، مع متطلبات سيادة البيانات والتشفير. اقرأ <a href="/blog/cloud-cybersecurity-controls-ccc-saudi/">دليل CCC</a>.' },
          ],
        },
        {
          title: 'المتطلبات التنظيمية للجهات الحكومية — DGA وSDAIA وNCA ECC',
          intro: 'الجهات الحكومية السعودية تخضع لثلاث منظومات تنظيمية رئيسية عند استخدام الذكاء الاصطناعي. فهم كل منها والتكامل بينها ضروري لبناء حوكمة سليمة.',
          cards: [
            { title: 'هيئة الحكومة الرقمية (DGA)', text: 'تتولى DGA تنظيم التحول الرقمي في الجهات الحكومية ووضع المعايير للخدمات الرقمية. حوكمة AI في الخدمات الرقمية الحكومية يجب أن تتوافق مع معايير DGA للجودة والأمان وتجربة المستفيد. BrightAI يساعد في توثيق استخدامات AI في الخدمات الرقمية وتوليد تقارير جاهزة لمراجعات DGA.' },
            { title: 'سدايا (SDAIA)', text: 'سدايا هي المرجع الوطني الأعلى للذكاء الاصطناعي والبيانات. أصدرت إرشادات للذكاء الاصطناعي التوليدي ومبادئ أخلاقية سبعة. الجهات الحكومية يجب أن تلتزم بهذه الإرشادات بالتزامن مع ضوابط NCA ECC. المبادئ السبعة تغطي الشفافية والمسؤولية والخصوصية والأمان والإنصاف.' },
            { title: 'ضوابط NCA ECC', text: 'ضوابط الأمن السيبراني الأساسية (ECC) هي الحد الأدنى الإلزامي للأمن السيبراني في الجهات الحكومية. تضم 114 ضابطاً في خمسة محاور: الحوكمة الإستراتيجية، التعزيز، الإدارة، الدفاع، والامتثال. كل استخدام AI في الجهة الحكومية يخضع لهذه الضوابط كاملة.' },
          ],
        },
        {
          title: 'ضوابط NCA ECC — التفصيل التشغيلي للجهات الحكومية',
          intro: 'ضوابط ECC الـ 114 تنطبق على كل نظام AI في الجهة الحكومية. إليك كيف يترجم كل محور إلى إجراءات عملية لحوكمة الذكاء الاصطناعي.',
          cards: [
            { title: 'محور الحوكمة: إطار المسؤولية', text: 'يحدد من يملك سياسة AI في الجهة الحكومية، من يعتمد الموردين، ومن يقبل المخاطر. يتطلب تعيين مسؤول حوكمة AI (AI Governance Officer) أو دمج المهام مع CISO. توثيق القرارات وسجل الموافقات يكون في Evidence File جاهز للمراجعة.' },
            { title: 'محور الحماية: البيانات والبنية التحتية', text: 'تصنيف البيانات حسب حساسيتها قبل إدخالها لأي نموذج AI، تطبيق مبدأ Least Privilege على صلاحيات الوصول، تشفير البيانات أثناء النقل والتخزين. جدار حماية AI (AI Firewall) يفحص كل استعلام قبل وصوله للنموذج ويمنع تسرب البيانات الحساسة.' },
            { title: 'محور الكشف: المراقبة والتسجيل', text: 'كل استعلام AI يُسجّل في سجل تدقيق غير قابل للتعديل (Audit Trail) يشمل: هوية المستخدم، وقت الطلب، نوع البيانات، النموذج المستخدم، نتيجة فحص المحتوى، وأي موافقة بشرية. هذه السجلات تثبت الامتثال أمام المدققين.' },
            { title: 'محور الاستجابة: خطة التعامل مع الحوادث', text: 'يجب أن تتضمن خطة الاستجابة للحوادث سيناريوهات خاصة بـ AI: هجوم حقن prompt، تسريب بيانات عبر النموذج، أو استخدام غير مصرح به. يتم اختبار الخطة سنوياً عبر تمارين محاكاة.' },
            { title: 'محور الاستعادة: استمرارية الخدمة', text: 'خطة بديلة عند تعطل مزود النموذج السحابي، نسخ احتياطية لإعدادات الحوكمة، وقدرة على تحويل حركة المرور لنموذج بديل أو ردود ثابتة مؤقتة.' },
          ],
        },
        {
          title: 'الفرق بين ECC وCSCC وCCC وDCC للجهات الحكومية',
          intro: 'الهيئة الوطنية للأمن السيبراني أصدرت أربعة أنواع من الضوابط. فهم الفرق بينها يحدد مستوى الامتثال المطلوب لكل جهة حكومية.',
          cards: [
            { title: 'ECC — الضوابط الأساسية', text: 'إلزامي لجميع الجهات الحكومية والقطاعات الحيوية الـ 16. يضم 114 ضابطاً في 5 محاور. يشمل أنظمة AI بشكل كامل.' },
            { title: 'CSCC — القطاعات الحساسة', text: 'ضوابط إضافية مشددة للقطاعات ذات الأثر العالي (الصحة، الطاقة، البنوك). تضم 32 ضابطاً إضافياً تركز على فصل الشبكات وأمن سلسلة التوريد.' },
            { title: 'CCC — أنظمة التحكم الصناعي', text: 'لأنظمة OT وSCADA في الجهات التي تدير بنية تحتية حرجة. أنظمة AI الصناعية تخضع لهذه الضوابط.' },
            { title: 'DCC — الحوسبة السحابية', text: 'لأي جهة تستخدم الحوسبة السحابية. يشمل تشفير البيانات، سيادة البيانات (عدم خروجها من المملكة)، وتقييم مزودي الخدمة السحابية.' },
          ],
        },
        {
          title: 'خطوات عملية لتطبيق حوكمة AI في الجهات الحكومية',
          intro: 'خمس خطوات عملية تبدأ بها أي جهة حكومية لبناء برنامج حوكمة AI متكامل ومتوافق مع NCA ECC.',
          paragraphs: [
            'الخطوة الأولى — جرد استخدامات AI: احصر كل أداة ونموذج وواجهة AI مستخدمة في الجهة (سواء رسمية أو Shadow AI). لكل استخدام حدد: نوعه، البيانات التي يلمسها، درجة الحساسية، المالك، والمزود.',
            'الخطوة الثانية — تصنيف المخاطر: صَنِّف كل استخدام AI حسب: نوع البيانات (شخصية، سرية، عامة)، تأثير المخرجات (توصية، قرار آلي، محتوى توعوي)، ومصدر النموذج (داخلي، سحابي عام، مخصص). استخدام <a href="/solutions/ai-risk-classification/">تصنيف مخاطر الذكاء الاصطناعي</a> يساعد في أتمتة هذه العملية.',
            'الخطوة الثالثة — تطبيق الضوابط التقنية: ابدأ بجدار حماية AI (AI Firewall) لمنع تسرب البيانات الحساسة، سجل تدقيق (Audit Trail) لتوثيق كل استخدام، وطبقة موافقة بشرية (Human Approval) للقرارات عالية الأثر. <a href="/solutions/ai-governance-platform/">منصة الحوكمة الشاملة</a> تجمع هذه الأدوات في منظومة واحدة.',
            'الخطوة الرابعة — توثيق الأدلة: أنشئ Evidence File يوثق: سياسات الحوكمة، سجلات التدقيق، تصنيف المخاطر، الموافقات البشرية، نتائج اختبارات الأمان، وتقارير المراجعة الدورية. <a href="/solutions/ai-evidence-file/">ملف أدلة جاهز للتدقيق</a> يصدر PDF موقّعاً رقمياً بنقرة واحدة.',
            'الخطوة الخامسة — المراجعة المستمرة: جدول مراجعة دورية (كل 90 يوماً) لتحديث تصنيف المخاطر، مراجعة سجلات التدقيق، تقييم الموردين، وتحديث السياسات حسب تغير الضوابط التنظيمية.',
          ],
        },
        {
          title: 'حالة تطبيقية: جهة حكومية سعودية تطبق حوكمة AI وفق NCA ECC',
          intro: 'سيناريو توضيحي لجهة حكومية سعودية في قطاع الخدمات الرقمية تبدأ رحلة حوكمة الذكاء الاصطناعي لتلبية متطلبات DGA وNCA ECC وPDPL.',
          cards: [
            { title: 'التحدي', text: 'جهة حكومية تستخدم مساعداً ذكياً لخدمة المستفيدين ومساعداً داخلياً للموظفين. الموظفون كانوا يلصقون بيانات مستفيدين حساسة في أدوات AI عامة بدون رقابة، مما عرض الجهة لخطر تسريب معلومات شخصية (PDPL) ومخالفة ضوابط NCA ECC.' },
            { title: 'الحل', text: 'ركبت الجهة BrightAI كطبقة حوكمة وسيطة بين المستخدمين والنماذج. AI Firewall يفحص كل استعلام ويخفي المعرفات الشخصية. Audit Trail يسجل كل عملية مع تصنيف المخاطر. Human Approval يُفعّل للقرارات عالية التأثير. Evidence File ينتج شهرياً.' },
            { title: 'النتيجة', text: 'جاهزية امتثال موثّقة لمتطلبات DGA وNCA ECC وPDPL: انخفاض ملحوظ في محاولات إدخال بيانات حساسة للنماذج غير المصرح بها، وأدلة جاهزة للمراجعة الرقابية.' },
          ],
        },
        {
          title: 'الربط مع عنقود SDAIA — المبادئ السبعة وإرشادات AI التوليدي',
          intro: 'بالإضافة إلى NCA ECC، الجهات الحكومية تلتزم بإرشادات سدايا (SDAIA) للذكاء الاصطناعي التوليدي والمبادئ السبعة لأخلاقيات AI.',
          cards: [
            { title: 'المبادئ السبعة لسدايا', text: 'تغطي الشفافية، العدالة، المسؤولية، الخصوصية، الأمان، الموثوقية، والرقابة البشرية. اقرأ <a href="/blog/sdaia-seven-principles-practical-guide/">الدليل العملي للمبادئ السبعة</a> لتطبيقها في الجهات الحكومية.' },
            { title: 'إرشادات AI التوليدي من سدايا', text: 'تغطي: الشفافية في استخدام AI التوليدي، حماية البيانات، الإفصاح للمستفيدين عند التفاعل مع AI. اقرأ <a href="/blog/sdaia-generative-ai-guidelines-practical-compliance/">دليل الامتثال لإرشادات سدايا</a>.' },
            { title: 'خارطة الطريق مع رؤية 2030', text: 'تكامل حوكمة AI مع مستهدفات التحول الرقمي في رؤية 2030 يتطلب حوكمة رقمية مرنة وقابلة للتطوير. اقرأ <a href="/blog/vision-2030-ai-governance-roadmap/">خارطة طريق حوكمة AI ورؤية 2030</a>.' },
          ],
        },
        {
          title: 'الأسئلة الشائعة عن ضوابط NCA ECC في الجهات الحكومية',
          intro: 'أكثر الأسئلة تداولاً بين مسؤولي الحوكمة في القطاع الحكومي السعودي.',
          cards: [
            { title: 'هل ضوابط NCA ECC إلزامية لكل جهة حكومية؟', text: 'نعم. ضوابط ECC إلزامية لجميع الجهات الحكومية والتابعة لها والقطاعات الحيوية. أي جهة تستخدم الذكاء الاصطناعي تطبق الضوابط كاملة دون استثناء.' },
            { title: 'كيف نوفق بين متطلبات DGA وNCA ECC وSDAIA؟', text: 'الجهات الثلاث تكمل بعضها. DGA تركز على الخدمات الرقمية، NCA على الأمن السيبراني، وSDAIA على حوكمة البيانات والذكاء الاصطناعي. المنصة من BrightAI تجمع التوثيق للجهات الثلاث في Evidence File واحد.' },
            { title: 'كم يستغرق تطبيق حوكمة AI في جهة حكومية؟', text: 'المرحلة الأولى (الجرد والتصنيف والسياسات) تستغرق 4-8 أسابيع. التطبيق التقني لأول حالة استخدام (AI Firewall + Audit Trail) يستغرق 2-4 أسابيع إضافية. كل حالة استخدام جديدة تضاف بعد ذلك بدون إعادة بناء.' },
            { title: 'هل نحتاج مستشار خارجي لتطبيق NCA ECC؟', text: 'بعض الجهات تستعين بمستشارين للتقييم الأولي وبناء الإطار. BrightAI يقدم أدوات تشغيلية تطبق الضوابط آلياً بعد تحديد السياسات. الاستشارة القانونية والتنظيمية تبقى مسؤولية الجهة ومستشاريها.' },
            { title: 'كيف نثبت الامتثال لـ NCA عند التدقيق السنوي؟', text: 'Evidence File من BrightAI يجمع: سجل أصول AI، سياسات الحوكمة، سجلات التدقيق، تقارير المخاطر، عقود الموردين، ونتائج اختبارات الاختراق. الملف قابل للتصدير PDF موقّع حسب الفترة المطلوبة.' },
          ],
        },
      ],
      faqs: [
        { question: 'ما الفرق بين حوكمة AI وإدارة مخاطر AI في الجهة الحكومية؟', answer: 'حوكمة AI هي الإطار التنظيمي الشامل: السياسات، الأدوار، المسؤوليات، والعمليات التي تضبط استخدام AI. إدارة مخاطر AI هي جزء من الحوكمة تركز على تحديد وتقييم ومعالجة المخاطر المحددة لكل حالة استخدام. حوكمة AI بدون إدارة مخاطر تكون نظرية، وإدارة مخاطر بدون حوكمة تكون غير مستدامة.' },
        { question: 'هل أحتاج تطبيق ضوابط NCA ECC على كل أداة AI في الجهة؟', answer: 'نعم. كل أداة أو نموذج أو واجهة AI تستخدم في الجهة الحكومية تخضع لضوابط ECC بغض النظر عن مصدرها (داخلي، سحابي، تجاري). الأدوات غير المعتمدة (Shadow AI) تحتاج جرداً وإما اعتماداً مع ضوابط أو إغلاقاً.' },
        { question: 'كيف نتعامل مع النماذج الخارجية مثل ChatGPT وClaude؟', answer: 'استخدام النماذج الخارجية يخضع لضابط ECC-10 (إدارة الأطراف الخارجية). يتطلب: تقييم Due Diligence للمزود، التأكد من مكان تخزين البيانات (أفضلية داخل السعودية)، اتفاقية مستوى خدمة (SLA) تغطي الأمن، وتطبيق ضوابط حماية البيانات قبل إرسال أي معلومات.' },
        { question: 'هل حوكمة AI تبطئ الابتكار في الجهة الحكومية؟', answer: 'التجربة تظهر العكس. الجهات اللي طبقت الحوكمة من البداية كانت أكثر جرأة في التوسع لأنها تثق في ضوابطها. الجهات اللي ما عندها حوكمة تتردد في إطلاق خدمات AI خوفاً من العواقب التنظيمية.' },
        { question: 'ما العلاقة بين حوكمة AI وPDPL في الجهات الحكومية؟', answer: 'PDPL يحمي البيانات الشخصية للمستفيدين، وحوكمة AI تطبق ضوابط عملية تمنع تسرب هذه البيانات عبر النماذج الذكية. تكامل الاثنين ضروري لأي جهة حكومية تتعامل مع بيانات المواطنين والمقيمين.' },
        { question: 'هل يغطي BrightAI متطلبات DGA للخدمات الرقمية؟', answer: 'يدعم BrightAI جاهزية متطلبات DGA عبر توثيق استخدامات AI في الخدمات الرقمية، توليد سجلات تدقيق لكل تفاعل مع المستفيد، وإنتاج تقارير جاهزة لمراجعات DGA. هذا لا يستبدل التقييم الرسمي لـ DGA بل يسرّع الجاهزية له.' },
      ],
      finalTitle: 'ابدأ رحلة حوكمة AI في جهتك الحكومية اليوم',
      finalText: 'فريق BrightAI جاهز لفهم بيئة AI في جهتك الحكومية وتصميم مسار حوكمة تشغيلي مناسب وفق متطلبات DGA وSDAIA وNCA ECC وPDPL. احجز جلسة تقييم مجانية لبدء رحلة الامتثال.',
    },
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
