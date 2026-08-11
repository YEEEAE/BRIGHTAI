// `pnpm db:backup` — snapshot the SQLite database into db/backups/.
//
// Plain-JS mirror of src/lib/backup.ts (createBackup) so the CLI keeps working
// on Node 20 without --experimental-strip-types. Keep the two in sync.
//
// Usage:
//   node scripts/backup-db.mjs                # → <app>/db/backups/qc_tasks-<ts>.db
//   QC_DB_PATH=/path/to/db.db node scripts/backup-db.mjs
//   node scripts/backup-db.mjs --keep=30      # retention override (default 14)

import Database from 'better-sqlite3';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = resolve(__dirname, '../db');
const DB_PATH = process.env.QC_DB_PATH || resolve(DB_DIR, 'qc_tasks.db');
const BACKUP_DIR = process.env.QC_BACKUP_DIR || resolve(DB_DIR, 'backups');

function pad(n) {
  return String(n).padStart(2, '0');
}
function timestamp(d = new Date()) {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}` +
    `${pad(d.getMilliseconds())}`
  );
}

async function main() {
  const keepArg = process.argv.find((a) => a.startsWith('--keep='));
  const keep = keepArg ? Number(keepArg.slice('--keep='.length)) : 14;
  if (!Number.isInteger(keep) || keep < 1) {
    console.error('[backup] --keep must be a positive integer.');
    process.exit(1);
  }

  if (!existsSync(DB_PATH)) {
    console.error(`[backup] ❌ Database file not found: ${DB_PATH}`);
    console.error('[backup]    Run `pnpm db:seed` first to create it.');
    process.exit(1);
  }
  mkdirSync(BACKUP_DIR, { recursive: true });

  const name = `qc_tasks-${timestamp()}.db`;
  const file = join(BACKUP_DIR, name);

  const source = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  try {
    await source.backup(file);
  } catch (err) {
    source.close();
    console.error(`[backup] ❌ Backup failed: ${err.message}`);
    process.exit(1);
  }
  source.close();

  const backups = readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .map((f) => join(BACKUP_DIR, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

  let pruned = 0;
  for (const old of backups.slice(keep)) {
    rmSync(old, { force: true });
    pruned += 1;
  }

  const size = statSync(file).size;
  const human = size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;

  console.log(`[backup] ✅ ${name} (${human})`);
  console.log(`[backup]    → ${file}`);
  if (pruned > 0) console.log(`[backup]    pruned ${pruned} old backup(s), keeping ${keep}`);
  else console.log(`[backup]    keeping ${keep} backup(s)`);
}

main().catch((err) => {
  console.error(`[backup] ❌ ${err.message}`);
  process.exit(1);
});
