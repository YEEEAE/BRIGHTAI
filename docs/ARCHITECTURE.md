# BRIGHTAI Architecture Entry Point

The detailed architecture for the QC Task Manager lives in
[the QC architecture document](../apps/qc-task-manager/docs/ARCHITECTURE.md).

The business-rule ownership contract is
[SINGLE-SOURCE-OF-TRUTH.md](./SINGLE-SOURCE-OF-TRUTH.md). It defines the
canonical owners for RBAC, task policy, validation, status transitions, field
locking, SLA, workflows, audit, AI, findings, CAPA, and database invariants.

The local Architecture Guard is:

```bash
pnpm --filter @brightai/qc-task-manager test:architecture
```

