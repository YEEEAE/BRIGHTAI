# Style Studio

A DeepSeek Harness plugin that adds a **Style Studio** entry to the left sidebar and a full panel in the main column for changing the look of the entire app.

## Styles

| Style | Mood | Key treatment |
| --- | --- | --- |
| Midnight Aurora | Calm, focused dark | Deep navy surfaces, periwinkle accent, soft glow |
| Pixel Arcade | Pixelated dark | Zero radii, monospace type, `image-rendering: pixelated`, CRT grid overlay |
| Paper Atelier | Warm light | Cream paper, ink-brown type, terracotta accent, serif UI |
| Amber Terminal | Operator console | Amber on near black, monospace UI, 2px mechanical corners |
| Candy Pop | Playful light | Magenta accents, lilac surfaces, pill-shaped buttons |

## How it works

- `index.js` is the Host half and has no runtime behavior.
- `client.js` registers:
  - `sidebar.panellist` with id `style-studio` — the left-sidebar entry and its palette icon.
  - `main` with key `style-studio` — the style picker panel.
  - `shell.overlay` with id `style-studio-runtime` — the global stylesheet for typography and shape treatments.
- Each style applies a full alias-token layer through `ctx.theme.overrideTokens()` and sets the matching base scheme through `ctx.theme.setTheme()`. The layer is independent of the built-in theme preference, so a late Host settings adoption cannot erase the selected palette.
- The chosen style key is stored in `localStorage` under `style-studio:selected`; it is restored on the next launch. Choosing a different base scheme or **Use system default** clears the saved style.
- The panel and the icon follow the active locale (English, Arabic, Chinese) and inherit the host theme tokens.

## Verification

- JavaScript parses (`node --check`), and the bundle manifest and locale JSON files parse.
- Installation applied with no warnings; the live Client slots register the sidebar entry, main panel, and global style runtime.
- Visual verification of the five styles in the running Web GUI: **NOT RUN** — no browser control was available in the authoring session. Slot registration alone is not evidence of the rendered result.
