# Audit Integrity

`task_activity_log` uses a SHA-256 hash chain. Each row stores `previous_hash` and `event_hash`. The canonical event is deterministic JSON with fixed key order:

```json
{"task_id":1,"user_id":2,"action":"status_changed","field":"status","old_value":"in_progress","new_value":"completed","note":null,"ip_address":null,"created_at":"2026-08-12T00:00:00.000Z"}
```

`event_hash = SHA-256(canonical_event + previous_hash)`. The first row uses an empty previous hash. `verifyAuditChain()` walks rows by ascending `id` and returns `PASS`, or `FAIL` with `first_invalid_event`, `expected_hash`, and `actual_hash`.

The chain detects tampering when event data or chain links no longer match. It does **not** make SQLite physically immutable: a process with database write access can still update or delete rows. Operational controls such as file permissions, backups, access control, and external archival are still required.

Legacy activity rows receive deterministic hashes during startup backfill. Application mutations use the server-side activity writer, which appends the next hash inside a SQLite transaction.
