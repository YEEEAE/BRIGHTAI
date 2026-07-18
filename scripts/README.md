# Scripts Documentation

> **⚠️ الـ source of truth الجديد للـ scripts هو `scripts/INVENTORY.md`** (generated 2026-07-18).
> هذا الـ README يحتوي على الـ categories العامة + أهم الـ workflows.
> للـ exhaustive list (كل script بـ owner + purpose + entrypoint)، اقرأ `INVENTORY.md`.

هذا المجلد يحتوي على السكريبتات الأساسية لبناء وفحص وصيانة مشروع BrightAI.

---

## 📂 بنية المجلد (Scripts Directory Structure)

| المجلد | الغرض | العدد | المرجع في `package.json` |
| --- | --- | --- | --- |
| `scripts/` (root) | Production + Library — على المسار الحرج | 51 | ✅ كلهم مربوطين |
| `scripts/qa/` | One-off QA/visual/audit (لا يُستورد، يُشغّل يدويًا) | 54 | ❌ لا |
| `scripts/qa/playwright/` | One-off Playwright debug/probe (لا يُستورد) | 50 | ❌ لا |
| `scripts/migration/` | HTML→Astro migration (replay-only، فُرغ 2026-07) | 15 | ❌ لا |
| `scripts/playwright/` | Playwright verification scripts (مرجعية في brain) | 25 | ❌ لا |
| `scripts/archived/` | Dead/duplicate (renamed من `* 2.mjs` بسبب spaces) | 2 | ❌ لا |
| `scripts/seo/` | SEO sub-categorization | 2 | ❌ لا |
| `scripts/migration-audit/` | تقرير static للتاريخ (paired with `migration/audit-html-vs-astro.mjs`) | 1 | ❌ لا |
| `scripts/postgres-init/` | Postgres init SQL (one-time، في Docker entrypoint) | 1 | ❌ لا |
| `scripts/__fixtures__/` | Test fixtures لـ `verify:all` | 1 dir | ❌ لا |

**Total**: 199 scripts (.mjs/.js/.py/.sh) + 1 .sql + 1 report

---

## 🚀 أهم الـ scripts (Production Quick Reference)

> **للـ list الكاملة، اقرأ `scripts/INVENTORY.md` Section 1 (Production).**

### Build pipeline
- `npm run build` → `astro build` + AVIF + sitemap + schema sync + CSS purge
- `npm run prebuild` → `fonts:subset` + `generate-all-redirects`
- `npm run dev` → `astro dev`

### Verification gates (CI: `pnpm run verify:all`)
- `npm run verify:all` → internal links + sitemap + SEO schema + SEO gate + chat-session + CSRF
- `npm run performance:budget` → raw file size check (HTML/CSS/JS)
- `npm run seo:all` → `seo:check` + `seo:schema` + `seo:gate`
- `npm run a11y:scan` → axe-core scan (في CI عبر `.github/workflows/a11y.yml`)

### IndexNow (post-deploy)
- `npm run indexnow:deploy` → notify Bing/Yandex (مستخدم في `deploy.yml`)

---

## 🔄 سير العمل الموصى به (Recommended Workflow)

### قبل النشر (Pre-deployment)
```bash
# 1. بناء الأصول
npm run build

# 2. فحص شامل
npm run verify:all

# 3. فحص SEO
npm run seo:all

# 4. فحص الأداء
npm run performance:budget
```

### صيانة دورية (Regular Maintenance)
```bash
# فحص وإصلاح الروابط الداخلية
npm run internal-links:audit
npm run internal-links:fix

# فحص ومسارات الموارد
npm run resource:audit:before
npm run resource:fix
npm run resource:audit:after
```

### صيانة الـ migration (replay-only)
```bash
# فقط لو احتجت نعيد ترحيل محتوى من HTML قديم
node scripts/migration/extract-blog-articles.mjs
node scripts/migration/migrate-blog-html-to-md.mjs
```

### QA audits (one-off)
```bash
# Visual screenshots (one-off batch)
node scripts/qa/footer-screenshots.mjs

# Lighthouse batch
node scripts/qa/lighthouse-batch.mjs

# Mobile 375px check
node scripts/qa/check-mobile-375.mjs
```

---

## 📊 التقارير (Reports)

التقارير تُحفظ في `reports/`:
- `verify-report.json` — تقرير `verify:all`
- `sitemap-quality-report.md` — تقرير جودة sitemap
- `internal-links/` — تقارير الروابط الداخلية
- `resource-paths/` — تقارير مسارات الموارد
- `lighthouse-20/` — تقارير Lighthouse (one-off)

---

## 📝 ملاحظات مهمة

1. **Node.js Version:** يتطلب Node.js 22 أو أحدث (locked via `package.json#engines.node`).
2. **ES Modules:** كل الـ scripts ES Modules (`.mjs`) — لا CommonJS.
3. **Encoding:** كل الملفات بترميز UTF-8.
4. **Exit Codes:** 0 للنجاح، 1 للفشل. الـ CI يفشل عند أي non-zero.
5. **Imports:** الـ libraries في `scripts/` (root) تستخدم relative paths `./X.mjs`. أي نقل يحتاج تعديل كل الـ importers.

---

## 📚 مرجع الـ scripts الكامل

- **`scripts/INVENTORY.md`** ← الـ source of truth لكل script (owner + purpose + entrypoint + classification)
- **`docs/script-cleanup-plan.md`** ← خطة قديمة (2026-05-28) — superseded by INVENTORY.md
- **`.agents/brain.md`** Section 2 ← القرارات المعمارية (protected files، forbidden deps، إلخ)
- **`agent.md`** Section 14.5 ← Skills system reference
- **`agent.md`** Section 0.6 ← Brain file protocol

---

**آخر تحديث:** 2026-07-18 (scripts/ cleanup pass — 199 scripts classified into 6 categories)
**الإصدار:** 3.0.0 (replaces the old 2.0.0 dated 2026-05-28)
