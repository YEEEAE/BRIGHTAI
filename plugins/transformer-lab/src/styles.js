export const CSS = `
.tl-root {
  --tl-cyan: #6fe3ff;
  --tl-amber: #ffc46b;
  --tl-violet: #b79cff;
  --tl-green: #7ee0b0;
  --tl-ink: #e9f3ff;
  --tl-muted: #93a6bf;
  --tl-line: rgba(148, 190, 235, 0.16);
  --tl-panel: rgba(9, 15, 26, 0.76);
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 540px;
  overflow: hidden;
  isolation: isolate;
  container-type: inline-size;
  background:
    radial-gradient(120% 90% at 78% 4%, rgba(111, 227, 255, 0.09), transparent 58%),
    radial-gradient(100% 80% at 8% 104%, rgba(255, 196, 107, 0.07), transparent 60%),
    #05080f;
  color: var(--tl-ink);
  font-family: "IBM Plex Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.tl-root:fullscreen { width: 100vw; height: 100vh; min-height: 0; }
.tl-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
  outline: none;
  background: #05080f;
}
.tl-canvas:active { cursor: grabbing; }
.tl-canvas:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tl-cyan) 70%, transparent); }
.tl-vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 52% 42%, transparent 38%, rgba(2, 5, 10, 0.55) 100%),
    linear-gradient(180deg, rgba(3, 6, 12, 0.72) 0%, transparent 20%, transparent 72%, rgba(3, 6, 12, 0.9) 100%);
}
.tl-vignette::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.05;
  mix-blend-mode: soft-light;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E");
}

/* ------------------------------------------------------------------ HUD */
.tl-hud {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  pointer-events: none;
}
.tl-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding-block-start: calc(var(--tl-safe-top, 0px) + 20px);
  padding-inline: calc(var(--tl-safe-left, 0px) + 26px) 26px;
  pointer-events: none;
}
.tl-titleblock { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.tl-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  color: color-mix(in srgb, var(--tl-cyan) 88%, #fff);
  font-family: "SFMono-Regular", "Cascadia Code", ui-monospace, monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}
.tl-eyebrow::before {
  content: "";
  width: 22px;
  height: 1px;
  background: currentColor;
  opacity: 0.7;
}
.tl-title {
  margin: 0;
  color: var(--tl-ink);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  font-size: clamp(26px, 2.6vw, 38px);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -0.028em;
  text-wrap: balance;
}
.tl-subtitle {
  max-width: 46ch;
  margin: 0;
  color: var(--tl-muted);
  font-size: 11.5px;
  line-height: 1.6;
  text-wrap: pretty;
}
.tl-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  flex: none;
}
.tl-step, .tl-score {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 0 11px;
  border: 1px solid color-mix(in srgb, var(--tl-cyan) 26%, var(--tl-line));
  border-radius: 100px;
  background: rgba(6, 11, 20, 0.6);
  color: color-mix(in srgb, var(--tl-cyan) 78%, var(--tl-ink));
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
  backdrop-filter: blur(12px);
}
.tl-score { color: color-mix(in srgb, var(--tl-amber) 86%, var(--tl-ink)); border-color: color-mix(in srgb, var(--tl-amber) 24%, var(--tl-line)); }

.tl-mid {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 0;
  padding: 16px 26px 8px;
}
.tl-side { display: flex; flex-direction: column; gap: 10px; min-height: 0; max-height: 100%; }
.tl-side-left { width: 336px; flex: none; }
.tl-side-right { width: 300px; flex: none; }
.tl-card {
  pointer-events: auto;
  border: 1px solid var(--tl-line);
  border-radius: 16px;
  background:
    linear-gradient(155deg, rgba(16, 24, 39, 0.9), rgba(8, 13, 23, 0.72)),
    radial-gradient(120% 90% at 0% 0%, rgba(111, 227, 255, 0.08), transparent 62%);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(115%);
}
.tl-stagecard {
  padding: 16px 17px 14px;
  max-height: 100%;
  overflow: auto;
  animation: tl-rise 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.tl-stagecard::-webkit-scrollbar { width: 6px; }
.tl-stagecard::-webkit-scrollbar-thumb { background: rgba(148, 190, 235, 0.22); border-radius: 6px; }
.tl-stage-head { display: flex; align-items: center; gap: 10px; margin-block-end: 9px; }
.tl-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--tl-cyan) 34%, transparent);
  background: color-mix(in srgb, var(--tl-cyan) 12%, transparent);
  color: color-mix(in srgb, var(--tl-cyan) 88%, #fff);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 10px;
  font-weight: 700;
}
.tl-stage-title {
  margin: 0;
  color: var(--tl-ink);
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.tl-stage-body {
  margin: 0;
  color: color-mix(in srgb, var(--tl-muted) 94%, #fff 6%);
  font-size: 11.5px;
  line-height: 1.68;
  text-wrap: pretty;
}
.tl-formula {
  margin: 11px 0 10px;
  padding: 8px 10px;
  border: 1px solid rgba(148, 190, 235, 0.13);
  border-radius: 9px;
  background: rgba(4, 9, 17, 0.58);
  color: color-mix(in srgb, var(--tl-cyan) 76%, var(--tl-ink));
  font-family: "SFMono-Regular", "Cascadia Code", ui-monospace, monospace;
  font-size: 10px;
  line-height: 1.5;
  direction: ltr;
  text-align: left;
  overflow-wrap: anywhere;
}
.tl-notice {
  display: flex;
  gap: 8px;
  margin: 0;
  padding-block-start: 9px;
  border-block-start: 1px solid var(--tl-line);
  color: color-mix(in srgb, var(--tl-amber) 74%, var(--tl-muted));
  font-size: 10px;
  line-height: 1.58;
}
.tl-notice span { color: var(--tl-amber); flex: none; }

.tl-rail {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
  margin-block-start: 12px;
}
.tl-rail-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-height: 40px;
  padding: 5px 2px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: rgba(8, 14, 24, 0.5);
  color: color-mix(in srgb, var(--tl-muted) 82%, transparent);
  font: inherit;
  font-size: 8px;
  line-height: 1.1;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}
.tl-rail-btn:hover { color: var(--tl-ink); border-color: var(--tl-line); }
.tl-rail-btn.is-current {
  border-color: color-mix(in srgb, var(--tl-cyan) 42%, transparent);
  background: color-mix(in srgb, var(--tl-cyan) 11%, transparent);
  color: color-mix(in srgb, var(--tl-cyan) 88%, #fff);
}
.tl-rail-btn.is-done { color: color-mix(in srgb, var(--tl-green) 72%, var(--tl-muted)); }
.tl-rail-num { font-family: "SFMono-Regular", ui-monospace, monospace; font-size: 9px; font-weight: 700; }
.tl-rail-name { font-size: 7.5px; letter-spacing: 0.04em; text-align: center; }
.tl-rail-btn:focus-visible, .tl-btn:focus-visible, .tl-head-btn:focus-visible, .tl-candidate:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--tl-cyan) 82%, transparent);
  outline-offset: 2px;
}

/* ------------------------------------------------------------------ inspector */
.tl-inspector { padding: 14px 15px; display: flex; flex-direction: column; gap: 11px; max-height: 100%; overflow: auto; animation: tl-rise 0.45s 0.05s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.tl-inspector-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tl-inspector-title {
  margin: 0;
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--tl-cyan) 78%, var(--tl-ink));
}
.tl-query {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--tl-cyan) 22%, var(--tl-line));
  border-radius: 10px;
  background: rgba(6, 12, 22, 0.62);
}
.tl-query small { color: var(--tl-muted); font-size: 9px; }
.tl-query strong { color: var(--tl-cyan); font-family: "SFMono-Regular", ui-monospace, monospace; font-size: 13px; font-weight: 700; }
.tl-heads { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.tl-head-btn {
  min-height: 30px;
  padding: 0 6px;
  border: 1px solid var(--tl-line);
  border-radius: 8px;
  background: rgba(7, 12, 22, 0.5);
  color: var(--tl-muted);
  font: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}
.tl-head-btn:hover { color: var(--tl-ink); border-color: var(--tl-line); }
.tl-head-btn.is-active { color: #061019; background: var(--tl-cyan); border-color: var(--tl-cyan); }
.tl-head-btn:nth-child(2).is-active { background: var(--tl-amber); border-color: var(--tl-amber); }
.tl-head-btn:nth-child(3).is-active { background: var(--tl-violet); border-color: var(--tl-violet); }
.tl-keys { display: flex; flex-direction: column; gap: 7px; }
.tl-key-row { display: grid; grid-template-columns: 66px minmax(0, 1fr) 38px; align-items: center; gap: 8px; }
.tl-key-name {
  overflow: hidden;
  color: var(--tl-ink);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tl-key-track { height: 5px; border-radius: 100px; background: rgba(148, 190, 235, 0.12); overflow: hidden; }
.tl-key-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, var(--tl-cyan), color-mix(in srgb, var(--tl-cyan) 40%, var(--tl-amber))); }
.tl-key-pct { color: var(--tl-muted); font-family: "SFMono-Regular", ui-monospace, monospace; font-size: 9px; text-align: end; }
.tl-note { margin: 0; color: color-mix(in srgb, var(--tl-muted) 78%, transparent); font-size: 9px; line-height: 1.55; }
.tl-wide { width: 100%; justify-content: center; }

/* ------------------------------------------------------------------ game */
.tl-candidates { display: flex; flex-direction: column; gap: 6px; }
.tl-candidate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid var(--tl-line);
  border-radius: 9px;
  background: rgba(7, 12, 22, 0.55);
  color: var(--tl-ink);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}
.tl-candidate:hover:not(:disabled) { border-color: color-mix(in srgb, var(--tl-cyan) 40%, var(--tl-line)); background: rgba(111, 227, 255, 0.07); }
.tl-candidate:disabled { cursor: default; opacity: 0.86; }
.tl-candidate.is-right { border-color: color-mix(in srgb, var(--tl-amber) 65%, transparent); background: rgba(255, 196, 107, 0.1); }
.tl-candidate.is-wrong { border-color: color-mix(in srgb, #ff6b84 62%, transparent); background: rgba(255, 107, 132, 0.09); }
.tl-candidate strong { font-family: "SFMono-Regular", ui-monospace, monospace; font-size: 11px; }
.tl-candidate span { color: var(--tl-muted); font-family: "SFMono-Regular", ui-monospace, monospace; font-size: 9px; }
.tl-result {
  margin: 0;
  padding: 9px 10px;
  border-radius: 9px;
  border: 1px solid var(--tl-line);
  font-size: 10px;
  line-height: 1.6;
}
.tl-result.is-good { border-color: color-mix(in srgb, var(--tl-green) 45%, transparent); background: rgba(126, 224, 176, 0.08); color: color-mix(in srgb, var(--tl-green) 84%, var(--tl-ink)); }
.tl-result.is-bad { border-color: rgba(255, 107, 132, 0.4); background: rgba(255, 107, 132, 0.07); color: color-mix(in srgb, #ff9db0 86%, var(--tl-ink)); }
.tl-reveal { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.tl-reveal span {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 5px 2px;
  border-radius: 7px;
  background: rgba(8, 14, 24, 0.55);
  color: var(--tl-muted);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 8px;
}
.tl-reveal b { color: var(--tl-ink); font-size: 9.5px; }
.tl-token-list { display: flex; flex-wrap: wrap; gap: 4px; }
.tl-token-btn {
  min-height: 30px;
  padding: 0 8px;
  border: 1px solid var(--tl-line);
  border-radius: 7px;
  background: rgba(7, 12, 22, 0.5);
  color: var(--tl-muted);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 9px;
  cursor: pointer;
}
.tl-token-btn.is-active { border-color: color-mix(in srgb, var(--tl-cyan) 55%, transparent); color: var(--tl-cyan); }

/* ------------------------------------------------------------------ dock */
.tl-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding: 10px 18px max(16px, env(safe-area-inset-bottom));
  pointer-events: none;
}
.tl-hint {
  margin: 0;
  max-width: 72ch;
  color: color-mix(in srgb, var(--tl-muted) 82%, transparent);
  font-size: 9.5px;
  line-height: 1.5;
  text-align: center;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.8);
}
.tl-dock {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 6px;
  border: 1px solid var(--tl-line);
  border-radius: 15px;
  background: rgba(8, 13, 23, 0.82);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(120%);
  pointer-events: auto;
}
.tl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 40px;
  min-height: 40px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: color-mix(in srgb, var(--tl-muted) 92%, var(--tl-ink));
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.tl-btn:hover { color: var(--tl-ink); background: rgba(148, 190, 235, 0.08); }
.tl-btn.is-primary {
  border-color: color-mix(in srgb, var(--tl-cyan) 46%, transparent);
  background: color-mix(in srgb, var(--tl-cyan) 15%, transparent);
  color: color-mix(in srgb, var(--tl-cyan) 92%, #fff);
}
.tl-btn.is-primary:hover { background: color-mix(in srgb, var(--tl-cyan) 24%, transparent); }
.tl-btn.is-on { color: var(--tl-amber); border-color: color-mix(in srgb, var(--tl-amber) 34%, transparent); background: color-mix(in srgb, var(--tl-amber) 10%, transparent); }
.tl-btn:disabled { opacity: 0.4; cursor: default; }
.tl-divider { width: 1px; height: 22px; margin: 0 3px; background: var(--tl-line); }
.tl-icon { display: inline-flex; width: 16px; height: 16px; }
.tl-icon svg { width: 100%; height: 100%; }

/* ------------------------------------------------------------------ states */
.tl-loading {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 46%, rgba(9, 18, 31, 0.86), rgba(4, 7, 13, 0.96));
  transition: opacity 0.5s ease, visibility 0.5s ease;
}
.tl-loading.is-hidden { opacity: 0; visibility: hidden; }
.tl-loading-inner { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.tl-loader {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(111, 227, 255, 0.18);
  border-top-color: var(--tl-cyan);
  animation: tl-spin 0.9s linear infinite;
}
.tl-loading-text {
  color: var(--tl-muted);
  font-family: "SFMono-Regular", ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.tl-error {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 7, 13, 0.94);
}
.tl-error-card { max-width: 420px; padding: 22px; border: 1px solid var(--tl-line); border-radius: 16px; background: var(--tl-panel); }
.tl-error-card h2 { margin: 0 0 8px; font-family: "Iowan Old Style", Georgia, serif; font-size: 22px; font-weight: 500; }
.tl-error-card p { margin: 0; color: var(--tl-muted); font-size: 11.5px; line-height: 1.7; }
.tl-sr {
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

@keyframes tl-spin { to { transform: rotate(360deg); } }
@keyframes tl-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

@container (max-width: 1040px) {
  .tl-side-left { width: 312px; }
  .tl-side-right { width: 278px; }
  .tl-rail-name { display: none; }
  .tl-stagecard { padding: 13px 14px 12px; }
}
@container (max-width: 860px) {
  .tl-side-right {
    position: absolute;
    inset-inline: 16px;
    bottom: 92px;
    z-index: 4;
    display: flex;
    width: auto;
    max-height: 38vh;
  }
  .tl-side-right .tl-inspector { width: 100%; max-height: 100%; overflow: auto; }
  .tl-side-left { width: min(330px, calc(100vw - 48px)); }
  .tl-subtitle { max-width: 40ch; }
}
@container (max-width: 620px) {
  .tl-top { padding-block-start: calc(var(--tl-safe-top, 0px) + 14px); padding-inline: calc(var(--tl-safe-left, 0px) + 16px) 16px; gap: 10px; }
  .tl-title { font-size: 23px; }
  .tl-subtitle { display: none; }
  .tl-status { gap: 5px; }
  .tl-step, .tl-score { min-height: 24px; padding: 0 8px; font-size: 7.5px; letter-spacing: 0.12em; }
  .tl-mid { padding: 10px 16px 4px; }
  .tl-side-left { width: min(300px, calc(100vw - 32px)); }
  .tl-stagecard { max-height: 40vh; }
  .tl-side-right { inset-inline: 12px; bottom: 82px; max-height: 40vh; }
  .tl-stage-body { font-size: 11px; line-height: 1.55; }
  .tl-dock { overflow-x: auto; max-width: calc(100vw - 24px); justify-content: flex-start; scrollbar-width: none; }
  .tl-dock::-webkit-scrollbar { display: none; }
  .tl-hint { display: none; }
  .tl-bottom { padding-inline: 10px; }
  .tl-btn span.tl-btn-label { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .tl-stagecard, .tl-inspector { animation: none; }
  .tl-loader { animation-duration: 2s; }
  .tl-btn, .tl-candidate, .tl-head-btn, .tl-rail-btn { transition: none; }
}
`;
