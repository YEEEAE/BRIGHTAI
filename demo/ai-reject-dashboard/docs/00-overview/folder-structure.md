# Folder Structure

## المجلدات الرئيسية
- `backend/config`: إعدادات البيئة والحماية وقاعدة البيانات.
- `backend/routes`: API endpoints.
- `backend/services`: منطق البيانات، Excel، AI، التقارير، الإشعارات، والصلاحيات.
- `backend/watchers`: مراقبة ملف Excel.
- `frontend/pages`: صفحات الواجهة.
- `frontend/assets/js`: منطق الواجهة والاتصال بالـ API وSocket.io.
- `frontend/assets/css`: تصميم الواجهة.
- `docs`: Documentation Hub الحالي.
- `data/.cache`: cache محلي لقراءة Excel.

## ملاحظة
أي ملف جديد يخص التوثيق يوضع داخل `docs/`، وأي تغيير في مسارات داخلية يحتاج مراجعة روابط.

## Related Docs
- [Project Overview](./project-overview.md)
- [API Overview](../04-api/api-overview.md)
- [Troubleshooting](../07-deployment/troubleshooting.md)

