/**
 * src/scripts/kernel-evidence-pdf-lite.js — BAI-PERF-02 (2026-08-08)
 *
 * Zero-dependency evidence PDF generator. Replaces the old
 * kernel-evidence-pdf.js which pulled pdfjs-dist (~125KB gz) + pdf-lib
 * (~175KB gz) just to render a preview + generate a demo PDF for the
 * /kernel/evidence/ page. Those two chunks alone exceeded the 60KB JS
 * budget by 5.5x.
 *
 * This module ships the SAME user-visible capability (download a real,
 * valid PDF of the evidence file) with zero npm runtime deps. It builds
 * a minimal but spec-compliant PDF 1.4 document from the evidence
 * metadata using only the standard 14 font (Courier) — no fonts
 * embedded, no canvas, no worker.
 *
 * What this file does NOT do (deliberately):
 *   - It does not RENDER a PDF on a <canvas>. The preview modal now
 *     shows the evidence data as styled HTML (see evidence.astro). A
 *     canvas renderer requires pdfjs-dist (~125KB), which is the exact
 *     weight we are removing.
 *   - It does not generate Arabic-shaped glyphs in the PDF. The
 *     standard-14 Courier font is Latin-1 only. Arabic field VALUES
 *     are transliterated to '?' in the PDF text layer (same trade-off
 *     as certificate-verifier.ts buildMinimalPdf). The full Arabic
 *     content remains available via the JSON download + the HTML
 *     preview + the live Kernel API in production.
 *
 * CSP: this module is bundled by Astro (script-src 'self'). No worker,
 * no blob, no external request. The returned Blob is handed to the
 * existing downloadFile() helper in evidence.astro's inline script.
 *
 * Determinism: no Math.random / Date.now in the PDF body — the bytes
 * are derived purely from the passed evidence data (same contract as
 * the old pdf-lib implementation).
 */

/**
 * Escape a string for the PDF text-show operator (Tj). Non-Latin-1
 * characters are replaced with '?' because the standard-14 Courier
 * font has no glyph for them.
 *
 * @param {string} s - Raw value from evidence metadata.
 * @returns {string} PDF-safe string.
 */
function escapePdf(s) {
  return String(s == null ? '' : s)
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Build a minimal but valid PDF 1.4 document (single page) from an
 * array of pre-formatted text lines. Uses Courier (standard 14 font)
 * so no font program needs to be embedded.
 *
 * Structure follows PDF 1.4 spec: Catalog → Pages → Page → Contents,
 * with a correct xref table + trailer + startxref. Any conforming PDF
 * reader (Chrome, Acrobat, Preview, pdf-lib's loader) accepts it.
 *
 * @param {string[]} lines - Pre-formatted lines (already shortened to fit).
 * @returns {Blob} PDF file, ready for download.
 */
function buildMinimalPdf(lines) {
  const content = ['BT', '/F1 10 Tf', '12 TL', '48 800 Td'];
  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0) content.push('T*');
    content.push(`(${escapePdf(lines[i])}) Tj`);
  }
  content.push('ET');
  const stream = content.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Format the evidence metadata into the text lines that make up the
 * PDF body. Lines are kept under ~78 chars (Courier 10 at A4 width
 * leaves room for ~80 monospace chars inside the margins).
 *
 * @param {object} data - Evidence metadata (same shape the preview modal uses).
 * @returns {string[]} Lines for buildMinimalPdf.
 */
function evidenceToLines(data) {
  const sep = '='.repeat(54);
  return [
    'BrightAI Kernel — Evidence File',
    sep,
    '',
    `Evidence ID    : ${data.id || '—'}`,
    `Title          : ${data.title || '—'}`,
    `Query          : ${data.query || '—'}`,
    `Trace ID       : ${data.trace || '—'}`,
    `Hash (SHA-256) : ${data.hash || '—'}`,
    `Risk Score     : ${data.risk != null ? data.risk + ' / 100' : '—'}`,
    `Status         : ${data.status || '—'}`,
    `Sector         : ${data.sector || '—'}`,
    `Compliance Pack: ${data.pack || '—'}`,
    `Retention      : ${data.retention || '—'}`,
    `Certificate    : ${data.cert || '—'}`,
    `Size           : ${data.size || '—'}`,
    `Signed         : ${data.signed || '—'}`,
    '',
    sep,
    'Demo file. In production this is generated server-side from',
    'the Kernel API and signed cryptographically (Ed25519 / SHA-256).',
    '',
    'Verification: /api/kernel/certificates/verify',
  ];
}

/**
 * Build + return a downloadable evidence PDF Blob. Caller handles the
 * actual <a download> trigger (keeps the blob-URL lifecycle in the
 * inline script that already manages downloadFile()).
 *
 * @param {object} data - Evidence metadata.
 * @returns {Blob} PDF file ready for download.
 */
export function buildEvidencePdfBlob(data) {
  return buildMinimalPdf(evidenceToLines(data));
}
