# Home page reference revision — 2026-10-30

## Reference and observed difference

User-requested references:
- https://dala.craftedbygc.com/
- https://styles.refero.design/style/e5f5f8cf-e68d-4ed1-bbf5-6b67569af648

Inspected the live 1440px render and its resource list. The source uses a viewport-sized WebGL canvas, large overlapping particle brain, approximately 112.5px display text and 42px narrative headings. The previous BRIGHTAI implementation used a small procedural SVG, a separate label and numbered hero strip; matching color variables alone did not reproduce this composition.

## Implemented

- Reworked the home hero to a large overlapping composition mirrored for Arabic RTL; moved the amber label under the title and removed the decorative hero index/caption.
- Enlarged open narrative sections and feature symbols, retaining all user copy and current internal links.
- Implemented a new Canvas 2D renderer with projection, depth sorting, rotation, pointer response, ambient particles, capped pixel ratio and approximately 25fps scheduling; no WebGL library or new runtime dependency.
- Particle geometry/colors/scales are derived from Dala's publicly served resources below, explicitly supplied as the reference by the user. They are **reference-derived assets**, not original BRIGHTAI artwork. The renderer implementation is local; the source site's application, fonts, trackers, branding and people were not imported.

## Asset provenance

Retrieved 2026-10-30:
- https://dala.craftedbygc.com/images/pos-33.exr — 200×200 float XYZ texture; top-left 100×100 region describes the brain.
- https://dala.craftedbygc.com/images/cd-33.png — matching RGB texture.
- https://dala.craftedbygc.com/images/sc-33.png — matching particle-size texture.

These assets remain attributable to the reference creators. No license grant was present in the inspected style description; this record documents origin, not a claim of ownership or licensing.

`public/visuals/neural-particles.bin`: 10,000 records × 10 bytes, exactly 100,000 bytes. Per record: little-endian signed int16 x/y/z, then uint8 red/green/blue/size. Normalize XYZ by 32767. Source EXR RGB values were centered and scaled with `(value - 0.5) * 2`; texture pixels are read row-major from the top-left quadrant. RGB is copied from the matching PNG, size is the mean of the three scale channels. The build-time SVG preview samples every 12th record into `src/data/neural-preview.json`.

Desktop renders all 10,000 particles; mobile renders every second record. A static SVG fallback uses the same geometry if JavaScript, fetch or Canvas fails. Reduced motion draws one stationary frame; drawing pauses when offscreen or the page is hidden.

## Verification and limits

- Astro build: PASS, 24 pages.
- Browser: 360/768/1024/1440px, one H1 and no horizontal overflow; no page errors during checks.
- Reduced-motion frame comparison: identical frames; normal motion resumes after changing the preference.
- Local route verification: see execution result recorded in Project Mind.
- Visual desktop/mobile inspection completed. Full original WebGL physics, depth-of-field, scroll morphing and the proprietary Latin font are not reproduced; the Arabic font and approved BRIGHTAI logo remain in use.
- No claim of measured improvement in Core Web Vitals or production deployment. The 100KB binary is same-origin and no source-site request is required at runtime.
