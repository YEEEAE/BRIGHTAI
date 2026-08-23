# Five-pillar internal-link graph — 2026-08-24

## Scope

The graph uses five canonical informational owners. A supporting article receives one owner link only when its slug, category, or tags clearly match the pillar. Contextual in-body links remain the place for commercial destinations; no link was added solely to increase link count.

| Pillar | Canonical owner | Supporting-content route | Commercial/contextual destinations |
| --- | --- | --- | --- |
| AI Governance Saudi Arabia | `/hub/ai-governance/` | Governance, SAMA, ethics, and sector governance articles | `/solutions/ai-governance-platform/` |
| AI Risk Management & SDAIA | `/hub/sdaia-ai-risk-management/` | Risk and SDAIA guidance | `/solutions/ai-risk-classification/`, `/solutions/human-approval-layer/` |
| AI Security & AI Firewall | `/hub/security/` | Firewall, Shadow AI, red-team, and security articles | `/solutions/ai-firewall/`, `/solutions/ai-audit-trail/` |
| Saudi AI Compliance | `/hub/compliance/` | PDPL, NCA ECC, ISO 42001, and privacy articles | `/solutions/ai-firewall/`, `/assessment/ai-governance-readiness/` |
| Agentic AI Governance & Security | `/hub/agentic-ai-governance/` | Agentic AI and audit-evidence answer intent | `/solutions/ai-audit-trail/`, `/solutions/human-approval-layer/`, `/solutions/ai-evidence-file/` |

## Before

```text
Supporting articles ──► category / answer / commercial links
Answer pages          ──► optional further reading (3 of 17 explicit owners)
Pillars               ──► commercial capabilities
```

The pre-change audit found 0 broken links, 0 orphans, and maximum click depth 3. However, the explicit owner relationship was incomplete: most answer pages had no canonical pillar, and supporting posts had no consistent owner rule.

## After

```text
Supporting articles ──► one topical canonical pillar ──► relevant commercial capability
Answer pages          ──► canonical pillar owner + visible / schema breadcrumb
Governance hub        ──► AI Governance Platform
SDAIA risk guide      ──► Risk Classification + Human Approval Layer
PDPL / NCA guidance   ──► AI Firewall
ISO 42001 guide       ──► Readiness Assessment
Agentic governance    ──► Audit Trail + Human Approval + Evidence File
Banking guidance      ──► Evidence File
```

## Measured audit delta

| Metric | Before | After |
| --- | ---: | ---: |
| Internal links discovered | 17,125 | 17,133 |
| Broken links | 0 | 0 |
| Strategic orphans | 0 | 0 |
| Pages outside sitemap | 0 | 0 |
| Max click depth | 3 | 3 |
| Answer pages with explicit canonical owner | 3 | 17 |
| Answer pages with visible + JSON-LD breadcrumbs | 0 | 17 |

## Validation notes

- `pnpm build` completed locally. Existing Astro route-collision and Vite/Prisma warnings remain outside this scope.
- `npm run internal-links:audit` passed: 0 broken links, 0 orphans, no priority page above depth 3.
- The audit retains 19 existing no-href controls and 103 existing hash-target findings; neither was introduced by this change.
