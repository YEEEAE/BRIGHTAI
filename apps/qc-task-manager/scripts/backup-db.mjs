// `pnpm db:backup` — run the same WAL-safe backup used by the app and admin UI.
//
// Usage:
//   pnpm db:backup
//   QC_DATABASE_PATH=/absolute/path/qc_tasks.db pnpm db:backup
//   pnpm db:backup -- --keep=30

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backupDirectoryForDatabase, createBackup } from '../src/lib/backup.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = resolve(__dirname, '../db');
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH ?? resolve(DB_DIR, 'qc_tasks.db');
const BACKUP_DIR = process.env.QC_BACKUP_DIR || backupDirectoryForDatabase(DB_PATH);

const keepArg = process.argv.find((arg) => arg.startsWith('--keep='));
const keep = keepArg ? Number(keepArg.slice('--keep='.length)) : undefined;

try {
  const result = await createBackup({
    dbPath: DB_PATH,
    backupDir: BACKUP_DIR,
    ...(keep === undefined ? {} : { keep }),
    trigger: 'cli',
  });
  console.log(`[backup] file=${result.file}`);
} catch {
  process.exitCode = 1;
}
