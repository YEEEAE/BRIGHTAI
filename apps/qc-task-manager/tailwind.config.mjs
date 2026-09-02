/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Semantic aliases. Components should use these roles instead of
        // reaching directly into the slate/brand palette.
        surface: {
          page: 'var(--color-surface-page)',
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          muted: 'var(--color-surface-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        content: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          soft: 'var(--color-accent-soft)',
        },
        focus: 'var(--color-focus)',
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
          border: 'var(--color-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          soft: 'var(--color-danger-soft)',
          border: 'var(--color-danger-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
          border: 'var(--color-info-border)',
        },
        neutral: {
          DEFAULT: 'var(--color-neutral)',
          soft: 'var(--color-neutral-soft)',
          border: 'var(--color-neutral-border)',
        },
        disabled: 'var(--color-disabled)',
        overlay: 'var(--color-overlay)',
        glass: 'var(--color-glass)',
        chart: {
          primary: 'var(--color-chart-primary)',
          secondary: 'var(--color-chart-secondary)',
          success: 'var(--color-chart-success)',
          warning: 'var(--color-chart-warning)',
          danger: 'var(--color-chart-danger)',
        },
      },
      spacing: {
        'qc-0': '0px',
        'qc-1': '4px',
        'qc-2': '8px',
        'qc-3': '12px',
        'qc-4': '16px',
        'qc-5': '20px',
        'qc-6': '24px',
        'qc-8': '32px',
        'qc-12': '48px',
        'qc-16': '64px',
      },
      borderRadius: {
        'qc-sm': 'var(--radius-sm)',
        'qc-md': 'var(--radius-md)',
        'qc-lg': 'var(--radius-lg)',
        'qc-pill': 'var(--radius-pill)',
      },
      transitionDuration: {
        'qc-fast': '120ms',
        'qc-standard': '180ms',
      },
      transitionTimingFunction: {
        'qc-standard': 'cubic-bezier(0.2, 0, 0, 1)',
        'qc-emphasized': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
