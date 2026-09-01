# Database Coverage

- Fresh isolated DB initialized with `db:init --reset`.
- Schema version 39; applied migrations 39; failures 0; all checksums MATCH.
- WAL ON; foreign keys ON; `integrity_check PASS`; `foreign_key_check PASS`.
- Embedded migration parity: 39/39 byte-identical.
- Schema reference: 165 objects match.
- Production database was not opened or modified by this audit.
- Live backup/restore was not proven against a live deployment; isolated production-operations tests passed.
