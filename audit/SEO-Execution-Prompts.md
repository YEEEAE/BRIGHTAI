BrightAI — Full SEO / GEO / AEO / Design Execution Prompt Pack

Project: YEEEAE/BRIGHTAI
Site: https://brightai.site
Purpose: تنفيذ كامل توصيات تقرير SEO/GEO/AEO/Technical/Content/Design بدون حذف القيمة الحالية للمشروع أو صناعة بيانات غير حقيقية.
Important: لا تسوي git push ولا تفتح PR ولا تدمج أي تغييرات تلقائيًا. نفّذ محليًا فقط واعرض التغييرات والنتائج للمراجعة.

# 0) قواعد ثابتة لكل البرومبتات

استخدم القواعد التالية مع كل برومبت في هذا الملف:

GLOBAL PROJECT RULES — MUST FOLLOW

Repository:
- YEEEAE/BRIGHTAI
- Work locally only.
- DO NOT git push.
- DO NOT open or merge a PR.
- DO NOT modify production Cloudflare settings unless I explicitly ask you to do so.
- Before editing, inspect the current implementation and reuse the existing architecture/components whenever possible.
- Do not remove valuable existing content, pages, routes, schemas, or features unless the task specifically proves they are redundant and the change is safe.

Language:
- Prompts/instructions/code/comments may be in English.
- ONLY user-facing Arabic website copy should use natural Saudi colloquial Arabic.
- Saudi Arabic must sound professional, trustworthy, B2B, and natural — not exaggerated slang.
- Avoid heavy formal Arabic when a simpler Saudi expression communicates the same idea.
- Keep legal/regulatory names and technical terms precise: PDPL, SDAIA, NCA ECC, ISO/IEC 42001, AI Governance, AI Firewall, Audit Trail, etc.
- English pages should remain professional English unless the task explicitly changes them.
- SEO titles/meta descriptions may use search-friendly Modern Arabic where needed, but visible body copy should follow the Saudi conversational tone rule.

Trust / compliance:
- Never claim BrightAI is certified, regulator-approved, regulator-partnered, or legally guarantees compliance unless the repository contains verifiable evidence.
- Replace absolute claims such as “fully compliant with PDPL/NCA ECC” with safer language such as:
  - “يساعدك تطبق متطلبات PDPL”
  - “مصمم عشان يدعم المواءمة مع NCA ECC”
  - “يساعد فريقك يجهز أدلة الحوكمة والتدقيق”
- Do not invent customer logos, testimonials, statistics, offices, certifications, integrations, partnerships, or regulatory approvals.

SEO:
- One primary search intent per page.
- Prevent keyword cannibalization.
- Keep canonical URLs consistent.
- Maintain correct hreflang/Arabic-English relationships where applicable.
- Preserve structured data unless improving it.
- Avoid thin doorway/location pages.
- Do not create dozens of near-duplicate /answer/ pages.
- Use internal links with descriptive anchors.
- Prefer primary Saudi government/regulator sources when citing regulations.

Design:
- Improve visual quality while preserving performance.
- Premium Saudi enterprise technology aesthetic.
- Strong spacing, clear hierarchy, accessible contrast, consistent cards/buttons/forms.
- No visual clutter.
- Avoid heavy JS animation that damages LCP/INP.
- Motion must respect prefers-reduced-motion.
- Arabic RTL must be first-class, not an afterthought.
- Mobile must be designed intentionally, not merely responsive after desktop.
- Reuse design tokens/components instead of page-specific CSS duplication.

Performance:
- Mobile LCP target: < 2.5s.
- CLS target: < 0.1.
- INP target: < 200ms when field data is available.
- Minimize unused JavaScript, render-blocking resources, redirect chains, and unnecessary client hydration.

Validation:
- Run the repository’s existing lint/type/build/test/SEO/internal-link checks.
- If a test is unavailable, report that explicitly instead of claiming it passed.
- For each task output:
  1. files inspected
  2. files changed
  3. what changed
  4. why
  5. validation run
  6. remaining risks
  7. recommended next prompt

Execution Order

نفّذ البرومبتات بالترتيب. لا تبدأ بإنشاء صفحات جديدة قبل إنهاء الأساس التقني والفهرسة.

# Prompt #1 — Establish a clean baseline before touching SEO

Act as the technical SEO lead for BrightAI.

Goal:
Create a verified baseline of the current repository and live SEO architecture before any optimization.

Inspect:
- src/layouts/BaseLayout.astro
- src/layouts/ArabicLayout.astro
- src/layouts/EnglishLayout.astro
- src/layouts/BlogLayout.astro
- src/components/SEOHead.astro
- src/data/site.ts
- src/data/solutions.ts
- src/styles/base.css
- src/styles/components.css
- public/robots.txt
- public/llms.txt
- public/llms-full.txt
- public/ai.txt
- public/sitemap.xml or sitemap generation code
- redirects / headers / Cloudflare-related config
- existing SEO audit scripts and reports
- all routes under /answer/, /hub/, /solutions/, /docs/, /blog/, /assessment/

Tasks:
1. Inventory every indexable route and classify its intent:
   commercial / informational pillar / technical docs / supporting article / quick answer / conversion.
2. Find canonical inconsistencies, duplicate routes, hreflang problems, noindex directives, duplicate titles, duplicate H1s, and thin pages.
3. Identify which source files actually render each strategic URL.
4. Record current build/test results.
5. Do not edit anything in this prompt.
6. Produce a baseline markdown report under a local audit/report directory.
7. Explicitly flag any metric that is not available as N/A.

Design baseline:
- Identify inconsistent spacing, typography, card systems, button systems, form systems, header/footer variants, RTL issues, and page-specific CSS duplication.
- Identify likely high-cost hero assets or hydration affecting mobile LCP.

Do not push.
- [✅]  Prompt #1 — done & reviewed

Acceptance: عندك خريطة كاملة للروابط + ملفات المصدر + مشاكل SEO + مشاكل التصميم قبل التعديل.

# Prompt #2 — Fix the Cloudflare / robots / AI crawler policy conflict

Audit and normalize BrightAI crawler policy.

Known issue:
The repository robots.txt and the live Cloudflare-managed robots policy may express conflicting directives for AI crawlers. The live response has previously included Cloudflare Managed Content with ai-train=no and Disallow rules while origin files included Allow rules.

Goal:
Create ONE intentional crawler policy across:
- Cloudflare Managed robots.txt behavior
- public/robots.txt
- public/ai.txt
- public/llms.txt
- public/llms-full.txt

Recommended policy:
- Traditional search crawlers: allow.
- AI search / grounding / citation crawlers: allow where provider documentation confirms that role.
- Model-training-only crawlers: disallow by default.
- Do not classify a bot from memory if its semantics are ambiguous; verify current official provider documentation first.
- Preserve /api/ restrictions if appropriate.

Tasks:
1. Inspect repository crawler files.
2. Fetch/inspect the live robots.txt and compare line-by-line.
3. Identify duplicate/conflicting directives.
4. Prepare repository-side changes needed to match the intended policy.
5. If Cloudflare account configuration is required and not accessible, DO NOT pretend to change it. Produce exact manual Cloudflare steps in a report.
6. Ensure only one canonical sitemap declaration is needed.
7. Validate syntax.

SEO/GEO requirement:
Allow legitimate answer/search crawlers needed for citations while preventing accidental broad training access if that is the selected policy.

Do not push.
- [✅]  Prompt #2 — done & reviewed

# Prompt #3 — Fresh indexing audit and GSC remediation plan

Run a current indexing-focused audit.

Known historical baseline:
A repository snapshot dated 2026-07-25 showed:
- 180 tested URLs
- 72 indexed
- 36 not indexed
- 36 crawled-currently-not-indexed
- 36 unknown

Do NOT treat that snapshot as current truth.

Goal:
Prioritize indexing quality before publishing more content.

Tasks:
1. If current Search Console data is available, export:
   URL, status, last crawl, canonical, sitemap presence, impressions, clicks, query.
2. If current GSC is not available, mark current GSC metrics N/A and work from live technical evidence only.
3. Focus first on:
   /solutions/ai-governance-platform/
   /hub/ai-governance/
   /assessment/ai-governance-readiness/
   /solutions/ai-risk-classification/
   /solutions/ai-firewall/
   /solutions/ai-audit-trail/
   /solutions/policy-to-control-mapping/
   /solutions/banking-ai-governance/riyadh/
4. For each URL identify:
   content quality, duplication, canonical, internal links, crawl depth, schema, title/H1 alignment, mobile render, and unique value.
5. Produce a P0/P1/P2 indexing remediation list.
6. Do not bulk-delete or noindex pages solely because an old snapshot showed “crawled not indexed”.

Do not push.
- [✅]  Prompt #3 — done & reviewed

# Prompt #4 — Upgrade the AI Governance Platform commercial page

Optimize /solutions/ai-governance-platform/ as BrightAI’s primary commercial AI governance page.

Primary intent:
Enterprise buyers in Saudi Arabia looking for an operational AI governance platform.

Primary topic:
AI governance platform / حوكمة الذكاء الاصطناعي

Content requirements:
- User-facing Arabic copy must be natural professional Saudi colloquial Arabic.
- Explain the product as an operational governance layer between employees, AI systems, enterprise data, policies, approvals, and evidence.
- Position the sequence clearly:
  Regulation → Risk → Control → Enforcement → Evidence.
- Cover pain points:
  shadow AI, lack of ownership, sensitive-data leakage, missing audit trail, paper-only policies, high-risk decisions without approval.
- Keep claims legally safe.
- Use precise references to PDPL, NCA ECC, SDAIA, and ISO/IEC 42001 only where supportable.
- Add direct answer blocks suitable for AI search.
- Add strong internal links to:
  AI Firewall
  AI Risk Classification
  Human Approval Layer
  AI Audit Trail
  Evidence File
  Readiness Assessment

Design:
- Redesign hero for a premium enterprise AI safety / governance feel.
- Strong one-line value proposition.
- Add a visual “governance flow” section.
- Use clean cards for problems, controls, personas, sectors, and evidence.
- Improve CTA hierarchy: primary demo/readiness CTA + secondary learn CTA.
- Improve mobile hierarchy and shorten above-the-fold clutter.
- Use CSS/SVG/native lightweight visuals instead of heavy animation.
- Keep RTL perfect.

SEO:
- Unique title, H1, meta, canonical.
- Add/validate Product or SoftwareApplication/Service schema only if semantically correct.
- FAQ schema only for genuinely visible FAQs and only if current search-engine policy supports it.
- Avoid stuffing city names.

Do not push.
- [✅]  Prompt #4 — done & reviewed

# Prompt #5 — Rebuild the AI Governance Hub as the main informational pillar

Optimize /hub/ai-governance/ as the canonical informational pillar for “AI governance”.

Goal:
This page must own the educational intent while /solutions/ai-governance-platform/ owns purchase/commercial intent.

Content:
- Saudi conversational Arabic for visible Arabic copy.
- Directly answer “وش هي حوكمة الذكاء الاصطناعي؟”
- Explain governance vs AI safety vs AI security vs risk management.
- Explain Saudi context without pretending regulations say more than they do.
- Include:
  governance lifecycle
  roles and accountability
  risk classification
  human oversight
  policy-to-control mapping
  audit evidence
  data protection
  model/agent governance
- Add a simple Saudi-enterprise implementation roadmap.
- Link to product and regulatory guides.

AEO/GEO:
- Put a concise answer in the first 150-250 words.
- Add comparison table, checklist, FAQ-style answer blocks, definitions, and citation-ready statements.
- Use primary official sources for Saudi regulatory claims.

Design:
- Turn the page into a clear knowledge hub with sticky/table-of-contents navigation on desktop and compact navigation on mobile.
- Improve scannability with definition cards, diagrams, tables, steps, and callout boxes.
- Keep reading width comfortable.
- Make Arabic typography and lists RTL-correct.

Cannibalization:
- Audit /answer/ai-governance-* pages.
- Recommend merge/noindex/internal-link changes only after comparing intent and unique value.

Do not push.
- [✅]  Prompt #5 — done & reviewed

# Prompt #6 — Upgrade the AI Governance Readiness Assessment conversion page

Optimize /assessment/ai-governance-readiness/ for conversion and indexability.

Goal:
Turn the page into a high-trust Saudi enterprise AI governance readiness assessment.

Content:
- Saudi conversational Arabic.
- Clearly state who the assessment is for.
- Explain what the visitor receives.
- Do not invent scoring methodology or regulator approval.
- Create transparent assessment dimensions such as:
  inventory
  ownership
  risk
  policy
  data
  approvals
  logging/evidence
  monitoring
- Add privacy reassurance without making unsupported security claims.

Design:
- Premium assessment UI.
- Strong progress state.
- Large touch targets.
- Clear question grouping.
- Excellent mobile form usability.
- Minimal distractions.
- Accessible labels/errors/focus.
- Completion results should visually separate:
  strengths
  gaps
  recommended next controls
  CTA to book a session/demo.

SEO:
- Search-friendly explanatory content around the interactive form.
- Ensure form JS does not block crawlable content.
- Avoid a thin “tool-only” page.

Analytics:
- Track start, step progression, completion, CTA clicks, and abandonment without collecting unnecessary personal data.

Do not push.
- [✅]  Prompt #6 — done & reviewed

# Prompt #7 — Mobile LCP and Core Web Vitals P0

Treat mobile performance as a P0 task.

Historical audit:
Mobile LCP was measured around 5.8s while desktop LCP was around 1.3s. Do not assume the value is unchanged; remeasure first.

Goal:
Get mobile LCP below 2.5s without visually downgrading the site.

Inspect:
- BaseLayout
- font loaders
- hero sections
- images/SVG/background effects
- client-side hydration
- analytics scripts
- service worker registration
- third-party scripts
- CSS delivery
- redirects
- unused JS

Tasks:
1. Measure current Lighthouse/PageSpeed-style lab performance for homepage and strategic landing pages.
2. Identify the actual LCP element.
3. Optimize priority/loading for the LCP resource.
4. Eliminate avoidable redirect delays.
5. Reduce unused JS and unnecessary client hydration.
6. Minimize render-blocking fonts/CSS.
7. Ensure images have dimensions and correct modern formats.
8. Preserve CLS near zero.
9. Do not lazy-load the actual above-the-fold LCP asset.
10. Avoid blanket preload abuse.
11. Re-test desktop and mobile after every major change.

Design rule:
Do not trade away premium visual quality; simplify expensive effects intelligently.

Do not push.
- [✅]  Prompt #7 — done & reviewed

# Prompt #8 — Canonicals, noindex, sitemap, redirects and crawl-budget cleanup

Perform a technical indexation architecture cleanup.

Audit:
- canonicals
- trailing slash behavior
- redirects
- sitemap membership
- hreflang
- noindex
- robots directives
- duplicate pages
- orphan routes
- URL parameters if any
- sitemap freshness

Known caution:
Older audits reported canonical_mismatch and hash issues that may partly have been audit-tool configuration artifacts. Verify each issue before editing.

Tasks:
1. Establish one canonical URL format.
2. Remove redirect chains and loops.
3. Ensure canonical URLs are the final 200 URLs.
4. Keep indexable strategic pages in sitemap.
5. Remove true noindex pages from sitemap.
6. Do not noindex important pages accidentally.
7. Verify Arabic/English hreflang pairs where applicable.
8. Ensure sitemap references only canonical URLs.
9. Run internal-link and redirect checks after edits.
10. Produce a before/after table.

Do not push.
- [ ✅]  Prompt #8 — done & reviewed

# Prompt #9 — Consolidate /answer/ pages and remove cannibalization

Audit the entire /answer/ directory for keyword cannibalization and thin content.

Role definition:
- /solutions/ = commercial
- /hub/ = comprehensive informational pillars
- /docs/ = technical implementation
- /blog/ = supporting analysis / updates
- /assessment/ = conversion
- /answer/ = concise answer pages only when they add unique value

Review at minimum:
- /answer/ai-governance-saudi-arabia/
- Arabic equivalent
- /answer/iso-42001/
- /answer/pdpl-ai-compliance/
- Arabic equivalent
- /answer/ai-firewall-saudi/
- /answer/nca-compliance/
- /answer/nca-ecc-controls/
- audit-trail answer pages
- banking/healthcare answer pages

For each page choose:
KEEP / MERGE / REDIRECT / NOINDEX

Rules:
- Do not make decisions from word count alone.
- Compare query intent, impressions/clicks if available, backlinks, unique content, and internal links.
- Preserve useful URLs with search equity.
- Merge duplicated content into the strongest canonical owner.
- If a short answer page remains, make it uniquely answer one question and link to the pillar.
- Avoid automatic mass redirects without verification.

Design:
- Remaining answer pages should use a lightweight answer template:
  direct answer
  why it matters in Saudi
  key points
  source links
  next-step link
- No bloated marketing layout.

Do not push.
- [ ✅]  Prompt #9 — done & reviewed

# Prompt #10 — Create the SDAIA National AI Risk Management Framework pillar

Create a high-authority Saudi-focused guide for the current SDAIA National AI Risk Management Framework.

Before writing:
- Verify the latest official SDAIA/government primary source.
- Do not rely only on secondary summaries.
- Confirm official framework name/version/date from an authoritative source.

Search intent:
SDAIA AI Risk Management Framework
AI risk management Saudi Arabia
Saudi AI risk framework
إدارة مخاطر الذكاء الاصطناعي

Content:
- Visible Arabic copy in professional Saudi colloquial style.
- Start with a concise answer.
- Explain who should care and why.
- Break down framework stages only as supported by the official source.
- Show how enterprises can operationalize it:
  inventory → classify → assess → assign owner → control → approve → monitor → evidence.
- Connect to BrightAI features without claiming regulator endorsement.
- Add implementation checklist and decision table.
- Link to:
  AI Risk Classification
  Human Approval Layer
  Audit Trail
  Evidence File
  Governance Platform
  Readiness Assessment

Design:
- Build a premium regulatory guide template.
- Timeline/process diagram.
- Risk matrix visual if accurately supported.
- Checklist component.
- source/citation panel.
- sticky table of contents.
- clear “what BrightAI can help with” section separate from “what the regulation says”.

Do not push.
- [ ✅]  Prompt #10 — done & reviewed

# Prompt #11 — Build the NCA AI Cybersecurity Guidelines opportunity page

Create/upgrade a Saudi-focused page targeting NCA AI Cybersecurity Guidelines.

Before writing:
- Verify the latest NCA/official Saudi source and publication/status.
- Distinguish consultation/draft/final guidance if applicable.
- Do not imply a draft is binding law.

Topics:
AI cybersecurity Saudi Arabia
NCA AI cybersecurity guidelines
AI security Saudi Arabia
أمن الذكاء الاصطناعي

Content:
- Saudi conversational Arabic for visible Arabic.
- Explain AI-specific cybersecurity risks:
  prompt/data leakage
  unsafe model output
  unauthorized AI use
  agent permissions
  logging gaps
  third-party AI risk
- Map each practical risk to operational controls where supportable.
- Separate “official guidance” from “BrightAI implementation approach”.
- Link to AI Firewall, Audit Trail, Human Approval, Use Case Discovery, Governance Platform.

Design:
- Security-oriented visual system consistent with the main brand.
- Threat → control → evidence matrix.
- Lightweight architecture diagram.
- Strong mobile tables/cards.

Do not push.
- [ ] ✅ Prompt #11 — done & reviewed

# Prompt #12 — Strengthen the AI Firewall commercial cluster

Make /solutions/ai-firewall/ the strongest commercial page for BrightAI’s AI security control layer.

Target:
AI Firewall
AI security for enterprise
LLM security
AI data leakage prevention
Saudi enterprise AI security

Content:
- Saudi colloquial B2B Arabic.
- Clearly explain what the firewall sees, checks, blocks, flags, logs, or routes for approval — but only according to actual implementation.
- Cover:
  prompts
  responses
  sensitive data
  policy violations
  risky destinations/models
  evidence/logging
- Include “AI Firewall vs traditional firewall” comparison.
- Include “AI Firewall vs DLP” comparison if technically accurate.
- Avoid implying perfect prevention.
- Connect to PDPL/NCA/SDAIA as “supporting implementation/alignment,” not guaranteed compliance.

Design:
- Strong product hero.
- Input → inspection → decision → output/evidence flow diagram.
- Example policy cards.
- Before/after risk scenario.
- High-intent CTA.

SEO/AEO:
- Answer “وش هو AI Firewall؟” immediately.
- Optimize title/H1/meta without stuffing “Saudi Arabia” repeatedly.

Do not push.
- [ ✅]  Prompt #12 — done & reviewed

# Prompt #13 — Build/strengthen the ISO/IEC 42001 pillar

Optimize BrightAI’s ISO/IEC 42001 content cluster.

Target keyword data from prior research:
- ISO 42001 — volume ~5,400
- ISO 42001 certification — ~720
- what is ISO 42001 — ~210
- ISO 42001 controls — ~50
- ISO 42001 checklist — ~50
- ISO 42001 compliance — ~50
- ISO 42001 AI governance — ~20

Goal:
Own implementation/readiness intent, not certification-body intent.

Content:
- Explain what ISO/IEC 42001 is.
- Explain AI management system concepts accurately.
- Build Saudi enterprise implementation guidance.
- Create readiness checklist.
- Explain how BrightAI features can help produce governance controls/evidence.
- Explicitly state BrightAI is not the certification body unless evidence says otherwise.
- Do not offer “certification” as if BrightAI issues it.

Design:
- Standards guide layout.
- Requirement/control groups as cards/tables.
- Readiness checklist.
- maturity visualization.
- CTA to readiness assessment.

Cannibalization:
- Review /answer/iso-42001/ against the main guide and assign one canonical owner.

Do not push.
- [ ] ✅ Prompt #13 — done & reviewed

# Prompt #14 — Rebuild the PDPL + AI compliance cluster

Optimize the PDPL + AI content cluster for practical enterprise search intent.

Topics:
PDPL AI compliance
PDPL ChatGPT
Saudi AI data privacy
الذكاء الاصطناعي و PDPL
حماية البيانات مع أدوات الذكاء الاصطناعي

Content:
- Saudi conversational Arabic.
- Focus on practical data handling scenarios.
- Explain that AI use may create personal/sensitive data risks.
- Do not provide unsupported legal conclusions.
- Separate legal requirement summaries from product implementation guidance.
- Use official Saudi sources for legal claims.
- Add operational checklist:
  discover AI use
  classify data
  define allowed tools
  redact/block sensitive input
  log activity
  require approvals where needed
  retain evidence
- Link to AI Firewall, Shadow AI Discovery, Audit Trail, Governance Platform, Assessment.

Design:
- Scenario-driven cards.
- data-flow diagram.
- safe/unsafe example table.
- compliance checklist.
- clear source panel.

Do not push.
- [ ] ✅ Prompt #14 — done & reviewed

# Prompt #15 — Create BrightAI’s Saudi AI Governance Control Matrix

Create an original, genuinely useful “Saudi AI Governance Control Matrix”.

Goal:
Produce a reference asset worth citing/linking to.

Structure:
Rows = operational AI governance control areas.
Columns may include:
- objective
- risk addressed
- example control
- owner
- evidence produced
- related BrightAI capability
- relevant Saudi/standard reference only when accurately supported

Possible control families:
- AI inventory
- ownership
- risk classification
- approved use
- data handling
- human approval
- security filtering
- logging
- audit evidence
- monitoring
- third-party AI
- incident handling
- policy updates

Rules:
- Do not copy regulation text.
- Do not imply official endorsement.
- Clearly label it as a BrightAI practical implementation matrix.
- Add source notes.

Design:
- Highly usable responsive table.
- Filters or tabs only if lightweight.
- Print/PDF-friendly styling if feasible.
- Great Arabic RTL table behavior.
- Optional downloadable CSV only if implemented safely.

SEO:
Target “AI governance controls”, “Saudi AI governance control matrix”, and Arabic equivalents naturally.

Do not push.
- [ ] ✅ Prompt #15 — done & reviewed

# Prompt #16 — Create a Saudi AI Risk Register Template

Create a practical AI Risk Register template for Saudi enterprises.

Fields:
- use case
- system/model/vendor
- business owner
- data types
- affected users
- risk category
- likelihood
- impact
- risk level
- controls
- human approval requirement
- monitoring
- evidence
- review date
- status

Content:
- Explain how to use it.
- Use Saudi colloquial Arabic for visible instructions.
- Avoid saying the scoring is “the SDAIA official score” unless it exactly matches an official framework and is cited.
- If using a generic matrix, label it BrightAI’s implementation template.
- Link to AI Risk Classification and Readiness Assessment.

Design:
- Interactive-looking but lightweight.
- Mobile card fallback for wide tables.
- Clear badges.
- accessible table semantics.
- print-friendly version.

Do not push.
- [ ] ✅ Prompt #16 — done & reviewed

# Prompt #17 — Entity SEO, Organization schema and trust cleanup

Strengthen BrightAI’s entity consistency across the website.

Inspect:
- src/data/site.ts
- SEOHead.astro
- organization schema
- social sameAs links
- contact/about/footer
- llms/ai files
- Open Graph/Twitter/X metadata

Known historical concern:
Social profile URLs have previously differed between site configuration and schema sources.

Tasks:
1. Establish one canonical Organization identity.
2. Normalize name, URL, logo, description, country/market positioning.
3. Normalize sameAs URLs only to verified official BrightAI profiles.
4. Remove dead or unverified social links.
5. Ensure Arabic/English brand description is consistent.
6. Add author/reviewer metadata where real people/roles are actually available.
7. Add datePublished/dateModified accurately to articles/guides.
8. Do not fabricate addresses, founders, awards, credentials, certifications or phone numbers.

Design:
- Improve About/contact trust presentation without fake “trust badges”.
- Use real methodology, update dates, sources, and product architecture as trust signals.

Do not push.
- [ ] ✅ Prompt #17 — done & reviewed

# Prompt #18 — Agentic AI Security pillar

Create an emerging-topic pillar for “Agentic AI Security” aligned with BrightAI’s real capabilities.

Market context from prior keyword research:
- agentic ai security ~390 monthly volume
- generic agentic ai is extremely broad/competitive and should not be the target head term.

Goal:
Differentiate BrightAI around governance/security of autonomous or semi-autonomous AI agents.

Content:
- Define agentic AI briefly.
- Focus on security risks:
  excessive permissions
  tool misuse
  sensitive data access
  autonomous actions
  third-party connectors
  approval bypass
  incomplete logs
  cascading actions
- Operational controls:
  allowlists
  risk classification
  scoped permissions
  human approval
  policy enforcement
  audit trail
  evidence
  continuous monitoring
- Do not claim BrightAI supports an agent capability unless code/product evidence supports it.

Design:
- Agent → tools → data → policy → approval → evidence architecture.
- Risk/control cards.
- interactive-looking lightweight diagrams.
- premium enterprise security visual language.

Do not push.
- [ ] ✅ Prompt #18 — done & reviewed

# Prompt #19 — Agentic AI Governance framework page

Create a separate informational pillar for “Agentic AI Governance”.

Do NOT duplicate the Agentic AI Security page.

Intent:
Governance/operating model, accountability, approvals, lifecycle, oversight and evidence for AI agents.

Content:
- Saudi colloquial Arabic for Arabic copy.
- Define ownership:
  business owner
  technical owner
  risk/compliance owner
  approver
- Explain lifecycle:
  register → classify → grant tools/data → enforce policies → approve high-risk actions → log → monitor → review.
- Include a governance checklist and RACI-style table if useful.
- Connect to BrightAI’s existing governance capabilities without overclaiming.

SEO:
- Keep “Agentic AI” as context, not a generic broad-keyword chase.
- Target long-tail governance/security intent.

Design:
- Lifecycle diagram.
- accountability/RACI section.
- approval flow.
- evidence examples.

Do not push.
- [ ] ✅ Prompt #19 — done & reviewed

# Prompt #20 — Strengthen Banking AI Governance Riyadh instead of mass city pages

Upgrade /solutions/banking-ai-governance/riyadh/ as BrightAI’s flagship local high-intent page.

Do NOT create mass city clones.

Audience:
Banks, fintech, risk, compliance, security, data and AI leaders in Riyadh.

Content:
- Natural Saudi B2B Arabic.
- Use Riyadh context where it changes the buyer’s actual environment.
- Explain enterprise AI governance issues in banking:
  data sensitivity
  model/tool approval
  shadow AI
  accountability
  human approval
  audit evidence
  vendor/third-party AI
- Mention SAMA/NCA/PDPL only accurately and with primary sources where making claims.
- Do not say BrightAI is approved by SAMA or any regulator.
- Make the page commercially strong.

Design:
- Executive enterprise layout.
- sector risk cards.
- governance workflow.
- evidence/audit section.
- board/executive-friendly CTA.
- Riyadh should feel contextual, not like a keyword pasted into headings.

Do not push.
- [ ] ✅ Prompt #20 — done & reviewed

# Prompt #21 — Internal linking and topical authority architecture

Rebuild internal linking around five pillars:

1. AI Governance Saudi Arabia
2. AI Risk Management & SDAIA
3. AI Security & AI Firewall
4. Saudi AI Compliance — PDPL / NCA / ISO 42001
5. Agentic AI Governance & Security

Rules:
- Every supporting article should link up to a clear pillar.
- Commercial pages should receive relevant contextual links from informational content.
- Avoid repetitive exact-match anchors.
- Use descriptive Saudi/Arabic natural anchors.
- Keep crawl depth low for priority pages.
- Add breadcrumbs consistently.
- Ensure no strategic orphan pages.

Suggested relationships:
Governance Hub → Governance Platform
SDAIA Risk Guide → Risk Classification
SDAIA Risk Guide → Human Approval Layer
PDPL Guide → AI Firewall
ISO Guide → Readiness Assessment
NCA Guide → AI Firewall
Agentic Security → Audit Trail + Human Approval
Banking Riyadh → Evidence File
Answer pages → their canonical pillar owner

Tasks:
- Generate before/after internal link graph.
- Run broken-link/orphan audits.
- Do not add links solely for SEO if context is poor.

Do not push.
- [ ] ✅ Prompt #21 — done & reviewed

# Prompt #22 — GEO / AEO / AI-search optimization across strategic content

Optimize strategic BrightAI content for Google AI answers, Bing/Copilot-style answers, ChatGPT search/grounding, Perplexity and other citation systems without spam.

Apply to:
- main governance hub
- governance platform
- SDAIA risk guide
- NCA AI cybersecurity guide
- PDPL guide
- ISO 42001 guide
- AI Firewall
- Agentic AI Security
- Agentic AI Governance
- banking Riyadh
- readiness assessment supporting copy

Pattern:
1. Direct answer near the top.
2. Saudi-specific context.
3. Primary authoritative source.
4. Clear last-updated date.
5. Structured table/checklist/framework.
6. Clear distinction between:
   “official requirement/guidance”
   and
   “BrightAI implementation approach”.
7. Original diagrams/matrices/templates.
8. Clear entity/product references.

Technical:
- Keep llms.txt, llms-full.txt and ai.txt accurate and synchronized.
- Include only canonical high-value pages.
- Do not put marketing claims in machine-readable files that are not supported on-page.
- Do not hide content from users while exposing it to crawlers.

Do not push.
- [ ] ✅ Prompt #22 — done & reviewed

# Prompt #23 — Global visual design system upgrade

Act as a senior product designer + frontend engineer and modernize BrightAI’s visual system without turning it into a generic template.

Inspect:
- src/styles/base.css
- src/styles/components.css
- BaseLayout.astro
- ArabicLayout.astro
- EnglishLayout.astro
- BlogLayout.astro
- shared header/navigation/footer/buttons/forms/cards
- existing visual-reskin/CWV/CSS-cleanup reports before changing architecture

Brand direction:
Premium Saudi enterprise AI governance / safety platform.
Clean, confident, technical, credible.
Use space and hierarchy instead of excessive decoration.

Tasks:
1. Normalize design tokens:
   typography
   type scale
   spacing
   radii
   shadows
   borders
   surface levels
   container widths
   responsive breakpoints
2. Standardize:
   buttons
   badges
   cards
   section headers
   tables
   alerts/callouts
   forms
   breadcrumb
   CTA panels
3. Improve Arabic RTL:
   alignment
   icons
   logical CSS properties
   lists
   tables
   forms
   mixed Arabic/English text
4. Improve mobile navigation and touch targets.
5. Reduce page-specific duplicated CSS.
6. Build reusable lightweight diagram/flow primitives.
7. Ensure accessible focus, contrast and keyboard behavior.
8. Respect prefers-reduced-motion.
9. Keep animation subtle and performance-safe.
10. Do not add a heavy UI framework unless the existing architecture clearly benefits.

Content rule:
Any Arabic copy changed while redesigning must use natural Saudi professional colloquial language.

Output:
- design-system change log
- components migrated
- remaining exceptions
- screenshots/visual checks if the environment supports them

Do not push.
- [ ] ✅ Prompt #23 — done & reviewed

# Prompt #24 — Homepage information architecture + conversion redesign

Upgrade the BrightAI homepage to clearly communicate the Saudi AI Safety OS / operational governance positioning.

Goal:
A visitor should understand in seconds:
- what BrightAI is
- what problem it solves
- who it is for
- how it works
- why it matters in Saudi enterprises
- what to do next

Suggested narrative:
1. Hero — one clear promise.
2. Problem — uncontrolled enterprise AI / Shadow AI / sensitive data / missing ownership/evidence.
3. BrightAI operating layer.
4. Regulation → Risk → Control → Enforcement → Evidence.
5. Product capabilities.
6. Sector use cases.
7. Regulatory alignment support.
8. Evidence/audit readiness.
9. Readiness/demo CTA.
10. High-value guides/resources.

Content:
- Saudi conversational Arabic on Arabic homepage.
- Avoid buzzword walls.
- Avoid unsupported “#1 / best / fully compliant” claims.

Design:
- Premium hero but mobile-fast.
- Lightweight technical system visual.
- No autoplay heavy video.
- Strong visual rhythm.
- Clear primary CTA.
- Consistent cards.
- Do not cram every product above the fold.

SEO:
- Keep homepage focused on brand/category, not every keyword.
- Ensure internal links to primary pillars and commercial pages.

Do not push.
- [ ] ✅ Prompt #24 — done & reviewed

# Prompt #25 — Conversion architecture and analytics

Improve conversion measurement and CTA architecture across BrightAI.

Primary conversions:
- readiness assessment completion
- demo/session request
- contact form completion
- qualified WhatsApp/contact click if this is intentionally part of the funnel
- high-intent resource/template interaction

Tasks:
1. Inventory all CTAs and remove conflicting labels.
2. Map CTA to search intent:
   What is AI governance → readiness assessment
   SDAIA risk → checklist/readiness
   AI Firewall → demo
   PDPL + AI → data-risk/readiness assessment
   ISO 42001 → readiness
   Audit Trail → evidence demo
   Banking Riyadh → executive implementation session
   Agentic Security → agent risk assessment
3. Implement consistent analytics event naming.
4. Track:
   CTA click
   form start
   form completion
   assessment start
   assessment completion
   outbound regulatory source click
5. Do not track unnecessary sensitive form data.
6. Verify analytics scripts do not materially hurt performance.

Design:
- One primary CTA and one secondary CTA per major section max.
- Strong mobile CTA states.
- Avoid intrusive popups.

Do not push.
- [ ] ✅ Prompt #25 — done & reviewed

# Prompt #26 — Competitor differentiation and messaging cleanup

Review BrightAI messaging against current Saudi AI consulting/governance competitors and regulatory-information sites.

Known positioning opportunity:
Do NOT present BrightAI as a generic AI consulting company.

Differentiation:
Regulation → Risk → Control → Enforcement → Evidence.

Tasks:
1. Review competitor landing pages for:
   generic consulting language
   AI strategy
   governance consulting
   compliance content
   implementation depth
2. Identify messages BrightAI should NOT copy.
3. Rewrite ambiguous BrightAI product copy around operational controls and evidence.
4. Ensure each product has a distinct job:
   Governance Platform
   AI Firewall
   Audit Trail
   Evidence File
   Human Approval
   Continuous Governance
   Risk Classification
   Shadow AI Discovery
   Policy-to-Control Mapping
5. Prevent overlap between feature pages.

Language:
Arabic visible copy = professional Saudi colloquial.

Trust:
No unsupported comparisons like “better than competitor X”.

Design:
Use diagrams/product workflows to prove differentiation visually instead of only slogans.

Do not push.
- [ ] ✅ Prompt #26 — done & reviewed

# Prompt #27 — Content governance: what NOT to create

Create a repository-level content governance checklist to prevent future SEO bloat.

Rules:
DO NOT create:
- generic “AI governance Riyadh” clone pages with no unique value
- mass Jeddah/Dammam/NEOM city clones
- “ISO 42001 certification services” unless BrightAI is legitimately authorized to offer that service
- “best AI company Saudi Arabia” self-promotional ranking pages
- generic head-term Agentic AI page competing with encyclopedia/news intent
- HUMAIN/ALLAM pages purely to exploit names without a real BrightAI relationship/use case
- dozens of near-identical /answer/ pages
- generic AI news pages with no topical authority value
- “near me” pages for a B2B software platform

Implement:
- content brief template
- intent owner field
- primary keyword
- supporting keyword
- canonical owner
- target audience
- unique Saudi angle
- original asset required?
- conversion CTA
- source requirements
- last-updated owner

Do not push.
- [ ] ✅ Prompt #27 — done & reviewed

# Prompt #28 — 30/60/90-day remeasurement and final QA

After the previous prompts are completed locally, perform the final full QA and create a 90-day measurement plan.

Technical QA:
- build
- lint/typecheck
- crawl/index directives
- sitemap
- canonicals
- redirects
- hreflang
- schemas
- internal links
- orphan pages
- mobile CWV lab checks
- accessibility basics
- responsive layouts
- RTL
- analytics events

Content QA:
- no cannibalization
- no unsupported compliance claims
- Saudi colloquial copy is natural and professional
- primary sources used for regulatory claims
- direct-answer blocks exist
- unique page intent
- CTAs align to intent

Metrics to track:
- Saudi organic impressions
- Saudi organic clicks
- non-brand queries
- top 3 / top 10 strategic keywords
- indexed strategic pages
- crawled-not-indexed count
- Google organic users
- Bing organic users
- AI referral traffic
- qualified leads
- organic conversion rate
- mobile LCP
- CLS
- INP
- actual per-keyword GSC clicks
- backlinks/domain metrics only if a reliable source is accessible

Output:
Create:
1. before-vs-after report
2. unresolved issues list
3. 30-day measurement checklist
4. 60-day content/indexing review
5. 90-day reprioritization report

Do not push.
- [ ] ✅ Prompt #28 — done & reviewed

Keyword Portfolio

ملاحظة مهمة عن Clicks

GSC Clicks أدناه = N/A لأن التقرير السابق ما كان يحتوي على Export فعلي للنقرات لكل Query من Google Search Console.
ما راح نحول Search Volume إلى Clicks، وما راح نخترع CTR.

لما يتوفر GSC Query Export، استبدل N/A بالقيمة الحقيقية للفترة المحددة، ويفضل الاحتفاظ أيضًا بـ:

Impressions

CTR

Average Position

Country = Saudi Arabia

Device

Landing Page

Search Volume / CPC / SEO Difficulty أدناه مأخوذة من بحث الكلمات المستخدم في التقرير السابق، وهي ليست Clicks فعلية للموقع.

Priority

Keyword

GSC Clicks

Search Volume

CPC (USD)

SEO Difficulty

Intent

Recommended Owner

P0

حوكمة الذكاء الاصطناعي

N/A

10

0

13

Informational / Commercial

/hub/ai-governance/ + commercial link

P1

حوكمة الذكاء الاصطناعي سدايا

N/A

10

0

5

Regulatory / Informational

SDAIA risk/governance guide

P0

AI governance

N/A

4,400

41.05

58

Informational / Commercial

Governance Hub

P0

what is ai governance

N/A

1,000

32.17

36

Informational

Governance Hub

P1

ai governance definition

N/A

70

63.26

34

Informational

Governance Hub

P0

AI governance Saudi Arabia

N/A

0

0

4

Local commercial/info

Governance Hub / Platform

P0

AI risk management

N/A

1,900

28.18

61

Informational / Commercial

SDAIA Risk Pillar

P0

ai risk management framework

N/A

720

38.64

67

Informational

SDAIA Risk Pillar

P1

risk assessment ai

N/A

30

15.89

39

Informational / Tool

Risk Register / Assessment

P1

risk management and ai

N/A

30

15.12

57

Informational

SDAIA Risk Pillar

P0

AI risk management Saudi Arabia

N/A

0

0

4

Saudi regulatory

SDAIA Risk Pillar

P0

SDAIA AI Risk Management Framework

N/A

N/A

N/A

N/A

Saudi regulatory

New SDAIA framework guide

P0

ISO 42001

N/A

5,400

12.26

38

Informational / Commercial

ISO 42001 Pillar

P0

iso 42001 certification

N/A

720

14.11

48

Commercial investigation

ISO guide — clarify BrightAI not certifier

P1

iso 42001 certified

N/A

480

11.04

32

Informational

ISO guide

P1

iso 42001 pdf

N/A

210

18.05

33

Navigational/info

ISO guide; do not host copyrighted standard

P0

what is iso 42001

N/A

210

12.31

49

Informational

ISO guide

P1

iso 42001 ai

N/A

140

25.61

56

Informational

ISO guide

P1

iso 42001 standard

N/A

90

12.62

46

Informational

ISO guide

P1

iso 42001 ai certification

N/A

70

27.49

43

Commercial investigation

ISO guide

P1

iso 42001 certification cost

N/A

70

14.69

14

Commercial investigation

Only if useful; no fake pricing

P1

iso 42001 ai management system

N/A

50

45.50

50

Informational/commercial

ISO guide

P1

iso 42001 controls

N/A

50

19.34

31

Implementation

ISO guide / Control Matrix

P1

iso 42001 checklist

N/A

50

21.25

15

Tool / implementation

ISO checklist

P1

iso 42001 compliance

N/A

50

14.45

53

Commercial/info

ISO guide

P1

iso 42001 requirements

N/A

40

18.65

51

Informational

ISO guide

P1

iso 42001 audit

N/A

30

26.28

29

Informational/commercial

ISO guide / Audit Evidence

P2

iso 42001 framework

N/A

30

15.64

61

Informational

ISO guide

P1

iso 42001 ai governance

N/A

20

27.08

25

Informational/commercial

ISO + Governance internal link

P0

AI Firewall

N/A

320

20.57

35

Commercial / Informational

/solutions/ai-firewall/

P1

ai powered firewall

N/A

70

18.97

55

Commercial/info

AI Firewall

P2

cloudflare ai firewall

N/A

70

8.53

30

Different product intent

Do not target as BrightAI product term

P1

what is an ai firewall

N/A

10

11.33

8

Informational

AI Firewall

P2

ai firewall open source

N/A

10

12.27

26

Investigation

Only if BrightAI has relevant factual angle

P1

ai firewall vendors

N/A

10

20.59

33

Commercial investigation

Possible comparison guide later

P0

AI security Saudi Arabia

N/A

0

0

4

Saudi commercial

NCA AI Cybersecurity / AI Firewall

P1

security artificial intelligence

N/A

1,300

48.16

60

Broad info

Supporting security content

P1

ai saudi arabia

N/A

170

9.19

34

Broad local

Homepage / market context, not single page target

P2

Sovereign AI Saudi Arabia

N/A

0

0

4

Strategic emerging

Sovereign AI Governance guide

P2

sovereignty ai

N/A

50

20.37

42

Informational

Sovereign AI guide

P2

Agentic AI

N/A

110,000

12.24

72

Very broad

Do NOT target generically

P2

agentic ai definition

N/A

12,100

3.83

69

Broad informational

Do not chase as primary

P2

agentic ai course

N/A

3,600

15.44

33

Education

Not BrightAI intent

P2

agentic ai news

N/A

1,900

14.45

48

News

Not a primary BrightAI target

P2

agentic ai examples

N/A

1,600

15.43

44

Informational

Supporting only if relevant

P2

agentic ai platforms

N/A

1,000

37.27

48

Commercial investigation

Not primary unless product fit exists

P2

agentic ai tools

N/A

1,000

25.01

55

Commercial/info

Avoid generic listicle

P2

agentic ai frameworks

N/A

1,000

17.55

48

Informational

Supporting only

P2

agentic ai architecture

N/A

720

19.20

45

Technical

Supporting architecture content

P2

agentic ai workflows

N/A

720

38.95

43

Informational/commercial

Supporting only

P2

agentic ai systems

N/A

590

28.39

67

Broad

Supporting only

P1

agentic ai security

N/A

390

56.91

47

High-value emerging

New Agentic AI Security pillar

P1

agentic ai solutions

N/A

390

39.53

63

Commercial

Only where BrightAI capabilities fit

P2

agentic ai use cases

N/A

480

20.18

39

Informational

Supporting content

P2

agentic ai vs generative ai

N/A

4,400

7.34

46

Comparison

Not primary commercial target

P2

agentic ai vs ai agents

N/A

880

10.84

47

Comparison

Supporting glossary/FAQ

P2

agentic ai vs llm

N/A

210

7.00

39

Comparison

Supporting glossary/FAQ

P1

agentic ai governance

N/A

0

N/A

N/A

Emerging governance

New Agentic AI Governance pillar

P0

NCA AI cybersecurity guidelines

N/A

N/A

N/A

N/A

Saudi regulatory

New NCA AI cybersecurity guide

P0

PDPL AI compliance

N/A

N/A

N/A

N/A

Saudi compliance

PDPL + AI pillar

P0

AI audit trail

N/A

N/A

N/A

N/A

Commercial

/solutions/ai-audit-trail/

P0

AI governance readiness assessment

N/A

N/A

N/A

N/A

High-intent tool

/assessment/ai-governance-readiness/

P1

AI governance Riyadh banking

N/A

N/A

N/A

N/A

Local sector commercial

/solutions/banking-ai-governance/riyadh/

P1

Saudi AI governance control matrix

N/A

N/A

N/A

N/A

Linkable asset

New Control Matrix

P1

Saudi AI risk register template

N/A

N/A

N/A

N/A

Linkable/tool asset

New Risk Register

Top 10 Focus Keywords / Topics

SDAIA AI Risk Management Framework

حوكمة الذكاء الاصطناعي

AI governance

AI Firewall

AI risk management

ISO 42001

PDPL AI compliance

NCA AI cybersecurity guidelines

AI audit trail

AI governance readiness assessment

Recommended Page Ownership

Search Intent

Owner

شراء / طلب ديمو / منتج

/solutions/

شرح شامل ومصدر أساسي

/hub/

تنفيذ تقني

/docs/

تحليل داعم / تحديث

/blog/

تقييم وتحويل Lead

/assessment/

إجابة قصيرة ومحددة فقط

/answer/

30 / 60 / 90 Day Execution

Days 1–30 — P0 Technical + Indexing

Prompt 1

Prompt 2

Prompt 3

Prompt 7

Prompt 8

Prompt 9

Prompt 4

Prompt 5

Prompt 6

Days 31–60 — Saudi authority + commercial depth

Prompt 10

Prompt 11

Prompt 12

Prompt 13

Prompt 14

Prompt 15

Prompt 16

Prompt 17

Prompt 20

Prompt 21

Prompt 23

Prompt 24

Prompt 25

Days 61–90 — Emerging authority + refinement

Prompt 18

Prompt 19

Prompt 22

Prompt 26

Prompt 27

Prompt 28

Final Definition of Done

المشروع ما يعتبر خلص لمجرد إن الصفحات صارت أجمل أو أكثر.

لازم نثبت الآتي:

ما فيه تضارب robots/AI crawler policy.

كل صفحة استراتيجية لها Intent واضح.

/answer/ ما ينافس الـpillars.

الصفحات التجارية الأساسية قابلة للفهرسة ومربوطة داخليًا بقوة.

Mobile LCP أقل من 2.5s قدر الإمكان في القياس الحالي.

التصميم موحّد وممتاز على RTL + mobile.

النص العربي الظاهر للمستخدم عامي سعودي مهني وطبيعي.

ما فيه ادعاءات امتثال/اعتماد غير مثبتة.

SDAIA / NCA / PDPL / ISO content يعتمد على مصادر رسمية عند ذكر المتطلبات.

AI Search files متطابقة مع سياسة الزحف الفعلية.

يوجد أصل أصلي قابل للاستشهاد مثل Control Matrix وRisk Register.

CTA والـanalytics يقيسون Leads فعلية.

يوجد GSC Export حديث يملأ عمود Clicks الحقيقي لكل Keyword.

كل Metrics غير المتوفرة تظل N/A بدل التخمين.

لا يتم git push إلا بعد مراجعة بشرية صريحة.
