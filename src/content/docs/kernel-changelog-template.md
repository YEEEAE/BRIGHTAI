---
title: "Kernel Changelog Template: قالب تغييرات BrightAI Kernel"
metaTitle: "Kernel Changelog Template: قالب تغييرات BrightAI Kernel"
description: "قالب موحد لتوثيق تغييرات BrightAI Kernel: كيفية تسجيل التحديثات، الإصدارات، والتغييرات التقنية."
canonical: "https://brightai.live/docs/kernel-changelog-template/"
updated: "2026-06-10"
category: "Kernel"
tldr: "قالب موحد لتوثيق تغييرات BrightAI Kernel: كيفية تسجيل التحديثات، الإصدارات، والتغييرات التقنية."
related: ["kernel-operations-runbook","kernel-testing-checklist"]
---
<section class="hero">
    <span class="pill">BrightAI Kernel</span>
    
    <p style="color: #9fb0c7; font-size: 1.1rem;">قالب موحد لتوثيق كل تغيير يحدث في BrightAI Kernel</p>
  </section>

  <section class="card">
    <h2 id="section-1">الفكرة ببساطة</h2>
    <p>كل ما يتغير شي في Kernel — سياسة جديدة، ميزة إضافية، إصلاح خطأ — لازم يتسجل. هذا عشان:</p>
    <ul>
      <li>تعرف وش تغير ومتى</li>
      <li>تقدر ترجع لنسخة سابقة إذا صارت مشكلة</li>
      <li>تقدم سجل التغييرات للجهات التنظيمية</li>
      <li>فريقك يفهم التطورات بدون ما يسأل</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-2">قالب التسجيل الموحد</h2>
    <p>استخدم هذا الهيكل لكل تغيير:</p>
    <table class="docs-table">
      <thead>
        <tr>
          <th>الحقل</th>
          <th>الوصف</th>
          <th>مثال</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="الحقل"><strong>التاريخ</strong></td>
          <td data-label="الوصف">تاريخ التغيير</td>
          <td data-label="المثال">2026-06-10</td>
        </tr>
        <tr>
          <td data-label="الحقل"><strong>الإصدار</strong></td>
          <td data-label="الوصف">رقم الإصدار (SemVer)</td>
          <td data-label="المثال">v2.4.1</td>
        </tr>
        <tr>
          <td data-label="الحقل"><strong>النوع</strong></td>
          <td data-label="الوصف">Added / Changed / Fixed / Removed</td>
          <td data-label="المثال">Added</td>
        </tr>
        <tr>
          <td data-label="الحقل"><strong>الوصف</strong></td>
          <td data-label="الوصف">شرح مختصر للتغيير</td>
          <td data-label="المثال">إضافة سياسة حماية جديدة لبيانات المرضى</td>
        </tr>
        <tr>
          <td data-label="الحقل"><strong>المؤثر</strong></td>
          <td data-label="الوصف">أي مكونات تأثرت</td>
          <td data-label="المثال">Kernel Policies, AI Firewall</td>
        </tr>
        <tr>
          <td data-label="الحقل"><strong>المراجع</strong></td>
          <td data-label="الوصف">رقم التذكرة أو الطلب</td>
          <td data-label="المثال">TICKET-2026-042</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2 id="section-3">أنواع التغييرات</h2>
    <ul>
      <li><strong>Added (إضافة):</strong> ميزة أو سياسة جديدة</li>
      <li><strong>Changed (تعديل):</strong> تغيير في سلوك موجود</li>
      <li><strong>Fixed (إصلاح):</strong> إصلاح خطأ أو ثغرة</li>
      <li><strong>Removed (حذف):</strong> إزالة ميزة أو سياسة</li>
      <li><strong>Security (أمان):</strong> إجراء أمني عاجل</li>
    </ul>
  </section>

  <section class="card">
    <h2 id="section-4">نصيحة يزيد</h2>
    <div class="tip-box">
      <p><strong>من تجربتي مع الشركات السعودية:</strong></p>
      <p>سجل <strong>كل تغيير حتى لو بسيط</strong>. لما يجيك مدقق ويسأل "متى غيرتم هالسياسة؟"، تقدر تفتح الـ Changelog وتبيّن بالضبط متى وليش.</p>
    </div>
  </section>
