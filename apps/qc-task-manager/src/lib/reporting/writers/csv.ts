/** Neutralize spreadsheet formula injection (OWASP): a cell that begins with
 *  `=`, `+`, `-`, `@`, tab or CR is prefixed with a single quote so Excel,
 *  Google Sheets and LibreOffice treat it as text, not a formula. */
export function sanitizeCsvFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = sanitizeCsvFormula(String(value));
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function rowsToCsv(headers: readonly string[], rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}