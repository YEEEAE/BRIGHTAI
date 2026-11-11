# أزرار قسم «جرب المنتج اللي تحتاجه» — 2026-11-11

توضيح المستخدم بالصورتين: أزرار أسماء المنتجات يجب أن تفتح بوابة Kernel مع المنتج المختار، مثل صفحة الصورة، بدل التمرير داخل الكتالوج.

- `ProductCatalog.astro`: الروابط الخمسة تستخدم `productEntryPath(slug)`، وهو المصدر نفسه المستخدم في زر «الدخول» بكل بطاقة.
- `product-showcase.ts`: إزالة مراقب scroll الذي كان يضع aria-current على روابط anchor السابقة؛ حركة الكشف وتفاعل المؤشر محفوظان.
- `verify-product-journey.mjs`: إضافة فحص href لكل زر اسم ومطابقته لزر الدخول، والنقر والعودة وحفظ returnTo. syntax PASS؛ لم تُعد تشغيل الحزمة الكاملة في هذه الجولة، واستُخدم Browser MCP للتحقق المستهدف الفعلي.
- روابط «استكشف المنتج» للتفاصيل و«طلب تقييم» للتواصل محفوظة بأغراضها المستقلة. لا تغيير لصلاحيات أو استحقاقات أو عمليات المنتجات.

| زر الاسم / زر الدخول | صفحة الدخول | المنتج المحفوظ في returnTo | Browser MCP |
|---|---|---|---|
| Firewall | `/app/kernel/` | `/app/firewall/` | PASS |
| Risk Engine | `/app/kernel/` | `/app/risk-engine/` | PASS |
| Human Gate | `/app/kernel/` | `/app/human-gate/` | PASS |
| Ledger | `/app/kernel/` | `/app/ledger/` | PASS |
| Secure Chat | `/app/kernel/` | `/app/secure-chat/` | PASS |

HEAD `6f9785a6238374f873e88be13aa8ba322973bd55` + working tree، main. `npm run build`: PASS/56 صفحة. `node --test tests/product-navigation.test.mjs`: 3 PASS. Browser MCP: نقر الأسماء الخمسة وقراءة URL وdata-return-to؛ كلها فتحتKernel بمنتج مطابق، وزر الدخول يطابق رابط الاسم لكل منتج. `git diff --check`: PASS.

`verify-routes` أعاد56 صفحة/2945 مرجعًا/79 مسارًا/117 redirect/234 method-check/0 orphan/0 broken على خادم معزول ببوابة مغلقة (عقد الفحص). تشغيله أولًا على بوابة4416 المفتوحة توقف عندassertion يفترض رفض200 للمسارالخاص؛ لم يُخفَّض الاختبار، وأعيد ببيئته المطلوبة. بوابة المستخدم4416 بقيت مفتوحة. أمرinternal-links:audit غير موجود فيmanifest؛ استُخدمت أداة المشروع الفعلية.

```text
=== INTERNAL LINKS SCAN REPORT ===
Trigger: Route product-name buttons to the requested Kernel entry pages
Files Scanned: 56 public pages + target DOM
References Checked: 2945 + 10 target hrefs
Issues Found: 5
Issues Fixed: 5
Issues Requiring Manual Review: 0
--- FIXED ---
ProductCatalog.astro:16 → WRONG_PATH: five #catalog-<slug> selectors → /app/kernel/?returnTo=<allowlisted-product-path>
--- NEEDS MANUAL REVIEW ---
None
--- WARNINGS ---
The audit expects the private portal to be closed; browser click verification used the open local portal.
Navigation to the login page does not prove an authenticated product operation.
=== END REPORT ===
```

DONE LOCAL للروابط المطلوبة؛ لا نشر ولا تفعيل جديد للمنتجات. الأعمال السابقة والمتزامنة محفوظة.
