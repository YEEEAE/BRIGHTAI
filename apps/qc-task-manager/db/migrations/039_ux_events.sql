-- 039_ux_events.sql — privacy-minimized product UX measurement.
-- This is not an audit trail and must never be used as workflow authority.

CREATE TABLE ux_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  route TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('admin','manager','supervisor','employee')),
  outcome TEXT NOT NULL CHECK (outcome IN ('success','error','abandoned','neutral')),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR (duration_ms >= 0 AND duration_ms <= 86400000)),
  flow_id TEXT CHECK (flow_id IS NULL OR (length(flow_id) BETWEEN 8 AND 64)),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_ux_events_name_time ON ux_events(event_name, created_at);
CREATE INDEX idx_ux_events_route_time ON ux_events(route, created_at);
