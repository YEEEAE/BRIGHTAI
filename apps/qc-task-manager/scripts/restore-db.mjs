// Maintenance-only restore. Stop the QC service before running this command.
// Example:
//   pnpm db:restore -- --backup=/var/data/backups/qc_tasks-...db --confirm="RESTORE QC DATABASE"

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configuredBackupDirectory, restoreBackup } from '../src/lib/backup.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH ?? resolve(__dirname, '../db/qc_tasks.db');
const backupFileArg = process.argv.find((arg) => arg.startsWith('--backup='));
const confirmationArg = process.argv.find((arg) => arg.startsWith('--confirm='));
if (!backupFileArg) {
  console.error('Usage: pnpm db:restore -- --backup=/absolute/path/backup.db --confirm="RESTORE QC DATABASE"');
  process.exit(2);
}

try {
  const result = await restoreBackup({
    productionDbPath: dbPath,
    backupFile: backupFileArg.slice('--backup='.length),
    metadataFile: `${backupFileArg.slice('--backup='.length)}.json`,
    confirmation: confirmationArg?.slice('--confirm='.length),
    backupDir: configuredBackupDirectory(dbPath),
  });
  console.log(`[restore] PASS production=${result.productionDbPath} safetyBackup=${result.safetyBackup?.name ?? 'none'}`);
} catch (error) {
  console.error(`[restore] FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
