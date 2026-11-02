# Poster Workbench

A poster studio that lives inside the DeepSeek Harness conversation. It adds a **Poster** view beside Chat and Trajectory, renders the Harness fluid shader into a portrait canvas, and lets the title, supporting text, and shader palette change live.

- Default poster title: **Everything is a plugin**
- Poster type: **Host Grotesk** (the display face used by the Harness marketing site)
- Utility labels on the poster: **Fragment Mono**
- Default page: poster only, with Customize and PNG controls; no headings or extra explanation
- Customization: title, text, three shader colors, five palettes, reset
- Export: 1600 × 2000 PNG rendered from the same shader and typography code as the preview
- Accessibility: hidden live heading/text for the canvas, labelled controls, Escape closes the editor, reduced-motion renders a static shader frame, Canvas2D fallback if WebGL2 is unavailable
- Persistence: the current poster is stored in `localStorage` under `poster-workbench:v1`

## Files

- `client.js` — generated single-file Client bundle
- `src/client.template.js` — readable source; fonts are injected at build time
- `scripts/build.mjs` — rebuilds `client.js` without external dependencies
- `fonts/` — Host Grotesk and Fragment Mono Latin WOFF2 builds from the DeepSeek Harness site, embedded into the bundle
- `locale/{en,ar,zh}.json` — plugin inventory metadata

Rebuild after changing the source:

```bash
node scripts/build.mjs
node --check client.js
```

## Visual references

The fluid shader is adapted from the DeepSeek Harness marketing page's flowing background (simplex FBM, domain warping, curl noise, five-color mix, grain/dither), as documented in the public site CSS and the community reference implementation [`ycqaq233/dsh-unknown-theme`](https://github.com/ycqaq233/dsh-unknown-theme). The fonts are the site's own `host-grotesk-latin.woff2` and `fragment-mono-latin.woff2` assets. Both families are distributed through Google Fonts (Open Font License).
