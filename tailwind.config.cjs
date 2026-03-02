module.exports = {
  content: [
    './index.html',
    './docs.html',
    './404.html',
    './500.html',
    './frontend/**/*.html',
    './frontend/**/*.js',
    './services/**/*.html',
    './docs/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b'
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        },
        dark: {
          bg: '#030014',
          card: '#0f0728',
          surface: '#1a103c'
        },
        navy: {
          900: '#0a192f'
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Tajawal', 'Cairo', 'sans-serif']
      }
    }
  },
  safelist: [
    {
      pattern: /(text|bg|border)-(indigo|purple|green|gold)-(300|400|500)(\/\d+)?/
    }
  ]
};
