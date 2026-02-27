# PR: توحيد Netlify كمصدر حقيقة وحيد

## الملخص
هذا الـ PR يعالج تضارب إعدادات النشر بين `netlify.toml` و`.htaccess` و`_headers` عبر اعتماد Netlify كمصدر الحقيقة الوحيد في الإنتاج لـ:
- التوجيه والتحويلات (Routing/Redirects)
- رؤوس الأمان (Security Headers)
- سياسات التخزين المؤقت (Caching Policies)

## ما الذي تغيّر
- توحيد قواعد الإنتاج الخاصة بـ redirects/headers/caching داخل `netlify.toml`
- تحويل `.htaccess` و`_headers` في الجذر إلى ملفات توثيقية/أرشيفية فقط
- الاحتفاظ بنسخ الإعدادات القديمة داخل `docs/deployment-archive/`
- إضافة سكربت تحقق آلي:
  - `scripts/verify-netlify-source-of-truth.mjs`
  - `npm run deploy:source-of-truth:check`
- إضافة بوابة تحقق في CI:
  - `.github/workflows/netlify-source-of-truth.yml`

## السبب
وجود أكثر من مصدر إعداد فعّال كان يسبب خطر الانحراف بين البيئات، وتعارضًا في سلوك التحويلات، وعدم وضوح ملكية إعدادات التوجيه/الأمان/التخزين المؤقت في الإنتاج.

## التحقق
- أمر التحقق المحلي:
  - `npm run deploy:source-of-truth:check`
- النتيجة:
  - `Source-of-truth validation passed (25 checks).`

## المخاطر / الأثر
- مخاطر تشغيلية منخفضة على Netlify (القواعد مركزية ومتحقق منها).
- ملفات Apache/الملفات القديمة أصبحت غير فعّالة عمدًا، وتم الإبقاء عليها لأغراض التتبع والرجوع التاريخي.

## التراجع (Rollback)
- عند الحاجة، يمكن عمل revert للكوميت `1c9f97f9`.
- النسخ الأرشيفية من الإعدادات ما زالت متاحة داخل `docs/deployment-archive/`.
