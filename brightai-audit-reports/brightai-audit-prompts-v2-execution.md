# BrightAI Enhanced Audit v2 — Executive Execution Prompts

**Source:** `brightai-audit-reports/brightai-audit-report-v2.pdf` (16 pages, 2026-07-25)
**Total:** 16 executive prompts across 3 phases
**Baseline:** Code 70% / Production 15% → Target: Code 85% / Production 85%
**Usage:** كل برومبت = تغيير ذرّي قابل للمراجعة والتحقق والتراجع. كل برومبت يحوي CONTEXT, FILES IN SCOPE, MUST NOT TOUCH, TASK, ACCEPTANCE CRITERIA, VERIFICATION COMMANDS, ROLLBACK, DEFINITION OF DONE.

---

## جدول المحتويات

- **Phase 1 — P0 (48 ساعة)** — deploy + secure + identity → Production 15% → 55%
  - EXEC-01: BAI-DEPLOY-12 — commit + push + Render deploy + Cloudflare purge
  - EXEC-02: BAI-SEC-13 — Gemini API key rotation + deletion from brain.md
  - EXEC-03: BAI-CONTENT-08 — Founder full name + CR number in JSON-LD
  - EXEC-04: BAI-SEC-21 — Remove brain.md from public repo
- **Phase 2 — P1 (أسبوعان)** — CI gates + content + UX + a11y → Production 55% → 65%, Code 75% → 82%
  - EXEC-05: BAI-SEC-18 Phase 2 — 7 kernel scripts CSP nonce/hash migration
  - EXEC-06: BAI-ARCH-01 — ESLint activation (remove lint:legacy echo)
  - EXEC-07: BAI-DESIGN-03 — Trust badges on hero (SDAIA/NCA/ISO)
  - EXEC-08: BAI-DESIGN-02 — AA contrast fix (rgba 3.8:1 → 4.5:1+)
  - EXEC-09: BAI-CONTENT-02 — /customers/ pages merge or delete
  - EXEC-10: BAI-MEAS-01/02 — GA4 events + server-side lead tracking
  - EXEC-11: BAI-A11Y-02..05 — focus-visible + alt + ARIA + skip-link
  - EXEC-12: BAI-DESIGN-04/05/06 — line-height + logical props + loading states
- **Phase 3 — P2 (90 يومًا)** — growth + clusters + arch → Production 65% → 80%, Code 82% → 85%
  - EXEC-13: BAI-GROWTH-02 — 5 /lp/* landing pages
  - EXEC-14: BAI-GROWTH-04 — 5 /answer/* AI answer pages
  - EXEC-15: BAI-CONTENT-04/05/07 — PDPL/NCA/ISO content clusters
  - EXEC-16: BAI-ARCH-04 — Split chat.ts + blog/[...slug].astro

---

## ملخص تنفيذي

التقرير v2 يكشف إن الكود فعليًا تحسّن من 55% إلى 70% بعد تنفيذ 79 برومبت من MiniMax Code M3. لكن الإنتاج ما تحرك من 15% لأن المالك ما ضغط `git push` ولا مرة. كل التحسينات محبوسة في `main` محليًا.

**الحل الجذري**: خطوة واحدة (`BAI-DEPLOY-12`) ترفع الإنتاج من 15% إلى 55% فورًا. بعدها المتبقى تحسين تدريجي.

**الفجوات المتبقية بعد 79 برومبت**:
1. `BAI-DEPLOY-12` — الحاسم — commit + push + deploy + purge
2. `BAI-SEC-13` — Gemini API key مكشوف في brain.md:3352
3. `BAI-CONTENT-08` — المؤسس اسمه "يزيد" بس (لا familyName، لا image، لا description)
4. `BAI-SEC-21` — brain.md (1.2MB) في الريبو العام يحوي أسرار
5. `BAI-SEC-18 Phase 2` — 7 kernel inline scripts باقية بدون CSP nonce/hash
6. `BAI-ARCH-01` — lint:legacy = echo (ESLint معطّل)
7. `BAI-DESIGN-02` — contrast 3.8:1 مكسور (AA يتطلب 4.5:1)
8. `BAI-DESIGN-03` — trust badges مفقودة على hero
9. `BAI-CONTENT-02` — /customers/ صفحات فارغة بدون أسماء عملاء
10. `BAI-GROWTH-02/04` — /lp/* و /answer/ ما موجودين

---

# Phase 1 — P0 (48 ساعة)
## Production 15% → 55% | Code 70% → 75%

---

## PROMPT [ID: EXEC-01] — BAI-DEPLOY-12: commit + push + Render deploy + Cloudflare purge

**Priority:** P0 |
**Effort:** 0.25h |
**Impact:** Production 15% → 55% (+40 points) |
**Risk:** L |
**Depends on:** — |
**Blocks:** كل البرومبتات الباقية (هذا يحرّر 30 برومبت تنفّذت كودًا للإنتاج)

**CONTEXT** — الكود في `main` محليًا تحسّن 15+ نقطة لكن الإنتاج ما تحرك. `brightai.site` يخدم بناء 24-07-2026 19:43:14 UTC. كل التحسينات (CSP strict Phase 1, hreflang bidirectional, BAI-PROC-12 gate, GSC workflow, Lighthouse CI, 6 SDAIA مقالات, 9 blog مقالات ممتدة, self-hosted fonts, redirect fix, a11y scan 0 violations) محبوسة في working directory. `brain.md:18` يمنع agent من commit. المالك لازم يلتزم بنفسه.

**FILES IN SCOPE** — لا تعديل ملفات — هذا برومبت تشغيلي (operational)

**MUST NOT TOUCH / PRESERVE** — كل ملفات `src/`, `public/`, `scripts/` كما هي (التحسينات موجودة)

**TASK** —
1) تأكد إن working directory نظيف: `git status` → لا uncommitted changes ضارة
2) Stage كل التغييرات: `git add -A`
3) Commit: `git commit -m "feat(v2-deploy): deploy 30 executed prompts to production

- CSP strict Phase 1 (per-file SHA-256 hashes)
- hreflang /en/ bidirectional fix
- BAI-PROC-12 verified-production gate
- GSC weekly export workflow
- Lighthouse CI gate
- 6 SDAIA cluster articles
- 9 extended blog articles
- Self-hosted IBM Plex Sans Arabic fonts
- Redirect fix (206 entries in astro.config.mjs)
- a11y scan: 0 critical violations on 13 pages

Closes: BAI-DEPLOY-12"`
4) Push: `git push origin main`
5) انتظر Render auto-deploy (5-10 دقائق) — راقب Render dashboard
6) Cloudflare purge: `pnpm run cloudflare:purge -- --all`
7) تحقق: `pnpm run verify:production`

**ACCEPTANCE CRITERIA** —
1) `git log --oneline -1` → يظهر commit جديد
2) `curl -I https://brightai.site/` → `last-modified` تغيّر عن `Fri, 24 Jul 2026 19:43:14 UTC`
3) `curl -s https://brightai.site/api/health/` → 200 JSON `{ok: true, commit, buildTime}`
4) `curl -I https://brightai.site/frontend/server.js` → 404 (not 200)
5) `curl -I https://brightai.site/` → `Strict-Transport-Security` + `Content-Security-Policy` headers موجودة
6) `curl -I https://brightai.site/blog` → 301 (not 404)
7) `pnpm run verify:production` → exit 0

**VERIFICATION COMMANDS**
```bash
# 1. Commit exists
git log --oneline -1

# 2. Production updated
curl -sI https://brightai.site/ | grep -i 'last-modified'

# 3. Health endpoint
curl -s https://brightai.site/api/health/ | jq .

# 4. No frontend leakage
curl -sI https://brightai.site/frontend/server.js | head -1

# 5. Security headers
curl -sI https://brightai.site/ | grep -iE 'strict-transport|content-security'

# 6. Redirect works
curl -sI https://brightai.site/blog | head -1

# 7. Full verification
pnpm run verify:production
```

**ROLLBACK** — `git revert HEAD && git push origin main` (Render auto-deploy يعيد البناء السابق)

**DEFINITION OF DONE** — `last-modified` على https://brightai.site/ تغيّر + كل probes في `verify:production` تمر + 7 تقارير تُحدّث لـ `verified_production: yes` مع commit SHA.

---


---

## PROMPT [ID: EXEC-11] — BAI-A11Y-02..05: focus-visible + alt + ARIA + skip-link

**Priority:** P1 |
**Effort:** 8h |
**Impact:** a11y 5+ points |
**Risk:** L |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — a11y scan الحالي: 0 critical + 0 serious على 13 صفحة (بناء قديم). لكن بعد deploy الجديد، لازم نأكد إن:
- كل interactive element له `:focus-visible` styling (≥ 2px outline)
- كل `<img>` له `alt` (descriptive أو `alt=""` للزخرفي)
- كل icon-only button له `aria-label`
- skip link موجود في كل صفحة

**FILES IN SCOPE** — `src/styles/base.css` (focus-visible styles), `src/components/*.astro` (alt + aria-label + skip-link), `src/layouts/BaseLayout.astro` (skip-link)

**MUST NOT TOUCH / PRESERVE** — التصميم البصري (فقط أضف focus states)

**TASK** —
1) في `base.css`: أضف `*:focus-visible { outline: 2px solid var(--interactive-primary); outline-offset: 2px; }`
2) في `BaseLayout.astro`: أضف skip link `<a href="#main-content" class="skip-to-content">تخطي إلى المحتوى</a>` في أول `<body>`
3) `grep -rn '<img' src/` → احصر كل صور + تأكد كل واحدة لها `alt`
4) `grep -rn '<button' src/` → احصر كل button + تأكد كل icon-only button له `aria-label`
5) اختبر بـ axe-core: 0 critical + 0 serious violations
6) اختبر keyboard nav: Tab يمر بكل interactive elements بترتيب منطقي

**ACCEPTANCE CRITERIA** —
1) `grep -rn 'skip-to-content' src/layouts/BaseLayout.astro` → موجود
2) `grep -rn ':focus-visible' src/styles/base.css` → موجود
3) axe-core audit → 0 critical + 0 serious
4) Lighthouse Accessibility ≥ 95
5) Keyboard nav test: Tab يصل لكل interactive element

**VERIFICATION COMMANDS**
```bash
grep -rn 'skip-to-content' src/layouts/BaseLayout.astro
grep -rn ':focus-visible' src/styles/base.css
# Playwright: axe-audit.mjs على 5 صفحات
# Playwright: keyboard-nav test
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — skip-link + focus-visible + alt text + aria-label على كل interactive elements + axe-core 0 violations + Lighthouse a11y ≥ 95.

---

## PROMPT [ID: EXEC-12] — BAI-DESIGN-04/05/06: line-height + logical props + loading states

**Priority:** P1 |
**Effort:** 15h |
**Impact:** Design 8+ points |
**Risk:** M |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — ثلاث مشاكل تصميم:
- BAI-DESIGN-04: line-height للنص العربي غير محسّن (1.4 بدل 1.6 للـ body)
- BAI-DESIGN-05: بعض CSS يستخدم `margin-left`/`right` بدل `margin-inline-start`/`end` (يكسر RTL)
- BAI-DESIGN-06: loading states ناقصة (skeletons / spinners للـ forms + API calls)

**FILES IN SCOPE** — `src/styles/base.css` (line-height), `src/styles/*.css` (logical props), `src/components/*.astro` (loading states)

**MUST NOT TOUCH / PRESERVE** — التصميم البصري العام

**TASK** —
1) في `base.css`: `body { line-height: 1.6; }` للنص العربي (1.7 للـ headings)
2) `grep -rn 'margin-left\|margin-right\|padding-left\|padding-right' src/styles/` → استبدل بـ `margin-inline-start/end` + `padding-inline-start/end`
3) `grep -rn 'text-align: left\|text-align: right' src/styles/` → استبدل بـ `text-align: start`
4) أضف skeleton loaders لـ LeadForm + KernelAiAssistant + demo
5) أضف spinner لـ API calls (chat, lead submit)
6) اختبر RTL: `curl / | grep 'dir="rtl"'` + Playwright verify-rtl.mjs

**ACCEPTANCE CRITERIA** —
1) `grep -rn 'margin-left\|margin-right' src/styles/` → 0 نتائج
2) `grep -rn 'text-align: left\|text-align: right' src/styles/` → 0 نتائج
3) `grep -rn 'line-height: 1.6' src/styles/base.css` → موجود
4) Playwright verify-rtl.mjs → pass
5) كل forms تحوي loading state (skeleton/spinner)

**VERIFICATION COMMANDS**
```bash
grep -rn 'margin-left\|margin-right' src/styles/  # should be empty
grep -rn 'text-align: left\|text-align: right' src/styles/  # should be empty
grep -rn 'line-height: 1.6' src/styles/base.css
# Playwright: verify-rtl.mjs
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — صفر `margin-left/right` + صفر `text-align: left/right` + line-height 1.6 + loading states على كل forms + RTL audit pass.

---

# Phase 3 — P2 (90 يومًا)
## Production 65% → 80% | Code 82% → 85%

---

## PROMPT [ID: EXEC-13] — BAI-GROWTH-02: 5 /lp/* landing pages

**Priority:** P2 |
**Effort:** 16h |
**Impact:** Saudi Visibility 6+ points |
**Risk:** M |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — `ls src/pages/lp/` → `No such file or directory`. صفحات هبوط تجارية ترفع conversion + SEO لـ keywords تجارية سعودية.

**FILES IN SCOPE** — `src/pages/lp/pdpl-assessment/index.astro` (جديد), `src/pages/lp/iso-42001-readiness/index.astro` (جديد), `src/pages/lp/nca-ecc-audit/index.astro` (جديد), `src/pages/lp/ai-firewall-demo/index.astro` (جديد), `src/pages/lp/banking-ai-governance/index.astro` (جديد)

**MUST NOT TOUCH / PRESERVE** — — 

**TASK** —
1) لكل `/lp/`: اكتب 1500+ كلمة focused على commercial keyword
2) CTA prominent (form + WhatsApp)
3) Schema `Service` + `FAQPage`
4) أضف لـ sitemap
5) أضف cross-links من `/solutions/` المقابلة
6) اختبر: `curl /lp/pdpl-assessment/` → 200

**ACCEPTANCE CRITERIA** —
1) `curl -s -o /dev/null -w '%{http_code}' https://brightai.site/lp/pdpl-assessment/` → 200
2) `curl -s https://brightai.site/sitemap.xml | grep -c '/lp/'` → 5
3) GSC بعد 30 يوم: 3 `/lp/*` crawled

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/lp/pdpl-assessment/
curl -s https://brightai.site/sitemap.xml | grep -c '/lp/'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 5 صفحات `/lp/*` في sitemap + 200 OK + Service + FAQPage schema، مُتحقَّق بـ curl + sitemap.xml.

---

## PROMPT [ID: EXEC-14] — BAI-GROWTH-04: 5 /answer/* AI answer pages

**Priority:** P2 |
**Effort:** 16h |
**Impact:** AEO readiness 5+ points |
**Risk:** M |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — `ls src/pages/answer/` → `No such file or directory`. صفحات إجابات مباشرة لمحركات AI (Perplexity, ChatGPT, Gemini). AEO (Answer Engine Optimization).

**FILES IN SCOPE** — `src/pages/answer/what-is-ai-governance-saudi/index.astro` (جديد), `src/pages/answer/how-to-comply-with-pdpl/index.astro` (جديد), `src/pages/answer/what-are-nca-ecc-controls/index.astro` (جديد), `src/pages/answer/sdaia-generative-ai-guidelines/index.astro` (جديد), `src/pages/answer/iso-42001-saudi/index.astro` (جديد)

**MUST NOT TOUCH / PRESERVE** — — 

**TASK** —
1) لكل `/answer/`: اكتب 800-1200 كلمة بصيغة Q&A مباشرة
2) الفقرة الأولى (40-50 كلمة) تحوي الإجابة المباشرة (quote-able)
3) Schema `FAQPage` + `Speakable`
4) أضف لـ sitemap
5) أضف cross-links لـ `/blog/` و `/solutions/` المقابلة
6) اختبر: `curl /answer/what-is-ai-governance-saudi/` → 200

**ACCEPTANCE CRITERIA** —
1) `curl -s -o /dev/null -w '%{http_code}' https://brightai.site/answer/what-is-ai-governance-saudi/` → 200
2) `curl -s https://brightai.site/sitemap.xml | grep -c '/answer/'` → 5
3) `curl -s https://brightai.site/answer/what-is-ai-governance-saudi/ | grep -c 'FAQPage'` → 1+
4) `curl -s https://brightai.site/answer/what-is-ai-governance-saudi/ | grep -c 'Speakable'` → 1+

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/answer/what-is-ai-governance-saudi/
curl -s https://brightai.site/sitemap.xml | grep -c '/answer/'
curl -s https://brightai.site/answer/what-is-ai-governance-saudi/ | grep -c 'FAQPage'
curl -s https://brightai.site/answer/what-is-ai-governance-saudi/ | grep -c 'Speakable'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 5 صفحات `/answer/*` مع `FAQPage` + `Speakable` schema + 200 OK، مُتحقَّق بـ curl + grep.

---

## PROMPT [ID: EXEC-15] — BAI-CONTENT-04/05/07: PDPL/NCA/ISO content clusters

**Priority:** P2 |
**Effort:** 48h |
**Impact:** Saudi Visibility 8+ points |
**Risk:** L |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — SDAIA cluster نُفّذ (6 مقالات). لكن PDPL + NCA + ISO clusters ما نُفّذت. كل cluster = 8 مقالات (pillar + 7 spokes) حول محور امتثال سعودي.

**FILES IN SCOPE** — `src/content/blog/pdpl-*.md` (8 جديد), `src/content/blog/nca-*.md` (8 جديد), `src/content/blog/iso-42001-*.md` (8 جديد)

**MUST NOT TOUCH / PRESERVE** — existing blog content

**TASK** —
1) لكل cluster (PDPL, NCA, ISO): اكتب 8 مقالات
   - 1 pillar article (2500+ كلمة)
   - 7 spoke articles (1200-1500 كلمة كل واحد)
2) كل مقال: schema `Article` + `BreadcrumbList` + author
3) hub-and-spoke linking: pillar يربط لـ spokes + spokes ترجع لـ pillar
4) أضف لـ sitemap
5) اختبر: `curl /blog/pdpl-complete-guide/` → 200

**ACCEPTANCE CRITERIA** —
1) `find src/content/blog/ -name 'pdpl-*.md' | wc -l` → 8
2) `find src/content/blog/ -name 'nca-*.md' | wc -l` → 8
3) `find src/content/blog/ -name 'iso-42001-*.md' | wc -l` → 8
4) `curl -s https://brightai.site/sitemap.xml | grep -c '/blog/pdpl'` → 8
5) GSC بعد 90 يوم: 50% من cluster مقالات crawled + indexed

**VERIFICATION COMMANDS**
```bash
find src/content/blog/ -name 'pdpl-*.md' | wc -l
find src/content/blog/ -name 'nca-*.md' | wc -l
find src/content/blog/ -name 'iso-42001-*.md' | wc -l
curl -s https://brightai.site/sitemap.xml | grep -c '/blog/pdpl'
```

**ROLLBACK** — `git revert HEAD` (احذف المقالات الجديدة)

**DEFINITION OF DONE** — 24 مقالة (3 clusters × 8) + hub-and-spoke linking + sitemap + GSC indexing، مُتحقَّق بـ find + curl + GSC.

---

## PROMPT [ID: EXEC-16] — BAI-ARCH-04: Split chat.ts + blog/[...slug].astro

**Priority:** P3 |
**Effort:** 16h |
**Impact:** Maintainability 3+ points |
**Risk:** M |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — `src/pages/api/ai/chat.ts` = 1290 سطرًا (SSE + chat-session + quota + firewall + usage tracking). `src/pages/blog/[...slug].astro` = 590 سطرًا. ملفات كبيرة = صعوبة صيانة.

**FILES IN SCOPE** — `src/pages/api/ai/chat.ts` (split into modules), `src/pages/blog/[...slug].astro` (split into components)

**MUST NOT TOUCH / PRESERVE** — existing logic + URL structure

**TASK** —
1) `chat.ts`: استخرج SSE handler, chat-session, quota check, firewall call, usage tracking إلى modules في `src/lib/chat/`
2) `blog/[...slug].astro`: استخرج TOC, RelatedPosts, ShareButtons, FAQ section إلى components
3) اختبر: `pnpm run build` + `curl /api/ai/chat POST` → 200 + `curl /blog/<slug>/` → 200

**ACCEPTANCE CRITERIA** —
1) `wc -l src/pages/api/ai/chat.ts` → ≤ 300
2) `wc -l src/pages/blog/[...slug].astro` → ≤ 300
3) `curl -sX POST https://brightai.site/api/ai/chat -H 'Origin: https://brightai.site' -d '{"message":"test"}'` → 200
4) `curl -s https://brightai.site/blog/<any-slug>/` → 200

**VERIFICATION COMMANDS**
```bash
wc -l src/pages/api/ai/chat.ts
wc -l src/pages/blog/\[...slug\].astro
curl -sX POST https://brightai.site/api/ai/chat -H 'Origin: https://brightai.site' -d '{"message":"test"}' | head -c 100
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — `chat.ts` و `blog/[...slug].astro` ≤ 300 سطر كل واحد + logic محفوظ + 200 OK، مُتحقَّق بـ wc + curl.

---

# Execution Order — Phases 1→3

| Phase | البرومبتات | الجهد | الأثر التراكمي | المدة |
|-------|-----------|-------|----------------|-------|
| **Phase 1 — P0** (deploy + secure + identity) | EXEC-01, 02, 03, 04 | ~4h | Production 15% → 55%, Code 70% → 75% | 48 ساعة |
| **Phase 2 — P1** (CI gates + content + UX + a11y) | EXEC-05..12 | ~57h | Production 55% → 65%, Code 75% → 82% | أسبوعان |
| **Phase 3 — P2** (growth + clusters + arch) | EXEC-13..16 | ~96h | Production 65% → 80%, Code 82% → 85% | 90 يومًا |
| **مراقبة** (tuning أسبوعي) | GSC monitoring + tuning | ~10h/أسبوع | 80% → 85% (السقف) | مستمر |

**ملاحظة الترتيب:**
1. EXEC-02 (تدوير المفتاح) + EXEC-03 (Founder name) + EXEC-04 (brain.md removal) — تُنفّذ قبل EXEC-01 (deploy) عشان ما ننشر الأسرار
2. EXEC-01 (deploy) — يحرّر كل الإصلاحات للإنتاج
3. EXEC-05..12 — تُنفّذ بالتوازي (مجالات مختلفة)
4. EXEC-13..16 — تُنفّذ بالتوازي (مجالات مختلفة)

**القاعدة الذهبية:** EXEC-01 هو المفتاح. خطوة واحدة ترفع الإنتاج من 15% إلى 55%. كل الباقي تحسين تدريجي بعدها.