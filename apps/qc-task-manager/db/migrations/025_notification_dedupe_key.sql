-- Scheduled notification jobs (PROMPT 46) — idempotency key.
--
-- The daily reminder job (scripts/scheduled-notifications.mjs) re-runs the
-- read-time derivation logic (LATEST_DUE_SQL, deriveCalibrationState,
-- deriveDocumentReviewState) and PERSISTS notifications into the existing
-- `notifications` table — there is no second notification system. Re-running
-- the job on the same day must not duplicate rows: each scheduled row carries
-- a computed dedupe_key encoding user + kind + entity + run date, enforced by
-- the partial unique index below.
--
-- Why a single computed column instead of a UNIQUE(user_id, type, entity_href,
-- day): entity_href has no index-day column, and a multi-column unique index
-- over the EXISTING rows could fail to build on historical duplicates. A
-- nullable dedupe_key with a partial index (WHERE dedupe_key IS NOT NULL) is
-- purely additive — interactive notifications keep dedupe_key NULL and are
-- unaffected.

ALTER TABLE notifications ADD COLUMN dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedupe_key
  ON notifications(dedupe_key)
  WHERE dedupe_key IS NOT NULL;
