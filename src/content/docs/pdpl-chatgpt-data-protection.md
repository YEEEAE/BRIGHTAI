---
title: "ChatGPT في المنشآت السعودية: دليل PDPL لحماية البيانات"
metaTitle: "ChatGPT والبيانات الشخصية في السعودية: دليل PDPL | BrightAI"
description: "دليل ChatGPT بالعربي لاستخدام أدوات الذكاء الاصطناعي في المنشآت السعودية بدون تسريب بيانات شخصية، مع ضوابط PDPL واضحة وفحص PII وموافقة بشرية وسجل تدقيق."
canonical: "https://brightai.live/docs/pdpl-chatgpt-data-protection/"
updated: "2026-09-04"
category: "PDPL"
tldr: "دليل ChatGPT بالعربي لاستخدام أدوات الذكاء الاصطناعي في المنشآت السعودية بدون تسريب بيانات شخصية، مع ضوابط PDPL واضحة وفحص PII وموافقة بشرية وسجل تدقيق."
related: ["pdpl-ai-complete-guide","pdpl-ai-governance"]
---
<style>
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
<section class="hero">
    <span class="pill">PDPL ChatGPT Saudi Arabia</span>
    
    <p class="muted">دليل عملي لفرق التقنية والامتثال في الشركات السعودية لاستخدام ChatGPT وأدوات الذكاء الاصطناعي بدون إرسال بيانات شخصية أو سرية للنماذج بشكل غير مضبوط.</p>
  </section>

  <section class="card">
    <h2 id="section-1">المقدمة المختصرة</h2>
    <p>استخدام ChatGPT في الشركات السعودية صار جزءًا من العمل اليومي: تلخيص مستند، صياغة بريد، تحليل شكوى عميل، أو مساعدة موظف خدمة عملاء. المشكلة تبدأ عندما يدخل في الطلب رقم هوية، جوال، بريد عميل، عقد، ملف موظف، أو أي معلومة تكشف شخصًا أو حالة حساسة.</p>
    <p>الطريقة المهنية ليست منع الذكاء الاصطناعي بالكامل، بل تشغيله بضوابط: اكتشاف الاستخدام، تصنيف البيانات، تحديد الأدوات المسموحة، تنقية PII قبل الإرسال، موافقة بشرية عند المخاطر العالية، وسجل تدقيق يثبت ما حدث. هذا المحتوى توعوي وتشغيلي ولا يعد استشارة قانونية؛ تفاصيل التطبيق تعتمد على الغرض، نوع البيانات، المورد، وسياسة مؤسستك.</p>
  </section>

  <section aria-labelledby="chatgpt-flow-title">
    <h2 id="chatgpt-flow-title">كيف تتحرك البيانات قبل ما توصل ChatGPT؟</h2>
    <p>لا تعتمد على انتباه الموظف. افحص وصنّف واتخذ القرار قبل النموذج، ووثّق بدون ما تخزّن نصًا حساسًا أكثر من اللازم.</p>
    <div class="pdpl-flow" aria-label="مسار بيانات ChatGPT">
      <div><span>01</span><strong>الموظف</strong><small>Prompt أو ملف</small></div>
      <b aria-hidden="true">←</b>
      <div><span>02</span><strong>الفحص</strong><small>اكتشاف PII وتصنيف</small></div>
      <b aria-hidden="true">←</b>
      <div><span>03</span><strong>السياسة</strong><small>سماح / تنقيح / حجب / موافقة</small></div>
      <b aria-hidden="true">←</b>
      <div><span>04</span><strong>النموذج</strong><small>نسخة منقحة فقط</small></div>
      <b aria-hidden="true">←</b>
      <div><span>05</span><strong>الدليل</strong><small>قرار وسجل غير حساس</small></div>
    </div>
    <ol>
      <li><strong>اكتشف:</strong> هل الاستخدام عبر أداة معتمدة أو Shadow AI؟ ابدأ بـ <a href="/solutions/ai-use-case-discovery/">اكتشاف استخدامات AI</a>.</li>
      <li><strong>صنّف:</strong> هل النص فيه بيانات شخصية أو حساسة أو سرية تجارية؟</li>
      <li><strong>قرّر:</strong> اسمح، نقّح، احجب، أو اطلب موافقة حسب السياسة.</li>
      <li><strong>وثّق:</strong> سجّل القرار والسبب دون تخزين النص الخام إذا ما كان لازمًا.</li>
    </ol>
  </section>

  <section aria-labelledby="chatgpt-scenarios-title">
    <h2 id="chatgpt-scenarios-title">سيناريوهات واقعية: وش يصير بالشغل اليومي؟</h2>
    <div class="grid">
      <div class="card scenario-card"><h3>تلخيص شكوى عميل</h3><p><strong>الخطر:</strong> الاسم والجوال ورقم الطلب داخل النص قد تكشف شخصًا.</p><p><strong>الإجراء:</strong> تنقيح المعرفات، طلب تلخيص وقائعي بمعرف داخلي، ومراجعة بشرية قبل أي قرار تعويض.</p></div>
      <div class="card scenario-card"><h3>صياغة عرض من عقد قائم</h3><p><strong>الخطر:</strong> العقد فيه أطراف ومبالغ وتواريخ قد تخص أشخاصًا أو أسرار تجارية.</p><p><strong>الإجراء:</strong> إخفاء الأطراف، تلخيص البنود اللازمة فقط، وتسجيل من اطلع على المخرج.</p></div>
      <div class="card scenario-card"><h3>تحليل أداء موظف عبر AI</h3><p><strong>الخطر:</strong> المخرج قد يؤثر على قرار وظيفي ويصعب تبريره أو سحب أثر بياناته.</p><p><strong>الإجراء:</strong> تقليل البيانات، منع القرار الآلي النهائي، وتفعيل موافقة بشرية موثقة.</p></div>
    </div>
  </section>

  <section>
    <h2 id="section-2">أمثلة على بيانات لا يجب إرسالها للنماذج</h2>
    <div class="grid">
      <div class="card"><h3 id="section-2-1">بيانات تعريف مباشرة</h3><p>رقم الهوية الوطنية أو الإقامة، الاسم الكامل مع رقم الجوال، البريد الشخصي، العنوان الوطني، أو رقم العميل.</p></div>
      <div class="card"><h3 id="section-2-2">بيانات مالية وتعاقدية</h3><p>آيبان، كشوف حساب، أو عقود تحتوي أطرافًا وأرقامًا ومبالغ وتواريخ يمكن ربطها بشخص أو شركة.</p></div>
      <div class="card"><h3 id="section-2-3">بيانات موظفين وعملاء</h3><p>تقييم أداء، شكوى عميل، سجل حضور، طلب تأمين، أو محادثة دعم تحتوي تفاصيل شخصية.</p></div>
      <div class="card"><h3 id="section-2-4">بيانات صحية أو حساسة</h3><p>أعراض، تقارير طبية، ملفات مرضى، حالات اجتماعية، أو أي معلومة تحتاج حذرًا إضافيًا قبل المعالجة.</p></div>
    </div>
  </section>

  <section class="card" aria-labelledby="chatgpt-safe-title">
    <h2 id="chatgpt-safe-title">مثال آمن ومثال غير آمن</h2>
    <div class="table-container">
    <table class="docs-table">
      <thead><tr><th>الحالة</th><th>الطلب</th><th>القرار التشغيلي</th></tr></thead>
      <tbody>
        <tr><th scope="row">غير آمن</th><td>رفع شكوى كاملة فيها اسم العميل ورقمه وطلب قرار تعويض.</td><td>بيانات تعريف + قرار مؤثر + قناة غير مصنفة: حجب أو تصعيد، لا إرسال مباشر.</td></tr>
        <tr><th scope="row">أكثر أمانًا</th><td>استخدام معرف داخلي بعد التنقيح وطلب تلخيص وقائعي فقط، ثم مراجعة بشرية للقرار.</td><td>تقليل بيانات، منع القرار النهائي، وتسجيل المراجعة والدليل.</td></tr>
      </tbody>
    </table>
    </div>
    <p>التنقيح يقلل التعرض لكنه لا يثبت وحده أن المعالجة مناسبة لكل حالة. راجع الغرض، المورد، الصلاحيات، والاحتفاظ قبل التوسع.</p>
  </section>

  <section>
    <h2 id="section-3">جدول التعامل مع البيانات قبل ChatGPT</h2>
    <table class="data-table docs-table">
      <thead>
        <tr>
          <th>نوع البيانات</th>
          <th>الخطر</th>
          <th>الإجراء المناسب</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="نوع البيانات">رقم هوية، إقامة، جوال، بريد شخصي</td>
          <td data-label="الخطر">تعريف مباشر لصاحب البيانات وربط الطلب بشخص محدد.</td>
          <td data-label="الإجراء المناسب">استخدام PII masking AI لاستبدال القيم قبل الإرسال، أو منع الطلب إذا لم يكن التنقيح كافيًا.</td>
        </tr>
        <tr>
          <td data-label="نوع البيانات">محادثات دعم العملاء والشكاوى</td>
          <td data-label="الخطر">قد تحتوي أسماء، أرقام طلبات، تفاصيل مالية، أو معلومات حساسة داخل النص الحر.</td>
          <td data-label="الإجراء المناسب">تمريرها عبر <a href="/solutions/ai-firewall/">AI Firewall</a> لاكتشاف النصوص الحساسة وتطبيق mask أو block.</td>
        </tr>
        <tr>
          <td data-label="نوع البيانات">ملفات موظفين أو تقييمات أداء</td>
          <td data-label="الخطر">مخاطر خصوصية وقرارات وظيفية قد تؤثر على الشخص.</td>
          <td data-label="الإجراء المناسب">تنقية البيانات، تقليل التفاصيل غير اللازمة، وتفعيل <a href="/solutions/human-approval-layer/">Human Approval Layer</a> قبل أي قرار مؤثر.</td>
        </tr>
        <tr>
          <td data-label="نوع البيانات">عقود، فواتير، ومعلومات موردين</td>
          <td data-label="الخطر">تسريب معلومات تجارية أو بيانات أطراف خارجية.</td>
          <td data-label="الإجراء المناسب">حذف المعرفات، تلخيص داخلي آمن، وتوثيق العملية في <a href="/solutions/ai-audit-trail/">AI Audit Trail</a>.</td>
        </tr>
        <tr>
          <td data-label="نوع البيانات">بيانات صحية أو عالية الحساسية</td>
          <td data-label="الخطر">مخاطر أعلى على الخصوصية والسمعة والامتثال.</td>
          <td data-label="الإجراء المناسب">المنع الافتراضي أو التصعيد لموافقة بشرية، مع سجل سبب القرار والنسخة المنقحة من الطلب.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2 id="section-4">كيف يساعد AI Firewall؟</h2>
    <p><a href="/solutions/ai-firewall/">AI Firewall Saudi Arabia</a> يعمل كطبقة بين الموظف وأداة الذكاء الاصطناعي. بدل ما يذهب prompt مباشرة إلى ChatGPT أو أي نموذج خارجي، يمر أولًا على قواعد الحماية.</p>
    <ol>
      <li>يفحص الطلب لاكتشاف PII مثل الهوية، الجوال، الآيبان، البريد، أسماء العملاء، وأرقام الملفات.</li>
      <li>يطبق السياسة المناسبة: السماح، التنقية، الحجب، أو التصعيد.</li>
      <li>يرسل للنموذج نسخة آمنة قدر الإمكان، مثل: "عميل رقم [MASKED_CUSTOMER] لديه اعتراض على فاتورة [MASKED_INVOICE]".</li>
      <li>يحفظ الحدث في سجل تدقيق بدون تحويل السجل نفسه إلى مصدر تسريب جديد.</li>
    </ol>
  </section>

  <section>
    <h2 id="section-5">متى نحتاج Human Approval؟</h2>
    <p>الموافقة البشرية ليست لكل طلب. فائدتها تظهر عندما يكون الطلب عالي المخاطر أو قد ينتج عنه أثر على عميل أو موظف أو جهة خارجية.</p>
    <ul>
      <li>عندما يحتوي الطلب بيانات صحية، مالية، وظيفية، أو قانونية.</li>
      <li>عندما يطلب الموظف من النموذج توصية تؤثر على قرار مهم، مثل رفض مطالبة أو تصعيد عميل.</li>
      <li>عندما يفشل masking أو يكتشف النظام بيانات لا يعرف كيف يصنفها بثقة.</li>
      <li>عندما تكون السياسة الداخلية تلزم موافقة مدير، امتثال، أو أمن سيبراني قبل الإرسال.</li>
    </ul>
    <p>هنا يساعد <a href="/solutions/human-approval-layer/">Human Approval Layer</a> في تحويل الطلب لمسار موافقة واضح بدل الاعتماد على تقدير الموظف وحده.</p>
  </section>

  <section>
    <h2 id="section-6">كيف يفيد Audit Trail؟</h2>
    <p>في الاستخدام المؤسسي، السؤال ليس فقط: "هل منعنا التسريب؟" بل أيضًا: "هل نقدر نثبت ماذا حدث؟" لذلك <a href="/solutions/ai-audit-trail/">AI Audit Trail</a> مهم لفرق الخصوصية، الأمن، والمراجعة الداخلية.</p>
    <div class="grid">
      <div class="card"><h3 id="section-6-1">إثبات القرار</h3><p>يسجل هل تم السماح، التنقية، الحجب، أو التصعيد، ومع أي سياسة تم اتخاذ القرار.</p></div>
      <div class="card"><h3 id="section-6-2">تتبع المسؤولية</h3><p>يوضح من أرسل الطلب، من وافق عليه، ومتى تمت المعالجة.</p></div>
      <div class="card"><h3 id="section-6-3">تحسين السياسات</h3><p>يكشف الأنماط المتكررة، مثل فريق يرسل أرقام عملاء كثيرًا، أو نوع مستند يحتاج قاعدة تنقية أدق.</p></div>
    </div>
  </section>

  <section class="card">
    <h2 id="section-7">القائمة التشغيلية للشركات السعودية</h2>
    <ul class="pdpl-checklist">
      <li>اكتشف استخدامات ChatGPT المعلنة والمخفية (Shadow AI) قبل ما توسّع الصلاحيات.</li>
      <li>صنّف البيانات قبل الإرسال: هوية، جوال، بريد، آيبان، ملفات صحية، عقود، شكاوى، وبيانات موظفين.</li>
      <li>حدّد الأدوات المسموحة لكل فئة بيانات وغرض، وامنع الإرسال للقنوات غير المعتمدة.</li>
      <li>نقّح PII قبل النموذج (إخفاء واستبدال)، وليس بعد ظهور المشكلة.</li>
      <li>احجب المدخلات الحساسة غير المصرح بها أو صعّدها لموافقة بشرية حسب مستوى الحساسية.</li>
      <li>سجّل النشاط والقرار والسياسة في <a href="/solutions/ai-audit-trail/">Audit Trail</a> بدون تخزين بيانات حساسة أكثر من اللازم.</li>
      <li>اطلب موافقة بشرية عبر <a href="/solutions/human-approval-layer/">Human Approval Layer</a> عند الطلبات الحساسة أو القرارات المؤثرة.</li>
      <li>احتفظ بالأدلة (بطاقة الاستخدام، نتيجة التصنيف، سجل الموافقات) وراجع <a href="/docs/pdpl-ai-governance/">دليل PDPL والذكاء الاصطناعي</a> و<a href="/pdpl-statement/">بيان PDPL</a> لتوحيد اللغة داخليًا، واختبر القواعد بعينات منقحة قبل التوسع.</li>
    </ul>
    <p>لما تبي تربط الاكتشاف بالتنفيذ على مستوى المؤسسة: <a href="/solutions/ai-firewall/">AI Firewall</a>، <a href="/solutions/ai-use-case-discovery/">اكتشاف Shadow AI</a>، <a href="/solutions/ai-audit-trail/">Audit Trail</a>، <a href="/solutions/ai-governance-platform/">منصة الحوكمة</a>، و<a href="/assessment/ai-governance-readiness/">تقييم الجاهزية</a>.</p>
  </section>

  <section class="card">
    <h2 id="section-8">FAQ</h2>
    <h3 id="section-8-1">هل يمنع PDPL استخدام ChatGPT داخل الشركات السعودية؟</h3>
    <p>لا يعني ذلك المنع المطلق. المهم أن يكون الاستخدام مضبوطًا بسياسات واضحة، وتنقية للبيانات الشخصية، وسجل يوضح ماذا أرسل ومن وافق ولماذا.</p>

    <h3 id="section-8-2">هل يكفي أن نطلب من الموظفين عدم إرسال بيانات شخصية؟</h3>
    <p>التوعية مهمة، لكنها غير كافية وحدها. النص الحر يختلط فيه الاسم والجوال ورقم الطلب بسهولة، لذلك تحتاج طبقة تقنية تكتشف وتمنع أو تنقي قبل الإرسال.</p>

    <h3 id="section-8-3">ما المقصود بـ PII masking AI؟</h3>
    <p>المقصود إخفاء أو استبدال البيانات التي تعرّف الشخص قبل إرسال الطلب للنموذج، مثل تحويل رقم الهوية أو الجوال إلى قيمة محجوبة لا تكشف صاحب البيانات.</p>

    <h3 id="section-8-4">هل AI Firewall يغني عن الاستشارة القانونية؟</h3>
    <p>لا. AI Firewall طبقة تشغيلية للحماية والحوكمة، وهذا الدليل ليس استشارة قانونية. القرارات النظامية النهائية تحتاج مراجعة مختصين قانونيين داخل المؤسسة.</p>
  </section>

  <section class="card">
    <h2 id="section-9">ابدأ بضوابط بسيطة قبل التوسع</h2>
    <p>إذا كانت شركتك تستخدم ChatGPT أو أدوات ذكاء اصطناعي مشابهة، ابدأ بحماية المدخلات: تنقية PII، منع تسريب البيانات للذكاء الاصطناعي، توثيق القرارات، وموافقة بشرية عند الطلبات الحساسة.</p>
    <a class="btn" href="/solutions/ai-firewall/">استكشف AI Firewall</a>
    <a class="btn secondary" href="/contact/">اطلب جلسة تقييم</a>
  </section>

  <section class="card" aria-labelledby="chatgpt-sources-title">
    <h2 id="chatgpt-sources-title">المصدر النظامي والخطوة التالية</h2>
    <p>للمتطلبات القانونية، ارجع إلى <a href="https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPLCP/" target="_blank" rel="noopener noreferrer">دليل سدايا لنظام حماية البيانات الشخصية لجهات التحكم والمعالجة</a> و<a href="https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2/" target="_blank" rel="noopener noreferrer">اللائحة التنفيذية الرسمية</a>. هذه الصفحة تشرح تنفيذًا تقنيًا محتملًا ولا تحسم وضع ChatGPT أو أي مزود بعينه في حالتك.</p>
    <p>لما تبي تربط الاكتشاف بالتنفيذ: <a href="/solutions/ai-firewall/">AI Firewall</a>، <a href="/solutions/ai-audit-trail/">Audit Trail</a>، <a href="/solutions/ai-governance-platform/">منصة الحوكمة</a>، و<a href="/assessment/ai-governance-readiness/">تقييم الجاهزية</a>.</p>
  </section>
