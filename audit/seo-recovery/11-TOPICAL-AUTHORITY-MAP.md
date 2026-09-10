# 11 — Topical Authority Map (link hierarchy)

Date (UTC): 2026-09-10
Rule: one contextual upward link per supporting page, varied Arabic anchors, no injected blocks, no sitewide exact-match. UX navigation untouched. All 39 new links verified in `dist` (targets built = HTTP 200 at deploy).

## Cluster 1 — AI Governance (informational pillar → commercial product)
- PILLAR: `/hub/ai-governance/` (checklist + matrix + 7 FAQs + intent-note)
- COMMERCIAL: `/solutions/ai-governance-platform/` (buying intent; links back to pillar since 07-task)
- Supporting → pillar (new): `blog/iso-27001-vs-iso-42001-ai-governance`, `blog/sama-ai-governance`, `docs/ai-governance-platform`, `docs/governance-application`
- Pillar → cluster: 40 existing content links verified (platform ×4, audit-trail ×3, risk/firewall/assessment ×2…)

## Cluster 2 — PDPL + AI (commercial statement ⇄ informational guide)
- COMMERCIAL: `/pdpl-statement/` ⇄ INFORMATIONAL: `/docs/pdpl-ai-complete-guide/` (bidirectional, pre-existing)
- Supporting → guide (new ×10): `iso-42001-pdpl-data-protection`, `pdpl-ai/audit/breach/consent/data/impact/rights/thirdparty`, `sdaia-nca-pdpl-regulatory-map`
- Anchors rotate 3 variants (الدليل الكامل / المرجع العميق / خطوة بخطوة) + 1 map-specific

## Cluster 3 — NCA + AI (reference doc at center)
- REFERENCE: `/docs/nca-ecc-ai-controls/` (5559w) — receives 10 new upward links (8 ecc-* blogs contextual + answer sources + owner-blog lateral + thin `nca-ecc-ai-governance` doc)
- Owner blog `/blog/nca-cybersecurity-requirements-saudi/` keeps list intent; references the doc laterally

## Cluster 4 — SDAIA (hub short ⇄ deep framework)
- HUB: `/hub/sdaia-ai-risk-management/` ⇄ DEEP: `/docs/sdaia-ai-risk-management-framework/` (bidirectional, pre-existing)
- Supporting → deep/hub (new ×6): alignment/90-day/generative-practical → deep (varied anchors); audit-checklist/seven-principles → hub
- `docs/sdaia-generative-ai-guidelines` → deep (lateral)

## Cluster 5 — AI Risk (guide + tool, no PDF fabrication)
- OWNER: `/docs/ai-risk-management/` ← hidden-ai-risks / iso-42001-risk-assessment / sama-ai-risk (new)
- TOOL: `/tools/ai-risk-register/` ← guide + hub + assessment (pre-existing); pdf intent deliberately untargeted (no asset)

## Cluster 6 — AI Security / Firewall (guide → product)
- COMMERCIAL: `/solutions/ai-firewall/` ← `docs/ai-firewall/` (new product link) + hub/blogs (pre-existing)
- Explicit non-confusion with WAF/DLP kept in comparison tables

## Cluster 7 — Human Approval (guide → product)
- COMMERCIAL: `/solutions/human-approval-layer/` ← `docs/human-approval-layer/` (new) + risk guide + firewall doc (pre-existing)

## Cluster 8 — Audit Trail / Evidence (guides → products)
- `/solutions/ai-audit-trail/` ← `docs/ai-audit-trail/` (new); `/solutions/ai-evidence-file/` ← `docs/ai-evidence-file/` (new); cross-links among audit/readiness/evidence docs pre-existing

## Cluster 9 — Sector governance (posts → sector solutions)
- Banking: `blog/sama-banking` → `/solutions/banking-ai-governance/` (new); answer ai-banking → sector (pre-existing)
- Healthcare/government/manufacturing: blog inbound verified pre-existing; answers → sector solutions pre-existing

## Flow summary
```
PILLAR / HUB ──→ CLUSTER GUIDE ──→ SUPPORTING ARTICLE ──→ COMMERCIAL ──→ DEMO/CONTACT
     ↑                ↑ (39 new links) ↑                    ↑ (7 new guide→product)
     └──────── existing pillar→cluster + assessment/contact CTAs kept ────────┘
```
- Boilerplate untouched (nav/footer/CTA buttons kept for UX; density reduced only by NOT adding blocks — one link per page, in-flow).
- No page received an identical injected block; anchors vary within and across clusters.
- Full edge list with anchors + verification: `10-INTERNAL-LINK-GRAPH.csv` (41 rows: 39 new + 2 pre-existing bidirectional).
