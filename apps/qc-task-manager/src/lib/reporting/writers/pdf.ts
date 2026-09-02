// Reporting PDF writer (/api/reports/[reportType].pdf).
//
// Arabic/RTL correctness fixed inside this existing writer (no second export
// pipeline). The old output used the /Courier Type1 base-14 font with latin1
// encoding: zero Arabic glyphs and mojibake bytes, no shaping (PDF has none
// natively), logical order drawn left-to-right so Arabic read reversed, and a
// single ' | '-joined text line per row.
//
// What this implementation does instead:
//  - Embeds IBM Plex Sans Arabic Regular (SIL OFL 1.1 — fonts/OFL.txt) as a
//    CIDFontType2 /Identity-H font with a ToUnicode CMap so Arabic renders
//    and stays copy/paste-searchable.
//  - Shapes every cell through fontkit OpenType layout: contextual joining
//    forms, lam-alef ligatures, GPOS mark positioning (offsets drawn with a
//    per-glyph positioning fallback).
//  - Applies the bidi algorithm at cell level: logical paragraph direction
//    from the first strong character, neutrals resolved to their surrounding
//    strong types, RTL runs emitted in visual (reversed) glyph order because
//    the content stream draws left-to-right; Latin/digit runs stay LTR inside
//    Arabic paragraphs.
//  - Tables whose header row contains Arabic mirror their column order (first
//    logical column rightmost) with every data value kept under its own
//    header and right-aligned cells; Latin-header catalogs keep the
//    historical LTR layout. Alignment follows the table direction.
// CSV/XLSX writers are sibling modules and are intentionally untouched.

import { create as fontkitCreate } from 'fontkit';
import type { FontkitFont } from 'fontkit';
import { deflateSync } from 'node:zlib';
import { FONT_BASE64 } from './fonts/fontData';

type PdfCell = string | number | null | undefined;
type PdfRow = readonly PdfCell[];

export interface PdfDocumentOptions {
  /** Optional document header rendered above the repeated table header. */
  headerLines?: readonly string[];
  /** Plain-text PDF Info metadata; the visible stream remains fully Unicode. */
  metadata?: readonly string[];
  /** PDF document language (BCP-47 tag). */
  language?: string;
  /** Reading direction for PDF viewers. */
  direction?: 'R2L' | 'L2R';
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 36;
const TOP_Y = 798;
const BOTTOM_Y = 44;
const FS = 8; // font size in pt
const LINE_H = 12; // baseline distance between wrapped lines
const CELL_PAD = 3; // horizontal inner padding of a column box
const ROW_GAP = 4; // vertical space between rows
const HEADER_RULE_GAP = 5; // space between last header baseline and rule
const ROW_FIRST_BASELINE_GAP = 9; // rule to first row baseline

let cachedFont: FontkitFont | null = null;

function arabicFont(): FontkitFont {
  if (!cachedFont) {
    cachedFont = fontkitCreate(Buffer.from(FONT_BASE64, 'base64'));
  }
  return cachedFont;
}

interface ShapedGlyph {
  gid: number;
  advance: number; // layout advance incl. kerning (font units)
  xOffset: number;
  yOffset: number;
}

interface ShapedRun {
  glyphs: ShapedGlyph[];
  widthUnits: number;
}

interface GlyphMeta {
  width: number; // canonical hmtx advanceWidth (font units) — drives the /W array
  unicode: number[]; // source code points — drives ToUnicode
}

const glyphMeta = new Map<number, GlyphMeta>();
const shapeCache = new Map<string, ShapedRun>();
const SHAPE_CACHE_MAX = 50_000;

function shapeText(text: string): ShapedRun {
  const hit = shapeCache.get(text);
  if (hit) return hit;
  const run = arabicFont().layout(text);
  const glyphs: ShapedGlyph[] = [];
  let widthUnits = 0;
  for (let i = 0; i < run.glyphs.length; i += 1) {
    const glyph = run.glyphs[i];
    if (!glyphMeta.has(glyph.id)) {
      const unicode = glyph.codePoints ? [...glyph.codePoints] : [];
      // fontkit exposes Arabic ligature code points in glyph-internal order.
      // The content stream draws the glyph cluster in visual order, so map
      // multi-code-point clusters in that same order for reliable extraction.
      // Lam-alef is intentionally kept logical because it is the canonical
      // Arabic ligature and must remain searchable as "لا".
      if (unicode.length > 1 && !(unicode.length === 2 && unicode[0] === 0x0644 && unicode[1] === 0x0627)) {
        unicode.reverse();
      }
      glyphMeta.set(glyph.id, {
        width: glyph.advanceWidth,
        unicode,
      });
    }
    const pos = run.positions[i];
    const advance = pos ? pos.xAdvance : glyph.advanceWidth;
    glyphs.push({ gid: glyph.id, advance, xOffset: pos?.xOffset ?? 0, yOffset: pos?.yOffset ?? 0 });
    widthUnits += advance;
  }
  const shaped: ShapedRun = { glyphs, widthUnits };
  if (shapeCache.size >= SHAPE_CACHE_MAX) shapeCache.clear();
  shapeCache.set(text, shaped);
  return shaped;
}

// ── Unicode bidi classification (simplified UAX #9 scoped to report cells) ──

type DirClass = 'R' | 'L' | 'N';

function charClass(cp: number): DirClass {
  // Digits form embedded LTR runs even inside Arabic paragraphs (UBA EN/AN).
  if ((cp >= 0x30 && cp <= 0x39) || (cp >= 0x660 && cp <= 0x669) || (cp >= 0x6f0 && cp <= 0x6f9)) return 'L';
  if (
    (cp >= 0x0590 && cp <= 0x08ff) || // Hebrew, Arabic, Syriac, Thaana + supplements/extended-A
    (cp >= 0xfb50 && cp <= 0xfdff) || // presentation forms A (+ Hebrew forms)
    (cp >= 0xfe70 && cp <= 0xfeff) || // Arabic presentation forms B
    cp === 0x061c || cp === 0x200f || cp === 0x202b || cp === 0x202e // ALM/RLM/RLE/RLO
  ) {
    return 'R';
  }
  if (
    (cp >= 0x41 && cp <= 0x5a) ||
    (cp >= 0x61 && cp <= 0x7a) ||
    (cp >= 0xc0 && cp <= 0x24f) || // Latin-1 letters + extended
    (cp >= 0x370 && cp <= 0x4ff) || // Greek + Cyrillic
    (cp >= 0x1e00 && cp <= 0x1fff)
  ) {
    return 'L';
  }
  return 'N'; // whitespace, punctuation, symbols, unclassified scripts
}

interface BidiRun {
  rtl: boolean;
  text: string;
}

export function segmentBidi(text: string): { baseRtl: boolean; runs: BidiRun[] } {
  const chars = Array.from(text);
  const classes = chars.map((ch) => charClass(ch.codePointAt(0) ?? 0));
  let baseRtl = false;
  for (const c of classes) {
    if (c !== 'N') {
      baseRtl = c === 'R';
      break;
    }
  }
  const resolved: ('R' | 'L')[] = new Array(chars.length);
  let i = 0;
  while (i < chars.length) {
    if (classes[i] !== 'N') {
      resolved[i] = classes[i] === 'R' ? 'R' : 'L';
      i += 1;
      continue;
    }
    let j = i;
    while (j < chars.length && classes[j] === 'N') j += 1;
    const prev: 'R' | 'L' = i > 0 ? resolved[i - 1] : baseRtl ? 'R' : 'L';
    const next: 'R' | 'L' = j < chars.length ? (classes[j] === 'R' ? 'R' : 'L') : baseRtl ? 'R' : 'L';
    const cls = prev === next ? prev : baseRtl ? 'R' : 'L';
    for (let k = i; k < j; k += 1) resolved[k] = cls;
    i = j;
  }
  const runs: BidiRun[] = [];
  for (let k = 0; k < chars.length; k += 1) {
    const rtl = resolved[k] === 'R';
    const last = runs[runs.length - 1];
    if (last && last.rtl === rtl) last.text += chars[k];
    else runs.push({ rtl, text: chars[k] });
  }
  return { baseRtl, runs };
}

/** Visual-order (left-to-right draw order) glyph sequence for one line of text. */
interface VisualLine {
  glyphs: ShapedGlyph[];
  widthUnits: number;
  marks: boolean;
}

function visualLine(line: string): VisualLine {
  const { baseRtl, runs } = segmentBidi(line);
  const shapedRuns = runs.map((run) => ({ rtl: run.rtl, glyphs: shapeText(run.text).glyphs }));
  // fontkit emits glyphs in visual order per run (RTL scripts come out already
  // reversed), so only the SEQUENCE of runs flips for an RTL paragraph — an
  // LTR tail lands to the left of the Arabic body.
  if (baseRtl) shapedRuns.reverse();
  const glyphs: ShapedGlyph[] = [];
  let marks = false;
  for (const run of shapedRuns) {
    for (const g of run.glyphs) {
      glyphs.push(g);
      if (!marks && (g.xOffset !== 0 || g.yOffset !== 0)) marks = true;
    }
  }
  return { glyphs, widthUnits: glyphs.reduce((sum, g) => sum + g.advance, 0), marks };
}

// ── Cell wrapping ──

interface CellLine {
  text: string;
}

function wrapCell(raw: PdfCell, maxUnits: number): CellLine[] {
  const normalized = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) return [];
  const tokens = normalized.split(' ');
  const spaceUnits = shapeText(' ').widthUnits;
  const lines: CellLine[] = [];
  let current: string[] = [];
  let currentUnits = 0;
  const limit = Math.max(Math.floor(maxUnits), 20);

  const pushLine = () => {
    if (current.length > 0) lines.push({ text: current.join(' ') });
    current = [];
    currentUnits = 0;
  };

  for (const token of tokens) {
    const tokenUnits = shapeText(token).widthUnits;
    if (tokenUnits > limit) {
      // Oversized single token: hard-split on characters (isolated fallback forms).
      pushLine();
      let piece = '';
      let pieceUnits = 0;
      for (const ch of Array.from(token)) {
        const chUnits = shapeText(ch).widthUnits;
        if (pieceUnits + chUnits > limit && piece.length > 0) {
          lines.push({ text: piece });
          piece = '';
          pieceUnits = 0;
        }
        piece += ch;
        pieceUnits += chUnits;
      }
      if (piece.length > 0) {
        current = [piece];
        currentUnits = pieceUnits;
      }
      continue;
    }
    if (current.length > 0 && currentUnits + spaceUnits + tokenUnits > limit) pushLine();
    current.push(token);
    currentUnits = currentUnits === 0 ? tokenUnits : currentUnits + spaceUnits + tokenUnits;
  }
  pushLine();
  return lines;
}

// ── Table geometry ──

const USABLE_W = PAGE_W - MARGIN_X * 2;
// Column sizing peeks at a bounded sample of rows (streaming profile preserved:
// the iterator resumes where the sample stopped, never buffering the dataset).
const COLUMN_SAMPLE_ROWS = 200;
const COL_MIN_PT = 44;
const COL_MAX_PT = 175;

function columnLayout(headers: readonly string[]): { widths: number[]; rtlTable: boolean } {
  const rtlTable = headers.some((h) => Array.from(h).some((ch) => charClass(ch.codePointAt(0) ?? 0) === 'R'));
  const weights = headers.map((h) => Math.max(4, h.trim().length));
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const minCol = Math.min(72, Math.floor(USABLE_W / Math.max(headers.length, 1)));
  let widths = headers.map((_, i) => Math.max(minCol, (USABLE_W * weights[i]) / totalWeight));
  const overflow = widths.reduce((a, b) => a + b, 0) - USABLE_W;
  if (overflow > 0) widths = widths.map((w) => w * (USABLE_W / (USABLE_W + overflow)));
  return { widths, rtlTable };
}

/** Content-aware sizing: natural width of header + widest sampled cell, clamped. */
function sizedColumnLayout(headers: readonly string[], sample: readonly PdfRow[]): { widths: number[]; rtlTable: boolean } {
  if (sample.length === 0) return columnLayout(headers);
  const rtlTable = headers.some((h) => Array.from(h).some((ch) => charClass(ch.codePointAt(0) ?? 0) === 'R'));
  const scale = FS / 1000;
  let widths = headers.map((h, i) => {
    let maxUnits = shapeText(h).widthUnits;
    for (const row of sample) {
      const cell = String(row[i] ?? '');
      if (cell.length > 0) maxUnits = Math.max(maxUnits, shapeText(cell).widthUnits);
    }
    return Math.min(Math.max(maxUnits * scale + CELL_PAD * 2 + 2, COL_MIN_PT), COL_MAX_PT);
  });
  const total = widths.reduce((a, b) => a + b, 0);
  if (total !== USABLE_W && total > 0) {
    const factor = USABLE_W / total;
    // Grow short tables to fill the page; shrink overflows proportionally.
    widths = factor < 1 ? widths.map((w) => w * factor) : widths.map((w) => Math.min(w * factor, COL_MAX_PT));
  }
  return { widths, rtlTable };
}

interface Slot {
  left: number;
  right: number;
}

function slotGeometry(widths: number[], rtlTable: boolean): { slots: Slot[]; slotOfLogical: number[] } {
  const n = widths.length;
  const slotOfLogical: number[] = new Array(n);
  for (let i = 0; i < n; i += 1) slotOfLogical[i] = rtlTable ? n - 1 - i : i;
  const slots: Slot[] = [];
  let x = MARGIN_X;
  for (let p = 0; p < n; p += 1) {
    const logical = slotOfLogical[p];
    slots.push({ left: x, right: x + widths[logical] });
    x += widths[logical];
  }
  return { slots, slotOfLogical };
}

// ── Row model shared by both entry points ──

interface RenderedRow {
  cells: CellLine[][]; // per logical column
  heightLines: number;
}

function renderRow(values: PdfRow, widths: number[], colLimit: number): RenderedRow {
  const cells: CellLine[][] = [];
  let heightLines = 1;
  for (let c = 0; c < colLimit; c += 1) {
    const maxUnits = ((widths[c] - CELL_PAD * 2) * 1000) / FS;
    const lines = wrapCell(values[c], maxUnits);
    cells.push(lines);
    if (lines.length > heightLines) heightLines = lines.length;
  }
  return { cells, heightLines };
}

// ── Content-stream emission ──

const fmt = (n: number): string => String(Math.round(n * 100) / 100);
const gid4 = (gid: number): string => gid.toString(16).padStart(4, '0');

function emitTextLine(ops: string[], glyphs: ShapedGlyph[], widthUnits: number, marks: boolean, boxLeft: number, boxRight: number, alignRight: boolean, baselineY: number, usedGids: Set<number>, fontSize = FS): void {
  if (glyphs.length === 0) return;
  const scale = fontSize / 1000; // IBM Plex Sans Arabic unitsPerEm is 1000
  const widthPt = widthUnits * scale;
  const startX = alignRight ? boxRight - widthPt : boxLeft;
  for (const g of glyphs) usedGids.add(g.gid);
  ops.push('BT');
  ops.push(`/RF ${fontSize} Tf`);
  if (!marks) {
    // Fast path: kerning deltas become TJ adjustments (n = hmtx width − layout advance).
    const arr: string[] = [];
    let hex = '';
    for (let i = 0; i < glyphs.length; i += 1) {
      const g = glyphs[i];
      hex += gid4(g.gid);
      const next = glyphs[i + 1];
      if (next) {
        const meta = glyphMeta.get(g.gid);
        const corr = Math.round((meta ? meta.width : g.advance) - g.advance);
        if (corr !== 0) {
          arr.push(`<${hex}>`);
          arr.push(String(corr));
          hex = '';
        }
      }
    }
    if (hex.length > 0) arr.push(`<${hex}>`);
    ops.push(`1 0 0 1 ${fmt(startX)} ${fmt(baselineY)} Tm [${arr.join(' ')}] TJ`);
  } else {
    // Mark-positioned glyphs: absolute placement per glyph.
    let pen = startX;
    for (const g of glyphs) {
      ops.push(`1 0 0 1 ${fmt(pen + g.xOffset * scale)} ${fmt(baselineY + g.yOffset * scale)} Tm <${gid4(g.gid)}> Tj`);
      pen += g.advance * scale;
    }
  }
  ops.push('ET');
}

function emitRowBlock(
  ops: string[],
  row: RenderedRow,
  slots: Slot[],
  slotOfLogical: number[],
  alignRight: boolean,
  topBaseline: number,
  usedGids: Set<number>,
): void {
  for (let c = 0; c < row.cells.length; c += 1) {
    const lines = row.cells[c];
    if (lines.length === 0) continue;
    const slot = slots[slotOfLogical[c]];
    const boxLeft = slot.left + CELL_PAD;
    const boxRight = slot.right - CELL_PAD;
    for (let k = 0; k < lines.length; k += 1) {
      const line = visualLine(lines[k].text);
      emitTextLine(ops, line.glyphs, line.widthUnits, line.marks, boxLeft, boxRight, alignRight, topBaseline - k * LINE_H, usedGids);
    }
  }
}

// ── Document assembly ──

async function* ensureAsyncRows(rows: AsyncIterable<PdfRow> | Iterable<PdfRow>): AsyncGenerator<PdfRow> {
  yield* rows;
}

async function buildDocument(headers: readonly string[], rows: AsyncIterable<PdfRow> | Iterable<PdfRow>, options: PdfDocumentOptions = {}): Promise<Buffer> {
  const sourceRows = ensureAsyncRows(rows);
  // Bounded sample for content-aware column sizing, then stream the rest.
  const sample: PdfRow[] = [];
  for (;;) {
    const next = await sourceRows.next();
    if (next.done) break;
    sample.push(next.value);
    if (sample.length >= COLUMN_SAMPLE_ROWS) break;
  }
  const { widths, rtlTable } = sizedColumnLayout(headers, sample);
  const colCount = headers.length;
  const headerRow = renderRow(headers, widths, colCount);
  const { slots, slotOfLogical } = slotGeometry(widths, rtlTable);
  const usedGids = new Set<number>();
  const alignRight = rtlTable;

  // Paginate: every page repeats the header row + rule.
  const pages: string[][] = [];
  let ops: string[] = [];
  let yCursor = TOP_Y;

  const startPage = (): void => {
    ops = [];
    yCursor = TOP_Y;
    const headerLines = options.headerLines ?? [];
    for (let i = 0; i < headerLines.length; i += 1) {
      const line = visualLine(headerLines[i]);
      const fontSize = i === 0 ? 13 : 8;
      emitTextLine(ops, line.glyphs, line.widthUnits, line.marks, MARGIN_X, PAGE_W - MARGIN_X, false, yCursor, usedGids, fontSize);
      yCursor -= i === 0 ? 18 : 11;
    }
    if (headerLines.length > 0) yCursor -= 2;
    emitRowBlock(ops, headerRow, slots, slotOfLogical, alignRight, yCursor, usedGids);
    yCursor -= (headerRow.heightLines - 1) * LINE_H;
    const ruleY = yCursor - HEADER_RULE_GAP;
    ops.push(`0.5 w ${MARGIN_X} ${fmt(ruleY)} m ${PAGE_W - MARGIN_X} ${fmt(ruleY)} l S`);
    yCursor = ruleY - ROW_FIRST_BASELINE_GAP;
  };

  const flushPage = (): void => {
    pages.push(ops.slice());
    ops = [];
  };

  startPage();
  const consumeRow = (values: PdfRow): void => {
    const rendered = renderRow(values, widths, colCount);
    const needed = rendered.heightLines * LINE_H + ROW_GAP;
    if (yCursor - BOTTOM_Y < needed + LINE_H) {
      flushPage();
      startPage();
    }
    emitRowBlock(ops, rendered, slots, slotOfLogical, alignRight, yCursor, usedGids);
    yCursor -= needed;
  };
  // The sample itself is real data — render it, then keep streaming the rest.
  for (const values of sample) consumeRow(values);
  for await (const values of sourceRows) consumeRow(values);
  flushPage();

  // Font program resources.
  const font = arabicFont();
  const gids = [...usedGids].sort((a, b) => a - b);
  const wEntries = gids.map((gid) => `${gid} [${glyphMeta.get(gid)?.width ?? 0}]`).join(' ');

  const toUnicodeBlocks: string[] = [];
  const mappedGids = gids.filter((gid) => (glyphMeta.get(gid)?.unicode.length ?? 0) > 0);
  for (let i = 0; i < mappedGids.length; i += 100) {
    const chunk = mappedGids.slice(i, i + 100);
    toUnicodeBlocks.push(
      `${chunk.length} beginbfchar\n${chunk.map((gid) => `<${gid4(gid)}> <${utf16beHex(glyphMeta.get(gid)?.unicode ?? [])}>`).join('\n')}\nendbfchar`,
    );
  }
  const toUnicode =
    '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n' +
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n' +
    '/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n' +
    `${toUnicodeBlocks.join('\n')}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;

  const ttfBytes = Buffer.from(FONT_BASE64, 'base64');
  const deflated = deflateSync(ttfBytes);

  const CATALOG_REF = 1;
  const PAGES_REF = 2;
  const TYPE0_REF = 3;
  const CID_REF = 4;
  const DESCRIPTOR_REF = 5;
  const TOUNICODE_REF = 6;
  const FONTFILE_REF = 7;

  const objects: string[] = [];
  const language = options.language ?? (rtlTable ? 'ar' : 'en');
  const direction = options.direction ?? (rtlTable ? 'R2L' : 'L2R');
  const INFO_REF = 8;
  const infoText = (options.metadata ?? []).join('\n');
  const infoValue = (value: string): string => value.replace(/[^\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  objects[CATALOG_REF] = `<< /Type /Catalog /Pages 2 0 R /Lang (${infoValue(language)}) /ViewerPreferences << /Direction /${direction} >> >>`;
  objects[TYPE0_REF] = `<< /Type /Font /Subtype /Type0 /BaseFont /IBMPlexSansArabic-Regular /Encoding /Identity-H /DescendantFonts [${CID_REF} 0 R] /ToUnicode ${TOUNICODE_REF} 0 R >>`;
  objects[CID_REF] = `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /IBMPlexSansArabic-Regular /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${DESCRIPTOR_REF} 0 R /DW 1000 /W [${wEntries}] /CIDToGIDMap /Identity >>`;
  objects[DESCRIPTOR_REF] = `<< /Type /FontDescriptor /FontName /IBMPlexSansArabic-Regular /Flags 4 /FontBBox [${font.bbox.minX} ${font.bbox.minY} ${font.bbox.maxX} ${font.bbox.maxY}] /ItalicAngle ${font.italicAngle} /Ascent ${font.ascent} /Descent ${font.descent} /CapHeight ${font.capHeight} /StemV 80 /FontFile2 ${FONTFILE_REF} 0 R >>`;
  objects[TOUNICODE_REF] = `<< /Length ${Buffer.byteLength(toUnicode)} >>\nstream\n${toUnicode}\nendstream`;
  objects[FONTFILE_REF] = `<< /Length ${deflated.length} /Filter /FlateDecode /Length1 ${ttfBytes.length} >>\nstream\n${deflated.toString('latin1')}\nendstream`;
  objects[INFO_REF] = `<< /Title (${infoValue(options.headerLines?.[0] ?? 'BRIGHTAI QC report')}) /Subject (${infoValue(infoText)}) >>`;

  let nextRef = INFO_REF + 1;
  const pageRefs: number[] = [];
  for (const content of pages) {
    const contentRef = nextRef;
    nextRef += 1;
    const pageRef = nextRef;
    nextRef += 1;
    pageRefs.push(pageRef);
    const stream = content.join('\n');
    objects[contentRef] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
    objects[pageRef] = `<< /Type /Page /Parent ${PAGES_REF} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /RF ${TYPE0_REF} 0 R >> >> /Contents ${contentRef} 0 R >>`;
  }
  objects[PAGES_REF] = `<< /Type /Pages /Kids [${pageRefs.map((r) => `${r} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;

  // latin1 keeps bytes 0-255 intact end-to-end, so the binary font stream survives.
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = Buffer.byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)
    .join('\n')}\ntrailer\n<< /Size ${objects.length} /Root ${CATALOG_REF} 0 R /Info ${INFO_REF} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

function utf16beHex(codePoints: number[]): string {
  let out = '';
  for (let cp of codePoints) {
    if (cp > 0xffff) {
      cp -= 0x10000;
      out += (0xd800 + (cp >> 10)).toString(16).padStart(4, '0');
      out += (0xdc00 + (cp & 0x3ff)).toString(16).padStart(4, '0');
    } else {
      out += cp.toString(16).padStart(4, '0');
    }
  }
  return out;
}

/** Small compatibility helper for unit callers. Production reports use the async iterator below. */
export function rowsToPdf(headers: readonly string[], rows: readonly PdfRow[], options?: PdfDocumentOptions): Promise<Buffer> {
  return buildDocument(headers, rows, options);
}

/**
 * Consumes report rows incrementally. Only one page of source rows is held at
 * a time; the document builder retains rendered page content streams, not the
 * full input dataset.
 */
export async function rowsToPdfStreaming(headers: readonly string[], rows: AsyncIterable<PdfRow>, options?: PdfDocumentOptions): Promise<Buffer> {
  return buildDocument(headers, rows, options);
}
