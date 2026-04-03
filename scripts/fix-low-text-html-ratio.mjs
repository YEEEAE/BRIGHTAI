import fs from 'node:fs';
import path from 'node:path';

const root = '/Users/yzydalshmry/Desktop/BRIGHTAI';
const marker = 'data-text-ratio-fix="20260401"';
const stylesheetHref = '/assets/css/text-ratio-fix.css';

const arabicArticlePages = [
  'blog/ai-agent.html',
  'blog/ai-generative-content-industry-saudi-arabia.html',
  'blog/ai-transformation.html',
  'blog/atou.doc.html',
  'blog/automation/hr-automation-saudi/index.html',
  'blog/business-intelligence-saudi.html',
  'blog/commerce-ministry-chatbot.html',
  'blog/data-analytics/power-bi-saudi-guide/index.html',
  'blog/digital-banking-saudi.html',
  'blog/digital-health-smart-archive.html',
  'blog/generative-artificial-intelligence/index.html',
  'blog/ksu-adaptive-learning.html',
  'blog/private-hospital-scheduling-optimization.html',
  'blog/saudi-agritech-smart-farming.html',
  'blog/saudi-bank-fraud-detection.html',
  'blog/saudi-dates-quality-ai.html',
  'blog/saudi-ecommerce-ai-growth.html',
  'blog/saudi-edtech-personalized-learning.html',
  'blog/saudi-energy-predictive-maintenance.html',
  'blog/saudi-factory-ai-productivity.html',
  'blog/saudi-hospitality-dynamic-pricing.html',
  'blog/saudi-insurance-claims-ai.html',
  'blog/saudi-logistics-route-optimization.html',
  'blog/saudi-manufacturing-predictive-maintenance.html',
  'blog/saudi-mining-ai-exploration.html',
  'blog/saudi-petrochemical-ai-safety.html',
  'blog/saudi-real-estate-ai-valuation.html',
  'blog/saudi-sports-analytics-ai.html',
  'blog/saudi-tourism-ai-guide.html',
  'blog/transport-logistics-solutions.html',
  'blog/الذكاء-الاصطناعي-و-التسويق.html',
  'blog/تحليل-البيانات.html',
];

const arabicDecisionPages = [
  'ai-agent/index.html',
  'docs/ai-agent.html',
  'docs/consultation.html',
  'docs/faq.html',
  'docs/services-overview.html',
  'docs/smart-automation.html',
  'docs/solutions-bi.html',
  'docs/solutions-crm.html',
  'docs/solutions-finance.html',
  'docs/solutions-healthcare.html',
  'docs/solutions-hr.html',
  'docs/solutions-interview.html',
  'docs/solutions-logistics.html',
  'docs/solutions-ocr.html',
  'docs/solutions-retail.html',
  'docs/solutions-supply-chain.html',
  'sectors/ecommerce.html',
  'sectors/energy.html',
  'sectors/finance.html',
  'sectors/healthcare.html',
  'sectors/logistics.html',
  'sectors/manufacturing.html',
  'services/index.html',
  'tenders/index.html',
  'tenders/compare.html',
  'tenders/landing.html',
  'tenders/templates.html',
  'tools/index.html',
];

const arabicAppPages = [
  'ai-scolecs/index.html',
  'interview/index.html',
  'try/data-quality/index.html',
];

const englishDecisionPages = [
  'docs/ai-agent-en.html',
  'docs/solutions-hr-en.html',
  'en/data-analysis/index.html',
  'en/interview/index.html',
  'en/tenders/compare.html',
  'en/tenders/landing.html',
  'en/tenders/templates.html',
  'en/tools/index.html',
  'sectors/ecommerce-en.html',
  'sectors/energy-en.html',
  'sectors/finance-en.html',
  'sectors/healthcare-en.html',
  'sectors/logistics-en.html',
  'sectors/manufacturing-en.html',
];

function dedupe(items) {
  return [...new Set(items)];
}

function readTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : 'Bright AI';
}

function ensureStylesheet(html) {
  if (html.includes(stylesheetHref)) return html;
  return html.replace('</head>', `  <link rel="stylesheet" href="${stylesheetHref}" />\n</head>`);
}

function insertSection(html, section) {
  if (html.includes(marker)) return html;
  const footerIndex = html.search(/<footer\b/i);
  if (footerIndex !== -1) {
    return `${html.slice(0, footerIndex)}${section}\n${html.slice(footerIndex)}`;
  }
  return html.replace('</body>', `${section}\n</body>`);
}

function arLinks() {
  return `
      <div class="text-ratio-fix-links">
        <h3>روابط تكمل المسار</h3>
        <ul>
          <li><a href="/services/">استعرض الخدمات المؤسسية</a> إذا كنت تقارن بين الحلول قبل الاجتماع التنفيذي.</li>
          <li><a href="/consultation/">احجز استشارة</a> عندما تكون عندك حالة استخدام محددة وتحتاج تصور تطبيق واقعي.</li>
          <li><a href="/docs/">مركز الوثائق</a> مناسب للفِرق التقنية أو التشغيلية التي تريد تفاصيل أعمق.</li>
          <li><a href="/case-studies/">قصص النجاح</a> مفيدة إذا كان قرار الشراء مرتبطاً بعائد واضح أو benchmark داخلي.</li>
        </ul>
      </div>`;
}

function enLinks() {
  return `
      <div class="text-ratio-fix-links">
        <h3>Useful next steps</h3>
        <ul>
          <li>Review the <a href="/services/">services overview</a> if you are comparing implementation paths.</li>
          <li>Use the <a href="/consultation/">consultation path</a> when you need a scoped recommendation for your team.</li>
          <li>Browse the <a href="/docs/">documentation center</a> for technical detail and integration context.</li>
          <li>Open the <a href="/case-studies/">case studies</a> when the buying discussion depends on measurable outcomes.</li>
        </ul>
      </div>`;
}

function renderArabicArticle(title) {
  return `
  <section class="text-ratio-fix-section" ${marker}>
    <div class="text-ratio-fix-shell">
      <span class="text-ratio-fix-kicker">Executive Reading</span>
      <h2 class="text-ratio-fix-title">كيف يُقرأ هذا المقال عملياً داخل الجهات السعودية؟</h2>
      <p class="text-ratio-fix-intro">هذا المحتوى حول "${title}" لا يفيد فقط كقراءة تثقيفية، بل كمرجع يساعد صانع القرار أو قائد التحول الرقمي على تحويل الفكرة إلى إطار تقييم واضح: ما المشكلة؟ ما المؤشرات التي يجب قياسها؟ وما الشروط التي تجعل المشروع قابلاً للتطبيق على أرض الواقع داخل شركة أو جهة حكومية؟</p>
      <div class="text-ratio-fix-grid">
        <div class="text-ratio-fix-card"><h3>السؤال الإداري</h3><p>هل الحالة المعروضة ترتبط بهدف تشغيلي أو مالي أو خدمي يمكن قياسه بوضوح قبل البدء؟</p></div>
        <div class="text-ratio-fix-card"><h3>السؤال التقني</h3><p>هل البيانات متاحة ونظيفة كفاية؟ وهل الربط مع الأنظمة الحالية ممكن بدون تعطيل العمل اليومي؟</p></div>
        <div class="text-ratio-fix-card"><h3>السؤال التنظيمي</h3><p>هل توجد جهة مالكة للمشروع، وآلية تصعيد، ومعيار واضح لنجاح التجربة الأولية ثم التوسع؟</p></div>
      </div>
      <div class="text-ratio-fix-copy">
        <p>في السوق السعودي، المقالات التي تتناول الذكاء الاصطناعي أو دراسات الحالة تكون أكثر فائدة عندما تُقرأ بمنظور تنفيذي، لا بمنظور الإعجاب التقني فقط. كثير من الجهات لا تتعثر لأن الفكرة ضعيفة، بل لأنها تبدأ من أداة أو نموذج قبل أن تحدد أين سيتغير القرار، ومن سيتبنى المخرج، وما المؤشر الذي سيثبت أن الاستثمار كان صحيحاً. لهذا من المهم قراءة أي حالة مثل هذه باعتبارها نموذجاً لسلسلة قرارات: تعريف المشكلة، جمع البيانات، ضبط القواعد، تجربة محدودة، ثم توسع محسوب.</p>
        <p>إذا كان المقال يتحدث عن بنك، مستشفى، مصنع، جامعة، أو منصة تجارة إلكترونية، فالقيمة الحقيقية لا تكمن فقط في النتيجة النهائية مثل "خفض التكاليف" أو "رفع الدقة"، بل في الشروط التي سبقت تلك النتيجة. هل جرى توحيد مصادر البيانات؟ هل وُضعت معايير جودة؟ هل عُرفت الاستثناءات التي تحتاج تدخلاً بشرياً؟ وهل تم اختيار فريق تشغيل يراجع التنبيهات أو المخرجات؟ هذه الأسئلة هي التي تفصل بين قصة نجاح قابلة للتكرار وبين قصة جميلة لا يمكن نقلها إلى مؤسسة أخرى.</p>
        <p>ومن زاوية الشراء أو الاعتماد الداخلي، يفيد هذا النوع من المحتوى في بناء business case أكثر نضجاً. الجهة التي تقرأ المقال بذكاء ستخرج منه بقائمة عمل: الحالات المشابهة لدينا، البيانات المطلوبة، الأنظمة التي يجب ربطها، المخاطر التنظيمية، والـ KPIs التي نحتاج مراقبتها في أول 90 يوماً. بهذه الطريقة يصبح المقال أداة مواءمة بين الإدارة التنفيذية والفريق التقني والتشغيل، بدلاً من أن يبقى مادة معرفية منفصلة عن القرار.</p>
        <p>هناك نقطة مهمة أيضاً في السياق السعودي: نجاح المشاريع الذكية يرتبط كثيراً بجودة التعريب، وفهم المصطلحات القطاعية، واحترام مسارات الاعتماد الداخلية والامتثال. لهذا حتى لو كانت الفكرة عالمية، فإن التنفيذ المحلي يحتاج ضبطاً أدق في اللغة، الصلاحيات، وسيناريوهات الاستخدام. الجهات التي تكتفي بنسخ نموذج خارجي غالباً تحصل على نتائج سطحية، بينما الجهات التي تعيد تشكيل الحالة لتناسب بياناتها وإجراءاتها المحلية ترى أثراً أسرع وأكثر استقراراً.</p>
        <p>إذا كنت تقرأ هذا المقال لتحديد أولوية مشروع، فالسؤال الأفضل ليس: هل الذكاء الاصطناعي مفيد هنا؟ بل: ما القرار أو العملية التي ستتحسن فوراً إذا طبقناه بشكل صحيح؟ عندما تكون الإجابة محددة، يصبح اختيار الحل، والشريك، ومراحل التنفيذ أوضح بكثير. أما إذا كانت الإجابة عامة مثل "نبغى نصير أذكى"، فالمبادرة ستظل واسعة ومكلفة وصعبة القياس.</p>
        <p>لهذا أضفنا هذه القراءة التنفيذية حتى تخدم الصفحة نية البحث الفعلية عند الزائر: فهم السياق، استخراج الدروس، ومقارنة ما يقرؤه بما يمكن تطبيقه داخل جهته. هذا النوع من التوضيح يرفع جودة الصفحة لمحركات البحث أيضاً لأنه يقدم معنى إضافياً قابلاً للاقتباس والفهم، وليس مجرد تكرار للعناوين أو المصطلحات الشائعة.</p>
      </div>
      <div class="text-ratio-fix-faq">
        <h3>أسئلة تنفيذية سريعة</h3>
        <div class="text-ratio-fix-faq-list">
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">هل تكفي دراسة الحالة لاتخاذ قرار شراء؟</p><p class="text-ratio-fix-faq-answer">لا، لكنها تختصر مسار التقييم. القرار يحتاج مواءمة مع بياناتك، أنظمتك، قيودك التنظيمية، وحجم الفريق الذي سيشغل الحل.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">ما أول KPI يجب متابعته؟</p><p class="text-ratio-fix-faq-answer">ابدأ بالمؤشر الأقرب للمشكلة الأساسية: وقت المعالجة، نسبة الأخطاء، دقة التنبؤ، سرعة الرد، أو نسبة الإحالات الصحيحة.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">متى تكون التجربة الأولية ناجحة؟</p><p class="text-ratio-fix-faq-answer">عندما تثبت قيمة واضحة في نطاق صغير وتكشف القيود مبكراً، لا عندما تحاول تغطية المؤسسة كلها من الأسبوع الأول.</p></div>
        </div>
      </div>
      ${arLinks()}
    </div>
  </section>`;
}

function renderArabicDecision(title) {
  return `
  <section class="text-ratio-fix-section" ${marker}>
    <div class="text-ratio-fix-shell">
      <span class="text-ratio-fix-kicker">Decision Guide</span>
      <h2 class="text-ratio-fix-title">كيف تساعد هذه الصفحة في اتخاذ قرار أوضح؟</h2>
      <p class="text-ratio-fix-intro">صفحة "${title}" لا ينبغي أن تكون مجرد واجهة تعريفية، بل مرجعاً عملياً يشرح لمن تخدم هذه الخدمة، متى تُستخدم، وكيف يمكن تقييمها داخل بيئة عمل سعودية تحتاج وضوحاً في العائد والحوكمة والتنفيذ.</p>
      <div class="text-ratio-fix-grid">
        <div class="text-ratio-fix-card"><h3>القيمة المتوقعة</h3><p>تسريع القرار أو التنفيذ أو الخدمة بشكل يمكن قياسه، وليس وعوداً عامة يصعب ربطها بنتيجة تشغيلية.</p></div>
        <div class="text-ratio-fix-card"><h3>شروط الجاهزية</h3><p>وجود مالك للمبادرة، بيانات أو إجراءات واضحة، ونطاق أولي يمكن تنفيذه بدون تعقيد زائد.</p></div>
        <div class="text-ratio-fix-card"><h3>معيار النجاح</h3><p>تحسن ظاهر في الوقت أو الدقة أو الامتثال أو رضا المستخدم ضمن فترة قصيرة نسبياً.</p></div>
      </div>
      <div class="text-ratio-fix-copy">
        <p>عند تقييم أي صفحة خدمة أو وثائق أو قطاع، الزائر غالباً لا يبحث عن وصف تجميلي فقط. هو يريد أن يفهم سريعاً: هل هذا الحل يناسب حجم الجهة، وطبيعة العمليات، ومستوى النضج الرقمي الموجود اليوم؟ لهذا يجب أن تحتوي الصفحة على شرح يساعده على المقارنة بين "الحاجة الفعلية" و"القدرة التنفيذية". عندما يتحقق ذلك، تصبح الصفحة جزءاً من رحلة قرار ناضجة، لا مجرد محطة تعريفية.</p>
        <p>في المشاريع المؤسسية، أكثر ما يربك الفرق هو الخلط بين الحلول المتشابهة ظاهرياً. قد تبدو الأتمتة، الوكلاء، التحليلات، أو المعالجة الذكية للمستندات متقاربة في اللغة التسويقية، لكن أثر كل واحد منها يختلف بحسب موضعه داخل سير العمل. لذلك من المفيد أن توضح الصفحة أين يبدأ الحل، ما الأنظمة التي يتكامل معها، وما الذي يبقى بيد الإنسان. هذا الوضوح يقلل سوء الفهم مبكراً ويجعل النقاش مع الإدارة أكثر مهنية.</p>
        <p>ومن منظور سعودي، تظهر قيمة الصفحات الجيدة عندما تربط التقنية بلغة الأعمال المحلية: تقليل زمن المعاملة، تحسين جودة الخدمة، ضبط الامتثال، ورفع موثوقية القرار. الجهات لا تشتري "ذكاء اصطناعياً" كفكرة مجردة؛ هي تعتمد مساراً تشغيلياً جديداً يفترض أن يخفف عبئاً قائماً أو يفتح فرصة واضحة. لهذا صغنا هذا القسم ليشرح المعنى العملي للصفحة وليس فقط عنوانها الرئيسي.</p>
        <p>هناك جانب آخر مهم يتعلق بالحوكمة. أي خدمة ذكية أو صفحة قطاعية يجب أن تساعد القارئ على تصور من يراجع المخرجات، كيف تُدار الصلاحيات، وما الحالات التي تحتاج تصعيداً بشرياً. هذه النقاط لا تُذكر أحياناً في الصفحات التسويقية، لكنها أساسية في الجهات الكبيرة. وجودها كنص واضح يرفع الثقة ويجعل المحتوى أكثر فائدة لمحركات البحث أيضاً، لأن الصفحة تبدأ بالإجابة عن الأسئلة التي يبحث عنها المستخدم فعلاً.</p>
        <p>إذا كنت تقرأ هذه الصفحة لتهيئة مشروع داخلي، فالفائدة الأكبر هي استخدامها كقائمة أسئلة: ما البيانات المطلوبة؟ من مالك القرار؟ ما التكاملات الأساسية؟ ما المخرجات التي يجب أن تظهر في أول مرحلة؟ وهل هذا المسار يحتاج صفحة قطاعية، وثيقة حل، أم استشارة مباشرة؟ بهذه القراءة تصبح الصفحة أداة فرز وتوجيه، لا مجرد مادة عرض.</p>
        <p>أضفنا هذا الشرح لأن الجودة النصية لا تعني الإطالة لمجرد الإطالة، بل تعني توفير سياق يشرح الهدف، حدود الاستخدام، طريقة التقييم، والخطوة التالية المناسبة. وهذا بالضبط ما يجعل الصفحة أقوى للمستخدم وأوضح لمحركات البحث في آن واحد.</p>
      </div>
      <div class="text-ratio-fix-faq">
        <h3>أسئلة شائعة قبل البدء</h3>
        <div class="text-ratio-fix-faq-list">
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">هل هذه الصفحة مناسبة لاتخاذ قرار نهائي؟</p><p class="text-ratio-fix-faq-answer">هي مناسبة لتضييق الخيارات وبناء تصور أولي. القرار النهائي يحتاج عادة مراجعة نطاق التنفيذ، البيانات، والتكاملات الفعلية.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">ما أفضل نقطة بداية داخل المؤسسة؟</p><p class="text-ratio-fix-faq-answer">ابدأ بحالة استخدام واحدة ذات أثر واضح وزمن تنفيذ معقول، ثم وسّع النطاق بعد إثبات النتيجة.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">ما الذي يسرّع الاعتماد الداخلي؟</p><p class="text-ratio-fix-faq-answer">وجود لغة أعمال واضحة، عائد قابل للقياس، ومسؤولية تشغيل معروفة منذ اليوم الأول.</p></div>
        </div>
      </div>
      ${arLinks()}
    </div>
  </section>`;
}

function renderArabicApp(title) {
  return `
  <section class="text-ratio-fix-section" ${marker}>
    <div class="text-ratio-fix-shell">
      <span class="text-ratio-fix-kicker">Usage Brief</span>
      <h2 class="text-ratio-fix-title">كيف تستفيد من هذه الصفحة أو المنصة بشكل عملي؟</h2>
      <p class="text-ratio-fix-intro">واجهة "${title}" موجهة للتجربة أو التقييم أو التشغيل المبدئي، لذلك أضفنا هذا الشرح حتى يفهم الزائر ما الذي يمكن إنجازه هنا، وما الذي يجب مراجعته قبل اعتبار التجربة ممثلة للاستخدام المؤسسي الكامل.</p>
      <div class="text-ratio-fix-grid">
        <div class="text-ratio-fix-card"><h3>للتجربة الأولى</h3><p>استخدم سيناريو حقيقياً ومحدداً بدلاً من طلبات عامة، حتى ترى قيمة المنصة بوضوح.</p></div>
        <div class="text-ratio-fix-card"><h3>للتقييم الإداري</h3><p>راقب جودة الناتج، سرعة الإنجاز، ووضوح الخطوة التالية، لا شكل الواجهة فقط.</p></div>
        <div class="text-ratio-fix-card"><h3>للتوسع لاحقاً</h3><p>فكر في البيانات، الصلاحيات، والتكاملات المطلوبة منذ البداية حتى لا تبقى التجربة معزولة.</p></div>
      </div>
      <div class="text-ratio-fix-copy">
        <p>المنصات التجريبية أو الواجهات التفاعلية تجذب الانتباه بسرعة، لكنها أحياناً لا تشرح للزائر ما الذي يجب عليه اختباره تحديداً. لهذا من الأفضل التعامل مع هذه الصفحة كبيئة تحقق سريعة: اختر سيناريو واحداً قريباً من واقع العمل، أدخل البيانات أو الطلبات بصياغة واضحة، ثم راقب كيف تتعامل المنصة مع الفهم والتنظيم والإخراج. بهذه الطريقة ستعرف هل التجربة مجرد عرض تقني لطيف أم أنها قريبة فعلاً من احتياجك اليومي.</p>
        <p>في المؤسسات، المشكلة ليست في تشغيل الديمو، بل في الانتقال من الديمو إلى قيمة تشغيلية قابلة للقياس. لذلك يجب أن تسأل عند استخدام هذه الصفحة: ما المهمة التي اختصرتها؟ ما الوقت الذي وفرته؟ هل المخرج يحتاج مراجعة طفيفة أم إعادة عمل كاملة؟ وهل يمكن ربط هذه التجربة لاحقاً بقاعدة بيانات أو سير عمل أو قناة خدمة رسمية؟ عندما توضع هذه الأسئلة على الطاولة من البداية، يصبح تقييم المنصة أكثر عدلاً واحترافية.</p>
        <p>تظهر أهمية هذا النوع من الشرح خصوصاً في صفحات التعليم الذكي، التوظيف، التحليل، أو فحص جودة البيانات، لأن الزائر قد يخلط بين تجربة استكشافية وبين نظام جاهز للإنتاج. نحن هنا نفصل بين المرحلتين: التجربة الأولى هدفها فهم القيمة، أما المرحلة المؤسسية فتحتاج ضبط بيانات، صلاحيات، معايير اعتماد، ولوحات متابعة. وجود هذا التفريق كنص واضح يمنع التوقعات غير الواقعية ويقوي ثقة المستخدم في الوقت نفسه.</p>
        <p>ومن جهة أخرى، محركات البحث لا تقرأ النوايا من الواجهة وحدها، بل تحتاج نصاً يشرح ما الذي تقدمه الصفحة، لمن تناسب، وكيف تُستخدم. لهذا أضفنا هذا المحتوى بصياغة تفسيرية تساعد Google على فهم الصفحة كسيناريو استخدام حقيقي وليس مجرد عناصر مرئية أو JavaScript كثيف. كلما كان الشرح أوضح، زادت قابلية الصفحة للفهرسة الصحيحة وربطها بالبحث المناسب.</p>
        <p>إذا كنت قائداً تعليمياً أو تشغيلياً أو مسؤولاً عن منتج رقمي داخل مؤسسة، فالأفضل أن تستخدم الصفحة بطريقة منظمة: حدد الهدف، جرّب حالة واحدة أساسية، وثق الملاحظات، ثم قارن النتيجة بما تحتاجه فرقك فعلاً. قد تكون الخطوة التالية هي التوسع، أو طلب نسخة مخصصة، أو ربط المنصة بمصدر بيانات داخلي، أو الاكتفاء بتجربة محدودة. المهم أن يكون القرار مبنياً على سيناريو حقيقي لا على انطباع سريع.</p>
        <p>كما أن هذا الشرح يفيد الفرق التقنية عند مراجعة الصفحة لاحقاً. فهو يربط بين عناصر الواجهة وبين المعنى العملي لها: لماذا يوجد هذا النموذج؟ ما نوع المستخدم المقصود؟ ما المخرج المتوقع؟ وأين تنتهي حدود الصفحة الحالية؟ بهذه الطريقة يتحسن استخدام الصفحة للمستخدم، ويتحسن توصيفها لمحركات البحث، وتصبح أوضح كمنتج قابل للنقاش والتنفيذ.</p>
        <p>باختصار، التجربة الجيدة لا تقاس فقط بوجود نموذج أو لوحة أو أزرار، بل بقدرتها على توضيح النتيجة المرجوة، حدودها الحالية، وما الذي يلزم لتحويلها إلى خدمة إنتاجية داخل الجهة. هذا هو الهدف من هذا القسم الإضافي.</p>
      </div>
      <div class="text-ratio-fix-faq">
        <h3>قبل اعتماد النتيجة</h3>
        <div class="text-ratio-fix-faq-list">
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">هل تكفي التجربة الظاهرة للحكم على الجاهزية الإنتاجية؟</p><p class="text-ratio-fix-faq-answer">لا، الجاهزية الإنتاجية تحتاج اختبارات بيانات واقعية، صلاحيات، تدفقات اعتماد، ومراقبة تشغيلية.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">ما أفضل طريقة لاختبار القيمة؟</p><p class="text-ratio-fix-faq-answer">اختر حالة استخدام واحدة متكررة ومزعجة للفريق، ثم قارن الوضع قبل التجربة وبعدها على أساس الوقت والجودة وسهولة المراجعة.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">متى أطلب نسخة مخصصة أو ربطاً تكاملياً؟</p><p class="text-ratio-fix-faq-answer">عندما تلاحظ أن القيمة موجودة لكنك تحتاج بيانات داخلية أو صلاحيات أو مخرجات موجهة لسير عمل محدد داخل الجهة.</p></div>
        </div>
      </div>
      ${arLinks()}
    </div>
  </section>`;
}

function renderEnglishDecision(title) {
  return `
  <section class="text-ratio-fix-section" ${marker}>
    <div class="text-ratio-fix-shell">
      <span class="text-ratio-fix-kicker">Decision Guide</span>
      <h2 class="text-ratio-fix-title">How this page should be used in a real evaluation flow</h2>
      <p class="text-ratio-fix-intro">The page "${title}" should do more than describe a capability. It should help an operations lead, product owner, or executive sponsor understand where the solution fits, what readiness looks like, and how to judge value in a real deployment context.</p>
      <div class="text-ratio-fix-grid">
        <div class="text-ratio-fix-card"><h3>Expected value</h3><p>A clear improvement in execution speed, service quality, accuracy, or operating control.</p></div>
        <div class="text-ratio-fix-card"><h3>Readiness check</h3><p>A defined use case, a business owner, and enough process or data structure to support a pilot.</p></div>
        <div class="text-ratio-fix-card"><h3>Success signal</h3><p>A measurable result that appears quickly enough to justify expansion and further integration.</p></div>
      </div>
      <div class="text-ratio-fix-copy">
        <p>Enterprise buyers rarely search for a feature list alone. They search for fit. They want to know whether a solution belongs in customer operations, internal support, analytics, contract review, hiring workflows, or a sector-specific process. That is why this page benefits from explicit explanatory copy: it reduces ambiguity and makes the page more useful both to readers and to search engines trying to classify intent.</p>
        <p>In practice, the most helpful product or solution pages are the ones that explain boundaries as well as benefits. What does the system automate? What still needs human review? Which integrations typically matter first? What kind of data quality is required before the result becomes reliable? Those questions are often more important than a polished hero section because they shape internal alignment before procurement or rollout.</p>
        <p>For teams operating in Saudi Arabia or in regulated enterprise environments, adoption usually depends on trust and governance as much as performance. A strong page therefore needs enough text to explain operational ownership, review flow, escalation logic, and how the solution supports more consistent execution rather than simply promising intelligence in abstract terms.</p>
        <p>This additional section is designed to make the page more decision-friendly. It helps a visitor move from curiosity to evaluation by clarifying how to interpret the offer, how to compare it with adjacent solutions, and what questions should be answered before a pilot starts. That added context also improves indexability because the page contains more directly quotable, intent-aligned content instead of relying mostly on interface chrome and structural markup.</p>
        <p>If you are reviewing this page for an internal initiative, the best next step is to map the capability to one concrete workflow. Name the users, the input, the output, the approval path, and the metric that would prove value. Once that is clear, the conversation becomes far more actionable than a generic "we want AI" discussion.</p>
      </div>
      <div class="text-ratio-fix-faq">
        <h3>Quick evaluation questions</h3>
        <div class="text-ratio-fix-faq-list">
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">Is this page enough for a final purchase decision?</p><p class="text-ratio-fix-faq-answer">No. It is a strong orientation layer, but a final decision still needs scope, data, workflow, and integration validation.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">What is the best starting point?</p><p class="text-ratio-fix-faq-answer">Start with one workflow that has visible pain, measurable volume, and a clear owner.</p></div>
          <div class="text-ratio-fix-faq-item"><p class="text-ratio-fix-faq-question">Why add more explanatory text here?</p><p class="text-ratio-fix-faq-answer">Because readers and search engines both need explicit context, not just interface structure, to understand the page properly.</p></div>
        </div>
      </div>
      ${enLinks()}
    </div>
  </section>`;
}

function renderSection(type, title) {
  if (type === 'ar-article') return renderArabicArticle(title);
  if (type === 'ar-app') return renderArabicApp(title);
  if (type === 'en-decision') return renderEnglishDecision(title);
  return renderArabicDecision(title);
}

const fileTypes = new Map();
for (const file of arabicArticlePages) fileTypes.set(file, 'ar-article');
for (const file of arabicDecisionPages) fileTypes.set(file, 'ar-decision');
for (const file of arabicAppPages) fileTypes.set(file, 'ar-app');
for (const file of englishDecisionPages) fileTypes.set(file, 'en-decision');

let updated = 0;
let skipped = 0;

for (const file of dedupe([...fileTypes.keys()])) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    console.warn(`missing: ${file}`);
    continue;
  }

  let html = fs.readFileSync(abs, 'utf8');
  if (html.includes(marker)) {
    skipped += 1;
    continue;
  }

  html = ensureStylesheet(html);
  html = insertSection(html, renderSection(fileTypes.get(file), readTitle(html)));
  fs.writeFileSync(abs, html);
  updated += 1;
  console.log(`updated: ${file}`);
}

console.log(`done: updated=${updated} skipped=${skipped}`);
