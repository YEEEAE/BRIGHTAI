# AI Governance Phase 1 Audit

## 1. بنية المشروع الفعلية

- المشروع الحالي يعمل كسطح تسويقي Static HTML في الجذر مع ملفات HTML مباشرة مثل `index.html`, `services/index.html`, و`contact/index.html`.
- توجد واجهة API/Node فعالة داخل `frontend/` عبر `frontend/server.js` وملفات `frontend/routes/`, `frontend/services/`, و`frontend/kernel/`.
- لا يوجد مسار `backend/` فعلي ضمن بنية العمل الحالية التي تم فحصها؛ لا يتم التعامل مع المشروع كـ Next.js أو React app في هذا التنفيذ.
- `render.yaml` يحتوي خدمتين: خدمة Node داخل `frontend/` وخدمة static تنسخ سطح الموقع إلى `.render-static`.

## 2. ما سيتم تعديله في هذا التنفيذ

- تثبيت صفحات Solutions الخمسة الأساسية فقط:
  - `/solutions/ai-governance-platform/`
  - `/solutions/ai-firewall/`
  - `/solutions/ai-audit-trail/`
  - `/solutions/human-approval-layer/`
  - `/solutions/ai-evidence-file/`
- إنشاء خمسة ملفات Markdown داخل `docx/` فقط كموارد معرفية داخلية.
- إنشاء صفحات وثائق فعلية داخل `docs/` وربطها من مركز الوثائق، بناءً على توجيه لاحق بأن تكون الوثائق جزءًا فعليًا من الموقع.
- إضافة بلوك خفيف في `index.html` بعنوان "مركز حوكمة الذكاء الاصطناعي".
- تحسين `services/index.html` كبوابة للحلول الخمسة.
- تحسين خفيف في `contact/index.html` يضيف CTA وروابط حلول وmicrocopy خصوصية.
- تحديث `llms.txt` فقط؛ و`llms-full.txt` غير موجود حاليًا لذلك لن يتم إنشاؤه.
- إصلاح توليد sitemap بحيث يبقى `sitemap.xml` قائمة URLs ولا يتحول إلى sitemap index.
- إضافة `sitemap-solutions.xml` وتحديث `robots.txt` للإشارة إلى sitemaps الفعلية.

## 3. ما لن يتم تعديله في هذا التنفيذ

- لا إعادة تصميم للرئيسية ولا تغيير Hero الرئيسي.
- لا إنشاء Industries pages.
- لا إنشاء Assessment pages أو نموذج جاهزية.
- لا إنشاء أكثر من 5 ملفات docx.
- لا حذف dependencies.
- لا توحيد Tailwind configs أو تعديل tsconfig/ESLint.
- لا حذف `manifest.json` أو `manifest.webmanifest`.
- لا تعديل Service Worker.
- لا replace شامل لـ hreflang.
- لا حذف جماعي لـ meta keywords من المشروع.

## 4. المخاطر المتوقعة

- يوجد محتوى SEO قوي مسبقًا، وبعض الصفحات الحالية تحتوي عبارات امتثال قوية؛ سيتم تنظيف الصفحات المعدلة فقط بصياغات آمنة.
- توجد صفحات Solutions إضافية مسبقًا خارج نطاق هذا التنفيذ. لن يتم حذفها، وسيتم التعامل مع الخمسة المطلوبة فقط.
- `render.yaml` يشير إلى `npm run sitemap:all` بينما `package.json` يحتوي `sitemap:generate`. هذا خلل سابق خارج نطاق التنفيذ المباشر وسيتم توثيقه كتوصية لاحقة.
- توجد ملاحظة حول `en-SA` في صفحات قانونية/إنجليزية موجودة. لن يتم استبداله جماعيًا.
- `sitemap-images.xml` يحتوي إشارات image قد تحتاج Phase مخصص؛ لن يتم إصلاحه هنا إلا بالتوثيق.

## 5. الملفات المرشحة للتعديل

- `index.html`
- `services/index.html`
- `contact/index.html`
- `llms.txt`
- `robots.txt`
- `scripts/generate-sitemap-all-pages.mjs`
- `solutions/ai-governance-platform/index.html`
- `solutions/ai-firewall/index.html`
- `solutions/ai-audit-trail/index.html`
- `solutions/human-approval-layer/index.html`
- `solutions/ai-evidence-file/index.html`
- `docs/index.html`
- `docs/*/index.html`
- `docx/*.md`
- `reports/seo/*.md`

## 6. ملاحظات من التحليل

- المشروع Static HTML + Node API داخل `frontend/`.
- يوجد SEO قوي مسبقًا، خصوصًا في الصفحة الرئيسية وصفحات الحلول الحالية.
- توجد مشكلة sitemap/robots/kernel: `sitemap-kernel.xml` موجود لكنه غير مشار إليه في `robots.txt`، وقرار فهرسة kernel يحتاج وضوحًا.
- توجد sitemaps متعددة بدون robots يشير لها كلها.
- توجد ملاحظة حول `en-SA`; سيتم عدم تنفيذ replace شامل.
- توجد ملاحظة حول `sitemap-images.xml`; سيتم تأجيلها إلى Phase 4.
- توجد آثار React/Next/dependencies غير مستخدمة في الجذر، لكنها مؤجلة وليست ضمن هذا التنفيذ.
