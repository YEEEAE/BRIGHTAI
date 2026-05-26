# Technical Page

## 1. Purpose
صفحة Technical تشرح مسار التكامل: Excel/Focus ERP إلى Backend ثم Gemini ثم Dashboard. الصفحة موجهة لفريق التقنية وفريق BrightAI لمراجعة التصميم والمخاطر.

Status: Implemented.

## 2. User Role
- Technical

## 3. Main UI Components
- KPI cards
- Tables
- Charts
- Filters
- AI panel
- Export actions
- Alerts
- Status badges

## 4. Data Source
محتوى ثابت موثق داخل HTML، مع إشارات إلى API endpoints.

## 5. Related API Endpoints
- GET /api/health
- GET /api/rejects
- GET /api/summary
- GET /api/ai-analysis
- POST /api/run-analysis
- GET /api/audit-log

## 6. صقر AI Role
"صقر AI" يساعد المستخدم يقرأ المؤشرات، يلخص المخاطر، ويقترح أسئلة أو نقاط مراجعة ضمن نطاق شركة ميس فقط. مخرجات "صقر AI" استشارية فقط، ولا تعتبر قرار جودة نهائي. قرارات الجودة النهائية ترجع إلى QCM/QAM حسب الإجراء الداخلي.

## 7. Allowed AI Questions
- وش أعلى البنود خطورة في هذه الصفحة؟
- عطنا ملخص للمخاطر المالية أو التشغيلية بناءً على البيانات الحالية.
- ما السجلات اللي تحتاج مراجعة من فريق الجودة؟
- اقترح CAPA مبدئي بناءً على السجل المحدد.

## 8. Refused AI Questions
- أسئلة خارج شركة ميس أو خارج العمل المكلف له المشروع.
- طلبات كشف API keys أو أسرار النظام.
- طلب قرار جودة نهائي أو اعتماد رسمي بدل QCM/QAM.

نص الرفض المطلوب: "يزيد معلمني بأن ما أخرج عن إطار شركة ميس والعمل المؤكل له"

## 9. States
- Loading: تعرض الصفحة مؤشرات تحميل إلى أن ترجع بيانات API.
- Empty: تعرض رسالة واضحة إذا ما فيه سجلات.
- Error: تعرض رسالة خطأ بدون كشف أسرار تقنية.
- Excel unavailable: يظهر fallback demo data أو warning حسب API.
- API unavailable: تعرض حالة فشل وتطلب إعادة المحاولة.
- AI unavailable: تستمر الصفحة بالبيانات، ويظهر أن صقر AI غير متاح مؤقتاً.
- Unauthorized: يتم توجيه المستخدم لتسجيل الدخول أو صفحة permission-denied.

## 10. Internal Links
Related Docs:
- [Excel Data Source](../02-data/excel-data-source.md)
- [Data API](../04-api/data-api.md)
- [صقر AI Overview](../03-ai/saqr-ai-overview.md)
- [UAT Checklist](../06-testing/uat-checklist.md)
- [Security Overview](../05-security/security-overview.md)

## 11. Improvement Notes
- توحيد رسائل الخطأ بين الصفحة وAI panel.
- إضافة حالة empty مرئية لكل جدول إن لم تكن موجودة بوضوح.
- مراجعة صلاحيات الوصول مع QCM/QAM قبل التشغيل الفعلي.

## 12. Acceptance Criteria
- [ ] الصفحة تفتح بعد تسجيل الدخول حسب الدور.
- [ ] البيانات تأتي من Backend فقط.
- [ ] لا يظهر GEMINI_API_KEY أو أي سر في Frontend.
- [ ] اسم "صقر AI" ثابت كما هو.
- [ ] الحالات Loading/Empty/Error موثقة ومختبرة.
- [ ] مخرجات صقر AI تظهر كاستشارة وليست اعتماد نهائي.

