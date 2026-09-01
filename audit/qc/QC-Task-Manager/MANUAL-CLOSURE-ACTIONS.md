# Manual Closure Actions

| Action | Why required | Owner | Blocking? | Evidence required |
|---|---|---|---|---|
| Revoke and rotate the credential found in local settings | Prevent continued use | environment/security owner | P1 | rotation record + clean scan |
| Remove/secure local settings file | Keep credentials out of local artifacts | environment owner | P1 | file absent/permissioned + scan |
| Run full E2E acceptance in an allowed runner | Sandbox could not bind localhost | release owner | P1 | exit 0 + aggregate counts |
| Deploy QC service with persistent SQLite disk | No live deployment evidence | operator | P2 | URL, health, logs, DB path |
| Run backup and restore drill on staging | Prove operations outside fixtures | operator | P2 | checksum, FK, audit evidence |
| Conduct role-based human UAT | Automation cannot validate usability | QC staff/product owner | P2 | signed results per role |
| Supply controlled WI source pages 2/3 and 3/3 | App refuses to invent source data | document owner | P2 if WI scope required | source files + provenance |
| Approve overdue-calibration policy | Product decision, not code inference | QC management | P2 if required | signed policy |
