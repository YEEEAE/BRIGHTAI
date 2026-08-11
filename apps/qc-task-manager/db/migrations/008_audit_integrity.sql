ALTER TABLE task_activity_log ADD COLUMN previous_hash TEXT;
ALTER TABLE task_activity_log ADD COLUMN event_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_activity_event_hash ON task_activity_log(event_hash);
