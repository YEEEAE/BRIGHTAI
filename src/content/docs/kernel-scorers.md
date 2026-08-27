---
title: "Kernel Scorers: سجل ومشغّل مقاييس تقييم مخرجات الذكاء الاصطناعي في BrightAI Kernel"
metaTitle: "Kernel Scorers: سجل ومشغّل مقاييس تقييم مخرجات الذكاء الاصطناعي في BrightAI Kernel"
description: "دليل Scorer Registry في Kernel: 33 مقيّماً عبر خمس فئات (الدقة، الهلوسة، PII، الحقن، الامتثال)، أنواع PII السعودية العشر، control mapping للامتثال، ومشغّل تقييم تفاعلي يوضح الدرجة والحالة والأدلة لكل نتيجة."
canonical: "https://brightai.live/docs/kernel-scorers/"
updated: "2026-07-31"
category: "Kernel"
tldr: "سجل الـ Scorers هو مجموعة 33 مقيّماً قياسياً (دقة 8 · هلوسة 6 · PII 4 · حقن 9 · امتثال 6) يحكم على جودة وسلامة مخرجات الذكاء الاصطناعي. كل نتيجة تعرض الدرجة والحالة والمتوقع والفعلي والخطورة والشرح والسياسة والـ Trace والتوصية والأدلة. تسريب PII حرج يمنع الإنتاج، وفشل أي Scorer يجعل التشغيل Incomplete، ولا تُعرض Compliant بدون ضوابط مرقّمة."
related: ["kernel-datasets","kernel-scenarios","kernel-policies","kernel-playground"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>

    <p style="color: #9fb0c7; font-size: 1.1rem;">كل مخرج يُقاس — لا انطباع، بل أرقام وأدلة وضوابط</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>الـ Scorers هي مقاييس قياسية تختبر جودة وسلامة مخرجات الذكاء الاصطناعي. كل Scorer له هوية ثابتة: id، اسم، إصدار، فئة، وصف، مدخلات، مدى مخرجات (0-100)، خطورة، عتبة نجاح، نوع مُقيِّم (مطابقة حرفية / تشابه دلالي / حكم نموذج / قواعد حتمية)، ومتطلبات أدلة.</p>
    <p>السجل الكامل يضم <strong>33 مقيّماً</strong> موزعة على خمس فئات: الدقة (8)، الهلوسة (6)، خصوصية البيانات PII (4)، الحقن (9)، والامتثال التنظيمي (6). وكل نتيجة تشغيل تعرض الحقول التسعة: الدرجة، الحالة، المتوقع، الفعلي، الخطورة، الشرح، السياسة، الـ Trace، والتوصية — مع عمود أدلة مستقل.</p>
  </section>

  <section class="card">
    <h2 id="section-2">وش تقدم الصفحة؟</h2>
    <ul>
      <li><strong>سجل كامل:</strong> 33 مقيّماً بجداول فئوية مع فلترة بالبحث والفئة — واضغط أي مقيّم لعرض تفاصيله وضوابطه وأدلته</li>
      <li><strong>مشغّل تفاعلي (Runner):</strong> الصق مدخلاً ومخرجات أو اختر مثالاً جاهزاً، وشغّل التقييم على السجل كاملاً</li>
      <li><strong>نتائج من تسعة حقول:</strong> الدرجة، الحالة، المتوقع، الفعلي، الخطورة، الشرح، السياسة، Trace، التوصية + الأدلة</li>
      <li><strong>كشف PII حقيقي:</strong> أنماط حتمية لأنواع PII السعودية العشر (هوية، جوال، آيبان، بطاقة، ملف مريض…) تُنفَّذ فعلاً في المتصفح</li>
      <li><strong>Control Mapping:</strong> سكوررز الامتثال الستة مرتبطون بضوابط مرقّمة (PDPL م.12، NCA ECC-01، SDAIA DG-01…) — لا Compliant بدونها</li>
      <li><strong>القواعد الخمس:</strong> تسريب PII حرج يمنع الإنتاج · فشل Scorer = Run Incomplete · لا Compliant بلا mapping · الدرجة ليست بديلاً عن الدليل · Live/Demo/Simulated واضح</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-3">فئات الـ Scorers الـ33</h2>
    <table class="docs-table">
      <thead>
        <tr>
          <th>الفئة</th>
          <th>العدد</th>
          <th>أمثلة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="الفئة">الدقة (Accuracy)</td>
          <td data-label="العدد">8</td>
          <td data-label="أمثلة">مطابقة حرفية · تشابه دلالي · دقة واقعية · اتباع التعليمات · اكتمال · جودة العربية · المصطلحات السعودية · معالجة المجهول</td>
        </tr>
        <tr>
          <td data-label="الفئة">الهلوسة (Hallucination)</td>
          <td data-label="العدد">6</td>
          <td data-label="أمثلة">ادعاءات بلا سند · دقة الاستشهاد · تناقض داخلي · معايرة الثقة · ادعاءات تنظيمية مختلقة · تجاوز طبي/قانوني</td>
        </tr>
        <tr>
          <td data-label="الفئة">خصوصية PII</td>
          <td data-label="العدد">4</td>
          <td data-label="أمثلة">كشف · تصنيف · صحة التعمية · تسريب في المخرجات (يمنع الإنتاج عند الحرجة)</td>
        </tr>
        <tr>
          <td data-label="الفئة">الحقن (Injection)</td>
          <td data-label="العدد">9</td>
          <td data-label="أمثلة">حقن أوامر · كسر القيود · استخراج التعليمات · استخراج أسرار · أدوات غير مصرح بها · تجاوز سياسات · تلاعب بالسجل · تجاوز موافقة بشرية · تلاعب متعدد اللفات</td>
        </tr>
        <tr>
          <td data-label="الفئة">الامتثال (Compliance)</td>
          <td data-label="العدد">6</td>
          <td data-label="أمثلة">PDPL · NCA ECC · SDAIA · SAMA · SFDA · ISO/IEC 42001 — كل واحد بضوابط مرقّمة</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-4">القواعد اللي يفرضها Kernel</h2>
    <ul>
      <li><strong>تسريب PII حرج يمنع الجاهزية للإنتاج:</strong> فشل مقيّم sc-pii-leakage بحالة حرجة = Blocked — لا شهادة Passed أبداً</li>
      <li><strong>فشل Scorer يجعل الـ Run Incomplete:</strong> حتى فشل واحد فقط من الـ33 = تشغيل ناقص لا يُصدر شهادة</li>
      <li><strong>لا Compliant بدون control mapping:</strong> ادعاء الامتثال يمر فقط مع ضوابط مرقّمة وأدلة مرتبطة</li>
      <li><strong>الدرجة ليست بديلاً عن الدليل:</strong> كل نتيجة تحمل مقتطفات وضوابط وTrace — المدقق يقرأ الدليل لا الرقم</li>
      <li><strong>Live / Demo / Simulated واضح:</strong> شارة البيئة في كل نتيجة وملخص التشغيل — المقيّمون الحتميون (regex) حقيقيون، والبقية Simulated بشارة</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-5">ليش هذا مهم للمنشآت السعودية؟</h2>
    <p>السوق السعودي له خصوصية تنظيمية: الادعاء التنظيمي المختلق (مثل «المادة 99 من نظام PDPL») كارثة أمام جهة رقابية، وتسريب هوية وطنية في مخرج نموذج جريمة بحد ذاتها. الـ Scorers السعودية تكشف هذي الأنماط تحديداً: الأنماط الحتمية ترصد الهوية والآيبان والملفات الطبية، ومقيّمي الادعاءات التنظيمية المختلقة والتجاوز الطبي/القانوني يمنعون الأخطاء الأغلى تكلفة — كل ذلك بأدلة قابلة للعرض أمام NCA أو SDAIA أو SAMA.</p>
  </section>

  <section class="card">
    <h2 id="section-6">خصوصية التجربة</h2>
    <table class="docs-table">
      <thead>
        <tr>
          <th>السؤال</th>
          <th>الإجابة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="السؤال">هل بياناتي تُرسل لخادم؟</td>
          <td data-label="الإجابة">لا. كل العمليات تشتغل محلياً في المتصفح (vanilla JS) مع بيانات توضيحية.</td>
        </tr>
        <tr>
          <td data-label="السؤال">هل التقييم حقيقي على نموذج؟</td>
          <td data-label="الإجابة">لا في الـ Demo. المقيّمون الحتميون (regex) يُنفَّذون فعلاً على النص، لكن مقيّمي llm-judge/hybrid/semantic محاكاة حتمية موسومة Simulated — لا ادعاء بتقييم نموذج حقيقي.</td>
        </tr>
        <tr>
          <td data-label="السؤال">ليش لا تُعرض Compliant بدون ضوابط؟</td>
          <td data-label="الإجابة">لأن ادعاء الامتثال بلا mapping لا قيمة له أمام المدقق — الضوابط المرقّمة (PDPL م.12، ECC-01…) هي ما يثبت تغطية المعالجة.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-7">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>ابدأ بمثال «تسريب هوية + جوال في المخرجات» في المشغّل — وشوف كيف مقيّم التسريب (sc-pii-leakage) يقلب التشغيل كله إلى Blocked ويمنع الجاهزية للإنتاج. بعدها جرّب مثال «الادعاء التنظيمي المختلق» وشوف مقيّم sc-hal-fabricated-reg يكشفه حرفياً. هذي الحالتان هما أهم ما يركز عليه المدقق السعودي عند مراجعة أي نموذج.</p>
    </div>
  </section>
