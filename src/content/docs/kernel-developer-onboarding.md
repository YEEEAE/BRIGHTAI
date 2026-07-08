---
title: "Kernel Developer Onboarding: دليل مطور BrightAI Kernel"
metaTitle: "Kernel Developer Onboarding: دليل مطور BrightAI Kernel"
description: "دليل شامل لdevelopers الجدد على BrightAI Kernel: البيئة التقنية، بنية الكود، سير العمل، وأفضل الممارسات."
canonical: "https://brightai.site/docs/kernel-developer-onboarding/"
updated: "2026-06-10"
category: "Kernel"
tldr: "دليل شامل لdevelopers الجدد على BrightAI Kernel: البيئة التقنية، بنية الكود، سير العمل، وأفضل الممارسات."
related: ["kernel-architecture","kernel-testing-checklist"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>
    
    <p style="color: #9fb0c7; font-size: 1.1rem;">ابدأ العمل على BrightAI Kernel خلال ساعات بدل أسابيع</p>
  </section>

  <section class="card">
    <h2 id="section-1">مرحباً بك في فريق Kernel</h2>
    <p>هالدليل يخذك من الصفر لحد ما تقدر تساهم في Kernel باستقلالية. المطلوب منك:</p>
    <ul>
      <li>خبرة في TypeScript أو JavaScript</li>
      <li>فهم أساسي لأمان الويب</li>
      <li>تثبيت Node.js 18+ وpnpm</li>
      <li>حساب GitHub مرتبط بالمشروع</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-2">إعداد البيئة المحلية</h2>
    <ol>
      <li><strong>استنساخ المستودع:</strong> <code>git clone</code> من GitHub</li>
      <li><strong>تثبيت الاعتماديات:</strong> <code>pnpm install</code></li>
      <li><strong>إعداد متغيرات البيئة:</strong> انسخ <code>.env.example</code> إلى <code>.env</code></li>
      <li><strong>تشغيل محلي:</strong> <code>pnpm dev</code></li>
      <li><strong>تشغيل الاختبارات:</strong> <code>pnpm test</code></li>
    </ol>
  </section>

  <section class="card">
    <h2 id="section-3">بنية المشروع</h2>
    <table class="docs-table">
      <thead>
        <tr>
          <th>المجلد</th>
          <th>المحتوى</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="المجلد"><code>src/pages/kernel/</code></td>
          <td data-label="المحتوى">صفحات Kernel</td>
          <td data-label="ملاحظات">كل صفحة ملف Astro منفصل</td>
        </tr>
        <tr>
          <td data-label="المجلد"><code>src/components/</code></td>
          <td data-label="المحتوى">المكونات المشتركة</td>
          <td data-label="ملاحظات">استخدم المكونات الموجودة قبل الإنشاء</td>
        </tr>
        <tr>
          <td data-label="المجلد"><code>src/content/docs/</code></td>
          <td data-label="المحتوى">ملفات التوثيق</td>
          <td data-label="ملاحظات">Markdown مع frontmatter موحد</td>
        </tr>
        <tr>
          <td data-label="المجلد"><code>public/kernel/</code></td>
          <td data-label="المحتوى">الأصول الثابتة للـ Kernel</td>
          <td data-label="ملاحظات">CSS وJS خاص بالـ Kernel</td>
        </tr>
        <tr>
          <td data-label="المجلد"><code>scripts/</code></td>
          <td data-label="المحتوى">سكربتات البناء والتحقق</td>
          <td data-label="ملاحظات">لا تعدل بدون مراجعة</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-4">سير العمل اليومي</h2>
    <ol>
      <li>_pull latest_ من main</li>
      <li>أنشئ فرع جديد من main</li>
      <li>اكتب اختبارات أولاً (TDD)</li>
      <li>نفّذ التغيير</li>
      <li>شغّل الاختبارات وتأكد من النجاح</li>
      <li>أرسل Pull Request مع وصف واضح</li>
      <li>انتظر مراجعة الزميل</li>
    </ol>
  </section>

  <section class="card">
    <h2 id="section-5">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي:</strong></p>
      <p>اقرأ <a href="/docs/kernel-architecture/">بنية Kernel</a> قبل ما تلمس كود. فهم الطبقات الأربع يوفر عليك ساعات من الارتباك.</p>
    </div>
  </section>
