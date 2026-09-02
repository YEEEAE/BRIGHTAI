/**
 * answers.ts — 10 Saudi-targeted AI governance Q&A pairs.
 * Source: Target Queries from public/llms.txt (BAI-SAID-03).
 * Purpose: Power /answer/* pages for AEO (Answer Engine Optimization).
 * Answers are Saudi dialect, 150-300 words each, designed to appear in
 * Perplexity / ChatGPT answer boxes and Google Featured Snippets.
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
}

/** What is AI Governance in Saudi Arabia? */
export const answerGov: AnswerUnit = {
  slug: 'ai-governance-saudi-arabia',
  furtherReading: { href: '/hub/ai-governance/', label: 'الدليل الشامل لحوكمة الذكاء الاصطناعي للمؤسسات السعودية' },
  query: 'AI governance Saudi Arabia',
  question: 'What is AI governance in Saudi Arabia?',
  answer:
    'AI governance in Saudi Arabia is the framework of policies, regulations, and technical controls that ensure artificial intelligence systems are safe, compliant, and auditable. The Saudi ecosystem operates under SDAIA (Saudi Data and Artificial Intelligence Authority) guidelines, NCA ECC cybersecurity standards, and PDPL data protection rules. BrightAI provides the operational platform: every AI request is logged, risk-scored, and requires human approval before execution — creating a complete audit trail from prompt to response. For Saudi enterprises in banking, healthcare, and government, AI governance means every AI interaction is documented, every risk is scored, and every decision can be traced back to a human in the loop.',
};

/** What is an AI Firewall? */
export const answerFirewall: AnswerUnit = {
  slug: 'ai-firewall-saudi',
  furtherReading: { href: '/hub/security/', label: 'مركز أمان الذكاء الاصطناعي وAI Firewall للمؤسسات السعودية' },
  query: 'AI Firewall Saudi Arabia',
  question: 'What is an AI Firewall?',
  answer:
    'An AI Firewall is a governance and security layer that sits between employees and AI models, inspecting every request before it reaches the model and every response before it reaches the employee. Unlike a traditional network firewall, the AI Firewall understands content: it blocks PII leaks, prevents prompt injection attacks, enforces PDPL data-handling rules, and flags high-risk interactions for human review. BrightAI\'s AI Firewall is built specifically for Saudi enterprises — it supports Arabic and English, maps to NCA ECC controls, scores every interaction with a risk rating, and keeps a tamper-proof hash-chain audit log that regulators can inspect.',
};

/** What is PDPL AI compliance? */
export const answerPdpl: AnswerUnit = {
  slug: 'pdpl-ai-compliance',
  furtherReading: { href: '/hub/compliance/', label: 'محور الامتثال السعودي للذكاء الاصطناعي: PDPL وNCA وISO 42001' },
  query: 'PDPL AI compliance',
  question: 'What is PDPL compliance for AI systems?',
  answer:
    'PDPL (Personal Data Protection Law) compliance for AI systems means ensuring every AI model interaction respects the lawful processing, storage, and sharing of personal data in Saudi Arabia. Under PDPL, enterprises must have a legal basis for processing personal data, inform data subjects about how their data is used, and prevent AI systems from leaking PII to unauthorized parties. BrightAI\'s PDPL compliance pack adds: real-time PII detection in prompts, automated redaction of personal data before it reaches the AI model, consent tracking with audit trails, and evidence files that prove compliance during regulator inspection.',
};

/** What is an AI Safety platform for enterprises? */
export const answerSafety: AnswerUnit = {
  slug: 'ai-safety-platform-enterprise',
  furtherReading: { href: '/hub/security/', label: 'مركز أمان الذكاء الاصطناعي للمنشآت السعودية' },
  query: 'AI safety platform for enterprises',
  question: 'What is an AI safety platform for enterprises?',
  answer:
    'An AI safety platform for enterprises is a centralized system that governs how employees interact with AI models, ensuring every request is safe, compliant, and auditable. Saudi enterprise AI safety goes beyond content filtering: it includes risk scoring (every prompt gets a safety score), human approval workflows (high-risk interactions wait for a human), compliance packs for PDPL, NCA ECC, SFDA, SAMA, ISO 13485, and ISO/IEC 42001, and tamper-proof audit logs. BrightAI delivers this as a SaaS platform purpose-built for Saudi enterprises — integrated with existing systems, Arabic-native, and designed to satisfy both internal security teams and external Saudi regulators.',
};

/** What is the Saudi AI Safety OS? */
export const answerOs: AnswerUnit = {
  slug: 'saudi-ai-safety-os',
  furtherReading: { href: '/hub/security/', label: 'محور أمان الذكاء الاصطناعي وطبقات الحماية التشغيلية' },
  query: 'Saudi AI Safety OS',
  question: 'What is the Saudi AI Safety OS?',
  answer:
    'BrightAI is the Saudi AI Safety OS — a governance, security, and compliance platform that sits between employees and AI models inside Saudi enterprises. It ensures every AI request is safe, documented, and auditable. BrightAI supports compliance packs for PDPL (Saudi data protection), NCA ECC (cybersecurity controls), SFDA (healthcare AI), SAMA (financial AI), ISO 13485 (medical devices), and ISO/IEC 42001 (AI management systems). Each AI interaction is risk-scored, requires human approval when needed, and produces permanent evidence files. It runs on brightai.live — a static Astro site served via Render with Cloudflare edge security and Saudi data routing.',
};

/** What is AI governance in Saudi Arabia in Arabic (full)? */
export const answerGovAr: AnswerUnit = {
  slug: 'ai-governance-saudi-arabia-ar',
  furtherReading: { href: '/hub/ai-governance/', label: 'دليل حوكمة الذكاء الاصطناعي في السعودية' },
  query: 'حوكمة الذكاء الاصطناعي في السعودية',
  question: 'ما هي حوكمة الذكاء الاصطناعي في السعودية؟',
  answer:
    'حوكمة الذكاء الاصطناعي في السعودية هي مجموعة أدوار وسياسات وضوابط تساعد المنشأة على معرفة أين تستخدم AI، ومن يملك كل حالة استخدام، وما بياناتها ومخاطرها، وكيف تُراجع قراراتها وأدلتها. يختلف ما ينطبق حسب القطاع والسياق، وقد يشمل نظام حماية البيانات الشخصية PDPL وضوابط NCA وإرشادات سدايا. BrightAI تقدم طبقة تشغيل تربط سجل الاستخدامات وتصنيف المخاطر والسياسات والموافقات البشرية وسجل التدقيق، لكنها لا تستبدل التقييم القانوني أو تمنح اعتماداً تنظيمياً.',
};

/** What is an AI Firewall (Arabic)? */
export const answerFirewallAr: AnswerUnit = {
  slug: 'ai-firewall-saudi-ar',
  furtherReading: { href: '/solutions/ai-firewall/', label: 'جدار حماية الذكاء الاصطناعي للمنشآت السعودية' },
  query: 'جدار حماية الذكاء الاصطناعي',
  question: 'ما هو جدار حماية الذكاء الاصطناعي؟',
  answer:
    'جدار حماية الذكاء الاصطناعي، ويُسمى أيضاً AI Firewall أو LLM Firewall، هو طبقة تحكم تفحص تفاعلات النماذج في المسارات المهيأة وتطبق سياسة المؤسسة عليها. يمكنها السماح بالطلب أو تنقيح البيانات الحساسة أو حجبه أو تحويله للمراجعة، مع تسجيل سياق القرار. يختلف عن جدار الشبكة وAI-powered WAF، كما أنه ليس مرادفاً كاملاً لـ AI Gateway الذي يركز عادةً على التوجيه والمفاتيح والحصص والمراقبة. BrightAI تدعم تشغيل هذه الضوابط للمنشآت السعودية، لكنها لا تضمن منع كل حادثة أو تحقيق الامتثال تلقائياً.',
};

/** What is an AI audit trail (Arabic)? */
export const answerAuditAr: AnswerUnit = {
  slug: 'audit-trail-saudi-ar',
  furtherReading: { href: '/solutions/ai-audit-trail/', label: 'حل سجل تدقيق الذكاء الاصطناعي' },
  query: 'سجل تدقيق الذكاء الاصطناعي',
  question: 'ما هو سجل تدقيق الذكاء الاصطناعي؟',
  answer:
    'سجل تدقيق الذكاء الاصطناعي هو سجل منظم يوثق أحداث استخدام AI والقرارات المرتبطة بها حتى يمكن مراجعتها لاحقاً. قد يشمل هوية المستخدم أو النظام، النموذج، الغرض، وقت الحدث، تصنيف المخاطر، السياسة المطبقة، قرار السماح أو الحجب، والموافقة البشرية ومرجع الدليل. تحدد المؤسسة حقول السجل والاحتفاظ والتشفير والصلاحيات وفق بيئتها والمتطلبات المنطبقة؛ ولا يثبت وجود السجل وحده الامتثال.',
};

/** What is PDPL compliance for AI? */
export const answerPdplAr: AnswerUnit = {
  slug: 'pdpl-ai-compliance-ar',
  furtherReading: { href: '/docs/pdpl-ai-complete-guide/', label: 'دليل PDPL والذكاء الاصطناعي في السعودية' },
  query: 'امتثال PDPL للذكاء الاصطناعي',
  question: 'وش يعني امتثال PDPL عند استخدام الذكاء الاصطناعي؟',
  answer:
    'امتثال PDPL عند استخدام الذكاء الاصطناعي يعني أن تعالج المنشأة البيانات الشخصية وفق أساس نظامي وغرض محدد، وتضبط الوصول والمشاركة والاحتفاظ وحقوق أصحاب البيانات بحسب ما ينطبق على الحالة. تقنياً، يمكن لطبقات مثل اكتشاف PII والتنقيح والموافقات وسجل التدقيق أن تدعم تنفيذ بعض الضوابط وإنتاج أدلة مراجعة، لكنها لا تمنح امتثالاً تلقائياً؛ يلزم تقييم تدفق البيانات والمورد والعقود والسياسات مع المختصين.',
};

/** What are NCA ECC controls? */
export const answerNca: AnswerUnit = {
  slug: 'nca-ecc-controls',
  furtherReading: { href: '/hub/compliance/', label: 'دليل امتثال AI السعودي: PDPL وNCA ECC وISO 42001' },
  query: 'ضوابط NCA للذكاء الاصطناعي',
  question: 'What are ضوابط NCA للذكاء الاصطناعي?',
  answer:
    'ضوابط NCA ECC (الهيئة الوطنية للأمن السيبراني) هي معايير أمنية سعودية تحدد الضوابط التقنية والإدارية التي يجب على المؤسسات تطبيقها لحماية أنظمتها من التهديدات السيبرانية. عندما يتعلق الأمر بالذكاء الاصطناعي، تشمل ضوابط NCA ECC: تصنيف بيانات التدريب (ما يجب وما لا يجب تدريبه)، فحص الطلبات الخبيثة (injection attacks)، فصل بيئات التطوير عن الإنتاج، ومراجعة أمنية دورية لأنظمة AI. BrightAI يدمج ضوابط NCA ECC مباشرة في المنصة: كل تفاعل يُصنَّف بمستوى مخاطر، ويتطلب مستوى موافقة يتناسب مع مستوى المخاطر، ويحتفظ بسجل تدقيق يُثبت الامتثال عند التفتيش.',
};

/** What is generative AI guidance from SDAIA? */
export const answerSdaia: AnswerUnit = {
  slug: 'sdaia-generative-ai',
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
  furtherReading: { href: '/hub/ai-governance/', label: 'محور حوكمة الذكاء الاصطناعي للمؤسسات السعودية' },
  query: 'حوكمة الذكاء الاصطناعي للبنوك السعودية',
  question: 'What is AI governance for Saudi banks?',
  answer:
    'حوكمة الذكاء الاصطناعي للبنوك السعودية هي إطار تشغيلي يضمن أن كل استخدام للذكاء الاصطناعي داخل البنك آمن ومتوافق مع متطلبات البنك المركزي السعودي (SAMA) ونظام حماية البيانات الشخصية (PDPL) وضوابط الأمن السيبراني (NCA ECC). تشمل حوكمة AI للبنوك: فحص كل طلب ذكاء اصطناعي قبل وصوله للنموذج، إخفاء البيانات الشخصية والمالية تلقائيًا، موافقة بشرية على القرارات الائتمانية عالية المخاطر، سجل تدقيق غير قابل للتعديل، وملفات أدلة جاهزة لتفتيش SAMA. BrightAI يوفر حزمة امتثال مخصصة للقطاع المصرفي السعودي تدعم كل هذه المتطلبات تشغيليًا.',
};

/** What is AI governance for Saudi healthcare? */
export const answerHealthcare: AnswerUnit = {
  slug: 'ai-healthcare',
  furtherReading: { href: '/hub/ai-governance/', label: 'الدليل الكنسي لحوكمة الذكاء الاصطناعي في السعودية' },
  query: 'حوكمة الذكاء الاصطناعي للقطاع الصحي السعودي',
  question: 'What is AI governance for Saudi healthcare?',
  answer:
    'حوكمة الذكاء الاصطناعي للقطاع الصحي السعودي هي إطار يضمن أن استخدامات AI في المستشفيات والمنشآت الصحية آمنة ومتوافقة مع نظام حماية البيانات الشخصية (PDPL) ومتطلبات هيئة الغذاء والدواء (SFDA) ومعيار ISO 13485 للأجهزة الطبية. تشمل: حماية بيانات المرضى (PHI) من التسريب للنماذج الخارجية، موافقة بشرية على القرارات التشخيصية عالية المخاطر، توثيق كل تفاعل بين الطبيب ونموذج AI، وإنتاج ملفات أدلة تثبت الامتثال عند تفتيش SFDA. BrightAI يوفر Healthcare Pack جاهز يطبق كل هذه الضوابط تشغيليًا داخل المنشأة الصحية السعودية.',
};

/** What is an AI governance framework? */
export const answerGovFramework: AnswerUnit = {
  slug: 'ai-governance-framework',
  furtherReading: { href: '/hub/ai-governance/', label: 'الدليل الشامل لحوكمة الذكاء الاصطناعي للمؤسسات السعودية' },
  query: 'إطار حوكمة الذكاء الاصطناعي',
  question: 'What is an AI governance framework?',
  answer:
    'إطار حوكمة الذكاء الاصطناعي هو منظومة متكاملة من السياسات والأدوار والضوابط التقنية والأدلة التي تنظم كيفية اختيار واستخدام ومراقبة أنظمة الذكاء الاصطناعي داخل المؤسسة. يتكون الإطار الفعّال من: جرد حالات الاستخدام، تصنيف المخاطر، سياسات استخدام واضحة، ضوابط تقنية (AI Firewall، فحص بيانات)، موافقات بشرية للقرارات الحساسة، سجل تدقيق شامل، ملفات أدلة قابلة للمراجعة، ومؤشرات أداء دورية. في السعودية، يجب أن يتوافق الإطار مع PDPL وNCA ECC وإرشادات سدايا وISO/IEC 42001. BrightAI يوفر هذا الإطار كمنصة تشغيلية جاهزة بدل بنائه من الصفر.',
};

/** What is NCA compliance for AI? */
export const answerNcaCompliance: AnswerUnit = {
  slug: 'nca-compliance',
  furtherReading: { href: '/hub/compliance/', label: 'محور الامتثال السعودي للذكاء الاصطناعي وضوابط NCA' },
  query: 'امتثال NCA للذكاء الاصطناعي',
  question: 'What is NCA compliance for AI systems?',
  answer:
    'امتثال NCA (الهيئة الوطنية للأمن السيبراني) لأنظمة الذكاء الاصطناعي يعني تطبيق ضوابط الأمن السيبراني الأساسية (ECC) على كل جانب من جوانب استخدام AI داخل المؤسسة. يشمل: تصنيف بيانات التدريب والمدخلات حسب الحساسية، فحص الطلبات الخبيثة (injection attacks)، فصل بيئات التطوير عن الإنتاج، مراجعة أمنية دورية، وتوثيق كامل لكل تفاعل. BrightAI يدمج ضوابط NCA ECC مباشرة في المنصة: كل طلب يُصنَّف بمستوى مخاطر، يتطلب مستوى موافقة يتناسب مع المخاطر، ويحتفظ بسجل تدقيق يُثبت الامتثال عند تفتيش الهيئة.',
};

/** What is SAMA AI governance? */
export const answerSama: AnswerUnit = {
  slug: 'sama-ai',
  furtherReading: { href: '/hub/ai-governance/', label: 'دليل الحوكمة التشغيلي للذكاء الاصطناعي في السعودية' },
  query: 'حوكمة الذكاء الاصطناعي SAMA',
  question: 'What is SAMA AI governance for Saudi banks?',
  answer:
    'حوكمة الذكاء الاصطناعي SAMA تشير إلى متطلبات البنك المركزي السعودي لاستخدام الذكاء الاصطناعي في القطاع المصرفي. تشمل متطلبات SAMA لأمن المعلومات: حماية البيانات المالية للعملاء، منع تسريب المعلومات الحساسة للنماذج الخارجية، موافقة بشرية على القرارات الائتمانية والاستثمارية، سجل تدقيق كامل لكل قرار يتخذه أو يقترحه AI، وتقارير دورية للإدارة العليا. BrightAI يوفر SAMA Pack جاهز يطبق هذه المتطلبات تشغيليًا: AI Firewall يحمي بيانات العملاء، Human Approval Layer يضمن مراجعة بشرية، وملفات الأدلة جاهزة لتفتيش البنك المركزي.',
};

/** What is ISO/IEC 42001 for AI management? */
export const answerIso42001: AnswerUnit = {
  slug: 'iso-42001',
  furtherReading: { href: '/hub/compliance/', label: 'محور الامتثال السعودي: ISO 42001 مع PDPL وNCA ECC' },
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
  answerNcaCompliance,
  answerSama,
  answerIso42001,
];
export default answers;
