# Strategic AI Answer Content Design

**Goal:** Make BrightAI’s priority governance, security, compliance, banking, and readiness pages useful and citable in AI-assisted search while preserving an honest distinction between official Saudi guidance and BrightAI’s implementation approach.

**Scope:**

- `/hub/ai-governance/`
- `/solutions/ai-governance-platform/`
- SDAIA AI risk guide
- NCA AI cybersecurity guide
- PDPL guide
- ISO/IEC 42001 guide
- `/solutions/ai-firewall/`
- New `/hub/agentic-ai-security/` page and the existing Agentic AI Governance page
- Riyadh banking governance page
- Supporting copy on `/assessment/ai-governance-readiness/`
- `public/llms.txt`, `public/llms-full.txt`, and `public/ai.txt`

## Content model

Every in-scope page must expose the same information to people and crawlers in server-rendered HTML:

1. A direct, self-contained answer near the top that identifies the page topic, its Saudi context, and the entity/product where relevant.
2. A visible **المصدر الرسمي** panel near the answer. It includes one primary authoritative source, plus at most one additional official source when it substantiates a distinct detail. It does not use a third-party source when a primary source exists.
3. A visible last-updated date reflecting this content revision.
4. A structured, topic-specific table, checklist, or framework that can be read on mobile without JavaScript.
5. A visible boundary between **متطلب أو إرشاد رسمي** and **منهج BrightAI للتنفيذ**. The BrightAI section describes operating controls and evidence patterns, never legal advice, certification, or guaranteed compliance.
6. A page-specific original diagram, lifecycle, matrix, or template expressed as accessible semantic HTML/CSS. It must clarify the topic; it must not be decorative or copied from an authority.

## Page roles

The governance hub remains the informational canonical owner. The governance platform and AI Firewall remain commercial product pages, so their implementation approach may reference product capabilities only where those capabilities are already supported in visible page copy. Regulatory guides remain informational and link to the appropriate product only as a contextual implementation option. The new Agentic AI Security page is an informational security owner for prompt injection, tool access, data boundaries, monitoring, and incident evidence. It stays distinct from Agentic AI Governance, which covers ownership, approvals, lifecycle, and evidence. The Riyadh banking page uses sector-specific SAMA/PDPL context without implying SAMA approval. The readiness assessment explains its eight diagnostic dimensions and limits without presenting the assessment as a regulatory decision.

## Machine-readable files

`llms.txt` is a concise canonical index of only the high-value pages above. `llms-full.txt` provides a fuller but non-duplicative canonical reading map. `ai.txt` keeps the existing operational format but references the same canonical pages and grounded product descriptions. All three files repeat only claims visible on the destination pages and carry no rankings, certifications, unsupported marketing, hidden content, or noncanonical URL variants.

## Sources and freshness

Use official Saudi authority pages and official ISO material where applicable: SDAIA/NDMO for AI and PDPL, NCA for cybersecurity controls, SAMA for banking context, and ISO for ISO/IEC 42001. Source wording must state whether it is a requirement, framework, or guidance; it must not upgrade guidance into a legal obligation. All revised pages use the revision date `2026-08-24`.

## Verification

- Add a focused static contract test for all in-scope routes and the three machine-readable files.
- Build the Astro site, inspect generated HTML for one H1, indexability, direct-answer content, official-source panel, update date, and official/BrightAI boundary.
- Run the project SEO and internal-link checks appropriate to the changed routes.
- Check `git diff --check`.

## Non-goals

- No new dependency, schema type, crawler restriction, deployment, commit, or push. The approved exception is one new indexable information route: `/hub/agentic-ai-security/`.
- No legal advice, certification claim, guaranteed regulatory outcome, fabricated statistics, or crawler-only content.
