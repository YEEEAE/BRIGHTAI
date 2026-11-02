# Paper Reader

A DeepSeek Harness right-sidebar paper reader. It keeps the uploaded PDF intact, renders its pages at device-pixel density, adds a selectable text layer, and turns a text selection into a highlight, a note, or a question for the current conversation.

## Open it

1. Open the right sidebar from the conversation header.
2. In the guide, choose **Paper Reader**.
3. Add a PDF with the button or drop one anywhere on the reader.

Every session has its own right-sidebar layout; the paper library itself is browser-wide.

## What is preserved

- The exact uploaded bytes are stored in IndexedDB and are never rewritten.
- The PDF page is rendered by PDF.js with its embedded fonts, images, vector content, and page geometry. A transparent text layer is aligned over the page for selection and accessibility.
- **Original PDF** switches to the browser's native PDF presentation using the stored blob, without any conversion. **Download original** saves the original file unchanged.
- Highlights and notes are overlays stored separately; they never modify the PDF.

## Selection actions

Select text in the reader to open a floating menu:

- **Highlight** stores an amber overlay and adds it to the paper's annotation list.
- **Note** opens a note sheet; the selected text stays attached to the note.
- **Ask** builds a question in the current interface language (English, Arabic, or Chinese), appends it to the composer, and sends it in the conversation. The prompt includes the paper name, page range, and selected passage.

The default question follows the active interface locale (`askPrompt` in `src/client.jsx`). If the composer actions are unavailable, the question is copied to the clipboard instead.

## Storage and privacy

- Papers, original bytes, highlights, and notes live in this browser's IndexedDB under `dsh-paper-reader`.
- Nothing is uploaded to a server by this plugin.
- Removing a paper removes its stored bytes and its annotations. The confirmation is required before deletion.
- The active paper id and local guide layout are the only values kept in localStorage by this plugin.

## Build

The client bundle is self-contained and vendors PDF.js 6.5.438 (Apache-2.0):

```bash
node scripts/build.mjs
```

`vendor/pdf.min.mjs` and `vendor/pdf.worker.min.mjs` are checked in for reproducible offline builds. PDF.js is bundled under the license in `vendor/LICENSE.pdfjs`.

## Structure

- `index.js` — no-op Host half.
- `src/client.jsx` — right-sidebar tab, reader UI, IndexedDB storage, annotations, and conversation handoff.
- `src/polyfills.js` — compatibility shims for the PDF.js runtime's newest built-ins.
- `scripts/build.mjs` — writes the worker string, then bundles the IIFE client artifact.
- `client.js` — generated client artifact loaded by the Harness module loader.

## Known limits

- The reader is available only with a selected Session because the Harness right sidebar is session-scoped.
- The PDF.js text layer supports ordinary text selection. Scanned image-only PDFs have no selectable text; use **Original PDF** for those.
- PDFs using rare CMaps or non-embedded standard fonts may fall back to system fonts in the selectable layer; the **Original PDF** mode remains byte-for-byte lossless.
- Highlight geometry is stored in normalized page coordinates, so it follows width and zoom changes without re-selecting text.
