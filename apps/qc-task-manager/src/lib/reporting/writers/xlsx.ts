import ExcelJS from 'exceljs';

export async function writeRowsToXlsx(
  filename: string,
  headers: readonly string[],
  rows: AsyncIterable<readonly (string | number | null | undefined)[]>,
): Promise<void> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles: true });
  const sheet = workbook.addWorksheet('Report');
  sheet.addRow([...headers]).commit();
  for await (const row of rows) sheet.addRow([...row]).commit();
  await workbook.commit();
}
