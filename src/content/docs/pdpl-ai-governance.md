---
title: "PDPL والذكاء الاصطناعي: إدارة الخصوصية والمخاطر"
metaTitle: "PDPL وحوكمة الذكاء الاصطناعي في السعودية | BrightAI"
description: "افهم كيف ترتبط متطلبات PDPL باستخدامات الذكاء الاصطناعي، وما الضوابط التي تحتاجها شركتك لحماية البيانات وتوثيق الامتثال في السعودية، مع خطوة تالية واضحة."
canonical: "https://brightai.live/docs/pdpl-ai-governance/"
updated: "2026-09-04"
category: "PDPL"
tldr: "حوكمة AI مع PDPL تعني تعرف وين تظهر البيانات الشخصية داخل طلبات الذكاء الاصطناعي، وتمنعها أو تنقيها أو توثق استخدامها قبل ما توصل للنموذج — بفصل واضح بين المتطلب النظامي والتنفيذ التقني."
related: ["pdpl-ai-complete-guide","pdpl-chatgpt-data-protection"]
---
<section class="hero">
  <span class="pill">PDPL + AI Governance</span>
  <p class="muted">دليل عملي لفرق الخصوصية والامتثال والتقنية: كيف تمنع تسرب البيانات الشخصية في أدوات الذكاء الاصطناعي، بدون منع الشغل وبدون ادعاءات نظامية غير مدعومة.</p>
</section>

<section class="pdpl-practical-panel" aria-labelledby="pdpl-gov-source-title">
  <p class="pill">المصدر الرسمي</p>
  <h2 id="pdpl-gov-source-title">وش يعني PDPL عند استخدام AI؟</h2>
  <p>إذا استخدمت الذكاء الاصطناعي لمعالجة بيانات تخص أشخاصًا في السعودية — حتى لو كانت جملة عادية في محادثة دعم أو ملف مرفق — فأنت أمام معالجة بيانات شخصية محتملة. النصوص الرسمية لنظام حماية البيانات الشخصية ولوائحه هي المرجع الوحيد لتحديد وش ينطبق عليك. اللي تحت شرح عملي يساعدك تطبق، وليس رأيًا قانونيًا.</p>
  <p><a href="https://dgp.sdaia.gov.sa/" target="_blank" rel="noopener noreferrer">منصة حوكمة البيانات الوطنية — سدايا</a></p>
  <h3>ملخص المتطلب النظامي (من المصدر الرسمي)</h3>
  <p>راجع النص الرسمي لتحديد الغرض المشروع، فئات البيانات، حقوق أصحاب البيانات، والتزامات المتحكم والمعالج في حالتك.</p>
  <h3>إرشاد BrightAI للتنفيذ (منتج وتشغيل)</h3>
  <p>نحوّل المتطلب إلى جرد استخدامات، تصنيف بيانات، أدوات مسموحة، تنقيح وحجب عند البوابة، سجل تدقيق، وموافقات — بدون ما ندعي شهادة أو امتثال مضمون.</p>
</section>

<style>
  .pdpl-practical-panel { border: 1px solid var(--border-default); border-radius: 18px; padding: clamp(1rem, 3vw, 2rem); background: linear-gradient(135deg, rgba(20, 184, 166, .08), rgba(15, 23, 42, .02)); }
  .pdpl-practical-panel .card, .scenario-card { height: 100%; }
  .pdpl-practical-panel a, .pdpl-checklist + p a { font-weight: 700; }
  .pdpl-flow { display: flex; align-items: stretch; gap: .65rem; overflow-x: auto; padding: 1rem 0 .5rem; direction: rtl; }
  .pdpl-flow > div { min-width: 130px; flex: 1 0 130px; display: grid; gap: .3rem; align-content: center; padding: 1rem; border: 1px solid var(--border-default); border-radius: 14px; background: var(--surface-2); text-align: center; }
  .pdpl-flow span { color: var(--color-brand, #14b8a6); font: 700 .78rem/1 ui-monospace, monospace; }
  .pdpl-flow small { color: var(--text-muted); font-size: .82rem; }
  .pdpl-flow b { align-self: center; color: var(--color-brand, #14b8a6); }
  .pdpl-checklist { list-style: none; padding: 0; display: grid; gap: .7rem; }
  .pdpl-checklist li { position: relative; padding: .85rem 2.4rem .85rem 1rem; border: 1px solid var(--border-subtle, var(--border-default)); border-radius: 12px; background: var(--surface-2); }
  .pdpl-checklist li::before { content: '✓'; position: absolute; inset-inline-end: .9rem; color: var(--color-brand, #14b8a6); font-weight: 800; }
  @media (max-width: 640px) { .pdpl-flow { margin-inline: -1rem; padding-inline: 1rem; } .pdpl-flow > div { min-width: 116px; flex-basis: 116px; } .pdpl-flow b { display: none; } }
</style>

<section class="card">
  <h2 id="section-1">تعريف حوكمة AI مع PDPL بكلام عملي</h2>
  <p>حوكمة AI مع PDPL تعني تعرف وين تظهر البيانات الشخصية داخل طلبات الذكاء الاصطناعي، وكيف تمنعها أو تنقيها أو توثق استخدامها. التركيز تشغيلي: تحوّل مبادئ الخصوصية إلى قواعد تشتغل قبل ما توصل البيانات للنموذج، وبعد ما يطلع المخرج.</p>
  <p>النقطة اللي كثير يغفل عنها: استخدام AI نفسه قد <strong>ينشئ</strong> بيانات شخصية أو حساسة جديدة — تلخيص يكشف هوية عميل، تصنيف يستنتج حالة صحية، مخرج يربط منصبًا نادرًا بشخص. حتى لو المدخل كان «عامًا»، المخرج والسجل قد يصيران معالجة لبيانات شخصية تحتاج ضبط ودليل.</p>
</section>

<section aria-labelledby="pdpl-gov-scenarios-title">
  <h2 id="pdpl-gov-scenarios-title">سيناريوهات من شغل الشركات السعودية</h2>
  <div class="grid">
    <div class="card scenario-card"><h3>موظف دعم يلخص شكوى فيها جوال عميل</h3><p><strong>الخطر:</strong> رقم الجوال والاسم داخل نص عادي قد يكونان بيانات شخصية تُرسل لنموذج خارجي.</p><p><strong>الإجراء:</strong> اكتشاف تلقائي للرقم، استبداله بمعرف داخلي، إرسال الملخص المنقح فقط، وتسجيل قرار التنقيح.</p></div>
    <div class="card scenario-card"><h3>مدير يرفع تقييمات موظفين لأداة تلخيص</h3><p><strong>الخطر:</strong> المخرج قد يؤثر على قرار وظيفي، والملف قد يحوي بيانات حساسة يصعب سحب أثرها من النموذج.</p><p><strong>الإجراء:</strong> تقليل البيانات، منع القرار الآلي النهائي، موافقة بشرية موثقة، وتقييد من يرى المخرج.</p></div>
    <div class="card scenario-card"><h3>مساعد داخلي يبحث في العقود والمرفقات</h3><p><strong>الخطر:</strong> البحث قد يسترجع مستندًا لا يملك الموظف صلاحية قراءته، أو يكشف بيانات طرف خارجي.</p><p><strong>الإجراء:</strong> صلاحيات على مستوى المستند قبل الاسترجاع، اختبار أسئلة الالتفاف، وتسجيل المصادر المستخدمة.</p></div>
  </div>
</section>

<section aria-labelledby="pdpl-gov-flow-title">
  <h2 id="pdpl-gov-flow-title">كيف تتحرك البيانات في استخدام محكوم؟</h2>
  <p>القاعدة الذهبية: افحص واتخذ القرار قبل مزود النموذج، وافصل الدليل عن النص الحساس قدر الإمكان.</p>
  <div class="pdpl-flow" aria-label="مسار بيانات استخدام الذكاء الاصطناعي">
    <div><span>01</span><strong>الموظف</strong><small>Prompt أو ملف</small></div>
    <b aria-hidden="true">←</b>
    <div><span>02</span><strong>الفحص</strong><small>اكتشاف PII وتصنيف</small></div>
    <b aria-hidden="true">←</b>
    <div><span>03</span><strong>السياسة</strong><small>سماح / تنقيح / حجب / موافقة</small></div>
    <b aria-hidden="true">←</b>
    <div><span>04</span><strong>النموذج</strong><small>نسخة مسموحة فقط</small></div>
    <b aria-hidden="true">←</b>
    <div><span>05</span><strong>الدليل</strong><small>قرار وسياق غير حساس</small></div>
  </div>
</section>

<section aria-labelledby="pdpl-gov-safe-title">
  <h2 id="pdpl-gov-safe-title">مثال آمن ومثال غير آمن</h2>
  <div class="table-container">
    <table class="docs-table">
      <thead><tr><th>الحالة</th><th>الطلب</th><th>القرار التشغيلي</th></tr></thead>
      <tbody>
        <tr><th scope="row">غير آمن</th><td>«لخّص تقييم الموظف فلان ورقم هويته، واقترح هل ننهي عقده».</td><td>بيانات تعريف + قرار مؤثر + قناة غير مصنفة: حجب أو تصعيد، لا إرسال مباشر.</td></tr>
        <tr><th scope="row">أكثر أمانًا</th><td>«لخّص نقاط الأداء للحالة HR-4420 بعد إزالة الاسم والهوية. لا تقترح قرارًا نهائيًا».</td><td>تقليل بيانات، منع القرار النهائي، ثم مراجعة بشرية موثقة إذا كان للمخرج أثر.</td></tr>
      </tbody>
    </table>
  </div>
</section>

<section aria-labelledby="pdpl-gov-checklist-title">
  <h2 id="pdpl-gov-checklist-title">القائمة التشغيلية: من الاكتشاف إلى الدليل</h2>
  <ul class="pdpl-checklist">
    <li>اكتشف كل استخدامات AI — المعلنة والمخفية (Shadow AI)، بما فيها الأدوات المدمجة داخل المتصفح وSaaS.</li>
    <li>صنّف البيانات قبل الإرسال: شخصية مباشرة، غير مباشرة، حساسة، أو سرية تجارية — ولا تفترض أن «الداخلي» غير شخصي.</li>
    <li>حدّد الأدوات والمزودين المسموحين لكل فئة بيانات وغرض، وامنع الباقي بقاعدة تقنية لا بتعميم فقط.</li>
    <li>نقّح المعرفات غير اللازمة (إخفاء واستبدال) قبل وصول الطلب للنموذج، واختبر التنقيح بعينات واقعية.</li>
    <li>احجب المدخلات الحساسة غير المصرح بها أو صعّدها لموافقة بشرية بدل إرسالها «للتجربة».</li>
    <li>سجّل النشاط: من استخدم الأداة، أي سياسة طُبقت، وش القرار — مع تقليل البيانات داخل السجل نفسه.</li>
    <li>اطلب موافقة بشرية للحالات عالية المخاطر والمخرجات التي قد تؤثر على شخص، ووثّق المراجع والسبب.</li>
    <li>احتفظ بالأدلة: بطاقة الاستخدام، نتيجة التصنيف، عينة القرار المنقحة، سجل الموافقات، ومدد الاحتفاظ والإتلاف.</li>
  </ul>
  <p>لتحويل القائمة إلى برنامج مؤسسي: <a href="/solutions/ai-use-case-discovery/">اكتشاف Shadow AI</a> يجرد الاستخدام، و<a href="/solutions/ai-firewall/">AI Firewall</a> ينفذ القرار عند البوابة، و<a href="/solutions/ai-audit-trail/">Audit Trail</a> يسجل النشاط، و<a href="/solutions/ai-governance-platform/">منصة الحوكمة</a> تجمع السياسات، و<a href="/assessment/ai-governance-readiness/">تقييم الجاهزية</a> يحدد من وين تبدأ.</p>
</section>

<section class="card">
  <h2 id="section-risks">أين تظهر بيانات PDPL داخل AI؟</h2>
  <p>غالبًا لا تظهر في حقل واضح، بل داخل نص محادثة دعم، ملف Excel، عقد، شكوى، تقرير، أو ملاحظة موظف. لهذا تحتاج الشركة هذه الصفحة عندما تبي تمنع التسرب من لحظة كتابة الـ prompt، لا بعد وصول البيانات للنموذج.</p>
  <ul><li>إدخال رقم هوية أو جوال أو بريد عميل ضمن طلب تلخيص عادي.</li><li>مشاركة ملف يحتوي بيانات متعددة بدون تنقية.</li><li>خروج مخرج AI يحتوي بيانات يمكن ربطها بشخص.</li><li>عدم وجود سجل يثبت أن التنقية أو الحجب تم فعليًا.</li></ul>
</section>

<section class="card">
  <h2 id="section-controls">ضبط الخصوصية داخل المسار</h2>
  <ol><li>عرّف أنماط PII الأكثر شيوعًا في بيئة شركتك.</li><li>ضع <a href="/solutions/ai-firewall/">AI Firewall</a> قبل النموذج لا بعده.</li><li>سجّل كل عملية تنقية أو حجب في <a href="/solutions/ai-audit-trail/">AI Audit Trail</a>.</li><li>صعّد الحالات التي قد تؤثر على شخص إلى <a href="/solutions/human-approval-layer/">Human Approval Layer</a>.</li><li>جهّز <a href="/solutions/ai-evidence-file/">Evidence File</a> يوضح كيف عولجت بيانات الأفراد عند المراجعة.</li></ol>
</section>

<section class="card"><h2 id="section-example">مثال سعودي</h2><p>مركز خدمة عملاء في الرياض يستخدم AI لصياغة ردود أسرع. عند احتواء المحادثة على رقم هوية أو رقم طلب مرتبط بعميل، يُخفي النظام البيانات قبل إرسال النص للنموذج، ثم يسجل الإجراء لإثبات أن الخصوصية لم تعتمد على انتباه الموظف فقط.</p></section>

<section><h2 id="section-links">روابط تنفيذية مرتبطة</h2><p>ابدأ بتحديد البيانات الشخصية في حالات الاستخدام عبر <a href="/solutions/ai-use-case-discovery/">AI Use Case Discovery</a>، ثم طبق الحماية في <a href="/solutions/ai-firewall/">AI Firewall</a>. إذا كانت الحالة تؤثر على عميل أو موظف، اربطها مع <a href="/solutions/human-approval-layer/">Human Approval Layer</a> قبل اعتماد المخرج، ووحّد كل ذلك في <a href="/solutions/ai-governance-platform/">منصة الحوكمة</a> مع <a href="/assessment/ai-governance-readiness/">تقييم الجاهزية</a>.</p></section>

<section class="card"><h2 id="section-faq">FAQ</h2><h3 id="section-faq-1">هل BrightAI بديل للاستشارة القانونية؟</h3><p>لا. BrightAI يوفر طبقة تشغيلية تساعد فرق الخصوصية والامتثال، لكنه لا يستبدل الرأي القانوني المتخصص.</p><h3 id="section-faq-2">هل كل بيانات العملاء ممنوعة في AI؟</h3><p>ليس بالضرورة. القرار يعتمد على الغرض، الأساس النظامي، نوع النموذج، والسياسة الداخلية؛ لذلك تحتاج المؤسسة ضوابط واضحة قبل الاستخدام.</p><h3 id="section-faq-3">هل يكفي تنبيه الموظفين بعدم إرسال بيانات شخصية؟</h3><p>التوعية مهمة لكنها غير كافية وحدها. النص الحر يختلط فيه الاسم والجوال ورقم الطلب بسهولة، فتحتاج طبقة تقنية تكتشف وتنقح أو تحجب قبل الإرسال.</p><p>هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية.</p></section>

<section class="card" aria-labelledby="pdpl-gov-sources-title">
  <h2 id="pdpl-gov-sources-title">المصادر الرسمية</h2>
  <p>الملخص النظامي هنا مبني على مصادر سدايا الرسمية، وآخر مراجعة تحريرية لهذه الصفحة هي 4 سبتمبر 2026. الإرشادات التشغيلية أعلاه مقترحات تطبيقية من BrightAI وليست التزامات جديدة ولا ضمان امتثال.</p>
  <ul>
    <li><a href="https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPLCP/" rel="noopener" target="_blank">دليل PDPL للمتحكمين والمعالجين — سدايا</a></li>
    <li><a href="https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2/" rel="noopener" target="_blank">اللائحة التنفيذية لنظام حماية البيانات الشخصية — سدايا</a></li>
    <li><a href="https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/MinimumPersonalDataDeterminationGuideline/" rel="noopener" target="_blank">إرشاد الحد الأدنى للبيانات الشخصية — سدايا</a></li>
  </ul>
  <p>تفصيل أعمق: <a href="/docs/pdpl-ai-complete-guide/">الدليل الشامل PDPL + AI</a> · حالة ChatGPT: <a href="/docs/pdpl-chatgpt-data-protection/">دليل ChatGPT وPDPL</a></p>
</section>

<p><a class="btn" href="/solutions/ai-firewall/">استكشف AI Firewall</a> <a class="btn" href="/assessment/ai-governance-readiness/" style="margin-inline-start:10px;">قيّم جاهزيتك</a></p>
