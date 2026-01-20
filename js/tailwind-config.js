// Tailwind Configuration for CDN usage
// Include this script AFTER the Tailwind CDN script

window.tailwindConfig = {
  theme: {
    extend: {
      colors: {
        indigo: {
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
        },
        purple: {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        },
        gold: {
          400: '#FCD34D',
          500: '#D4AF37',
          600: '#B8941E',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
        },
        navy: {
          900: '#020617',
          800: '#0F172A',
        }
      },
      fontFamily: {
        arabic: [ 'IBM Plex Sans Arabic', 'sans-serif' ],
        code: [ 'Fira Code', 'monospace' ],
      }
    }
  }
};

if (window.tailwind) {
  window.tailwind.config = window.tailwindConfig;
}
