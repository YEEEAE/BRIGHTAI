/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './docs.html',
    './404.html',
    './500.html',
    './about/**/*.html',
    './blog/**/*.html',
    './contact/**/*.html',
    './dashboard/**/*.html',
    './demo/**/*.html',
    './docs/**/*.html',
    './frontend/**/*.html',
    './frontend/**/*.js',
    './kernel/**/*.html',
    './offline/**/*.html',
    './pricing/**/*.html',
    './privacy-cookies/**/*.html',
    './services/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6fbff',
          100: '#b3f0ff',
          300: '#5fdcff',
          500: '#00d4ff',
          600: '#00a8d4',
          700: '#0086ad'
        },
        ink: {
          900: '#0b1220',
          800: '#111a2e',
          700: '#1a2340'
        },
        whatsapp: '#25D366'
      },
      fontFamily: {
        sans: ['Tajawal', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 60px -10px rgba(0,212,255,.55)',
        waGlow: '0 0 40px -8px rgba(37,211,102,.5)'
      }
    }
  },
  plugins: []
};
