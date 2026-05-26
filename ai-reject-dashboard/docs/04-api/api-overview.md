# API Overview

## الهدف
كل API تحت `/api` ويخضع غالباً للمصادقة والـ rate limit. الاستثناء المهم هو `GET /api/health` وبعض endpoints الدخول واستعادة كلمة المرور.

## المجموعات
- Auth API
- Data API
- Rejects API
- Reports API
- AI API
- Health API
- Admin/Notifications موجودة في الكود وتوثق ضمن Auth/Security أو تحتاج ملف مستقل لاحقاً إذا توسع النطاق.

## ملاحظة أمنية
GEMINI_API_KEY لا يمر عبر أي response.

## Related Docs
- [Auth API](./auth-api.md)
- [Data API](./data-api.md)
- [AI API](./ai-api.md)
- [Environment Secrets](../05-security/environment-secrets.md)

