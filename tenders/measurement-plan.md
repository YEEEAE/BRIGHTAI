# Measurement Plan — ContractAI Landing, Authentication & Shared AI Gateway Connectivity
**Deploy Date:** 2026-03-09

## KPI Target
- KPI: معدل التحويل من الزائر إلى مستخدم مسجل، ومعدل الدخول الناجح إلى لوحة التحكم، ونسبة جاهزية الاتصال بطبقة الذكاء الاصطناعي
- Baseline: غير متوفر في النسخة الثابتة الحالية
- Goal: رفع معدل فتح modal المصادقة إلى 25% من زوار صفحة الهبوط، ورفع معدل إتمام التسجيل أو الدخول الناجح إلى 18%، والوصول إلى 99% نجاح في فحص `health` بعد إعادة نشر الـ backend المشترك مع دعم `NVIDIA` و`DeepSeek`

## Tracking Event
- Event Name: `auth_primary_action`, `ai_connectivity_check`, `ai_provider_fallback`
- Trigger: عند فتح modal المصادقة، أو التبديل بين tabs، أو نجاح تسجيل الدخول/إنشاء الحساب، أو طلب استعادة كلمة المرور، أو نجاح/فشل `checkAPIHealth`، أو انتقال النظام من `nvidia` إلى `deepseek` عبر `/api/ai/chat/completions`
- Payload: `auth_tab`, `action_type`, `email_domain`, `remember_me`, `theme_mode`, `viewport_width`, `locale`, `provider`, `connection_status`, `fallback_used`, `error_code`, `timestamp`

## Success Criteria
- Minimum Improvement: 15%
- Evaluation Window: 14 days
- Rollback Trigger: انخفاض التحويل من صفحة الهبوط، أو كثرة أخطاء التحقق، أو ظهور مشاكل عرض/RTL في الهبوط أو الـ modal على الجوال، أو تجاوز أخطاء الاتصال 5% بعد ربط Proxy الفعلي
