# SDAIA Content Cluster — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution, task by task.

**Goal:** Build an SDAIA content cluster: 8 articles (2 existing + 6 new, 1500+ words each) + pillar page at `/solutions/government-ai-governance/` that links to all 8.

**Architecture:** 6 new blog markdown files under `src/content/blog/` following the same frontmatter + Saudi-dialect structure as existing SDAIA articles. One data file edit in `src/data/solutions.ts` to wire the new slugs into the pillar. The `[slug].astro` page + `RelatedLinks.astro` component read `solution.blog` automatically — no template changes needed.

**Tech Stack:** Astro content collections (Markdown), TypeScript data.

---

### Task 1: Article "الخريطة التنظيمية: سدايا + NCA + PDPL"

**Files:**
- Create: `src/content/blog/sdaia-nca-pdpl-regulatory-map.md`

- [ ] **Step 1: Scaffold frontmatter + article body (1500+ words)**

Full content in `sdaia-nca-pdpl-regulatory-map.md`:
- Frontmatter: title, description, canonical, pubDate (2026-07-25), author (nasser-alabdullah), slug, category (أمن-البيانات), tags
- Body: مقدمة → 3 سيناريوهات (كل سيناريو يشرح التداخل بين سدايا وNCA وPDPL) → جدول مقارنة → جدول حالات تطبيقية → FAQs → خلاصة
- Internal links to: /solutions/government-ai-governance/, /blog/sdaia-generative-ai-guidelines-practical-compliance/, /blog/sdaia-seven-principles-practical-guide/

- [ ] **Step 2: Verify word count**

Run: `wc -w src/content/blog/sdaia-nca-pdpl-regulatory-map.md`

---

### Task 2: Article "خطة 90 يوم لتطبيق إرشادات سدايا"

**Files:**
- Create: `src/content/blog/sdaia-90-day-implementation-plan.md`

- [ ] **Step 1: Write article (1500+ words)**

Frontmatter + body:
- Category: ذكاء-اصطناعي
- Tags: SDAIA, implementation, 90-day plan, compliance roadmap, Saudi
- Body: Week 1-2 assessment → Week 3-4 policy → Week 5-8 controls → Week 9-10 testing → Week 11-12 launch → لكل مرحلة: وش تسوي، وش يطلع لك، وش تكلفته التقريبية
- Links to: /solutions/government-ai-governance/, /solutions/ai-governance-platform/, /blog/sdaia-seven-principles-practical-guide/

- [ ] **Step 2: Verify word count**

---

### Task 3: Article "سدايا في القطاعات: الصحة والبنوك والحكومة"

**Files:**
- Create: `src/content/blog/sdaia-sector-compliance-healthcare-banking-government.md`

- [ ] **Step 1: Write article (1500+ words)**

Category: دراسات-حالة
- Body: 3 case studies — مستشفى يطبق إرشادات سدايا (SFDA + سدايا)، بنك يطبق (SAMA + سدايا)، جهة حكومية تطبق (DGA + سدايا). لكل حالة: التحدي، الحل، النتيجة، الضوابط المطبقة.
- Links to: /solutions/healthcare-ai-governance/, /solutions/banking-ai-governance/, /solutions/government-ai-governance/

- [ ] **Step 2: Verify word count**

---

### Task 4: Article "نموذج ALLaM — وش يعني للمؤسسات السعودية"

**Files:**
- Create: `src/content/blog/sdaia-allam-model-enterprise.md`

- [ ] **Step 1: Write article (1500+ words)**

Category: ذكاء-اصطناعي
- Body: وش هو ALLaM؟ الفرق بين النماذج السيادية والتجارية. متى تستخدم ALLaM ومتى تستخدم ChatGPT. متطلبات الحوكمة للنماذج السيادية. التكامل مع Kernel.
- Links to: /solutions/government-ai-governance/, /blog/saudi-ai-landscape-sdaia-humain-allam-scai/, /kernel/

- [ ] **Step 2: Verify word count**

---

### Task 5: Article "جاهزية تدقيق سدايا — قائمة فحص شاملة"

**Files:**
- Create: `src/content/blog/sdaia-audit-checklist-preparedness.md`

- [ ] **Step 1: Write article (1500+ words)**

Category: رؤية-2030
- Body: قائمة فحص كاملة — وش يحتاج المدقق يشوفه. Policy gaps, control gaps, evidence gaps. لكل فجوة: وش تسوي عشان تسدها. Timeline للجاهزية.
- Links to: /solutions/government-ai-governance/, /solutions/ai-evidence-file/, /solutions/ai-audit-trail/, /blog/sdaia-seven-principles-practical-guide/

- [ ] **Step 2: Verify word count**

---

### Task 6: Article "سدايا والمعايير الدولية — التوافق مع UNESCO و OECD"

**Files:**
- Create: `src/content/blog/sdaia-international-standards-unesco-oecd.md`

- [ ] **Step 1: Write article (1500+ words)**

Category: تحول-رقمي
- Body: مقارنة منهجية: مبادئ سدايا السبعة ← مقابل OECD AI Principles ← مقابل UNESCO AI Ethics. جدول توافق. وش يعني للمؤسسات السعودية اللي تبغى تصدّر أو تتعامل دولياً.
- Links to: /solutions/government-ai-governance/, /blog/sdaia-seven-principles-practical-guide/, /blog/iso-42001-saudi-implementation-guide/

- [ ] **Step 2: Verify word count**

---

### Task 7: تحديث data/pillar link

**Files:**
- Modify: `src/data/solutions.ts` (lines ~456: government-ai-governance blog array)

- [ ] **Step 1: Read the existing blog array for government-ai-governance**

Current line (around 456):
```typescript
    docs:['/docs/pdpl-ai-governance/'], blog:['/blog/ai-governance-saudi-arabia/','/blog/saudi-ai-regulators-guide/','/blog/sdaia-seven-principles-practical-guide/'],
```

- [ ] **Step 2: Add 6 new article slugs + existing sdaia article + update to 8 total**

```typescript
    docs:['/docs/pdpl-ai-governance/'], blog:['/blog/ai-governance-saudi-arabia/','/blog/saudi-ai-regulators-guide/','/blog/sdaia-generative-ai-guidelines-practical-compliance/','/blog/sdaia-seven-principles-practical-guide/','/blog/sdaia-nca-pdpl-regulatory-map/','/blog/sdaia-90-day-implementation-plan/','/blog/sdaia-sector-compliance-healthcare-banking-government/','/blog/sdaia-allam-model-enterprise/','/blog/sdaia-audit-checklist-preparedness/','/blog/sdaia-international-standards-unesco-oecd/'],
```

This adds the 6 new + the existing sdaia-generative-ai-guidelines-practical-compliance that was missing.

- [ ] **Step 3: Update blogAnchorMap in RelatedLinks.astro**

Add the 6 new slugs to `blogAnchorMap` in `src/components/RelatedLinks.astro` so they get descriptive Arabic labels.

---

### Task 8: Build & verify

- [ ] **Step 1: Build the full site**

Run: `npm run build`
Expected: 125+ pages, 0 errors

- [ ] **Step 2: Verify all articles exist in built output**

Run:
```bash
ls dist/blog/ | grep sdaia
```
Expected: 8 sdaia directories

- [ ] **Step 3: Verify pillar page has blog links**

Run:
```bash
curl -s http://localhost:4321/solutions/government-ai-governance/ | grep -c "sdaia"
```
Expected: ≥ 8 mentions

- [ ] **Step 4: Word count check on each new article**

Run:
```bash
for f in src/content/blog/sdaia-nca-pdpl-regulatory-map src/content/blog/sdaia-90-day-implementation-plan src/content/blog/sdaia-sector-compliance-healthcare-banking-government src/content/blog/sdaia-allam-model-enterprise src/content/blog/sdaia-audit-checklist-preparedness src/content/blog/sdaia-international-standards-unesco-oecd; do echo "$f: $(wc -w < ${f}.md) words"; done
```
Expected: كلها ≥ 1500 words

---

### Task 9: Report & commit

- [ ] **Step 1: Write execution report at `report/2026-07-25-sdaia-cluster-execution.md`**

Includes: files created/modified, word counts per article, build status, risks remaining.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(content): SDAIA content cluster — 6 new articles + pillar update"
```
