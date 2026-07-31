---
title: "Kernel Datasets: مدير مجموعات بيانات التقييم في BrightAI Kernel"
metaTitle: "Kernel Datasets: مدير مجموعات بيانات التقييم في BrightAI Kernel"
description: "دليل Dataset Manager في Kernel: Saudi Governance Benchmark بثمانية قطاعات، إصدارات بهاش حتمي، استيراد CSV وJSON وJSONL ولصق جدول، تقسيم train/validation/test، وكشف التكرار والنقص."
canonical: "https://brightai.site/docs/kernel-datasets/"
updated: "2026-07-31"
category: "Kernel"
tldr: "Dataset Manager يدير مجموعات بيانات تقييم Kernel: كل مجموعة حالات تحمل المدخل والسلوك المتوقع والحكم (سماح/تعمية/حظر/موافقة)، مع إصدارات immutable بهاش حتمي، واستيراد بأربع صيغ، وتقسيم ومجموعات فرعية."
related: ["kernel-playground","kernel-scenarios","kernel-testing-checklist","kernel-policies"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>

    <p style="color: #9fb0c7; font-size: 1.1rem;">مجموعة التقييم تحكم جودة الشهادة — أدرها بإصدارات موثوقة</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>Dataset Manager هو المكان اللي تدير منه مجموعات بيانات التقييم داخل Kernel. كل Dataset عبارة عن مجموعة حالات اختبار، وكل حالة تحمل: المدخل (Prompt)، السلوك المتوقع، الحكم (سماح / تعمية / حظر / موافقة مطلوبة)، الخطورة، القطاع، أطر الامتثال، اللغة، وأنواع PII.</p>
    <p>المعيار المدمج <strong>Saudi Governance Benchmark v1.0</strong> يغطي 100 حالة موزعة على ثمانية قطاعات سعودية: 20 حالة PDPL/خصوصية، 15 حقن أوامر NCA، 15 مالية SAMA، 15 صحية SFDA، 10 شفافية SDAIA، 10 موارد بشرية، 10 حكومي، و5 حالات لغة عربية سعودية.</p>
  </section>

  <section class="card">
    <h2 id="section-2">وش تقدم الصفحة؟</h2>
    <ul>
      <li><strong>سجل Datasets:</strong> حالة كل مجموعة (مسودة / منشور / مؤرشف) مع عدد الحالات والمصدر وعدد Runs المستخدمة فيها</li>
      <li><strong>إصدارات بهاش حتمي:</strong> كل version له hash FNV-1a يُعرض في الشريط — التعديل ينشئ نسخة جديدة ولا يعدّل المنشور</li>
      <li><strong>استيراد بأربع صيغ:</strong> CSV، JSON، JSONL، ولصق جدول — مع معاينة قبل التطبيق</li>
      <li><strong>إضافة حالة يدوية:</strong> محرر كامل للحقول مع كشف التكرار ونقص السلوك المتوقع</li>
      <li><strong>تقسيم ومجموعات فرعية:</strong> Train/Validation/Test بنسبك + مجموعة فرعية حسب القطاع والحكم وبذرة عشوائية</li>
      <li><strong>مقارنة إصدارين:</strong> عرض الإضافات والحذف والتعديلات بين أي نسختين</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-3">القواعد اللي يفرضها Kernel</h2>
    <ul>
      <li><strong>لا تعديل على Dataset منشور:</strong> أي تعديل يرفض على الأصل وينشئ version جديداً مسوداً</li>
      <li><strong>لا حذف لـ Dataset مستخدم في Run:</strong> الحل أرشفته — يختفي من القائمة لكن مرجعه يبقى للتحقق التاريخي</li>
      <li><strong>فصل البيئات:</strong> Demo وTest وLive لا تختلط أبداً — كل Dataset يحمل شارة بيئته</li>
      <li><strong>كل تعديل ينشئ version:</strong> إضافة أو تعديل حالة = نسخة جديدة بهاش يعاد حسابه</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-4">ليش هذا مهم للمنشآت السعودية؟</h2>
    <p>شهادة تقييم بلا Dataset موثوق مساوية لأي كلام. الجهات الرقابية (NCA، SDAIA، SAMA، SFDA) تطلب إثباتاً أن التقييم تم على بيانات ثابتة غير معدّلة. الهاش الحتمي لكل إصدار يظهر في الشهادة، وأي محاولة تعديل بعد التقييم تكسر التحقق — هذا يبني مصداقية التقييم أمام المراجع.</p>
  </section>

  <section class="card">
    <h2 id="section-5">خصوصية التجربة</h2>
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
          <td data-label="السؤال">هل أقدر أستورد بيانات إنتاج حقيقية؟</td>
          <td data-label="الإجابة">تقنياً نعم للاستيراد التجريبي، لكن يُنصح بشدة بعدم رفع بيانات حقيقية — الصفحة Demo وليست بيئة إنتاج.</td>
        </tr>
        <tr>
          <td data-label="السؤال">وش يمنع التعديل على النسخة المنشورة؟</td>
          <td data-label="الإجابة">قاعدة صارمة في المحرك نفسه: النشر يقفل النسخة، وأي محاولة تعديل تخلق نسخة مسودة جديدة بلا مساس بالأصل.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-6">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>ابدأ بمعيار الـ 100 حالة الجاهز، شغّله على نموذجك، ولاحظ القطاع اللي يفشل فيه أكثر من غيره. بعدها أنشئ Dataset فرعي مخصص لقطاعك (بنك، مستشفى، جهة حكومية) وأضف حالات من سيناريوهاتك الفعلية — المجموعة الفرعية تجعل التقييم أدق بكثير من المعيار العام.</p>
    </div>
  </section>
