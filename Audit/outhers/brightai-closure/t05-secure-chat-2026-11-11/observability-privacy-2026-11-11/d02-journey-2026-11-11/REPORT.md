# D02 — رحلة الدخول إلى المنتجات الخمسة (تنفيذ محلي)

2026-11-11 · HEAD `0baadba434057b960901722416666384083f7485` · tree `9dde3a1655509f20e4e62467642fdac6edaa3b14` + working tree.
خط الأساس المعلن `6a3d53f41b5bd1af59eb320245745498765bd320`؛ الانحراف مفحوص قبل التنفيذ.

## 1. الانحراف

- `6a3d53f..0baadba`: 10 commits. ملفات الرحلة (`product-navigation.mjs`، `ProductJourney.astro`، `app/kernel/index.astro`، `auth/sign-up.astro`، `ProductCatalog.astro`، `tests/product-navigation.test.mjs`) بلا تغيير؛ التغيير الوحيد في `src/scripts/kernel.ts` هو شروط عرض منحة الاستكشاف 48h (T03).
- لا تغيير في allowlist أو `returnTo` أو حراس الخادم. لم يُعد بناء ربط P12.

## 2. ما تغير ولماذا

| ملف | التغيير | السبب |
|---|---|---|
| `src/scripts/workspace-context.ts` | `getJWTToken` في وكيل Auth يعيد `null` عند فشل المزود بدل الرمي | العقد المعلن `() => Promise<string \| null>`. بلا جلسة يعيد endpoint المزود `get-jwt-token` 404، فكان الرمي يعرض «HTTP 404» للمستخدم في مساحة منتج غير مخوّلة. كل المستهلكين (kernel، firewall، ledger، human-gate، risk-engine، secure-chat، operator-trials) يعالجون `!token` برسالة دخول أصلًا. لم يتغير مسار المصادقة أو الصلاحيات. |
| `src/components/ProductJourney.astro` | نص توضيحي + تسمية CTA التواصل | فصل التعليم عن التشغيل: الدخول عملية خادمية، والمخططات تعليمية، والاستفسار رسالة تواصل لا تفعّل تجربة ولا تمنح ترخيصًا. |
| `src/shared/product-navigation.mjs` | موضوع رابط التواصل `استفسار عن تقييم` | اتساق موضوع رسالة التواصل مع تسمية الزر؛ المسار `/contact/` والسماح بلا تغيير. |
| `src/pages/app/kernel/index.astro` | رابط «استفسار عن تقييم» في شارة المنتج المختار | نفس الاتساق في مسار الدخول. |
| `src/scripts/kernel.ts` | رسالة رفض الإتاحة: «تواصل للاستفسار عن تقييم» | مسار الرفض لا يوحي بتفعيل تجربة. |

لم تُمس Hero أو الهيدر أو الشعار أو Constellation أو نصوصها أو أزرارها أو روابطها، ولا CSS مشتركة، ولا `.env*` أو workflows.

## 3. التحقق (محلي فقط)

البيئة: Node `v22.22.2`، build إنتاجي محلي، `scripts/server.mjs` على `127.0.0.1`، `AIGAS_APP_ENABLED=true`، Chrome headless عبر CDP، بلا جلسة Neon Auth وبلا tenant.

| الفحص | النتيجة |
|---|---|
| `npm run build` (57 صفحة، `version.json` = `0baadba43405`) | PASS |
| `node --test tests/product-navigation.test.mjs` (3) | PASS 3/3 — allowlist و`returnTo` الخارجي/المشفّر كما هي |
| رحلة HTTP: `/app/{firewall,ledger,human-gate,risk-engine,secure-chat}/?workspace=<uuid>` | PASS 200×5 |
| `/app/kernel/?returnTo=<workspace>` لكل منتج | PASS — `data-return-to` مطابق ×5 |
| `returnTo` خارجي أو مشفّر (`https://evil.test/…`، `%2Fapp%2F%2566irewall%2F`) | PASS — لا `data-return-to`، الأصل محفوظ |
| `returnTo` بعد إعادة التحميل | PASS |
| المساحات الخمس بلا جلسة: بيانات خاصة مخفية | PASS ×5 |
| رفض غير المخوّل: رسالة دخول لا حالة upstream | PASS ×5 + kernel (`HTTP 404` أُزيل) |
| `/products/` عند 390 و1440 بلا تجاوز أفقي؛ 5 بطاقات؛ روابط الدخول والتواصل | PASS |
| نص «التعليم مقابل التشغيل» على `/products/firewall/` | PASS |

السجل الخام: `journey-results.json` (30/30 PASS)، ولقطتان: `catalog-1440.png`، `product-detail-390.png`.

## 4. حدود الأدلة

- **لم تُشغّل** رحلة موثّقة بجلسة Neon Auth حقيقية + tenant + منحة: لا جلسة ولا عضويات في البيئة المحلية. انتقال ما بعد الدخول (`authorizedProductDestination` → `/app/<slug>/?workspace=…`) مُثبت باختبارات الوحدة وبمسار HTTP، لا بجلسة حقيقية.
- **لم يُفحص** المنشور: نشر Render الحالي Static من `dist/client`، و`/app/*` و`/app/api/*` تعيد 404. لا تغيير في هذا النطاق.
- اختبار «جلسة منتهية» بجلسة موقّعة غير منفّذ: مسار المصادقة لم يتغير؛ الذي تغيّر هو تحويل فشل رمز المزود إلى «بلا اعتماد».
- لا اختبار انحدار آلي جديد لسلوك الرمز: `workspace-context` يحتاج DOM والعميل الحقيقي للمزود؛ لا jsdom في الاعتماديات، والتحقق البصري/الشبكي يغطي السلوك.

## 5. الحالة والقرارات

- التنفيذ: **PARTIAL — LOCAL VERIFIED**. المصدر مغلق محليًا؛ الرحلة الحية تبقى محجوبة بالنشر (T01) وبجلسة/منحة T03.
- المانع وصاحبه: نشر Node SSR وتفعيل الحساب والمنح — T01/T03 (DevOps / Identity & Operations).
- Internal: NOT READY على الأصل المنشور. Public Beta: NO-GO. Commercial: NO-GO. `PASS ≠ RELEASED`.
