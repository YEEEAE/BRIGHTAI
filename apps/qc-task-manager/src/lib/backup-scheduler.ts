// In-process daily backup scheduler. The QC app is deployed as one long-lived
// Node service, so this keeps the daily job close to the database and avoids a
// second deployment surface. Saudi Arabia has no DST, therefore 02:00 Riyadh
// is 23:00 UTC and the conversion remains deterministic.

import {
  BACKUP_TIME_ZONE,
  backupDirectoryForDatabase,
  createBackup,
  getBackupStatus,
  type BackupOptions,
  type BackupStatus,
} from './backup';

const DAILY_HOUR_RIYADH = 2;
const RIYADH_UTC_OFFSET_HOURS = 3;

export function getRiyadhDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BACKUP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Return the next 02:00 Riyadh instant after (or equal to) now. */
export function getNextScheduledBackupAt(now = new Date()): Date {
  const key = getRiyadhDateKey(now);
  const [year, month, day] = key.split('-').map(Number);
  let candidate = new Date(Date.UTC(year, month - 1, day, DAILY_HOUR_RIYADH - RIYADH_UTC_OFFSET_HOURS));
  if (candidate.getTime() <= now.getTime()) candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
  return candidate;
}

export function shouldRunBackupCatchup(status: Pick<BackupStatus, 'lastSuccessAt'>, now = new Date()): boolean {
  return !status.lastSuccessAt || getRiyadhDateKey(new Date(status.lastSuccessAt)) !== getRiyadhDateKey(now);
}

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleNext(options: BackupOptions): void {
  if (!running) return;
  const delay = Math.max(1_000, getNextScheduledBackupAt().getTime() - Date.now());
  timer = setTimeout(async () => {
    timer = null;
    try {
      await createBackup({ ...options, trigger: 'scheduled' });
    } catch {
      // createBackup records and logs the failure; the scheduler must survive
      // one failed run and try again on the next day.
    }
    scheduleNext(options);
  }, delay);
  // A timer must not keep CLI/tests alive when the app has no other work.
  timer.unref?.();
}

/** Start the singleton scheduler; repeated calls are harmless. */
export function startBackupScheduler(options: BackupOptions): () => void {
  if (running) return stopBackupScheduler;
  running = true;
  // The timer is unref'ed, and this exit hook clears it explicitly during a
  // normal process shutdown without intercepting SIGTERM/SIGINT semantics.
  process.once('exit', stopBackupScheduler);
  const status = getBackupStatus(options.backupDir);
  if (shouldRunBackupCatchup(status)) {
    void createBackup({ ...options, trigger: 'scheduled' })
      .catch(() => {})
      .finally(() => scheduleNext(options));
  } else {
    scheduleNext(options);
  }
  return stopBackupScheduler;
}

export function stopBackupScheduler(): void {
  running = false;
  if (timer) clearTimeout(timer);
  timer = null;
}

/** Resolve the standard backup directory for callers that only know the DB. */
export function schedulerOptionsForDatabase(dbPath: string): BackupOptions {
  return { dbPath, backupDir: backupDirectoryForDatabase(dbPath) };
}
