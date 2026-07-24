/**
 * Kernel Data Layer — Phase 9 + SEO Content (2026-07-14)
 * TypeScript interfaces, SEO metadata, demo data, cross-linking network,
 * Saudi-targeted SEO content, and FAQ for all 11 kernel pages.
 *
 * Every number is a demo label marked "بيانات توضيحية".
 * SEO content is Saudi-dialect, references PDPL/NCA ECC/SDAIA/SFDA/ISO 42001,
 * and is server-rendered (not JS-injected) so crawlers can index it.
 */

// P0-3 cleanup (2026-07-19): these types were referenced but never
// declared. Adding them locally so the kernel demo data type-checks.
export type DashboardMetric = {
  label: string;
  value: string;
  trend: string;
  demo?: boolean;
};

export type ActivityEvent = {
  type: string;
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  demo?: boolean;
};

export type ComplianceFramework = {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  controls: number;
  status: 'covered' | 'partial' | 'gap';
};

export type EvidenceRecord = {
  id: string;
  type: string;
  title: string;
  hash: string;
  timestamp: string;
  verified: boolean;
};

import type { FaqItem } from './schema-helpers';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface SeoBlock {
  heading: string;
  /** 2-4 paragraphs of substantive Saudi-dialect content. */
  paragraphs: string[];
  /** 2-3 short bullet points summarising the value prop. */
  bullets?: string[];
}

export interface KernelUnit {
  slug: string;
  path: string;
  label: string;
  shortDescription: string;
  title: string;
  description: string;
  canonical: string;
  h1: string;
  hreflang: { lang: string; href: string }[];
  ogImage: string;
  solutionSlug: string | null;
  docSlug: string;
  /** Internal blog post this unit links to (for cross-link from /docs/* + /blog/*). */
  blogPath: string;
  blogLabel: string;
  iconSvg: string;
  relatedSlugs?: string[];
  /** 3-5 FAQ pairs in Saudi dialect — surfaced via FAQPage schema + <details>. */
  faq: FaqItem[];
  /** 2-3 long-form SEO blocks (h3 + paragraphs + bullets) — server-rendered. */
  seoBlocks: SeoBlock[];
}

// ── SVG Icons (inline, no external dependency) ─────────────────────────────

const icons = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
  audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
  approvals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
  connectors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  scenarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  policies: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"/></svg>',
  evidence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  compliance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>',
  kernel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
};

// ── Kernel Units Data (with SEO content + FAQ + blog cross-link) ───────────

export const kernelUnits: KernelUnit[] = [
  {
    slug: 'index',
    path: '/kernel/',
    label: 'الفهرس',
    shortDescription: 'نظرة عامة على Kernel ولوحة التشغيل',
    title: 'منصة حوكمة الذكاء الاصطناعي للمنشآت | BrightAI Kernel',
    description: 'شغّل حوكمة الذكاء الاصطناعي في منشأتك من لوحة مركزية تجمع السياسات والموافقات والأدلة والرقابة، وتمنح فرق العمل رؤية تنفيذية موحدة.',
    canonical: 'https://brightai.site/kernel/',
    h1: 'غرفة تشغيل حوكمة الذكاء الاصطناعي — راقب كل شي من مكان واحد',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-governance-platform',
    docSlug: 'kernel-architecture',
    blogPath: '/blog/ai-governance-framework-saudi-model/',
    blogLabel: 'إطار حوكمة AI للمنشآت السعودية — مكونات وأمثلة',
    iconSvg: icons.kernel,
    relatedSlugs: ['chat', 'audit', 'approvals', 'stats'],
    seoBlocks: [
      {
        heading: 'وش هو BrightAI Kernel؟',
        paragraphs: [
          'BrightAI Kernel منصة سعودية لحوكمة الذكاء الاصطناعي في المنشآت. يجمع بين AI Firewall (فحص الطلبات قبل إرسالها للنموذج) وسجل تدقيق غير قابل للتعديل (Hash Chain) وموافقات بشرية للقرارات عالية المخاطر وملفات أدلة PDF موقّعة رقمياً. مو استشارة قانونية — أداة تشغيلية تساعد فريقك في تنفيذ سياسات الحوكمة على أدوات الذكاء الاصطناعي الفعلية في شركتك.',
          'Kernel يشتغل كطبقة وسيطة بين موظفيك ونماذج الذكاء الاصطناعي (ChatGPT Enterprise، Azure OpenAI، NVIDIA NIM، نماذج داخلية). كل طلب يمر عبر 6 مراحل: استلام الطلب، فحص PII، تقييم المخاطر، مطابقة السياسات، استدعاء النموذج، توليد الدليل. المرحلة الحرجة هي تقييم المخاطر (Risk Scoring) لأنه يحدد هل الطلب ينفذ تلقائياً أو يحتاج موافقة بشرية أو ينحظر كلياً.',
        ],
        bullets: [
          'AI Firewall يفحص كل طلب قبل الإرسال للنموذج ويمنع تسريب PII وبيانات الشركة',
          'سجل تدقيق زمني غير قابل للتعديل يوثق كل قرار AI مع Trace ID فريد',
          'موافقات بشرية للقرارات عالية المخاطر مع تعليقات المراجع في السجل',
          'ملفات أدلة PDF موقعة رقمياً جاهزة للجهات الرقابية (NCA، SDAIA، SAMA، SFDA)',
        ],
      },
      {
        heading: 'ليش Kernel مهم للشركات السعودية؟',
        paragraphs: [
          'في 2024-2026، السعودية أصدرت ثلاث وثائق تنظيمية رئيسية للذكاء الاصطناعي: نظام PDPL لحماية البيانات الشخصية (2024)، إرشادات SDAIA للذكاء الاصطناعي التوليدي (2024)، وضوابط NCA ECC للأمن السيبراني (2024). الشركات في القطاعات المنظمة (بنوك، تأمين، اتصالات، صحة، تعليم، حكومي) بدأت تتلقى استفسارات من الجهات الرقابية عن كيفية مراقبة استخدام AI الداخلي. Kernel يجاوب على هذا السؤال بسجلات جاهزة.',
          'بدون Kernel، فريقك يكتشف المشكلة بعد ما تحصل: موظف يسرّب بيانات عملاء عبر ChatGPT، نموذج يولّد إجابة متحيزة في خدمة العملاء، أو وكيل AI ينفذ إجراء بدون موافقة. Kernel يمنع هذه السيناريوهات قبل ما تصير — وليس بعد ما تطلع في الأخبار.',
        ],
      },
    ],
    faq: [
      {
        q: 'وش الفرق بين Kernel وAI Gateway العادي؟',
        a: 'AI Gateway عادي يوجه الطلبات للنماذج فقط. Kernel يضيف 4 طبقات: (1) فحص PII تلقائي قبل الإرسال، (2) تقييم مخاطر ذكي لكل طلب (0-100)، (3) تطبيق سياسات قابلة للتخصيص بدون كود، (4) سجل تدقيق غير قابل للتعديل. النتيجة: أنت مو بس تشغّل AI، أنت تحكم AI.',
      },
      {
        q: 'هل Kernel يتكامل مع نماذج الذكاء الاصطناعي اللي نستخدمها؟',
        a: 'نعم. Kernel يدعم OpenAI وAzure OpenAI وAnthropic وGoogle Vertex AI وMeta Llama (عبر NVIDIA NIM) والنماذج الداخلية. التكامل عبر API key أو endpoint مخصص. لا تحتاج تغيير الكود الموجود — فقط أضف Kernel كطبقة وسيطة.',
      },
      {
        q: 'كم يستغرق تطبيق Kernel في شركتنا؟',
        a: 'النشر الأولي من 3-5 أيام عمل. يشمل ربط النماذج، إعداد 3-5 سياسات افتراضية، وتدريب فريق الحوكمة. الضبط الكامل (سياسات مخصصة + ربط ERP/CRM) من 2-4 أسابيع. ندعم النشر على السحابة السعودية أو On-Premise للقطاعات الحساسة.',
      },
      {
        q: 'هل Kernel يساعد في امتثال PDPL وNCA ECC؟',
        a: 'نعم. Kernel يولّد أدلة جاهزة للجهات الرقابية: سجل تدقيق زمني يوضح كل تفاعل AI، تقييم مخاطر لكل طلب، تطبيق سياسات حماية البيانات. الأدلة بصيغة PDF موقعة رقمياً + JSON قابل للتحقق. ليس بديلاً عن المراجعة القانونية المتخصصة، لكنه يقلل وقت التحضير من أسابيع إلى ساعات.',
      },
      {
        q: 'وش تكلفة Kernel؟',
        a: 'التسعير حسب حجم الاستخدام (عدد الطلبات شهرياً) وعدد المستخدمين، يبدأ من باقة المؤسسات الصغيرة وينتهي بخطط On-Premise مخصصة. تواصل معنا عبر /contact/ للحصول على عرض مفصل يناسب حجم منشأتك.',
      },
    ],
  },
  {
    slug: 'chat',
    path: '/kernel/chat/',
    label: 'المحادثة',
    shortDescription: 'محادثة ذكاء اصطناعي آمنة بضوابط الحوكمة',
    title: 'محادثة ذكاء اصطناعي آمنة بضوابط الحوكمة | BrightAI',
    description: 'وفّر لفرقك محادثة ذكاء اصطناعي آمنة تطبّق سياسات الحوكمة، وتحمي البيانات الحساسة، وتوثّق كل تفاعل بسجل تدقيق كامل وفق PDPL وNCA ECC.',
    canonical: 'https://brightai.site/kernel/chat/',
    h1: 'المحادثة الآمنة',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/chat/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/chat/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-firewall',
    docSlug: 'kernel-chat',
    blogPath: '/blog/ai-firewall-why-you-need-it/',
    blogLabel: 'AI Firewall: ما هو ولماذا تحتاجه لمنشأتك',
    iconSvg: icons.chat,
    relatedSlugs: ['policies', 'audit', 'approvals', 'scenarios'],
    seoBlocks: [
      {
        heading: 'وش يميّز محادثة Kernel عن ChatGPT العادي؟',
        paragraphs: [
          'محادثة Kernel العادية تشتغل مثل أي مساعد ذكاء اصطناعي، لكن مع 4 فروقات جوهرية تحمي شركتك: (1) فحص PII تلقائي قبل الإرسال — إذا كتبت "أعطني قائمة عملاء الرياض"، النظام يكتشف PII ويحظر الطلب قبل ما يوصل للنموذج. (2) تقييم مخاطر ذكي — كل طلب ياخذ درجة 0-100 بناءً على نوع البيانات والسياق. (3) مطابقة سياسات الشركة — إذا عندك سياسة "لا تولّد محتوى تسويقي بدون موافقة"، Kernel يطبقها تلقائياً. (4) سجل تدقيق كامل — كل رسالة (مدخلة ومخرجة) محفوظة مع Trace ID فريد للمراجعة اللاحقة.',
          'النتيجة: موظفك يقدر يستخدم AI في شغله اليومي بدون ما يخاطر بتسريب بيانات أو يخالف سياسات الشركة. والميزة الكبيرة إنك تقدر تطبق الحوكمة بدون ما تحظر AI كلياً — الفريق يوصل لـ AI، لكن تحت ضوابط واضحة.',
        ],
        bullets: [
          'فحص PII آني قبل إرسال كل طلب للنموذج (اسماء، أرقام، عناوين، سجلات طبية)',
          'تقييم مخاطر ذكي (0-100) يحدد هل الطلب ينفذ تلقائياً أو يحتاج موافقة',
          'تطبيق سياسات الشركة القابلة للتخصيص بدون كود (no-code policy editor)',
          'سجل تدقيق غير قابل للتعديل لكل محادثة مع Trace ID فريد',
        ],
      },
      {
        heading: 'كيف يحمي Kernel بيانات الشركة في المحادثات؟',
        paragraphs: [
          'Kernel يستخدم 3 طبقات حماية متتالية. الطبقة الأولى: PII Scanner يكشف الأسماء وأرقام الهواتف والبطاقات والسجلات الطبية قبل الإرسال. الطبقة الثانية: Risk Scoring يحسب مخاطر الطلب بناءً على 12 عامل (نوع البيانات، حساسية الموضوع، صلاحيات المستخدم، الوقت، الموقع). الطبقة الثالثة: Policy Engine يطابق الطلب مع قواعد الشركة. لو أي طبقة فشلت، الطلب ينحظر قبل ما يوصل للنموذج الخارجي.',
          'مثال عملي: موظف يكتب "اعرض لي آخر 2,400 عميل مع أرقامهم". Kernel يكتشف PII (أسماء + هواتف)، يحسب المخاطر 87% (حرج)، ويطابق السياسة "حماية بيانات العملاء". النتيجة: حظر + إشعار + تسجيل في سجل التدقيق. لو الموظف يحتاج فعلاً هالبيانات، يرفع طلب موافقة يروح لمدير الحوكمة.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل المحادثة تشتغل مع كل النماذج (ChatGPT، Claude، Llama)؟',
        a: 'نعم. Kernel يوسط بين المستخدم والنموذج، فأي نموذج يدعمه (OpenAI، Azure OpenAI، Anthropic، Google Vertex، Meta Llama عبر NVIDIA NIM، نماذج محلية) تشتغل معه نفس طبقات الحوكمة. تقدر حتى تخلّي Kernel يختار النموذج تلقائياً حسب نوع الطلب (مثلاً: بيانات حساسة → نموذج محلي، أسئلة عامة → ChatGPT).',
      },
      {
        q: 'وش يصير لو الموظف حاول يسرّب بيانات عمداً؟',
        a: 'Kernel يكتشف المحاولة قبل الإرسال. يظهر تنبيه للشخص إن الطلب ممنوع ولماذا. لو تكرر المحاولة، يرتفع مستوى التنبيه (للمراقب + للمدير). كل محاولة محظورة مسجلة في سجل التدقيق مع تقييم مخاطر عالي. هذا يخلق رادع فعلي ويقلل الحوادث المتعمدة.',
      },
      {
        q: 'هل النموذج يشوف البيانات بعد فحص PII؟',
        a: 'هذا يعتمد على إعدادك. الخيار الافتراضي: لو PII كُشف، الطلب ينحظر كلياً. خيار آخر: PII يُخفى (redacted) قبل الإرسال والنموذج يوصل لنسخة مخفية، ثم Kernel يعيد البيانات الأصلية للعرض للموظف. الخيار الثاني مفيد للاستخدامات المشروعة (مثلاً: تلخيص سجلات مرضى).',
      },
      {
        q: 'كيف أحصل على سجل المحادثات للجهات الرقابية؟',
        a: 'Kernel يحفظ كل محادثة بشكل دائم في سجل التدقيق مع Trace ID وHash Chain. تقدر تطلب تقرير فترة معينة من /kernel/reports/ بصيغة PDF موقعة رقمياً أو JSON قابل للتحقق. التقرير جاهز للجهات الرقابية (NCA، SDAIA، SAMA، SFDA) دون تحضير إضافي.',
      },
      // BAI-VOC-001-B (2026-07-18): 5th FAQ — vendor-training/data-residency
      // concern commonly raised by Saudi enterprises.
      {
        q: 'هل المحادثات في Kernel تبقى خاصة ولا تتدرب عليها النماذج؟',
        a: 'نعم. Kernel وسيط بين المستخدم والنموذج، فيستقبل الطلب ويفحصه ويوجهه للنموذج بدون أن يحفظ بيانات التدريب. الإعداد الافتراضي يمنع تدريب النماذج على بيانات شركتك، ويمكن تأكيده من إعدادات Kernel. هذا يحمي بيانات الشركة من التسرب عبر تدريب النماذج عليها في المستقبل، ويدعم متطلبات PDPL وNCA ECC.',
      },
    ],
  },
  {
    slug: 'audit',
    path: '/kernel/audit/',
    label: 'التدقيق',
    shortDescription: 'سجل تدقيق الذكاء الاصطناعي وتتبع القرارات',
    title: 'سجل تدقيق الذكاء الاصطناعي وتتبع القرارات | BrightAI',
    description: 'تتبّع أحداث الذكاء الاصطناعي في سجل تدقيق زمني يوضح الطلبات والقرارات والتغييرات، ويسهّل التحقيق الداخلي والتحقق من المساءلة.',
    canonical: 'https://brightai.site/kernel/audit/',
    h1: 'سجل التدقيق',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/audit/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/audit/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-audit-trail',
    docSlug: 'kernel-audit-trail',
    blogPath: '/blog/ai-audit-trail-saudi/',
    blogLabel: 'سجل تدقيق AI: من استخدمه وماذا حدث؟',
    iconSvg: icons.audit,
    relatedSlugs: ['chat', 'approvals', 'evidence', 'compliance'],
    seoBlocks: [
      {
        heading: 'وش هو سجل تدقيق الذكاء الاصطناعي؟',
        paragraphs: [
          'سجل التدقيق (Audit Trail) وثيقة زمنية توضح كل قرار اتخذه نظام الذكاء الاصطناعي في شركتك. في Kernel، السجل مو مجرد لوق — هو hash chain غير قابل للتعديل يربط كل حدث بالذي قبله. هذا يعني إنك تقدر تثبت رياضياً إن السجل ما اتعدّل. كل طلب ياخذ Trace ID فريد (مثلاً AI-2026-10493) ويظهر 6 مراحل: استلام، فحص PII، تقييم مخاطر، مطابقة سياسات، استدعاء نموذج، توليد دليل.',
          'السجل يحتوي على: وقت الطلب بالميلي ثانية، المستخدم والقسم، النص المدخل، درجة المخاطر، الحالة النهائية (مسموح/محظور/بانتظار موافقة)، النموذج اللي اتصل، وقت الاستجابة، hash العملية. كل هذا قابل للتصدير CSV/JSON/PDF للمراجعة الداخلية أو للجهات الرقابية.',
        ],
        bullets: [
          'Hash Chain غير قابل للتعديل يربط كل حدث بالذي قبله (تحقق رياضي)',
          'Trace ID فريد لكل عملية مع 6 مراحل موثقة زمنياً',
          'فلاتر متقدمة (تاريخ، مخاطر، حالة، مستخدم، قسم) للعثور على أي حدث',
          'تصدير CSV / JSON / PDF موقّع رقمياً للجهات الرقابية',
        ],
      },
      {
        heading: 'متى تحتاج سجل تدقيق AI في شركتك؟',
        paragraphs: [
          'ثلاث حالات رئيسية: (1) عند التحقيق في حادثة (موظف يدّعي إن النموذج أعطاه معلومة خاطئة). (2) عند مراجعة داخلية أو خارجية (مدقق NCA يسأل عن قرارات AI في 2025). (3) عند استفسار من جهة رقابية (SAMA يطلب إثبات إن قرارات AI في القروض تتفق مع متطلبات PDPL). في كل حالة، السجل يجاوب بـ "مين، متى، وش، وليش" بدون اجتهاد.',
          'بدون Kernel، الشركات تكتشف إن سجلاتها مفقودة لما يكون متأخر: موظف سابق ينشر معلومات سرية، عميل يرفع قضية، أو مدقق يطلب دليل. Kernel يحل هذا بشكل استباقي — كل عملية AI مسجلة بشكل دائم من اليوم الأول.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل سجل التدقيق قابل للتعديل أو الحذف؟',
        a: 'لا. Kernel يستخدم hash chain مشابه لتقنية blockchain — كل سجل يحتوي على hash السجل السابق. أي تعديل على سجل قديم يغير الـ hash ويكسر السلسلة. هذا يثبت رياضياً إن السجل سليم. هذا مطلوب من NCA ECC وSAMA للقطاعات المنظمة.',
      },
      {
        q: 'كم يحتفظ Kernel بالسجلات؟',
        a: 'الافتراضي 7 سنوات (متوافق مع متطلبات PDPL والجهات الرقابية السعودية). تقدر تخصص المدة حسب سياستك (3 سنوات، 5 سنوات، دائم). السجلات محفوظة في قاعدة بيانات مشفّرة مع نسخ احتياطي تلقائي. التخزين في السعودية متاح للعملاء في القطاعات الحساسة.',
      },
      {
        q: 'كيف أبحث في السجلات؟',
        a: 'صفحة /kernel/audit/ فيها فلاتر متقدمة: نطاق تاريخ (من-إلى)، مستوى المخاطر (4 مستويات)، الحالة (مسموح/محظور/بانتظار/خطأ)، المستخدم، القسم. كل فلتر يطبّق فورياً. تقدر كذلك البحث بـ Trace ID محدد من شريط البحث في الأعلى.',
      },
      {
        q: 'هل أقدر أصدّر السجل لمنصة SIEM أو نظام مراقبة؟',
        a: 'نعم. Kernel يدعم تصدير إلى Splunk وDatadog وElastic عبر webhook. كل حدث AI يظهر في SIEM كحدث منظم، يقدر فريق الأمن ربطه بأحداث الشبكة والكشف عن التهديدات. هذا ضروري للشركات اللي عندها SOC (Security Operations Center).',
      },
      // BAI-VOC-001-B (2026-07-18): 5th FAQ — incident response /
      // reconstruction (reproducibility pain pattern from VOC report).
      {
        q: 'هل سجل التدقيق يدعم التحقيق في الحوادث (incident response)؟',
        a: 'نعم. سجل التدقيق في Kernel مصمم للتحقيق: يتيح البحث بالتاريخ، المستخدم، نوع الطلب، مستوى المخاطر. يمكن تصدير نتائج البحث كملف JSON أو PDF موقّع رقمياً يُرفع للجهة الرقابية. كما يدعم إعادة بناء أي قرار AI من prompt إلى approval إلى action، ما يسرع التحقيق في الحوادث ويُظهر الجاهزية للجهات الرقابية.',
      },
    ],
  },
  {
    slug: 'approvals',
    path: '/kernel/approvals/',
    label: 'الموافقات',
    shortDescription: 'الموافقات البشرية على قرارات الذكاء الاصطناعي',
    title: 'الموافقات البشرية على قرارات الذكاء الاصطناعي | BrightAI',
    description: 'أدر الموافقات البشرية على قرارات الذكاء الاصطناعي، وراجع مستوى المخاطر والسياق قبل التنفيذ، مع سجل كامل للقرارات.',
    canonical: 'https://brightai.site/kernel/approvals/',
    h1: 'مراجعة الحوكمة',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/approvals/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/approvals/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'human-approval-layer',
    docSlug: 'kernel-approvals',
    blogPath: '/blog/ai-audit-trail-compliance-path/',
    blogLabel: 'سجل تدقيق AI: بناء مسار الامتثال',
    iconSvg: icons.approvals,
    relatedSlugs: ['chat', 'audit', 'policies', 'reports'],
    seoBlocks: [
      {
        heading: 'ليش الموافقات البشرية ضرورية لقرارات AI؟',
        paragraphs: [
          'النماذج اللغوية الكبيرة (LLMs) تنشئ محتوى وتتخذ قرارات بسرعة، لكن قراراتها ليست دقيقة 100%. الدراسات تشير إلى 5-15% من مخرجات النماذج تحتوي على أخطاء أو تحيزات. في القطاعات الحساسة (موارد بشرية، ائتمان، صحي، قانوني)، خطأ واحد ممكن يكون كارثي. لذلك إرشادات SDAIA للذكاء الاصطناعي التوليدي ومعايير ISO/IEC 42001 تشترط "human-in-the-loop" للقرارات عالية المخاطر.',
          'Kernel يطبق هذا المبدأ تلقائياً: الطلبات منخفضة المخاطر (≤30) تنفذ تلقائياً، المتوسطة (31-60) تحتاج موافقة سريعة، العالية (61-85) تحتاج مراجعة كاملة، الحرجة (>85) تنحظر كلياً. المراجع يقدر يفحص السياق، يرفض، يوافق، أو يحوّل لمدير آخر. كل قرار موثّق في سجل التدقيق مع تعليق المراجع — هذا كافي للجهات الرقابية.',
        ],
        bullets: [
          '4 مستويات مخاطر تحدد هل الطلب يحتاج موافقة أو ينفذ تلقائياً',
          'لوحة مراجعة مع فلاتر حسب المستخدم والقسم ودرجة المخاطر',
          'تعليق إلزامي عند الرفض (لماذا تم الرفض) — يوثق في السجل',
          'تحويل الطلبات لمراجع آخر مع ملاحظة التحويل',
        ],
      },
      {
        heading: 'كيف تصمم مسار الموافقات في شركتك؟',
        paragraphs: [
          'Kernel يتيح لك تخصيص من يوافق على ماذا. مثال عملي: طلبات التسويق تحتاج موافقة مدير التسويق + مسؤول حماية البيانات لو فيها PII. طلبات المالية تحتاج موافقة المدير المالي. طلبات العمليات الطبية تحتاج موافقة المدير الطبي + مسؤول SFDA compliance. كل هذا يضبط من محرر السياسات بدون كود.',
          'كمؤسسة، أنت تحدد: (1) من المراجعون في كل قسم، (2) مستوى المخاطر اللي يستدعي مراجعة، (3) مهلة الموافقة (ساعة، يوم، 3 أيام)، (4) من يحوّل الطلبات لو غاب المراجع. الإعدادات تنحفظ في ملف سياسات وتُطبق تلقائياً على كل طلب جديد.',
        ],
      },
    ],
    faq: [
      {
        q: 'كم يأخذ طلب الموافقة في العادة؟',
        a: 'يعتمد على إعداداتك. الافتراضي: 24 ساعة للموافقات المتوسطة، 4 ساعات للموافقات الحرجة. المراجع يتلقى إشعار (إيميل + إشعار داخلي). لو لم يرد في المهلة، النظام يصعّد الطلب للمدير الأعلى. كل قرار (موافقة/رفض/تحويل) يظهر في سجل التدقيق.',
      },
      {
        q: 'وش يصير لو المراجع رفض طلب يحتاج فعلاً؟',
        a: 'الموظف اللي رفع الطلب يتلقى إشعار بالرفض + السبب. يقدر يرفع طلب جديد مع توضيح إضافي، أو يحول الطلب لمدير آخر. الرفض ليس نهاية — هو آلية لتأكيد إن الطلب يستاهل التنفيذ. كل الرفضات مسجلة مع الأسباب، مفيدة لتحليل الأنماط لاحقاً.',
      },
      {
        q: 'هل أقدر أخصص الموافقات حسب القسم؟',
        a: 'نعم. Kernel يدعم workflows مختلفة حسب القسم. مثلاً: التسويق يحتاج مدير تسويق + DPO لو البيانات PII. القانونية تحتاج مدير قانوني فقط. المالية تحتاج مدير مالي + مدير مخاطر. كل workflow يضبط من محرر السياسات (no-code) ويُطبق تلقائياً.',
      },
      {
        q: 'هل يمكن للموافقات تكون تلقائية بالكامل؟',
        a: 'نعم، في حالات محددة. لو السياسة تقول "طلبات التلخيص النصي ≤500 كلمة بدون PII → أوتوماتيك"، النظام يوافق تلقائياً. هذا يقلل العبء على المراجعين ويركّز وقتهم على القرارات النادرة عالية المخاطر. كل الموافقة التلقائية مسجلة في السجل بوضوح.',
      },
      // BAI-VOC-001-B (2026-07-18): 5th FAQ — appeals process
      // (governance latitude pain pattern from VOC report).
      {
        q: 'هل قرارات الموافقات في Kernel قابلة للطعن أو المراجعة؟',
        a: 'نعم. كل قرار موافقة (موافقة/رفض/تحويل) يُسجَّل في سجل التدقيق مع الوقت والمستخدم والمبرر. الموظف أو المدير يمكنه طلب مراجعة القرار من مراقب أعلى، خاصة في القرارات الحرجة. هذا يضمن شفافية العملية ويتيح تصحيح القرارات الخاطئة بدون ضياع السجل، ويدعم متطلبات الحوكمة في NCA ECC وSAMA.',
      },
    ],
  },
  {
    slug: 'stats',
    path: '/kernel/stats/',
    label: 'الإحصائيات',
    shortDescription: 'مؤشرات وإحصائيات استخدام الذكاء الاصطناعي',
    title: 'مؤشرات وإحصائيات استخدام الذكاء الاصطناعي | BrightAI',
    description: 'تابع مؤشرات استخدام الذكاء الاصطناعي ومعدلات المخاطر والموافقات والامتثال، واكشف الاتجاهات مبكراً.',
    canonical: 'https://brightai.site/kernel/stats/',
    h1: 'مؤشرات وإحصائيات استخدام الذكاء الاصطناعي — تابع الأداء والمخاطر',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/stats/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/stats/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'continuous-ai-governance',
    docSlug: 'kernel-stats',
    blogPath: '/blog/best-ai-governance-platforms-2026/',
    blogLabel: 'أفضل منصات حوكمة AI في 2026',
    iconSvg: icons.stats,
    relatedSlugs: ['reports', 'audit', 'compliance', 'chat'],
    seoBlocks: [
      {
        heading: 'وش المؤشرات اللي لازم تراقبها في حوكمة AI؟',
        paragraphs: [
          'خمس فئات مؤشرات أساسية. (1) استخدام: عدد الطلبات اليومي/الأسبوعي، المستخدمون النشطون، النماذج الأكثر استخداماً. (2) مخاطر: توزيع درجات المخاطر، نسبة الطلبات المحظورة، نوع PII الأكثر كشفاً. (3) موافقات: متوسط وقت الموافقة، نسبة الرفض، عدد التصعيدات. (4) نماذج: زمن الاستجابة لكل نموذج، تكاليف API، نسبة الأخطاء. (5) امتثال: عدد الأحداث المرتبطة بـ PDPL/NCA/SFDA، حالة الأدلة الجاهزة.',
          'Kernel يعرض هذه المؤشرات في لوحات تحكم قابلة للتخصيص. تقدر تضيف widget، تعدّل المخططات، تحفظ وجهات نظر لفرق مختلفة (الحوكمة، تقنية، الإدارة العليا). التحديث آني — تشوف آخر طلب قبل ثانية.',
        ],
        bullets: [
          'لوحة KPI رئيسية: 4 مؤشرات (طلبات، موافقات معلقة، مخاطر، PII)',
          'مخططات زمنية (آخر 24 ساعة، 7 أيام، 30 يوم، الربع)',
          'توزيع المخاطر (منخفض/متوسط/عالي/حرج) مع نسب مئوية',
          'أعلى المستخدمين استخداماً، أعلى الأقسام استخداماً، أعلى النماذج تكلفة',
        ],
      },
      {
        heading: 'كيف تستفيد من المؤشرات في تحسين الحوكمة؟',
        paragraphs: [
          'المؤشرات تكشف أنماط قد لا تلاحظها بالعين. مثلاً: قسم التسويق يستخدم AI بنشاط عالي لكن 35% من طلباته تُحظر (PII) — هذا يعني إنك تحتاج تدريب توعية أو سياسة "قناة PII معتمدة". أو: نموذج معين زمن استجابته يرتفع تدريجياً — يعني إنك تحتاج تحجيمه (scale) أو استبداله.',
          'Kernel يدعم alerts تلقائية: "لو تجاوزت الطلبات عالية المخاطر 10% من الإجمالي" أو "لو زمن استجابة نموذج تجاوز 3 ثوان". التنبيهات تروح لقناة Slack أو إيميل أو SMS حسب إعدادك. هذا يخليك تتدخل قبل ما المشكلة تكبر.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل أقدر أصدّر المؤشرات إلى Power BI أو Tableau؟',
        a: 'نعم. Kernel يصدّر البيانات بصيغة JSON أو CSV أو عبر API. تقدر تبني dashboard مخصص في Power BI أو Tableau يصل Kernel عبر API key. كذلك، Kernel يرسل خلاصة يومية تلقائياً لإيميل الإدارة بصيغة HTML أو PDF.',
      },
      {
        q: 'وش الفرق بين المؤشرات اللحظية والتقارير؟',
        a: 'المؤشرات (stats) لحظية — تشوف آخر طلب قبل ثانية. التقارير (reports) دورية — تغطي فترة (أسبوع، شهر، ربع) مع تحليل الاتجاهات. استخدم stats للرقابة اليومية، reports للتقارير للإدارة العليا والجهات الرقابية.',
      },
      {
        q: 'هل تظهر المؤشرات تكلفة API (OpenAI، Azure)؟',
        a: 'نعم. Kernel يحسب تكلفة كل طلب بناءً على الـ tokens والأسعار المعلنة من المزود. تقدر تشوف التكلفة اليومية/الأسبوعية/الشهرية، التكلفة حسب النموذج، التكلفة حسب القسم. هذا يساعدك تخصص الميزانية وتكشف الاستخدام المفرط.',
      },
      {
        q: 'كيف أعرف إن قسم معين يستخدم AI بشكل مفرط؟',
        a: 'لوحة stats فيها ترتيب الأقسام حسب الاستخدام. لو قسم يستخدم 60% من الـ quota، تنبيه تلقائي. تقدر كذلك تضع حد أقصى (quota) لكل قسم (مثلاً: 50,000 طلب شهرياً). لو وصل الحد، الطلبات الإضافية تحتاج موافقة مدير القسم.',
      },
    ],
  },
  {
    slug: 'connectors',
    path: '/kernel/connectors/',
    label: 'الموصلات',
    shortDescription: 'موصلات الذكاء الاصطناعي للأنظمة المؤسسية',
    title: 'موصلات الذكاء الاصطناعي للأنظمة المؤسسية | BrightAI',
    description: 'اربط بوابة الذكاء الاصطناعي بأنظمة المؤسسة ومصادر البيانات عبر موصلات محكومة، مع فحص تلقائي وتوثيق كل اتصال.',
    canonical: 'https://brightai.site/kernel/connectors/',
    h1: 'الموصلات',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/connectors/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/connectors/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-governance-platform',
    docSlug: 'kernel-connectors',
    blogPath: '/blog/ai-governance-saudi-arabia/',
    blogLabel: 'حوكمة AI في السعودية: ابدأ بدون تعقيد',
    iconSvg: icons.connectors,
    relatedSlugs: ['chat', 'audit', 'evidence', 'compliance'],
    seoBlocks: [
      {
        heading: 'وش الموصلات (Connectors) في Kernel؟',
        paragraphs: [
          'الموصلات قنوات آمنة بين Kernel والأنظمة المؤسسية: ERP (SAP، Oracle)، CRM (Salesforce، Dynamics)، HIS (Epic، Cerner)، LMS (Moodle)، SharePoint، Okta SSO. كل موصل يعمل بصلاحية قراءة فقط (read-only) افتراضياً، مع مصادقة OAuth 2.0 أو SAML. البيانات تتدفق من النظام إلى Kernel (لتلخيص، تصنيف، بحث) ولا تتدفق بالعكس افتراضياً.',
          'هذا مهم للقطاعات الحساسة. مثلاً: مستشفى يربط Kernel بـ Epic HIS لتلخيص السجلات الطبية. Kernel يقرأ السجل، يلخصه، ويعرضه للطبيب — لكن لا يكتب في Epic. كل اتصال موثّق في سجل التدقيق (وقت، مستخدم، استعلام، نتيجة).',
        ],
        bullets: [
          '8 موصلات جاهزة: SAP، Oracle، Dynamics، Salesforce، Epic، SharePoint، Okta، Moodle',
          'مصادقة OAuth 2.0 وSAML 2.0 — لا مفاتيح API في الكود',
          'صلاحيات قراءة فقط افتراضياً (write requires explicit approval)',
          'مراقبة حالة + سجل مزامنة + تنبيهات عند الفشل',
        ],
      },
      {
        heading: 'كيف تضيف موصل مخصص لأنظمة غير جاهزة؟',
        paragraphs: [
          'Kernel يدعم موصلات مخصصة عبر REST API أو GraphQL. لو عندك نظام داخلي (مثلاً HR system أو نظام إدارة المستندات)، تقدر تبني موصل في 2-3 أيام عمل. كل ما تحتاجه: نقطة نهاية (endpoint)، نوع المصادقة، الحقول المسموح بقراءتها. فريق BrightAI يقدر يساعدك في البناء لو تحتاج.',
          'كمثال، بنك يربط Kernel بنظام الفروع الداخلية. الموصل يقرأ بيانات العملاء (مع إخفاء PII تلقائياً)، يلخص ملف العميل للمدير، ويسجل كل عملية قراءة. الموصل يخضع لاختبار اختراق (penetration test) قبل النشر في الإنتاج، ومتطلبات NCA ECC تطبق عليه.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل الموصلات تشتغل مع أنظمة On-Premise؟',
        a: 'نعم. Kernel يدعم النشر الهجين (hybrid) — Kernel في السحابة السعودية وموصلات في الشبكة الداخلية للشركة عبر VPN أو PrivateLink. البيانات لا تخرج من الشبكة الداخلية للشركة. مناسب للبنوك والجهات الحكومية اللي عندها متطلبات Data Residency.',
      },
      {
        q: 'كم يستغرق ربط موصل جديد؟',
        a: 'الموصلات الجاهزة (SAP، Oracle، Dynamics، إلخ) من 2-4 ساعات (إعداد OAuth + اختبار). الموصل المخصص (نظام داخلي) من 2-5 أيام عمل. يشمل: التطوير، اختبار الواجهة، اختبار الأمان، توثيق الربط، تدريب فريقك على إدارة الموصل.',
      },
      {
        q: 'وش يصير لو الموصل قطع الاتصال (downtime)؟',
        a: 'Kernel يحفظ كل طلب في قائمة انتظار (queue). عند عودة الاتصال، يعالج الطلبات بالترتيب. لو الموصل معطل أكثر من 30 دقيقة، تنبيه تلقائي لفريق تقنية. السجل يوضح إن الطلب تأخر بسبب الموصل وليس بسبب Kernel نفسه.',
      },
      {
        q: 'هل يمكن للموصل يكتب في النظام الأصلي؟',
        a: 'افتراضياً لا. كل الموصلات read-only. الكتابة تتطلب موافقة صريحة من مسؤول النظام + إعداد خاص + موافقة من فريق الحوكمة. هذا يقلل المخاطر في حالة اختراق أو خطأ بشري. الكتابة الكاملة متاحة كـ feature مدفوع في خطة Enterprise Plus.',
      },
      // BAI-VOC-001-B (2026-07-18): 5th FAQ — on-prem residency
      // (data localization / cloud localization, VOC pattern #15).
      {
        q: 'هل يدعم Kernel موصلات مع نماذج On-Premise (داخل الشركة)؟',
        a: 'نعم. يدعم Kernel تشغيل الموصلات مع نماذج داخلية (On-Premise) مثل Llama محلي أو نماذج مخصصة على خوادم الشركة. هذا يلزم الشركات الحساسة (بنوك، مستشفيات، جهات حكومية) التي لا تستطيع إرسال بياناتها لسحابة عامة. الموصل يحافظ على بقاء البيانات داخل حدود الشركة مع نفس طبقات الحوكمة (PII scan، risk scoring، audit log).',
      },
    ],
  },
  {
    slug: 'scenarios',
    path: '/kernel/scenarios/',
    label: 'السيناريوهات',
    shortDescription: 'اختبار سيناريوهات ومخاطر الذكاء الاصطناعي',
    title: 'اختبار سيناريوهات ومخاطر الذكاء الاصطناعي | BrightAI',
    description: 'اختبر سيناريوهات استخدام الذكاء الاصطناعي قبل التشغيل، وقارن مستويات المخاطر والاستجابات لتجهيز فرق الحوكمة.',
    canonical: 'https://brightai.site/kernel/scenarios/',
    h1: 'السيناريوهات',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/scenarios/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/scenarios/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-risk-classification',
    docSlug: 'kernel-scenarios',
    blogPath: '/blog/ai-red-teaming-security-testing/',
    blogLabel: 'AI Red Teaming: اختبار أمان أنظمة الذكاء',
    iconSvg: icons.scenarios,
    relatedSlugs: ['chat', 'policies', 'audit', 'approvals'],
    seoBlocks: [
      {
        heading: 'ليش اختبار السيناريوهات ضروري قبل نشر AI في الإنتاج؟',
        paragraphs: [
          'النماذج اللغوية الكبيرة يمكن أن تتصرف بطرق غير متوقعة. مثلاً: نموذج مدرّب على بيانات مالية قد يحاول إعطاء نصيحة استثمارية (مخالف لنظام هيئة السوق المالية). أو نموذج خدمة عملاء قد يكشف بيانات عميل آخر في المحادثة. اختبار السيناريوهات (Scenario Testing) يكشف هذه الحالات قبل ما تصير في الإنتاج.',
          'Kernel يتيح لك تشغيل 50+ سيناريو افتراضي (PII leakage، prompt injection، تحيز، معلومات خاطئة) على نموذجك قبل نشره. كل سيناريو يُصنّف (نجح/فشل) ويُسجّل. النتيجة: تقرير جاهز يوضح مستوى استعداد النموذج للإنتاج، مع توصيات لتحسين السياسات.',
        ],
        bullets: [
          '50+ سيناريو جاهز: PII leakage، prompt injection، تحيز، hallucination، jailbreak',
          'سيناريوهات مخصصة (تضيفها من محرر السياسات)',
          'تقرير تقييم المخاطر قبل النشر مع توصيات',
          'إعادة تشغيل تلقائية بعد كل تحديث للسياسات',
        ],
      },
      {
        heading: 'وش الفرق بين Scenario Testing و Red Teaming؟',
        paragraphs: [
          'Scenario Testing يختبر سلوك النموذج في حالات متوقعة. Red Teaming يختبر سلوك النموذج في حالات خبيثة (محاولات اختراق، استخراج بيانات، تجاوز ضوابط). Kernel يدعم الاثنين: Scenario Testing للحالات اليومية (PII، سياسات الشركة)، Red Teaming للحالات الخبيثة (prompt injection، data poisoning).',
          'مثال: Red Team يحاول يستخرج بيانات تدريب النموذج بأسئلة غير مباشرة. السيناريو يختبر هل النموذج يكشف معلومة سرية. لو نجح الفريق (أي النموذج فشل)، يضاف سيناريو جديد للسياسات لمنع هذه الحالة. النتائج تتراكم مع الوقت ويصبح النموذج أقوى.',
        ],
      },
    ],
    faq: [
      {
        q: 'كم سيناريو أقدر أشغّل على نموذج؟',
        a: 'لا يوجد حد. تقدر تشغّل 50 سيناريو جاهز + 50 سيناريو مخصص = 100 سيناريو في دفعة واحدة. كل سيناريو يأخذ 2-5 ثوان. تشغيل كامل المجموعة يستغرق 5-10 دقائق. النتائج تحفظ في تقرير يمكن مقارنته مع إصدارات سابقة.',
      },
      {
        q: 'هل السيناريوهات تشتغل على نماذج محلية أم سحابية فقط؟',
        a: 'الاثنين. Kernel يدعم اختبار النماذج المحلية (Llama، Mistral على NVIDIA NIM) والسحابية (OpenAI، Azure OpenAI، Anthropic). الفرق إن اختبار النموذج المحلي أسرع (ما في API call) ويعمل بدون اتصال إنترنت.',
      },
      {
        q: 'وش يصير لو السيناريو فشل؟',
        a: 'Kernel يسجل الفشل + نوع الخطأ + النص اللي سبب الفشل. يضيف الفشل لقائمة "مخاطر مكتشفة" في صفحة المخاطر. الفريق يقدر يضيف قاعدة جديدة في السياسات تمنع هذا السلوك. مثلاً: لو سيناريو PII فشل، تضاف سياسة "إخفاء الأسماء السعودية في المخرجات".',
      },
      {
        q: 'هل Red Teaming مطلوب من الجهات الرقابية؟',
        a: 'NCA ECC في تحديثاته الأخيرة تشير إلى اختبار الاختراق لأنظمة AI. SDAIA في إرشاداتها للذكاء الاصطناعي التوليدي تنصح بإجراء Red Teaming قبل النشر. كذلك، ISO/IEC 42001 يوصي باختبار السيناريوهات كجزء من إدارة المخاطر. Red Teaming ليس إلزامياً قانونياً بعد، لكنه أفضل ممارسة ويُتوقع أن يصبح إلزامياً.',
      },
    ],
  },
  {
    slug: 'policies',
    path: '/kernel/policies/',
    label: 'السياسات',
    shortDescription: 'محرر سياسات الذكاء الاصطناعي البصري',
    title: 'محرر سياسات الذكاء الاصطناعي البصري | BrightAI',
    description: 'صمّم سياسات الذكاء الاصطناعي في محرر بصري يحدد الشروط والإجراءات والضوابط، ثم فعّلها فوراً عبر سير العمل.',
    canonical: 'https://brightai.site/kernel/policies/',
    h1: 'محرر السياسات البصري',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/policies/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/policies/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-firewall',
    docSlug: 'kernel-policies',
    blogPath: '/blog/ai-usage-policy-template-saudi/',
    blogLabel: 'قالب سياسة استخدام AI — 12 بنداً',
    iconSvg: icons.policies,
    relatedSlugs: ['chat', 'approvals', 'audit', 'compliance'],
    seoBlocks: [
      {
        heading: 'وش محرر السياسات في Kernel؟',
        paragraphs: [
          'محرر بصري (no-code) تعرّف فيه قواعد استخدام الذكاء الاصطناعي في شركتك. بدل ما تكتب كود أو تعدّل ملفات، تختار شروط من قوائم جاهزة: "إذا الطلب يحتوي PII → يحظر"، "إذا كان المستخدم من قسم التسويق → موافقة مدير"، "إذا كان الموضوع مالي → نموذج محلي فقط". كل قاعدة تُفعّل فوراً وتُطبّق على كل طلب AI.',
          'مثال واقعي: شركة تأمين سعودية تعرّف 12 سياسة: (1) لا تسريب PII، (2) لا توليد محتوى طبي بدون طبيب، (3) لا قرارات ائتمان بدون موافقة مدير مخاطر، (4) كل عملية توثيق، (5) زمن استجابة أقل من 5 ثوان. كل سياسة لها: اسم، وصف، شروط، إجراء، مستوى مخاطر. المعدّلون في الحوكمة يعدّلون بدون ما يطلبوا من فريق التقنية.',
        ],
        bullets: [
          'محرر بصري بدون كود (no-code policy editor)',
          '12 قالب جاهز: PII، محتوى، نماذج، أقسام، مخاطر',
          'تفعيل فوري (لا deploy، لا restart)',
          'محرر يوضح كل سياسة بالعربي مع شروط وإجراءات واضحة',
        ],
      },
      {
        heading: 'كيف تبني سياسة حوكمة AI متوافقة مع اللوائح السعودية؟',
        paragraphs: [
          'ابدأ بثلاث سياسات أساسية. (1) سياسة حماية البيانات (PII Policy) — تمنع تسريب البيانات الشخصية خارج المؤسسة. تستند إلى المادة 12 من PDPL. (2) سياسة المحتوى الطبي (Medical Content Policy) — تمنع توليد نصائح طبية أو دوائية بدون إشراف بشري، تستند إلى متطلبات SFDA. (3) سياسة القرار الائتماني (Credit Decision Policy) — تمنع اتخاذ قرارات ائتمان بدون موافقة بشرية، تستند إلى متطلبات SAMA.',
          'بعد الثلاث الأساسية، أضف سياسات مخصصة لشركتك. Kernel يتيح لك تجربة السياسة قبل التفعيل (mode=simulation): يشوف كيف كان يأثر على الطلبات السابقة. هذا يساعدك تختبر بدون ما تكسر شغل الفريق. بعد التأكد، فعّلها بـ toggle واحد.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل أحتاج فريق تقني لإدارة السياسات؟',
        a: 'لا. Kernel مصمم لفريق الحوكمة (Compliance + Legal + DPO). كل السياسات والقواعد تُدار من واجهة بصرية. الفريق التقني فقط يتدخل عند إضافة موصل جديد أو تحديث النموذج. 80% من إدارة السياسات تتم بدون كود.',
      },
      {
        q: 'كم سياسة أقدر أعرّف؟',
        a: 'لا يوجد حد عملي. الشركات النموذجية تبدأ بـ 5-10 سياسات وتصل إلى 30+ مع الوقت. Kernel يدعم 100+ سياسة نشطة. كل سياسة لها شروط متعددة (AND/OR) وإجراءات متدرجة (حظر، إخفاء، موافقة، تحذير).',
      },
      {
        q: 'وش يصير لو السياسة تسبب ضرر (مثلاً تحظر طلب مشروع)؟',
        a: 'Kernel يدعم وضع simulation: تشغّل السياسة على الطلبات السابقة وتشوف كم طلب كان سيتأثر بدون تطبيق فعلي. هذا يساعدك تختبر. كذلك، تقدر تخصص "grace period" — تحظر الطلب لكن تظهر رسالة توضيحية بدل الرفض الصامت، وتعطي مهلة للفريق ليتأقلم.',
      },
      {
        q: 'هل السياسات تشتغل على كل النماذج؟',
        a: 'نعم. السياسات تُطبّق على مستوى Kernel (قبل استدعاء أي نموذج). هذا يعني إنك مو محتاج تكرر السياسة في كل نموذج. مثال: سياسة "إخفاء PII" تُطبّق على OpenAI وAzure وAnthropic وLlama بدون تكرار.',
      },
    ],
  },
  {
    slug: 'evidence',
    path: '/kernel/evidence/',
    label: 'الأدلة',
    shortDescription: 'ملف أدلة امتثال الذكاء الاصطناعي',
    title: 'ملف أدلة امتثال الذكاء الاصطناعي | BrightAI Kernel',
    description: 'أنشئ ملف أدلة امتثال لكل قرار ذكاء اصطناعي، واجمع السجلات والموافقات والسياسات المرتبطة في ملف واحد.',
    canonical: 'https://brightai.site/kernel/evidence/',
    h1: 'الأدلة',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/evidence/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/evidence/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-evidence-file',
    docSlug: 'kernel-evidence',
    blogPath: '/blog/ai-audit-trail-compliance-path/',
    blogLabel: 'سجل تدقيق AI: بناء مسار الامتثال',
    iconSvg: icons.evidence,
    relatedSlugs: ['audit', 'approvals', 'compliance', 'reports'],
    seoBlocks: [
      {
        heading: 'وش ملف الأدلة (Evidence File) في Kernel؟',
        paragraphs: [
          'ملف PDF موقّع رقمياً يجمع كل ما يتعلق بقرار AI واحد: الطلب الأصلي، درجة المخاطر، السياسة المطبقة، اسم المراجع (إن وُجد)، النموذج المستخدم، الإجابة، hash السجل. الملف جاهز للجهات الرقابية (NCA، SDAIA، SAMA، SFDA) دون تحضير إضافي. يُولّد تلقائياً لكل عملية AI ويبقى في الأرشيف الدائم.',
          'هذا يحل مشكلة كبيرة: قبل Kernel، تحضير ملف تدقيق لقرار AI واحد كان يأخذ 30-60 دقيقة من فريق الحوكمة (جمع السجلات، كتابة السياق، إرفاق الموافقات). Kernel يولّد الملف في 5 ثوان. لو الجهة الرقابية طلبت 100 ملف لطلبات الشهر الماضي، تحضّرها في 8 دقائق بدل 100 ساعة.',
        ],
        bullets: [
          'PDF موقّع رقمياً + JSON قابل للتحقق الرياضي',
          'يحتوي: الطلب، المخاطر، السياسة، الموافقات، الإجابة، hash',
          'قابل للتسليم للجهات الرقابية بدون تحضير',
          'مخزّن في أرشيف دائم مع فهرسة بالـ Trace ID',
        ],
      },
      {
        heading: 'متى تحتاج ملف أدلة AI؟',
        paragraphs: [
          'ثلاث حالات رئيسية. (1) استفسار من جهة رقابية: SAMA يطلب ملف لقرار ائتمان AI في تاريخ معين. (2) تحقيق داخلي: فريق المخاطر يحقق في حادثة. (3) نزاع قانوني: عميل يرفع قضية ويطلب إثبات إن قرار AI اتخذ بشكل صحيح. في كل حالة، الملف يجاوب على كل الأسئلة.',
          'الصيغة موحدة ومقبولة في الجهات الرقابية. الـ hash في الملف يطابق الـ hash في السجل — هذا يثبت إن الملف ما اتعدّل بعد توليده. لو حصلت أي محاولة تعديل، الـ hash يتغير وتظهر علامة "تم التعديل" في الملف.',
        ],
      },
    ],
    faq: [
      {
        q: 'كم يستغرق توليد ملف أدلة؟',
        a: '5 ثوان لكل ملف. لو طلبت 1000 ملف لدفعة، Kernel يولّدها بالتوازي في 2-3 دقائق. كل ملف 2-4 صفحات PDF مع تفاصيل كاملة. التوقيع الرقمي مدمج ولا يحتاج تدخل.',
      },
      {
        q: 'هل ملفات الأدلة مقبولة رسمياً من الجهات الرقابية؟',
        a: 'ملفات Kernel تتبع معايير ISO/IEC 27001 وISO/IEC 42001 في التوثيق. تشمل: timestamp دقيق (بالمللي ثانية)، hash قابل للتحقق، توقيع رقمي، بيانات هوية العملية. مقبولة كدليل مبدئي في معظم الحالات. للملفات الرسمية النهائية، قد تحتاج إرفاق شهادة من مدقق خارجي (third-party auditor).',
      },
      {
        q: 'كم تحتفظ Kernel بالأدلة؟',
        a: 'الافتراضي 7 سنوات. قابل للتعديل حسب سياستك. الأدلة محفوظة في تخزين مشفّر مع نسخ احتياطي تلقائي. متاح الاسترجاع خلال ثوانٍ عبر Trace ID أو فلتر التاريخ.',
      },
      {
        q: 'هل أقدر أربط ملف الدليل بسجل الموظف أو المعاملة؟',
        a: 'نعم. Kernel يدعم metadata مخصصة في كل ملف: رقم المعاملة، رقم العميل، المشروع، القسم، أي tag تحتاجه. هذا يسهّل البحث والأرشفة في نظامك الداخلي. تقدر تبحث عن كل ملفات AI لمعاملة معينة أو عميل معين في ثوانٍ.',
      },
      // BAI-VOC-001-B (2026-07-18): 5th FAQ — distinguish evidence
      // file from raw audit trail (procurement-proof pain pattern).
      {
        q: 'وش الفرق بين ملف الأدلة وسجل التدقيق؟',
        a: 'سجل التدقيق = كل قرار AI (prompt، model، risk، approval) محفوظ تلقائياً. ملف الأدلة = حزمة جاهزة للجهات الرقابية تجمع السجلات، السياسات المطبقة، الموافقات، وتقرير الأثر. الملف يُولَّد عند الطلب بصيغ متعددة (PDF موقّع رقمياً، JSON قابل للتحقق). سجل التدقيق هو المادة الخام، وملف الأدلة هو المنتج النهائي الجاهز للتسليم.',
      },
    ],
  },
  {
    slug: 'compliance',
    path: '/kernel/compliance/',
    label: 'الامتثال',
    shortDescription: 'إدارة امتثال الذكاء الاصطناعي والضوابط',
    title: 'إدارة امتثال الذكاء الاصطناعي والضوابط | BrightAI',
    description: 'راقب امتثال أنظمة الذكاء الاصطناعي للأطر التنظيمية، واربط كل متطلب بالضوابط والسجلات ذات الصلة.',
    canonical: 'https://brightai.site/kernel/compliance/',
    h1: 'الامتثال',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/compliance/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/compliance/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'continuous-ai-governance',
    docSlug: 'kernel-compliance',
    blogPath: '/blog/nca-ecc-ai-controls-guide/',
    blogLabel: 'دليل ضوابط NCA ECC للذكاء الاصطناعي',
    iconSvg: icons.compliance,
    relatedSlugs: ['policies', 'audit', 'evidence', 'reports'],
    seoBlocks: [
      {
        heading: 'وش وحدة الامتثال في Kernel؟',
        paragraphs: [
          'لوحة متابعة حالة الامتثال لأنظمة AI في شركتك عبر 6 أطر تنظيمية رئيسية: PDPL (نظام حماية البيانات الشخصية)، NCA ECC (ضوابط الأمن السيبراني)، SDAIA (إرشادات الذكاء الاصطناعي التوليدي)، SFDA (متطلبات الغذاء والدواء)، ISO/IEC 27001 (أمن المعلومات)، ISO/IEC 42001 (نظام إدارة AI). كل إطار له score من 0-100 وحالة (active/partial/not-started).',
          'Kernel يربط كل متطلب من الأطر بضوابط Kernel (سياسات + سجلات + أدلة). مثلاً: متطلب PDPL "إخفاء بيانات العملاء" مرتبط بسياسة Kernel "PII Redaction Policy" وسجل تطبيقها. هذا يثبت للجهات الرقابية إنك ملتزم بالمتطلب من جهة، وإن عندك آلية تشغيلية لتنفيذه من جهة أخرى.',
        ],
        bullets: [
          '6 أطر تنظيمية: PDPL، NCA ECC، SDAIA، SFDA، ISO 27001، ISO 42001',
          'Score لكل إطار (0-100) مع trend شهري',
          'ربط كل متطلب بالضوابط والسجلات في Kernel',
          'خطة تحسين تلقائية (gap analysis) بالمهام المطلوبة',
        ],
      },
      {
        heading: 'كيف تلبّي متطلبات SDAIA وNCA في آن واحد؟',
        paragraphs: [
          'إرشادات SDAIA للذكاء الاصطناعي التوليدي تشترط 7 مبادئ: العدالة، الشفافية، المساءلة، الخصوصية، الأمان، الموثوقية، الإشراف البشري. ضوابط NCA ECC للأمن السيبراني تشترط 5 ضوابط رئيسية على AI: تحديد المخاطر، حماية البيانات، التحكم في الوصول، المراقبة المستمرة، الاستجابة للحوادث. الـ 12 بند تلتقي في 4 ضوابط Kernel: AI Firewall، Risk Scoring، Human Approval، Audit Trail.',
          'لذلك Kernel يطبق الـ 12 بند تلقائياً عبر الـ 4 ضوابط. مثلاً: مبدأ "الخصوصية" في SDAIA + ضابط "حماية البيانات" في NCA = سياسة "PII Redaction" في Kernel. مرة واحدة تطبقها، تغطي متطلب من إطارين. هذا يقلل العبء التشغيلي على فريقك.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل Kernel يغطي PDPL السعودي بالكامل؟',
        a: 'Kernel يغطي 80% من متطلبات PDPL المتعلقة باستخدام AI (المواد 12-18: حماية البيانات الشخصية، أغراض المعالجة، مشاركة البيانات، الحق في المحو، أمن البيانات). الـ 20% المتبقية متعلقة بحوكمة الشركة العامة (تشكيل DPO، تسجيل في SDAIA) وهي مسؤولية الشركة، ليس Kernel.',
      },
      {
        q: 'كيف أحصل على تقرير امتثال لإرساله لـ NCA؟',
        a: 'صفحة /kernel/reports/ تتيح توليد تقرير امتثال NCA ECC بصيغة PDF موقّعة. التقرير يوضح: حالة كل ضابط، السجلات الدالة على التطبيق، الفجوات (إن وُجدت)، خطة التحسين. جاهز للإرسال لـ NCA دون تحضير إضافي.',
      },
      {
        q: 'هل يدعم Kernel معايير SAMA وSFDA؟',
        a: 'نعم. SAMA (للقطاع المالي) — ضوابط استخدام AI في القروض، التأمين، مكافحة الاحتيال. SFDA (للقطاع الصحي) — ضوابط استخدام AI في التشخيص، الأدوية، الأجهزة الطبية. Kernel يخصص سياسات حسب القطاع ويولد تقارير مخصصة لـ SAMA وSFDA.',
      },
      {
        q: 'كم يستغرق تحقيق score 90% في PDPL؟',
        a: 'يعتمد على الوضع الحالي. لو عندك 0%: 4-6 أسابيع لتركيب Kernel + إعداد سياسات أساسية + تدريب الفريق. لو عندك 50%: 2-3 أسابيع للضبط الدقيق. Kernel يعرض score لحظي وخطة تحسين بالأولويات (high impact / low effort أولاً).',
      },
      // BAI-VOC-001-B (2026-07-18): 5th FAQ — ISO 42001 gap (VOC
      // pattern #28, "ISO 42001 gap analysis in Saudi Arabia").
      {
        q: 'هل يدعم Kernel معايير ISO/IEC 42001 لإدارة AI؟',
        a: 'نعم. Kernel يساعد المؤسسات في تطبيق متطلبات ISO/IEC 42001 عبر: جرد أنظمة AI، تقييم المخاطر، ضوابط التشغيل، سجل التدقيق، والإشراف البشري. ملف الأدلة في Kernel يطابق بنية التدقيق المطلوبة من المدققين المعتمدين. هذا يبسّط على المؤسسات السعودية السعي للحصول على شهادة ISO/IEC 42001 أو التحضير لتدقيق خارجي.',
      },
    ],
  },
  {
    slug: 'reports',
    path: '/kernel/reports/',
    label: 'التقارير',
    shortDescription: 'تقارير حوكمة الذكاء الاصطناعي التنفيذية',
    title: 'تقارير حوكمة الذكاء الاصطناعي التنفيذية | BrightAI',
    description: 'أنشئ تقارير حوكمة الذكاء الاصطناعي للإدارة وفرق الامتثال، واعرض اتجاهات المخاطر والامتثال والقرارات في تقرير واحد.',
    canonical: 'https://brightai.site/kernel/reports/',
    h1: 'التقارير',
    hreflang: [
      { lang: 'ar-SA', href: 'https://brightai.site/kernel/reports/' },
      { lang: 'x-default', href: 'https://brightai.site/kernel/reports/' },
    ],
    ogImage: '/assets/images/og/brightai-og-1200x630.png',
    solutionSlug: 'ai-audit-trail',
    docSlug: 'kernel-reports',
    blogPath: '/blog/best-ai-governance-platforms-2026/',
    blogLabel: 'أفضل منصات حوكمة AI في 2026',
    iconSvg: icons.reports,
    relatedSlugs: ['stats', 'audit', 'compliance', 'evidence'],
    seoBlocks: [
      {
        heading: 'وش أنواع التقارير اللي يولّدها Kernel؟',
        paragraphs: [
          '5 أنواع تقارير جاهزة. (1) تقرير حوكمة شهري — يشمل: استخدام AI، توزيع المخاطر، عدد الموافقات، عدد الرفض. (2) تقرير امتثال ربع سنوي — حالة كل إطار (PDPL، NCA، SDAIA، SFDA)، الفجوات، خطة التحسين. (3) تقرير تدقيق (للمدققين) — يوضح قرارات AI الحرجة مع hash chain للتحقق. (4) تقرير مخاطر — يحدد أعلى 10 طلبات مخاطراً، أنماط، توصيات. (5) تقرير مخصص — تبنيه من widgets (charts + tables) وتحفظه كقالب.',
          'كل تقرير بصيغة PDF موقّعة رقمياً + نسخة JSON قابلة للتحقق + جدول CSV للبيانات الخام. الإصدار التلقائي: تقرير شهري يرسل للإدارة في أول يوم من الشهر، تقرير ربع سنوي يرسل لمجلس الإدارة قبل الاجتماع بـ 7 أيام.',
        ],
        bullets: [
          '5 أنواع تقارير: حوكمة، امتثال، تدقيق، مخاطر، مخصص',
          'PDF موقّع رقمياً + JSON + CSV لكل تقرير',
          'إصدار تلقائي مجدول (يومي، أسبوعي، شهري، ربع سنوي)',
          'قوالب قابلة للحفظ لإعادة الاستخدام مع فرق مختلفة',
        ],
      },
      {
        heading: 'كيف تستخدم التقارير في قرارات الإدارة؟',
        paragraphs: [
          'الإدارة العليا تحتاج رؤية موحدة بدون تفاصيل تقنية. تقرير Kernel الشهري يجاوب على 5 أسئلة: (1) كم شخص يستخدم AI؟ (2) كم من طلباتهم تُحظر؟ (3) ما أكثر المخاطر؟ (4) هل نحن ملتزمين؟ (5) وين نحتاج تحسين؟ كل سؤال مرفق بمخطط + توصية + مقارنة بالربع السابق.',
          'مثال: تقرير شهر مايو 2026 يقول "الاستخدام ارتفع 35% عن أبريل، المخاطر المتوسطة انخفضت من 28% إلى 22% (تحسن)، قسم التسويق يحتاج تدريب (نسبة الحظر 12% مقابل 5% في باقي الأقسام)". هذا يخلي الإدارة تاخذ قرارات مبنية على أرقام مو حقيقية.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل التقارير موقّعة رقمياً ومقبولة رسمياً؟',
        a: 'نعم. كل تقرير PDF يحتوي على توقيع رقمي (SHA-256) يظهر في أسفل الصفحة الأولى. التوقيع يطابق hash الملف — أي تعديل على التقرير بعد توليده يُكسر التوقيع. مقبول كدليل مبدئي في معظم الحالات التنظيمية والقانونية.',
      },
      {
        q: 'هل أقدر أعدّل قالب تقرير أو أبني واحد من الصفر؟',
        a: 'نعم. محرر التقارير بصري: تختار widgets (KPIs، charts، tables، text)، ترتبها في الصفحات، تحفظ القالب. تقدر تخصص لكل فريق: قالب للإدارة العليا (ملخص + KPIs)، قالب للحوكمة (تفاصيل سياسات)، قالب للمدققين (سجلات + hash chain).',
      },
      {
        q: 'وش الفرق بين التقارير والـ Dashboard في /kernel/stats/؟',
        a: 'Dashboard (stats) لحظي، تشوف آخر الأرقام. التقارير دورية، تغطي فترة (شهر/ربع/سنة) مع تحليل الاتجاهات. استخدم Dashboard للرقابة اليومية، والتقارير للتقارير الرسمية للإدارة والجهات الرقابية.',
      },
      {
        q: 'هل يمكن إرسال التقارير تلقائياً للإدارة؟',
        a: 'نعم. Kernel يدعم الجدولة التلقائية: تقرير شهري يرسل في أول يوم من كل شهر لإيميلات الإدارة. تقرير ربع سنوي يرسل قبل اجتماع مجلس الإدارة بأسبوع. تقدر تخصص من يستلم (CEO، CFO، DPO، فريق المخاطر) والنسخة (PDF، رابط لـ URL، كلاهما).',
      },
    ],
  },
];

// ── Navigation items (all units except index) ───────────────────────────────

export const kernelNavItems = kernelUnits.filter(u => u.slug !== 'index');

// ── Helper: get unit by slug ────────────────────────────────────────────────

export function getKernelUnit(slug: string): KernelUnit | undefined {
  return kernelUnits.find(u => u.slug === slug);
}

// ── Cross-linking: kernel ↔ solution ↔ doc ↔ blog ───────────────────────────

export function getCrossLinks(unit: KernelUnit) {
  const solutionPath = unit.solutionSlug ? `/solutions/${unit.solutionSlug}/` : null;
  const docPath = `/docs/${unit.docSlug}/`;
  const blogPath = unit.blogPath;
  return { solutionPath, docPath, blogPath };
}

// ── Helper: build FAQPage JSON-LD from a unit ──────────────────────────────

import { getFaqLd } from './schema-helpers';
export function getKernelFaqJsonLd(unit: KernelUnit) {
  return getFaqLd(unit.faq);
}

// ── Demo Data: LiveDashboardMockup ──────────────────────────────────────────

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'إجمالي الطلبات', value: '١٬٢٤٧', trend: 'من سجل Kernel', demo: true },
  { label: 'بانتظار الموافقة', value: '١٨', trend: 'تحتاج قرار بشري', demo: true },
  { label: 'متوسط المخاطر', value: '٢٣٪', trend: 'درجة تشغيلية تراكمية', demo: true },
  { label: 'كشف PII', value: '٤٫٢٪', trend: 'من الطلبات المفحوصة', demo: true },
];

// ── Demo Data: ActivityStream ───────────────────────────────────────────────

export const activityEvents: ActivityEvent[] = [
  {
    type: 'policy_checked',
    label: 'فحص السياسة',
    description: 'تم فحص الطلب مقابل سياسة حماية البيانات الشخصية — النتيجة: متوافق',
    riskLevel: 'low',
    timestamp: '٢٠٢٦/٠٦/١١ ١٨:١٥',
    demo: true,
  },
  {
    type: 'risk_score_assigned',
    label: 'تقييم المخاطر',
    description: 'تم احتساب درجة مخاطر ٤٥/١٠٠ — تصنيف: متوسط — طلب مراجعة إضافية',
    riskLevel: 'medium',
    timestamp: '٢٠٢٦/٠٦/١١ ١٨:١٤',
    demo: true,
  },
  {
    type: 'approval_requested',
    label: 'طلب موافقة',
    description: 'طلب موافقة بشرية بسبب محتوى مالي حساس — الحالة: بانتظار المراجعة',
    riskLevel: 'high',
    timestamp: '٢٠٢٦/٠٦/١١ ١٨:١٢',
    demo: true,
  },
  {
    type: 'evidence_generated',
    label: 'توليد الدليل',
    description: 'تم إنشاء ملف دليل AI-2026-00042 — يشمل السجل والموافقات والسياسات',
    riskLevel: 'minimal',
    timestamp: '٢٠٢٦/٠٦/١١ ١٨:١٠',
    demo: true,
  },
  {
    type: 'pdpl_mapped',
    label: 'ربط PDPL',
    description: 'تم ربط الطلب بالمادة ١٢ من نظام حماية البيانات الشخصية — لا يتطلب إجراء إضافي',
    riskLevel: 'low',
    timestamp: '٢٠٢٦/٠٦/١١ ١٨:٠٨',
    demo: true,
  },
];

// ── Demo Data: ComplianceRadar ──────────────────────────────────────────────

export const complianceFrameworks: ComplianceFramework[] = [
  {
    name: 'PDPL',
    nameAr: 'نظام حماية البيانات الشخصية',
    score: 78,
    maxScore: 100,
    status: 'active',
    description: 'يدعم مواءمة ضوابط حماية البيانات الشخصية وفق نظام PDPL السعودي',
    demo: true,
  },
  {
    name: 'NCA ECC',
    nameAr: 'ضوابط الأمن السيبراني',
    score: 65,
    maxScore: 100,
    status: 'active',
    description: 'يدعم مواءمة متطلبات الضوابط الأساسية للأمن السيبراني من الهيئة الوطنية للأمن السيبراني',
    demo: true,
  },
  {
    name: 'SDAIA',
    nameAr: 'إرشادات الذكاء الاصطناعي التوليدي',
    score: 72,
    maxScore: 100,
    status: 'active',
    description: 'يدعم مواءمة إرشادات هيئة البيانات والذكاء الاصطناعي لاستخدام الذكاء الاصطناعي التوليدي',
    demo: true,
  },
  {
    name: 'SFDA',
    nameAr: 'متطلبات الغذاء والدواء',
    score: 45,
    maxScore: 100,
    status: 'partial',
    description: 'يدعم مواءمة متطلبات الهيئة العامة للغذاء والدواء لتطبيقات الذكاء الاصطناعي في القطاع الصحي',
    demo: true,
  },
  {
    name: 'ISO 27001',
    nameAr: 'إدارة أمن المعلومات',
    score: 82,
    maxScore: 100,
    status: 'active',
    description: 'يدعم مواءمة متطلبات أمن المعلومات وفق معيار ISO/IEC 27001',
    demo: true,
  },
  {
    name: 'ISO 42001',
    nameAr: 'نظام إدارة الذكاء الاصطناعي',
    score: 58,
    maxScore: 100,
    status: 'partial',
    description: 'يدعم مواءمة متطلبات نظام إدارة الذكاء الاصطناعي وفق معيار ISO/IEC 42001',
    demo: true,
  },
];

// ── Demo Data: EvidenceFileMockup ───────────────────────────────────────────

export const evidenceRecords: EvidenceRecord[] = [
  {
    id: 'EV-2026-00042',
    traceId: 'AI-2026-00042',
    query: 'تحليل تقرير مالي ربع سنوي',
    status: 'موافق عليه',
    riskLevel: 'medium',
    riskScore: 45,
    createdAt: '٢٠٢٦/٠٦/١١ ١٨:١٠',
    hash: 'sha256:a3f7c2...e8d1b4',
    demo: true,
  },
  {
    id: 'EV-2026-00041',
    traceId: 'AI-2026-00041',
    query: 'تلخيص بيانات مريض',
    status: 'محظور',
    riskLevel: 'critical',
    riskScore: 92,
    createdAt: '٢٠٢٦/٠٦/١١ ١٧:٤٥',
    hash: 'sha256:b1d9e4...f2c6a8',
    demo: true,
  },
  {
    id: 'EV-2026-00040',
    traceId: 'AI-2026-00040',
    query: 'ترجمة عقد مورد',
    status: 'موافق عليه تلقائياً',
    riskLevel: 'low',
    riskScore: 12,
    createdAt: '٢٠٢٦/٠٦/١١ ١٧:٣٠',
    hash: 'sha256:c4e8a1...d7b3f5',
    demo: true,
  },
  {
    id: 'EV-2026-00039',
    traceId: 'AI-2026-00039',
    query: 'توليد تقرير امتثال',
    status: 'بانتظار الموافقة',
    riskLevel: 'high',
    riskScore: 68,
    createdAt: '٢٠٢٦/٠٦/١١ ١٧:١٥',
    hash: 'sha256:d2f5b3...a9c1e7',
    demo: true,
  },
];

// ── Risk level CSS class helper ─────────────────────────────────────────────

export function riskLevelClass(level: string): string {
  const map: Record<string, string> = {
    minimal: 'k-risk--minimal',
    low: 'k-risk--low',
    medium: 'k-risk--medium',
    high: 'k-risk--high',
    critical: 'k-risk--critical',
  };
  return map[level] || 'k-risk--minimal';
}

export function riskLevelLabel(level: string): string {
  const map: Record<string, string> = {
    minimal: 'ضئيل',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    critical: 'حرج',
  };
  return map[level] || level;
}
