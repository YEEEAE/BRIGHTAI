# حالة نشر BRIGHTAI — 2026-11-25

**BLOCKED للقص إلى Node.** جرى قياس الإنتاج عند نحو 15:04 بتوقيت الرياض، وتفعيل قاعدة تجاوز الكاش عند 15:05:52. الأدلة في [سجل curl الحي](curl-live.txt) و[دليل القص والتراجع](../../docs/EDGE-CUTOVER-RUNBOOK.md).

- Cloudflare DNS يوجّه apex وwww عبر Proxy إلى `brightai-4x39.onrender.com`. كلا المسارين العامين يرتبطان بـWorker `brightai-ga4-edge`. إعداد TLS في Cloudflare هو `full`. Render يؤكد أن الأصل هو Static Site يبني وينشر `dist/client`. خدمة Node غير موجودة في مساحة Render المتصلة.
- نشر Static Site الحي `dep-dc3ckdtg1s2s73ef5pdg` اكتمل 14:45:37 بتوقيت الرياض على `ae6e36255ef55d7596f9239fb1bfe8988a554e1c` المطابق لـHEAD المحلي وGitHub main. بصمة تشغيل Node من `/healthz/` غير متاحة.
- محليًا يربط Blueprint `npm start` بـ`scripts/server.mjs`. يطبّق الخادم ترويسات الأمان ويعالج 404 والتحويلات وprobes قبل Astro. صفحتا الوصول والحالة ديناميكيتان وتضبطان `no-store`. علم التطبيق في Blueprint قيمته `false`. التطبيق العام يعيد 404 على الأصل الثابت، وإثبات 503 على Runtime ينتظر خدمة Node.
- قبل التعديل لم يظهر entrypoint لمرحلة Cloudflare Cache Rules ولم تظهر Page Rules. أُضيفت قاعدة `cfde9c04ab3e46a090b9a8c8e6479677` وتمت إعادة قراءتها مفعلة بـ`cache:false`. القياس المتكرر بعدها أعاد 36 استجابة `404` تحمل `CF-Cache-Status: DYNAMIC` بلا `Age`. دليل الكاش يخص إعداد المنطقة والردود التي تم أخذ عينات منها على الأصل الثابت.
- القص يتوقف إلى أن يتوفر منشأ Node في مساحة Render الصحيحة بإعدادات قاعدة البيانات وNeon Auth المعتمدة واجتياز `/readyz/` مع بقاء البوابة مغلقة. توجيه DNS وارتباط Render والشهادات بقيت على الوضع المقاس.

| المسار على apex | GET | HEAD |
|---|---:|---:|
| `/` | 200 | 200 |
| `/healthz` و`/healthz/` | 404 | 404 |
| `/readyz` و`/readyz/` | 404 | 404 |
| `/request-access/` | 404 | 404 |
| `/status/` | 404 | 404 |
| `/api/measurement-status/` | 404 | 404 |
| `/app/` و`/auth/api/get-session` | 404 | 404 |
| `/404/` | 200 | 200 |
| `/cutover-missing-96b599/` | 404 | 404 |
| `/docs/topics/ai-governance/index.html` | 200 | 200 |

عينة apex خلت من CSP وHSTS وظهر فيها `X-Content-Type-Options: nosniff`. أعاد الأصل العام الحالات نفسها للمسارات المقاسة، وظهرت عليه HSTS في بعض الردود. أعاد www حالة 301 في المسارات الثلاثة المقاسة. السجل يتضمن أسطر الحالة وترويسات curl حرفيًا مع تنسيق نهايات الأسطر وموضع تنقيح Set-Cookie عند وجودها.
