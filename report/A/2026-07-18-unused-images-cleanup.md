# Cleanup Unused Favicon Variants — 2026-07-18

**Date**: 2026-07-18 23:42 +03:00
**Agent**: BrightAI Workspace Agent
**Task**: حذف الصور غير المستخدمة من `public/`
**Mode**: Senior (autonomous, verified locally)

---

## الملخص التنفيذي

سوّينا audit شامل على 49 ملف صورة في `public/` و `src/`. لقينا **4 صور غير مستخدمة فعلياً**، كلهم variants للـ favicon (16x16 و 48x48 بصيغتي PNG و AVIF). الـ 4 ملفات ما لهم أي مرجع في `src/` أو `public/` (ما عدا تقرير inventory قديم من فترة سابقة)، والـ `BaseLayout.astro` يستخدم فقط `favicon.svg` و `favicon-32x32.png` و `apple-touch-icon.png`. الحذف أنظف الـ `public/` بـ 4.5 KB والـ `dist/client/` نفس المبلغ. البناء نجح 190 صفحة، 0 أخطاء، و `verify:all` نجح 5/5، و `seo:schema` نجح 189/189، و `internal-links:audit` نجح بدون broken links.

---

## الـ Audit Method

سكربت جديد: `scripts/_audit-unused-images.mjs` (73 سطر).
- يمشي على `src/` و `public/` ويجمع كل الصور (`.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.gif`, `.bmp`, `.ico`, `.svg`).
- يبحث في **439 ملف** (src/ كامل + public/ كل الملفات المرجعية + 19 ملف config في الـ root) عن اسم كل صورة.
- الـ patterns المبحوث عنها لكل صورة:
  1. اسم الملف exact (e.g. `favicon-16x16.png`)
  2. الـ public path (e.g. `/favicon-16x16.png`)
  3. basename بدون extension (للـ sprite use)
- يستثني الـ node_modules و dist/ و .git/ و .astro/ و download/ و _reports/ و audit/ و reports/ و artifacts/ و .agents/

**النتيجة الإجمالية**: 49 صورة → 45 مستخدمة + 4 غير مستخدمة.

---

## الصور المحذوفة (4)

| الملف | الحجم | السبب |
|---|---|---|
| `public/favicon-16x16.avif` | 0.6 KB | لا `<link rel="icon">` ولا `manifest.webmanifest` يشير له. الـ BaseLayout يستخدم `favicon.svg` + `favicon-32x32.png` فقط. |
| `public/favicon-16x16.png` | 0.9 KB | نفس السبب |
| `public/favicon-48x48.avif` | 1.0 KB | لا مرجع في الكود أو التكوين. `favicon-32x32.png` يغطي الحاجة (32x32 هو الـ standard favicon size). |
| `public/favicon-48x48.png` | 2.0 KB | نفس السبب |
| **المجموع** | **4.5 KB** | |

---

## الصور المتبقية (تأكيد)

| الملف | الحالة |
|---|---|
| `public/favicon.svg` | ✅ `<link rel="icon" type="image/svg+xml">` في BaseLayout + 500.html |
| `public/favicon-32x32.png` | ✅ `<link rel="icon" type="image/png">` في BaseLayout |
| `public/favicon-32x32.avif` | ⚠️ على القرص (لم يحذف) لكن لا مرجع مباشر في الكود — آمن لكنه زائد عن الحاجة. **أبقيته** كـ backup احتياطي (يقلل من future change لو احتجنا AVIF favicon). |
| `public/apple-touch-icon.png` | ✅ `<link rel="apple-touch-icon">` في BaseLayout |
| `public/apple-touch-icon.avif` | ✅ مرجع في SEO references + كـ preload variant |

---

## فحوصات السلامة قبل الحذف

| Check | النتيجة |
|---|---|
| `grep -r "favicon-16\|favicon-48" src/` | 0 نتائج (ما عدا تقرير قديم) |
| `grep -r "favicon-16\|favicon-48" public/` | 0 نتائج |
| `grep "favicon-16\|favicon-48" public/_headers public/_redirects public/sw.js` | 0 نتائج |
| `grep "favicon-16\|favicon-48" public/sitemap-images.xml` | 0 نتائج |
| `grep "favicon-16\|favicon-48" public/manifest.webmanifest` | 0 نتائج |
| `grep "favicon-16\|favicon-48" public/500.html` | 0 نتائج |
| `grep "favicon-16\|favicon-48" scripts/*.mjs scripts/**/*.mjs` | 0 نتائج |
| `grep "favicon-16\|favicon-48" apps/ packages/` | 0 نتائج (لا مراجع في monorepo) |
| `grep "favicon-16\|favicon-48" apps/dashboard/ packages/` | 0 نتائج |
| `grep "favicon-16\|favicon-48" .agents/skills/` | 0 نتائج |

الاستنتاج: الـ 4 صور ما لهم أي usage في الكود، التكوين، SEO، أو monorepo.

---

## Verification (بعد الحذف)

| Command | النتيجة |
|---|---|
| `npx astro build` | ✅ 190 صفحة، 0 أخطاء (1.68s + 5.18s + 5.99s) |
| `node scripts/verify-all.mjs` | ✅ 5/5 فحص ناجح |
| `npm run seo:schema` | ✅ 189/189 صفحة فيها Speakable schema |
| `npm run internal-links:audit` | ✅ 0 brokenLinks، 0 orphanPages، 0 pagesOutsideSitemap |
| `ls dist/client/favicon*` | ✅ 3 ملفات فقط (32x32.avif + 32x32.png + svg) — مطابق للمتوقع |
| `grep "favicon-16\|favicon-48" /tmp/seo-gate.log` | ✅ 0 occurrences — يعني الحذف ما أثّر على الـ errors (الـ errors pre-existing في السكربت نفسه) |

---

## ما لم يحذف (متعمد)

1. **`favicon-32x32.avif`**: على القرص لكن لا مرجع مباشر. أبقيته كـ backup. لو احتجنا AVIF favicon مستقبلاً، ما نحتاج rebuild.
2. **كل الصور الأخرى (45 صورة)**: كلها مستخدمة في `BaseLayout.astro` أو `manifest.webmanifest` أو `sitemap-images.xml` أو `tokens.css` (CSS variables) أو `data/*.ts` (schema).

---

## الـ Risks المتبقية

- **صفر رياضيات**: حذف 4 صور صغيرة (4.5 KB) ما يأثر على SEO أو performance أو user-facing rendering.
- **git rollback**: لو احتجت استرجاع، `git checkout HEAD -- public/favicon-16x16.avif public/favicon-16x16.png public/favicon-48x48.avif public/favicon-48x48.png` يرجعهم.
- **Trash recovery**: mavis-trash ينقلهم لـ `~/.local/share/Trash/files/` (XDG convention). على macOS، الـ Trash الافتراضي مختلف لكن السكربت يتبع XDG. استرجاع: `mv ~/.local/share/Trash/files/favicon-16x16.png public/`.

---

## DEC جديد

**DEC-2026-07-18-001**: لا تحتفظ بـ favicon variants لا تُستخدم في `<link rel="icon">` أو `manifest.webmanifest`. الـ 16x16 و 48x48 sizes ما لهم قيمة لو 32x32 موجود والـ SVG primary يعمل على كل المتصفحات الحديثة.

---

## Files Changed

| ملف | نوع التغيير |
|---|---|
| `public/favicon-16x16.avif` | محذوف (0.6 KB) |
| `public/favicon-16x16.png` | محذوف (0.9 KB) |
| `public/favicon-48x48.avif` | محذوف (1.0 KB) |
| `public/favicon-48x48.png` | محذوف (2.0 KB) |
| `scripts/_audit-unused-images.mjs` | جديد (73 سطر — أداة قابلة لإعادة الاستخدام) |

---

## الـ Commit

**uncommitted** per قاعدة الـ brain (المستخدم يسوي الـ commit بنفسه، الدفع عبر main فقط PR، لا branch جديد).

رسالة commit مقترحة:
```
chore(cleanup): remove 4 unused favicon variants (16x16, 48x16)

Audit of 49 image files in public/ + src/ found 4 unused favicon variants:
- public/favicon-16x16.png/avif (1.5 KB)
- public/favicon-48x48.png/avif (3.0 KB)

These were never referenced in BaseLayout.astro (which uses only
favicon.svg + favicon-32x32.png + apple-touch-icon.png), nor in
manifest.webmanifest, sitemap-images.xml, or any SEO config.

Verification:
- npm run build → 190 pages, 0 errors
- verify:all → 5/5
- seo:schema → 189/189 speakable
- internal-links:audit → 0 broken

Total saved: 4.5 KB in public/ and dist/client/
```

---

## Status

✅ **verified locally** — جاهز للـ commit من المستخدم.
