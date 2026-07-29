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

## PROMPT [ID: EXEC-02] — BAI-SEC-13: Gemini API key rotation + deletion from brain.md

**Priority:** P0 |
**Effort:** 1h |
**Impact:** Security 10+ points |
**Risk:** M |
**Depends on:** — (يُنفّذ قبل EXEC-01 عشان ما ننشر المفتاح) |
**Blocks:** — 

**CONTEXT** — `.agents/brain.md:3352` يحوي المفتاح الحقيقي `AIzaSyC3pLdZ7R2XlvPFTZ8Alg93zkuThHbQYM` منذ شهور. المفتاح رجع `CONSUMER_SUSPENDED` يعني معطّل لكن القيمة مكشوفة في الريبو العام. هذا تسريب أمني فعلي.

**FILES IN SCOPE** — `.agents/brain.md` (احذف القيمة + استبدل بـ `process.env.GEMINI_API_KEY`), `render.yaml` (أضف env var)

**MUST NOT TOUCH / PRESERVE** — باقي محتوى brain.md (قرارات + تاريخ)

**TASK** —
1) Google AI Studio → API keys → أنشئ مفتاح جديد
2) احذف المفتاح القديم `AIzaSyC3pLdZ7R2XlvPFTZ8Alg93zkuThHbQYM`
3) Render dashboard → Environment → أضف `GEMINI_API_KEY=<new-key>`
4) في `brain.md:3352`: استبدل القيمة بـ `process.env.GEMINI_API_KEY`
5) أضف pre-commit hook يفحص أنماط حساسة في brain.md
6) تحقق: `grep -r 'AIza' .agents` → 0 نتائج

**ACCEPTANCE CRITERIA** —
1) `grep -rn 'AIza' .agents/` → 0 نتائج
2) `grep -rn 'AIzaSyC3pLdZ' .` → 0 نتائج (في كل الريبو)
3) Render env vars يحوي `GEMINI_API_KEY`
4) pre-commit hook موجود ويعمل

**VERIFICATION COMMANDS**
```bash
grep -rn 'AIza' .agents/  # should be empty
grep -rn 'AIzaSyC3pLdZ' .  # should be empty
cat .git/hooks/pre-commit | grep -c 'AIza'  # pre-commit hook exists
```

**ROLLBACK** — استعد القيمة من `git show HEAD~1:.agents/brain.md` (لكن لا تنشرها)

**DEFINITION OF DONE** — صفر `AIza` في `.agents/` + مفتاح جديد في Render env vars + pre-commit hook يفحص الأنماط الحساسة.

---

## PROMPT [ID: EXEC-03] — BAI-CONTENT-08: Founder full name + CR number in JSON-LD

**Priority:** P0 |
**Effort:** 2h |
**Impact:** E-E-A-T 8+ points |
**Risk:** L |
**Depends on:** — |
**Blocks:** — 

**CONTEXT** — `src/data/schema-helpers.ts:68` يحوي `name: 'يزيد'` بس — لا `familyName`، لا `image`، لا `description`. البنوك السعودية ما تتعامل مع كيان مجهول. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) يتطلب هوية كاملة.

**FILES IN SCOPE** — `src/data/schema-helpers.ts` (أضف familyName + image + description), `src/components/Footer.astro` (أضف CR number)

**MUST NOT TOUCH / PRESERVE** — العنوان + رقم WhatsApp الموجودين في schema

**TASK** —
1) في `schema-helpers.ts:68`: غيّر `name: 'يزيد'` → `name: 'يزيد الشريف'` (أو الاسم الصحيح)
2) أضف `familyName: 'الشريف'`
3) أضف `image: '/assets/images/founder-yazeed.jpg'` (صورة حقيقية)
4) أضف `description: 'سيرة ذاتية مختصرة 100-200 كلمة'`
5) في `Footer.astro` + schema: أضف رقم السجل التجاري (CR)
6) تأكد JSON-LD valid: [Rich Results Test](https://search.google.com/test/rich-results)

**ACCEPTANCE CRITERIA** —
1) `grep -n 'familyName' src/data/schema-helpers.ts` → موجود
2) `grep -n 'image.*founder' src/data/schema-helpers.ts` → موجود
3) `grep -n 'description' src/data/schema-helpers.ts` → موجود
4) Rich Results Test → Person schema valid
5) `curl / | grep -c 'السجل التجاري'` → 1+ (CR number في footer)

**VERIFICATION COMMANDS**
```bash
grep -n 'familyName\|image.*founder\|description' src/data/schema-helpers.ts
curl -s https://brightai.site/ | grep -c 'السجل التجاري'
# Rich Results Test: https://search.google.com/test/rich-results?url=https://brightai.site/
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — Person schema يحوي name + familyName + image + description + CR number في footer، مُتحقَّق بـ grep + Rich Results Test.

---

## PROMPT [ID: EXEC-04] — BAI-SEC-21: Remove brain.md from public repo

**Priority:** P0 |
**Effort:** 1h |
**Impact:** Security 8+ points |
**Risk:** M |
**Depends on:** EXEC-02 (تدوير المفتاح أولًا) |
**Blocks:** — 

**CONTEXT** — `.agents/brain.md` حجمه 1.2MB ويحوي قرارات معمارية + أسرار + ملاحظات داخلية. يجب يكون private. وجوده في الريبو العام خطر أمني + يلوّث الريبو.

**FILES IN SCOPE** — `.agents/brain.md` (انقل لـ private repo أو gitignore), `.gitignore` (أضف `.agents/`)

**MUST NOT TOUCH / PRESERVE** — محتوى brain.md (انقله كامل)

**TASK** —
1) أنشئ private repo منفصل: `brightai-internal` (أو استخدم GitHub Gist private)
2) انقل `.agents/brain.md` للمستودع الخاص
3) في `.gitignore`: أضف `.agents/`
4) `git rm --cached .agents/brain.md` (أزله من tracking)
5) commit + push
6) تأكد إن brain.md ما يظهر في GitHub: `curl -s https://github.com/YEEEAE/BRIGHTAI/blob/main/.agents/brain.md` → 404

**ACCEPTANCE CRITERIA** —
1) `curl -sI https://github.com/YEEEAE/BRIGHTAI/blob/main/.agents/brain.md` → 404
2) `grep '.agents/' .gitignore` → موجود
3) `git ls-files .agents/` → فارغ
4) المستودع الخاص يحوي brain.md

**VERIFICATION COMMANDS**
```bash
curl -sI https://github.com/YEEEAE/BRIGHTAI/blob/main/.agents/brain.md | head -1
grep '.agents/' .gitignore
git ls-files .agents/
```

**ROLLBACK** — `git revert HEAD` + استرجع brain.md من المستودع الخاص

**DEFINITION OF DONE** — brain.md غير موجود في الريبو العام + موجود في مستودع خاص + `.gitignore` يحوي `.agents/`.

---

# Phase 2 — P1 (أسبوعان)
## Production 55% → 65% | Code 75% → 82%

---

## PROMPT [ID: EXEC-05] — BAI-SEC-18 Phase 2: 7 kernel scripts CSP nonce/hash migration

**Priority:** P1 |
**Effort:** 10h |
**Impact:** Security 7+ points |
**Risk:** M |
**Depends on:** EXEC-01 (deploy أولًا) |
**Blocks:** — 

**CONTEXT** — Phase 1 (5 migrations) done. Phase 2 باقية: 7 kernel inline scripts بدون CSP nonce/hash. الـ scripts:
- `chat.astro` (~360 سطر inline script)
- `audit.astro` (~150 سطر)
- `approvals.astro` (~100 سطر)
- `policies.astro` (~100 سطر بـ `define:vars` 4 vars)
- `scenarios.astro` (~200 سطر بـ `define:vars` 1 var)
- `KernelAiAssistant.astro` (~450 سطر API integration)
- `KernelLeadForm.astro` (~150 سطر form validation)

**FILES IN SCOPE** — `src/pages/kernel/chat.astro`, `src/pages/kernel/audit.astro`, `src/pages/kernel/approvals.astro`, `src/pages/kernel/policies.astro`, `src/pages/kernel/scenarios.astro`, `src/components/kernel/KernelAiAssistant.astro`, `src/components/kernel/KernelLeadForm.astro`, `public/js/kernel-*.js` (جديد), `scripts/security-headers.mjs` (أزل `'unsafe-inline'` من script-src)

**MUST NOT TOUCH / PRESERVE** — منطق الكود (فقط انقل inline → external)

**TASK** —
1) لكل inline script: انقله لـ `public/js/kernel-<name>.js`
2) استبدل `define:vars` بـ `<script type="application/json">` data blocks
3) في الـ Astro component: استبدل `<script>` بـ `<script src="/js/kernel-<name>.js" defer></script>`
4) بعد كل 7 migrations: في `scripts/security-headers.mjs` احذف `'unsafe-inline'` من `script-src`
5) اختبر كل صفحة: `curl /kernel/chat/` → 200 + console 0 errors
6) اختبر CSP: `curl -I /kernel/chat/` → `Content-Security-Policy` ما يحوي `unsafe-inline`

**ACCEPTANCE CRITERIA** —
1) `grep -rn 'unsafe-inline' scripts/security-headers.mjs` → 0 في script-src
2) `grep -rn '<script>' src/pages/kernel/*.astro src/components/kernel/*.astro` → 0 inline scripts
3) `curl -sI https://brightai.site/kernel/chat/ | grep -oP 'script-src [^;]+'` → ما يحوي `unsafe-inline`
4) كل صفحات kernel تفتح بدون console errors

**VERIFICATION COMMANDS**
```bash
grep -rn 'unsafe-inline' scripts/security-headers.mjs
grep -rn '<script>' src/pages/kernel/*.astro src/components/kernel/*.astro
curl -sI https://brightai.site/kernel/chat/ | grep -oP 'script-src [^;]+'
# Playwright: capture-console-errors.mjs على كل صفحات kernel
```

**ROLLBACK** — `git revert HEAD` (أعد `'unsafe-inline'` لـ script-src)

**DEFINITION OF DONE** — صفر `unsafe-inline` في script-src + صفر inline scripts في kernel + كل صفحات kernel تشتغل بدون console errors.

---

## PROMPT [ID: EXEC-06] — BAI-ARCH-01: ESLint activation (remove lint:legacy echo)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** Code quality 5+ points |
**Risk:** M |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — `package.json:55-56`: `lint:legacy` + `lint:fix` = `echo 'Linting skipped for static site'`. `eslint.config.mjs` يتجاهل 80% من الكود (scripts/, dist/, .agents/, kernel/, public/). CI ما يفشل عند lint errors.

**FILES IN SCOPE** — `package.json` (أزل lint:legacy + lint:fix), `eslint.config.mjs` (وسّع files ليشمل scripts/**), `.github/workflows/ci-build-guard.yml` (أضف lint required check)

**MUST NOT TOUCH / PRESERVE** — existing ESLint rules

**TASK** —
1) أزل `lint:legacy` + `lint:fix` من `package.json`
2) في `eslint.config.mjs`: أزل `scripts/**` من ignores
3) شغّل `pnpm lint` → احصر الأخطاء
4) أصلح الأخطاء (أو أضف `// eslint-disable-next-line` مع تعليق السبب)
5) أضف `pnpm lint` لـ CI كـ required check
6) اختبر: `pnpm lint` → 0 errors

**ACCEPTANCE CRITERIA** —
1) `grep -E '"lint:legacy"|"lint:fix"' package.json` → فارغ
2) `pnpm lint` → 0 errors
3) CI workflow يحوي `lint` required check
4) `gh run list --workflow=ci-build-guard.yml --limit=1` → pass

**VERIFICATION COMMANDS**
```bash
grep -E '"lint:legacy"|"lint:fix"' package.json  # empty
pnpm lint 2>&1 | tail -5
gh run list --workflow=ci-build-guard.yml --limit=1
```

**ROLLBACK** — `git revert HEAD` (أعد lint:legacy echo)

**DEFINITION OF DONE** — `lint:legacy` غير موجود + `pnpm lint` = 0 errors + CI required check، مُتحقَّق بـ grep + pnpm lint + gh CLI.

---

## PROMPT [ID: EXEC-07] — BAI-DESIGN-03: Trust badges on hero (SDAIA/NCA/ISO)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** B2B trust 6+ points |
**Risk:** L |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — البنوك السعودية تحتاج ثقة فورية. hero الحالي ما فيه شارات امتثال (SDAIA, NCA, ISO 42001). شارات الامتثال ترفع conversion B2B.

**FILES IN SCOPE** — `src/components/SplitHero.astro` (أضف trust badges row), `public/assets/images/badges/*.svg` (جديد)

**MUST NOT TOUCH / PRESERVE** — نص الـ hero + CTAs (published content)

**TASK** —
1) صمّم 3 SVG badges: SDAIA, NCA ECC, ISO/IEC 42001
2) في `SplitHero.astro`: أضف row تحت CTAs يحوي الـ 3 badges
3) كل badge: `<img src="/assets/images/badges/sdaia.svg" alt="شعار سدايا" width="80" height="80" loading="eager">`
4) styling: `display: flex; gap: var(--space-4); opacity: 0.9`
5) اختبر: `curl / | grep -c 'badges/sdaia'` → 1+

**ACCEPTANCE CRITERIA** —
1) `curl -s https://brightai.site/ | grep -c 'badges/sdaia'` → 1+
2) `curl -s https://brightai.site/ | grep -c 'badges/nca'` → 1+
3) `curl -s https://brightai.site/ | grep -c 'badges/iso'` → 1+
4) Lighthouse Accessibility → badges لها alt text

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c 'badges/sdaia'
curl -s https://brightai.site/ | grep -c 'badges/nca'
curl -s https://brightai.site/ | grep -c 'badges/iso'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 3 trust badges (SDAIA, NCA, ISO) على hero + alt text + 200 OK، مُتحقَّق بـ curl + grep.

---

## PROMPT [ID: EXEC-08] — BAI-DESIGN-02: AA contrast fix (rgba 3.8:1 → 4.5:1+)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** a11y 5+ points |
**Risk:** L |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — `rgba(255,255,255,0.4)` على خلفية داكنة = contrast ratio 3.8:1. WCAG AA يتطلب 4.5:1 للنص العادي. هذا مكسور في عدة مكونات.

**FILES IN SCOPE** — `src/styles/tokens.css` (أضف token للنص الثانوي بـ contrast كافٍ), `src/styles/components.css`, `src/styles/pages.css` (استبدل كل `rgba(255,255,255,0.4)` بـ token)

**MUST NOT TOUCH / PRESERVE** — التصميم البصري العام (فقط ارفع الـ opacity)

**TASK** —
1) `grep -rn 'rgba(255,255,255,0.4)' src/styles/` → احصر كل الاستخدامات
2) في `tokens.css`: أضف `--text-secondary-aa: rgba(255,255,255,0.65)` (contrast 5.2:1)
3) استبدل كل `rgba(255,255,255,0.4)` بـ `var(--text-secondary-aa)`
4) اختبر بـ axe-core: 0 contrast violations
5) اختبر بـ Lighthouse: Accessibility ≥ 95

**ACCEPTANCE CRITERIA** —
1) `grep -rn 'rgba(255,255,255,0.4)' src/styles/` → 0 نتائج
2) axe-core audit → 0 contrast violations
3) Lighthouse Accessibility ≥ 95

**VERIFICATION COMMANDS**
```bash
grep -rn 'rgba(255,255,255,0.4)' src/styles/  # should be empty
# Playwright: axe-audit.mjs على الرئيسية + 3 صفحات داخلية
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — صفر `rgba(255,255,255,0.4)` في styles + axe-core 0 contrast violations + Lighthouse a11y ≥ 95.

---

## PROMPT [ID: EXEC-09] — BAI-CONTENT-02: /customers/ pages merge or delete

**Priority:** P1 |
**Effort:** 4h |
**Impact:** Indexation 5+ points |
**Risk:** M |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — `src/pages/customers/bank|hospital|pharma/` صفحات فارغة = قوالب بدون أسماء عملاء. صفحات فارغة تضر SEO (thin content) + تضر ثقة B2B.

**FILES IN SCOPE** — `src/pages/customers/*.astro` (احذف أو ادمج), `public/_redirects` (أضف 301 للصفحات المحذوفة — يتطلب موافقة)

**MUST NOT TOUCH / PRESERVE** — باقي صفحات الموقع

**TASK** —
1) افحص `src/pages/customers/` — هل فيه أسماء عملاء حقيقية؟
2) لو لا: احذف الصفحات + أضف 301 redirects لـ `/solutions/` المقابلة
3) لو نعم (لكن ناقصة): ادمجها في `/solutions/[sector]/` كـ case studies
4) حدّث sitemap
5) اختبر: `curl /customers/bank/` → 301 (لو حذفت) أو 200 بمحتوى (لو دمجت)

**ACCEPTANCE CRITERIA** —
1) `find src/pages/customers/ -name '*.astro' | wc -l` → 0 (لو حذفت) أو صفحات بمحتوى حقيقي
2) `curl -sI https://brightai.site/customers/bank/` → 301 أو 200 بمحتوى
3) sitemap.xml ما يحوي `/customers/` فارغة
4) GSC بعد 30 يوم: 0 thin content warnings

**VERIFICATION COMMANDS**
```bash
find src/pages/customers/ -name '*.astro' | wc -l
curl -sI https://brightai.site/customers/bank/ | head -1
curl -s https://brightai.site/sitemap.xml | grep -c '/customers/'
```

**ROLLBACK** — `git revert HEAD` + احذف redirects من `_redirects`

**DEFINITION OF DONE** — صفر صفحات `/customers/` فارغة + redirects شغالة أو محتوى حقيقي + sitemap نظيف.

---

## PROMPT [ID: EXEC-10] — BAI-MEAS-01/02: GA4 events + server-side lead tracking

**Priority:** P1 |
**Effort:** 8h |
**Impact:** Measurement 5+ points |
**Risk:** M |
**Depends on:** EXEC-01 |
**Blocks:** — 

**CONTEXT** — GA4 events الحالية = 1130/28 يومًا، 38 منها على صفحة 404. لا يوجد clear event tracking لـ lead/chat/demo. `src/pages/api/lead.ts` ما يستدعي GA4 Measurement Protocol (client fetch فشل = event يُفقد).

**FILES IN SCOPE** — `public/js/analytics.js` (أضف track() calls), `src/components/LeadForm.astro`, `src/components/kernel/KernelAiAssistant.astro`, `src/pages/demo/index.astro`, `src/pages/api/lead.ts` (أضف server-side GA4), `src/lib/ga4-measurement.ts` (جديد)

**MUST NOT TOUCH / PRESERVE** — existing analytics.js structure

**TASK** —
1) في `LeadForm.astro`: عند submit → `analytics.track('lead_started')`، عند نجاح → `analytics.track('lead_completed', {mode})`
2) في `KernelAiAssistant.astro`: عند إرسال message → `analytics.track('chat_started')`، عند reply → `analytics.track('chat_completed')`
3) في `/demo/`: عند فتح → `analytics.track('demo_opened')`
4) أنشئ `src/lib/ga4-measurement.ts` يحوي `sendEvent({client_id, events})`
5) في `lead.ts` بعد enqueue: `sendEvent({events: [{name: 'generate_lead', params: {source, page}}]})`
6) يتطلب `GA4_MEASUREMENT_SECRET` + `GA4_API_SECRET` في Render env vars
7) اختبر: GA4 DebugView → كل event fired

**ACCEPTANCE CRITERIA** —
1) GA4 DebugView: `lead_started` + `lead_completed` fired عند form submit
2) GA4 DebugView: `chat_started` + `chat_completed` fired عند chat
3) GA4 DebugView: `demo_opened` fired عند فتح demo
4) GA4 DebugView: `generate_lead` fired server-side (مع parameter source)
5) GA4 Events report: 5 events مع count > 0

**VERIFICATION COMMANDS**
```bash
# GA4 DebugView (manual):
# 1. افتح /contact/، املأ النموذج، submit → 'lead_completed' + 'generate_lead'
# 2. افتح /kernel/chat/، أرسل message → 'chat_started' + 'chat_completed'
# 3. افتح /demo/ → 'demo_opened'
grep -n 'analytics.track' src/components/LeadForm.astro
grep -n 'sendEvent' src/pages/api/lead.ts
```

**ROLLBACK** — `git revert HEAD` + احذف env vars من Render

**DEFINITION OF DONE** — 5 events (lead_started, lead_completed, chat_started, chat_completed, demo_opened) + server-side generate_lead fired في GA4، مُتحقَّق بـ GA4 DebugView.

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