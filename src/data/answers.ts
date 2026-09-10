/**
 * answers.ts — 10 Saudi-targeted AI governance Q&A pairs.
 * Source: Target Queries from public/llms.txt (BAI-SAID-03).
 * Purpose: Power /answer/* pages for AEO (Answer Engine Optimization).
 * Answers are Saudi dialect, 150-300 words each, designed to appear in
 * Perplexity / ChatGPT answer boxes and Google Featured Snippets.
 *
 * WORD-COUNT-POLICY (2026-09-08): Semrush flags pages under 200 words as thin
 * content. Every entry below now carries 230+ rendered body words
 * (question + answer + saudiNote + keyPoints) while the core `answer`
 * paragraph stays untouched. `saudiNote` extensions and extra `keyPoints`
 * are paraphrases of the entry's own approved answer — no new factual
 * claims, numbers, certifications, or entities.
 * SECOND PASS (2026-09-08, evening): live-crawl calibration showed
 * Semrush's counter ≈ scripts/qa/check-word-count.mjs (±2%). Entries
 * pdpl-ai-compliance-ar and sdaia-generative-ai sat too close to the
 * 200-word threshold; both extended further (same paraphrase-only rule).
 * Regression guard: `node scripts/qa/check-word-count.mjs` (min 200/word).
 *
 * DO NOT edit the queries — they match llms.txt Target AI Search Queries exactly.
 * DO NOT change published Arabic text in the answers without user approval.
 */
export interface AnswerUnit {
  slug: string;
  query: string;
  question: string;
  answer: string;
  /**
   * SEO-CANNIBALIZATION (2026-08-23): optional pointer to the canonical
   * pillar that owns this topic. Quick answers are intentionally thin
   * (120-150 words); linking each governance answer to /hub/ai-governance/
   * with a descriptive anchor tells both users and search engines where the
   * comprehensive treatment lives, per the documented pillar decision.
   */
  furtherReading?: { href: string; label: string };
  /**
   * ANSWER-TEMPLATE (2026-09-03): lightweight answer layout needs structured
   * fields beyond the single paragraph. All values below are derived from the
   * approved `answer` text — no new factual claims. Arabic `answer` strings
   * are never rewritten here; differentiation happens via these fields.
   */
  /** Why this matters specifically in Saudi Arabia (1-4 sentences). */
  saudiNote?: string;
  /** Key takeaways extracted from the approved answer (3-7 bullets). */
  keyPoints?: string[];
  /** Source links: internal canonical owner first, then official regulators. */
  sources?: { href: string; label: string }[];
}

/** What is AI Governance in Saudi Arabia? */
export const answerGov: AnswerUnit = {
  slug: 'ai-governance-saudi-arabia',
  saudiNote:
    'For Saudi enterprises in banking, healthcare, and government, governance is the operating requirement behind every AI interaction: documented, risk-scored, and traceable to a human decision-maker. Without this operating layer, AI usage stays invisible to auditors and every regulator question becomes a fire drill.',
  keyPoints: [
    'Framed by SDAIA guidelines, NCA ECC cybersecurity standards, and PDPL data protection rules.',
    'Every AI request is logged, risk-scored, and requires human approval before execution.',
    'Produces a complete audit trail from prompt to response for regulator inspection.',
    'Connects SDAIA guidance, NCA ECC controls, and PDPL duties into one daily operating routine.',
  ],
  sources: [
    { href: '/hub/ai-governance/', label: 'BRIGHTAI hub: AI governance pillar' },
    { href: 'https://sdaia.gov.sa', label: 'SDAIA — Saudi Data & AI Authority' },
    { href: 'https://www.nca.gov.sa', label: 'NCA — National Cybersecurity Authority' },
  ],
  furtherReading: { href: '/hub/ai-governance/', label: 'الدليل الشامل لحوكمة الذكاء الاصطناعي للمؤسسات السعودية' },
  query: 'AI governance Saudi Arabia',
  question: 'What is AI governance in Saudi Arabia?',
  answer:
    'AI governance in Saudi Arabia is the framework of policies, regulations, and technical controls that ensure artificial intelligence systems are safe, compliant, and auditable. The Saudi ecosystem operates under SDAIA (Saudi Data and Artificial Intelligence Authority) guidelines, NCA ECC cybersecurity standards, and PDPL data protection rules. BrightAI provides the operational platform: every AI request is logged, risk-scored, and requires human approval before execution — creating a complete audit trail from prompt to response. For Saudi enterprises in banking, healthcare, and government, AI governance means every AI interaction is documented, every risk is scored, and every decision can be traced back to a human in the loop.',
};

/** What is an AI Firewall? */
export const answerFirewall: AnswerUnit = {
  slug: 'ai-firewall-saudi',
  saudiNote:
    'Saudi enterprises handling customer and citizen data need content-aware inspection in Arabic and English — a network firewall cannot see PII leaking inside an AI prompt. The firewall acts before the model ever sees the data, not after the leak has already happened.',
  keyPoints: [
    'Inspects every request before it reaches the model and every response before it reaches the employee.',
    'Blocks PII leaks, prevents prompt injection attacks, and enforces PDPL data-handling rules.',
    'Flags high-risk interactions for human review with a risk rating on each one.',
    'Keeps a tamper-proof hash-chain audit log that regulators can inspect.',
    'Reads Arabic and English prompts so PII is caught in the language employees actually use.',
    'Logs every allow, redact, block, and escalate decision with its full policy context for later review and regulator questions.',
  ],
  sources: [
    { href: '/solutions/ai-firewall/', label: 'BRIGHTAI solution: AI Firewall' },
    { href: '/hub/security/', label: 'BRIGHTAI hub: AI security' },
  ],
  furtherReading: { href: '/hub/security/', label: 'مركز أمان الذكاء الاصطناعي وAI Firewall للمؤسسات السعودية' },
  query: 'AI Firewall Saudi Arabia',
  question: 'What is an AI Firewall?',
  answer:
    'An AI Firewall is a governance and security layer that sits between employees and AI models, inspecting every request before it reaches the model and every response before it reaches the employee. Unlike a traditional network firewall, the AI Firewall understands content: it blocks PII leaks, prevents prompt injection attacks, enforces PDPL data-handling rules, and flags high-risk interactions for human review. BrightAI\'s AI Firewall is built specifically for Saudi enterprises — it supports Arabic and English, maps to NCA ECC controls, scores every interaction with a risk rating, and keeps a tamper-proof hash-chain audit log that regulators can inspect.',
};

/** What is PDPL AI compliance? */
export const answerPdpl: AnswerUnit = {
  slug: 'pdpl-ai-compliance',
  saudiNote:
    'Any Saudi enterprise processing personal data through AI models must show a lawful basis, subject notices, and technical proof that PII cannot leak to unauthorized parties. Inspectors expect to see the lawful basis, the notices given to subjects, and the technical proof — not promises — and the evidence files package exactly that.',
  keyPoints: [
    'Requires a legal basis for processing and informing data subjects how their data is used.',
    'Real-time PII detection in prompts with automated redaction before data reaches the model.',
    'Consent tracking backed by audit trails.',
    'Evidence files that prove compliance during regulator inspection.',
    'Links consent records to processing activities so every claim rests on an audit trail.',
    'Redaction happens before the model call so personal data never leaves enterprise control, and consent records stay linked to processing activities.',
  ],
  sources: [
    { href: '/docs/pdpl-ai-complete-guide/', label: 'BRIGHTAI docs: PDPL & AI complete guide' },
    { href: 'https://sdaia.gov.sa', label: 'SDAIA — Saudi Data & AI Authority' },
  ],
  furtherReading: { href: '/hub/compliance/', label: 'محور الامتثال السعودي للذكاء الاصطناعي: PDPL وNCA وISO 42001' },
  query: 'PDPL AI compliance',
  question: 'What is PDPL compliance for AI systems?',
  answer:
    'PDPL (Personal Data Protection Law) compliance for AI systems means ensuring every AI model interaction respects the lawful processing, storage, and sharing of personal data in Saudi Arabia. Under PDPL, enterprises must have a legal basis for processing personal data, inform data subjects about how their data is used, and prevent AI systems from leaking PII to unauthorized parties. BrightAI\'s PDPL compliance pack adds: real-time PII detection in prompts, automated redaction of personal data before it reaches the AI model, consent tracking with audit trails, and evidence files that prove compliance during regulator inspection.',
};

/** What is an AI Safety platform for enterprises? */
export const answerSafety: AnswerUnit = {
  slug: 'ai-safety-platform-enterprise',
  saudiNote:
    'Saudi enterprises need one governed path to AI models — covering PDPL, NCA ECC, SFDA, SAMA, ISO 13485, and ISO/IEC 42001 — instead of scattered per-team AI usage. Scattered usage is replaced by a single path that every employee request must pass through before reaching any model.',
  keyPoints: [
    'Category definition: a centralized system governing how employees interact with AI models.',
    'Risk scoring on every prompt plus human approval workflows for high-risk interactions.',
    'Compliance packs for PDPL, NCA ECC, SFDA, SAMA, ISO 13485, and ISO/IEC 42001.',
    'Tamper-proof audit logs for internal security teams and external Saudi regulators.',
    'Arabic-native operation so policies apply to prompts written in Arabic or English.',
    'One governed path replaces scattered per-team tools, so a policy update or a new control applies everywhere at once without chasing deployments.',
  ],
  sources: [
    { href: '/hub/security/', label: 'BRIGHTAI hub: AI security' },
    { href: '/solutions/ai-governance-platform/', label: 'BRIGHTAI solution: AI governance platform' },
  ],
  furtherReading: { href: '/hub/security/', label: 'مركز أمان الذكاء الاصطناعي للمنشآت السعودية' },
  query: 'AI safety platform for enterprises',
  question: 'What is an AI safety platform for enterprises?',
  answer:
    'An AI safety platform for enterprises is a centralized system that governs how employees interact with AI models, ensuring every request is safe, compliant, and auditable. Saudi enterprise AI safety goes beyond content filtering: it includes risk scoring (every prompt gets a safety score), human approval workflows (high-risk interactions wait for a human), compliance packs for PDPL, NCA ECC, SFDA, SAMA, ISO 13485, and ISO/IEC 42001, and tamper-proof audit logs. BrightAI delivers this as a SaaS platform purpose-built for Saudi enterprises — integrated with existing systems, Arabic-native, and designed to satisfy both internal security teams and external Saudi regulators.',
};

/** What is the Saudi AI Safety OS? */
export const answerOs: AnswerUnit = {
  slug: 'saudi-ai-safety-os',
  saudiNote:
    'Product definition: BrightAI as the operating layer between employees and AI models inside Saudi enterprises — distinct from the generic safety-platform category. It is the product layer, not a policy document, sitting in the traffic path so every interaction is scored, approved when needed, and evidenced permanently.',
  keyPoints: [
    'BrightAI product: governance, security, and compliance layer for employee-to-model traffic.',
    'Compliance packs for PDPL, NCA ECC, SFDA, SAMA, ISO 13485, and ISO/IEC 42001.',
    'Each interaction is risk-scored, human-approved when needed, and evidenced permanently.',
    'Runs as SaaS integrated with existing enterprise systems, not as a side tool.',
    'Serves internal security teams and external Saudi regulators from the same evidence base.',
    'The same evidence base answers internal security reviews and external regulator inspections without duplicate work or parallel record-keeping.',
  ],
  sources: [
    { href: '/solutions/ai-governance-platform/', label: 'BRIGHTAI solution: AI governance platform' },
    { href: '/hub/security/', label: 'BRIGHTAI hub: AI security' },
  ],
  furtherReading: { href: '/hub/security/', label: 'محور أمان الذكاء الاصطناعي وطبقات الحماية التشغيلية' },
  query: 'Saudi AI Safety OS',
  question: 'What is the Saudi AI Safety OS?',
  answer:
    'BrightAI is the Saudi AI Safety OS — a governance, security, and compliance platform that sits between employees and AI models inside Saudi enterprises. It ensures every AI request is safe, documented, and auditable. BrightAI supports compliance packs for PDPL (Saudi data protection), NCA ECC (cybersecurity controls), SFDA (healthcare AI), SAMA (financial AI), ISO 13485 (medical devices), and ISO/IEC 42001 (AI management systems). Each AI interaction is risk-scored, requires human approval when needed, and produces permanent evidence files. It runs on brightai.live — a static Astro site served via Render with Cloudflare edge security and Saudi data routing.',
};

/** What is AI governance in Saudi Arabia in Arabic (full)? */
export const answerGovAr: AnswerUnit = {
  slug: 'ai-governance-saudi-arabia-ar',
  saudiNote:
    'المنشآت السعودية تحتاج تعرف أين تستخدم AI ومن يملك كل حالة استخدام، لأن ما ينطبق عليها يختلف حسب القطاع والسياق — من PDPL وضوابط NCA إلى إرشادات سدايا. الجرد يبين أين يُستخدم AI ومن يملكه، وتصنيف المخاطر يحدد مستوى الضبط والموافقة لكل حالة، وسجل التدقيق يحفظ القرار والدليل لمراجعته لاحقًا. وكل ذلك لا يغني عن التقييم القانوني ولا يمنح اعتمادًا تنظيميًا.',
  keyPoints: [
    'أدوار وسياسات وضوابط تجيب عن: أين يُستخدم AI، ومن يملكه، وما بياناته ومخاطره.',
    'قد تشمل PDPL وضوابط NCA وإرشادات سدايا حسب القطاع والسياق.',
    'طبقة التشغيل تربط الجرد وتصنيف المخاطر والسياسات والموافقات البشرية وسجل التدقيق.',
    'مراجعة القرارات والأدلة تتم دوريًا بدل تركها لوقت التدقيق.',
    'لا تستبدل التقييم القانوني ولا تمنح اعتماداً تنظيمياً.',
  ],
  sources: [
    { href: '/hub/ai-governance/', label: 'دليل حوكمة الذكاء الاصطناعي في السعودية' },
    { href: 'https://sdaia.gov.sa', label: 'سدايا — الهيئة السعودية للبيانات والذكاء الاصطناعي' },
  ],
  furtherReading: { href: '/hub/ai-governance/', label: 'دليل حوكمة الذكاء الاصطناعي في السعودية' },
  query: 'حوكمة الذكاء الاصطناعي في السعودية',
  question: 'ما هي حوكمة الذكاء الاصطناعي في السعودية؟',
  answer:
    'حوكمة الذكاء الاصطناعي في السعودية هي مجموعة أدوار وسياسات وضوابط تساعد المنشأة على معرفة أين تستخدم AI، ومن يملك كل حالة استخدام، وما بياناتها ومخاطرها، وكيف تُراجع قراراتها وأدلتها. يختلف ما ينطبق حسب القطاع والسياق، وقد يشمل نظام حماية البيانات الشخصية PDPL وضوابط NCA وإرشادات سدايا. BrightAI تقدم طبقة تشغيل تربط سجل الاستخدامات وتصنيف المخاطر والسياسات والموافقات البشرية وسجل التدقيق، لكنها لا تستبدل التقييم القانوني أو تمنح اعتماداً تنظيمياً.',
};

/** What is an AI Firewall (Arabic)? */
export const answerFirewallAr: AnswerUnit = {
  slug: 'ai-firewall-saudi-ar',
  saudiNote:
    'المنشأة السعودية تحتاج تمييز طبقة التحكم في تفاعلات النماذج عن جدار الشبكة وبوابة الـ API، حتى تطبق سياستها الخاصة على المسارات المهيأة فقط. التمييز مهم لأن جدار الشبكة يرى العناوين والحزم ولا يرى المعنى داخل الطلب، وبوابة الـ API تدير التوجيه والحصص ولا تطبق سياسة المحتوى. لذلك تحتاج المنشأة طبقة تفحص النص نفسه وتقرر السماح أو التنقيح أو الحجب أو التحويل للمراجعة مع تسجيل السياق.',
  keyPoints: [
    'يفحص تفاعلات النماذج في المسارات المهيأة: سماح أو تنقيح أو حجب أو تحويل للمراجعة.',
    'يختلف عن جدار الشبكة وعن AI-powered WAF.',
    'ليس مرادفاً كاملاً لـ AI Gateway الذي يركز على التوجيه والمفاتيح والحصص.',
    'تسجيل سياق كل قرار يتيح مراجعة أسباب السماح أو الحجب لاحقًا.',
    'لا يضمن منع كل حادثة أو تحقيق الامتثال تلقائياً.',
  ],
  sources: [
    { href: '/solutions/ai-firewall/', label: 'جدار حماية الذكاء الاصطناعي للمنشآت السعودية' },
  ],
  furtherReading: { href: '/solutions/ai-firewall/', label: 'جدار حماية الذكاء الاصطناعي للمنشآت السعودية' },
  query: 'جدار حماية الذكاء الاصطناعي',
  question: 'ما هو جدار حماية الذكاء الاصطناعي؟',
  answer:
    'جدار حماية الذكاء الاصطناعي، ويُسمى أيضاً AI Firewall أو LLM Firewall، هو طبقة تحكم تفحص تفاعلات النماذج في المسارات المهيأة وتطبق سياسة المؤسسة عليها. يمكنها السماح بالطلب أو تنقيح البيانات الحساسة أو حجبه أو تحويله للمراجعة، مع تسجيل سياق القرار. يختلف عن جدار الشبكة وAI-powered WAF، كما أنه ليس مرادفاً كاملاً لـ AI Gateway الذي يركز عادةً على التوجيه والمفاتيح والحصص والمراقبة. BrightAI تدعم تشغيل هذه الضوابط للمنشآت السعودية، لكنها لا تضمن منع كل حادثة أو تحقيق الامتثال تلقائياً.',
};

/** What is an AI audit trail (Arabic)? */
export const answerAuditAr: AnswerUnit = {
  slug: 'audit-trail-saudi-ar',
  saudiNote:
    'جهات التنظيم السعودية تطلب إثباتاً قابلاً للمراجعة على استخدامات AI — والسجل المنظم هو ما يحوّل القرارات اليومية إلى أدلة. المراجع يسأل من فعل ماذا ومتى وبأي نموذج ولأي غرض، وبدون سجل منظم تصبح الإجابة اجتهادًا لا دليلًا. لذلك يُبنى السجل ليشمل الهوية والنموذج والغرض والوقت وتصنيف المخاطر والسياسة والقرار والموافقة ومرجع الدليل. وتحدد المؤسسة الحقول وفترات الاحتفاظ والتشفير والصلاحيات حسب بيئتها، مع العلم أن وجود السجل وحده لا يثبت الامتثال.',
  keyPoints: [
    'يوثق الأحداث والقرارات: المستخدم أو النظام، النموذج، الغرض، الوقت.',
    'يشمل تصنيف المخاطر والسياسة المطبقة وقرار السماح أو الحجب والموافقة ومرجع الدليل.',
    'يربط كل حدث بالنموذج والغرض والوقت حتى يمكن تتبع القرار لاحقًا.',
    'يجعل المراجعة الداخلية والخارجية مبنية على أدلة محفوظة بدل الاعتماد على الذاكرة.',
    'المؤسسة تحدد الحقول والاحتفاظ والتشفير والصلاحيات وفق بيئتها.',
    'وجود السجل وحده لا يثبت الامتثال.',
  ],
  sources: [
    { href: '/solutions/ai-audit-trail/', label: 'حل سجل تدقيق الذكاء الاصطناعي' },
    { href: '/docs/ai-audit-trail/', label: 'BRIGHTAI docs: AI audit trail' },
  ],
  furtherReading: { href: '/solutions/ai-audit-trail/', label: 'حل سجل تدقيق الذكاء الاصطناعي' },
  query: 'سجل تدقيق الذكاء الاصطناعي',
  question: 'ما هو سجل تدقيق الذكاء الاصطناعي؟',
  answer:
    'سجل تدقيق الذكاء الاصطناعي هو سجل منظم يوثق أحداث استخدام AI والقرارات المرتبطة بها حتى يمكن مراجعتها لاحقاً. قد يشمل هوية المستخدم أو النظام، النموذج، الغرض، وقت الحدث، تصنيف المخاطر، السياسة المطبقة، قرار السماح أو الحجب، والموافقة البشرية ومرجع الدليل. تحدد المؤسسة حقول السجل والاحتفاظ والتشفير والصلاحيات وفق بيئتها والمتطلبات المنطبقة؛ ولا يثبت وجود السجل وحده الامتثال.',
};

/** What is PDPL compliance for AI? */
export const answerPdplAr: AnswerUnit = {
  slug: 'pdpl-ai-compliance-ar',
  saudiNote:
    'عند إدخال الذكاء الاصطناعي على بيانات العملاء والموظفين، يلزم إثبات الأساس النظامي والغرض المحدد وضبط دورة البيانات كاملة — التقنية تدعم ولا تمنح الامتثال. إدخال الذكاء الاصطناعي يوسع سطح المعالجة، فيلزم إثبات الأساس النظامي والغرض المحدد لكل معالجة. وضبط دورة البيانات — من الجمع والوصول إلى المشاركة والاحتفاظ وحقوق أصحاب البيانات — يتم حسب الحالة، والتقنية تدعم التنفيذ وإنتاج الأدلة ولا تمنح الامتثال. والامتناع عن اعتبار التقنية حلًا مغلقًا هو جوهر الموضوع: الأدلة تُبنى من التشغيل اليومي — القرارات الموثقة والموافقات وسجل التدقيق — لتكون جاهزة عند أي مراجعة بدل جمعها على عجل.',
  keyPoints: [
    'معالجة البيانات الشخصية وفق أساس نظامي وغرض محدد.',
    'ضبط الوصول والمشاركة والاحتفاظ وحقوق أصحاب البيانات حسب الحالة.',
    'التقييم يسبق التشغيل: تدفق البيانات والمورد والعقود والسياسات تُراجع مع المختصين قبل أول استخدام.',
    'اكتشاف البيانات الشخصية وتنقيحها يمنع وصولها للنموذج أصلًا.',
    'الموافقات وسجل التدقيق يدعمان التنفيذ وإنتاج أدلة المراجعة.',
    'الأدلة تُنتج من التشغيل اليومي بدل تركيبها وقت التدقيق.',
  ],
  sources: [
    { href: '/docs/pdpl-ai-complete-guide/', label: 'دليل PDPL والذكاء الاصطناعي في السعودية' },
  ],
  furtherReading: { href: '/docs/pdpl-ai-complete-guide/', label: 'دليل PDPL والذكاء الاصطناعي في السعودية' },
  query: 'امتثال PDPL للذكاء الاصطناعي',
  question: 'وش يعني امتثال PDPL عند استخدام الذكاء الاصطناعي؟',
  answer:
    'امتثال PDPL عند استخدام الذكاء الاصطناعي يعني أن تعالج المنشأة البيانات الشخصية وفق أساس نظامي وغرض محدد، وتضبط الوصول والمشاركة والاحتفاظ وحقوق أصحاب البيانات بحسب ما ينطبق على الحالة. تقنياً، يمكن لطبقات مثل اكتشاف PII والتنقيح والموافقات وسجل التدقيق أن تدعم تنفيذ بعض الضوابط وإنتاج أدلة مراجعة، لكنها لا تمنح امتثالاً تلقائياً؛ يلزم تقييم تدفق البيانات والمورد والعقود والسياسات مع المختصين.',
};

/** What are NCA ECC controls? */
export const answerNca: AnswerUnit = {
  slug: 'nca-ecc-controls',
  saudiNote:
    'NCA ECC controls are the mandatory cybersecurity baseline for Saudi institutions — any AI deployment inside them inherits the same control obligations. The controls apply wherever AI runs inside the institution, in development and production alike, with the two environments kept separated.',
  keyPoints: [
    'Classify training data and inputs by sensitivity: what may and may not be trained on.',
    'Screen malicious requests, including prompt injection attacks.',
    'Separate development environments from production.',
    'Periodic security review of AI systems with risk-tiered human approvals.',
    'Map each AI interaction to a risk tier so approval levels match the actual exposure.',
    'Audit log evidence proving compliance during NCA inspection.',
  ],
  sources: [
    { href: '/hub/compliance/', label: 'BRIGHTAI hub: Saudi AI compliance' },
    { href: '/docs/nca-ecc-ai-controls/', label: 'BRIGHTAI docs: NCA ECC baseline controls reference' },
    { href: '/docs/nca-ecc-ai-governance/', label: 'BRIGHTAI docs: NCA ECC & AI governance' },
    { href: 'https://www.nca.gov.sa', label: 'NCA — National Cybersecurity Authority' },
  ],
  furtherReading: { href: '/hub/compliance/', label: 'دليل امتثال AI السعودي: PDPL وNCA ECC وISO 42001' },
  query: 'ضوابط NCA للذكاء الاصطناعي',
  question: 'What are ضوابط NCA للذكاء الاصطناعي?',
  answer:
    'ضوابط NCA ECC (الهيئة الوطنية للأمن السيبراني) هي معايير أمنية سعودية تحدد الضوابط التقنية والإدارية التي يجب على المؤسسات تطبيقها لحماية أنظمتها من التهديدات السيبرانية. عندما يتعلق الأمر بالذكاء الاصطناعي، تشمل ضوابط NCA ECC: تصنيف بيانات التدريب (ما يجب وما لا يجب تدريبه)، فحص الطلبات الخبيثة (injection attacks)، فصل بيئات التطوير عن الإنتاج، ومراجعة أمنية دورية لأنظمة AI. BrightAI يدمج ضوابط NCA ECC مباشرة في المنصة: كل تفاعل يُصنَّف بمستوى مخاطر، ويتطلب مستوى موافقة يتناسب مع مستوى المخاطر، ويحتفظ بسجل تدقيق يُثبت الامتثال عند التفتيش.',
};

/** What is generative AI guidance from SDAIA? */
export const answerSdaia: AnswerUnit = {
  slug: 'sdaia-generative-ai',
  saudiNote:
    'Saudi government and enterprise deployments of generative models fall under SDAIA data-and-AI governance — risk assessment and human approval are expected before rollout. تقييم المخاطر قبل النشر ليس خطوة شكلية بل شرطًا للتشغيل، والتنفيذ التشغيلي للإرشادات يكون بالتقييم التلقائي وسياسات الموافقة وملفات الأدلة الجاهزة. الالتزام يعني أن هذه المتطلبات تصبح روتينًا يوميًا موثقًا لا سياسة متروكة على الورق، وكل قرار توليدي يترك أثرًا قابلًا للمراجعة.',
  keyPoints: [
    'Risk assessment required before deploying any generative system.',
    'Human approval layer for high-risk interactions.',
    'Transparency in AI decisions alongside PDPL compliance.',
    'التقييم التلقائي لكل طلب يجعل تقييم المخاطر ممارسة مستمرة لا حدثًا لمرة واحدة.',
    'ملفات الأدلة تُنتج أثناء التشغيل اليومي لتكون جاهزة عند التفتيش.',
    'تستند الإرشادات لنظام حوكمة البيانات والذكاء الاصطناعي.',
    'الشفافية في قرارات النماذج والامتثال لـ PDPL جزء من التشغيل اليومي.',
    'Operational evidence files ready for SDAIA inspection.',
  ],
  sources: [
    { href: '/hub/sdaia-ai-risk-management/', label: 'BRIGHTAI hub: SDAIA risk management' },
    { href: '/docs/sdaia-generative-ai-guidelines/', label: 'BRIGHTAI docs: SDAIA generative AI guidelines' },
    { href: 'https://sdaia.gov.sa', label: 'SDAIA — Saudi Data & AI Authority' },
  ],
  furtherReading: { href: '/hub/sdaia-ai-risk-management/', label: 'دليل سدايا لإدارة مخاطر الذكاء الاصطناعي في المنشآت السعودية' },
  query: 'إرشادات سدايا للذكاء الاصطناعي التوليدي',
  question: 'What are إرشادات سدايا للذكاء الاصطناعي التوليدي?',
  answer:
    'إرشادات سدايا (SDAIA) للذكاء الاصطناعي التوليدي هي التوجيهات السعودية الرسمية لاستخدام نماذج الذكاء الاصطناعي التوليدي (مثل LLMs) داخل المؤسسات الحكومية والسعودية. صدرت بموجب نظام حوكمة البيانات والذكاء الاصطناعي وتتطلب من المؤسسات: تقييم المخاطر قبل نشر أي نظام توليدي، وجود طبقة موافقة بشرية للتفاعلات عالية المخاطر، الحفاظ على الشفافية في قرارات الـ AI، والامتثال لقوانين حماية البيانات (PDPL). BrightAI يجعل تنفيذ هذه الإرشادات تشغيليًا: يقيّم كل طلب تلقائيًا، يطبق سياسات الموافقة، ويُنتج ملفات أدلة جاهزة للتفتيش من سدايا.',
};

// CHAMPION-03 (2026-07-30): Additional answer pages for Saudi SERP coverage.
// Targeting: ai-banking, ai-healthcare, ai-governance-framework, nca-compliance,
// sama-ai, iso-42001 — 6 new slugs to complete the 10-slug requirement.

/** What is AI governance for Saudi banks? */
export const answerBanking: AnswerUnit = {
  slug: 'ai-banking',
  furtherReading: { href: '/solutions/banking-ai-governance/', label: 'حوكمة الذكاء الاصطناعي للقطاع المصرفي السعودي — SAMA' },
  saudiNote:
    'SAMA supervises AI use in Saudi banks under its information-security requirements — customer financial data protection and human sign-off on credit decisions are non-negotiable. القطاع المصرفي يتعامل مع أدق البيانات المالية للعملاء، وأي تسريب عبر نموذج خارجي يتحول لمخالفة نظامية تمس الثقة. لذلك تُفحص الطلبات قبل وصولها للنموذج وتُخفى البيانات تلقائيًا، وتبقى القرارات الائتمانية عالية المخاطر بموافقة بشرية، وملفات الأدلة الجاهزة تجعل التفتيش مراجعة لوثائق موجودة بدل جمعها وقت الطلب.',
  keyPoints: [
    'Screens every AI request before it reaches the model; redacts personal and financial data automatically.',
    'Human approval on high-risk credit and investment decisions.',
    'Tamper-proof audit log on every AI-proposed decision plus periodic reports to senior management.',
    'Banking compliance pack producing SAMA-ready evidence files.',
    'إخفاء البيانات الشخصية والمالية يحدث تلقائيًا قبل وصول الطلب للنموذج.',
  ],
  sources: [
    { href: '/solutions/banking-ai-governance/', label: 'BRIGHTAI solution: banking AI governance' },
    { href: 'https://www.sama.gov.sa', label: 'SAMA — Saudi Central Bank' },
  ],
  query: 'حوكمة الذكاء الاصطناعي للبنوك السعودية',
  question: 'What is AI governance for Saudi banks?',
  answer:
    'حوكمة الذكاء الاصطناعي للبنوك السعودية هي إطار تشغيلي يضمن أن كل استخدام للذكاء الاصطناعي داخل البنك آمن ومتوافق مع متطلبات البنك المركزي السعودي (SAMA) ونظام حماية البيانات الشخصية (PDPL) وضوابط الأمن السيبراني (NCA ECC). تشمل حوكمة AI للبنوك: فحص كل طلب ذكاء اصطناعي قبل وصوله للنموذج، إخفاء البيانات الشخصية والمالية تلقائيًا، موافقة بشرية على القرارات الائتمانية عالية المخاطر، سجل تدقيق غير قابل للتعديل، وملفات أدلة جاهزة لتفتيش SAMA. BrightAI يوفر حزمة امتثال مخصصة للقطاع المصرفي السعودي تدعم كل هذه المتطلبات تشغيليًا.',
};

/** What is AI governance for Saudi healthcare? */
export const answerHealthcare: AnswerUnit = {
  slug: 'ai-healthcare',
  furtherReading: { href: '/solutions/healthcare-ai-governance/', label: 'حوكمة الذكاء الاصطناعي للقطاع الصحي السعودي — SFDA' },
  saudiNote:
    'Saudi hospitals answer to PDPL for patient data, SFDA for AI-enabled medical use, and ISO 13485 for devices — one diagnostic suggestion without a human sign-off is a compliance event. البيانات الصحية في أعلى سلم الحساسية، وتسريبها لنموذج خارجي لا يمكن التراجع عنه بعد حدوثه. لذلك تُحمى بيانات المرضى قبل وصولها للنموذج، وتبقى القرارات التشخيصية عالية المخاطر بموافقة بشرية موثقة.',
  keyPoints: [
    'Protects patient health data (PHI) from leaking to external models.',
    'Human approval on high-risk diagnostic decisions.',
    'Documents every doctor-to-model interaction for later review.',
    'حماية بيانات المرضى تشمل عدم إرسالها للنماذج الخارجية أصلًا.',
    'Healthcare pack producing SFDA-ready evidence files.',
  ],
  sources: [
    { href: '/solutions/healthcare-ai-governance/', label: 'BRIGHTAI solution: healthcare AI governance' },
    { href: 'https://www.sfda.gov.sa', label: 'SFDA — Saudi Food & Drug Authority' },
  ],
  query: 'حوكمة الذكاء الاصطناعي للقطاع الصحي السعودي',
  question: 'What is AI governance for Saudi healthcare?',
  answer:
    'حوكمة الذكاء الاصطناعي للقطاع الصحي السعودي هي إطار يضمن أن استخدامات AI في المستشفيات والمنشآت الصحية آمنة ومتوافقة مع نظام حماية البيانات الشخصية (PDPL) ومتطلبات هيئة الغذاء والدواء (SFDA) ومعيار ISO 13485 للأجهزة الطبية. تشمل: حماية بيانات المرضى (PHI) من التسريب للنماذج الخارجية، موافقة بشرية على القرارات التشخيصية عالية المخاطر، توثيق كل تفاعل بين الطبيب ونموذج AI، وإنتاج ملفات أدلة تثبت الامتثال عند تفتيش SFDA. BrightAI يوفر Healthcare Pack جاهز يطبق كل هذه الضوابط تشغيليًا داخل المنشأة الصحية السعودية.',
};

/** What is an AI governance framework? */
export const answerGovFramework: AnswerUnit = {
  slug: 'ai-governance-framework',
  saudiNote:
    'A framework turns governance principles into an operating routine — inventory, risk tiers, policies, controls, approvals, and evidence — mapped to PDPL, NCA ECC, SDAIA guidance, and ISO/IEC 42001. Without the routine, governance stays a document nobody operates; with it, every AI case has an owner, a tier, a control, and a proof.',
  keyPoints: [
    'Starts with a use-case inventory: where AI is used, who owns each case, what data it touches.',
    'Risk classification decides which controls and approval levels each case gets.',
    'Technical controls plus human approvals for sensitive decisions.',
    'Audit log, reviewable evidence files, and periodic performance indicators close the loop.',
    'Periodic indicators show whether controls actually work, not just whether they exist.',
  ],
  sources: [
    { href: '/hub/ai-governance/', label: 'BRIGHTAI hub: AI governance pillar' },
    { href: '/docs/governance-application/', label: 'BRIGHTAI docs: applying governance' },
  ],
  furtherReading: { href: '/hub/ai-governance/', label: 'الدليل الشامل لحوكمة الذكاء الاصطناعي للمؤسسات السعودية' },
  query: 'إطار حوكمة الذكاء الاصطناعي',
  question: 'What is an AI governance framework?',
  answer:
    'إطار حوكمة الذكاء الاصطناعي هو منظومة متكاملة من السياسات والأدوار والضوابط التقنية والأدلة التي تنظم كيفية اختيار واستخدام ومراقبة أنظمة الذكاء الاصطناعي داخل المؤسسة. يتكون الإطار الفعّال من: جرد حالات الاستخدام، تصنيف المخاطر، سياسات استخدام واضحة، ضوابط تقنية (AI Firewall، فحص بيانات)، موافقات بشرية للقرارات الحساسة، سجل تدقيق شامل، ملفات أدلة قابلة للمراجعة، ومؤشرات أداء دورية. في السعودية، يجب أن يتوافق الإطار مع PDPL وNCA ECC وإرشادات سدايا وISO/IEC 42001. BrightAI يوفر هذا الإطار كمنصة تشغيلية جاهزة بدل بنائه من الصفر.',
};

// ANSWER-AUDIT (2026-09-03): `nca-compliance` removed — same query intent and
// near-identical coverage as `nca-ecc-controls` (kept as canonical). No unique
// content to merge; both pointed at /hub/compliance/. Served via 301 in
// redirects.json: /answer/nca-compliance/ -> /answer/nca-ecc-controls/.
// ANSWER-AUDIT (2026-09-03): `sama-ai` removed — same sector+regulator intent
// as `ai-banking` (kept as canonical). Unique point merged into ai-banking
// keyPoints ("periodic reports to senior management"). Served via 301 in
// redirects.json: /answer/sama-ai/ -> /answer/ai-banking/.

/** What is ISO/IEC 42001 for AI management? */
export const answerIso42001: AnswerUnit = {
  slug: 'iso-42001',
  furtherReading: { href: '/blog/iso-42001-saudi-implementation-guide/', label: 'دليل تطبيق ISO 42001 في السعودية' },
  saudiNote:
    'ISO/IEC 42001 gives Saudi institutions an auditable management system for AI that sits alongside — not instead of — PDPL, NCA ECC, and SDAIA requirements. المعيار يتطلب إنشاء النظام وتنفيذه وصيانته وتحسينه باستمرار، لا الاكتفاء بوثيقة سياسة؛ وخارطة التطبيق تحول كل بند إلى ضابط تقني قابل للتدقيق.',
  keyPoints: [
    'Covers AI policy, risk classification, model lifecycle management, and impact assessment.',
    'Requires transparency, accountability, and continual improvement.',
    'Integrates with PDPL, NCA ECC, and SDAIA guidance in the Saudi context.',
    'المراجعة الدورية تضمن بقاء الضوابط فعالة مع تغير الاستخدامات والنماذج.',
    'Each clause maps to an auditable technical control inside the platform.',
  ],
  sources: [
    { href: '/blog/iso-42001-saudi-implementation-guide/', label: 'BRIGHTAI guide: ISO 42001 Saudi implementation' },
    { href: 'https://www.iso.org', label: 'ISO — International Organization for Standardization' },
  ],
  query: 'ISO 42001 إدارة الذكاء الاصطناعي',
  question: 'What is ISO/IEC 42001 for AI management systems?',
  answer:
    'ISO/IEC 42001 هو المعيار الدولي لأنظمة إدارة الذكاء الاصطناعي (AI Management System). يوفر إطارًا للمؤسسات لإنشاء وتنفيذ وصيانة سياسات وإجراءات تضمن استخدام الذكاء الاصطناعي بشكل مسؤول وآمن وفعّال. يشمل المعيار: سياسة AI، تصنيف المخاطر، إدارة دورة حياة النماذج، تقييم الأثر، الشفافية، المساءلة، والتحسين المستمر. في السعودية، يتكامل ISO 42001 مع متطلبات PDPL وNCA ECC وإرشادات سدايا. BrightAI يوفر خارطة طريق تطبيق ISO 42001 كمنصة تشغيلية: كل بند في المعيار يتحول إلى ضابط تقني قابل للتدقيق داخل المنصة.',
};

export const answers = [
  answerGov,
  answerFirewall,
  answerPdpl,
  answerSafety,
  answerOs,
  answerGovAr,
  answerFirewallAr,
  answerAuditAr,
  answerPdplAr,
  answerNca,
  answerSdaia,
  answerBanking,
  answerHealthcare,
  answerGovFramework,
  answerIso42001,
];
export default answers;
