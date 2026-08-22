// `pnpm notify:daily` — the daily scheduled reminder job (PROMPT 46).
//
// Runs the existing read-time derivation logic (LATEST_DUE_SQL,
// deriveCalibrationState, deriveDocumentReviewState) and persists reminders
// into the EXISTING notifications table — calibration due (30/15/7/today/
// overdue), document review due, and pending acknowledgements. Idempotent per
// day via the dedupe_key unique index (migration 025): running it twice on
// the same day changes nothing. Recipients are role-derived (equipment
// managers, document owners, assigned acknowledgers) and must be active
// users. The job writes with NO actor — it never impersonates a real user.
//
// Usage:
//   pnpm notify:daily
//   QC_DATABASE_PATH=/absolute/path/qc_tasks.db pnpm notify:daily
//
// Scheduling (host cron — .github/workflows is intentionally untouched).
// Run once a day in the morning, Asia/Riyadh server-local time (the
// test-ts-loader import resolves the app's extensionless TS imports, same as
// every other TS-touching script):
//
//   15 6 * * * cd /path/to/BRIGHTAI/apps/qc-task-manager \
//     && QC_DATABASE_PATH=/absolute/path/qc_tasks.db \
//        node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types \
//          scripts/scheduled-notifications.mjs \
//     >> /var/log/qc-scheduled-notifications.log 2>&1
//
// Exit code is 0 on success and 1 on failure, so cron alerting works.

try {
  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const { runScheduledNotifications } = await import('../src/lib/lab/scheduledNotifications.ts');

  getDb(); // open + apply migrations (idempotent) before writing
  const summary = runScheduledNotifications();
  closeDatabase();

  const total =
    summary.calibration_due +
    summary.calibration_overdue +
    summary.document_review +
    summary.acknowledgements;
  console.log(
    `[scheduled-notifications] ${summary.runDate}: inserted ${total} ` +
      `(calibration due ${summary.calibration_due}, calibration overdue ${summary.calibration_overdue}, ` +
      `document review ${summary.document_review}, acknowledgements ${summary.acknowledgements}; ` +
      `${summary.skipped_inactive} skipped inactive recipients)`,
  );
} catch (err) {
  console.error('[scheduled-notifications] failed:', err);
  process.exitCode = 1;
}
