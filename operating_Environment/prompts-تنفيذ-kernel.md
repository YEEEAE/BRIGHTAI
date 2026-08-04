# 🚀 BRIGHTAI Kernel - Prompts التنفيذ الشاملة

بناءً على تقرير UI/UX و Frontend Architecture الشامل، إليك **15 Prompt تنفيذي** مرتبة حسب الأولوية (Impact vs Effort).

---

## 📋 فهرس البرومبتات

| # | الأولوية | العنوان | Impact | Effort | الفئة |
|---|---------|---------|--------|--------|------|
| 1 | P0 | Honesty Badges للـ Demo Data | Critical | S | UX |
| 2 | P0 | Mobile-First Chat Redesign | Critical | M | UI/Responsive |
| 3 | P0 | Confirmation & Undo Patterns | Critical | S | UX |
| 4 | P1 | Role-Based Personalized Journey | High | M | UX/IA |
| 5 | P1 | Smart Empty States | High | S | UX |
| 6 | P1 | TypeScript Migration للـ Client JS | High | L | Architecture |
| 7 | P1 | Shared PII Detection Library | High | M | Architecture |
| 8 | P1 | Visual Condition Builder | High | L | UX |
| 9 | P2 | Heat Map Mobile Enhancement | Medium | M | Responsive |
| 10 | P2 | Preset Filters & Ranges | Medium | S | UX |
| 11 | P2 | PDF.js Viewer للـ Evidence | Medium | M | Performance |
| 12 | P2 | Plain Arabic Consent Flow | Medium | S | UX |
| 13 | P3 | Product Tour (Onboarding) | Low | M | UX |
| 14 | P3 | Component Documentation (Storybook) | Medium | L | Architecture |
| 15 | P3 | Cross-Page "Try in Playground" Links | Low | S | UX |

---

---
---

### 🎯 PROMPT 14: Component Documentation (Storybook)

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- No component documentation
- Hard to onboard new developers
- Inconsistent usage

الملفات المرشحة:
- .storybook/ (existing)
- src/components/kernel/*.stories.astro (add)

نفّذ:
1. أضف stories لكل مكون:
```astro
---
// KernelMetricCard.stories.astro
---
<Story title="Kernel/MetricCard">
  <Variant name="Default">
    <KernelMetricCard label="إجمالي الطلبات" value="1,247" trend="+12%" />
  </Variant>
  <Variant name="Demo">
    <KernelMetricCard label="إجمالي الطلبات" value="1,247" trend="+12%" demo />
  </Variant>
</Story>
```

2. Document props:
```markdown
## Props
- `label: string` - Metric label
- `value: string | number` - Metric value
- `trend: string` - Trend indicator
- `demo?: boolean` - Show demo badge
```

3. Add usage examples
4. Deploy إلى GitHub Pages

قواعد:
- Storybook 7+
- Astro integration
- Auto-generated من TypeScript types

معايير القبول:
✅ All components documented
✅ Stories for each variant
✅ Props documented
✅ Deployed

---

### 🎯 PROMPT 15: Cross-Page "Try in Playground" Links

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- Users يرون policy في /kernel/policies/ ولا يعرفون كيف يجربونها
- No easy way to test policies

الملفات المرشحة:
- src/pages/kernel/policies.astro
- src/pages/kernel/scenarios.astro
- src/pages/kernel/compliance.astro

نفّذ:
1. Add "Try in Playground" button:
```astro
<a href={`/kernel/playground/?policy=${policy.id}`}>
  🧪 جرب في الملعب
</a>
```

2. Playground reads URL params:
```javascript
const urlParams = new URLSearchParams(window.location.search);
const policyId = urlParams.get('policy');

if (policyId) {
  activatePolicy(policyId);
}
```

قواعد:
- Preserve existing state
- Clear indication of pre-filled policy
- RTL support

معايير القبول:
✅ Links work
✅ Playground pre-fills
✅ Clear indication

---

## 📊 ملخص الخطة التنفيذية

### الأسبوع 1 (P0):
- Day 1-2: Prompt 1 (Honesty Badges)
- Day 3-4: Prompt 2 (Mobile Chat)
- Day 5: Prompt 3 (Confirmation & Undo)

### الأسبوع 2 (P1):
- Prompt 4 (Role-Based Journey)
- Prompt 5 (Empty States)
- Prompt 6 (TypeScript Migration - start)

### الأسبوع 3-4 (P1 + P2):
- Prompt 6 (TypeScript - complete)
- Prompt 7 (Shared PII Library)
- Prompt 8 (Visual Condition Builder)
- Prompt 9-12 (P2 improvements)

### الشهر 2 (P3):
- Prompt 13-15 (Polish)

---

## 🎯 النتيجة المتوقعة

**بعد تنفيذ الـ 15 Prompt:**

| المعيار | قبل | بعد |
|---------|-----|-----|
| UI/UX Score | 8/10 | 9.5/10 |
| Mobile Score | 6/10 | 9.5/10 |
| Accessibility | 7.5/10 | 9.5/10 |
| Maintainability | 6/10 | 9/10 |
| Honesty Score | 5/10 | 10/10 |
| **Overall** | **7.5/10** | **9.5/10** |

**الحالة النهائية**: ✅ **Production-ready** مع UX عالمي.