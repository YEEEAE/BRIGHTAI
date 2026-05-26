# Architecture Overview

## الفكرة العامة
التدفق الحالي: Excel -> Backend Services -> Express API -> Frontend Pages -> صقر AI panel. Gemini يتم استدعاؤه من Backend فقط عند توفر GEMINI_API_KEY.

## المكونات
- Frontend: صفحات HTML وملفات JS داخل `frontend/`.
- Backend: Express routes/services داخل `backend/`.
- Data: Excel reader وcache داخل `backend/services/excelService.js`.
- Realtime: Socket.io و`excelWatcher.js` لإشعارات تحديث Excel.
- AI: `aiService.js` و`conversationMemoryService.js`.
- Auth/RBAC: SQLite + JWT cookies + roles/permissions.

## قيود مهمة
- GEMINI_API_KEY لا يدخل Frontend أبداً.
- لا يتم إرسال كامل Excel إلى Gemini إلا عند ضرورة موثقة.
- مخرجات صقر AI استشارية وليست اعتماد جودة.

## Related Docs
- [Folder Structure](./folder-structure.md)
- [Data Processing](../02-data/data-processing.md)
- [Gemini Integration](../03-ai/gemini-integration.md)
- [Security Overview](../05-security/security-overview.md)

