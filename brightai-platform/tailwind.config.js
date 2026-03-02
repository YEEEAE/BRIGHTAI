const plugin = require("tailwindcss/plugin");

let rtlPlugin = null;
try {
  const loaded = require("@tailwindcss/rtl");
  rtlPlugin = loaded?.default ?? loaded;
} catch (error) {
  rtlPlugin = null;
}

module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        tablet: "640px",
        desktop: "1024px",
        large: "1536px",
      },
      fontFamily: {
        sans: ["Cairo", "Tajawal", "ui-sans-serif", "system-ui"],
        display: ["Tajawal", "Cairo", "ui-sans-serif", "system-ui"],
      },
      colors: {
        brand: {
          50: "#e8fff6",
          100: "#c6ffe8",
          200: "#8fffd3",
          300: "#5bf7bf",
          400: "#34d399",
          500: "#16b981",
          600: "#0ea56f",
          700: "#0b7a54",
          800: "#085a41",
          900: "#053a2d",
        },
        navy: {
          900: "#0b1020",
          950: "#070b16",
        },
      },
      spacing: {
        gutter: "1.5rem",
        section: "5.5rem",
        hero: "7.5rem",
      },
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.7" }],
        sm: ["0.9375rem", { lineHeight: "1.8" }],
        base: ["1rem", { lineHeight: "1.8" }],
        lg: ["1.125rem", { lineHeight: "1.9" }],
        xl: ["1.25rem", { lineHeight: "1.9" }],
        "2xl": ["1.5rem", { lineHeight: "1.9" }],
        "3xl": ["1.875rem", { lineHeight: "1.8" }],
        "4xl": ["2.25rem", { lineHeight: "1.7" }],
      },
      lineHeight: {
        arabic: "1.8",
      },
      letterSpacing: {
        normal: "0",
      },
      boxShadow: {
        "brand-glow": "0 20px 60px rgba(16, 185, 129, 0.2)",
        "glass-soft": "0 12px 40px rgba(15, 23, 42, 0.35)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #0b1020 0%, #0f172a 45%, #0b2a24 100%)",
        "brand-radial":
          "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.28), transparent 55%)",
      },
      backdropBlur: {
        glass: "18px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-left": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-right": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.96)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-out": "fade-out 0.3s ease-in",
        "slide-up": "slide-up 0.45s ease-out",
        "slide-down": "slide-down 0.45s ease-out",
        "slide-left": "slide-left 0.45s ease-out",
        "slide-right": "slide-right 0.45s ease-out",
        "scale-in": "scale-in 0.35s ease-out",
        "scale-out": "scale-out 0.3s ease-in",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "bounce-soft": "bounce-soft 1.8s ease-in-out infinite",
        "spin-slow": "spin-slow 2.6s linear infinite",
      },
    },
  },
  plugins: [
    rtlPlugin,
    require("tailwindcss-rtl"),
    plugin(({ matchUtilities, theme, addUtilities }) => {
      matchUtilities(
        {
          ms: (value) => ({ marginInlineStart: value }),
          me: (value) => ({ marginInlineEnd: value }),
          ps: (value) => ({ paddingInlineStart: value }),
          pe: (value) => ({ paddingInlineEnd: value }),
        },
        { values: theme("spacing") }
      );
      addUtilities({
        ".rtl": { direction: "rtl", textAlign: "right" },
        ".ltr": { direction: "ltr", textAlign: "left" },
        ".rtl-flex": { flexDirection: "row-reverse" },
        ".rtl-flip": { transform: "scaleX(-1)" },
        ".rtl-no-flip": { transform: "none" },
      });
    }),
  ].filter(Boolean),
};
