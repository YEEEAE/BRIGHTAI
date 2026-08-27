---
title: "Kernel Audit Trail: سجل التدقيق اللي ما ينعدل"
metaTitle: "Kernel Audit Trail: سجل التدقيق اللي ما ينعدل"
description: "شرح عملي لسجل التدقيق في BrightAI Kernel: كيف توثق كل طلب، تتبع القرارات، وتثبت الامتثال بسجل غير قابل للتعديل."
canonical: "https://brightai.live/docs/kernel-audit-trail/"
updated: "2026-06-10"
category: "Kernel"
tldr: "شرح عملي لسجل التدقيق في BrightAI Kernel: كيف توثق كل\nطلب، تتبع القرارات، وتثبت الامتثال بسجل غير قابل للتعديل."
related: ["kernel-approvals","kernel-chat"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>
    
    <p style="color: #9fb0c7; font-size: 1.1rem;">كل طلب، كل قرار، كل موافقة - موثقة بالتفصيل في سجل محمي ضد التعديل</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>تخيل إن عندك دفتر يسجل فيه كل شي يصير في استخدام الذكاء الاصطناعي بشركتك. كل طلب، كل قرار، كل موافقة، كل رفض. والأهم: <strong>ما أحد يقدر يعدل أو يمسح منه شي</strong>.</p>
    <p>هذا بالضبط دور <strong>Audit Trail</strong> في Kernel. يوثق كل حركة بالتفصيل، ويحفظها في سلسلة مشفرة (Hash Chain) تضمن إن السجل ما انعبث فيه.</p>
    <p>ليش هالشي مهم؟ لأن وقت التدقيق أو التحقيق، ما أحد بيصدقك إذا قلت "عندنا ضوابط" بدون دليل. Audit Trail <strong>هو الدليل</strong>.</p>
  </section>

  <section class="card">
    <h2 id="section-2">ليش تحتاج سجل تدقيق؟</h2>
    <p>الجهات التنظيمية في السعودية (SDAIA، NCA، هيئة حماية البيانات) كلها تطلب منك شي واحد: <strong>أثبت إنك ملتزم</strong>.</p>
    <p>مو كافي تقول "عندنا سياسات". لازم تثبت:</p>
    <ul>
      <li>إن السياسات <strong>مطبقة فعلاً</strong></li>
      <li>إن الموظفين <strong>ملتزمين فيها</strong></li>
      <li>إن أي مخالفة <strong>اكتشفت وعولجت</strong></li>
      <li>إن السجلات <strong>ما انعدلت</strong></li>
    </ul>
    <p>Audit Trail يعطيك كل هالأدلة في مكان واحد.</p>
  </section>

  <section class="card">
    <h2 id="section-3">وش اللي يتسجل بالضبط؟</h2>
    <p>كل طلب يمر عبر Kernel يمر بـ 6 مراحل، وكل مرحلة تتوثق:</p>

    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-label">1. REQUEST_RECEIVED</div>
        <p><strong>استلام الطلب:</strong> متى وصل الطلب، من مين، وش محتواه، من أي قسم</p>
      </div>

      <div class="timeline-item">
        <div class="timeline-label">2. PII_SCANNED</div>
        <p><strong>فحص البيانات الحساسة:</strong> هل فيه بيانات شخصية؟ وش نوعها؟ (أسماء، أرقام هوية، إيميلات، حسابات بنكية)</p>
      </div>

      <div class="timeline-item">
        <div class="timeline-label">3. RISK_SCORED</div>
        <p><strong>تصنيف المخاطر:</strong> درجة الخطورة (منخفض، متوسط، عالي، حرج)، السياسات المطبقة، السبب</p>
      </div>

      <div class="timeline-item">
        <div class="timeline-label">4. APPROVAL_REQUESTED</div>
        <p><strong>طلب الموافقة:</strong> إذا الطلب يحتاج موافقة، مين المسؤول، متى طُلبت، متى وافق أو رفض، وش السبب</p>
      </div>

      <div class="timeline-item">
        <div class="timeline-label">5. MODEL_CALLED</div>
        <p><strong>استدعاء النموذج:</strong> أي نموذج استخدم (GPT-4، Claude، Gemini)، متى، وش الرد، كم أخذ وقت</p>
      </div>

      <div class="timeline-item">
        <div class="timeline-label">6. EVIDENCE_GENERATED</div>
        <p><strong>إنشاء الدليل:</strong> ملف الدليل الكامل للطلب، مع Hash للتحقق من السلامة</p>
      </div>
    </div>
  </section>

  <section class="card">
    <h2 id="section-4">وش معنى Hash Chain؟</h2>
    <p>هذي التقنية اللي تضمن إن السجل ما انعدل. الفكرة بسيطة:</p>
    <ol>
      <li>كل سجل يأخذ <strong>بصمة رقمية (Hash)</strong> من محتواه</li>
      <li>السجل الثاني يأخذ بصمة من محتواه <strong>+ بصمة السجل الأول</strong></li>
      <li>السجل الثالث يأخذ بصمة من محتواه <strong>+ بصمة السجل الثاني</strong></li>
      <li>وهكذا... كل سجل مرتبط باللي قبله</li>
    </ol>

    <div class="hash-chain">
      <div class="hash-block">Block 1<br><span style="font-size: 0.7rem;">Hash: a3f2...</span></div>
      <div class="hash-arrow">→</div>
      <div class="hash-block">Block 2<br><span style="font-size: 0.7rem;">Hash: 7b9e...</span></div>
      <div class="hash-arrow">→</div>
      <div class="hash-block">Block 3<br><span style="font-size: 0.7rem;">Hash: c4d1...</span></div>
      <div class="hash-arrow">→</div>
      <div class="hash-block">Block 4<br><span style="font-size: 0.7rem;">Hash: 9f8a...</span></div>
    </div>

    <p><strong>ليش هالشي مهم؟</strong></p>
    <p>لو أحد حاول يعدل سجل قديم، بصمته بتتغير. وبما إن كل السجلات اللي بعده مرتبطة فيه، السلسلة كلها بتنكسر. النظام بيكتشف التعديل فوراً.</p>
    <p>هالشي يعطيك <strong>ضمان رياضي</strong> إن السجلات أصلية وما انعبث فيها.</p>
  </section>

  <section class="card">
    <h2 id="section-5">كيف تستخدم Audit Trail؟</h2>
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
          <td data-label="الحالة"><strong>تدقيق داخلي</strong></td>
          <td data-label="كيف تستخدمه">افتح Audit Trail وفلتر حسب القسم أو الفترة</td>
          <td data-label="الفائدة">تشوف كل استخدامات AI في قسم معين</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>تحقيق في حادثة</strong></td>
          <td data-label="كيف تستخدمه">ابحث بـ <span class="code-inline" dir="ltr">Trace ID</span> أو اسم الموظف</td>
          <td data-label="الفائدة">تتبع الطلب من البداية للنهاية</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>إثبات الامتثال</strong></td>
          <td data-label="كيف تستخدمه">صدّر السجلات لفترة محددة كـ PDF</td>
          <td data-label="الفائدة">تقدم الأدلة للجهة التنظيمية</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>مراجعة الموافقات</strong></td>
          <td data-label="كيف تستخدمه">فلتر الطلبات اللي احتاجت موافقة</td>
          <td data-label="الفائدة">تتأكد إن كل القرارات الحساسة مراجعة</td>
        </tr>
        <tr>
          <td data-label="الحالة"><strong>كشف الأنماط</strong></td>
          <td data-label="كيف تستخدمه">شوف الطلبات المحظورة أو المتكررة</td>
          <td data-label="الفائدة">تكتشف محاولات تحايل أو سوء استخدام</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-6">متى تحتاج Audit Trail؟</h2>
    <h3 id="section-6-1">✅ تحتاجه في هالحالات:</h3>
    <ul>
      <li>عندك متطلبات امتثال (PDPL، NCA ECC، ISO 27001)</li>
      <li>تبي تثبت للجهات التنظيمية إنك ملتزم</li>
      <li>تحتاج تحقق في حوادث أو شكاوى</li>
      <li>تبي تراقب استخدام AI بشكل دوري</li>
      <li>عندك تدقيق داخلي أو خارجي قريب</li>
    </ul>

    <h3 id="section-6-2">❌ ما تحتاجه إذا:</h3>
    <ul>
      <li>ما عندك متطلبات تدقيق أو امتثال</li>
      <li>استخدامك للذكاء الاصطناعي محدود جداً</li>
      <li>ما تشتغل مع بيانات حساسة</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-7">أخطاء شائعة - انتبه لها</h2>
    <div class="warning-box">
      <h3 id="section-7-1">❌ الخطأ الأول: تسجيل كل شي بدون تنظيم</h3>
      <p>لو تسجل كل تفصيلة صغيرة، السجل بيصير ضخم وصعب تلقى فيه اللي تبيه.</p>
      <p><strong>الحل:</strong> ركز على الأحداث المهمة: الطلبات، القرارات، الموافقات، الرفض، التعديلات.</p>
    </div>

    <div class="warning-box">
      <h3 id="section-7-2">❌ الخطأ الثاني: عدم مراجعة السجلات بشكل دوري</h3>
      <p>Audit Trail مو بس للتدقيق الخارجي. لازم تراجعه بشكل دوري عشان تكتشف المشاكل قبل ما تكبر.</p>
      <p><strong>الحل:</strong> خصص وقت أسبوعي أو شهري لمراجعة السجلات والبحث عن أنماط غريبة.</p>
    </div>

    <div class="warning-box">
      <h3 id="section-7-3">❌ الخطأ الثالث: عدم حماية السجلات</h3>
      <p>لو أي أحد يقدر يوصل للسجلات، ممكن تتسرب معلومات حساسة.</p>
      <p><strong>الحل:</strong> خلي الوصول للسجلات محصور على المسؤولين والمدققين فقط.</p>
    </div>
  </section>

  <section class="card">
    <h2 id="section-8">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>أكثر شي يريح بالك وقت التدقيق هو إنك تفتح Audit Trail وتقول للمدقق: "تفضل، كل شي موثق هنا".</p>
      <p>شفت شركات تضيع أسابيع تجمع أدلة من إيميلات وملفات متفرقة. وشفت شركات ثانية تفتح Audit Trail وتصدر التقرير في 5 دقائق.</p>
      <p>الفرق مو بس في الوقت، الفرق في <strong>الثقة</strong>. لما السجل منظم ومحمي ضد التعديل، المدقق يثق فيه. ولما يثق فيه، التدقيق يمر بسلاسة.</p>
      <p>نصيحتي: <strong>راجع السجلات بنفسك قبل التدقيق</strong>. تأكد إن كل شي واضح ومنطقي. لو لقيت طلبات غريبة أو قرارات مو مفهومة، حقق فيها قبل ما يسألك المدقق عنها.</p>
    </div>
  </section>

  <section class="card">
    <h2 id="section-9">قائمة تحقق قبل الاعتماد على Audit Trail</h2>
    <ol>
      <li>✅ حددت مين يقدر يوصل للسجلات؟</li>
      <li>✅ اختبرت Hash Chain: هل يكتشف التعديلات؟</li>
      <li>✅ جربت البحث والفلترة: هل تلقى الطلبات بسهولة؟</li>
      <li>✅ صدّرت تقرير تجريبي: هل الشكل واضح؟</li>
      <li>✅ حددت مدة الحفظ: كم تحتفظ بالسجلات؟</li>
      <li>✅ ربطت مع Evidence: هل كل طلب له ملف دليل؟</li>
      <li>✅ درّبت المسؤولين: كيف يستخدمون Audit Trail؟</li>
    </ol>
  </section>
