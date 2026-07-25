# Scripts Documentation — BrightAI

> **آخر تحديث:** 2026-07-25 (BAI-ARCH-03 — تنظيف scripts/)
> **العدد الحالي:** 60 ملف

هذا المجلد يحتوي على سكريبتات بناء وفحص وصيانة مشروع BrightAI بعد تنظيف BAI-ARCH-03.

---

## 📂 بنية المجلد (Scripts Directory Structure)

| المستوى | الغرض | العدد | المرجع في `package.json` |
| --- | --- | --- | --- |
| `scripts/` (root) | Production + Library — على المسار الحرج | 60 | ✅ كلهم مربوطين |
| `scripts/__fixtures__/` | Test fixtures لـ `verify:all` | ~195 | ❌ لا (test data) |

### ما تم إزالته في BAI-ARCH-03

- **`scripts/archived/`** (2 ملفات dead/duplicate) — حُذفت
- **`scripts/qa/`** (54 ملف + 50 Playwright) — نُقلت إلى root مع `qa-` prefix ثم حُذفت (one-off)
- **`scripts/playwright/`** (31 ملف، duplicate) — حُذفت
- **`scripts/migration/`** (15 ملف) — نُقلت إلى root مع `migration-` prefix ثم حُذفت (replay-only)
- **`scripts/seo/`** (2 ملف one-off) — حُذفت
- **`scripts/migration-audit/`** (1 تقرير تاريخي) — حُذفت
- **`scripts/postgres-init/`** (1 SQL) — حُذفت
- **`scripts/reports/`** (1 orphan-page report) — حُذفت
- **`scripts/db/`** (فارغ) — حُذفت
- ملفات JSON/data قديمة (`critical-css.json`, `seo-data.json`, `.scripts-manifest.json`, `INVENTORY.md`) — حُذفت

---

## 🚀 أهم الـ scripts (Quick Reference)

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

## 📋 قائمة الـ scripts (60 ملف)

### Production (38 — في `package.json`)

| Script | الاستخدام في `package.json` |
| --- | --- |
| `axe-scan.mjs` | `a11y:scan` |
| `check-performance-budget.js` | `performance:budget` |
| `check-redirect-destinations.mjs` | `redirects:check` |
| `check-render-route-hygiene.mjs` | `redirects:check` |
| `check-speakable-schema.mjs` | `seo:schema` |
| `check-word-count.mjs` | `seo:word-count` |
| `content-acceptance.test.mjs` | `seo:content` |
| `fix-internal-links.mjs` | `internal-links:fix` |
| `fix-resource-paths.mjs` | `resource:fix` |
| `generate-all-redirects.mjs` | `prebuild` |
| `generate-avif-variants.mjs` | `avif:generate` |
| `generate-image-sitemap.mjs` | `image-sitemap` |
| `generate-sitemap-all-pages.mjs` | `sitemap:generate` |
| `hreflang-bidirectional-audit.mjs` | `seo:hreflang`, `verify:all` |
| `internal-linking-architecture.mjs` | `internal-links:audit`, `internal-links:inventory`, `internal-links:architecture:fix` |
| `internal-links-audit.mjs` | `internal-links:audit` |
| `legacy-paths-audit.mjs` | `seo:legacy-paths` |
| `legacy-seo-surface.test.mjs` | `seo:legacy` |
| `link-graph-validator.mjs` | `seo:link-graph` |
| `lint-no-db-service-role-in-reads.mjs` | `lint:rls` |
| `lint-tokens.mjs` | `lint:tokens`, `verify:all` |
| `patch-server-entry.mjs` | `build:patch-entry` |
| `purge-cloudflare-cache.mjs` | `cloudflare:purge` |
| `purge-css.mjs` | `purge:css` |
| `resource-paths-audit.mjs` | `resource:audit:before`, `resource:audit:after` |
| `run-lhci.sh` | `lhci:collect`, `lhci:all`, `lhci:assert`, `lhci:psi` |
| `security-headers.mjs` | — (مستخدم في `sync-headers-from-csp`) |
| `seo-ci-check.mjs` | `seo:gate` |
| `seo-health-check.mjs` | `seo:check` |
| `seo-schema-audit.mjs` | `seo:schema` |
| `setup-cloudflare-hsts-transform-rule.mjs` | `cloudflare:hsts` |
| `subset-fonts.mjs` | `fonts:subset`, `prebuild` |
| `sync-dist-flat.mjs` | `sync:dist:flat`, `build` |
| `sync-docs-howto-schema.mjs` | `schema:docs:sync`, `schema:docs:check` |
| `sync-headers-from-csp.mjs` | `headers:sync`, `headers:check` |
| `sync-solution-faq-schema.mjs` | `schema:solutions:sync`, `schema:solutions:check` |
| `test-chat-session.mjs` | `test:chat-session` |
| `test-csrf.mjs` | `test:csrf` |
| `test-ts-loader.mjs` | `test:chat-session`, `test:csrf` (ESM loader) |
| `trigger-indexnow.mjs` | `postbuild:indexnow`, `indexnow:trigger`, `indexnow:check`, `indexnow:deploy` |
| `verify-all.mjs` | `verify:all` |
| `verify-csp-drift.mjs` | `verify:csp-drift` |
| `verify-deployment-surface.mjs` | `verify:deployment-surface` |
| `verify-live-security-headers.mjs` | `verify:live:headers` |
| `verify-no-legacy-mock.mjs` | `verify:no-legacy-mock` |
| `verify-no-legacy-sw.mjs` | `verify:no-legacy-sw` |
| `verify-post-deploy.mjs` | `verify:post-deploy`, `verify:production` |
| `verify-report-claims.mjs` | `verify:report` |
| `verify-set-html-sanitized.mjs` | `verify:set-html` |

### Library (13 — مستوردة من Production)

| Script | يستورد بواسطة |
| --- | --- |
| `_build-output.mjs` | `check-redirect-destinations.mjs`, `generate-sitemap-all-pages.mjs`, `hreflang-bidirectional-audit.mjs`, `seo-health-check.mjs`, `verify-all.mjs` |
| `headers-config.mjs` | `sync-headers-from-csp.mjs` |
| `high-confidence-sitemap-config.mjs` | `seo-ci-check.mjs` |
| `indexing-recovery-utils.mjs` | `check-redirect-destinations.mjs`, `check-word-count.mjs`, `legacy-paths-audit.mjs`, `link-graph-validator.mjs` |
| `internal-links-common.mjs` | `fix-internal-links.mjs`, `internal-links-audit.mjs`, `seo-ci-check.mjs` |
| `legacy-seo-surface-audit.mjs` | `legacy-seo-surface.test.mjs` |
| `resource-paths-common.mjs` | `fix-resource-paths.mjs`, `resource-paths-audit.mjs` |
| `seo-url-map.mjs` | `generate-sitemap-all-pages.mjs`, `internal-linking-architecture.mjs`, `internal-links-common.mjs`, `legacy-seo-surface-audit.mjs`, `seo-ci-check.mjs`, `seo-health-check.mjs`, `verify-all.mjs` |
| `sitemap-audit-utils.mjs` | `generate-sitemap-all-pages.mjs`, `hreflang-bidirectional-audit.mjs`, `internal-linking-architecture.mjs`, `seo-ci-check.mjs`, `seo-health-check.mjs` |
| `sitemap-contract.mjs` | `verify-all.mjs` |
| `test-ts-loader-hook.mjs` | `test-ts-loader.mjs` |

### Documentation

| ملف | الغرض |
| --- | --- |
| `README.md` | هذا الملف — دليل الـ scripts |

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

### ما بعد النشر (Post-deployment)
```bash
npm run indexnow:deploy
npm run verify:post-deploy
```

---

## 📝 ملاحظات مهمة

1. **Node.js Version:** يتطلب Node.js 22 أو أحدث (locked via `package.json#engines.node`).
2. **ES Modules:** كل الـ scripts ES Modules (`.mjs`) — لا CommonJS.
3. **Encoding:** كل الملفات بترميز UTF-8.
4. **Exit Codes:** 0 للنجاح، 1 للفشل. الـ CI يفشل عند أي non-zero.
5. **Imports:** الـ libraries في `scripts/` (root) تستخدم relative paths `./X.mjs`. أي نقل يحتاج تعديل كل الـ importers.

---

## 📊 التقارير (Reports)

التقارير تُحفظ الآن في `report/` (جذر المشروع):
- `report/*.md` — تقارير التغييرات المعمارية
- أو في `/tmp/` للفحوصات المؤقتة

---

<｜｜DSML｜｜parameter name="content" string="true"># Scripts Documentation — BrightAI

> **آخر تحديث:** 2026-07-25 (BAI-ARCH-03 — تنظيف scripts/)
> **العدد الحالي:** 60 ملف

هذا المجلد يحتوي على سكريبتات بناء وفحص وصيانة مشروع BrightAI بعد تنظيف BAI-ARCH-03.

---

## 📂 بنية المجلد (Scripts Directory Structure)

| المستوى | الغرض | العدد | المرجع في `package.json` |
| --- | --- | --- | --- |
| `scripts/` (root) | Production + Library — على المسار الحرج | 60 | ✅ كلهم مربوطين |
| `scripts/__fixtures__/` | Test fixtures لـ `verify:all` | ~195 | ❌ لا (test data) |

### ما تم إزالته في BAI-ARCH-03

- **`scripts/archived/`** (2 ملفات dead/duplicate) — حُذفت
- **`scripts/qa/`** (54 ملف + 50 Playwright) — نُقلت إلى root مع `qa-` prefix ثم حُذفت (one-off)
- **`scripts/playwright/`** (31 ملف، duplicate) — حُذفت
- **`scripts/migration/`** (15 ملف) — نُقلت إلى root مع `migration-` prefix ثم حُذفت (replay-only)
- **`scripts/seo/`** (2 ملف one-off) — حُذفت
- **`scripts/migration-audit/`** (1 تقرير تاريخي) — حُذفت
- **`scripts/postgres-init/`** (1 SQL) — حُذفت
- **`scripts/reports/`** (1 orphan-page report) — حُذفت
- **`scripts/db/`** (فارغ) — حُذفت
- ملفات JSON/data قديمة (`critical-css.json`, `seo-data.json`, `.scripts-manifest.json`, `INVENTORY.md`) — حُذفت

---

## 🚀 أهم الـ scripts (Quick Reference)

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
npm run build
npm run verify:all
npm run seo:all
npm run performance:budget
```

### صيانة دورية (Regular Maintenance)
```bash
npm run internal-links:audit
npm run internal-links:fix
npm run resource:audit:before
npm run resource:fix
npm run resource:audit:after
```

### ما بعد النشر (Post-deployment)
```bash
npm run indexnow:deploy
npm run verify:post-deploy
```

---

## 📝 ملاحظات مهمة

1. **Node.js Version:** يتطلب Node.js 22 أو أحدث.
2. **ES Modules:** كل الـ scripts ES Modules (`.mjs`) — لا CommonJS.
3. **Exit Codes:** 0 للنجاح، 1 للفشل.
4. **Imports:** الـ libraries تستخدم relative paths `./X.mjs`.
5. **التقارير:** تُحفظ في `report/` (جذر المشروع).
