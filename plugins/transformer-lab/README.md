# Transformer Lab

A DeepSeek Harness plugin that adds a **Transformer Lab** entry to the left sidebar and opens an interactive 3D game in the main column. It teaches what a decoder-style Transformer computes, one stage at a time.

## What the panel renders

One vertical column per token. Each column is a residual stream that passes four visible levels:

| Level | What the scene shows |
| --- | --- |
| Tokens | Token slabs with their text labels |
| Embeddings | An 8-bar vector ring around every token |
| Attention | Query/key arcs with softmax weights, three swappable heads |
| MLP | A position-wise hidden layer with orbiting hidden units and particles |
| Output | Four clickable probability bars for the next-token candidates |

The six guided stages are **Tokenize → Embed → Attend → Heads → MLP → Predict**.

## Interaction

- Drag to orbit, scroll to zoom, double-click or `R` to reset the camera.
- Click any token in the scene (or in the inspector) to make it the attention query. Thicker arcs mean a larger softmax weight.
- Switch attention heads in the inspector and compare the arc patterns.
- At the prediction stage, click a 3D bar or a candidate button **before** the distribution is revealed. The panel scores the pick, reveals the probabilities and highlights the top choice.
- The dock controls previous/next stage, auto-run, a new sentence, auto-orbit, camera reset, fullscreen and restart. `Space`, `←` and `→` also step.
- Auto-orbit is off when the operating system requests reduced motion.
- The UI follows the active Harness locale (English, Arabic, Chinese) and switches to RTL for Arabic.

## macOS window buttons

The panel title and toolbar never sit under the native traffic lights:

- The title block reserves an extra 42 px of top padding whenever the panel starts within 34 px of the window top.
- It also adds a horizontal inset when the panel's left edge would put the title under the buttons.
- The measurement uses the panel's live bounding rect, so it adapts when the sidebar is expanded, collapsed or the panel enters fullscreen.
- The toolbar is anchored to the bottom dock, away from the title bar entirely.

## Honest scope

The attention numbers are **computed live**, not hand-animated: each token gets a seeded 8-dimensional embedding plus sinusoidal position, and three heads run `softmax(QKᵀ/√d)` with their own seeded projections. This is a teaching model, not a trained LLM. The four next-token probabilities are illustrative teaching values authored per sentence; the panel labels them as such.

## Integration

- `index.js` is the Host half and intentionally has no runtime behavior.
- `client.js` registers two Client slots:
  - `sidebar.panellist` with id `transformer-lab`
  - `main` with key `transformer-lab`
- Bundle metadata lives in `locale/{en,ar,zh}.json` and `icon.svg`.
- React comes from the Harness browser module table; Three.js is bundled into `client.js`.

## Source and build

```
src/client.js   Module-loader entry
src/ui.js       React UI, inspector and game state
src/scene.js    Three.js scene, arcs, bars and camera
src/math.js     Prompt data, seeded attention model
src/dict.js     en / ar / zh dictionaries
src/styles.js   Scoped panel styles and responsive rules
scripts/build.mjs
```

The checked-in `client.js` is the built artifact. To rebuild:

```bash
node plugins/transformer-lab/scripts/build.mjs
```

esbuild resolves from the workspace `node_modules`; Three.js resolves from `.cache/landmarks-build/node_modules` (or `node_modules`). React stays external.

## Resource behavior

A single scene is created per panel mount. Geometry, materials, canvas textures, listeners, the resize observer and the render loop are released on unmount; the WebGL context is dropped explicitly.
