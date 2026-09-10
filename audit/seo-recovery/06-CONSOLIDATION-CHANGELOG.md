# SEO Consolidation — Changelog (Prompt #1)

Date (UTC): 2026-09-10
Mission: reduce the indexable surface to pages that deserve to compete. No blind deletions.
GSC / backlink evidence: **N/A for every decision** (no Search Console export, no backlink tool credentials in this session). All MERGE/NOINDEX/REMOVE calls below use intent + role + uniqueness + internal-link + ownership evidence only — the safest action wins ties.

## 1. Sitemap accounting

- Before: **274** loc (`public/sitemap.xml` + `sitemap.xml`)
- After: **264** loc
- Removed (10, all human-accessible HTTP 200, all `index, follow` in HTML per owner decision — sitemap membership only):
  - `https://brightai.live/500/` (error page)
  - `https://brightai.live/offline/` + `https://brightai.live/kernel/offline/` (PWA fallbacks)
  - `https://brightai.live/thank-you/` (post-form confirmation)
  - `https://brightai.live/go/whatsapp/` (redirect hub, client-side `location.replace`, no `wa.me` href in payload)
  - `https://brightai.live/design/{buttons,cards,colors,forms,typography}/` (internal design-system reference)
- No redirects / redirect sources / non-canonicals were in the sitemap (verified: 0 overlap `redirects.json` × sitemap).
- No `priority`/`changefreq` hacks added (generator never emits them).

## 2. Per-cluster overlap decisions (MERGE executed: 0)

| Cluster | Strongest URL (role) | Overlap pages (role) | Intent | Decision | Why not merge |
|---|---|---|---|---|---|
| AI governance | `/solutions/ai-governance-platform/` (commercial) | `/hub/ai-governance/` (informational pillar: lede+checklist+7 FAQs) | commercial vs informational | KEEP BOTH | فصل نية موثق؛ لا دليل GSC يبرر الدمج |
| حوكمة الذكاء الاصطناعي | `/hub/ai-governance/` (PRIMARY) | platform (commercial), `blog/ai-governance-saudi-arabia` (article) | informational vs commercial vs article | KEEP ALL | pillar-vs-product-vs-article + upward links |
| PDPL / حماية البيانات الشخصية | `/pdpl-statement/` (commercial bottom-funnel) | `docs/pdpl-ai-complete-guide` (deep guide), `docs/pdpl-ai-governance` (practical), `docs/pdpl-chatgpt-data-protection` (tool-specific), `lp/pdpl` (campaign) | mixed, distinct angles | KEEP ALL | 5 زوايا مختلفة، لا تطابق نية مادي |
| NCA ECC / الأمن السيبراني | `docs/nca-ecc-ai-controls` (5559w مرجع) | `nca-ecc-ai-guide` (خطة 90 يومًا 3583w), `nca-ecc-ai-governance` (630w → IMPROVE), `nca-ecc-ai-controls-mapping` (ربط 1353w), `nca-ai-cybersecurity-guidelines` (مسودة 2653w), `answer/nca-ecc-controls` (quick answer), `lp/ecc` (campaign) | informational slices | KEEP ALL | زوايا متمايزة؛ النحيفة تُحسَّن لا تُدمج |
| SDAIA | `docs/sdaia-ai-risk-management-framework` (deep SDAIA-P145) | `hub/sdaia-ai-risk-management` (short) | deep vs short (by design) | KEEP BOTH | تمايز مقصود وموثق + ربط ثنائي |
| SAMA | `solutions/banking-ai-governance/` (sector) | cities riyadh/khobar (local), `lp/banking` (campaign), `answer/ai-banking` (quick→sector), blogs sama-* | sector vs local vs campaign vs quick | KEEP ALL | نية محلية/حملات/إجابات متميزة |
| ISO 42001 | `blog/iso-42001-saudi-implementation-guide/` (P1 owner) | `answer/iso-42001/` (quick 230w), 8 مقالات iso-* فرعية | guide vs quick vs sub-topics | KEEP ALL | owner + دعم، لا تكرار مادي |
| AI Firewall | `solutions/ai-firewall/` (commercial) | `docs/ai-firewall` (technical), answers ×2 (quick AR/EN) | product vs technical vs quick | KEEP ALL |dbo أنواع محتوى مختلفة |
| AI risk / إدارة المخاطر | `docs/ai-risk-management/` (guide) | `tools/ai-risk-register/` (interactive tool) | guide vs tool | KEEP BOTH | نوعان مختلفان (دليل × أداة) |
| data governance / حوكمة البيانات | `blog/ndmo-data-governance-saudi/` (owner) | `/blog/` (hub index) | leaf vs hub | KEEP BOTH | hub-vs-leaf، ليست مكررة |
| city pages (6) | sector parents | banking×2, government×2, healthcare×2 | sector vs local | KEEP ALL | نية محلية + Service-only لغير الرياض |
| category pages (5) | — | blog hubs | hub | KEEP ALL | صفحات تصنيف فهرسية سليمة (ترميز مُوحّد سابقًا) |
| `/hub/**` vs `/blog/**` vs `/answer/**` vs `/docs/**` vs `/solutions/**` vs `/lp/**` | per-cluster owners above | — | template roles: hub=pillar, blog=articles, answer=quick, docs=guides, solutions=product, lp=campaign | KEEP TEMPLATES | أدوار قالبية متمايزة، لا دمج قالبي |
| kernel (20) | — | app pages | product-app | KEEP (قرار مالك سابق: 100% indexable) | خارج نطاق الدمج |

REMOVE executed: **0** (every removed-from-sitemap page has human/product value; nothing qualified).

## 3. Page-by-page actions taken

1. `scripts/generate-sitemap-all-pages.mjs` — `groupRelPath()` يستبعد `500/offline/kernel/offline/thank-you/go/*/design/*` + إسقاط whitelist الـ kernel/offline + إسقاط block الـ SEMRUSH-UNBLOCK. العقد: sitemap = canonical indexable فقط.
2. `src/pages/go/whatsapp.astro` — hreflang ذاتي `ar-SA` + `x-default` (إصلاح canonical-mismatch/missing-xdefault) + تحديث التعليق. السلوك والـ GA4 والـ binding كما هي.
3. `public/500.html` — hreflang ذاتي `ar-SA` + `x-default`. المحتوى كما هو.
4. `scripts/hreflang-bidirectional-audit.mjs` — تعميم special-case `/404.html` على `/500.html` (نفس الشكل: static root file). أداة فحص فقط.
5. `src/components/hub/AiGovernancePillar.astro` — رابط سياقي واحد لـ `/tools/ai-governance-controls/` بجانب رابط الـ risk-register (إصلاح orphan الوحيد + unreachable الوحيد).
6. HTML الـ utility العشر: **بدون تغيير** (`index, follow` باقية بقرار المالك) — التغيير عضوية sitemap فقط.
7. `robots.txt`: **بدون تغيير** (valid كما هو؛ `/go/` قابل للجلب).
8. `redirects.json`: **بدون تغيير** (228 كما هي؛ صفر chains/cycles؛ لا دمج جديد = لا 301 جديد).

## 4. Verification (post-build, dist)

- `pnpm build` ✅ exit 0 — sitemap **264** loc، صفر utility داخلها.
- `node scripts/seo-ci-check.mjs` ✅ — 0 أخطاء، 0 تحذيرات، 0 روابط مكسورة من 49,234 مرجعًا.
- `node scripts/hreflang-bidirectional-audit.mjs` ✅ — 0 أخطاء (كانت 4 مسبقة على `/500/` + `/go/whatsapp/`، الآن صفر).
- `node scripts/seo-schema-audit.mjs` ✅ — 64 صفحة.
- `node scripts/check-speakable-schema.mjs` ✅ — 268 صفحة.
- `npm run redirects:check` ✅ exit 0 — chains/cycles/duplicates فارغة.
- `npm run internal-links:audit` ✅ — 0 orphans، 0 broken، depth ≤3.
- `node scripts/qa/check-word-count.mjs` ✅ — 4/4 PASS.
- `pnpm test` ✅ — 38/38.
- Canonical targets return 200: hreflang non-200 = 0 (filesystem-backed) ✅. ملاحظة: `/500/` صفحة خطأ — canonical ذاتي محفوظ عمدًا ولا تُطلب إلا عند الخطأ.
- Owner pages indexable: كل مالكي PRIMARY في sitemap + `index,follow` ✅ (فحص العينة + البوابات).

## 5. Files updated

- `audit/seo-recovery/03-CANNIBALIZATION-MATRIX.csv` — 13 مجموعة + أعمدة `resolution/action_taken/resolution_note` (كلها KEEP، صفر دمج).
- `audit/seo-recovery/04-INDEXATION-PLAN.csv` — 274 صفًا (264 sitemap + 10 utility): KEEP **229** / IMPROVE **35** / REMOVE_FROM_SITEMAP **10** / MERGE **0** / REDIRECT **0** / NOINDEX **0** / REVIEW **0**.
- `audit/seo-recovery/00-BASELINE.md` + `01/02/05` — أُعيد توليدها على واقع 264 (مولد `generate-seo-recovery-control-plane.mjs`).
- ملاحظة: `MASTER-BASELINE-AUDIT.md` ظهر فيها تعديل ضخم من جلسة موازية (ليس من هذه المهمة) — لم تُلمس هنا.

## 6. Open / follow-up (not executed)

- `docs/nca-ecc-ai-governance` (630w) — IMPROVE محتوى في موجة تحريرية لاحقة، لا دمج.
- 24 كلمة VALIDATE_BEFORE_TARGETING (محتوى إنجليزي/تعيين ناقص) — تُحسم ببيانات GSC + محتوى EN.
- قرار الدمج النهائي لأي زوج مستقبلي يشترط GSC (28 يومًا) + equity روابط — صفر دمج اليوم هو القرار الآمن الموثق.
