import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

export const WI_SOURCE_REGISTER_CODE = 'F-4-2-1-2';
export const WI_SOURCE_CLASS = 'Class I';

export interface WICatalogRow {
  code: string;
  title: string;
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
] as const).map(([code, title, source_revision, source_date]) => ({
  code,
  title,
  source_revision,
  source_date,
}));

export interface WICatalogImportReport {
  imported: number;
  collisions: number;
  collisionCodes: string[];
}

/** Import catalog identities only. Existing code rows are never overwritten. */
export function importWICatalog(db: BetterSqliteDatabase): WICatalogImportReport {
  const report: WICatalogImportReport = { imported: 0, collisions: 0, collisionCodes: [] };
  const firstUser = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get() as { id: number } | undefined;
  if (!firstUser) throw new Error('Cannot import WI catalog before a legitimate user exists.');

  const insert = db.prepare(`
    INSERT INTO lab_documents
      (code, title, type, owner_id, reviewer_id, approver_id, current_version_id, status,
       created_by, source_revision, source_date, source_register_code, source_class)
    VALUES (?, ?, 'WI', NULL, NULL, NULL, NULL, 'DRAFT', ?, ?, ?, ?, ?)
  `);
  const existing = db.prepare('SELECT id FROM lab_documents WHERE code = ? COLLATE NOCASE').pluck();
  const fillMetadata = db.prepare(`
    UPDATE lab_documents SET
      source_revision = COALESCE(source_revision, ?),
      source_date = COALESCE(source_date, ?),
      source_register_code = COALESCE(source_register_code, ?),
      source_class = COALESCE(source_class, ?)
    WHERE id = ?
  `);

  const run = db.transaction(() => {
    for (const row of WI_CATALOG_ROWS) {
      const id = existing.get(row.code) as number | undefined;
      if (id) {
        report.collisions += 1;
        report.collisionCodes.push(row.code);
        fillMetadata.run(row.source_revision, row.source_date, WI_SOURCE_REGISTER_CODE, WI_SOURCE_CLASS, id);
        continue;
      }
      insert.run(row.code, row.title, firstUser.id, row.source_revision, row.source_date, WI_SOURCE_REGISTER_CODE, WI_SOURCE_CLASS);
      report.imported += 1;
    }
  });
  run();
  if (report.collisions > 0) console.info(`[lab] WI catalog import collisions: ${report.collisionCodes.join(', ')}`);
  return report;
}
