# Measurement Plan — ContractAI Landing & Authentication Flow
**Deploy Date:** 2026-03-09

## KPI Target
- KPI: معدل التحويل من الزائر إلى مستخدم مسجل، ومعدل الدخول الناجح إلى لوحة التحكم
- Baseline: غير متوفر في النسخة الثابتة الحالية
- Goal: رفع معدل فتح modal المصادقة إلى 25% من زوار صفحة الهبوط، ورفع معدل إتمام التسجيل أو الدخول الناجح إلى 18%

## Tracking Event
- Event Name: `auth_primary_action`
- Trigger: عند فتح modal المصادقة، أو التبديل بين tabs، أو نجاح تسجيل الدخول/إنشاء الحساب، أو طلب استعادة كلمة المرور
- Payload: `auth_tab`, `action_type`, `email_domain`, `remember_me`, `theme_mode`, `viewport_width`, `locale`, `timestamp`

## Success Criteria
- Minimum Improvement: 15%
- Evaluation Window: 14 days
- Rollback Trigger: انخفاض التحويل من صفحة الهبوط، أو كثرة أخطاء التحقق، أو ظهور مشاكل عرض/RTL في الهبوط أو الـ modal على الجوال
