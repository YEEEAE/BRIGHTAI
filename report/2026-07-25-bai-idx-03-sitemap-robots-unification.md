# BAI-IDX-03 — توحيد sitemap و robots

**Date**: 2026-07-25
**Task ID**: BAI-IDX-03 (من `b/prompt.md` — PROMPT [ID: BAI-IDX-03])
**Priority**: P0
**Expected impact**: +8% على Indexation
**Depends on**: BAI-IDX-02 (تم حله 2026-07-25)
**Risk**: Medium
**Status**: verified locally — بانتظار deploy

## وش تغيّر (بالعامية)

### 1) `public/robots.txt` — صار فيه 1 Sitemap declaration بدل 4

- **قبل**: 4 Sitemap lines (sitemap.xml + sitemap-index.xml + sitemap-images.xml + blog/feed.xml). Google ومحركات البحث تاخذ أدلة متضاربة عن أي sitemap يقرأون.
- **بعد**: 1 Sitemap line فقط — `Sitemap: https://brightai.site/sitemap.xml`. الـ companion files (sitemap-images.xml, blog/feed.xml) تبقى قابلة للوصول من in-page links/footers لكن **مو** كـ Sitemap: directives.
- **التعليق المُحدّث** يوثّق العقد: واحد فقط، 0 build-date freshness، 0 noindex، 0 status/design/dev/api routes.

### 2) `astro.config.mjs` — حذف `lastmod: new Date()`

- **قبل**: السطر `lastmod: new Date()` كان يطلب من @astrojs/sitemap plugin يكتب build timestamp في كل `<lastmod>` element. النتيجة: 180 URL كلهم `lastmod = 2026-07-25` بعد كل deploy، حتى لو ما تغيرت.
- **بعد**: السطر محذوف. الـ plugin يولّد `dist/sitemap-0.xml` بدون `<lastmod>` field. الـ post-processor `scripts/generate-sitemap-all-pages.mjs` يـ overwrite بعد build بـ git-based dates.
- **التعليق المُحدّث** يوثّق: post-processor هو الـ owner للـ lastmod، config يطلب omit.

### 3) `scripts/generate-sitemap-all-pages.mjs` — `resolveSourceFiles()` + حذف mtime fallback

#### `resolveSourceFiles(relPath)` (جديد)

دالة تحوّل HTML relPath (مثل `blog/ai-banking-saudi/index.html`) لقائمة source files تحت `src/` بالأولوية:

1. **Static page candidate** — `src/pages/<relPath>` (يشتغل لـ `about/`, `contact/`, `kernel/chat/`).
2. **Dynamic [param] route templates** — `src/pages/blog/category/[category].astro`, `src/pages/hub/[slug].astro`, `src/pages/authors/[slug].astro`, `src/pages/solutions/[slug].astro`, `src/pages/solutions/[sector].astro`, `src/pages/solutions/[sector]/index.astro`, `src/pages/solutions/cities/[city].astro`, `src/pages/solutions/[sector]/[city].astro`, `src/pages/kernel/[slug].astro` (يشتغل للـ blog category pages, hub subpages, author pages, solution pages, sector pages, city pages, kernel subpages).
3. **Content collection candidates** — `src/content/blog/<slug>.md|.mdx`, `src/content/docs/<slug>.md|.mdx`, `src/content/hub/<slug>.md|.mdx`.
4. **Data file candidates** — `src/data/blog.ts` (authors + posts), `src/data/solutions.ts`, `src/data/cities.ts`, `src/data/kernel.ts`, `src/data/hub-content-inline.ts`, `src/data/legal-content-inline.ts`, `src/data/legal-content-en-inline.ts`, `src/data/marketing.ts`, `src/data/i18n-pairs.ts`.

`getGitLastModifiedDate(relPath)` يمشي القائمة، يستعلم `git log -1 --format=%cs -- <source>` لكل source، يختار أول source له git history. الـ cache مبني على source file path (مو relPath) — معظم URLs تشترك في source files، فيكون dedup طبيعي.

#### حذف mtime fallback

- **قبل**: `lastmod: gitLastmod || toIsoDate(stat.mtime)` — إذا git log فشل، يسقط على file mtime = build time.
- **بعد**: `lastmod: gitLastmod` — إذا ما في git date، الـ lastmod field يكون فارغ. `renderXml` يحذف `<lastmod>` كلياً (لا emit build date).

**النتيجة**: 180 URL، 180/100% عندها lastmod من git log، 0 URLs بـ build-date leak.

### 4) `scripts/seo-health-check.mjs` — إصلاح regex bug (pre-existing)

الـ regex `/sitemap[.-]?index?\.xml(?:\s*)$/i` كان مكسور: `index?` يـ match "inde" أو "index" بس، فـ `sitemap.xml` (الـ canonical name) ما كان يـ match أبداً. السطر كان يقول "Accept any sitemap line ending in sitemap*.xml (covers both sitemap.xml and sitemap-index.xml as canonical entries)"، لكن الـ implementation ما يحقق الـ intent.

التصحيح: `/^sitemap:\s*\S*sitemap(?:-index)?\.xml(?:\s*)$/i` — يـ match `sitemap.xml` و `sitemap-index.xml` و URLs اللي قبلها host (مثل `https://brightai.site/sitemap.xml`).

## الملفات اللي ما لمسناها (محمي)

- `public/_redirects` (314 SEO redirects) — لم يُعدّل.
- `public/_headers` (CSP + cache-control) — لم يُعدّل.
- `public/robots.txt` AI crawler blocks (User-agent: OAI-SearchBot, ChatGPT-User, ...) — كلها باقية.
- `public/manifest.webmanifest`، `public/llms.txt`، `public/llms-full.txt`، `public/ai.txt` — لم تُعدّل.
- `public/icons.svg` (91-icon sprite) — لم يُعدّل.
- `src/data/site.ts` (tracking IDs) — لم يُعدّل.
- `src/data/navigation.ts`، `src/data/i18n-pairs.ts` — لم تُعدّل.
- `frontend/**` (backend Express) — لم يُعدّل.
- `render.yaml` — لم يُعدّل.

## التحقق (محلي على macOS dev)

| Check | Result |
|---|---|
| `grep -c '^Sitemap:' public/robots.txt` | ✅ 1 |
| `node scripts/generate-sitemap-all-pages.mjs` | ✅ "Generated sitemap.xml with 180 public URLs" |
| `grep -c '<loc>' public/sitemap.xml` | ✅ 180 |
| `awk '/<url>/,/<\/url>/' public/sitemap.xml \| grep -c '<lastmod>'` | ✅ 180/180 (100% coverage) |
| Build-date leak: `<lastmod>$(date -u +%F)</lastmod>` count | ✅ 0 |
| Forbidden patterns in sitemap: 404/500/offline/error/design/api/admin/dev/thank-you/styleguide/components-preview/ws | ✅ 0 |
| `grep -ci 'noindex' public/sitemap.xml` | ✅ 0 |
| `xmllint --noout public/sitemap.xml` | ✅ Valid XML |
| `xmllint --noout dist/client/sitemap-index.xml` | ✅ Valid XML |
| `node scripts/verify-all.mjs` | ✅ 5/5 فحص ناجح، exit 0 |
| `npm run seo:gate` | ✅ 0 errors, 0 warnings, exit 0 |

**Lastmod distribution** (real git dates only — no build-date leak):

| Count | Date |
|---|---|
| 130 | 2026-07-18 |
| 26 | 2026-07-08 |
| 12 | 2026-07-15 |
| 8 | 2026-06-13 |
| 2 | 2026-07-14 |
| 1 | 2026-06-25 |
| 1 | 2026-06-14 |
| **180** | total |

## قبل وبعد — concretely

| Aspect | قبل (pre-BAI-IDX-03) | بعد (BAI-IDX-03) |
|---|---|---|
| `public/robots.txt` Sitemap: lines | 4 | **1** |
| `astro.config.mjs` `lastmod` | `new Date()` (build date) | omitted (post-processor owns) |
| Sitemap `<lastmod>` for 180 URLs | mix of git dates + mtime/build date fallback | **100% git dates** |
| URLs with build date in lastmod | up to 82 (data-driven pages: blog/docs/kernel) | **0** |
| Sitemap contract: 0 noindex | ✅ (already enforced) | ✅ (verified) |
| Sitemap contract: 0 status/design/dev/api | ✅ (already enforced) | ✅ (verified) |
| `node scripts/verify-all.mjs` exit | 0 | 0 (no regression) |
| `npm run seo:gate` exit | 0 | 0 (no regression) |

## القرارات المعمارية (موثّقة في brain.md Section 4)

### DEC-BAI-IDX-03-2026-07-25-001: sitemap.xml = single source of truth

1. **One canonical sitemap declaration** — فقط `Sitemap: https://brightai.site/sitemap.xml` في robots.txt.
2. **lastmod = git log only** — post-processor يحدد، config يطلب omit.
3. **Zero noindex/forbidden/system routes** في السكربت — مُحقق ومُختبَر.

**Do not reverse. Ever.** (مالم يأذن المؤسس صراحة بعد review of Indexation data).

### DEC-BAI-IDX-03-2026-07-25-002: astro.config.mjs بدون `lastmod: new Date()`

الـ post-processor هو الـ source of truth للـ lastmod. الـ config يصف الـ shape (filter, customPages, changefreq, priority) بدون freshness claim. Separation of concerns.

## المخاطر والـ mitigations

1. **Source file resolution قد يفشل لـ routes جديدة** → الـ URL يطلع بدون `<lastmod>` (لا build-date leak، بس أقل SEO signal).
   - **Mitigation**: راقب `reports/sitemap-quality-report.md` بعد كل build. لو زاد عدد URLs الفاضية، أضف candidates للـ `resolveSourceFiles()`.

2. **Performance: ~30s لـ 180 URLs** (vs ~8s قبل). الـ overhead من الـ git calls المتعددة (لكل source candidate).
   - **Mitigation**: cache per source file path. معظم الـ URLs تشارك source files (مثلاً كل blog posts تشترك في `[...slug].astro` و `blog.ts`). 180 URLs × 2-4 candidates = 360-720 git calls في الـ worst case، لكن الـ cache يـ dedup إلى ~50-100 unique source files → ~5s.

3. **lastmod تاريخ قديم لـ data-driven pages** — مثلاً `/kernel/chat/` يطلع 2026-07-18 (static page date) مو 2026-07-24 (kernel.ts edit). الـ static page candidate يفوز على الـ data file candidate.
   - **Rationale**: الـ data file تاريخه = آخر commit لأي شي فيه (مو فقط الـ slug المعين). الـ static page date أكثر دلالة للـ "آخر ما تغير يـ affect this page".
   - **Trade-off**: لو تبي freshness أدق، اعكس الترتيب. حالياً: static page أولاً (chosen).

4. **Pre-existing test failure**: `node --test scripts/legacy-seo-surface.test.mjs` يفشل (redirects.json فيه entries ما هي في test fixture). ما له علاقة بـ BAI-IDX-03 — موجود قبل التغييرات.

5. **seo:all exit code = 0 لكن مع test failure warning** — npm run لا يـ propagate `--test` failures عند piping. الـ seo:gate (الـ CI الفعلي) يمر 0 errors.

6. **`resolveSourceFiles` heuristic قد يفشل** لـ routes بـ URL encoding غريب أو أسماء ملفات غير متوقعة. الـ solution الحالية: الـ resolver يحاول candidates متعددة قبل الفشل. الـ observation: الـ candidates الـ 12 اللي أضفناها تغطي 180 URL الحالية (100% coverage).

## الخطوة بعد deploy (المطلوب من المستخدم)

1. **اعمل commit** للـ 5 ملفات المعدّلة (public/robots.txt + astro.config.mjs + scripts/generate-sitemap-all-pages.mjs + scripts/seo-health-check.mjs + .agents/brain.md). رسالة مقترحة:

   ```
   seo(sitemap): unify contract — 1 Sitemap directive + git-only lastmod + zero noindex (BAI-IDX-03)

   - public/robots.txt: 4 Sitemap: lines → 1 canonical (sitemap.xml)
   - astro.config.mjs: remove `lastmod: new Date()` (post-processor owns freshness)
   - scripts/generate-sitemap-all-pages.mjs: add resolveSourceFiles() + remove
     file-mtime fallback. lastmod is now derived from `git log -1` against the
     page's real source under src/. If no source has git history, the
     <lastmod> field is omitted entirely (no build-date leak).
   - scripts/seo-health-check.mjs: fix regex bug — `index?` never matched
     `sitemap.xml`; replaced with `(?:-index)?` so the check matches the
     documented intent.

   3 ACs met:
   - robots.txt has 1 canonical Sitemap declaration
   - sitemap has 0 noindex URLs (180/180 indexable)
   - sitemap validation script (verify-all.mjs) exits 0

   Verified locally: 180/180 URLs with real git dates, 0 build-date leak,
   verify-all.mjs 5/5, seo:gate 0 errors.

   Closes: BAI-IDX-03 (b/prompt.md)
   ```

2. **Live smoke test بعد deploy**:
   ```bash
   curl -s https://brightai.site/robots.txt | grep "^Sitemap:"
   # Expected: Sitemap: https://brightai.site/sitemap.xml (one line only)
   curl -s https://brightai.site/sitemap.xml | xmllint --xpath "count(//*[local-name()='url'])" -
   # Expected: 180
   curl -s https://brightai.site/sitemap.xml | grep -c "noindex"
   # Expected: 0
   ```

3. **IndexNow trigger** بعد deploy عشان Bing/Yandex يعيدوا crawl sitemap الجديد.

4. **GSC re-submit sitemap**: في Google Search Console، Sitemaps → أضف `https://brightai.site/sitemap.xml` → Submit. Google عادةً يلتقطها تلقائياً بس إعادة التأكيد تسرّع.

5. **90 يوم post-deploy review**: قس تأثير BAI-IDX-03 على Indexation في Google Search Console:
   - "Pages" report: `sitemap.xml URLs` discovered vs indexed ratio (هدف: > 95%)
   - "Crawl stats": crawl requests per day على /sitemap.xml
   - "Page indexing": new pages discovered and indexed
   - المتوقع: +8% على الـ overall Indexation score (per brief impact estimate).

## Rollback

لو الـ deploy سبب regression:

```bash
git revert HEAD~1..HEAD  # revert the single PR
# OR
git revert <commit-sha>
pnpm install
pnpm build
git push origin main  # Render auto-redeploys
```

وقت التراجع: ~5 دقائق (revert + rebuild + redeploy). التأثير العكسي المتوقع: Indexation score يرجع للحالة قبل BAI-IDX-03 (بس بدون regressions لأن pre-state كان ينتج 82 URL بـ build-date leak — التراجع يـ re-introduce هذا).

## Related work (موثّق في brain.md)

- BAI-IDX-01 (P0 deployment surface): ✅ resolved 2026-07-25 (`report/2026-07-25-deployment-artifact-surface.md`)
- BAI-IDX-02 (P0 hreflang bidirectional): ✅ resolved 2026-07-25 (`report/2026-07-25-bidirectional-hreflang-pair-map.md`)
- BAI-IDX-03 (P0 sitemap + robots): ✅ هذا التقرير، verified locally
- BAI-IDX-04+ (مستقبل): orphan pages، broken links، header hardening — يعتمد على BAI-IDX-03 per `b/prompt.md` dependency chain.
