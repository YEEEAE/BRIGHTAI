// Laboratory equipment registry seed (PROMPT 11, additions A2).
//
// Seeds the canonical 24-device registry VERBATIM: names, codes, locations,
// status (mixed Arabic/English compound text), calibration flag, serial
// numbers and notes are stored exactly as provided by the company. Nothing is
// translated or normalized on write — display mapping lives in
// ./equipmentStatus.ts and is read-time only.
//
// Idempotency contract (A2):
//   - match on equipment_code (UNIQUE) via INSERT OR IGNORE;
//   - re-running never duplicates rows;
//   - user edits made after seeding are NEVER overwritten.
//
// Gated by QC_SEED_LAB_EQUIPMENT !== '0' (default ON). Existing unit suites
// that assume an empty equipment table set QC_SEED_LAB_EQUIPMENT=0.

import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

export interface LabEquipmentSeedRow {
  name: string;
  code: string;
  location: string;
  status_raw: string;
  calibration_status_raw: 'yes' | 'no';
  serial_number: string;
  notes: string;
}

/**
 * Canonical equipment registry (additions A2). Rows are stored exactly as
 * provided; the separator `|` is NOT present in the data, and values such as
 * "-", "1-800-5556-3484" and "BSS-250N, 250N" are meaningful business data.
 */
export const EQUIPMENT_SEED_ROWS: readonly LabEquipmentSeedRow[] = [
  { name: 'Breathing Filter Pressure', code: 'NOC-05', location: 'LABORATORY', status_raw: 'تحت الصيانة / NEW', calibration_status_raw: 'yes', serial_number: '251206666', notes: 'تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات' },
  { name: 'Syringe Positive Pressure', code: 'ZTY-01', location: 'LABORATORY', status_raw: 'تحت الصيانة / NEW', calibration_status_raw: 'yes', serial_number: '251206010', notes: 'تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات' },
  { name: 'Breathing Tube Leakage', code: 'HRT-02', location: 'LABORATORY', status_raw: 'تحت الصيانة / NEW', calibration_status_raw: 'yes', serial_number: '251206687', notes: 'تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات' },
  { name: 'PUBTESTER INSTRUMENTS', code: 'FYT-01', location: 'LABORATORY', status_raw: 'تحت الصيانة / NEW', calibration_status_raw: 'yes', serial_number: '251206618', notes: 'تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات' },
  { name: 'Catheter Hydraulic Pressure Leak Tester', code: 'HRT-01', location: 'LABORATORY', status_raw: 'تحت الصيانة / NEW', calibration_status_raw: 'yes', serial_number: '251206681', notes: 'تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات' },
  { name: 'TECHNICAL OUR APPLICATION ASSISTANCE', code: '-', location: 'LABORATORY', status_raw: 'تحت الصيانة / NEW', calibration_status_raw: 'no', serial_number: '1-800-5556-3484', notes: '—' },
  { name: 'PRESSURE GAUGE (MASK)', code: 'FMA-PG-017', location: 'LABORATORY', status_raw: 'مستخدم', calibration_status_raw: 'yes', serial_number: '11017', notes: 'Found and Compliant' },
  { name: 'Vacuum Gauge', code: 'HZ-60', location: 'LABORATORY', status_raw: 'تحت الصيانة', calibration_status_raw: 'no', serial_number: 'DOA-P104-AA', notes: '115 Volts' },
  { name: 'WEIGHT BALANCE', code: 'LAB-BAL-01', location: 'LABORATORY', status_raw: 'تحت الصيانة', calibration_status_raw: 'yes', serial_number: '-', notes: 'Found and Compliant' },
  { name: 'SCALE VERIFICATION', code: 'LAB-CFR-SV-01', location: 'LABORATORY', status_raw: 'مستخدم', calibration_status_raw: 'yes', serial_number: '-', notes: 'Found and Compliant' },
  { name: 'FLOW RATE', code: 'LAB-CFR-FRV-01', location: 'LABORATORY', status_raw: 'مستخدم', calibration_status_raw: 'yes', serial_number: '-', notes: '—' },
  { name: 'CONNECTOR ASSEMBLY DIV', code: 'LAB-SBC-TMC-01', location: 'LABORATORY', status_raw: 'مستخدم', calibration_status_raw: 'yes', serial_number: 'KPO22022601111', notes: 'التواصل مع المصنع' },
  { name: 'MACHINE OPERATING PROCEDURE FOR TUBES', code: 'BSS-250N, 250N', location: 'LABORATORY', status_raw: 'غير مستخدم / تحت الصيانة', calibration_status_raw: 'yes', serial_number: '-', notes: '—' },
  { name: 'PRESSURE', code: 'LAB-TMC-OL-C-PC-01', location: 'LABORATORY', status_raw: 'غير مستخدم', calibration_status_raw: 'yes', serial_number: '-', notes: '—' },
  { name: 'POSITIVE WATER BATH', code: 'LAB-SBC-TMC-07', location: 'LABORATORY', status_raw: 'غير مستخدم', calibration_status_raw: 'yes', serial_number: '-', notes: '—' },
  { name: 'MEDICAL PERFORMANCE TEST', code: 'YYL-03', location: 'LABORATORY', status_raw: 'غير مستخدم / DONE', calibration_status_raw: 'yes', serial_number: '20238265', notes: 'تم إصلاحه' },
  { name: 'Falling Drop Positive Pressure Liquid', code: 'JBL-750', location: 'LABORATORY', status_raw: 'غير مستخدم / تحت الصيانة', calibration_status_raw: 'yes', serial_number: '-', notes: '—' },
  { name: 'Subatmospheric Air Testing', code: 'LAB-SBC-TMC-03', location: 'LABORATORY', status_raw: 'مستخدم', calibration_status_raw: 'yes', serial_number: 'KP02206061190', notes: 'Found and Compliant' },
  { name: 'PRESSURE & POSTER', code: 'LAB-SBC-TMC-02', location: 'LABORATORY', status_raw: 'مستخدم', calibration_status_raw: 'yes', serial_number: 'K220001100', notes: '—' },
  { name: 'OPERATING PRODUCT', code: 'SS.2500W', location: 'LABORATORY', status_raw: 'غير مستخدم', calibration_status_raw: 'no', serial_number: 'KP022060611-1', notes: 'Need Clip' },
  { name: 'FILTER 13MM', code: 'DFT002', location: 'LABORATORY', status_raw: 'NEW', calibration_status_raw: 'yes', serial_number: 'M03250421013-3', notes: 'Need Clip' },
  { name: 'VOLTAGE -220VAC', code: 'YYL03', location: 'LABORATORY', status_raw: 'NEW', calibration_status_raw: 'no', serial_number: '32503602', notes: 'Need Clip' },
  { name: 'WATER BATH TEMPERATURE', code: 'LAB-CRF-WBTV-01', location: 'LABORATORY', status_raw: 'مستخدم', calibration_status_raw: 'yes', serial_number: '230427021', notes: 'Found and Compliant' },
  { name: 'Catheter Vacuum Leak Test', code: 'DVT-01', location: 'LABORATORY', status_raw: 'NEW / تحت الصيانة', calibration_status_raw: 'yes', serial_number: '240710362', notes: '—' },
];

/**
 * Resolve a seeding actor: the `admin` account when present, else the first
 * active user (created_by is NOT NULL REFERENCES users(id)). Returns null only
 * when the users table is empty, in which case seeding is skipped (users are
 * seeded by seedUsersIfEmpty during the same startup sequence).
 */
function seedActorId(db: BetterSqliteDatabase): number | null {
  const admin = db
    .prepare("SELECT id FROM users WHERE username = 'admin' ORDER BY id ASC LIMIT 1")
    .get() as { id: number } | undefined;
  if (admin) return admin.id;
  const fallback = db
    .prepare('SELECT id FROM users WHERE is_active = 1 ORDER BY id ASC LIMIT 1')
    .get() as { id: number } | undefined;
  return fallback?.id ?? null;
}

/**
 * Seed the 24-device registry into an empty `lab_equipment` table. Idempotent:
 * rows already present (matched by UNIQUE code) are left untouched, so user
 * edits survive re-runs. Returns the number of rows inserted.
 */
export function seedLabEquipmentIfEmpty(db: BetterSqliteDatabase): number {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM lab_equipment').get() as { n: number };
  if (n > 0) return 0;

  const actorId = seedActorId(db);
  if (actorId === null) {
    // Users not seeded yet — skip quietly; seedUsersIfEmpty runs first in the
    // same initialize()/init-db sequence, so this is a safety net only.
    console.warn('[seed] users table is empty — skipping laboratory equipment seed.');
    return 0;
  }

  const insert = db.prepare(
    `INSERT OR IGNORE INTO lab_equipment
       (name, code, location, status_raw, calibration_status_raw, serial_number, notes, is_archived, created_by)
     VALUES
       (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
  );
  const insertMany = db.transaction((rows: readonly LabEquipmentSeedRow[]) => {
    let inserted = 0;
    for (const row of rows) {
      const result = insert.run(
        row.name,
        row.code,
        row.location,
        row.status_raw,
        row.calibration_status_raw,
        row.serial_number,
        row.notes,
        actorId,
      );
      inserted += result.changes;
    }
    return inserted;
  });

  return insertMany(EQUIPMENT_SEED_ROWS);
}