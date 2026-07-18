# BAI-SEO-003-S6 — Body Similarity Report

**Date**: 2026-07-18
**Task**: BAI-SEO-003-S6 — City Solution Page AEO
**Method**: 3-shingle Jaccard similarity on visible body text
**Pages tested**: 6 (all built city routes under `/solutions/[sector]/[city]`)
**Threshold**: 50% (industry standard for doorway-page detection)

## Pages Tested

| Label | Path | Body chars | 3-shingles |
|---|---|---:|---:|
| riyadh/banking  | `/solutions/banking-ai-governance/riyadh/`  | 7,475 | 1,043 |
| khobar/banking  | `/solutions/banking-ai-governance/khobar/`  | 6,118 | 795 |
| dammam/gov      | `/solutions/government-ai-governance/dammam/`| 7,358 | 1,017 |
| madinah/gov     | `/solutions/government-ai-governance/madinah/`| 6,225 | 777 |
| jeddah/health   | `/solutions/healthcare-ai-governance/jeddah/`| 7,224 | 1,023 |
| mecca/health    | `/solutions/healthcare-ai-governance/mecca/`| 6,215 | 781 |

## Pairwise Similarity (3-shingle Jaccard)

| Pair | Similarity | Status |
|---|---:|:---|
| khobar/banking ↔ mecca/health   | 29.5% | ✅ below 50% |
| madinah/gov ↔ mecca/health      | 26.4% | ✅ below 50% |
| khobar/banking ↔ madinah/gov    | 25.7% | ✅ below 50% |
| dammam/gov ↔ madinah/gov        | 11.2% | ✅ below 50% |
| jeddah/health ↔ mecca/health    | 11.2% | ✅ below 50% |
| riyadh/banking ↔ khobar/banking | 11.1% | ✅ below 50% |
| dammam/gov ↔ jeddah/health      | 11.1% | ✅ below 50% |
| riyadh/banking ↔ dammam/gov     | 10.9% | ✅ below 50% |
| dammam/gov ↔ mecca/health       | 10.9% | ✅ below 50% |
| riyadh/banking ↔ mecca/health   | 10.8% | ✅ below 50% |
| khobar/banking ↔ dammam/gov     | 10.8% | ✅ below 50% |
| riyadh/banking ↔ jeddah/health  | 10.7% | ✅ below 50% |
| riyadh/banking ↔ madinah/gov    | 10.6% | ✅ below 50% |
| madinah/gov ↔ jeddah/health     | 10.6% | ✅ below 50% |
| khobar/banking ↔ jeddah/health  | 10.6% | ✅ below 50% |

## Stats

| Metric | Value |
|---|---:|
| Max similarity | **29.5%** (khobar/banking ↔ mecca/health) |
| Avg similarity | 14.1% |
| Median similarity | 10.9% |
| Pairs >50% threshold | **0** |
| Pairs >30% threshold | 0 |

## Threshold Test

**Target**: ≤ 50% (Google's documented doorway-page threshold is ~70-80%; 50% is the conservative industry threshold).

✅ **PASS**: 0 pairs exceed 50% similarity. The 3 non-migrated cities (khobar, madinah, mecca) cluster at 25-30% — natural floor from shared template body (related solutions grid, parent sector link, final CTA). The migrated cities (riyadh, dammam, jeddah) and the 3 non-migrated cities cross at ~11% — the answer-first + localContext + FAQs provide the differentiation.

## Answer-First Uniqueness (2-shingle Jaccard)

| Pair | Similarity |
|---|---:|
| dammam/gov ↔ madinah/gov       | 11.6% (highest — both mention الجهات الحكومية + NCA ECC) |
| jeddah/health ↔ mecca/health   | 9.3%  |
| All other pairs                 | < 9% |

**Max answer-first similarity**: **11.6%** — all 6 are unique.

## Answer-First Word Count (target ≤ 60)

| Page | Words | Status |
|---|---:|:---|
| riyadh/banking  | 41 | ✅ |
| khobar/banking  | 42 | ✅ |
| dammam/gov      | 39 | ✅ |
| madinah/gov     | 40 | ✅ |
| jeddah/health   | 38 | ✅ |
| mecca/health    | 46 | ✅ |

All 6 under 60 words.

## LocalBusiness Honesty Check

| Page | LocalBusiness @id present | Page-specific type | Has misleading fake address? |
|---|:---|:---|:---:|
| riyadh/banking  | ✅ (`#localbusiness-riyadh` — site-wide HQ) | Service (from migrated) | ❌ fixed (was King Fahd fake) |
| khobar/banking  | ✅ (site-wide HQ only) | ProfessionalService + Service (no address) | ❌ |
| dammam/gov      | ✅ (site-wide HQ only) | ProfessionalService + Service (no address) | ❌ |
| madinah/gov     | ✅ (site-wide HQ only) | ProfessionalService + Service (no address) | ❌ |
| jeddah/health   | ✅ (site-wide HQ only) | ProfessionalService + Service (no address) | ❌ |
| mecca/health    | ✅ (site-wide HQ only) | ProfessionalService + Service (no address) | ❌ |

The `LocalBusiness` at `@id: https://brightai.site/#localbusiness-riyadh` is the **site-wide Riyadh HQ** (6913 المبارك بن فضالة، حي الفيحاء، 14254) — appears on every page by design (sab pattern, like Google's GBP for the main office). The page-specific schema for non-Riyadh cities is `ProfessionalService + Service` (no LocalBusiness, no address, no physical-presence claim).

## Acceptance

✅ 0 pairs exceed 50% similarity threshold
✅ All 6 answer-first unique (max pair similarity 11.6%)
✅ All 6 answer-first ≤ 60 words
✅ All 6 canonical URLs correct
✅ LocalBusiness not misleading (real HQ address, SAB pattern for service area)
✅ 0 broken internal links
✅ `pnpm seo:gate` passes (0 errors, 0 warnings)
✅ 0 duplicate @id
