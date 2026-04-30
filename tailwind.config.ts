import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0A2540",
        teal: "#00D4AA",
        gold: "#FFB800",
        zinc: {
          950: "#09090b"
        }
      },
      fontFamily: {
        sans: ["var(--font-arabic)", "IBM Plex Sans Arabic", "Tajawal", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        "bright-ring": "0 0 0 1px rgb(255 255 255 / 0.12), 0 24px 80px rgb(0 212 170 / 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
