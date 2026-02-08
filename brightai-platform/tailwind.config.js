const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
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
    },
  },
  plugins: [

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
  ],
};
