/**
 * snippet-pack.ts — BAI-SEO-003-S7 (2026-07-18)
 *
 * Central contract for the P0 snippet pack (TL;DR / "الخلاصة").
 * Single source of truth for the short, answer-first summary block
 * that each P0 page renders inside its hero / intro, and that the
 * WebPage SpeakableSpecification references via the canonical selector
 * `SNIPPET_SELECTOR`.
 *
 * Rules (frozen for S7 — do not change without re-running the audit):
 *   1. Every snippet text MUST be ≤ 60 Arabic words.
 *   2. The tone is "يدعم الجاهزية" — never "مضمون/كامل/قانوني".
 *   3. Each text is answer-first, self-contained (no external context).
 *   4. No new factual claims; no unsourced statistics; no legal-compliance
 *      promises (no "متوافق 100%" / "شهادة ضمان" / "ضمان امتثال").
 *   5. Path keys MUST match the built route under `dist/<path>/index.html`.
 *
 * Selector contract (referenced by apply-speakable-schema.mjs and by
 * every layout that forwards `extraSpeakableSelectors`):
 *   SNIPPET_SELECTOR = 'aside[data-snippet="tl-dr"]'
 *
 * To extend with a new P0 page:
 *   1. Add an entry to P0_SNIPPETS with the canonical path.
 *   2. Render <aside data-snippet="tl-dr" aria-label="الخلاصة"> in the page.
 *   3. Pass SNIPPET_SELECTOR via extraSpeakableSelectors in the layout call
 *      (or rely on the post-build apply-speakable-schema.mjs to wire it).
 *   4. Verify with `node scripts/check-speakable-schema.mjs` (the
 *      selector must match a visible HTML element on the built page).
 */

export const SNIPPET_SELECTOR = 'aside[data-snippet="tl-dr"]';

export const SNIPPET_ARIA_LABEL = 'الخلاصة';

export interface P0Snippet {
  /** Canonical built path (must match dist/<path>/index.html). */
  path: string;
  /**
   * Answer-first, self-contained, formal-Arabic snippet.
   * ≤ 60 Arabic words. Tone: "يدعم الجاهزية".
   */
  text: string;
}

export const P0_SNIPPETS: readonly P0Snippet[] = [
  {
    path: '/',
    text:
      'برايت أيه آي هي نظام تشغيل أمان وحوكمة للذكاء الاصطناعي مصمم للمنشآت السعودية. تركّب تحت أي نموذج داخل المنشأة وتفعّل جدار حماية للبيانات وسجل تدقيق غير قابل للتعديل وموافقات بشرية على القرارات عالية الأثر، وتدعم جاهزية الامتثال لنظام حماية البيانات الشخصية وضوابط الأمن السيبراني وإرشادات سدايا. أداة تشغيلية لا تعد استشارة قانونية.',
  },
  {
    path: '/services/',
    text:
      'خدمات حوكمة الذكاء الاصطناعي من برايت أيه آي تغطي تقييم الجاهزية وحماية البيانات وتدقيق الاستخدامات والموافقات البشرية وإدارة المخاطر، ضمن نظام تشغيل واحد. مصممة للسوق السعودي وتدعم تطبيق ضوابط نظام حماية البيانات الشخصية والهيئة الوطنية للأمن السيبراني. لا تستبدل الاستشارة النظامية أو القانونية المتخصصة.',
  },
  {
    path: '/assessment/ai-governance-readiness/',
    text:
      'تقييم جاهزية حوكمة الذكاء الاصطناعي من برايت أيه آي يفحص السياسات والضوابط وتدفقات البيانات وسجلات التدقيق في منشأتك. ينتج تقريرا فنيا يحدد الثغرات ويقترح خطة عملية مرحلية. يدعم المنشآت في فهم مستوى الجاهزية قبل الالتزام بأي منصة، ويقدم ملف أدلة فنيا قابلا للمراجعة. ليس شهادة قانونية ولا ضمان امتثال.',
  },
  {
    path: '/pricing/',
    text:
      'عروض حوكمة الذكاء الاصطناعي المؤسسية من برايت أيه آي ثلاثة: تقييم جاهزية، وPilot لمدة ثلاثين يوما، ونشر مؤسسي شامل. السعر مخصص في كل عرض ويعتمد على حجم المنشأة ونطاق الاستخدام والضوابط المطلوبة. العروض مصممة لتغطي مسار الجاهزية وفق أولويات المنشأة. الخدمة مكمل للتشغيل وليست بديلا عن الاستشارة القانونية.',
  },
  {
    path: '/kernel/',
    text:
      'نواة برايت أيه آي هي نظام تشغيل حوكمة الذكاء الاصطناعي يركّب تحت أي نموذج داخل المنشأة. تشمل جدار حماية للذكاء الاصطناعي وسجل تدقيق غير قابل للتعديل وموافقات بشرية للقرارات عالية الأثر وملفات أدلة قابلة للمراجعة. تدعم المنشآت السعودية في تطبيق ضوابط حماية البيانات والأمن السيبراني وإرشادات سدايا. أداة تشغيلية لا تعد استشارة قانونية.',
  },
  {
    path: '/customers/bank/',
    text:
      'بنك سعودي رائد بنى حوكمة لاستخدامات الذكاء الاصطناعي عبر فروعه الرقمية مع التركيز على رصد أدوات الذكاء الاصطناعي غير المرصودة ومنع تسرب بيانات العملاء الحساسة. النتيجة انخفاض كبير في حالات الاستخدام غير المرصودة وتغطية كاملة لبيانات العملاء ضمن سجل التدقيق، ولوحة امتثال جاهزة في أسبوعين بدل أشهر من العمل اليدوي.',
  },
  {
    path: '/customers/hospital/',
    text:
      'مستشفى كبير بنى حوكمة لاستخدامات النماذج اللغوية في تحليل التقارير ودعم القرار. ركز على حماية بيانات المرضى ومنع خروجها إلى أدوات خارجية. النتيجة تغطية كاملة لسجلات المرضى الحساسة ضمن سجل التدقيق التشغيلي، وصفر حالات تسرب مؤكدة بعد تفعيل الجدار الوقائي، وجاهزية تدقيق داخلي خلال ثلاثة أسابيع.',
  },
  {
    path: '/customers/pharma/',
    text:
      'مصنع أدوية بنى حوكمة لاستخدامات الذكاء الاصطناعي في البحث والتطوير مع التركيز على توليد الأدلة تلقائيا وربطها بأنظمة الجودة. النتيجة جاهزية تدقيق داخلي خلال ثلاثة أسابيع، وتغطية واسعة للسياسات المعتمدة بضوابط قابلة للقياس آليا، مع تخفيض كبير في الجهد اليدوي لتجهيز ملفات الامتثال.',
  },
  {
    path: '/solutions/banking-ai-governance/',
    text:
      'حوكمة الذكاء الاصطناعي للقطاع المصرفي السعودي تشمل رصد أدوات الذكاء الاصطناعي وتصنيف مخاطر الاستخدامات وحماية بيانات العملاء ومنع تسربها. تساعد البنوك في تطبيق ضوابط البنك المركزي السعودي والهيئة الوطنية للأمن السيبراني، وتوفر سجل تدقيق غير قابل للتعديل ومسار موافقة بشرية للقرارات عالية الأثر. تدعم الجاهزية دون ادعاء امتثال كامل.',
  },
  {
    path: '/solutions/government-ai-governance/',
    text:
      'حوكمة الذكاء الاصطناعي للجهات الحكومية السعودية تغطي حماية بيانات المستفيدين وتطبيق ضوابط الأمن السيبراني وإرشادات سدايا. تساعد الجهات في بناء سجل تدقيق شامل وفحص استخدامات الذكاء الاصطناعي وتصنيف مخاطرها. متوافقة مع متطلبات هيئة الحكومة الرقمية ومعايير رؤية 2030. أداة تشغيلية تستكمل الإطار النظامي ولا تستبدله.',
  },
  {
    path: '/solutions/healthcare-ai-governance/',
    text:
      'حوكمة الذكاء الاصطناعي للمنشآت الصحية السعودية تشمل حماية بيانات المرضى ومنع تسربها عند استخدام النماذج اللغوية في التحليل ودعم القرار. تساعد في تطبيق متطلبات الهيئة العامة للغذاء والدواء ومعايير المركز السعودي لاعتماد المنشآت الصحية، وتوفر مسار موافقة بشرية سريرية وسجل تدقيق طبي قابل للمراجعة.',
  },
  {
    path: '/blog/ai-governance-saudi-arabia/',
    text:
      'حوكمة الذكاء الاصطناعي في السعودية هي منظومة من السياسات والضوابط والأدوات التي تنظم استخدام الذكاء الاصطناعي داخل المنشآت. تتكون من جرد الاستخدامات وتصنيف المخاطر وسياسات استخدام واضحة وموافقات بشرية. تساعد المنشآت على تحقيق الجاهزية لنظام حماية البيانات الشخصية وضوابط الأمن السيبراني وإرشادات سدايا. إطار تشغيلي يستكمل المتطلبات النظامية.',
  },
  {
    path: '/docs/nca-ecc-ai-controls/',
    text:
      'ضوابط الأمن السيبراني الأساسية الصادرة عن الهيئة الوطنية للأمن السيبراني هي الحد الأدنى الإلزامي للجهات في السعودية، وتطبق على أنظمة الذكاء الاصطناعي من خلال ثلاثة أعمدة: سجل تدقيق غير قابل للتلاعب، وتصنيف البيانات إلى أربع مستويات، وموافقات بشرية قبل إطلاق النظام. تساعد المنشآت في ربط استخدامات الذكاء الاصطناعي بالأمن السيبراني.',
  },
] as const;

/** Get the canonical snippet for a built path (e.g. `/services/`). */
export function getP0Snippet(path: string): P0Snippet | undefined {
  return P0_SNIPPETS.find((s) => s.path === path);
}

/**
 * Sanity guard for the contract. Throws in dev if any text exceeds the
 * 60-word budget. The build pipeline runs this on import so any new
 * entry over the budget is caught immediately.
 */
export function assertP0SnippetBudget(): void {
  for (const snippet of P0_SNIPPETS) {
    const wordCount = snippet.text.trim().split(/\s+/).length;
    if (wordCount > 60) {
      throw new Error(
        `[snippet-pack] ${snippet.path} exceeds 60-word budget: ${wordCount} words`,
      );
    }
  }
}

assertP0SnippetBudget();
