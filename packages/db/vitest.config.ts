/**
 * @brightai/db — Vitest config (P0-1 / 2026-07-18)
 *
 * Runs the RLS isolation tests + cross-tenant leak tests against
 * a local Postgres. The DB must have the rls.sql policies applied
 * (`pnpm db:rls:apply`).
 *
 * Run:  pnpm --filter @brightai/db db:rls:test
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
