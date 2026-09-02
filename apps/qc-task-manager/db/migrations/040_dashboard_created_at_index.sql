-- 040_dashboard_created_at_index.sql — PROMPT-07 (QC-REMEDIATION-007).
-- The dashboard/report/drill-down layer filters tasks by created_at windows;
-- idx_tasks_status existed but tasks had no index on created_at. Add it so
-- date-window analytics have a proper index path on the created_at column.

CREATE INDEX idx_tasks_created_at ON tasks(created_at);
