export const demoTheme = {
  colors: {
    brightNavy: "#0A2540",
    saudiTeal: "#00D4AA",
    visionGold: "#FFB800",
    ink: "#E8F7F2",
    muted: "#9FB4C7",
    surface: "#0E1A2F",
    surfaceSoft: "#13243D",
    line: "rgba(255,255,255,0.12)"
  },
  fonts: {
    arabic: "IBM Plex Sans Arabic",
    display: "Tajawal",
    mono: "JetBrains Mono"
  },
  radii: {
    control: "8px",
    panel: "14px"
  }
} as const;

export type DemoTheme = typeof demoTheme;
