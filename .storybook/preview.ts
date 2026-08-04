/**
 * .storybook/preview.ts — Storybook 10 preview configuration.
 *
 * PURPOSE:
 * - يطبّق globals (RTL/LTR toggle, theme) على كل story.
 * - يحمّل الـ design tokens قبل أي story (tokens.css + global.css facade).
 * - يضبط default viewport, backgrounds, controls matchers.
 *
 * KEY FEATURES:
 * 1. RTL/LTR toolbar toggle — Saudi dialect "العربي" / English "English".
 * 2. RTL flip — document.documentElement.dir + lang flips on toggle.
 * 3. tokens.css + global.css تُحمَّل مرة واحدة في <head> (decorator).
 * 4. prefers-reduced-motion يحترم تلقائياً عبر tokens (motion system).
 *
 * SAUDI VOICE PROTOCOL:
 * - كل prose في comments بالعامية السعودية.
 * - identifiers (variable names, keys) بالإنجليزي.
 * - الـ toolbar titles بالعربي والإنجليزي (حسب اللغة المختارة).
 */

import type { Preview } from '@storybook-astro/framework';
import '../src/styles/tokens.css';
import '../src/styles/global.css';

const preview: Preview = {
  // ─── Globals (toolbar toggles) ───────────────────────────────
  // direction: RTL (Saudi) / LTR (English).
  // theme: dark (افتراضي) / light (لو احتجنا).
  globalTypes: {
    direction: {
      name: 'Direction',
      description: 'اتجاه النص — RTL للعربي، LTR للإنجليزي',
      defaultValue: 'rtl',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'rtl', title: 'RTL (عربي)' },
          { value: 'ltr', title: 'LTR (English)' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      name: 'Theme',
      description: 'الثيم — dark افتراضي',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },

  // ─── Initial globals (default state) ─────────────────────────
  initialGlobals: {
    direction: 'rtl',
    theme: 'dark',
  },

  // ─── Parameters (per-viewer configuration) ───────────────────
  parameters: {
    // ─── Layout: centered canvas, dark background ─────────────
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0e1a' }, // --bg-base
        { name: 'surface', value: '#0f1525' }, // --bg-surface
        { name: 'elevated', value: '#151c30' }, // --bg-elevated
        { name: 'light', value: '#f1f5f9' }, // light mode test
      ],
    },

    // ─── Viewport addon: mobile + tablet + desktop + wide ─────
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (375px)',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet (768px)',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (1280px)',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop',
        },
        wide: {
          name: 'Wide (1920px)',
          styles: { width: '1920px', height: '1080px' },
          type: 'desktop',
        },
      },
      defaultViewport: 'desktop',
    },

    // ─── Controls: matches تلقائي + sorting ────────────────────
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      sort: 'requiredFirst',
    },

    // ─── a11y addon: axe-core rules ────────────────────────────
    a11y: {
      // 'todo' = يظهر warnings, 'error' = يكسر build, 'off' = يعطّل.
      // نستخدم 'warning' للـ dev، ونراجع violations يدوياً.
      test: 'warning',
      // نفعّل WCAG 2.2 AA rules (الـ baseline المعتمد في BrightAI).
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'landmark-one-main', enabled: true },
        ],
      },
    },

    // ─── Options (story ordering, panel position) ──────────────
    options: {
      storySort: {
        order: ['Kernel', 'UI', 'Brand'],
      },
      panelPosition: 'right',
    },
  },

  // ─── Decorators (wrappers around each story) ─────────────────
  // 1) RTL/LTR flip — يغيّر dir + lang على <html>.
  // 2) Theme flip — نضيف data-theme على <body>.
  decorators: [
    (Story, ctx) => {
      const direction = ctx.globals.direction ?? 'rtl';
      const theme = ctx.globals.theme ?? 'dark';

      // RTL/LTR — يضبط على document.documentElement
      // نستخدم setAttributeProperty عشان نضمن التغيير يطبق على Storybook iframe.
      if (typeof document !== 'undefined') {
        document.documentElement.dir = direction;
        document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
        document.body.dataset.theme = theme;
      }

      return Story();
    },
  ],
};

export default preview;