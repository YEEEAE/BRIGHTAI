---
title: "Kernel Connectors: موصلات الأنظمة والبيانات"
metaTitle: "Kernel Connectors: موصلات الأنظمة والبيانات"
description: "شرح عملي لموصلات BrightAI Kernel: كيف تربط Kernel بأنظمة العمل ومصادر البيانات بشكل آمن ومنظم."
canonical: "https://brightai.live/docs/kernel-connectors/"
updated: "2026-06-10"
category: "Kernel"
tldr: "شرح عملي لموصلات BrightAI Kernel: كيف تربط Kernel\nبأنظمة العمل ومصادر البيانات بشكل آمن ومنظم."
related: ["kernel-compliance","kernel-evidence"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>
    
    <p style="color:#9fb0c7;font-size:1.1rem">اربط Kernel بأنظمة العمل ومصادر البيانات بشكل آمن ومنظم</p>
  </section>
  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>الموصلات (Connectors) تسمح لـ Kernel بالوصول لبيانات شركتك من أنظمة مختلفة، مثل:</p>
    <ul>
      <li><strong>CRM:</strong> بيانات العملاء من Salesforce أو HubSpot</li>
      <li><strong>ERP:</strong> بيانات المالية والمخزون من SAP أو Oracle</li>
      <li><strong>قواعد البيانات:</strong> PostgreSQL، MySQL، SQL Server</li>
      <li><strong>ملفات:</strong> SharePoint، Google Drive، OneDrive</li>
    </ul>
    <p>المهم: الموصلات <strong>للقراءة فقط</strong> وتحت ضوابط صارمة. ما تسمح بالكتابة أو التعديل.</p>
  </section>
  <section class="card">
    <h2 id="section-2">ليش هالشي مهم للشركات السعودية؟</h2>
    <p>لأن <strong>AI بدون بيانات = عديم الفائدة</strong>. لكن الوصول للبيانات لازم يكون:</p>
    <ul>
      <li><strong>آمن:</strong> ما يسرب بيانات حساسة</li>
      <li><strong>منظم:</strong> كل موصل له صلاحيات واضحة</li>
      <li><strong>موثق:</strong> كل عملية قراءة مسجلة في Audit Trail</li>
      <li><strong>قابل للمراجعة:</strong> تقدر تشوف مين وصل لوش</li>
    </ul>
  </section>
  <section class="card">
    <h2 id="section-3">كيف تربط موصل؟</h2>
    <ol>
      <li><strong>اختر نوع الموصل:</strong> CRM، ERP، Database، Files</li>
      <li><strong>أدخل بيانات الاتصال:</strong> URL، Username، Password (مشفرة)</li>
      <li><strong>حدد الصلاحيات:</strong> أي جداول أو ملفات يقدر يوصل لها</li>
      <li><strong>اختبر الاتصال:</strong> تأكد إن الموصل يشتغل</li>
      <li><strong>فعّل الموصل:</strong> بعد الموافقة من مسؤول الأمن</li>
    </ol>
  </section>
  <section class="card">
    <h2 id="section-4">وش اللي يميز Kernel Connectors؟</h2>
    <table class="docs-table">
      <thead><tr><th>الميزة</th><th>الفائدة</th><th>الخطر لو ما استخدمته</th></tr></thead>
      <tbody>
        <tr><td data-label="الميزة"><strong>قراءة فقط</strong></td><td data-label="الفائدة">ما يقدر يعدل أو يحذف بيانات</td><td data-label="الخطر لو ما استخدمته">AI يعدل بيانات الإنتاج بالغلط</td></tr>
        <tr><td data-label="الميزة"><strong>صلاحيات محددة</strong></td><td data-label="الفائدة">كل موصل يوصل لبيانات معينة فقط</td><td data-label="الخطر لو ما استخدمته">وصول غير محدود للبيانات</td></tr>
        <tr><td data-label="الميزة"><strong>تشفير كامل</strong></td><td data-label="الفائدة">بيانات الاتصال مشفرة</td><td data-label="الخطر لو ما استخدمته">تسريب بيانات الاتصال</td></tr>
        <tr><td data-label="الميزة"><strong>توثيق تلقائي</strong></td><td data-label="الفائدة">كل عملية قراءة موثقة</td><td data-label="الخطر لو ما استخدمته">ما تعرف مين وصل لوش</td></tr>
      </tbody>
    </table>
  </section>
  <section class="card">
    <h2 id="section-5">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>ابدأ بموصل واحد بسيط (مثلاً: قاعدة بيانات للقراءة فقط)، واختبره لمدة أسبوع. لو اشتغل زين، أضف موصلات ثانية.</p>
      <p><strong>مهم:</strong> لا تربط موصلات بقواعد بيانات الإنتاج مباشرة. استخدم نسخة للقراءة (Read Replica) أو Data Warehouse.</p>
    </div>
  </section>
  <section class="card">
    <h2 id="section-6">أخطاء شائعة - انتبه لها</h2>
    <div class="warning-box">
      <h3 id="section-6-1">❌ الخطأ الأول: إعطاء صلاحيات واسعة</h3>
      <p>لو الموصل يقدر يوصل لكل الجداول، يصير خطر أمني.</p>
      <p><strong>الحل:</strong> حدد الجداول والأعمدة المسموح بها فقط.</p>
    </div>
    <div class="warning-box">
      <h3 id="section-6-2">❌ الخطأ الثاني: عدم اختبار الموصل</h3>
      <p>لو الموصل ما يشتغل، بيفشل الطلبات وقت الاستخدام الفعلي.</p>
      <p><strong>الحل:</strong> اختبر الموصل في بيئة تجريبية أولاً.</p>
    </div>
  </section>
