# Landmark Atlas

A DeepSeek Harness plugin that adds a **Landmark Atlas** entry to the left sidebar and opens a full interactive 3D panel in the main column.

## What it renders

| Landmark | City | Scene notes |
| --- | --- | --- |
| Eiffel Tower | Paris, France | Procedural iron lattice, four base arches, three observation decks, rotating beacon, night skyline |
| Great Wall | Huairou, China | Ridge-following wall, crenellated parapets, watchtowers, flags, faceted mountain terrain |
| Forbidden City | Beijing, China | Marble terraces, vermilion halls, double-eaved golden roofs, perimeter walls, lanterns |
| Taj Mahal | Agra, India | Octagonal marble core, onion dome, chhatris, four minarets, charbagh garden, planar reflecting pool |

All four models are generated from geometry at runtime. No external model files, textures, CDN requests, or network access are used.

## Interaction

- Drag to orbit, scroll to zoom, double-click to reset.
- Arrow keys orbit and `+` / `-` zoom while the canvas has focus; `R` resets.
- Toolbar controls toggle auto-orbit, reset the view, and enter fullscreen.
- Auto-orbit defaults off when the operating system requests reduced motion.
- The panel supports English, Chinese, and Arabic dictionaries; labels follow the active Harness locale.

## Integration

- `index.js` is the Host half and intentionally has no runtime behavior.
- `client.js` registers two Client slots:
  - `sidebar.panellist` with id `landmarks-3d`
  - `main` with key `landmarks-3d`
- The bundle metadata lives in `locale/{en,zh,ar}.json` and `icon.svg`.
- The bundled browser module imports React from the Harness module table and bundles Three.js.

## Source and build

```
src/client.js   Module-loader entry
src/ui.js       React UI, locale dictionaries, orbit engine
src/scenes.js   Procedural scene builders and materials
src/styles.js   Scoped panel styles
scripts/build.mjs
```

The checked-in `client.js` is the built artifact. To rebuild it:

```bash
mkdir -p .cache/landmarks-build
cd .cache/landmarks-build
npm init -y
npm install three@0.180.0 --cache "$PWD/.npm-cache"
cd ../..
node plugins/landmarks-3d/scripts/build.mjs
```

`esbuild` resolves from the workspace `node_modules`; `three` resolves from `.cache/landmarks-build/node_modules`. React remains external and comes from the Harness browser module table.

## Resource behavior

The panel creates four Three.js scenes once, then renders only the selected scene. Geometry is merged by material, shadows use 1024px directional maps, device pixel ratio is capped at 2, and all geometries, materials, textures, render targets, listeners, and animation frames are released when the panel unmounts.
