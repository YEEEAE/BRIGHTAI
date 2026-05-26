# Auth API

## Purpose
توثيق endpoints الخاصة بـ Auth API حتى فريق التقنية والاختبار يعرف وش المطلوب وكيف يتحقق منه.

## Base path
`/api/auth`

## Authentication required or not
بعض endpoints بدون تسجيل دخول مثل login/forgot/reset، والباقي requireAuth.

## Permissions required
حسب endpoint؛ profile للمستخدم، admin users يحتاج manage:users في Admin API.

## Request example
```http
POST /api/auth/login
Content-Type: application/json

{"email":"user@mais.local","password":"********"}
```

## Response example
```json
{"success":true,"message":"تم تسجيل الدخول بنجاح.","user":{"id":"usr_...","role":"quality"}}
```

## Error responses
- 400 بيانات ناقصة أو كلمة مرور غير صحيحة.
- 401 session غير صالح.
- 500 فشل داخلي.

## Related frontend pages
- [Profile Page](../01-pages/profile-page.md)
- [Admin Users Page](../01-pages/admin-users-page.md)

## Related backend files
- backend/routes/auth.js
- backend/middleware/auth.js
- backend/services/authService.js

## Related docs links
- [Security Overview](../05-security/security-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)

