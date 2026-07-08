---
title: "Kernel API Client: التكامل البرمجي مع BrightAI Kernel"
metaTitle: "Kernel API Client: التكامل البرمجي مع BrightAI Kernel"
description: "شرح استخدام Kernel API Client لربط تطبيقاتك وأنظمتك بخدمات BrightAI: التوثيق، الأمان، وأمثلة عملية."
canonical: "https://brightai.site/docs/kernel-api-client/"
updated: "2026-06-10"
category: "Kernel"
tldr: "شرح استخدام Kernel API Client لربط تطبيقاتك وأنظمتك بخدمات BrightAI: التوثيق، الأمان، وأمثلة عملية."
related: ["kernel-connectors","kernel-architecture"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>
    
    <p style="color: #9fb0c7; font-size: 1.1rem;">ربط تطبيقاتك وأنظمتك بخدمات BrightAI عبر API آمن وموثق</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>Kernel API Client يسمح لتطبيقاتك باستخدام خدمات BrightAI مباشرة. بدل ما تستخدم واجهة Chat يدوياً، تقدر ترسل طلبات برمجية تحصل على:</p>
    <ul>
      <li><strong>تصنيف مخاطر تلقائي</strong> لأي نص أو طلب</li>
      <li><strong>فحص PII</strong> للكشف عن البيانات الشخصية</li>
      <li><strong>سجل تدقيق</strong> لكل طلب يمر عبر API</li>
      <li><strong>موافقات</strong> تلقائية حسب السياسات المعتمدة</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-2">متى تستخدم API Client؟</h2>
    <h3 id="section-2-1">✅ استخدمه في هالحالات:</h3>
    <ul>
      <li>تبين تربط نظام CRM أو ERP بخدمات الحوكمة</li>
      <li>عندك تطبيق داخلي يحتاج فحص بيانات قبل الإرسال للـ AI</li>
      <li>تبين تدمج فحص PII في سير عمل آلي</li>
      <li>تبين تنشئ تقارير تلقائية من سجلات التدقيق</li>
    </ul>
    <h3 id="section-2-2">❌ ما تحتاجه إذا:</h3>
    <ul>
      <li>تستخدم BrightAI بس من واجهة Chat</li>
      <li>ما عندك تطبيقات خارجية تحتاج تكامل</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-3">نقاط النهاية الرئيسية</h2>
    <table class="docs-table">
      <thead>
        <tr>
          <th>النقطة</th>
          <th>الوظيفة</th>
          <th>مثال</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="النقطة"><strong>/api/v1/classify</strong></td>
          <td data-label="الوظيفة">تصنيف نص حسب المخاطر</td>
          <td data-label="مثال">إرسال نص للحصول على درجة خطورة</td>
        </tr>
        <tr>
          <td data-label="النقطة"><strong>/api/v1/scan-pii</strong></td>
          <td data-label="الوظيفة">فحص البيانات الشخصية</td>
          <td data-label="مثال">اكتشاف أسماء وأرقام هويات</td>
        </tr>
        <tr>
          <td data-label="النقطة"><strong>/api/v1/audit</strong></td>
          <td data-label="الوظيفة">عرض سجل التدقيق</td>
          <td data-label="مثال">استرجاع طلبات فترة محددة</td>
        </tr>
        <tr>
          <td data-label="النقطة"><strong>/api/v1/evidence</strong></td>
          <td data-label="الوظيفة">تحميل ملف أدلة</td>
          <td data-label="مثال">تحميل ملف PDF للتدقيق</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-4">الأمان في API</h2>
    <ul>
      <li><strong>مفتاح API:</strong> كل طلب يحتاج مفتاح فريد مشفر</li>
      <li><strong>Rate Limiting:</strong> حد أقصى للطلبات حسب الباقة</li>
      <li><strong>TLS:</strong> كل الاتصالات مشفرة بـ TLS 1.3</li>
      <li><strong>توثيق:</strong> كل طلب مسجل في Audit Trail</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-5">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>لا تستخدم API Key واحد لكل التطبيقات. أنشئ <strong>مفتاح منفصل لكل تطبيق</strong> عشان تقدر تتبع مين يسوي وش، وإذا صارت مشكلة في تطبيق واحد، تقدر تعطل مفتاحه بدون ما تؤثر على الباقي.</p>
    </div>
  </section>
