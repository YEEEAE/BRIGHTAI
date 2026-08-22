// QR codes for stable laboratory identifiers (PROMPT 48).
//
// Encoder: `qrcode-generator` (MIT, pure JS, zero dependencies, ~10KB min)
// — the smallest battle-tested encoder available; no existing in-repo
// alternative exists (first QR use in the project). Output is an inline SVG
// string built from the module matrix using presentation attributes only —
// CSP-safe (style-src 'self' forbids inline styles, so no style attribute is
// ever emitted) and self-contained (no external service, no canvas).

import qrcode from 'qrcode-generator';

/** Payload rendered into every lab QR: identifier + resolvable absolute URL. */
export function labQrPayload(identifier: string, url: string): string {
  return `${identifier}\n${url}`;
}

/**
 * Page anchor for a sample row: `/lab/tests/[id]#sample-S03`.
 * Derived from the identifier suffix (-S03) when present, otherwise from the
 * stored sample_no (padded to two digits to match the identifier format).
 */
export function labSampleAnchor(sampleIdentifier: string | null | undefined, sampleNo: number): string {
  const match = sampleIdentifier?.match(/-S(\d+)$/);
  const n = match ? Number(match[1]) : sampleNo;
  return `sample-S${String(n).padStart(2, '0')}`;
}

/**
 * The resolvable origin for QR URLs. Deployment proxy override via
 * QC_SITE_ORIGIN; otherwise the request's own origin (already how every
 * generated link on the page resolves).
 */
export function labSiteOrigin(requestOrigin: string): string {
  const override = import.meta.env.QC_SITE_ORIGIN;
  const raw = typeof override === 'string' && override.trim() !== '' ? override.trim() : requestOrigin;
  return raw.replace(/\/+$/, '');
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
}

/**
 * Inline, CSP-safe SVG for a QR payload. Module matrix is drawn as a single
 * <path> (one subpath per dark module) with a quiet-zone border — no inline
 * styles, no external references. Size via CSS on the wrapper.
 */
export function labQrSvg(payload: string, label: string): string {
  const qr = qrcode(0, 'M'); // auto version, medium error correction
  qr.addData(payload, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 4; // modules of quiet zone (spec minimum)
  const size = count + quiet * 2;
  let d = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        d += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${escapeXml(label)}">` +
    `<title>${escapeXml(label)}</title>` +
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<path d="${d}" fill="#000000"/>` +
    `</svg>`
  );
}
