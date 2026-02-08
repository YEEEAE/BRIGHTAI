const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "Tajawal", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/rtl"),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          ms: (value) => ({ marginInlineStart: value }),
          me: (value) => ({ marginInlineEnd: value }),
          ps: (value) => ({ paddingInlineStart: value }),
          pe: (value) => ({ paddingInlineEnd: value }),
        },
        { values: theme("spacing") }
      );
    }),
  ],
};
