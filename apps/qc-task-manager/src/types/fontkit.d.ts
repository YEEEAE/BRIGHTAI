// Minimal ambient types for the parts of fontkit (v2) used by the reporting
// PDF writer. The package ships no TypeScript definitions.

declare module 'fontkit' {
  export interface FontkitGlyph {
    id: number;
    advanceWidth: number;
    codePoints?: number[];
  }

  export interface FontkitPosition {
    xAdvance: number;
    yAdvance: number;
    xOffset: number;
    yOffset: number;
  }

  export interface FontkitGlyphRun {
    glyphs: FontkitGlyph[];
    positions: FontkitPosition[];
  }

  export interface FontkitFont {
    postscriptName: string;
    unitsPerEm: number;
    numGlyphs: number;
    ascent: number;
    descent: number;
    capHeight: number;
    italicAngle: number;
    bbox: { minX: number; minY: number; maxX: number; maxY: number };
    layout(text: string): FontkitGlyphRun;
  }

  export function create(source: Uint8Array | ArrayBuffer | string): FontkitFont;
}
