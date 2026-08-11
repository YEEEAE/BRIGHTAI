# BRIGHTAI Security Entry Point

The detailed QC Task Manager security policy lives in
[the QC security policy](../apps/qc-task-manager/SECURITY.md).

The relevant source-of-truth security contract is
[SINGLE-SOURCE-OF-TRUTH.md](./SINGLE-SOURCE-OF-TRUTH.md): UI is not an
authorization authority, APIs re-check server-side policy, AI is advisory-only,
SQLite protects critical invariants, and audit is server-side.

Run the local checks with:

```bash
pnpm --filter @brightai/qc-task-manager test:architecture
node apps/qc-task-manager/scripts/verify-security-hygiene.mjs
```

