# SDAIA Content Cluster — Design Spec

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent
**Source prompt**: BAI-CONTENT-06
**Status**: Approved for implementation

## 1. Executive Summary

الهدف: بناء عنقود SDAIA مكوّن من 8 مقالات (2 موجودة + 6 جديدة) كلها 1500+ كلمة، و pillar واحد يربطها كلها. الـ pillar هو صفحة `/solutions/government-ai-governance/` الحالية — نطوّرها عشان تكون المرجع الشامل لمواضيع SDAIA. التأثير المتوقع: +8% على Indexation لكلمات SDAIA المفتاحية، و5 مقالات في top 20 لـ 'sdaia' keywords بعد 90 يوم من GSC.

## 2. What We Have Today

| Asset | Path | Status |
|---|---|---|
| Blog: إرشادات سدايا للذكاء التوليدي — دليل عملي | `/blog/sdaia-generative-ai-guidelines-practical-compliance/` | Published, ~1800 words |
| Blog: مبادئ سدايا السبعة — دليل تطبيقي | `/blog/sdaia-seven-principles-practical-guide/` | Published, ~2800 words |
| Pillar: حوكمة الذكاء الاصطناعي في الجهات الحكومية | `/solutions/government-ai-governance/` | Published, sector page |
| SDAIA docs page | `/docs/sdaia-generative-ai-guidelines/` | Published |

## 3. Content Architecture

### Pillar Page — `/solutions/government-ai-governance/`

المبدأ: نبقي الصفحة كحل للقطاع الحكومي لكن نضيف قسم SDAIA Resource Hub في الأسفل يربط كل المقالات الـ 8 مع وصف مختصر لكل مقالة.

Changes:
- `src/data/solutions.ts` – تحديث `blog:[]` ليشمل slugs المقالات الجديدة
- `src/pages/solutions/[slug].astro` – يقرا `solution.blog` و يعرض related blog posts (موجود حالياً)
- ما نلمس المحتوى الحكومي الموجود — نضيف قسم جديد فقط

### 8 Blog Articles

#### Existing (preserve verbatim):

| # | Slug | Topic | Words |
|---|---|---|---|
| 1 | `sdaia-generative-ai-guidelines-practical-compliance` | إرشادات سدايا للذكاء التوليدي — دليل عملي | ~1800 |
| 2 | `sdaia-seven-principles-practical-guide` | مبادئ سدايا السبعة — دليل تطبيقي | ~2800 |

#### New articles (create):

| # | Slug | Topic | Target words | Category | Tags |
|---|---|---|---|---|---|
| 3 | `sdaia-nca-pdpl-regulatory-map` | الخريطة التنظيمية: سدايا + NCA + PDPL — كيف تتكامل؟ | 1500+ | أمن-البيانات | SDAIA, NCA, PDPL, regulatory map, Saudi Arabia |
| 4 | `sdaia-90-day-implementation-plan` | خطة 90 يوم لتطبيق إرشادات سدايا في منشأتك | 1500+ | ذكاء-اصطناعي | SDAIA, implementation, 90-day plan, compliance roadmap |
| 5 | `sdaia-sector-compliance-healthcare-banking-government` | سدايا في القطاعات: الصحة والبنوك والحكومة | 1500+ | دراسات-حالة | SDAIA, sector compliance, healthcare, banking, government |
| 6 | `sdaia-allam-model-enterprise` | نموذج ALLaM من سدايا — وش يعني للمؤسسات السعودية | 1500+ | ذكاء-اصطناعي | SDAIA, ALLaM, sovereign AI, Saudi LLM |
| 7 | `sdaia-audit-checklist-preparedness` | جاهزية تدقيق سدايا — قائمة فحص شاملة | 1500+ | رؤية-2030 | SDAIA, audit, checklist, compliance, preparedness |
| 8 | `sdaia-international-standards-unesco-oecd` | سدايا والمعايير الدولية — التوافق مع UNESCO و OECD | 1500+ | تحول-رقمي | SDAIA, UNESCO, OECD, international standards, AI ethics |

### 3.1 Article Template

كل مقالة جديدة تتبع نفس هيكل المقالات الموجودة:

```markdown
---
title: "..."
description: "..."
canonical: "https://brightai.site/blog/<slug>/"
pubDate: "2026-07-25" (or later)
updatedDate: "2026-07-25"
author: "nasser-alabdullah"
slug: "<slug>"
readingTime: 10-13
category: "<one of 5 categories>"
tags: ["SDAIA", ...]
draft: false
image: "/assets/images/og/brightai-og-1200x630.png"
---

<section class="tldr">
<h2>الملخص السريع</h2>
<p>...</p>
</section>

...body (1500+ words, Saudi dialect)...

<section class="key-takeaways" data-speakable="">
<h2>أهم النقاط</h2>
<ul>...</ul>
</section>

<section class="final">
<h2>الخطوة التالية</h2>
<div class="actions">
  <a class="btn" href="/assessment/ai-governance-readiness/">ابدأ تقييم جاهزية حوكمة AI</a>
  <a class="btn secondary" href="/contact/">تحدث مع الفريق</a>
</div>
</section>
```

### 3.2 Internal Linking Strategy

كل مقالة جديدة تربط:
- داخلية: الـ 7 مقالات الأخرى + الـ pillar + BrightAI solutions ذات العلاقة
- خارجية: مصادر سدايا الرسمية عند الحاجة
- السياق: تشير لبعضها البعض كـ "اقرأ المزيد عن..." في المتن

### 3.3 JSON-LD

المقالات الحالية مو مضيفه JSON-LD `Article` schema بنفسها — `BlogLayout.astro` يتولى إضافة الـ JSON-LD (Article + BreadcrumbList). المقالات الجديدة لازم تتوافق مع نفس البنية.

## 4. Files to Change

| File | Action |
|---|---|
| `src/content/blog/sdaia-nca-pdpl-regulatory-map.md` | **Create** — 1500+ words |
| `src/content/blog/sdaia-90-day-implementation-plan.md` | **Create** — 1500+ words |
| `src/content/blog/sdaia-sector-compliance-healthcare-banking-government.md` | **Create** — 1500+ words |
| `src/content/blog/sdaia-allam-model-enterprise.md` | **Create** — 1500+ words |
| `src/content/blog/sdaia-audit-checklist-preparedness.md` | **Create** — 1500+ words |
| `src/content/blog/sdaia-international-standards-unesco-oecd.md` | **Create** — 1500+ words |
| `src/data/solutions.ts` | **Edit** — update `blog:[]` for `government-ai-governance` to add 6 new slugs |

## 5. Files NOT to Touch

- `src/content/blog/sdaia-generative-ai-guidelines-practical-compliance.md` — موجود، ما نلمسه
- `src/content/blog/sdaia-seven-principles-practical-guide.md` — موجود، ما نلمسه
- `src/pages/solutions/[slug].astro` — يقرا blog array تلقائياً من data
- `src/pages/solutions/[sector].astro` — مو معني
- `src/layouts/BlogLayout.astro` — يتولى JSON-LD + Schema + header

## 6. Acceptance Criteria

- كل SDAIA article 1500+ كلمة
- pillar (government-ai-governance) يربط لـ 8 articles
- GSC بعد 90 يوم: 5 articles في top 20 لـ 'sdaia' keywords

## 7. Verification

```bash
curl -s https://brightai.site/blog/sdaia-generative-ai-guidelines-practical-compliance/ | wc -w
```

Also verify:
```bash
npm run build    # 125 pages, 0 errors
npm run verify:all   # exit 0
curl -s https://brightai.site/solutions/government-ai-governance/ | grep -c "sdaia"  # has SDAIA references
for slug in sdaia-nca-pdpl-regulatory-map sdaia-90-day-implementation-plan sdaia-sector-compliance-healthcare-banking-government sdaia-allam-model-enterprise sdaia-audit-checklist-preparedness sdaia-international-standards-unesco-oecd; do
  curl -s "https://brightai.site/blog/$slug/" | wc -w
done
```

## 8. Rollback

```bash
git revert HEAD
```
