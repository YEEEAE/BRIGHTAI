function pdfText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

type PdfRow = readonly (string | number | null | undefined)[];

function buildPdf(pages: readonly (readonly string[])[]): Buffer {
  const objects: string[] = [];
  const pageRefs: number[] = [];
  const catalogRef = 1;
  const pagesRef = 2;
  objects[catalogRef] = '<< /Type /Catalog /Pages 2 0 R >>';
  let nextRef = 4;
  for (const page of pages) {
    const commands = ['BT', '/F1 8 Tf', '36 806 Td', ...page.flatMap((line, index) => [`(${pdfText(line.slice(0, 150))}) Tj`, index === page.length - 1 ? '' : '0 -18 Td']).filter(Boolean), 'ET'].join('\n');
    const contentRef = nextRef++;
    const pageRef = nextRef++;
    pageRefs.push(pageRef);
    objects[contentRef] = `<< /Length ${Buffer.byteLength(commands)} >>\nstream\n${commands}\nendstream`;
    objects[pageRef] = `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${nextRef} 0 R >> >> /Contents ${contentRef} 0 R >>`;
  }
  const fontRef = nextRef++;
  objects[fontRef] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';
  objects[pagesRef] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = Buffer.byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length} /Root ${catalogRef} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

/** Small compatibility helper for unit callers. Production reports use the async iterator below. */
export function rowsToPdf(headers: readonly string[], rows: readonly PdfRow[]): Buffer {
  const lines = [headers.join(' | '), ...rows.map((row) => row.map((value) => value == null ? '' : String(value)).join(' | '))];
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += 42) pages.push(lines.slice(i, i + 42));
  return buildPdf(pages);
}

/**
 * Consumes report rows incrementally. Only one page of source rows is held at
 * a time; the PDF object builder retains rendered page objects, not the full
 * input dataset.
 */
export async function rowsToPdfStreaming(headers: readonly string[], rows: AsyncIterable<PdfRow>): Promise<Buffer> {
  const pages: string[][] = [];
  let page = [headers.join(' | ')];
  for await (const row of rows) {
    page.push(row.map((value) => value == null ? '' : String(value)).join(' | '));
    if (page.length === 42) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length > 0 || pages.length === 0) pages.push(page);
  return buildPdf(pages);
}
