---
title: "Kernel NVIDIA Proxy: بوابة NVIDIA الآمنة في BrightAI"
metaTitle: "Kernel NVIDIA Proxy: بوابة NVIDIA الآمنة في BrightAI"
description: "شرح كيفية عمل بوابة NVIDIA Proxy في BrightAI Kernel: تشفير الطلبات، إدارة المفاتيح، وحماية البيانات عند استخدام نماذج NVIDIA."
canonical: "https://brightai.site/docs/kernel-nvidia-proxy/"
updated: "2026-06-10"
category: "Kernel"
tldr: "شرح كيفية عمل بوابة NVIDIA Proxy في BrightAI Kernel: تشفير الطلبات، إدارة المفاتيح، وحماية البيانات عند استخدام نماذج NVIDIA."
related: ["kernel-connectors","kernel-security-model"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>
    
    <p style="color: #9fb0c7; font-size: 1.1rem;">استخدم نماذج NVIDIA بأمان تام عبر بوابة Proxy مخصصة</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>لو شركتك تستخدم نماذج NVIDIA (مثل NeMo أو nemotron)، تحتاج <strong>طبقة وسيطة</strong> بين تطبيقاتك وخدمات NVIDIA Cloud.</p>
    <p>NVIDIA Proxy يسوي لك:</p>
    <ul>
      <li><strong>تشفير الطلبات:</strong> كل بيانات تروح لـ NVIDIA مشفرة</li>
      <li><strong>إدارة المفاتيح:</strong> API Keys مشفرة ومدورة تلقائياً</li>
      <li><strong>التوثيق:</strong> كل طلب مسجل في Audit Trail</li>
      <li><strong>الحوكمة:</strong> فحص الطلبات قبل ما تصل لـ NVIDIA</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-2">كيف يعمل؟</h2>
    <ol>
      <li>التطبيق يرسل طلب للـ Proxy (مو مباشرة لـ NVIDIA)</li>
      <li>Proxy يفحص الطلب: هل فيه بيانات حساسة؟</li>
      <li>إذا الطلب آمن، Proxy يشفّره ويُرسله لـ NVIDIA API</li>
      <li>NVIDIA يرد بالنتيجة عبر Proxy</li>
      <li>Proxy يسجل كل شي في Audit Trail</li>
    </ol>
  </section>

  <section class="card">
    <h2 id="section-3">لماذا تستخدم Proxy بدل الاتصال المباشر؟</h2>
    <table class="docs-table">
      <thead>
        <tr>
          <th>الميزة</th>
          <th>اتصال مباشر</th>
          <th>عبر Proxy</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="الميزة"><strong>أمان المفاتيح</strong></td>
          <td data-label="اتصال مباشر">مفاتيح مخزنة في الكود</td>
          <td data-label="عبر Proxy">مفاتيح مشفرة في Proxy فقط</td>
        </tr>
        <tr>
          <td data-label="الميزة"><strong>التوثيق</strong></td>
          <td data-label="اتصال مباشر">سجل NVIDIA فقط</td>
          <td data-label="عبر Proxy">سجل مزدوج (NVIDIA + Kernel)</td>
        </tr>
        <tr>
          <td data-label="الميزة"><strong>فحص البيانات</strong></td>
          <td data-label="اتصال مباشر">بدون</td>
          <td data-label="عبر Proxy">فحص PII قبل الإرسال</td>
        </tr>
        <tr>
          <td data-label="الميزة"><strong>إدارة الطلبات</strong></td>
          <td data-label="اتصال مباشر">موزع مباشرة</td>
          <td data-label="عبر Proxy">Rate limiting و توزيع حسب الأولوية</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-4">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي:</strong></p>
      <p>لا تخزّن API Keys في ملفات الكود أو متغيرات البيئة المتاحة للجميع. خلّها في <strong> Vault آمن</strong> مثل AWS Secrets Manager أو HashiCorp Vault، وخلّ الـ Proxy يجلبها عند الحاجة.</p>
    </div>
  </section>
