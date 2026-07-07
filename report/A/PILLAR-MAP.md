# BrightAI — Pillar Map (Topic Cluster Architecture)

**Date**: 2026-06-29
**Branch**: `feat/seo/pillar-architecture`
**Precondition**: REPORT-20 (Content Audit) — 125 content classified
**Constraint Set**: لا حذف، لا تعديل نص، لا تغيير URLs — رسم علاقات فقط

---

## 1. نظرة عامة (Overview)

موقع BrightAI الحالي (125 محتوى) يلفّ حول **7 Pillars** — كل pillar عنده anchor URL + main keyword + شبكة cluster pages تدعمه. الـ architecture يتبع نمط **Topic Cluster SEO**: صفحات pillar (hubs) ↔ صفحات cluster (spokes) ↔ cross-links بين pillars المتقاربة تبني authority.

**المبدأ الأساسي**: الـ Pillar pages كلها موجودة فعلاً في الموقع. ما ننشئ صفحات جديدة. الـ Map هذا يسجّل بنية authority الموجودة ويرسم شبكة الربط بينها بدون أي تعديل في المحتوى الحالي.

**التغطية**: 7 pillars + ~72 cluster pages = 79 من 125 محتوى (63% coverage). الباقي (46 صفحة / 37%) tactical/utility/legal/EN legal لا يدخلون ضمن pillar/cluster networks لكن يبقون جزء من الـ SEO surface الكامل.

---

## 2. خريطة Pillars الـ 7 (ملخص)

| # | Pillar | Anchor URL | نوع الـ Pillar | Main Keyword | Cluster Count | Saudi Relevance |
|---|---|---|---|---|---|---|
| 1 | **Saudi AI Safety OS** | `/` | Brand (Top of funnel) | نظام حماية الذكاء الاصطناعي السعودي / Saudi AI Safety OS | 8 | 10/10 |
| 2 | **AI Governance Platform** | `/solutions/ai-governance-platform/` | Product (Mid funnel) | منصة حوكمة الذكاء الاصطناعي / AI Governance Platform Saudi | 20 | 10/10 |
| 3 | **PDPL Compliance** | `/blog/pdpl-ai-compliance-guide/` | Regulatory (Compliance) | PDPL compliance Saudi / حماية البيانات الشخصية AI | 13 | 10/10 |
| 4 | **NCA ECC** | `/docs/nca-ecc-ai-controls/` | Cybersecurity Regulatory | NCA ECC AI controls / ضوابط NCA ECC للذكاء الاصطناعي | 7 | 10/10 |
| 5 | **AI Firewall** | `/solutions/ai-firewall/` | Product (Security) | AI firewall Saudi / جدار حماية الذكاء الاصطناعي | 7 | 9/10 |
| 6 | **AI Evidence File** | `/solutions/ai-evidence-file/` | Product/Compliance | AI evidence file Saudi / ملف أدلة الذكاء الاصطناعي | 7 | 10/10 |
| 7 | **BrightAI Kernel** | `/kernel/` | Product/Operational | BrightAI Kernel / كيرنل برايت آي | 10 modules | 10/10 |

---

## 3. Visual Schema (Mermaid)

```
                      ┌──────────────────────────────────┐
                      │  P1: Saudi AI Safety OS (Brand)  │
                      │  Anchor: /                       │
                      └──────────────────────────────────┘
                                       ▲
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
   ┌──────────┴────────────┐ ┌─────────┴──────────┐ ┌──────────┴────────────┐
   │ P2: AI Governance     │ │ P3: PDPL           │ │ P4: NCA ECC           │
   │ Platform              │ │ Compliance         │ │                       │
   │ /solutions/           │ │ /blog/pdpl-ai-     │ │ /docs/nca-ecc-ai-     │
   │ ai-governance-        │ │ compliance-guide/  │ │ controls/             │
   │ platform/             │ │                     │ │                       │
   └───────────────────────┘ └─────────────────────┘ └───────────────────────┘
              ▲                       ▲                          ▲
              │ cross-link            │ cross-link               │ cross-link
              │ (commercial)          │ (audit trail)            │ (technical impl)
   ┌──────────┴────────────┐ ┌────────┴────────────┐  ┌────────┴───────────┐
   │ P5: AI Firewall       │ │ P6: AI Evidence     │  │ P7: BrightAI        │
   │ /solutions/           │ │ File                │  │ Kernel              │
   │ ai-firewall/          │ │ /solutions/         │  │ /kernel/            │
   │                       │ │ ai-evidence-file/   │  │                     │
   └───────────────────────┘ └─────────────────────┘  └─────────────────────┘
              ▲                       ▲
              │ (both serve audit-evidence triangle)
              ▼                       ▼
       Cluster: 7 pages         Cluster: 7 pages
```

---

## 4. Pillar Detail (لكل pillar)

### **Pillar 1 — Saudi AI Safety OS (Brand Pillar)**

| Field | Value |
|---|---|
| **Anchor URL** | `/` |
| **Main Keyword** | نظام حماية الذكاء الاصطناعي السعودي / Saudi AI Safety OS |
| **Search Intent** | navigational + transactional (mixed) |
| **Why a Pillar** | Homepage فيها 16 sections تشمل أهم مواضيع الموقع — أعلى authority page. أول landing لأي زائر. |
| **Authority source** | High — 4,971 كلمة، FAQ schema، JSON-LD (Organization + SoftwareApplication + FAQ + WebSite + DefinedTerm + Speakable) |

**Cluster pages (8):**
| URL | Type | Why cluster | Saudi Relevance |
|---|---|---|---|
| `/services/` | Pillar (services overview) | Services hub — overview of offerings | 10/10 |
| `/about/` | Cluster | E-E-A-T signal — عن الشركة | 10/10 |
| `/trust/` | Cluster (E-E-A-T) | Trust center يستشهد بـ PDPL/NCA/SDAIA/ISO/SFDA/SAMA | 10/10 |
| `/pricing/` | Landing | Commercial entry point | 9/10 |
| `/assessment/ai-governance-readiness/` | Landing | Lead magnet — readiness assessment | 10/10 |
| `/blog/ai-governance-saudi-arabia/` | Blog (Pillar B017) | Saudi-specific overview article | 10/10 |
| `/blog/vision-2030-ai-governance-roadmap/` | Blog (B016) | National roadmap reference | 10/10 |
| `/contact/` | Landing | Conversion endpoint | 10/10 |

**Cross-pillar links (هذا الـ pillar يوصل لـ):**
- → P2 `/solutions/ai-governance-platform/` (hero CTA — "منصة حوكمة AI")
- → P5 `/solutions/ai-firewall/` (security section)
- → P6 `/solutions/ai-evidence-file/` (compliance section)
- → P7 `/kernel/` (product section)

---

### **Pillar 2 — AI Governance Platform (Product Pillar)**

| Field | Value |
|---|---|
| **Anchor URL** | `/solutions/ai-governance-platform/` |
| **Main Keyword** | منصة حوكمة الذكاء الاصطناعي / AI Governance Platform Saudi |
| **Search Intent** | commercial / transactional |
| **Why a Pillar** | "Mother Platform" chip (`المنصة الأم`) في `solutions.ts` — أهم منتج تجاري. أعلى authority product page. |
| **Authority source** | High — 3,388 كلمة، 6 FAQ schema، final CTA، structured lead |

**Cluster pages (20):**

*Blog (7):*
- `/blog/ai-governance/` (B020 — pillar)
- `/blog/what-is-ai-governance-saudi-companies/` (B001 — definitional)
- `/blog/ai-governance-saudi-arabia/` (B017 — Saudi overview)
- `/blog/ai-governance-vs-ai-safety-vs-ai-security/` (B003 — conceptual)
- `/blog/ai-ethics-saudi-responsible-ai/` (B013 — ethics)
- `/blog/ai-audit-trail-saudi/` (B018 — comprehensive)
- `/blog/ai-audit-trail-compliance-path/` (B010 — methodology)

*Docs (5):*
- `/docs/ai-governance-platform/` (D005)
- `/docs/governance-application/` (D008 — architecture)
- `/docs/ai-governance-saudi-arabia/` (D006)
- `/docs/ai-risk-management/` (D007)
- `/docs/ai-audit-readiness/` (D001)

*Child products (4):*
- `/solutions/ai-firewall/` (P5)
- `/solutions/ai-audit-trail/` (cluster to P6)
- `/solutions/human-approval-layer/` (cluster)
- `/solutions/ai-evidence-file/` (P6)

*Sectors (4):*
- `/solutions/banking-ai-governance/`
- `/solutions/government-ai-governance/`
- `/solutions/healthcare-ai-governance/`
- `/solutions/manufacturing-ai-governance/`

**Cross-pillar links:**
- → P3 `/blog/pdpl-ai-compliance-guide/` (compliance section)
- → P4 `/docs/nca-ecc-ai-controls/` (security section)

---

### **Pillar 3 — PDPL Compliance (Regulatory Pillar)**

| Field | Value |
|---|---|
| **Anchor URL** | `/blog/pdpl-ai-compliance-guide/` (B005) |
| **Main Keyword** | PDPL compliance Saudi / حماية البيانات الشخصية والذكاء الاصطناعي |
| **Search Intent** | informational (high commercial value) |
| **Why a Pillar** | B005 أعلى article بـ 2,970 كلمة (14 min read)، faq schema، أعلى سعودي relevance (10/10)، يستشهد بـ PDPL بقوة |
| **Authority source** | High — 2,970 كلمة، FAQ schema، pillar blog article، highest compliance depth |

**Cluster pages (13):**

*Blog (3):*
- `/blog/pdpl-and-ai-saudi/` (B022 — foundational)
- `/blog/pdpl-ai-safety/` (B021 — PDPL + AI safety angle)
- `/blog/ai-customer-data-protection-saudi/` (B019 — customer data)

*Docs (3):*
- `/docs/pdpl-ai-complete-guide/` (D037 — pillar doc)
- `/docs/pdpl-ai-governance/` (D038)
- `/docs/pdpl-chatgpt-data-protection/` (D039)

*Legal AR (5):*
- `/privacy-policy/`
- `/pdpl-statement/`
- `/data-processing-agreement/`
- `/privacy-cookies/`
- `/cookie-policy/`

**Cross-pillar links:**
- → P2 `/solutions/ai-governance-platform/` (CTA section — "منصة تتوافق مع PDPL")
- → P6 `/solutions/ai-evidence-file/` (audit documentation for PDPL)
- → P4 `/docs/nca-ecc-ai-controls/` (complementary cybersecurity pillar)

---

### **Pillar 4 — NCA ECC (Cybersecurity Regulatory Pillar)**

| Field | Value |
|---|---|
| **Anchor URL** | `/docs/nca-ecc-ai-controls/` (D034) |
| **Companion Anchor** | `/blog/nca-ecc-ai-controls-guide/` (B006) — blog format companion |
| **Main Keyword** | NCA ECC AI controls / ضوابط NCA ECC للذكاء الاصطناعي |
| **Search Intent** | informational (technical depth) |
| **Why a Pillar** | D034 أطول doc في الموقع (4,211 كلمة) — أعلى technical depth. يستشهد بـ NCA + ISO 42001 + SDAIA |
| **Authority source** | Very High — 4,211 كلمة، FAQ schema، technical pillar |

**Cluster pages (7):**

*Blog (2):*
- `/blog/nca-ecc-ai-controls-guide/` (B006 — companion)
- `/blog/ai-red-teaming-security-testing/` (B015 — testing methodology)

*Docs (4):*
- `/docs/nca-ecc-ai-guide/` (D036 — pillar)
- `/docs/nca-ecc-ai-controls-mapping/` (D033 — mapping guide)
- `/docs/nca-ecc-ai-governance/` (D035)
- `/docs/ai-firewall/` (D004 — implementation of NCA controls)

**Cross-pillar links:**
- → P2 `/solutions/ai-governance-platform/` (compliance mapping)
- → P5 `/solutions/ai-firewall/` (NCA technical implementation = firewall)

---

### **Pillar 5 — AI Firewall (Product Pillar / Security)**

| Field | Value |
|---|---|
| **Anchor URL** | `/solutions/ai-firewall/` |
| **Main Keyword** | AI firewall Saudi / جدار حماية الذكاء الاصطناعي |
| **Search Intent** | commercial / transactional |
| **Why a Pillar** | Second most important commercial product. يلامس core security narrative — NCA + SDAIA + Data Protection كلهم يستفيدون من firewall |
| **Authority source** | High — 3,388 كلمة، faq، final CTA |

**Cluster pages (7):**

*Blog (4):*
- `/blog/ai-firewall-why-you-need-it/` (B009 — definitional)
- `/blog/hidden-ai-risks-saudi-organizations/` (B002 — risk motivation)
- `/blog/shadow-ai-discovery-saudi-company/` (B004 — discovery)
- `/blog/ai-red-teaming-security-testing/` (B015 — testing)

*Docs (1):*
- `/docs/ai-firewall/` (D004 — technical)

*Related products (3):*
- `/solutions/ai-audit-trail/` (logs the firewall blocks)
- `/solutions/ai-risk-classification/` (classifies what firewall blocks)
- `/solutions/human-approval-layer/` (escalation path)

**Cross-pillar links:**
- → P4 `/docs/nca-ecc-ai-controls/` (NCA technical implementation backing)
- → P3 `/blog/pdpl-ai-compliance-guide/` (data leak prevention = PDPL compliance)
- → P6 `/solutions/ai-evidence-file/` (firewall events go into evidence file)

---

### **Pillar 6 — AI Evidence File (Product/Compliance Pillar)**

| Field | Value |
|---|---|
| **Anchor URL** | `/solutions/ai-evidence-file/` |
| **Main Keyword** | AI evidence file Saudi / ملف أدلة الذكاء الاصطناعي |
| **Search Intent** | commercial + informational (audit context) |
| **Why a Pillar** | يربط بين المنتج التقني والـ PDPL/NCA pillar — يجيب الـ compliance = audit-ready documentation |
| **Authority source** | High — 4,081 كلمة، faq، final CTA |

**Cluster pages (7):**

*Blog (2):*
- `/blog/ai-audit-trail-saudi/` (B018 — comprehensive)
- `/blog/ai-audit-trail-compliance-path/` (B010 — methodology)

*Docs (3):*
- `/docs/ai-evidence-file/` (D003 — technical)
- `/docs/ai-audit-trail/` (D002 — technical)
- `/docs/ai-audit-readiness/` (D001 — readiness)

*Source products (2):*
- `/solutions/ai-audit-trail/` (source data feed)
- `/solutions/human-approval-layer/` (evidence items = approvals)

**Cross-pillar links:**
- → P3 `/blog/pdpl-ai-compliance-guide/` (PDPL audit documentation)
- → P4 `/docs/nca-ecc-ai-controls/` (NCA audit documentation)

---

### **Pillar 7 — BrightAI Kernel (Product/Operational Pillar)**

| Field | Value |
|---|---|
| **Anchor URL** | `/kernel/` |
| **Main Keyword** | BrightAI Kernel / كيرنل برايت آي |
| **Search Intent** | navigational (tactical/operational) |
| **Why a Pillar** | Distinct nav group — the platform's internal product. كل modules هي features داخل الـ kernel |
| **Authority source** | Medium (broken visually per KI-008 — but content exists) |

**Cluster pages (10 modules):**
- `/kernel/chat/` — ↔ `/solutions/ai-firewall/` (P5 cross-link)
- `/kernel/audit/` — ↔ `/solutions/ai-audit-trail/` (P6 cross-link)
- `/kernel/approvals/` — ↔ `/solutions/human-approval-layer/`
- `/kernel/compliance/` — ↔ P3 + P4 (PDPL/NCA reporting)
- `/kernel/connectors/` — ↔ P2 (platform integration)
- `/kernel/evidence/` — ↔ P6 (evidence file source)
- `/kernel/policies/` — ↔ `/solutions/policy-to-control-mapping/`
- `/kernel/reports/` — ↔ P2 (governance platform)
- `/kernel/scenarios/` — ↔ P5 (firewall scenarios)
- `/kernel/stats/` — ↔ `/solutions/ai-use-case-discovery/`

**Cross-pillar links:**
- → P2 `/solutions/ai-governance-platform/` (kernel is implementation of platform)
- → P1 `/` (kernel shown as product platform feature)

---

## 5. Cross-Pillar Linking Map

كل pillar يجب أن يربط بالـ pillars اللي يخدمها. الـ relationships الجوهرية:

```
P1 (Brand) ──┬──> P2 (Product)
             ├──> P3 (Compliance — trust angle)
             ├──> P5 (Product)
             └──> P7 (Internal product showcase)

P2 (Platform) ──┬──> P1 (Brand anchor)
                ├──> P3 (Compliance integration)
                ├──> P4 (NCA integration)
                ├──> P5 (Firewall = child product)
                └──> P6 (Evidence File = child product)

P3 (PDPL) ──┬──> P2 (Platform fulfills compliance)
            ├──> P4 (Complementary — GDPR/NCA together)
            └──> P6 (Evidence file for PDPL)

P4 (NCA) ──┬──> P2 (Platform)
            ├──> P5 (Firewall implements NCA controls)
            └──> P6 (Evidence file for NCA)

P5 (Firewall) ──┬──> P3 (Data leak prevention)
                ├──> P4 (NCA technical controls)
                └──> P6 (Logs → evidence file)

P6 (Evidence File) ──┬──> P3 (PDPL audit documentation)
                     ├──> P4 (NCA audit documentation)
                     └──> P2 (Inside platform)

P7 (Kernel) ──┬──> P1 (Brand product showcase)
              └──> P2 (Kernel is the operational layer)
```

---

## 6. Cluster Page Distribution by Pillar

| Pillar | Cluster Pages | Avg internal links Needed (in) | Avg internal links Needed (out) |
|---|---|---|---|
| P1 (Brand) | 8 | 0 (all link TO it) | 6-8 (out to other pillars) |
| P2 (Platform) | 20 | 4-6 each | 4-6 (related/commercial) |
| P3 (PDPL) | 13 | 3-5 each | 3 (P2, P4, P6) |
| P4 (NCA) | 7 | 3-5 each | 3 (P2, P5, P6) |
| P5 (Firewall) | 7 | 3-5 each | 3 (P3, P4, P6) |
| P6 (Evidence) | 7 | 3-5 each | 3 (P3, P4, P2) |
| P7 (Kernel) | 10 | 2-4 each | 2 (P1, P2) |
| **TOTAL** | **72** | — | — |

الـ detailed links + anchor text + priority في `CLUSTER-LINKING-PLAN.csv`.

---

## 7. Principles for Internal Linking

كل link suggestion يتبع:

1. **Anchor Text** — طبيعي وصفي، يستخدم الـ keyword الرئيسي للـ target، ما يكون generic ("اقرأ أكثر"، "اضغط هنا")
2. **Saudi Dialect** — الـ anchor text بالعربي بالعامية السعودية المتسقة مع باقي الموقع
3. **Placement** — في الـ Related Content widget أولاً، ثم في الـ footer، ثم inline body
4. **Priority 1** — links حرجة (cluster → its pillar) — لازم تنضاف
5. **Priority 2** — links مفيدة (within-pillar cluster ↔ cluster)
6. **Priority 3** — nice-to-have cross-references

**Single Constraint**: لا يتم تعديل النص الحالي. كل priority 1-2 link يتم عبر widgets (RelatedPosts/DocsRelatedLinks/related solutions) الموجودة. الإضافة الفعلية في PR منفصل، بموافقة.

---

## 8. Out-of-Pillar Content (46 of 125 — No Mapping)

الـ content التالي موجود لكن ما يدخل ضمن pillar/cluster networks:

- **Legal EN (5)**: `/en/privacy-policy/`, `/en/cookie-policy/`, `/en/terms/`, `/en/pdpl-statement/`, `/en/data-processing-agreement/` — international compliance surface
- **Utility (5)**: `/404/`, `/sitemap/`, `/offline/`, `/kernel/offline/`, `/kernel/offline.json` — utility only
- **Author (1)**: `/authors/nasser-alabdullah/` — E-E-A-T
- **Hub (2)**: `/hub/`, `/hub/[slug]/` — intermediate discovery page
- **Blog/Docs indexes (4)**: `/blog/`, `/docs/` — navigational
- **Templates (9)**: dynamic route templates — content varies
- **Sparse / non-authority (8)**: kernel docs أقل عمق (kernel-changelog-template, kernel-pages)

هذه كلها تبقى جزء من الـ site الكامل — ما تنحذف ولا تنربط بقوة بالـ Pillar network. هي supporting cast.

---

## 9. Risks & Open Questions

### 9.1 Risks

- **R1 — P1/P7 visually broken**: Homepage (KI-008) وKernel pages عندهم مشاكل بصرية (tokens ناقصة). Pillar architecture تشتغل حتى لو visual fix قادم. لا تأخير.
- **R2 — Internal linking موجود أصلاً بنسبة ~50%**: الـ analysis فوق يحدد الـ gaps. التنفيذ الفعلي لازم يتحقق من الـ existing related-content widgets قبل الإضافة.
- **R3 — Temporal content (B014, B016, B007)**: لها صف خاص — تنربط بـ Pillar 2 (B014=platforms), Pillar 3+B1 (B016=Vision 2030 roadmap), Pillar 4 (B007=SDAIA) لكن تستاهل يدوي special attention.

### 9.2 Open Questions (للمراحل القادمة)

- Q1: هل نريد Pillar 4 anchor يكون D034 (technical) أو B006 (blog)؟ التوصية: D034 كـ comprehensive + B006 كـ companion، لكن التنفيذ يستاهل نقاش.
- Q2: أي clusters يبقون مع Pillar 2 vs Pillar 5/6؟ الـ boundaries حالياً واضحة في `solutions.ts` chips، لكن لو فيه content ضبابي نحتاج نقرر.
- Q3: Hub pages (`/hub/`): هل نعتبرها cluster لـ P1 أم Pillar مستقل؟ حالياً 164 كلمة فقط — recommendation: P1 cluster، لكن لو توسعت (REPORT-20 Priority 3) تستاهل pillar جديد.

---

## 10. Files Reference

- **PILLAR-MAP.md** — هذا الملف (الـ schematic + relationships)
- **CLUSTER-LINKING-PLAN.csv** — قائمة الـ links الفعلية (from → to → anchor → priority)
- **REPORT-21_PILLAR-ARCHITECTURE.md** — التقرير التنفيذي

---

**End of Pillar Map. للـ detailed links شوف `CLUSTER-LINKING-PLAN.csv`.**
