// Arabic/RTL correctness suite for the reporting PDF writer (PROMPT 50).
//
// Generates an Arabic-content PDF through the REAL pipeline — seeded temp DB →
// readLabReportRows('lab-equipment-register') → rowsToPdfStreaming — then:
//   1. Structural checks (Identity-H, FontFile2, ToUnicode, W array).
//   2. Decodes the drawn glyph sequences back through the embedded ToUnicode
//      CMap and asserts the VISUAL order (drawn sequence = reversed logical
//      string for RTL cells, because PDF draws glyphs left-to-right).
//   3. Asserts data columns sit under their own headers.
//   4. Writer-level RTL table mirroring: Arabic headers flip the column order
//      (first logical column rightmost) while data stays under its header;
//      Latin-header tables keep the historical LTR layout.
//   5. Guards that CSV/XLSX writers are byte-format unchanged.
// Visual verification command (macOS) recorded in the ledger:
//   node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-report-pdf-arabic.mjs --artifact /tmp/arabic-pdf-report.pdf
//   qlmanage -t -s 2200 -o /tmp /tmp/arabic-pdf-report.pdf && open /tmp/arabic-pdf-report.pdf.png

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-pdf-arabic-'));
const dbPath = join(tempDir, 'pdf-arabic.db');
const artifactPath = process.argv.includes('--artifact')
  ? resolve(appDir, process.argv[process.argv.indexOf('--artifact') + 1])
  : join(tempDir, 'lab-equipment-register.pdf');

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { passed += 1; console.log(`  ✅ ${label}`); }
  else { failed += 1; failures.push(label); console.log(`  ❌ ${label}`); }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}
/** Reversed logical string = expected DECODED draw order for RTL text. */
const rev = (s) => [...s].reverse().join('');

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });

  const { getDb } = await import('../src/lib/db.ts');
  const db = getDb();

  // ── Seed Arabic-content fixtures (verbatim user-entered fields) ──
  const seed = db.prepare(
    `INSERT INTO lab_equipment (name, code, location, status_raw, calibration_status_raw, serial_number, notes, is_archived, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)`,
  );
  const fixtures = [
    { name: 'جهاز قياس الضغط', code: 'AR-PDF-01', location: 'مختبر الرياض', status_raw: 'تحت الصيانة / NEW', cal: 'yes', serial: 'SN-001' },
    { name: 'مقياس بلا عيب', code: 'AR-PDF-02', location: 'الرياض', status_raw: 'مستخدم', cal: 'no', serial: 'SN-002' },
    { name: 'ميزان معايرًا للمختبر', code: 'AR-PDF-03', location: 'جدة', status_raw: 'غير مستخدم', cal: 'yes', serial: null },
  ];
  for (const f of fixtures) seed.run(f.name, f.code, f.location, f.status_raw, f.cal, f.serial, '—');

  // ── Generate through the real pipeline ──
  const { readLabReportRows, toLabReportFilters } = await import('../src/lib/lab/labReports.ts');
  const { emptyReportFilters } = await import('../src/lib/reporting/filters.ts');
  const { REPORT_CATALOG } = await import('../src/lib/reporting/catalog.ts');
  const { rowsToPdfStreaming } = await import('../src/lib/reporting/writers/pdf.ts');

  const reportType = 'lab-equipment-register';
  const headers = REPORT_CATALOG[reportType].headers;
  const filters = toLabReportFilters(emptyReportFilters);
  async function* source() {
    yield* readLabReportRows(reportType, 'RPT-PDF-AR-001', filters);
  }
  const pdf = await rowsToPdfStreaming(headers, source());
  writeFileSync(artifactPath, pdf);
  console.log(`\n■ Artifact: ${artifactPath} (${pdf.length} bytes)`);

  // ── 1. Structure ──
  console.log('\n■ PDF structure');
  const latin = pdf.toString('latin1');
  ok(latin.startsWith('%PDF-1.4'), 'header %PDF-1.4');
  ok(latin.trimEnd().endsWith('%%EOF'), 'EOF marker');
  ok(latin.includes('/Subtype /Type0'), 'Type0 composite font');
  ok(latin.includes('/Encoding /Identity-H'), 'Identity-H encoding (glyph-ID codes)');
  ok(latin.includes('/Subtype /CIDFontType2'), 'CIDFontType2 descendant');
  ok(latin.includes('/FontFile2'), 'embedded font program (FontFile2)');
  ok(latin.includes('IBMPlexSansArabic-Regular'), 'IBM Plex Sans Arabic embedded (OFL)');
  ok(/beginbfchar/.test(latin), 'ToUnicode CMap present (copy/paste searchable)');
  ok(/\/W \[\d+ \[\d+\]/.test(latin), 'per-glyph /W widths array non-empty');
  ok((latin.match(/\/Type \/Page[^s]/g) ?? []).length >= 1, 'at least one page');

  // ── Decoder: objects → ToUnicode map → drawn lines (x, y, chars) ──
  function decodeDrawnLines(pdfBuffer) {
    const s = pdfBuffer.toString('latin1');
    const objects = new Map();
    for (const m of s.matchAll(/(\d+) 0 obj\n([\s\S]*?)\nendobj/g)) objects.set(Number(m[1]), m[2]);
    const toUni = new Map();
    for (const body of objects.values()) {
      if (!body || !body.includes('beginbfchar')) continue;
      for (const mm of body.matchAll(/<([0-9a-f]{4})> <([0-9a-f]+)>/g)) {
        const hex = mm[2];
        let str = '';
        for (let i = 0; i < hex.length; i += 4) str += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
        toUni.set(parseInt(mm[1], 16), str);
      }
    }
    const lines = [];
    for (const body of objects.values()) {
      if (!body || !body.includes('/RF')) continue;
      const sm = body.match(/stream\n([\s\S]*?)\nendstream/);
      if (!sm) continue;
      const content = sm[1];
      const re = /BT\n\/RF \d+ Tf\n((?:1 0 0 1 [\d.-]+ [\d.-]+ Tm \[[^\]]*\] TJ\n)+|(?:(?:1 0 0 1 [\d.-]+ [\d.-]+ Tm <[0-9a-f]+> Tj\n)+))ET/g;
      for (const lm of content.matchAll(re)) {
        const block = lm[1];
        const pos = block.match(/1 0 0 1 ([\d.-]+) ([\d.-]+) Tm/);
        let chars = '';
        for (const hex of block.matchAll(/<([0-9a-f]+)>/g)) {
          const h = hex[1];
          for (let i = 0; i < h.length; i += 4) chars += toUni.get(parseInt(h.slice(i, i + 4), 16)) ?? '\uFFFD';
        }
        lines.push({ x: parseFloat(pos[1]), y: parseFloat(pos[2]), chars });
      }
    }
    return { lines: lines.sort((a, b) => b.y - a.y || a.x - b.x), toUni };
  }

  // ── 2. Shaping + bidi visual order through the real pipeline ──
  console.log('\n■ Arabic shaping + RTL visual order (decoded draw order)');
  const { lines, toUni } = decodeDrawnLines(pdf);
  if (process.env.QC_PDF_DEBUG === '1') console.log(lines.map((line) => JSON.stringify(line)).join('\n'));
  const byChars = (chars) => lines.find((l) => l.chars === chars);
  ok(lines.some((l) => l.chars === 'Name'), 'Latin header drawn verbatim');
  ok(Boolean(byChars(rev('جهاز قياس الضغط'))), `equipment name drawn visually ordered (${rev('جهاز قياس الضغط')})`);
  ok(Boolean(byChars(rev('مختبر الرياض'))), `Arabic location drawn visually ordered`);
  ok(Boolean(byChars(rev('ميزان معايرًا للمختبر'))), 'diacritic cell drawn via mark positioning path');
  ok([...toUni.values()].includes('لا'), 'lam-alef ligature mapped in ToUnicode (بلا → ligature glyph)');
  // statusLabels maps status_raw to English display labels — pipeline contract unchanged.
  ok(lines.some((l) => l.chars === 'Under Maintenance / New'), 'status display label intact (English mapping preserved)');
  ok(!byChars(rev('تحت الصيانة / ') + 'WEN'), 'raw status_raw is not exported (display mapping respected)');

  // ── 3. Data columns aligned under their own headers (LTR catalog) ──
  console.log('\n■ Column alignment (Latin-header catalog keeps LTR order)');
  const nameHeader = lines.find((l) => l.chars === 'Name');
  const nameData = byChars(rev('جهاز قياس الضغط'));
  ok(Math.abs(nameHeader.x - nameData.x) < 0.5, `data sits under its header (x ${nameData.x.toFixed(1)} ≈ ${nameHeader.x.toFixed(1)})`);
  const idHeader = lines.find((l) => l.chars === 'Report ID');
  const idData = lines.find((l) => l.chars === 'RPT-PDF-AR-001');
  ok(idHeader.x < nameHeader.x, 'LTR catalog keeps historical column order');
  ok(Boolean(idHeader && idData), 'Report ID header and generated report ID both decode');
  if (idHeader && idData) ok(Math.abs(idHeader.x - idData.x) < 0.5, 'Report ID data under Report ID header');
  const locHeader = lines.find((l) => l.chars === 'Location');
  const locData = byChars(rev('مختبر الرياض'));
  ok(Boolean(locHeader && locData), 'Location header and Arabic location data both decode');
  if (locHeader && locData) ok(Math.abs(locHeader.x - locData.x) < 0.5, 'Arabic location data under Location header');

  // ── 4. Writer-level RTL table mirroring (Arabic headers) ──
  console.log('\n■ RTL column mirroring (Arabic-header tables)');
  const rtlPdf = await (
    await import('../src/lib/reporting/writers/pdf.ts')
  ).rowsToPdf(['العمود الأول', 'العمود الثاني'], [['قيمة أولى', 'قيمة ثانية']]);
  writeFileSync(join(tempDir, 'rtl-table.pdf'), rtlPdf);
  const rtl = decodeDrawnLines(rtlPdf);
  const h1 = rtl.lines.find((l) => l.chars === rev('العمود الأول'));
  const h2 = rtl.lines.find((l) => l.chars === rev('العمود الثاني'));
  const d1 = rtl.lines.find((l) => l.chars === rev('قيمة أولى'));
  const d2 = rtl.lines.find((l) => l.chars === rev('قيمة ثانية'));
  ok(Boolean(h1 && h2 && d1 && d2), 'all mirrored cells decode');
  if (h1 && h2 && d1 && d2) {
    ok(h1.x > h2.x, `first logical header rightmost (${h1.x.toFixed(1)} > ${h2.x.toFixed(1)})`);
    ok(d1.x > d2.x, `matching data stays under mirrored headers (${d1.x.toFixed(1)} > ${d2.x.toFixed(1)})`);
    ok(Math.abs(h1.x - d1.x) < 0.5 && Math.abs(h2.x - d2.x) < 0.5, 'each value aligned under its own Arabic header');
  }
  const midline = (MARGIN_X = 36, USABLE = 595 - 72) => MARGIN_X + USABLE / 2;
  if (d1 && d2) ok(d1.x > midline() && d2.x < midline(), 'mirrored halves split at page center');

  // LTR control: Latin headers must stay in logical order.
  const ltrPdf = await (await import('../src/lib/reporting/writers/pdf.ts')).rowsToPdf(['Col A', 'Col B'], [['a1', 'b1']]);
  const ltr = decodeDrawnLines(ltrPdf);
  const la = ltr.lines.find((l) => l.chars === 'Col A');
  const lb = ltr.lines.find((l) => l.chars === 'Col B');
  ok(la.x < lb.x, 'Latin headers keep historical LTR order (control)');

  // ── 5. CSV/XLSX outputs unchanged ──
  console.log('\n■ CSV/XLSX writers untouched');
  const { rowsToCsv, csvCell } = await import('../src/lib/reporting/writers/csv.ts');
  eq(
    rowsToCsv(['A', 'B'], [['x,y', '"q"']]),
    '\uFEFFA,B\r\n"x,y","""q"""\r\n',
    'rowsToCsv format identical (BOM + CRLF + RFC quoting)',
  );
  eq(csvCell('=SUM(A1)'), "'=SUM(A1)", 'CSV formula-injection guard still applied');
  const { writeRowsToXlsx } = await import('../src/lib/reporting/writers/xlsx.ts');
  const xlsxPath = join(tempDir, 'sanity.xlsx');
  await writeRowsToXlsx(xlsxPath, ['H1'], [['v1']]);
  const xlsxB = readFileSync(xlsxPath);
  ok(xlsxB.length > 0 && xlsxB[0] === 0x50 && xlsxB[1] === 0x4b, 'xlsx writer still emits a valid zip container');

  // ── 6. Pagination keeps header repeat without overlap ──
  console.log('\n■ Pagination');
  for (let i = 0; i < 60; i += 1) {
    seed.run(`جهاز إضافي رقم ${i + 1}`, `AR-PDF-E${String(i).padStart(3, '0')}`, 'مختبر', 'مستخدم', 'yes', null, '—');
  }
  async function* bigSource() {
    yield* readLabReportRows(reportType, 'RPT-PDF-AR-002', filters);
  }
  const bigPdf = await rowsToPdfStreaming(headers, bigSource());
  const bigPages = (bigPdf.toString('latin1').match(/\/Type \/Page[^s]/g) ?? []).length;
  ok(bigPages >= 2, `multi-page report generated (${bigPages} pages)`);
  const bigDecoded = decodeDrawnLines(bigPdf);
  const headerRepeats = bigDecoded.lines.filter((l) => l.chars === 'Equipment Name').length;
  ok(headerRepeats === bigPages, `header row repeated on every page (${headerRepeats}/${bigPages})`);

  console.log(`\n${passed} passed, ${failed} failed${failures.length ? ': ' + failures.join(' | ') : ''}`);
  if (failed > 0) process.exitCode = 1;
} finally {
  if (process.argv.includes('--keep-artifact')) {
    console.log(`artifact kept: ${artifactPath}`);
  } else if (!process.argv.includes('--artifact')) {
    try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}
