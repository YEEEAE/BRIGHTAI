# Node origin — 2026-11-16

الحالة: PARTIAL محليًا؛ قبول Node الحي BLOCKED. لا نشر ولا DNS ولا commit/push ولا تعديل أسرار أو قاعدة خارجية.

## الدليل الحالي

- HEAD المحلي وSHA آخر Render deploy: `fa3884d4217b77b411598a2095858d5938cbfff9`، مع تعديلات محلية غير ملتزمة هنا؛ تطابق SHA لا يعني أن الإصلاحات المحلية منشورة.
- Render MCP سمح بالقراءة في هذه الجولة: workspace `tea-d7m59qbeo5us73ekdu80`؛ الخدمة `srv-d7m5bcjbc2fs73826v20` نوعها `static_site`، publish=`dist/client`، build=`pnpm install && pnpm run build`؛ آخر deploy `dep-dbte0qe417fc738h1fsg` حالته `live`. قائمة workspace هذه لا تثبت غياب خدمة staging في workspace أخرى.
- HTTP بتاريخ `2026-11-16T11:01:32.921Z`: كل المساحات الست وhealthz وmembers API =404 HTML على `https://brightai.live` وعلى `https://brightai-4x39.onrender.com`. الرؤوس `public, max-age=0, s-maxage=300` وغياب noindex؛ `cf-cache-status=BYPASS` في هذه العينات، فلا نستنتج أنها cache HIT. الأدلة: `http.json`.
- اختلاف نوع الخدمة عن Blueprint سبب مثبت لغياب SSR على أصل Render؛ سلسلة DNS/domain attachment الكاملة لم تُراجع، فلا ندعي أن كل قواعد الحافة سليمة.

## المصدر والإصلاح

`astro.config.mjs`: server output وNode standalone؛ `npm start` → `scripts/server.mjs` → `dist/server/entry.mjs`. الخادم يعطل adapter autostart ويستمع على جميع الواجهات افتراضيًا، ويفرض تحويلات عامة محددة قبل ملفات public، ويرفض Host المشوه وbackslash. لا حاجة لتغيير هذه العقود أو إنشاء HTML تحت app.

`src/middleware.ts`: بوابة مغلقة بالإنتاج ما لم يضبط العلم صراحة، 503 HTML للصفحة و503 JSON للـAPI، مع no-store/noindex وVary. لا تحويل إلى index.html. صفحات المنتجات SSR هي أغلفة عرض لا تحوي بيانات خاصة؛ الجلسة تستعاد بعميل Neon، والـAPI يتحقق من Bearer/EdDSA وissuer والعمر والعضوية. لا يعتمد التطبيق على Astro.session؛ تحذير adapter عن filesystem session ليس مخزن هوية هذا التطبيق.

`src/scripts/workspace-context.ts` يستخدم `token()` الصحيح ويترجم غياب التوكن إلى رسالة الدخول. `src/shared/product-navigation.mjs` يقبل returnTo فقط إذا طابق أحد مسارات المنتجات الخمسة حرفيًا، ثم لا ينقل إلى المؤسسة قبل قرار الخادم؛ لا توسيع للقائمة.

الإصلاح: readiness يفحص JSON JWKS بمفتاح Ed25519 قابل للاستخدام في العقد الحالي بدل قبول أي HTTP200، ويقيد كاش الفحص بعنوان JWKS. اختلاف SHA صار يحجب readiness، ومقارنة SHA تشمل تصريح CI وتصريح Render معًا كي لا يخفي أحدهما الآخر.

## التحقق

- Node `v22.22.2`؛ `npm run build`: PASS، 57 صفحة عامة. تحذيرات request.headers عند prerender وRollup annotations؛ لم تفشل البناء.
- `node --test tests/node-readiness.test.mjs tests/product-navigation.test.mjs tests/kernel.test.mjs`: 11 PASS. اختبار readiness يعزل DB وfetch؛ ليس دليل اتصال حي.
- `node scripts/verify-node-runtime.mjs`: 19 PASS/1 SKIP/0 FAIL؛ الأصل المحلي في الاختبار `127.0.0.1:4398` للمساحات الست؛ GET/HEAD=200 مع ترويسات خاصة؛ API بلا جلسة401 JSON؛ إعدادAuth غائب معBearer503 JSON؛ بوابة مغلقة503؛ DB مفقودة/غير متاحة503؛ غياب تسريب وتطبيع المسارات PASS.
- readiness200 مع DB فعلية: NOT RUN، لم توفر قاعدة disposable؛ لا تخفيف للفحص. Auth الفعلي وتسجيل الدخول وعضوية/بيانات عميل: NOT RUN.
- المتصفح: BLOCKED؛ Playwright profile مشغول، وChrome DevTools رُفض بسياسة الموافقات. لم نغلق جلسة متصفح مستخدمة. لا قبول Browser/E2E.
- `routes.json`: 46 مصدرًا تحت app كلها `prerender=false`، بما فيها صفحة operator الإضافية؛ المساحات الست المقصودة Kernel والخمسة منتجات، وليست operator.

خطوات المشغّل ومعايير الإغلاق: `docs/NODE-ORIGIN-OPERATOR-2026-11-16.md`.
