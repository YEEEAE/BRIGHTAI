---
title: "PDPL و AI: ما الذي يجب أن تعرفه الشركات السعودية؟"
description: "PDPL والذكاء الاصطناعي للشركات السعودية: المخاطر والامتثال وحماية البيانات، ودور AI Firewall وAudit Trail في بيئة آمنة."
canonical: "https://brightai.site/blog/pdpl-and-ai-saudi/"
pubDate: "2026-05-31"
updatedDate: "2026-05-31"
author: "nasser-alabdullah"
slug: "pdpl-and-ai-saudi"
readingTime: 22
category: "أمن-البيانات"
tags: ["PDPL", "الذكاء الاصطناعي", "السعودية", "حماية البيانات"]
draft: false
image: "/images/og/brightai-og-1200x630.png"
---

<!-- Short Answer -->
  <div class="short-answer tldr">
    <div class="short-answer-label">الخلاصة السريعة</div>
    <p>
      لا يوجد تعارض جوهري بين <strong>PDPL والذكاء الاصطناعي</strong>؛ النظام السعودي لا يمنع استخدام AI، لكنه يضع شروطًا صارمة حول
      شرعية المعالجة، تقليل البيانات، الشفافية، وحقوق أصحاب البيانات. التحدي الحقيقي للشركات ليس في "هل نستخدم AI؟"
      بل في "كيف نستخدمه بضوابط قابلة للتدقيق؟". الحل العملي يمر عبر ثلاث طبقات: <strong>AI Firewall</strong>،
      <strong>Audit Trail</strong>، و<strong>طبقة موافقة بشرية</strong> — مع إبقاء المسؤولية القانونية النهائية على عاتق الجهة
      وبالرجوع إلى مستشار قانوني متخصص.
    </p>
  </div>

  <!-- Section 1: Relation -->
  <section>
    <div class="section-tag">الفصل الأول</div>
    <h2>ما العلاقة بين PDPL والذكاء الاصطناعي؟</h2>
    <p>
      يصدر نظام <a href="https://www.sdaia.gov.sa" target="_blank" rel="noopener noreferrer">نظام حماية البيانات الشخصية السعودية (PDPL)</a>
      الإطار القانوني العام لمعالجة أي بيانات شخصية داخل المملكة، سواء تمت المعالجة عبر نظام تقليدي أو عبر نماذج
      الذكاء الاصطناعي. ومع الانتشار السريع لأدوات Generative AI، باتت معظم الشركات السعودية تواجه أسئلة متشابهة:
    </p>
    <ul>
      <li>هل تدريب النماذج أو استدعاؤها يعد "معالجة" بالمعنى النظامي؟</li>
      <li>هل نحتاج موافقة صريحة من المستخدم قبل تمرير بياناته إلى نموذج AI؟</li>
      <li>كيف نوفّق بين الحاجة إلى بيانات تدريب عالية الجودة ومبدأ تقليل البيانات (Data Minimization)؟</li>
      <li>من المسؤول عن قرار خاطئ اتخذه نظام AI مؤتمت؟</li>
    </ul>
    <p>
      الإجابة المختصرة: نعم، أي تفاعل مع بيانات شخصية عبر AI هو معالجة، ويستوجب أساسًا قانونيًا (موافقة، تنفيذ عقد،
      مصلحة مشروعة، أو التزام نظامي). وهذا ما يجعل <strong>امتثال PDPL</strong> جزءًا لا يتجزأ من تصميم أي منتج AI
      داخلي أو متكامل مع أدوات خارجية.
    </p>
  </section>

  <!-- Section 2: Risks -->
  <section>
    <div class="section-tag">الفصل الثاني</div>
    <h2>أين تظهر مخاطر خصوصية البيانات في مشاريع AI؟</h2>
    <p>
      تظهر <strong>خصوصية البيانات AI</strong> في نقاط محددة داخل دورة حياة النموذج، وأهمها:
    </p>

    <table class="risk-table">
      <thead>
        <tr>
          <th>النقطة</th>
          <th>المخاطرة</th>
          <th>درجة الخطورة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>إدخال بيانات حقيقية في Prompts</td>
          <td>تسرّب PII إلى مزوّد خارجي، واستخدامها في التدريب</td>
          <td><span class="level-high">عالية</span></td>
        </tr>
        <tr>
          <td>تدريب النماذج على بيانات عملاء</td>
          <td>عدم وجود أساس قانوني، إمكانية إعادة التعريف</td>
          <td><span class="level-high">عالية</span></td>
        </tr>
        <tr>
          <td>التخزين المؤقت في Logs</td>
          <td>تسجيل بيانات حساسة دون تشفير أو صلاحية</td>
          <td><span class="level-med">متوسطة</span></td>
        </tr>
        <tr>
          <td>مخرجات النماذج (Hallucinations)</td>
          <td>كشف بيانات عملاء آخرين عن طريق الخطأ</td>
          <td><span class="level-med">متوسطة</span></td>
        </tr>
        <tr>
          <td>صلاحيات الموظفين</td>
          <td>وصول غير محدود إلى بيانات حساسة</td>
          <td><span class="level-low">منخفضة إلى متوسطة</span></td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- Section 3: What not to send -->
  <section>
    <div class="section-tag">الفصل الثالث</div>
    <h2>ما البيانات التي يجب ألا تُرسل مباشرة إلى أدوات AI؟</h2>
    <p>
      كقاعدة ذهبية في <strong>حماية البيانات الشخصية</strong>: كل ما يمكنه تعريف شخص طبيعي — بشكل مباشر أو غير مباشر —
      يجب أن يخضع لمرحلة معالجة قبل الوصول إلى أي نموذج AI خارجي أو داخلي. القائمة العملية تشمل:
    </p>
    <div class="cards-grid">
      <div class="feature-card">
        <div class="feature-icon">🆔</div>
        <h4>بيانات الهوية</h4>
        <p>رقم الهوية الوطنية، الإقامة، جواز السفر، رقم الحدود، السجل التجاري الشخصي.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h4>بيانات الاتصال</h4>
        <p>أرقام الجوال، البريد الإلكتروني الشخصي، العنوان المنزلي، معرفات التواصل الاجتماعي.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💳</div>
        <h4>البيانات المالية</h4>
        <p>أرقام البطاقات، IBAN، سجل الرواتب، المعلومات الضريبية، تفاصيل الحسابات البنكية.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🏥</div>
        <h4>البيانات الصحية</h4>
        <p>السجلات الطبية، الوصفات، نتائج التحاليل، المعلومات النفسية — وهي أشد حساسية بموجب PDPL.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🧬</div>
        <h4>البيانات البيومترية</h4>
        <p>بصمة الوجه، بصمة الإصبع، التعرف على الصوت، قزحية العين.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📍</div>
        <h4>البيانات الموقعية الدقيقة</h4>
        <p>GPS مستمر، سجلات التنقل اليومي، بيانات الحضور والانصراف المرتبطة بأفراد.</p>
      </div>
    </div>
    <div class="compliance-notice">
      <p>
        <strong>ملاحظة:</strong> إرسال هذه البيانات إلى أدوات AI عامة (مثل ChatGPT أو Gemini أو Claude) دون
        اتفاقية معالجة بيانات (DPA) وضوابط تقنية يُعد مخاطرة تنظيمية حقيقية، وقد يُعرّض الجهة لعقوبات تصل إلى
        الغرامات النظامية والتشهير وفق ما نص عليه PDPL.
      </p>
    </div>
  </section>

  <!-- Section 4: AI Firewall -->
  <section>
    <div class="section-tag">الطبقة الأولى</div>
    <h2>دور AI Firewall في الحوكمة</h2>
    <p>
      الـ <a href="/solutions/ai-firewall/">AI Firewall</a> هو الخط الدفاعي الأول الذي يعمل كوسيط ذكي بين المستخدم
      والنموذج. وظيفته ليست منع الاستخدام، بل تصفيته. يعمل من خلال ثلاث آليات:
    </p>
    <ul>
      <li><strong>كشف PII تلقائيًا:</strong> يحجب أسماء، أرقام هوية، وأرقام بطاقات قبل أن تصل إلى النموذج.</li>
      <li><strong>منع المواضيع المحظورة:</strong> يرفض Prompts تطلب استشارات قانونية/طبية خارج النطاق المعتمد.</li>
      <li><strong>تطبيق السياسات حسب القسم:</strong> سياسة مختلفة لفريق التسويق عن فريق HR عن فريق التطوير.</li>
    </ul>

    <div class="code-block">
<span class="comment">// مثال على استجابة AI Firewall عند محاولة إرسال رقم هوية</span><br>
<span class="keyword">Input</span>: <span class="string">"حلّل هذا السجل للعميل 1098765432"</span><br>
<span class="keyword">Firewall</span>: <span class="string">"🚫 تم حجب PII (National ID)"</span><br>
<span class="keyword">Sanitized</span>: <span class="string">"حلّل هذا السجل للعميل [ID_REDACTED]"</span><br>
<span class="keyword">Forwarded</span>: <span class="string">✓ إلى النموذج بأمان</span>
    </div>
  </section>

  <!-- Section 5: Audit Trail -->
  <section>
    <div class="section-tag">الطبقة الثانية</div>
    <h2>دور Audit Trail في إثبات الامتثال</h2>
    <p>
      عند المراجعة من قبل جهة تنظيمية، لا يكفي أن تقول الشركة "نحن متوافقون". يجب أن تثبت ذلك.
      <a href="/solutions/ai-audit-trail/">AI Audit Trail</a> يوفّر سجلاً زمنيًا مشفّرًا لكل تفاعل:
    </p>
    <div class="cards-grid">
      <div class="feature-card">
        <div class="feature-icon">📜</div>
        <h4>سجل غير قابل للتلاعب</h4>
        <p>Hash لكل طلب/استجابة مع طابع زمني دقيق.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">👤</div>
        <h4>هوية المستخدم</h4>
        <p>من أدخل البيانات؟ من وافق على الاستثناء؟ من راجع المخرجات؟</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚖️</div>
        <h4>الأساس القانوني</h4>
        <p>ربط كل معالجة بالسند النظامي المحدد في سجل المعالجة (ROPA).</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔍</div>
        <h4>قابلية الاسترجاع</h4>
        <p>إمكانية إعادة بناء أي حدث بالكامل خلال دقائق للاستجابة لطلبات أصحاب البيانات.</p>
      </div>
    </div>
    <p>
      هذه القابلية للتدقيق هي ما يميز الشركة الجاهزة عن الشركة التي تعمل "بالبركة" في تعاملها مع AI، وهي
      متطلّب ضمني في PDPL ومعايير ISO 27701 المرتبطة به.
    </p>
  </section>

  <!-- Section 6: Human Approval -->
  <section>
    <div class="section-tag">الطبقة الثالثة</div>
    <h2>دور الموافقة البشرية (Human-in-the-Loop)</h2>
    <p>
      لا يوجد نظام AI معصوم، وأحيانًا يتطلّب الأمر قرارات عالية المخاطرة (قرارات ائتمانية، قرارات HR، توصيات طبية).
      هنا يأتي دور <a href="/solutions/human-approval-layer/">Human Approval Layer</a> كصمّام الأمان النهائي:
    </p>
    <ul>
      <li><strong>عتبات تلقائية:</strong> إذا تجاوزت درجة الخطورة في الطلب حدًا معينًا، يُحوَّل تلقائيًا للمراجعة البشرية.</li>
      <li><strong>تفويض ديناميكي:</strong> حسب نوع البيانات (PII/PHI) وحسب القسم المسؤول.</li>
      <li><strong>توثيق القرار:</strong> كل موافقة تُسجَّل مع اسم المُراجِع وسبب الموافقة.</li>
      <li><strong>حق النقض:</strong> يمكن لمراجع الامتثال رفض أي طلب حتى لو مرّ عبر AI Firewall.</li>
    </ul>
    <p>
      هذه الطبقة هي ما يجعل AI مجرد "مساعد" وليس "صانع قرار"، وهو موقف متحفّظ يتبناه الكثير من المنظمين
      حول العالم عند التعامل مع الذكاء الاصطناعي في المجالات الحساسة.
    </p>
  </section>

  <!-- Section 7: Checklist -->
  <section>
    <div class="section-tag">الفصل العملي</div>
    <h2>قائمة الجاهزية العملية (PDPL × AI Readiness)</h2>
    <p>
      قبل إطلاق أي مشروع AI في الشركة، تأكد من اكتمال النقاط التالية. هذه القائمة مستوحاة من ممارسات
      الحوكمة المعتمدة، وليست بديلاً عن الاستشارة القانونية:
    </p>

    <div class="checklist">
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>سجل أنشطة المعالجة (ROPA) محدّث:</strong> يوثّق كل حالة يتم فيها تمرير بيانات شخصية إلى نموذج AI، مع الأساس القانوني.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>تقييم أثر حماية البيانات (DPIA):</strong> إلزامي للمشاريع ذات المخاطر العالية وفق PDPL، ويجب إجراؤه قبل بدء المعالجة.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>اتفاقية معالجة بيانات (DPA):</strong> موقّعة مع أي مزوّد AI خارجي، مع تحديد مكان تخزين البيانات ومدة الاحتفاظ.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>إشعار خصوصية محدّث:</strong> يُعلم المستخدمين بأن بياناتهم قد تُعالَج عبر أدوات AI، ويشرح حقوقهم.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>آلية تلقائية لإخفاء PII:</strong> AI Firewall مفعّل على جميع نقاط الوصول.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>سجل تدقيق مشغّل:</strong> Audit Trail يحفظ كل الأحداث لمدة لا تقل عن المدة النظامية المحددة.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>طبقة موافقة بشرية:</strong> مفروضة على القرارات المؤتمتة ذات الأثر الكبير.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>سياسة استخدام AI للموظفين:</strong> موثّقة وموقّعة، مع تدريب سنوي عليها.</div>
      </div>
      <div class="checklist-item">
        <div class="check-icon">✓</div>
        <div><strong>خطة استجابة للانتهاكات:</strong> جاهزة للتنفيذ خلال 72 ساعة من اكتشاف أي تسريب.</div>
      </div>
    </div>
  </section>

  <!-- Section 8: How BrightAI helps -->
  <section>
    <div class="section-tag">كيف نساعد</div>
    <h2>كيف تدعم BrightAI الشركات السعودية؟</h2>
    <p>
      <strong>نودّ أن نكون واضحين منذ البداية:</strong> BrightAI لا تقدم استشارة قانونية، ولا تضمن الامتثال الكامل
      لنظام PDPL أو أي نظام آخر. الامتثال مسؤولية قانونية تقع على الجهة نفسها، ويجب أن يُبنى بالتعاون مع مستشار
      قانوني مؤهّل ومختص بالشأن السعودي.
    </p>
    <p>
      ما تفعله BrightAI هو توفير <strong>بنية تقنية</strong> تدعم الجاهزية التشغيلية، والضوابط، وقابلية التدقيق،
      وسير عمل أكثر أمانًا بحسب نطاق المشروع. نقدم ذلك عبر ثلاث ركائز:
    </p>

    <div class="cards-grid">
      <div class="feature-card">
        <div class="feature-icon">🛡️</div>
        <h4>طبقة حماية</h4>
        <p>AI Firewall يرشح PII ويطبّق السياسات تلقائيًا، قبل أن تصل البيانات إلى أي نموذج.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h4>طبقة رؤية</h4>
        <p>Audit Trail يوفّر سجلات قابلة للتصدير والمراجعة، جاهزة لأي طلب من الجهة التنظيمية.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🧑‍⚖️</div>
        <h4>طبقة حوكمة</h4>
        <p>Human Approval Layer يضع القرار الحساس بيد الإنسان، لا الآلة.</p>
      </div>
    </div>

    <p>
      هذه الركائز الثلاث، مجتمعة، تمنح الشركة السعودية مساحة آمنة لاستخدام AI مع تقليل المخاطر التشغيلية،
      وبناء ثقافة استخدام مسؤولة يمكن الدفاع عنها عند المراجعة.
    </p>

    <div class="links-grid">
      <a href="/services/" class="link-card">جميع خدماتنا</a>
      <a href="/solutions/ai-firewall/" class="link-card">AI Firewall</a>
      <a href="/solutions/ai-audit-trail/" class="link-card">AI Audit Trail</a>
      <a href="/solutions/human-approval-layer/" class="link-card">Human Approval Layer</a>
      <a href="/contact/" class="link-card">تواصل معنا</a>
    </div>
  </section>

  <!-- FAQ -->
  <section>
    <div class="section-tag">أسئلة شائعة</div>
    <h2>أسئلة يكررها المسؤولون التقنيون والقانونيون</h2>

    <div class="faq">













    </div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <h2>جاهز لبناء بيئة AI خاضعة للحوكمة؟</h2>
    <p>دعنا نساعدك على تقييم جاهزية مشاريع الذكاء الاصطناعي في شركتك، وفهم نقاط القوة والثغرات وفق أفضل الممارسات العملية.</p>
    <a href="/contact/">تواصل معنا</a>
  </section>
