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

## 🔴 P0 - Critical Blockers (يجب تنفيذها خلال 3 أيام)

### 🎯 PROMPT 1: Honesty Badges للـ Demo Data

**الهدف**: إزالة الخداع البصري في عرض الأرقام الثابتة كـ "حية".

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/ (index.astro:150) يعرض KPIs ثابتة (0 سجل PII محجوب) مع نص "أرقام تتزايد أمامك"
- المستخدم يعتقد أن الأرقام حية لكنها Demo data من kernel.ts
- هذا يخالف مبدأ "Demo/Live Honesty" المذكور في KernelLayout.astro

الأثر:
- تضليل المستخدم الجديد
- فقدان الثقة عند اكتشاف الحقيقة
- CISOs ومسؤولو الامتثال يرفضون المنتج

الملفات المرشحة:
- src/pages/kernel/index.astro
- src/components/kernel/KernelMetricCard.astro
- src/components/kernel/KernelDemoPill.astro
- src/data/kernel.ts

نفّذ:
1. أضف `KernelDemoPill` بجانب كل KPI يستخدم demo data
2. عدّل `KernelMetricCard` لاستقبال prop `demo?: boolean`
3. عند `demo=true`:
   - اعرض badge "بيانات توضيحية" بلون عنبري
   - أضف tooltip: "هذه أرقام تجريبية. ربط Kernel ببيئتك لأرقام حقيقية"
   - أضف icon ⚠️ قبل الرقم
4. عدّل النصوص التسويقية:
   - ❌ "أرقام تتزايد أمامك"
   - ✅ "أمثلة على المؤشرات الحية في بيئة الإنتاج"
5. أضف CTA واضح: "شغّل سيناريو لرؤية أرقام حقيقية" → /kernel/scenarios/

قواعد:
- لا تحذف البيانات التجريبية (مهمة للعرض)
- لا تغير تصميم البطاقات
- حافظ على RTL
- حافظ على Accessibility (aria-label للـ badge)

معايير القبول:
✅ كل KPI demo يحمل badge واضح
✅ Tooltip يظهر على hover/focus
✅ Screen readers announce "Demo data"
✅ CTA بارز للمستخدم الجديد
✅ لا regression في التصميم

اختبارات إلزامية:
- pnpm build
- pnpm typecheck
- visual regression على /kernel/
- screen reader test (VoiceOver/NVDA)

screenshots المطلوبة:
- KPIs قبل/بعد
- Tooltip state
- Mobile view

الأوامر:
```bash
pnpm dev
# افتح /kernel/
# تحقق من كل KPI
# جرب screen reader
```

Rollback plan:
```bash
git revert <commit-sha>
```

الحالة بعد التنفيذ: Honesty Score 100%
```

---

### 🎯 PROMPT 2: Mobile-First Chat Redesign

**الهدف**: حل الانهيار الكامل لـ 3-pane layout على الجوال.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/chat/ (chat.astro:50) يستخدم 3-pane layout (Threads | Thread | Context)
- على الجوال (<768px): الـ 3 panes تتداخل وتفقد الوظيفة
- لا يوجد strategy واضحة للـ mobile collapse
- المستخدم يفقد القدرة على التنقل بين المحادثات ورؤية metadata

الأثر:
- Critical UX failure على الجوال (40%+ من الزوار)
- فقدان الوظيفة الأساسية
- High bounce rate

الملفات المرشحة:
- src/pages/kernel/chat.astro
- kernel/assets/css/pages/chat.css
- src/components/kernel/KernelChatError.astro
- public/js/kernel-chat.js

نفّذ:
1. أنشئ 3 تبويبات للجوال:
   - Tab 1: "المحادثات" (Threads list)
   - Tab 2: "المحادثة" (Active thread)
   - Tab 3: "التفاصيل" (Context panel)

2. استخدم `KernelTabs` component الموجود:
```astro
<KernelTabs tabs={[
  { id: 'threads', label: 'المحادثات', icon: '💬' },
  { id: 'chat', label: 'المحادثة', icon: '✉️' },
  { id: 'context', label: 'التفاصيل', icon: 'ℹ️' }
]} />
```

3. CSS responsive strategy:
```css
@media (max-width: 768px) {
  .kernel-chat-layout {
    grid-template-columns: 1fr;
  }
  .kernel-chat-threads,
  .kernel-chat-context {
    display: none;
  }
  .kernel-chat-threads[data-tab-active="threads"],
  .kernel-chat-context[data-tab-active="context"] {
    display: block;
  }
}
```

4. Swipe gestures بين التبويبات (optional):
```javascript
// kernel-chat.js
let touchStartX = 0;
element.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
element.addEventListener('touchend', (e) => {
  const deltaX = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(deltaX) > 50) {
    // swipe left/right → change tab
  }
});
```

5. Composer fixed في الأسفل (دائماً مرئي):
```css
.kernel-chat-composer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  padding-bottom: env(safe-area-inset-bottom);
}
```

6. Auto-scroll للرسائل الجديدة
7. Preserve thread state عند التبديل بين التبويبات

قواعد:
- لا تغير desktop layout (≥1024px)
- Tablet (768-1024): 2 panes (threads + chat)
- Composer دائماً مرئي
- RTL support كامل
- Safe area insets للـ iOS

معايير القبول:
✅ Tabs تعمل على الجوال (375px)
✅ Swipe gestures تعمل
✅ Composer ثابت في الأسفل
✅ Auto-scroll يعمل
✅ State preserved بين التبويبات
✅ Desktop layout لم يتأثر
✅ Tablet mode يعمل

اختبارات إلزامية:
- pnpm build
- pnpm typecheck
- Browser testing:
  - iPhone SE (375px)
  - iPhone 14 (390px)
  - iPad (768px)
  - Desktop (1440px)
- Touch target ≥ 44px

screenshots المطلوبة:
- Mobile: كل تبويب
- Tablet: 2 panes
- Desktop: 3 panes (unchanged)
- Safe area handling

الأوامر:
```bash
pnpm dev
# افتح /kernel/chat/ على mobile simulator
# جرب swipe
# جرب tabs
# تحقق من composer
```

Rollback plan:
```bash
git revert <commit-sha>
```

الحالة بعد التنفيذ: Mobile Chat Score 95%
```

---

### 🎯 PROMPT 3: Confirmation & Undo Patterns

**الهدف**: منع الإجراءات الخطأ غير القابلة للتراجع.

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/approvals/ (approvals.astro:200): Approve يتم بدون confirmation
- /kernel/approvals/ (approvals.astro:250): Reject لا يوجد undo
- المستخدم قد يوافق/يرفض بالخطأ بدون فرصة للإصلاح

الأثر:
- Critical: خطأ لا يُغتفر في بيئة الإنتاج
- فقدان الثقة
- Support tickets عالية

الملفات المرشحة:
- src/pages/kernel/approvals.astro
- public/js/kernel-approvals.js
- src/components/kernel/KernelConfirmDialog.astro (new)
- src/components/kernel/KernelUndoToast.astro (new)

نفّذ:
1. أنشئ `KernelConfirmDialog` component:
```astro
---
interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}
---
<div role="dialog" aria-modal="true" aria-labelledby="confirm-title">
  <h2 id="confirm-title">{title}</h2>
  <p>{message}</p>
  <button class="btn-{variant}" onClick={onConfirm}>{confirmLabel}</button>
  <button onClick={onCancel}>{cancelLabel ?? 'إلغاء'}</button>
</div>
```

2. أنشئ `KernelUndoToast` component:
```astro
---
interface Props {
  message: string;
  duration?: number; // default 10000ms
  onUndo: () => void;
}
---
<div role="status" aria-live="polite" class="toast">
  <span>{message}</span>
  <button onClick={onUndo}>تراجع</button>
</div>
```

3. طبّق في Approvals:
```javascript
// kernel-approvals.js
async function approveRequest(requestId) {
  // Show confirmation
  const confirmed = await showConfirm({
    title: 'تأكيد الموافقة',
    message: 'هل أنت متأكد من الموافقة على هذا الطلب؟',
    confirmLabel: 'نعم، وافق',
    variant: 'warning'
  });
  
  if (!confirmed) return;
  
  // Approve
  await api.approve(requestId);
  
  // Show undo toast
  showUndoToast({
    message: 'تمت الموافقة على الطلب',
    duration: 10000,
    onUndo: async () => {
      await api.undoApprove(requestId);
      refreshList();
    }
  });
}
```

4. طبّق نفس النمط في:
- /kernel/policies/ (policy deletion)
- /kernel/evidence/ (evidence deletion)
- /kernel/connectors/ (connector disable)

5. Keyboard support:
- `Enter` → confirm
- `Escape` → cancel
- `Tab` → navigate buttons
- Focus trap داخل الـ dialog

قواعد:
- Confirmation إلزامي للإجراءات الخطرة
- Undo متاح لمدة 10 ثوانٍ فقط
- Toast يختفي تلقائياً بعد المدة
- لا تحفظ.undo history في localStorage (security)
- RTL support
- Accessibility: focus trap + aria-live

معايير القبول:
✅ Confirmation يظهر قبل كل إجراء خطر
✅ Undo toast يظهر بعد الإجراء
✅ Undo يعمل خلال 10 ثوانٍ
✅ Keyboard navigation يعمل
✅ Focus trap يعمل
✅ Screen readers announce الحالة
✅ No regression في السرعة

اختبارات إلزامية:
- pnpm build
- pnpm typecheck
- E2E test: approve → undo
- Keyboard-only test
- Screen reader test

screenshots المطلوبة:
- Confirmation dialog
- Undo toast
- Mobile view
- Keyboard focus states

الأوامر:
```bash
pnpm dev
# افتح /kernel/approvals/
# جرب approve
# جرب undo
# جرب keyboard only
```

Rollback plan:
```bash
git revert <commit-sha>
```

الحالة بعد التنفيذ: Safety Score 100%
```

---

## 🟠 P1 - High Impact (خلال أسبوع)

### 🎯 PROMPT 4: Role-Based Personalized Journey

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/ (index.astro:100): 21 صفحة معروضة بدون ترتيب حسب الدور
- المستخدم الجديد لا يعرف من أين يبدأ
- Cognitive overload: كثرة الخيارات

الأثر:
- High bounce rate للمستخدمين الجدد
- Time-to-value طويل
- User confusion

الملفات المرشحة:
- src/pages/kernel/index.astro
- src/components/kernel/KernelRoleSelector.astro (new)
- src/components/kernel/KernelRecommendedJourney.astro (new)
- src/data/kernel.ts

نفّذ:
1. أنشئ `KernelRoleSelector`:
```astro
---
const roles = [
  { id: 'ciso', label: 'CISO / DPO', icon: '🛡️' },
  { id: 'compliance', label: 'مسؤول امتثال', icon: '✅' },
  { id: 'developer', label: 'مطور', icon: '👨‍💻' },
  { id: 'employee', label: 'موظف', icon: '👤' }
];
---
<div class="role-selector">
  <h2>ما دورك في الشركة؟</h2>
  {roles.map(role => (
    <button onClick={() => selectRole(role.id)}>
      {role.icon} {role.label}
    </button>
  ))}
</div>
```

2. أنشئ `KernelRecommendedJourney`:
```astro
---
const journeys = {
  ciso: [
    { step: 1, label: 'راجع حالة الامتثال', href: '/kernel/compliance/' },
    { step: 2, label: 'افحص سجل التدقيق', href: '/kernel/audit/' },
    { step: 3, label: 'راجع الأدلة', href: '/kernel/evidence/' }
  ],
  compliance: [
    { step: 1, label: 'راجع الفجوات', href: '/kernel/compliance/' },
    { step: 2, label: 'ولّد الأدلة', href: '/kernel/evidence/' },
    { step: 3, label: 'أنشئ تقرير', href: '/kernel/reports/' }
  ],
  developer: [
    { step: 1, label: 'اقرأ التوثيق', href: '/kernel/api/' },
    { step: 2, label: 'جرب الملعب', href: '/kernel/playground/' },
    { step: 3, label: 'اربط نماذجك', href: '/kernel/connectors/' }
  ],
  employee: [
    { step: 1, label: 'ابدأ محادثة آمنة', href: '/kernel/chat/' },
    { step: 2, label: 'جرب الملعب', href: '/kernel/playground/' }
  ]
};
---
```

3. احفظ الدور في `localStorage`:
```javascript
function selectRole(roleId) {
  localStorage.setItem('brightai-kernel-role', roleId);
  document.body.setAttribute('data-role', roleId);
  showRecommendedJourney(roleId);
}
```

4. أضف "Recommended Journey" section بارز في Index
5. Add "Change Role" link في Sidebar

قواعد:
- Role selection اختياري (يمكن تجاهله)
- Journey يظهر 3 خطوات فقط (لا أكثر)
- كل خطوة لها CTA واضح
- Preserve existing unit cards

معايير القبول:
✅ Role selector واضح
✅ Journey يظهر حسب الدور
✅ localStorage persistence
✅ "Change Role" link موجود
✅ No regression في existing UI

الأوامر:
```bash
pnpm dev
# افتح /kernel/
# اختر دور
# تحقق من Journey
# Reload الصفحة
```

Rollback plan:
```bash
git revert <commit-sha>
```

---

### 🎯 PROMPT 5: Smart Empty States

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- عدة صفحات (Audit, Approvals, Evidence) تعرض demo data دائماً
- لا يوجد empty state حقيقي عندما لا توجد بيانات
- المستخدم لا يعرف كيف يبدأ

الأثر:
- Confusion: "هل هذه بيانات حقيقية؟"
- No clear onboarding path

الملفات المرشحة:
- src/components/kernel/KernelEmptyState.astro (enhance)
- src/pages/kernel/audit.astro
- src/pages/kernel/approvals.astro
- src/pages/kernel/evidence.astro
- src/pages/kernel/reports.astro

نفّذ:
1. حسّن `KernelEmptyState`:
```astro
---
interface Props {
  icon: string;
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  demoHint?: boolean;
}
---
<div class="empty-state">
  <div class="icon">{icon}</div>
  <h2>{title}</h2>
  <p>{message}</p>
  <a href={ctaHref} class="btn-primary">{ctaLabel}</a>
  {demoHint && (
    <p class="hint">
      💡 هذه بيئة تجريبية. <a href="/kernel/playground/">جرب الملعب</a>
    </p>
  )}
</div>
```

2. طبّق في كل صفحة:
- **Audit**: "لا توجد سجلات تدقيق بعد" → "شغّل سيناريو لرؤية السجلات"
- **Approvals**: "لا توجد طلبات معلقة" → "راجع السياسات"
- **Evidence**: "لا توجد أدلة مولّدة" → "شغّل تقييماً لتوليد الأدلة"
- **Reports**: "لا توجد تقارير" → "أنشئ تقريرك الأول"

3. Add conditional rendering:
```javascript
// kernel-audit.js
if (auditEvents.length === 0) {
  showEmptyState();
} else {
  showTable();
}
```

4. Preserve demo data toggle:
- Demo mode: show demo data
- Live mode + no data: show empty state
- Live mode + data: show real data

قواعد:
- Empty state يظهر فقط في Live mode
- CTA يوجه للإجراء المنطقي التالي
- Preserve demo data للعرض
- Accessibility: announce empty state

معايير القبول:
✅ Empty states واضحة
✅ CTAs منطقية
✅ Demo mode preserved
✅ No visual regression

الأوامر:
```bash
pnpm dev
# بدّل Demo/Live
# تحقق من empty states
```

---

### 🎯 PROMPT 6: TypeScript Migration للـ Client JS

```
أنت Senior Frontend Architect تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- كل محركات /public/js/*.js مكتوبة بـ Vanilla JS بدون types
- 40+ ملف بلا type safety
- High risk للـ bugs و regressions

الأثر:
- Maintenance nightmare
- Bugs صعبة الاكتشاف
- No IDE support

الملفات المرشحة:
- public/js/*.js (40+ files)
- src/client/*.ts (new directory)
- tsconfig.json (update)
- package.json (add build step)

نفّذ:
1. أنشئ `src/client/` directory
2. Move كل engine إلى TypeScript:
   - `public/js/kernel-eval-store.js` → `src/client/eval-store.ts`
   - `public/js/kernel-playground.js` → `src/client/playground.ts`
   - `public/js/kernel-audit.js` → `src/client/audit.ts`
   - etc.

3. أضف types:
```typescript
// src/client/types.ts
export interface EvaluationRun {
  id: string;
  evaluationId: string;
  status: 'running' | 'complete' | 'failed';
  gate: 'passed' | 'blocked' | 'incomplete';
  // ...
}

export interface Trace {
  id: string;
  runId: string;
  stages: Stage[];
  // ...
}
```

4. استخدم Astro client directives:
```astro
<script client:load>
  import { initPlayground } from '../client/playground';
  initPlayground();
</script>
```

5. Build step في package.json:
```json
{
  "scripts": {
    "build:client": "tsc -p tsconfig.client.json",
    "build": "npm run build:client && astro build"
  }
}
```

6. Update KernelLayout.astro لاستيراد الـ bundles الجديدة

قواعد:
- Strict TypeScript mode
- Preserve all existing behavior
- No breaking changes للـ API
- Gradual migration (file by file)
- Preserve vanilla JS output

معايير القبول:
✅ All engines typed
✅ tsc passes بدون errors
✅ No runtime regressions
✅ IDE autocomplete يعمل
✅ Bundle size معقول

الأوامر:
```bash
pnpm build:client
pnpm build
pnpm dev
# Test كل صفحة
```

---

### 🎯 PROMPT 7: Shared PII Detection Library

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- PII detection logic متكرر في:
  - kernel-playground.js
  - chat.ts (API)
  - kernel-drawer.js
- 3 نسخ من نفس الـ logic
- Maintenance burden

الأثر:
- DRY violation
- Inconsistent behavior
- Bugs في نسخ مختلفة

الملفات المرشحة:
- packages/firewall-detectors/src/ (existing)
- src/client/pii-detector.ts (new)
- public/js/kernel-playground.js (update)
- src/pages/api/ai/chat.ts (update)

نفّذ:
1. أنشئ shared library:
```typescript
// src/client/pii-detector.ts
export interface PIIFinding {
  type: 'SAUDI_ID' | 'SAUDI_PHONE' | 'SAUDI_IBAN' | 'EMAIL' | 'CREDIT_CARD';
  start: number;
  end: number;
  confidence: number;
  value: string;
}

export function detectPII(text: string): PIIFinding[] {
  const findings: PIIFinding[] = [];
  
  // Saudi ID (10 digits)
  const saudiIdRegex = /\b[12]\d{9}\b/g;
  // ... etc
  
  return findings;
}

export function redactPII(text: string, findings: PIIFinding[]): string {
  let result = text;
  findings.sort((a, b) => b.start - a.start);
  for (const f of findings) {
    result = result.slice(0, f.start) + `[${f.type}]` + result.slice(f.end);
  }
  return result;
}
```

2. استخدم في Playground:
```javascript
import { detectPII, redactPII } from './pii-detector';

function runPipeline(text: string) {
  const findings = detectPII(text);
  const redacted = redactPII(text, findings);
  // ...
}
```

3. استخدم في API:
```typescript
import { detectPII } from '../client/pii-detector';

export const POST: APIRoute = async ({ request }) => {
  const { message } = await request.json();
  const findings = detectPII(message);
  // ...
};
```

قواعد:
- Deterministic output
- Same regex patterns في كل مكان
- TypeScript strict
- Unit tests للـ library

معايير القبول:
✅ DRY principle achieved
✅ Consistent behavior
✅ Unit tests pass
✅ No regressions

الأوامر:
```bash
pnpm test:pii
pnpm dev
# Test PII detection في كل صفحة
```

---

### 🎯 PROMPT 8: Visual Condition Builder

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/policies/ (policies.astro:150): Condition Builder نصي صعب
- المستخدمون غير التقنيين لا يستطيعون بناء سياسات
- High barrier to entry

الأثر:
- Low adoption للـ Policies feature
- Dependency على المطورين
- Slow policy creation

الملفات المرشحة:
- src/pages/kernel/policies.astro
- src/components/kernel/KernelConditionBuilder.astro (new)
- public/js/kernel-policies.js (update)
- kernel/assets/css/pages/policies.css (update)

نفّذ:
1. أنشئ visual flowchart:
```astro
<KernelConditionBuilder>
  <Node type="trigger">
    <Label>الرسالة</Label>
  </Node>
  
  <Connector />
  
  <Node type="condition">
    <Label>تحتوي على</Label>
    <Select options={['هوية وطنية', 'جوال', 'آيبان']} />
  </Node>
  
  <Connector />
  
  <Node type="action">
    <Label>الإجراء</Label>
    <Select options={['حظر', 'موافقة', 'تعمية']} />
  </Node>
</KernelConditionBuilder>
```

2. Drag-and-drop nodes:
```javascript
// kernel-policies.js
import Sortable from 'sortablejs';

const builder = document.querySelector('.condition-builder');
new Sortable(builder, {
  animation: 150,
  onEnd: (evt) => {
    updateConditionTree();
  }
});
```

3. AND/OR logic مع visual grouping:
```
[IF message contains PII] AND [IF dept = Sales]
  → [THEN block]
```

4. Live preview:
```javascript
function updatePreview() {
  const condition = buildConditionFromNodes();
  preview.textContent = condition.toArabicString();
}
```

5. Plain Arabic output:
```
إذا كانت الرسالة تحتوي على هوية وطنية
  والقسم هو المبيعات
  ثم احظر الطلب
```

قواعد:
- Drag-and-drop optional (can use buttons)
- Preserve text mode للـ power users
- RTL flowchart direction
- Accessibility: keyboard navigation

معايير القبول:
✅ Visual builder يعمل
✅ Drag-and-drop (أو buttons)
✅ Live preview
✅ Plain Arabic output
✅ Text mode preserved

الأوامر:
```bash
pnpm dev
# افتح /kernel/policies/
# جرب visual builder
# جرب drag-and-drop
```

---

## 🟡 P2 - Medium Impact (خلال أسبوعين)

### 🎯 PROMPT 9: Heat Map Mobile Enhancement

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/scenarios/ (scenarios.astro:100): Heat Map cells صغيرة (32px)
- صعبة القراءة على الجوال
- No touch-friendly interaction

الأثر:
- Poor mobile UX
- Hard to read results

الملفات المرشحة:
- src/pages/kernel/scenarios.astro
- kernel/assets/css/pages/scenarios.css

نفّذ:
1. Expandable cells على الجوال:
```css
@media (max-width: 768px) {
  .heat-map-cell {
    height: 44px; /* Touch target */
  }
  .heat-map-cell:active {
    transform: scale(1.5);
    z-index: 10;
  }
}
```

2. Click/tap لـ expand details:
```javascript
cell.addEventListener('click', () => {
  showCellDetails(cell.dataset.scenarioId, cell.dataset.modelId);
});
```

3. Modal للـ details:
```astro
<Modal>
  <h3>{scenario.name} × {model.name}</h3>
  <p>النتيجة: {result}</p>
  <p>الزمن: {latency}ms</p>
  <p>التكلفة: {cost} ر.س</p>
  <button onClick={openTrace}>افتح Trace</button>
</Modal>
```

قواعد:
- Touch target ≥ 44px
- Preserve desktop layout
- RTL support

معايير القبول:
✅ Cells readable على الجوال
✅ Touch-friendly
✅ Details modal يعمل

---

### 🎯 PROMPT 10: Preset Filters & Ranges

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/audit/, /kernel/replay/: date range picker يدوي فقط
- المستخدم يضطر لاختيار التواريخ يدوياً كل مرة
- No quick presets

الأثر:
- Slow workflow
- User frustration

الملفات المرشحة:
- src/pages/kernel/audit.astro
- src/pages/kernel/replay.astro
- src/components/kernel/KernelDateRangePicker.astro (new)

نفّذ:
1. أنشئ presets:
```astro
<KernelDateRangePicker>
  <div class="presets">
    <button onClick={() => setRange('today')}>اليوم</button>
    <button onClick={() => setRange('week')}>آخر 7 أيام</button>
    <button onClick={() => setRange('month')}>آخر 30 يوم</button>
    <button onClick={() => setRange('quarter')}>الربع الأخير</button>
    <button onClick={() => setRange('custom')}>مخصص</button>
  </div>
</KernelDateRangePicker>
```

2. Keyboard shortcuts:
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 't') setRange('today');
  if (e.key === 'w') setRange('week');
  if (e.key === 'm') setRange('month');
});
```

قواعد:
- Preserve custom range
- RTL dates
- Accessibility

معايير القبول:
✅ Presets تعمل
✅ Keyboard shortcuts
✅ Custom range preserved

---

### 🎯 PROMPT 11: PDF.js Viewer للـ Evidence

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/evidence/ (evidence.astro:200): PDF preview عبر iframe بطيء
- Poor performance
- No zoom/navigation controls

الأثر:
- Slow UX
- Limited functionality

الملفات المرشحة:
- src/pages/kernel/evidence.astro
- package.json (add pdfjs-dist)

نفّذ:
1. Install PDF.js:
```bash
pnpm add pdfjs-dist
```

2. أنشئ PDF viewer component:
```astro
<script client:load>
  import * as pdfjsLib from 'pdfjs-dist';
  
  async function renderPDF(url, canvas) {
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    }).promise;
  }
</script>

<canvas id="pdf-canvas"></canvas>
<div class="controls">
  <button onClick={prevPage}>←</button>
  <span>{currentPage} / {totalPages}</span>
  <button onClick={nextPage}>→</button>
  <button onClick={zoomIn}>🔍+</button>
  <button onClick={zoomOut}>🔍-</button>
</div>
```

قواعد:
- Lazy load PDF.js
- Mobile-friendly controls
- RTL page navigation

معايير القبول:
✅ PDF renders fast
✅ Navigation works
✅ Zoom works
✅ Mobile-friendly

---

### 🎯 PROMPT 12: Plain Arabic Consent Flow

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- /kernel/replay/ (replay.astro:80): Consent modal نص قانوني جداً
- User drop-off عالي
- Users لا يفهمون ما يوافقون عليه

الأثر:
- Low conversion
- User confusion

الملفات المرشحة:
- src/pages/kernel/replay.astro
- src/components/kernel/KernelConsentModal.astro (new)

نفّذ:
1. Plain Arabic text:
```astro
<KernelConsentModal>
  <h2>⚠️ قبل ما نكمل</h2>
  
  <p class="simple">
    عشان نقارن السياسة الجديدة بالقديمة، نحتاج نرسل 
    <strong>520 طلب قديم</strong> للنموذج.
  </p>
  
  <div class="details">
    <h3>📦 وش بنرسل؟</h3>
    <ul>
      <li>✅ نصوص الطلبات فقط</li>
      <li>❌ لا بيانات شخصية</li>
      <li>❌ لا أسماء أو أرقام هواتف</li>
    </ul>
  </div>
  
  <div class="details">
    <h3>🔒 كيف بنحمي بياناتك؟</h3>
    <ul>
      <li>✅ البيانات مشفرة</li>
      <li>✅ تُحذف بعد المقارنة</li>
      <li>✅ لا تُستخدم للتدريب</li>
    </ul>
  </div>
  
  <button class="btn-primary" onClick={approve}>
    ✅ موافق، أكمل المقارنة
  </button>
  <button class="btn-secondary" onClick={reject}>
    ❌ لا، ألغِ
  </button>
</KernelConsentModal>
```

2. Visual indicators:
- ✅ Green checkmarks للـ safe items
- ❌ Red X للـ excluded items
- Icons لكل section

قواعد:
- Flesch-Kincaid grade level ≤ 8
- No legal jargon
- Clear visual hierarchy
- RTL support

معايير القبول:
✅ Plain Arabic
✅ Visual indicators
✅ Clear CTA
✅ High conversion

---

## 🟢 P3 - Polish & Enhancements (خلال شهر)

### 🎯 PROMPT 13: Product Tour (Onboarding)

```
أنت Senior Frontend Engineer تعمل في BRIGHTAI Astro monorepo.

المشكلة المثبتة:
- No guided tour للمستخدمين الجدد
- Slow learning curve
- Features undiscovered

الملفات المرشحة:
- src/components/kernel/KernelProductTour.astro (new)
- src/components/kernel/KernelTourStep.astro (new)
- package.json (add driver.js أو intro.js)

نفّذ:
1. Install tour library:
```bash
pnpm add driver.js
```

2. Define tour steps:
```javascript
const tourSteps = [
  {
    element: '.kernel-sidebar',
    title: 'الشريط الجانبي',
    description: 'هنا تجد كل وحدات Kernel مرتبة حسب الدور',
    position: 'right'
  },
  {
    element: '.kernel-metrics',
    title: 'المؤشرات الحية',
    description: 'تابع حالة الحوكمة لحظياً',
    position: 'bottom'
  },
  // ... more steps
];
```

3. Show on first visit:
```javascript
if (!localStorage.getItem('tour-completed')) {
  startTour();
}
```

قواعد:
- Skippable
- RTL support
- Mobile-friendly
- Max 7 steps

معايير القبول:
✅ Tour works
✅ Skippable
✅ RTL support
✅ Mobile-friendly

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