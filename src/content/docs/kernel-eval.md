---
title: "Kernel Evaluation Engine: محرك تقييم مخرجات الذكاء الاصطناعي في BrightAI Kernel"
metaTitle: "Kernel Evaluation Engine: محرك تقييم مخرجات الذكاء الاصطناعي في BrightAI Kernel"
description: "دليل محرك التقييم في Kernel: 7 أنواع تشغيل (حالة واحدة، Dataset كامل، مجموعة فرعية، عينة، محادثة متعددة الأدوار، Agent محدود، إعادة الفاشل)، 15 مرحلة خط تشغيل، ضوابط pause/cancel/resume والحفظ الجزئي، وقاعدة لا Passed لشغل ناقص."
canonical: "https://brightai.live/docs/kernel-eval/"
updated: "2026-08-01"
category: "Kernel"
tldr: "محرك التقييم هو الطبقة اللي تشغّل الـ Datasets على الـ Scorers وتنتج قرار بوابة موثّق. سبعة أنواع تشغيل و15 مرحلة لكل حالة مع Trace، وضوابط تشغيل كاملة (توقف، إلغاء، استئناف، حفظ جزئي، concurrency، retry، timeouts، budget). القاعدة الأهم: لا Passed لشغل ناقص — أي تشغيل متوقف أو ملغي أو متجاوز الميزانية = Incomplete بلا شهادة."
related: ["kernel-datasets","kernel-scorers","kernel-scenarios","kernel-playground"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>

    <p style="color: #9fb0c7; font-size: 1.1rem;">شغّل، راقب، قِس، واحكم بقرار موثّق — لا انطباع، بل أرقام وأدلة وضوابط</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>محرك التقييم (Evaluation Engine) هو الطبقة التي تشغّل مجموعات البيانات (Datasets) على المقاييس (Scorers) وتنتج قرار بوابة موثّق. كل حالة تمر بـ <strong>15 مرحلة</strong> موثقة بخط تشغيل كامل: تحميل Dataset، التحقق من صحة الحالات، إنشاء Evaluation Run، توليد Trace، فحص PII قبل الإرسال، فحص الحقن، تقييم المخاطر، تقييم السياسات، استدعاء النموذج، تقييم المخرجات، حساب التكلفة والزمن، توليد الدليل، تجميع النتائج، قرار البوابة، وتجهيز الشهادة.</p>
    <p>الناتج ليس درجة واحدة بل <strong>قرار بوابة</strong> (اجتاز / اجتاز مع ملاحظات / يحتاج مراجعة بشرية / محظور / غير مكتمل) مع Trace ID فريد لكل حالة وقابل للمراجعة أمام الجهات الرقابية.</p>
  </section>

  <section class="card">
    <h2 id="section-2">وش تقدم الصفحة؟</h2>
    <ul>
      <li><strong>7 أنواع تشغيل:</strong> حالة واحدة · Dataset كامل · مجموعة فرعية (قطاع/خطورة) · عينة حتمية بالبذرة · محادثة متعددة الأدوار · Agent بصلاحيات محدودة · إعادة تشغيل الحالات الفاشلة فقط</li>
      <li><strong>لوحة إعداد كاملة:</strong> اختر النوع، Dataset، النموذج، السياسة، الـ Scorers، وضوابط المحرك (concurrency · retries · provider/scorer timeout · budget · seed)</li>
      <li><strong>وحدة تشغيل حية:</strong> تقدم، مكتملة، فاشلة، حرجة، الحالة الجارية، التكلفة التراكمية، متوسط الزمن، P50/P95، عدد الأخطاء</li>
      <li><strong>خط تشغيل 15 مرحلة:</strong> مرئي أثناء التشغيل لكل حالة جارية (بانتظار / جارٍ / تم / متجاوز)</li>
      <li><strong>ضوابط كاملة:</strong> pause · cancel · resume · استئناف آخر تشغيل · إعادة الفاشل — والنتائج محفوظة جزئياً في كل لحظة</li>
      <li><strong>قرار بوابة:</strong> لا Passed لشغل ناقص · تسريب PII حرج = Blocked · فشل Scorer حرج = Incomplete · Live/Demo/Simulated واضح</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-3">أنواع التشغيل السبعة</h2>
    <table class="docs-table">
      <thead>
        <tr>
          <th>النوع</th>
          <th>الوصف</th>
          <th>الاستخدام</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="النوع">حالة واحدة (Single)</td>
          <td data-label="الوصف">تشغيل حالة واحدة محددة من Dataset أو نص حر.</td>
          <td data-label="الاستخدام">فحص سريع لطلب معين أو نص مخصص.</td>
        </tr>
        <tr>
          <td data-label="النوع">Dataset كامل</td>
          <td data-label="الوصف">تشغيل كل حالات Dataset المختار بالترتيب.</td>
          <td data-label="الاستخدام">شهادة شاملة على المعيار السعودي (100 حالة).</td>
        </tr>
        <tr>
          <td data-label="النوع">مجموعة فرعية (Subset)</td>
          <td data-label="الوصف">الحالات المطابقة لفلتر قطاع/خطورة.</td>
          <td data-label="الاستخدام">اختبار قطاع واحد (مثل SAMA أو SFDA).</td>
        </tr>
        <tr>
          <td data-label="النوع">عينة (Sample)</td>
          <td data-label="الوصف">عينة عشوائية حتمية (بالبذرة) بعدد محدد.</td>
          <td data-label="الاستخدام">فحص سريع قابل لإعادة الإنتاج.</td>
        </tr>
        <tr>
          <td data-label="النوع">محادثة متعددة الأدوار</td>
          <td data-label="الوصف">محادثة بعدة رسائل — كل رسالة تمر بخط التشغيل.</td>
          <td data-label="الاستخدام">اختبار التلاعب متعدد اللفات.</td>
        </tr>
        <tr>
          <td data-label="النوع">Agent محدود</td>
          <td data-label="الوصف">Agent بأدوات مسموحة ونقطة توقف بشرية.</td>
          <td data-label="الاستخدام">اختبار صلاحيات الوكيل قبل الإنتاج.</td>
        </tr>
        <tr>
          <td data-label="النوع">إعادة الفاشل</td>
          <td data-label="الوصف">يعيد تشغيل الحالات الفاشلة فقط من Run سابق محفوظ.</td>
          <td data-label="الاستخدام">تحقق من إصلاح السياسة دون إعادة كل شيء.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-4">القواعد اللي يفرضها Kernel</h2>
    <ul>
      <li><strong>لا Passed لشغل ناقص:</strong> أي تشغيل متوقف أو ملغي أو متجاوز الميزانية = Incomplete، لا شهادة مهما كانت الدرجات</li>
      <li><strong>لا تُفقد النتائج عند توقف المزوّد:</strong> كل حالة تُحفظ فور اكتمالها (partial saving) ويمكن استئناف التشغيل من آخر حالة مكتملة</li>
      <li><strong>Budget limit يوقف التشغيل:</strong> عند تجاوز الحد بالريال السعودي يتوقف المحرك تلقائياً ويُحفظ الجزئي</li>
      <li><strong>Provider/Scorer timeout + retry:</strong> استدعاء المزوّد يُعاد بمحاولات محدودة مع backoff مضاعف</li>
      <li><strong>Live / Demo / Simulated واضح:</strong> المزوّد هنا Simulated حتمي بالبذرة، والفحوصات الحتمية (regex للـ PII والحقن) تُنفَّذ فعلاً</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-5">ليش هذا مهم للمنشآت السعودية؟</h2>
    <p>قبل اعتماد أي نموذج في الإنتاج، الجهة الرقابية السعودية (NCA، SDAIA، SAMA، SFDA) تحتاج إثباتاً: هل النموذج يسرّب بيانات شخصية؟ هل يختلق مواد تنظيمية؟ هل يتبع السياسات؟ محرك التقييم يجيب بأرقام وأدلة: يشغّل معيار Saudi Governance Benchmark على الـ Scorers الحتمية، يحسب التكلفة والزمن، ويخرج بقرار بوابة مع Trace قابل للمراجعة — وثيقة جاهزة لأي مدقق.</p>
    <p>جرّب عملياً: شغّل Dataset كامل ثم أوقف التشغيل (pause) — شوف كيف يتحول القرار إلى Incomplete ولا تُصدر شهادة. ثم جرّب خانة «جرّب انقطاع المزوّد» — شوف كيف يعيد المحرك المحاولة ويحفظ كل حالة اكتملت، لتستأنف من حيث توقفت.</p>
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
          <td data-label="الإجابة">لا. كل العمليات تشتغل محلياً في المتصفح (vanilla JS) مع بيانات توضيحية. النتائج المحفوظة في localStorage للجلسة فقط.</td>
        </tr>
        <tr>
          <td data-label="السؤال">هل التقييم حقيقي على نموذج؟</td>
          <td data-label="الإجابة">لا في الـ Demo. المزوّد Simulated حتمي بالبذرة، والفحوصات الحتمية (regex للـ PII والحقن والادعاءات التنظيمية المختلقة) تُنفَّذ فعلاً. لا ادعاء بتقييم نموذج حقيقي.</td>
        </tr>
        <tr>
          <td data-label="السؤال">ليش لا تُصدر شهادة من تشغيل ناقص؟</td>
          <td data-label="الإجابة">لأن الشهادة تعني اكتمالاً. لو توقف التشغيل أو أُلغي، فهناك حالات لم تُقيَّم — فلا يمكن الادعاء بأن النموذج اجتاز كل الحالات.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-7">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>ابدأ بتشغيل Dataset كامل على المعيار السعودي وشوف قرار البوابة. بعدها جرّب أوقفه في منتصفه (pause ثم cancel) — هذا أهم درس: لا يمكن إصدار Passed من شغل ناقص، فالتشغيل الكامل هو الشرط الأول لأي شهادة. وأخيراً جرّب خانة انقطاع المزوّد لتتأكد أن النتائج لا تضيع وأن الاستئناف يشتغل — هذا بالضبط ما يسأل عنه المدقق السعودي عند مراجعة أي عملية تقييم.</p>
    </div>
  </section>
