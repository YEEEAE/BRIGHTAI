## BA-06 — إزالة شهادات العملاء غير المثبتة أو تمييزها بوضوح (P0)

**Phase:** 02 · الثقة والادعاءات
**Files:** `src/pages/demo/index.astro · components referenced by the page`
**Depends on:** BA-00
**Purpose:** لا تنسب قصة توضيحية لبنك أو مستشفى كأنها تجربة حقيقية

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Content integrity reviewer and web implementer.
FINDING: demo/index.astro includes hard-coded comments suggesting representative personas, but the UI presents corresponding quotations as real user experiences.
TASK: Prevent misleading evidence while keeping useful explanatory material.
ACTIONS:
1. Trace testimonial objects, headings, any schema reviews and client/customer references on Demo and other pages.
2. Find verifiable permission/evidence actually held in the repository. Lack of repository evidence does not itself prove the quotes are fabricated; mark them UNSUBSTANTIATED.
3. If source and authorization are not accessible, remove the real-customer framing. Either replace the area with explicitly labeled 'سيناريوهات توضيحية' without customer attribution or omit it cleanly.
4. Remove fabricated reviews or star-rating structured data if any is present; retain genuine examples only when supporting approval can be cited.
5. Keep the rest of the demo catalog/routes unchanged.
ACCEPTANCE: Every purported testimonial has evidence, or the visible page labels the content as a scenario rather than an actual customer endorsement.
```

## BA-07 — مطابقة ادعاءات الاستضافة والسيادة والاحتفاظ بالبيانات للواقع (P0)

**Phase:** 02 · الثقة والادعاءات
**Files:** `src/pages/trust/index.astro · src/pages/en/index.astro · src/pages/index.astro · render.yaml`
**Depends on:** BA-00
**Purpose:** لا تغييرات بنيوية قبل أدلة استضافة الإنتاج

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Cloud security architect and compliance copy reviewer.
FINDING: Marketing pages mention Saudi-only hosting, zero-retention, SLA and strong controls, while Audit Trail descriptions mention retained inputs/outputs. The repository alone does not establish the live customer deployment region or contractual controls.
TASK: Build an evidence-to-claim register and make public wording accurate for each deployment mode.
ACTIONS:
1. Locate every Saudi-region, sovereignty, retention, encryption/HSM, incident response, uptime and 24/7 monitoring claim across Arabic/English pages and structured data.
2. Compare claims with approved documents and real infrastructure configuration only when access exists. Render's published public region list alone must not be treated as proof of this customer's location.
3. Define Cloud, Hybrid, On-prem/Air-gapped separately with actual confirmed locations, subprocessors, metadata retention, request/response retention, backups and logging.
4. If not verified, implement qualified non-absolute language and transparently label deployment options as subject to agreed architecture. Do NOT invent a compliance status or security controls.
5. Harmonize Arabic and English claims, disclaimers and trust center content.
ACCEPTANCE: No unsubstantiated hard promise about Saudi hosting, zero retention, support SLA, AES/HSM or incident timing remains publicly phrased as a guaranteed fact.
```

## BA-08 — مراجعة ترويسات الحماية الفعلية في Render Node (P1)

**Phase:** 03 · الأمن والتشغيل
**Files:** `src/middleware.ts · render.yaml · public/_headers · layouts/head components`
**Depends on:** BA-00
**Purpose:** الاعتماد على HTTP headers الحقيقية لا ملف Static فقط

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: AppSec engineer specializing in Astro SSR on Render.
FINDING: Browser exposed a warning that X-Frame-Options in HTML meta is not an effective HTTP header. Static-site header config may not apply to a Render Node service.
TASK: Repair only confirmed HTTP-header misconfigurations at the effective response layer.
ACTIONS:
1. Identify whether pages are rendered by Astro SSR, prerendered files behind Node, reverse proxy, or another hosting layer. Inspect middleware, deployed config assumptions and any HTML meta security tags.
2. Audit existing CSP, frame-ancestors, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and cookie attributes. Determine whether duplicate/contradictory header definitions exist.
3. Do not assume public/_headers or render.yaml static-site header keys apply to Render Web Services. Use the actual runtime mechanism; preserve CSP sources required by existing images/scripts/forms where justified.
4. Remove or correct ineffective `http-equiv` X-Frame-Options meta and ensure one coherent authoritative mechanism where applicable.
5. Clearly report what cannot be proven without live HTTP response headers or deployment account access. Never claim headers are deployed merely because code changed.
ACCEPTANCE: Source config is internally consistent, the ignored meta approach is eliminated, and live verification steps identify actual header values without invented evidence.
```

## BA-09 — توحيد هوية التواصل التجارية ومصدر جهات الاتصال (P1)

**Phase:** 03 · الأمن والتشغيل
**Files:** `src/pages/contact/index.astro · src/data/site.ts · src/data/marketing.ts · components containing public contact data`
**Depends on:** BA-02
**Purpose:** عنوان بريد مؤسسي واحد ظاهر، دون كسر النماذج

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Product content and frontend engineer.
FINDING: Contact page exposes a personal Gmail while marketing form routing uses info@brightai.live; this undermines contact consistency.
TASK: Centralize the public support/sales identity without changing actual delivery destinations without verification.
ACTIONS:
1. Locate all email/contact/WhatsApp addresses and recipient values across displayed pages, form actions, JSON-LD and site config.
2. Identify the authoritative business address from site-owned configuration or documented approved contact data. Never assume an address works just because it is used in marketing code.
3. Refactor public display to a single canonical source if verified; otherwise redact the personal address from marketing surface in favor of a contact form with explicit fallback (do not fabricate a new mailbox).
4. Keep existing URLs, UTM collection and routing behavior intact unless BA-02 authorized a verified change.
5. Review structured-data contacts to avoid inconsistent entity identity.
ACCEPTANCE: Public contact information is consistent and credible; contact forms still route to an intentionally documented destination.
```

## BA-10 — إعداد خط أساس حقيقي لـ GSC وGA4 للسعودية (P1)

**Phase:** 04 · SEO التقني
**Files:** `audit/seo-growth-2026/ · audit/seo-recovery/ · GSC/GA4 exports or authorized connector`
**Depends on:** BA-00
**Purpose:** لا تخمّن سبب ضعف الزيارات بدون بيانات حديثة

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Saudi-market organic search analyst.
FINDING: Historical repository SEO materials recorded 87 GSC impressions and 0 clicks at an earlier unspecified time window; these are not current traffic measurements. Ahrefs project access previously returned Insufficient plan.
TASK: Establish a dated, verifiable baseline using current authorized Google Search Console and GA4 data, or produce a precise BLOCKED status and the required input list.
ACTIONS:
1. Inspect existing historic artifacts and label historical figures with their exact known provenance, without reusing them as current metrics.
2. If access is available, obtain the last complete 28 days and comparable prior period, filtered by Saudi Arabia, with query, page, impressions, clicks, CTR, avg position, indexed pages, device, and GA4 organic landing/session data.
3. Separate brand from non-brand, informational from commercial queries, and pages already serving Saudi searches from pages with global-only impressions.
4. Produce an ordered opportunity register backed by observed queries, baseline and a specific page owner; never extrapolate from 87 historic impressions.
5. If GSC/GA4 are not connected, do not populate fake zeros: label the metrics NOT AVAILABLE and specify exactly which exports, properties and permissions are required.
6. Do not create new SEO pages or merge content in this prompt.
ACCEPTANCE: A dated baseline with sources exists, or a clean access-dependent blocker with no manufactured conclusions.
```

## BA-11 — فحص Sitemap وRobots وCanonical وHreflang (P1)

**Phase:** 04 · SEO التقني
**Files:** `public/sitemap.xml · sitemap.xml · public/robots.txt · src/components/seo/ · src/pages/**`
**Depends on:** BA-00
**Purpose:** تصحيح التعارضات المثبتة فقط، بدون حذف جماعي

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Technical SEO engineer.
FINDING: Audit observed approximately 264 canonical entries with ~103 blog, ~51 docs, ~20 solutions and bilingual sections; no proven global robots block was identified. Do not assume these counts are unchanged.
TASK: Inspect the CURRENT canonical URL inventory and implement only verifiable crawl/indexation correctness fixes.
ACTIONS:
1. Identify authoritative sitemap generation ownership: static public/sitemap.xml, root sitemap.xml, build plugin, deploy rewrites, or more than one. Detect duplicate serving or out-of-date URLs.
2. Inspect robots rules, status codes in source/routing, canonicals, internal navigation, redirects, and eligible noindex routes (private tools, auth, sandbox/API).
3. Validate hreflang reciprocity for Arabic/English pages that genuinely have equivalents; do not link untranslated or missing counterparts.
4. Correct 404/redirecting/noncanonical sitemap targets, contradictory noindex, malformed XML or duplicates backed by route evidence. Do not mass-remove content merely because it had low historical impressions.
5. Keep submitted XML UTF-8, absolute HTTPS canonical URLs, consistent trailing slash policy, and clear exclusions for non-public tools.
6. Note that runtime HTTP, indexing and Google crawl behavior still require deployment/GSC confirmation.
ACCEPTANCE: One documented authoritative sitemap strategy, valid canonicalization, and evidence-backed exclusions without unexplained loss of indexed commercial pages.
```

## BA-12 — تحليل الصفحات غير المفهرسة ومعالجة أسبابها (P1)

**Phase:** 04 · SEO التقني
**Files:** `GSC Page Indexing export · site routes · redirects · sitemap owner`
**Depends on:** BA-10, BA-11
**Purpose:** نميز المستبعد المقصود عن الأخطاء الحقيقية

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Google indexation diagnostic engineer.
FINDING: Historic records mentioned 207 indexed and 76 excluded, including discovered-not-indexed. They are time-specific and do NOT establish current indexing failures.
TASK: Classify current indexation exclusions and implement only those caused by fixable site issues.
ACTIONS:
1. Read current GSC Page Indexing export if authorized; include exact query date and representative URL evidence for each status bucket.
2. Split statuses into intentional: alternate canonical, legitimate redirect, intentionally noindex, private URLs; and actionable: accidental noindex, internal-link orphan, sitemap mismatch, bad canonical, broken status response.
3. For actionable buckets, inspect the route/component and implement minimal source fixes that preserve search intent and existing links.
4. For 'Discovered - currently not indexed' do not promise instant indexing or treat each URL as a code bug. Diagnose demand, duplication, page value and internal links before recommending content work.
5. If GSC is unavailable, produce an inspection-ready checklist and stop before claiming Google indexed/unindexed counts.
ACCEPTANCE: Every recommended indexation change has a specific live URL, owner, cause and anticipated mechanism; no bulk redirect, deletion, or invented Google outcome.
```

## BA-13 — مراجعة Schema وService Offer وادعاءات النتائج المنسقة (P1)

**Phase:** 04 · SEO التقني
**Files:** `src/pages/index.astro · src/components/seo/Schema.astro · src/pages/pricing/index.astro · FAQ/Service schema implementations`
**Depends on:** BA-05, BA-07, BA-11
**Purpose:** تصحيح السعر 0 إذا العرض ليس مجانيًا

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Structured-data engineer.
FINDING: Homepage `Service` JSON-LD contains an `Offer` with `price: 0` and `priceCurrency: SAR` despite narrative stating enterprise pricing is customized. Past repository comments also record removed fabricated aggregate ratings.
TASK: Make Schema.org markup accurate, consistent and eligible, not just syntactically valid.
ACTIONS:
1. Inventory Organization, LocalBusiness, WebSite, WebPage, Service, Offer, SoftwareApplication, FAQPage, DefinedTermSet and breadcrumbs by exact route and @id.
2. For customized pricing, don't express a paid service as an unconditional free SAR 0 offer. Choose verifiably truthful offer representation or omit unsupported price properties.
3. Remove duplicate/conflicting entities and false LocalBusiness claims for cities without verifiable establishment presence. Keep organization identity and sameAs grounded.
4. Ensure on-page FAQ text matches FAQ structured data exactly in substance; do not claim FAQ rich-result eligibility where Google policy restricts it.
5. No manufactured aggregateRating, customer reviews, credentials, certifications, or unsupported availability.
6. Keep Arabic/English language and canonical URLs coherent in entities.
ACCEPTANCE: All structured data reflect actual page content and supported real-world facts; no 'free' or rating claim is machine-emitted without evidence.
```

## BA-14 — خارطة الكلمات والبحث حسب النية مع منع Cannibalization (P1)

**Phase:** 05 · SEO المحتوى السعودي
**Files:** `audit/seo-recovery/05-SEO-ACTION-QUEUE.md · all solutions/hub/blog routes`
**Depends on:** BA-10, BA-11
**Purpose:** الدمج والتحويل مشروطان بإثبات GSC

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Search-intent architect for Saudi B2B AI governance.
TASK: Build and execute a grounded primary-page-per-intent architecture without destructively merging pages on speculation.
ACTIONS:
1. Audit the existing historical SEO action queue: its 13 possible cannibalization clusters and KEEP/IMPROVE flags are hypotheses, not automatically approved redirects.
2. Using current GSC query+URL data where available, cluster Arabic and bilingual keywords into navigation/comparison/implementation/compliance/education intent. Identify one authoritative landing page per cluster.
3. Mark each candidate cluster KEEP, REFINE, CONSOLIDATE or NEEDS DATA. For each action supply query evidence, current ranking URLs, content overlap and risk.
4. Implement safe non-destructive changes first: distinguish page purpose in H1/title/meta, adjust internal-link anchors, contextual content, improve unique page sections.
5. Do NOT issue bulk 301, delete pages, canonicalize dissimilar intents, or merge English/Arabic pages without current performance and mapping evidence.
6. If GSC is unavailable, implement only low-risk intent clarification and output a decision register waiting for data.
ACCEPTANCE: No two priority commercial pages intentionally target the same dominant intent without a documented rationale; redirects and deletions are evidence-gated.
```

## BA-15 — تحسين الصفحات التجارية الأعلى نية شراء (P1)

**Phase:** 05 · SEO المحتوى السعودي
**Files:** `src/pages/index.astro · src/pages/solutions/ai-governance-platform/* · src/pages/solutions/ai-firewall/* · src/pages/solutions/ai-audit-trail/*`
**Depends on:** BA-05, BA-07, BA-14
**Purpose:** حوكمة الذكاء الاصطناعي وAI Firewall وAudit Trail

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Technical SEO + B2B conversion copy engineer.
TASK: Improve commercial search relevance and clarity for existing pages, without mass-producing new landing pages.
PRIMARY ROUTES: `/`, `/solutions/ai-governance-platform/`, `/solutions/ai-firewall/`, `/solutions/ai-audit-trail/` (confirm actual sources in repo).
ACTIONS:
1. Define one commercial intent and a distinctive title/H1/description per route. Avoid multiple pages pretending to sell the same generic 'AI platform in Saudi Arabia'.
2. Implement evidence-based sections explaining threat/problem, how the product works, concrete feature boundaries, integration requirements, audit evidence sample and buyer-facing FAQ.
3. Replace vague language or absolute 'guarantees' with accurate, reviewed capabilities. If screenshots or proof are unavailable, use explicit illustrative examples, not simulated customer outcomes.
4. Add contextual links from the educational hub and applicable sector pages to these commercial routes, with natural anchor text (not stuffing).
5. Maintain RTL semantics, metadata, canonical, crawlability, existing form/CTA behavior and product scope.
6. Avoid creating new routes until a GSC gap or verified user need justifies them.
ACCEPTANCE: Each route answers a distinct Saudi institutional purchase question, demonstrates verified product value and offers one clearly framed next step.
```

## BA-16 — تنظيم Hub وBlog والربط الداخلي بالمحتوى التجاري (P1)

**Phase:** 05 · SEO المحتوى السعودي
**Files:** `src/pages/hub/ · src/pages/blog/ · src/data/ · audit/seo-recovery/`
**Depends on:** BA-14, BA-15
**Purpose:** People-first content بدل زيادة عدد المقالات

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Information architect and Arabic technical content editor.
TASK: Strengthen the existing governance content cluster and internal linking, prioritizing depth, unique evidence and user intent over page count.
ACTIONS:
1. Inventory actual blog, docs and hub entries; identify the authoritative educational destination for 'حوكمة الذكاء الاصطناعي' and adjacent PDPL / NCA / ISO42001 topics.
2. Identify shallow, duplicative or stale articles from source evidence and, where available, GSC performance, without automatically deleting them.
3. Improve the primary hub page with clear definitions, verifiable regulatory sources, comparison of policy vs technical controls, and examples tied to real features of BRIGHTAI.
4. Add editorial, context-aware links from useful articles to solutions and from solution pages back to the learning hub. Preserve canonical URLs and meaningful navigation.
5. Update stale titles, headings, authorship and publication/review dates only when grounded. Never fake 'last updated', regulatory changes or author credentials.
6. Do not bulk generate SEO filler, city clones, keyword lists or hidden content for bots.
ACCEPTANCE: One useful educational hub supports distinct commercial pages, and every new claim is sourced or clearly scoped.
```

## BA-17 — تحسين التخصص السعودي والصفحات القطاعية بشفافية (P1)

**Phase:** 05 · SEO المحتوى السعودي
**Files:** `src/pages/solutions/banking-ai-governance/* · src/pages/solutions/healthcare-ai-governance/* · trust and legal content`
**Depends on:** BA-07, BA-14
**Purpose:** تموضع واضح للبنوك والصحة دون اعتماد وهمي

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Saudi B2B market and regulatory content specialist.
TASK: Refine existing sector-specific pages so they address real Saudi buyer questions without false local presence or regulatory approval claims.
ACTIONS:
1. Inspect actual banking and healthcare landing pages, metadata, internal links, cited standards and stated capabilities.
2. Replace generic location/sector boilerplate with differentiated workflows: banking AI data governance and human decision approval; healthcare handling of sensitive patient data and audit trail, as supported by product evidence.
3. For PDPL, NCA, SAMA, SDAIA, SFDA and ISO standards, distinguish applicable regulations/guidance from product certification or automatic customer compliance. Link only to authoritative up-to-date sources.
4. Remove implied offices/local business footprints that are not supported by actual company information.
5. Respect sector constraints: never promise data sovereignty, retention or regulatory approval without BA-07 evidence.
6. Preserve product scope and avoid legal advice phrased as guaranteed compliance.
ACCEPTANCE: Each sector route has a distinct credible reason to exist for a Saudi buyer, without unverified endorsements, credentials or location claims.
```

## BA-18 — تقليل أثر DotLottie وحركة الخلفية على الجوال (P2)

**Phase:** 06 · الأداء والتشغيل
**Files:** `src/components/SiteBackground.astro · public animation assets · src/components/SplitHero.astro`
**Depends on:** BA-00
**Purpose:** تحسين حسب قياس فعلي لا حذف عشوائي

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Web performance specialist for Astro, SSR and static marketing routes.
FINDING: SiteBackground contains an idle-deferred Lottie/canvas animation with sizable self-hosted media and WASM; it may affect constrained mobile devices, but no current field CWV measurement was available.
TASK: Audit and make evidence-based improvements without removing the branded experience unnecessarily.
ACTIONS:
1. Read the current animation boot conditions, idle deferral, visibility pause, reduced-motion behavior, cleanup on navigation, and any dependent global background contracts.
2. Inspect actual asset sizes and network/bootstrap order from files; distinguish shipped bytes from loaded-before-LCP bytes.
3. Define a low-cost static alternative for data-saver/reduced-motion/low-power mobile settings where supported; avoid blocking primary content paint with animation initialization.
4. Remove only redundant render work or blocking dependencies confirmed by source; avoid third-party CDN regressions or unsafe CSP changes.
5. Record LCP/INP/CLS targets (LCP <=2.5s, INP <=200ms, CLS <=0.1 at p75) as targets, not achieved results. Mark field results NOT MEASURED unless CrUX/RUM access exists.
ACCEPTANCE: Defer/nonessential animation remains optional, the content and CTA load without it, and performance claims are measured or explicitly unmeasured.
```

## BA-19 — تصحيح README وملفات التهيئة القديمة (P2)

**Phase:** 06 · الأداء والتشغيل
**Files:** `README.md · render.yaml · src/data/site.ts · deployment docs`
**Depends on:** BA-08, BA-11
**Purpose:** Static مقابل Render Node وقياس GA4

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Developer experience and deployment documentation maintainer.
FINDING: The existing README describes a static Render deployment and contains an analytics measurement ID different from the currently used source configuration, while the site uses a Node service for some routes.
TASK: Align operator documentation with actual source-controlled deployment architecture, without making infrastructure changes.
ACTIONS:
1. Verify package manager, Node engine version, Astro output/adapter, actual Render build/start commands, route handling, env variable names and analytics ownership.
2. Fix README and configuration examples to describe the current Node/static hybrid accurately and remove stale or contradictory examples.
3. Explicitly document which headers and redirects are governed by Astro middleware versus proxy/hosting; avoid recommending inert Render Static file conventions for Node web services.
4. Document privacy-sensitive form configuration and minimal secret management notes, without pasting real tokens or production URLs with secrets.
5. Never change GA4 IDs or redirect rules blindly based on documentation drift; verify authoritative production configuration before altering runtime behavior.
ACCEPTANCE: New developers can follow accurate setup instructions, understand safe secrets handling, and distinguish documented config from actually deployed state.
```

## BA-20 — رفع الموثوقية التسويقية وإعداد دليل شواهد مؤسسي (P2)

**Phase:** 07 · النمو والشواهد
**Files:** `trust/solutions/blog content · consent/approval records if available`
**Depends on:** BA-05, BA-06, BA-07, BA-15
**Purpose:** قصص حالة حقيقية فقط بعد موافقة العميل

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: B2B trust and evidence-led growth editor.
TASK: Improve authority and enterprise purchasing confidence through verifiable proof, not marketing superlatives.
ACTIONS:
1. Inventory existing approved public product demonstrations, architecture diagrams, signed approvals, verified certifications, customer references and permitted case studies.
2. Create a structured evidence map linking each enterprise claim to a document, current demo, screenshot of real product UI (only if provided and allowed), or qualified explanation.
3. Improve Trust Center presentation of data-handling model, deployment options, integrations, SLA status and subprocessor declarations ONLY where the facts are verified.
4. Draft new case-study page content only when source and permission exist; otherwise define a ready-to-complete template with clear fields and NO fabricated company, percentage ROI, testimonial, or logo.
5. Provide a shortlist of sensible public-sector, security and industry editorial citation opportunities relevant to Saudi AI governance. Never claim a backlink or partnership was obtained.
ACCEPTANCE: Public proof corresponds to real authorized evidence, and missing evidence is openly tracked rather than filled with invented testimonials.
```

## BA-21 — القياس النهائي ونقل قائمة الإصلاحات إلى حالة قابلة للتتبع (P2)

**Phase:** 07 · النمو والشواهد
**Files:** `changed files from prior prompts · audit master findings (reference)`
**Depends on:** BA-01 through BA-20
**Purpose:** تقرير ختامي صريح بالمكتمل والمحجوب والمتبقي

```text
PROJECT: YEEEAE/BRIGHTAI (Astro 6, Render Node). Work against the currently checked-out repository; confirm the actual HEAD and paths first.
EXECUTION POLICY: Implement the scoped, evidence-backed changes in the local working tree only. NEVER push, commit, create a branch/PR, change GitHub settings, deploy, or mutate production systems. Never expose credentials or personal data. Do not delete unrelated functionality. Keep current Arabic RTL and English routes working.
EFFICIENCY: No Playwright/E2E tests, automated test suites, browser screenshot collection, mass crawling, or long-running agents. Use targeted source inspection, review the diff, and optionally a lightweight build or syntax check only where it adds real value.
EVIDENCE: Treat the 2026 audit as a lead, not an immutable truth. If findings are stale or unsupported, explain and do not force a fix. Never invent GSC/GA4 metrics, customer endorsements, security certifications, hosting regions, performance measurements, or a passing status.
DELIVERY: At completion return (a) what was verified, (b) exact changed paths, (c) evidence-based changes, (d) open blockers, (e) any manual follow-up. Do not output inflated completion percentages.

ROLE: Principal engineer and SEO auditor performing final reconciliation.
TASK: Review implemented changes from previous prompts and produce a rigorous fact-based closure list. This task is audit/reconciliation only: do not use it as an excuse for a sweeping refactor.
ACTIONS:
1. Compare current local diff with the technical/SEO findings ledger. Re-check each code assertion in its final file context.
2. Categorize each task DONE (source implemented), PARTIAL (some source changes), BLOCKED (missing production/account/legal evidence), NOT STARTED, or NOT APPLICABLE (finding invalidated).
3. Keep distinct: implemented in source, deployed to production, measured in GSC/GA4, and approved by legal/compliance. None of those implies the others.
4. Produce a prioritized outstanding-work queue with exact paths, risks, external dependencies and suggested owner.
5. Summarize SEO metrics only with date range, country, source and denominator. If no live data, write NOT AVAILABLE. Do not invent improvement percentages or change a historical baseline into present-day figures.
6. List all significant implementation tradeoffs and anything requiring an authorized live manual check. No automated test suite, screenshots or broad crawler.
ACCEPTANCE: The team can tell exactly what changed, what remains unproven, and what owner/action unlocks the next task. No GitHub push, commit or deployment.
```
