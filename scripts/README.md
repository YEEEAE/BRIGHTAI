# Scripts Documentation

هذا المجلد يحتوي على السكريبتات الأساسية لبناء وفحص وصيانة مشروع BrightAI.

## 📋 فهرس السكريبتات

### 🏗️ البناء والتجميع (Build & Compilation)

#### `build-tailwind-purged.mjs`
**الوصف:** بناء وتصفية وتصغير ملفات Tailwind CSS
**الاستخدام:**
```bash
npm run tailwind:build
```
**الوظائف:**
- تجميع Tailwind CSS من الملف المصدر
- تصفية الأنماط غير المستخدمة باستخدام PurgeCSS
- تصغير الملف النهائي باستخدام esbuild
- إنتاج ملف CSS محسّن للإنتاج

#### `minify-seo-assets.mjs`
**الوصف:** تصغير ملفات CSS و JavaScript
**الاستخدام:**
```bash
npm run assets:minify
```
**الوظائف:**
- تصغير جميع ملفات CSS و JS في المشروع
- تحسين الأداء وتقليل حجم الملفات
- الحفاظ على نسخ مصغرة بامتداد `.min.css` و `.min.js`

#### `replace-unminified-refs.mjs`
**الوصف:** استبدال المراجع إلى الملفات غير المصغرة بالمصغرة
**الاستخدام:**
```bash
npm run assets:replace-refs
```
**الوظائف:**
- البحث في ملفات HTML عن مراجع الملفات غير المصغرة
- استبدالها بالمراجع المصغرة (`.min.css`, `.min.js`)
- تحسين أداء التحميل في الإنتاج

#### `apply-production-audit-fixes.mjs`
**الوصف:** تطبيق إصلاحات التدقيق للإنتاج
**الاستخدام:**
```bash
npm run production:fixes
```
**الوظائف:**
- تطبيق التحسينات والإصلاحات النهائية قبل النشر
- التأكد من جاهزية الملفات للإنتاج

---

### 🔍 الفحص والتحقق (Verification & Testing)

#### `verify-all.mjs`
**الوصف:** فحص شامل لجودة المشروع
**الاستخدام:**
```bash
npm run verify:all
```
**الفحوصات:**
1. **الروابط الداخلية:** التحقق من عدم وجود روابط مكسورة أو قديمة
2. **Canonical Tags:** التحقق من صحة canonical tags في جميع الصفحات
3. **Sitemap:** التحقق من صحة sitemap.xml وقواعد trailing slash
4. **Noindex:** التحقق من وجود noindex في الصفحات المنقولة
5. **البنية الأساسية:** التحقق من وجود title, description, H1 في كل صفحة

**المخرجات:**
- تقرير في الكونسول
- ملف JSON في `reports/verify-report.json` (في حالة وجود أخطاء)

#### `check-render-readiness.mjs`
**الوصف:** التحقق من جاهزية المشروع للنشر على Render
**الاستخدام:**
```bash
node scripts/check-render-readiness.mjs
```
**الفحوصات:**
- وجود ملف `render.yaml`
- وجود ملفات `package.json` و `package-lock.json` في frontend
- صحة تكوين `DATABASE_URL`
- توافق إصدار Node.js

#### `check-performance-budget.js`
**الوصف:** فحص ميزانية الأداء للمشروع
**الاستخدام:**
```bash
npm run performance:budget
```
**الوظائف:**
- قياس أحجام الملفات
- التحقق من عدم تجاوز حدود الأداء المحددة
- تقرير بالملفات التي تتجاوز الحدود

---

### 🔗 SEO والروابط (SEO & Links)

#### `seo-health-check.mjs`
**الوصف:** فحص صحة SEO الشامل للموقع
**الاستخدام:**
```bash
npm run seo:check
```
**الفحوصات:**
1. **robots.txt:** التحقق من عدم وجود قواعد Disallow ضارة
2. **sitemap.xml:** التحقق من صحة البنية والروابط
3. **HTML Files:** فحص canonical, title, description, H1
4. **Hreflang:** التحقق من صحة روابط اللغات البديلة
5. **Internal Links:** فحص الروابط الداخلية المكسورة

**المخرجات:**
- تقرير مفصل في الكونسول
- Exit code 0 (نجاح) أو 1 (فشل)

#### `seo-ci-check.mjs`
**الوصف:** فحص SEO للتكامل المستمر (CI)
**الاستخدام:**
```bash
npm run seo:gate
```
**الوظائف:**
- فحص سريع لأهم معايير SEO
- مناسب للاستخدام في CI/CD pipelines
- يمنع النشر في حالة وجود مشاكل حرجة

#### `generate-sitemap-all-pages.mjs`
**الوصف:** توليد sitemap.xml شامل لجميع صفحات الموقع
**الاستخدام:**
```bash
npm run sitemap:generate
```
**الوظائف:**
- مسح جميع ملفات HTML في المشروع
- تصنيف الصفحات (pages, kernel, demo, legal)
- توليد sitemaps منفصلة لكل فئة
- إنشاء sitemap index رئيسي
- إضافة hreflang tags للصفحات متعددة اللغات

**المخرجات:**
- `sitemap.xml` (Sitemap Index)
- `sitemap-pages.xml`
- `sitemap-kernel.xml`
- `sitemap-demo.xml`
- `sitemap-legal.xml`
- `reports/sitemap-quality-report.md`

---

### 🔗 الروابط الداخلية (Internal Links)

#### `internal-links-audit.mjs`
**الوصف:** تدقيق الروابط الداخلية المكسورة
**الاستخدام:**
```bash
npm run internal-links:audit
```
**الوظائف:**
- فحص جميع الروابط الداخلية في ملفات HTML
- اكتشاف الروابط المكسورة
- تحديد الروابط القابلة للإصلاح التلقائي

**المخرجات:**
- `reports/internal-links/broken_links_before.json`
- `reports/internal-links/broken_links_before.md`

#### `internal-links-common.mjs`
**الوصف:** وحدة مشتركة لوظائف الروابط الداخلية
**الاستخدام:** يتم استيرادها من سكريبتات أخرى
**الوظائف:**
- دوال مشتركة لفحص الروابط
- كتابة التقارير
- معالجة المسارات

#### `internal-linking-architecture.mjs`
**الوصف:** تحليل وإصلاح بنية الروابط الداخلية
**الاستخدام:**
```bash
npm run internal-links:inventory
npm run internal-links:architecture:fix
```
**الوظائف:**
- تحليل بنية الروابط الداخلية
- اقتراح تحسينات
- إصلاح تلقائي للروابط (مع --fix)

#### `fix-internal-links.mjs`
**الوصف:** إصلاح الروابط الداخلية المكسورة تلقائياً
**الاستخدام:**
```bash
npm run internal-links:fix
```
**الوظائف:**
- إصلاح الروابط المكسورة القابلة للإصلاح
- تحديث المراجع في ملفات HTML
- إنشاء تقرير بالإصلاحات

---

### 📁 المسارات والموارد (Paths & Resources)

#### `resource-paths-audit.mjs`
**الوصف:** تدقيق مسارات الموارد (CSS, JS, Images)
**الاستخدام:**
```bash
npm run resource:audit:before
npm run resource:audit:after
```
**الوظائف:**
- فحص صحة مسارات الموارد
- اكتشاف المسارات المكسورة
- مقارنة قبل وبعد الإصلاح

#### `resource-paths-common.mjs`
**الوصف:** وحدة مشتركة لوظائف مسارات الموارد
**الاستخدام:** يتم استيرادها من سكريبتات أخرى

#### `fix-resource-paths.mjs`
**الوصف:** إصلاح مسارات الموارد المكسورة
**الاستخدام:**
```bash
npm run resource:fix
```
**الوظائف:**
- إصلاح مسارات CSS, JS, Images المكسورة
- تحديث المراجع في ملفات HTML

---

### 🛠️ الوحدات المساعدة (Utility Modules)

#### `sitemap-audit-utils.mjs`
**الوصف:** وحدة مساعدة لفحص sitemap
**الوظائف:**
- استخراج canonical href
- استخراج hreflang links
- فحص noindex directives
- فحص meta refresh
- البحث عن مراجع onrender.com

#### `seo-url-map.mjs`
**الوصف:** وحدة لإدارة خريطة URLs للموقع
**الوظائف:**
- بناء سجل URLs العامة
- تطبيع المسارات النسبية
- تحويل المسارات إلى canonical URLs
- إيجاد الصفحات المقابلة (عربي/إنجليزي)

---

## 🔄 سير العمل الموصى به (Recommended Workflow)

### قبل النشر (Pre-deployment)
```bash
# 1. بناء الأصول
npm run build:assets

# 2. توليد sitemap
npm run sitemap:generate

# 3. فحص شامل
npm run verify:all

# 4. فحص SEO
npm run seo:all
```

### صيانة دورية (Regular Maintenance)
```bash
# فحص وإصلاح الروابط الداخلية
npm run internal-links:audit
npm run internal-links:fix

# فحص وإصلاح مسارات الموارد
npm run resource:audit:before
npm run resource:fix
npm run resource:audit:after

# فحص الأداء
npm run performance:budget
```

---

## 📊 التقارير (Reports)

جميع التقارير يتم حفظها في مجلد `reports/`:

- `verify-report.json` - تقرير الفحص الشامل
- `sitemap-quality-report.md` - تقرير جودة sitemap
- `internal-links/` - تقارير الروابط الداخلية
- `resource-paths/` - تقارير مسارات الموارد

---

## 🔧 الإعدادات (Configuration)

### `performance-budget.config.json`
ملف تكوين لحدود الأداء:
```json
{
  "maxCssSize": 100,
  "maxJsSize": 200,
  "maxImageSize": 500
}
```

---

## 📝 ملاحظات مهمة

1. **Node.js Version:** يتطلب Node.js 22 أو أحدث
2. **ES Modules:** جميع السكريبتات تستخدم ES Modules (`.mjs`)
3. **Encoding:** جميع الملفات بترميز UTF-8
4. **Exit Codes:** السكريبتات تستخدم exit code 0 للنجاح و 1 للفشل

---

## 🚀 التحديثات المستقبلية

السكريبتات المحذوفة (غير مستخدمة أو قديمة):
- ❌ `seo-production-guard.mjs`
- ❌ `audit-demo-ai-bindings.mjs`
- ❌ `generate-related-articles.mjs`
- ❌ `submit-indexnow.mjs`
- ❌ `check-api-base-consistency.mjs`
- ❌ `smoke-test-api.mjs`
- ❌ `validate-production.js`
- ❌ `create-clean-zip.mjs`
- ❌ `html-seo-governor.mjs`
- ❌ `content-score.cjs`
- ❌ `seo-indexability-qa.mjs`
- ❌ `check-kernel-pages.mjs`
- ❌ `generate-legal-pages.mjs`
- ❌ `run-monorepo-tests.mjs`
- ❌ `generate-sitemap-images.mjs`
- ❌ `test-gemini-unified-api.mjs`
- ❌ `update-sitemap-from-current-files.mjs`
- ❌ `seo-intent-headings-qa.mjs`
- ❌ `analytics-qa.mjs`
- ❌ `smoke-test.js`
- ❌ `ui-audit.mjs`
- ❌ `ping-search-engines.mjs`
- ❌ `verify-clarity.mjs`

---

**آخر تحديث:** 2026-05-28
**الإصدار:** 2.0.0
