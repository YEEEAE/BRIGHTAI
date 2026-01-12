# Implementation Plan: Site-Wide Gradient & Navigation

## Overview

تنفيذ التدرج اللوني الموحد وشريط التنقل الموحد مع Hamburger Menu على جميع صفحات الموقع.

## Tasks

- [x] 1. إنشاء ملفات CSS و JavaScript للتنقل الموحد
  - [x] 1.1 إنشاء ملف css/unified-nav.css
    - أنماط التنقل للـ Desktop
    - أنماط القوائم المنسدلة
    - أنماط Hamburger Menu للهواتف
    - Media queries للتجاوب
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  - [x] 1.2 إنشاء ملف js/unified-nav.js
    - وظيفة Hamburger Menu toggle
    - وظيفة القوائم المنسدلة
    - إغلاق القائمة عند النقر خارجها
    - _Requirements: 6.2, 6.7_

- [x] 2. تحديث الصفحة الرئيسية (index.html)
  - [x] 2.1 تحديث التنقل في index.html
    - إضافة هيكل التنقل الموحد
    - إضافة القوائم المنسدلة
    - ربط ملفات CSS و JS الجديدة
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. تحديث صفحات الخدمات الرئيسية
  - [x] 3.1 تحديث smart-automation.html
    - إزالة الألوان القديمة (التركوازي والأزرق الداكن)
    - تطبيق التنقل الموحد
    - تحديث قسم related-services
    - _Requirements: 1.1, 1.3, 2.5, 4.3, 4.4_
  - [x] 3.2 تحديث our-products.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 3.3 تحديث data-analysis.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 3.4 تحديث consultation.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 3.5 تحديث health-bright.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_

- [x] 4. تحديث صفحات المحتوى
  - [x] 4.1 تحديث blog.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 4.2 تحديث ai-agent.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 4.3 تحديث ai-bots.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 4.4 تحديث Docs.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 4.5 تحديث tools.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_

- [x] 5. تحديث صفحات إضافية
  - [x] 5.1 تحديث contact.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 5.2 تحديث about-us.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 5.3 تحديث brightrecruiter.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 5.4 تحديث brightsales-pro.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_
  - [x] 5.5 تحديث brightproject-pro.html
    - تطبيق التنقل الموحد
    - _Requirements: 2.5_

- [x] 6. تحديث ملفات CSS لإزالة الألوان القديمة
  - [x] 6.1 تحديث smart-automation.css
    - إزالة #64FFDA و #0A192F و #112240
    - استبدالها بألوان التدرج الموحد
    - _Requirements: 4.1, 4.2_

- [x] 7. Checkpoint - التحقق من التطبيق
  - التأكد من تطبيق التنقل على جميع الصفحات
  - التأكد من عمل Hamburger Menu
  - التأكد من عمل القوائم المنسدلة
  - التأكد من صحة الروابط

## Notes

- التدرج الموحد: `linear-gradient(135deg, #EC4899, #8B5CF6, #6366F1)`
- الألوان المطلوب إزالتها: #64FFDA, #0A192F, #112240, #1D3A5F
- Hamburger Menu يظهر على شاشات أقل من 992px
- القوائم المنسدلة تفتح بـ hover على Desktop وبـ click على Mobile

