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