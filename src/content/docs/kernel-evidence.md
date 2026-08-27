---
title: "Kernel Evidence: ملف الدليل الكامل لكل طلب"
metaTitle: "Kernel Evidence: ملف الدليل الكامل لكل طلب"
description: "شرح عملي لملفات الأدلة في BrightAI Kernel: كيف تجمع كل التفاصيل عن كل طلب في ملف واحد قابل للتصدير والمراجعة."
canonical: "https://brightai.live/docs/kernel-evidence/"
updated: "2026-06-10"
category: "Kernel"
tldr: "شرح عملي لملفات الأدلة في BrightAI Kernel: كيف تجمع كل\nالتفاصيل عن كل طلب في ملف واحد قابل للتصدير والمراجعة."
related: ["kernel-connectors","kernel-policies"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>
    
    <p style="color: #9fb0c7; font-size: 1.1rem;">كل طلب يصير له ملف دليل شامل - جاهز للتصدير والمراجعة والتدقيق</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>تخيل إن المدقق يسألك: "أثبت لي إن هالطلب مر بكل الضوابط الصحيحة".</p>
    <p>بدل ما تروح تجمع معلومات من أماكن متفرقة (سجل التدقيق، الموافقات، السياسات، المخاطر)، تفتح <strong>ملف الدليل (Evidence File)</strong> وتعطيه إياه. كل شي موجود في مكان واحد:</p>
    <ul>
      <li>تفاصيل الطلب الكاملة</li>
      <li>نتائج فحص البيانات الحساسة</li>
      <li>تصنيف المخاطر والسبب</li>
      <li>السياسات المطبقة</li>
      <li>الموافقات (إذا كانت مطلوبة)</li>
      <li>الرد من النموذج</li>
      <li>سجل التدقيق الكامل</li>
      <li>Hash للتحقق من السلامة</li>
    </ul>
    <p>كل هالمعلومات في ملف واحد، منظم، قابل للتصدير كـ PDF أو JSON.</p>
  </section>

  <section class="card">
    <h2 id="section-2">ليش ملفات الأدلة مهمة؟</h2>
    <p>لأن <strong>الامتثال مو بس سياسات، هو أدلة</strong>.</p>
    <p>الجهات التنظيمية ما تكتفي بإنك تقول "عندنا ضوابط". يبون يشوفون:</p>
    <ul>
      <li>إن الضوابط <strong>مطبقة فعلاً</strong> على كل طلب</li>
      <li>إن كل قرار <strong>موثق ومبرر</strong></li>
      <li>إن الأدلة <strong>كاملة وغير قابلة للتعديل</strong></li>
    </ul>
    <p>ملف الدليل يعطيك كل هالشي في صيغة جاهزة للتقديم.</p>
  </section>

  <section class="card">
    <h2 id="section-3">وش اللي يكون داخل ملف الدليل؟</h2>
    <div class="evidence-preview">
      <div class="evidence-section">
        <strong>═══ EVIDENCE FILE ═══</strong><br>
        Trace ID: AI-2026-10493<br>
        Generated: 2026-05-31 14:23:15 UTC<br>
        Hash: a3f2b9e8c4d1f7a6...
      </div>

      <div class="evidence-section">
        <strong>1. REQUEST DETAILS</strong><br>
        User: ahmad.mohammed@company.sa<br>
        Department: Finance<br>
        Timestamp: 2026-05-31 14:20:00<br>
        Content: [REDACTED - Contains PII]
      </div>

      <div class="evidence-section">
        <strong>2. PII SCAN RESULTS</strong><br>
        Status: DETECTED<br>
        Types: NATIONAL_ID, BANK_ACCOUNT<br>
        Count: 3 instances<br>
        Action: FLAGGED
      </div>

      <div class="evidence-section">
        <strong>3. RISK ASSESSMENT</strong><br>
        Risk Score: 78/100 (HIGH)<br>
        Risk Level: HIGH<br>
        Reason: Financial data + PII detected<br>
        Policies Applied: FIN-001, PDPL-002
      </div>

      <div class="evidence-section">
        <strong>4. APPROVAL WORKFLOW</strong><br>
        Required: YES<br>
        Approver: finance.manager@company.sa<br>
        Decision: APPROVED<br>
        Timestamp: 2026-05-31 14:21:30<br>
        Notes: Verified with customer consent
      </div>

      <div class="evidence-section">
        <strong>5. MODEL EXECUTION</strong><br>
        Provider: NVIDIA<br>
        Model: minimaxai/minimax-m2.7<br>
        Status: SUCCESS<br>
        Duration: 2.3s
      </div>

      <div class="evidence-section">
        <strong>6. AUDIT TRAIL</strong><br>
        Total Events: 6<br>
        Hash Chain: VALID<br>
        Integrity: VERIFIED
      </div>
    </div>
  </section>

  <section class="card">
    <h2 id="section-4">متى تحتاج ملفات الأدلة؟</h2>
    <table class="docs-table">
      <thead>
        <tr>
          <th>الحالة</th>
          <th>كيف تستخدمه</th>
          <th>الفائدة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="الحالة"><strong>تدقيق خارجي</strong></td>
          <td data-label="كيف تستخدمه">صدّر ملفات الأدلة لفترة محددة وقدمها للمدقق</td>
          <td data-label="الفائدة">توفر أسابيع من جمع الأدلة اليدوي</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>تحقيق في حادثة</strong></td>
          <td data-label="كيف تستخدمه">افتح ملف الدليل للطلب المشبوه</td>
          <td data-label="الفائدة">تشوف كل التفاصيل في مكان واحد</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>شكوى عميل</strong></td>
          <td data-label="كيف تستخدمه">اطبع ملف الدليل وريه للعميل</td>
          <td data-label="الفائدة">تثبت إنك اتبعت كل الضوابط</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>مراجعة داخلية</strong></td>
          <td data-label="كيف تستخدمه">راجع عينة من ملفات الأدلة شهرياً</td>
          <td data-label="الفائدة">تتأكد إن النظام يشتغل صح</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>إثبات الامتثال</strong></td>
          <td data-label="كيف تستخدمه">قدم ملفات الأدلة للجهة التنظيمية</td>
          <td data-label="الفائدة">دليل ملموس على الالتزام</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-5">وش اللي يميز ملفات الأدلة في Kernel؟</h2>
    <h3 id="section-5-1">✅ شاملة</h3>
    <p>كل شي عن الطلب في ملف واحد - ما تحتاج تدور في أماكن متفرقة</p>

    <h3 id="section-5-2">✅ منظمة</h3>
    <p>الملف مقسم لأقسام واضحة، سهل تقرأه وتفهمه</p>

    <h3 id="section-5-3">✅ قابلة للتصدير</h3>
    <p>تقدر تصدرها كـ PDF (للطباعة والمراجعة) أو JSON (للتحليل البرمجي)</p>

    <h3 id="section-5-4">✅ محمية ضد التعديل</h3>
    <p>كل ملف دليل له Hash فريد - أي تعديل يكسر الـ Hash</p>

    <h3 id="section-5-5">✅ مرتبطة بالسجلات</h3>
    <p>كل ملف دليل مرتبط بسجل التدقيق والموافقات والسياسات</p>

    <h3 id="section-5-6">✅ قابلة للبحث</h3>
    <p>تقدر تبحث في ملفات الأدلة حسب التاريخ، القسم، المستخدم، أو المخاطر</p>
  </section>

  <section class="card">
    <h2 id="section-6">أخطاء شائعة - انتبه لها</h2>
    <div class="warning-box">
      <h3 id="section-6-1">❌ الخطأ الأول: تخزين ملفات الأدلة بدون حماية</h3>
      <p>ملفات الأدلة تحتوي معلومات حساسة. لو أي أحد يقدر يوصل لها، ممكن تتسرب.</p>
      <p><strong>الحل:</strong> خلي الوصول لملفات الأدلة محصور على المدققين والمسؤولين فقط.</p>
    </div>

    <div class="warning-box">
      <h3 id="section-6-2">❌ الخطأ الثاني: عدم مراجعة ملفات الأدلة قبل التدقيق</h3>
      <p>لو انتظرت للتدقيق عشان تشوف ملفات الأدلة، ممكن تلقى مشاكل متأخر.</p>
      <p><strong>الحل:</strong> راجع عينة من ملفات الأدلة بشكل دوري (مثلاً: 10 ملفات كل شهر).</p>
    </div>

    <div class="warning-box">
      <h3 id="section-6-3">❌ الخطأ الثالث: تصدير ملفات أدلة ناقصة</h3>
      <p>لو ملف الدليل ما يحتوي كل الأقسام المطلوبة، ما بيكون مفيد للتدقيق.</p>
      <p><strong>الحل:</strong> تأكد إن كل ملف دليل يحتوي: الطلب، الفحص، المخاطر، الموافقات، والسجل.</p>
    </div>
  </section>

  <section class="card">
    <h2 id="section-7">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>ملفات الأدلة هي <strong>سلاحك السري</strong> وقت التدقيق.</p>
      <p>شفت شركة كانت متوترة جداً قبل التدقيق. لما جا المدقق، فتحوا Kernel Evidence وقالوا له: "تفضل، اختر أي طلب تبي تراجعه". المدقق اختار 5 طلبات عشوائية، وفي أقل من 10 دقائق صدروا له ملفات الأدلة الكاملة.</p>
      <p>المدقق كان مبهور. قال: "أول مرة أشوف شركة عندها هالمستوى من التوثيق". التدقيق انتهى في نصف الوقت المتوقع، وبدون أي ملاحظات جوهرية.</p>
      <p>نصيحتي: <strong>اطبع ملف دليل واحد وشوفه بنفسك</strong>. تأكد إنه واضح، كامل، ومفهوم. لو أنت ما تفهمه، المدقق ما بيفهمه. وإذا كان ناقص، كمّله قبل ما يجي التدقيق.</p>
    </div>
  </section>

  <section class="card">
    <h2 id="section-8">قائمة تحقق قبل الاعتماد على ملفات الأدلة</h2>
    <ol>
      <li>✅ اختبرت إنشاء ملف دليل: هل يحتوي كل الأقسام؟</li>
      <li>✅ صدّرت ملف دليل كـ PDF: هل الشكل واضح؟</li>
      <li>✅ تحققت من Hash: هل يكتشف التعديلات؟</li>
      <li>✅ حددت مدة الحفظ: كم تحتفظ بملفات الأدلة؟</li>
      <li>✅ ضبطت الصلاحيات: مين يقدر يوصل لملفات الأدلة؟</li>
      <li>✅ ربطت مع Audit Trail: كل ملف دليل مرتبط بالسجل؟</li>
      <li>✅ درّبت المدققين: كيف يقرأون ملفات الأدلة؟</li>
    </ol>
  </section>
