# ai-reject-dashboard

لوحة داخلية لتحليل بيانات المرفوضات والمخزون والعمر الافتراضي لشركة ميس، مع Backend يقرأ Excel، وواجهات Dashboard، ومساعد استشاري باسم "صقر AI" عبر Gemini عند توفره.

## حالة المشروع الحالية
Status: Pilot-ready جزئياً. المشروع مناسب للتجربة الداخلية والـ UAT، لكنه ليس Production-ready قبل مراجعة الأمن، الصلاحيات، واختبار الملف الحقيقي واعتماد QCM/QAM حسب الإجراء الداخلي.

## مصدر البيانات الأساسي
`/BRIGHTAI/reports/internal-links/ALL_ITEMS_MAIS_with_life_years.xlsx`

القراءة تكون من Backend فقط.

## وكيل الذكاء الاصطناعي
اسم الوكيل ثابت دائماً: "صقر AI". لا يترجم ولا يتغير. مخرجاته استشارية فقط وليست قرار جودة نهائي.

## Documentation Hub
- [docs/README.md](./docs/README.md)
- [Project Overview](./docs/00-overview/project-overview.md)
- [Pages Documentation](./docs/01-pages/)
- [Excel Data Source](./docs/02-data/excel-data-source.md)
- [صقر AI Overview](./docs/03-ai/saqr-ai-overview.md)
- [API Overview](./docs/04-api/api-overview.md)
- [UAT Checklist](./docs/06-testing/uat-checklist.md)
- [Local Setup](./docs/07-deployment/local-setup.md)

## أوامر التشغيل
```bash
cp .env.example .env
npm install
npm start
```

افتح:

```text
http://localhost:3000/pages/index.html
```

## متطلبات البيئة
- Node.js >= 18
- npm
- ملف `.env` مضبوط
- ملف Excel موجود في المسار المحدد أو مسار بديل عبر `EXCEL_FILE_PATH`
- `GEMINI_API_KEY` في Backend فقط إذا مطلوب تشغيل Gemini

## ملاحظات قبل التشغيل
- تأكد من `JWT_SECRET` و`SESSION_SECRET` وعدم استخدام قيم development في الإنتاج.
- تأكد من `ALLOWED_ORIGINS`.
- اختبر `GET /api/health` بعد التشغيل.
- اختبر `/api/data/live-status` للتأكد من Excel.

## تحذير مهم
`GEMINI_API_KEY` لا يجب أن يكون في Frontend نهائياً، ولا داخل HTML/CSS/JS. المفتاح مكانه Backend environment فقط.

