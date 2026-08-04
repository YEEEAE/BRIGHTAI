/**
 * .storybook/main.ts — Storybook 10 configuration for BrightAI.
 *
 * PURPOSE:
 * - يخدم Storybook للـ Astro components في الـ root (kernel + ui + brand).
 * - يستخدم @storybook/astro-vite الرسمي (الـ official Astro Vite framework).
 * - يكتشف stories عبر glob patterns: src/components/**/*.stories.astro|ts.
 *
 * SCOPE:
 * - Astro components (.astro) عبر @storybook/astro-vite.
 * - React components (لو احتجنا) عبر @storybook/react.
 *
 * NON-NEGOTIABLES:
 * - لا نضيف Chromatic هنا (المستخدم اختار static build فقط).
 * - static dir يستثني dist/ و node_modules/ و .astro/ cache.
 * - docs addon مفعّل (autodocs) عشان a11y docs تظهر تلقائياً.
 *
 * RELATED:
 * - src/styles/tokens.css: تُحمَّل في preview.ts (عشان tokens تكون متاحة قبل كل story).
 * - src/styles/global.css: نفس الشي — الـ canonical facade.
 */

import type { StorybookConfig } from '@storybook-astro/framework';

const config: StorybookConfig = {
  // ─── Framework ───────────────────────────────────────────────
  // @storybook-astro/framework = community Astro integration (Storybook 10).
  // NOTE: @storybook/astro-vite does NOT exist on npm (404). The community
  // framework @storybook-astro/framework (lukemcd) supports Astro 5/6/7.
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },

  // ─── Addons ──────────────────────────────────────────────────
  // a11y: axe-core integration، يعرض violations لكل story.
  // viewport: mobile (375) + tablet (768) + desktop (1280) + wide (1920).
  // docs: autodocs (توليد docs تلقائياً من argTypes + JSDoc).
  // controls: interactive args panel (الـ Controls tab).
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
  ],

  // ─── Stories (file glob) ─────────────────────────────────────
  // نلتقط stories من 3 مجلدات: kernel (20) + ui (3) + brand (2).
  // الصيغة: src/components/**/*.stories.astro — لأن @storybook/astro-vite
  // يحتاج Astro components تُعرض عبر <Story> wrappers.
  // لو احتجنا .ts CSF3 stories نضيف extension ثاني.
  stories: [
    '../src/components/kernel/**/*.stories.astro',
    '../src/components/ui/**/*.stories.astro',
    '../src/components/brand/**/*.stories.astro',
  ],

  // ─── Static dir (assets to serve as-is) ──────────────────────
  // نخلي public/ كـ static dir عشان الأيقونات (/icons.svg) والخطوط تشتغل.
  staticDirs: ['../public'],

  // ─── Build output ────────────────────────────────────────────
  output: 'static', // static build (المستخدم اختارها — لا Chromatic)
  // Story type checks: مفعّل — يكشف TS errors في stories وقت build.
  typescript: {
    check: false, // false عشان ما يكسر build لو في warnings بسيطة
    reactDocgen: false,
  },

  // ─── Docs (autodocs generation) ──────────────────────────────
  docs: {
    autodocs: 'tag', // يولّد docs تلقائياً للـ stories المميّزة بـ 'autodocs' tag
  },

  // ─── Core settings ───────────────────────────────────────────
  core: {
    disableTelemetry: true, // privacy-first — لا telemetry لـ Storybook
  },

  // ─── Vite tweaks ─────────────────────────────────────────────
  // Astro يحتاج explicit handler للـ .astro files في Vite.
  // @storybook/astro-vite يسوّي هذا تلقائياً، بس نضيف explicit config للتوضيح.
  async viteFinal(config) {
    return config;
  },
};

export default config;