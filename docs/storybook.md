# Storybook — BrightAI Design System

> توثيق Storybook 10 لـ BrightAI — كيف تشغّله، كيف تضيف stories، وكيف تستخدمه في الـ dev workflow.

---

## وش هو Storybook هنا؟

Storybook هو **sandbox بيئة تطوير معزولة** لكل UI component عندنا. بدل ما تشغّل الموقع كامل عشان تشوف كيف يبان button معيّن، تفتح Storybook وتشوف الـ component لحاله مع variants متعددة، وتتحكم في props من لوحة Controls، وتشيك a11y بدون ما تشغّل الـ browser dev tools.

**الفرق الأساسي عن الـ dev server العادي:**
- الموقع فيه layout + page context (header, footer, sections) — ما تقدر تعزل component.
- Storybook يعرض **component لحاله**، فوق سطح controlled (background, viewport, RTL/LTR).

---

## الإعداد التقني

| البند | القيمة |
|---|---|
| Storybook version | **10.x** (latest stable) |
| Framework | `@storybook/astro-vite` (official Astro Vite integration) |
| Addons | a11y, viewport, controls, docs |
| Output | static build (لا Chromatic — قرار المستخدم) |
| Glob | `src/components/{kernel,ui,brand}/**/*.stories.astro` |
| Tokens | `src/styles/tokens.css` + `src/styles/global.css` تُحمَّل في preview.ts |
| RTL toggle | global toolbar (افتراضي: rtl) |
| Theme toggle | dark/light (افتراضي: dark) |

---

## كيف تشغّله؟

### أول مرة (تثبيت)

```bash
pnpm install
```

هذا يثبّت Storybook 10 + كل الـ addons (في `devDependencies`).

### تشغيل dev server

```bash
pnpm storybook
```

يفتح على `http://localhost:6006`. كل تغيير في `*.stories.astro` يحدّث تلقائياً (HMR).

### بناء static output

```bash
pnpm storybook:build
```

النتيجة: `storybook-static/` — مجلد static تقدر تنشره على Netlify / Vercel / GitHub Pages.

### معاينة الـ build

```bash
pnpm storybook:serve
```

يفتح الـ static build على `http://localhost:6007` (port مختلف عشان ما يتعارض مع dev).

### تنظيف

```bash
pnpm storybook:clean
```

يحذف `storybook-static/` + `.storybook/cache/`.

---

## كيف تستخدم الـ toolbar؟

في أعلى Storybook:

| Toolbar | وش يسوي |
|---|---|
| **Direction** (globe icon) | يبدّل بين **RTL (عربي)** و **LTR (English)** — يغيّر `dir` + `lang` على `<html>` |
| **Viewport** (laptop icon) | يبدّل بين mobile (375px), tablet (768), desktop (1280), wide (1920) |
| **Theme** (circle icon) | dark / light (الافتراضي dark) |
| **Background** (paint icon) | 4 خلفيات: dark, surface, elevated, light |
| **Controls** | يسار الـ story — controls لكل arg في الـ meta |
| **Actions** | يسار الـ story — يسجل events لو الـ component يطلقها |
| **A11y** | تحت الـ story — axe-core violations (warning level) |

---

## كيف تبني story جديد؟

### الـ pattern الأساسي (props-only components)

مثال `KernelBadge`:

```astro
---
// src/components/kernel/KernelBadge.stories.astro
import type { Meta, StoryObj } from '@storybook/astro-vite';
import KernelBadge from './KernelBadge.astro';

const meta = {
  title: 'Kernel/Badge',          // مسار في الـ sidebar
  component: KernelBadge,
  tags: ['autodocs'],              // يولّد docs تلقائياً
  argTypes: {
    level: {
      control: 'select',
      options: ['minimal', 'low', 'medium', 'high', 'critical'],
    },
    label: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: {                          // default args لكل stories
    level: 'medium',
    label: 'متوسط',
    size: 'sm',
  },
} satisfies Meta<typeof KernelBadge>;

export default meta;
type Story = StoryObj<typeof KernelBadge>;

export const Default: Story = {};
export const Critical: Story = { args: { level: 'critical', label: 'حرج' } };
export const AllLevels: Story = { render: () => '...' };
```

### القاعدة: file naming

```
src/components/<category>/<ComponentName>.stories.astro
```

- `kernel/` — kernel components (20 قصة)
- `ui/` — UI primitives (Button, Card, SectionHeading)
- `brand/` — Brand identity (BrightStar, BrightStarLoader)

لو أضفت category جديد (مثل `seo/` أو `hero/`)، حدّث `.storybook/main.ts` stories glob.

### الـ pattern المتقدم (مع slots أو children)

```astro
---
// لو الـ component يحتاج slots
import type { Meta, StoryObj } from '@storybook/astro-vite';
import MyCard from './MyCard.astro';

const meta = {
  title: 'UI/MyCard',
  component: MyCard,
} satisfies Meta<typeof MyCard>;

export default meta;
type Story = StoryObj<typeof MyCard>;

// render function للـ custom layout
export const WithComplexContent: Story = {
  render: (args) => ({
    Component: MyCard,
    props: args,
    slots: {
      default: 'محتوى الـ slot هنا',
      title: '<h3>عنوان من slot</h3>',
    },
  }),
};
```

---

## الـ Addons — وش يسوي كل واحد؟

### 1. `@storybook/addon-a11y`

يستخدم axe-core. يعرض violations في tab تحت الـ story:

| Level | السلوك |
|---|---|
| `warning` | يعرض violations بدون ما يكسر build (الافتراضي عندنا) |
| `error` | يكسر build (نستخدمه في CI لو احتجنا) |
| `todo` | يخفي violations (لا نستخدمه) |

الـ rules المفعّلة: color-contrast, label, aria-allowed-attr, button-name, image-alt, landmark-one-main (WCAG 2.2 AA baseline).

### 2. `@storybook/addon-viewport`

4 viewports: mobile (375), tablet (768), desktop (1280), wide (1920).

### 3. `@storybook/addon-controls`

لوحة controls على اليسار — كل arg في الـ meta يظهر هنا مع الـ control type المناسب (text, select, boolean, radio, object).

### 4. `@storybook/addon-docs`

يولّد docs تلقائياً من:
- `argTypes` (description + control type)
- JSDoc comments في الـ component
- Default values من `args`

كل story بـ `tags: ['autodocs']` يولّد صفحة docs في الـ "Docs" tab.

---

## CI / Static Deploy

الحين: **static build فقط** (قرار المستخدم — لا Chromatic).

لو تبي visual regression مستقبلاً:

```yaml
# .github/workflows/chromatic.yml
name: Chromatic
on: push
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22.x' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm storybook:build
      - uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          storybookBuildDir: storybook-static
```

هذا يضيف Chromatic كـ visual regression. الحين **ما هو مفعّل**، بس الـ workflow جاهز لو قررت تفعّله.

---

## استكشاف الأخطاء

### "Cannot find module '@storybook/astro-vite'"

```bash
pnpm install
```

تأكد إنك في الـ root (مو داخل `apps/dashboard` أو `packages/*`).

### "Story renders but shows blank"

- افتح console الـ browser (F12).
- لو فيه TS errors في الـ `.stories.astro`، شوف الـ terminal اللي شغّل منه `pnpm storybook`.
- لو الـ component يعتمد على Astro slots/context، استخدم `render` function (مو default spread).

### "tokens.css ما يُحمَّل"

تأكد إن `src/styles/tokens.css` موجود. لو نقلته، حدّث import في `.storybook/preview.ts`.

### "RTL toggle ما يغيّر الـ layout"

- الـ decorator يضبط `document.documentElement.dir` — يتأكد إن الـ component يستخدم logical properties (`margin-inline-start` بدل `margin-left`).
- لو الـ component يستخدم `left/right` بشكل مباشر، الـ RTL flip ما يشتغل — هذا bug في الـ component نفسه، مو في Storybook.

---

## الحدود (Known Limits)

1. **Static build فقط** — Chromatic اختياري، غير مفعّل.
2. **No docs addon for React stories** — لو أضفنا React components (مثل من apps/dashboard)، نحدّث `main.ts` بـ framework إضافي.
3. **a11y test level = warning** — ما يكسر build. لو تبي CI يفشل على violations، غيّر `.storybook/preview.ts` إلى `test: 'error'`.
4. **CSF3 only** — ما ندعم CSF2 legacy format.

---

## المرجعيات

- Storybook 10 docs: https://storybook.js.org/docs
- `@storybook/astro-vite`: https://github.com/storybookjs/storybook/tree/main/code/frameworks/astro-vite
- axe-core rules: https://github.com/dequelabs/axe-core/tree/develop/doc/rules
- WCAG 2.2 AA: https://www.w3.org/TR/WCAG22/

---

**صاحب الملف:** BrightAI Workspace Agent
**آخر تحديث:** 2026-07-15
**الإصدار:** 1.0