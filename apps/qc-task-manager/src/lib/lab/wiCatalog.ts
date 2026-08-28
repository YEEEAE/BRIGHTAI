import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

export const WI_SOURCE_REGISTER_CODE = 'F-4-2-1-2';
export const WI_SOURCE_CLASS = 'Class I';
export const WI_CATALOG_READINESS_TODO = 'WI register incomplete until controlled source pages 2/3 and 3/3 are supplied.';

export interface WICatalogRow {
  code: string;
  title: string;
  source_page: number;
  source_row_no: number;
  source_revision: number;
  source_date: string;
}

// Transcribed from page 1/3 only. Spelling is intentionally source-exact.
export const WI_CATALOG_ROWS: readonly WICatalogRow[] = ([
  ['WI-8-2-2-M01', 'Production Procedure for Saturation Probe', 2, '2025-09-30'],
  ['WI-8-2-2-M01-1', 'Inspection Procedure for Saturation Probe', 0, '2025-09-30'],
  ['WI-8-2-2-M04', 'Production Procedure for Eye Sheild', 1, '2023-09-13'],
  ['WI-8-2-2-M04-1', 'Inspection Procedure for Eye Sheild', 1, '2023-09-13'],
  ['WI-8-2-2-M05', 'Production Procedure for Face Sheild', 0, '2023-09-15'],
  ['WI-8-2-2-M05-1', 'Inspection Procedure for Face Sheild', 0, '2023-09-15'],
  ['WI-8-2-2-M06', 'Production Procedure for Suspensory Bandage', 2, '2025-10-14'],
  ['WI-8-2-2-M06-1', 'Inspection Procedure for Suspensory Bandage', 0, '2025-10-14'],
  ['WI-8-2-2-M07', 'Production Procedure for Stethoscope', 2, '2022-12-11'],
  ['WI-8-2-2-M07-1', 'Inspection Procedure for Stethoscope', 0, '2022-12-11'],
  ['WI-8-2-2-M10', 'Production Procedure for Razor Blade', 2, '2025-10-19'],
  ['WI-8-2-2-M10-1', 'Inspection Procedure for Razor Blade', 0, '2025-10-19'],
  ['WI-8-2-2-M12', 'Production Procedure for Restraints', 0, '2024-12-02'],
  ['WI-8-2-2-M12-1', 'Inspection Procedure for Restraints', 0, '2024-12-02'],
  ['WI-8-2-2-M13', 'Production & Test Procedure for Nasopharyngeal Airway', 2, '2023-04-01'],
  ['WI-8-2-2-M14', 'Production & Test Procedure for Blood Pressure Cuff', 1, '2023-05-20'],
  ['WI-8-2-2-M15', 'Production & Test Procedure for Breathing Exerciser', 0, '2023-05-20'],
  ['WI-8-2-2-M18', 'Production Procedure for Umbilical Ligature', 0, '2025-09-29'],
  ['WI-8-2-2-M18-1', 'Inspection Procedure for Umbilical Ligature', 0, '2025-09-29'],
  ['WI-8-2-2-M20', 'Production Procedure for Goggles', 0, '2025-02-25'],
  ['WI-8-2-2-M20-1', 'Inspection Procedure for Goggles', 0, '2025-02-25'],
  ['WI-8-2-2-M21', 'Production Procedure for Temperature Prob', 0, '2025-02-18'],
  ['WI-8-2-2-M21-1', 'Inspection Procedure for Temperature Prob', 0, '2025-02-18'],
  ['WI-8-2-2-M25', 'Production Procedure for Biohazard Specimen Transport Bag', 0, '2025-03-16'],
  ['WI-8-2-2-M25-1', 'Inspection Procedure for Biohazard Specimen Transport Bag', 0, '2025-03-16'],
  ['WI-8-2-2-M28', 'Production Procedure for Non Sterile Syringe Bulb', 0, '2023-05-20'],
  ['WI-8-2-2-M28-1', 'Inspection Procedure for Non Sterile Syringe Bulb', 0, '2023-11-28'],
  ['WI-8-2-2-M32', 'Production Procedure for Little Sucker', 0, '2025-10-18'],
  ['WI-8-2-2-M32-1', 'Inspection Procedure for Little Sucker', 0, '2025-10-18'],
  ['WI-8-2-2-M37', 'Production Procedure for IV Arm Board', 0, '2024-01-27'],
  ['WI-8-2-2-M37-1', 'Inspection Procedure for IV Arm Board', 0, '2024-01-27'],
  ['WI-8-2-2-M38', 'Production & Test Procedure for Positioning Aid', 0, '2023-05-20'],
  ['WI-8-2-2-M39', 'Production Procedure for Mannual Resuscitator', 0, '2023-11-23'],
 ] as const).map(([code, title, source_revision, source_date], index) => ({
  code,
  title,
  source_page: 1,
  source_row_no: index + 1,
  source_revision,
  source_date,
}));

const WI_CATALOG_KNOWN_SOURCE_PAGES = new Set(WI_CATALOG_ROWS.map((row) => row.source_page));

/**
 * Reject incomplete or invented controlled-source identities before any SQL
 * runs. New source pages become eligible only by being added as supplied rows
 * to WI_CATALOG_ROWS with their exact page and row provenance.
 */
export function validateWICatalogRows(rows: readonly WICatalogRow[]): { knownPages: number[] } {
  const codes = new Set<string>();
  const sourceLocations = new Set<string>();

  for (const row of rows) {
    if (!row.code.trim()) throw new Error('WI catalog row has blank code');
    if (!row.title.trim()) throw new Error(`WI catalog row ${row.code} has blank title`);
    if (!WI_CATALOG_KNOWN_SOURCE_PAGES.has(row.source_page)) {
      throw new Error(`WI catalog row ${row.code} references unknown controlled source page ${row.source_page}`);
    }
    if (!Number.isInteger(row.source_row_no) || row.source_row_no < 1) {
      throw new Error(`WI catalog row ${row.code} has invalid source row number`);
    }
    if (!Number.isInteger(row.source_revision) || row.source_revision < 0) {
      throw new Error(`WI catalog row ${row.code} has invalid source revision`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.source_date)) {
      throw new Error(`WI catalog row ${row.code} has invalid source date`);
    }

    const code = row.code.toLocaleUpperCase('en-US');
    if (codes.has(code)) throw new Error(`WI catalog has duplicate code ${row.code}`);
    codes.add(code);

    const sourceLocation = `${row.source_page}:${row.source_row_no}`;
    if (sourceLocations.has(sourceLocation)) throw new Error(`WI catalog has duplicate source location ${sourceLocation}`);
    sourceLocations.add(sourceLocation);
  }

  return { knownPages: [...WI_CATALOG_KNOWN_SOURCE_PAGES].sort((a, b) => a - b) };
}

export interface WICatalogImportReport {
  imported: number;
  collisions: number;
  collisionCodes: string[];
}

/** Import catalog identities only. Existing code rows are never overwritten. */
export function importWICatalog(db: BetterSqliteDatabase): WICatalogImportReport {
  validateWICatalogRows(WI_CATALOG_ROWS);
  const report: WICatalogImportReport = { imported: 0, collisions: 0, collisionCodes: [] };
  const insert = db.prepare(`
    INSERT INTO lab_documents
      (code, title, type, owner_id, reviewer_id, approver_id, current_version_id, status,
       creation_origin, source_page, source_row_no, imported_at, created_by,
       source_revision, source_date, source_register_code, source_class)
    VALUES (?, ?, 'WI', NULL, NULL, NULL, NULL, 'DRAFT', 'SOURCE_IMPORT', ?, ?, datetime('now'), NULL, ?, ?, ?, ?)
  `);
  const existing = db.prepare('SELECT id FROM lab_documents WHERE code = ? COLLATE NOCASE').pluck();

  const run = db.transaction(() => {
    for (const row of WI_CATALOG_ROWS) {
      const id = existing.get(row.code) as number | undefined;
      if (id) {
        report.collisions += 1;
        report.collisionCodes.push(row.code);
        continue;
      }
      insert.run(row.code, row.title, row.source_page, row.source_row_no, row.source_revision, row.source_date, WI_SOURCE_REGISTER_CODE, WI_SOURCE_CLASS);
      report.imported += 1;
    }
  });
  run();
  if (report.collisions > 0) console.info(`[lab] WI catalog import collisions: ${report.collisionCodes.join(', ')}`);
  return report;
}
