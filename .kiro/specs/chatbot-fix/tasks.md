# Implementation Plan: Chatbot Fix & Mobile Optimization Audit

## Overview

هذه الخطة تهدف إلى تدقيق وإصلاح الشات بوت العائم في الصفحة الرئيسية، مع التركيز على:
- التحقق من ربط Gemini API
- تحسين واجهة الهاتف المحمول
- التأكد من الأمان والأداء

## Tasks

- [x] 1. تدقيق تكوين Gemini API
  - [x] 1.1 التحقق من ملف .env ومتغير GEMINI_API_KEY
    - فحص وجود المتغير الصحيح في ملف .env
    - التأكد من عدم استخدام اسم متغير خاطئ
    - _Requirements: 1.1, 6.1, 6.3_

  - [x] 1.2 التحقق من تحميل التكوين في السيرفر
    - فحص server/config/index.js
    - التأكد من قراءة المتغير بشكل صحيح
    - _Requirements: 6.1, 6.2_

  - [x] 1.3 اختبار الاتصال بـ Gemini API
    - تشغيل السيرفر محلياً
    - إرسال رسالة اختبار
    - التحقق من الرد
    - _Requirements: 1.2, 1.4_

- [ ] 2. تدقيق الأمان
  - [ ] 2.1 فحص chatbot.js للتأكد من عدم وجود مفاتيح مشفرة
    - البحث عن أي API keys في الكود
    - التأكد من استخدام endpoint السيرفر فقط
    - _Requirements: 6.5_

  - [ ] 2.2 فحص استجابات السيرفر
    - التأكد من عدم تسريب API key في الردود
    - فحص headers و body
    - _Requirements: 1.5, 6.6_

  - [ ]* 2.3 كتابة اختبار خاصية للتحقق من عدم تسريب المفاتيح
    - **Property 5: API Key Security**
    - **Validates: Requirements 1.5, 6.5, 6.6**

- [ ] 3. إصلاح CSS للهواتف المحمولة
  - [ ] 3.1 إضافة breakpoint لشاشات 390px
    - تعديل chatbot.css
    - ضبط عرض النافذة والهوامش
    - _Requirements: 8.2_

  - [ ] 3.2 إضافة breakpoint لشاشات 430px
    - تعديل chatbot.css
    - ضبط الأبعاد المناسبة
    - _Requirements: 8.3_

  - [ ] 3.3 إصلاح حجم خط الإدخال لمنع تكبير iOS
    - تعيين font-size: 16px للـ input
    - _Requirements: 4.5_

  - [ ] 3.4 التأكد من حجم مناطق اللمس (44px minimum)
    - فحص وتعديل أحجام الأزرار
    - _Requirements: 2.2, 3.3_

- [ ] 4. Checkpoint - اختبار التغييرات
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. إصلاح شريط التنقل للهواتف
  - [ ] 5.1 التحقق من عمل قائمة الهامبرغر
    - فحص unified-nav.css و unified-nav.js
    - التأكد من فتح/إغلاق القائمة بسلاسة
    - _Requirements: 3.1, 3.2_

  - [ ] 5.2 التأكد من حجم مناطق اللمس في القائمة
    - فحص أحجام الروابط والأزرار
    - _Requirements: 3.3_

  - [ ] 5.3 إصلاح تمرير القوائم المنسدلة
    - التأكد من إمكانية التمرير عند تجاوز المحتوى
    - _Requirements: 3.4_

- [ ] 6. تحسين معالجة الأخطاء
  - [ ] 6.1 التحقق من رسائل الخطأ العربية
    - فحص جميع رسائل الخطأ في chat.js
    - التأكد من وجود رسائل واضحة بالعربية
    - _Requirements: 1.3, 5.2_

  - [ ] 6.2 إضافة زر إعادة المحاولة
    - التأكد من وجود زر retry في حالة الخطأ
    - _Requirements: 5.1, 5.3_

  - [ ]* 6.3 كتابة اختبار خاصية لرسائل الخطأ العربية
    - **Property 2: Arabic Error Messages**
    - **Validates: Requirements 1.3, 5.2, 5.4**

- [ ] 7. تحسين الأداء
  - [ ] 7.1 التحقق من تحميل الـ scripts بـ defer
    - فحص index.html
    - التأكد من وجود defer attribute
    - _Requirements: 7.1_

  - [ ] 7.2 التحقق من التحميل الكسول للشات بوت
    - فحص initChatbotLazy في chatbot.js
    - التأكد من التأخير 3 ثواني أو تفاعل المستخدم
    - _Requirements: 7.2_

  - [ ] 7.3 التحقق من دعم prefers-reduced-motion
    - فحص CSS للـ animations
    - _Requirements: 7.5_

- [ ] 8. Checkpoint - اختبار شامل
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. اختبارات التكامل
  - [ ]* 9.1 كتابة اختبار خاصية لتحميل التكوين
    - **Property 1: API Key Configuration Loading**
    - **Validates: Requirements 1.1, 6.1, 6.3**

  - [ ]* 9.2 كتابة اختبار خاصية لرفض الرسائل الفارغة
    - **Property 3: Empty Message Rejection**
    - **Validates: Requirements 4.4**

  - [ ]* 9.3 كتابة اختبار خاصية لحالة التحميل
    - **Property 4: Loading State Management**
    - **Validates: Requirements 4.3**

- [ ] 10. التحقق النهائي من Viewport
  - [ ] 10.1 اختبار على عرض 390px
    - التأكد من عدم وجود overflow أفقي
    - _Requirements: 8.2, 8.5_

  - [ ] 10.2 اختبار على عرض 430px
    - التأكد من عدم وجود overflow أفقي
    - _Requirements: 8.3, 8.5_

  - [ ] 10.3 اختبار على عرض 768px
    - التأكد من العرض الصحيح للتابلت
    - _Requirements: 8.4, 8.5_

- [ ] 11. Final Checkpoint - التحقق النهائي
  - Ensure all tests pass, ask the user if questions arise.
  - التأكد من عمل الشات بوت بشكل كامل
  - التأكد من تحسين الهاتف المحمول

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
