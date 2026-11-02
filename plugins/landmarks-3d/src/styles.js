export const CSS = `
.lm-root {
  --lm-accent: #e8b66b;
  --lm-ink: var(--dsw-alias-label-primary, #f2f2f4);
  --lm-muted: var(--dsw-alias-label-secondary, #a5a7b3);
  --lm-line: var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 540px;
  overflow: hidden;
  isolation: isolate;
  background: #080b12;
  color: var(--lm-ink);
  font-family: "IBM Plex Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.lm-root:fullscreen { width: 100vw; height: 100vh; }
.lm-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
  outline: none;
}
.lm-canvas.is-dragging { cursor: grabbing; }
.lm-canvas:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--lm-accent) 72%, transparent); }
.lm-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 52% 44%, transparent 34%, rgba(3, 5, 10, 0.56) 100%),
    linear-gradient(180deg, rgba(3, 5, 10, 0.8) 0%, transparent 25%, transparent 68%, rgba(3, 5, 10, 0.92) 100%);
}
.lm-vignette::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.06;
  mix-blend-mode: soft-light;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E");
}
.lm-header {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 4;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: clamp(20px, 3.6vw, 36px) clamp(20px, 4vw, 44px);
  pointer-events: none;
}
.lm-brand { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.lm-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  color: color-mix(in srgb, var(--lm-accent) 84%, #fff);
  font-family: "SFMono-Regular", "Cascadia Code", ui-monospace, monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}
.lm-eyebrow::before {
  content: "";
  width: 22px;
  height: 1px;
  background: currentColor;
  opacity: 0.72;
}
.lm-title {
  margin: 0;
  color: var(--lm-ink);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -0.027em;
  text-wrap: balance;
}
.lm-subtitle {
  max-width: 36ch;
  margin: 0;
  color: var(--lm-muted);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.01em;
}
.lm-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--lm-accent) 24%, var(--lm-line));
  border-radius: 100px;
  background: rgba(7, 10, 17, 0.52);
  color: color-mix(in srgb, var(--lm-accent) 72%, var(--lm-ink));
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
  backdrop-filter: blur(14px);
}
.lm-live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--lm-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--lm-accent) 14%, transparent);
  animation: lm-pulse 2.8s ease-in-out infinite;
}
.lm-info {
  position: absolute;
  inset-block-start: clamp(116px, 18vh, 176px);
  inset-inline-start: clamp(20px, 4vw, 44px);
  z-index: 4;
  width: min(324px, calc(100% - 40px));
  padding: 18px 20px 16px;
  border: 1px solid color-mix(in srgb, var(--lm-accent) 18%, var(--lm-line));
  border-radius: 16px;
  background:
    linear-gradient(152deg, rgba(15, 19, 29, 0.86), rgba(9, 12, 19, 0.55)),
    radial-gradient(120% 100% at 0% 0%, color-mix(in srgb, var(--lm-accent) 11%, transparent), transparent 62%);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px) saturate(115%);
  animation: lm-info-in 0.58s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.lm-info::before {
  content: "";
  position: absolute;
  inset-block: 19px;
  inset-inline-start: -1px;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(180deg, transparent, var(--lm-accent) 26%, var(--lm-accent) 68%, transparent);
  opacity: 0.86;
}
.lm-info-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-block-end: 16px;
}
.lm-info-index {
  color: color-mix(in srgb, var(--lm-accent) 72%, var(--lm-ink));
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
}
.lm-info-coord {
  color: color-mix(in srgb, var(--lm-muted) 80%, transparent);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 8px;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
.lm-info h2 {
  margin: 0;
  color: var(--lm-ink);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -0.032em;
  text-wrap: balance;
}
.lm-place {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 7px 0 0;
  color: color-mix(in srgb, var(--lm-accent) 78%, var(--lm-ink));
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lm-place::before {
  content: "";
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.8;
}
.lm-desc {
  display: -webkit-box;
  margin: 14px 0 16px;
  overflow: hidden;
  color: color-mix(in srgb, var(--lm-muted) 92%, #fff 8%);
  font-size: 11.5px;
  line-height: 1.72;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  text-wrap: pretty;
}
.lm-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding-block-start: 13px;
  border-block-start: 1px solid var(--lm-line);
}
.lm-fact { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.lm-fact dt {
  color: color-mix(in srgb, var(--lm-muted) 72%, transparent);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 7.5px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.lm-fact dd {
  margin: 0;
  overflow: hidden;
  color: var(--lm-ink);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lm-controls {
  position: absolute;
  inset-block-start: clamp(116px, 18vh, 176px);
  inset-inline-end: clamp(20px, 4vw, 44px);
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.lm-icon-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--lm-line);
  border-radius: 12px;
  background: rgba(8, 11, 18, 0.56);
  color: color-mix(in srgb, var(--lm-muted) 90%, var(--lm-ink));
  cursor: pointer;
  backdrop-filter: blur(14px);
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;
}
.lm-icon-btn:hover {
  border-color: color-mix(in srgb, var(--lm-accent) 46%, var(--lm-line));
  background: color-mix(in srgb, var(--lm-accent) 12%, rgba(8, 11, 18, 0.74));
  color: var(--lm-ink);
  transform: translateY(-1px);
}
.lm-icon-btn[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--lm-accent) 60%, transparent);
  background: color-mix(in srgb, var(--lm-accent) 18%, rgba(8, 11, 18, 0.72));
  color: color-mix(in srgb, var(--lm-accent) 84%, #fff);
}
.lm-icon-btn:focus-visible,
.lm-tab:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--lm-accent) 82%, #fff);
  outline-offset: 2px;
}
.lm-tabs {
  position: absolute;
  inset-block-end: clamp(20px, 4vh, 36px);
  inset-inline-start: 50%;
  z-index: 6;
  display: flex;
  gap: 4px;
  max-width: calc(100% - 40px);
  padding: 6px;
  border: 1px solid var(--lm-line);
  border-radius: 18px;
  background: rgba(7, 10, 17, 0.68);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(120%);
  transform: translateX(-50%);
  overflow-x: auto;
  scrollbar-width: none;
}
.lm-tabs::-webkit-scrollbar { display: none; }
.lm-tab {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 10px;
  min-width: 136px;
  min-height: 54px;
  padding: 8px 13px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--lm-muted);
  text-align: start;
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease, box-shadow 200ms ease;
}
.lm-tab:hover { background: rgba(255, 255, 255, 0.045); color: var(--lm-ink); }
.lm-tab[aria-selected="true"] {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--lm-accent) 17%, transparent), rgba(255, 255, 255, 0.035)),
    rgba(255, 255, 255, 0.025);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--lm-accent) 35%, transparent);
  color: var(--lm-ink);
}
.lm-tab-num {
  grid-row: 1 / 3;
  align-self: center;
  padding-inline-end: 10px;
  border-inline-end: 1px solid var(--lm-line);
  color: color-mix(in srgb, var(--lm-accent) 66%, var(--lm-muted));
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.lm-tab[aria-selected="true"] .lm-tab-num {
  border-inline-end-color: color-mix(in srgb, var(--lm-accent) 36%, transparent);
  color: var(--lm-accent);
}
.lm-tab-name {
  overflow: hidden;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lm-tab-place {
  overflow: hidden;
  margin-block-start: 1px;
  color: color-mix(in srgb, var(--lm-muted) 72%, transparent);
  font-size: 8px;
  letter-spacing: 0.045em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lm-tab[aria-selected="true"] .lm-tab-place { color: color-mix(in srgb, var(--lm-accent) 64%, var(--lm-muted)); }
.lm-hint {
  position: absolute;
  inset-inline-end: clamp(20px, 4vw, 44px);
  inset-block-end: clamp(26px, 4.5vh, 40px);
  z-index: 3;
  color: color-mix(in srgb, var(--lm-muted) 55%, transparent);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  pointer-events: none;
}
.lm-loading {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 48%, rgba(232, 182, 107, 0.06), transparent 42%),
    #080b12;
  transition: opacity 500ms ease, visibility 500ms ease;
}
.lm-loading.is-hidden { opacity: 0; visibility: hidden; pointer-events: none; }
.lm-loading-inner { display: flex; flex-direction: column; align-items: center; gap: 15px; text-align: center; }
.lm-loader {
  position: relative;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(232, 182, 107, 0.18);
  border-radius: 50%;
}
.lm-loader::before,
.lm-loader::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}
.lm-loader::before {
  inset: 5px;
  border: 1px solid transparent;
  border-block-start-color: var(--lm-accent);
  animation: lm-spin 1.2s linear infinite;
}
.lm-loader::after {
  inset: 15px;
  background: var(--lm-accent);
  box-shadow: 0 0 20px rgba(232, 182, 107, 0.5);
  animation: lm-pulse 2s ease-in-out infinite;
}
.lm-loading-text {
  color: color-mix(in srgb, var(--lm-muted) 80%, #fff);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.lm-error {
  position: absolute;
  inset: 0;
  z-index: 14;
  display: grid;
  place-items: center;
  padding: 32px;
  background: #080b12;
}
.lm-error-card {
  max-width: 420px;
  padding: 26px;
  border: 1px solid var(--lm-line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  text-align: center;
}
.lm-error-card h2 {
  margin: 0 0 8px;
  font-family: "Iowan Old Style", Georgia, serif;
  font-size: 24px;
  font-weight: 500;
}
.lm-error-card p { margin: 0; color: var(--lm-muted); font-size: 12px; line-height: 1.7; }
.lm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.lm-nav-icon { display: block; overflow: visible; }
@keyframes lm-info-in {
  from { opacity: 0; transform: translateY(12px) scale(0.985); filter: blur(5px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes lm-spin { to { transform: rotate(360deg); } }
@keyframes lm-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
@media (max-width: 820px) {
  .lm-info { width: min(292px, calc(100% - 40px)); padding: 16px 17px 14px; }
  .lm-desc { -webkit-line-clamp: 4; }
  .lm-hint { display: none; }
  .lm-tab { min-width: 122px; }
}
@media (max-width: 640px) {
  .lm-root { min-height: 480px; }
  .lm-header { padding: 16px 16px 0; gap: 12px; }
  .lm-title { font-size: 21px; }
  .lm-subtitle { display: none; }
  .lm-live { padding: 0 10px; font-size: 7px; }
  .lm-info {
    inset-block-start: 78px;
    inset-inline: 16px;
    width: auto;
    padding: 14px 15px 13px;
    border-radius: 14px;
  }
  .lm-info-top { margin-block-end: 10px; }
  .lm-info h2 { font-size: 26px; }
  .lm-desc { margin: 10px 0 12px; -webkit-line-clamp: 3; font-size: 10.5px; }
  .lm-facts { gap: 9px; padding-block-start: 10px; }
  .lm-fact dd { font-size: 9.5px; }
  .lm-controls {
    inset-block-start: auto;
    inset-block-end: 78px;
    inset-inline-end: 16px;
    flex-direction: row;
  }
  .lm-icon-btn { width: 42px; height: 42px; border-radius: 11px; }
  .lm-tabs {
    inset-block-end: 12px;
    inset-inline: 12px;
    max-width: none;
    padding: 5px;
    border-radius: 15px;
    transform: none;
    justify-content: flex-start;
  }
  .lm-tab { min-width: 106px; min-height: 48px; padding: 7px 10px; column-gap: 8px; }
  .lm-tab-place { display: none; }
  .lm-tab-name { font-size: 9.5px; }
}
@media (max-height: 650px) and (min-width: 641px) {
  .lm-info { inset-block-start: 96px; }
  .lm-controls { inset-block-start: 96px; }
  .lm-desc { -webkit-line-clamp: 3; }
  .lm-tabs { inset-block-end: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .lm-info, .lm-live-dot, .lm-loader::before, .lm-loader::after { animation: none; }
  .lm-icon-btn, .lm-tab, .lm-loading { transition: none; }
}
`;
