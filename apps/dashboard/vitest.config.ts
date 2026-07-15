/**
 * Vitest config for the @brightai/dashboard workspace.
 *
 * Three test groups:
 *   - tests/firewall/**  — pure unit tests for the firewall engine
 *   - tests/api/**       — Next.js route handler tests
 *   - tests/integration/** — tests that touch Prisma or external services
 *
 * Coverage gate (BAI-003):
 *   - `pnpm test` runs without coverage (fast local feedback).
 *   - `pnpm test:coverage` enforces 60% threshold on lib/firewall/**
 *     so CI fails when the firewall drops below the contract.
 *
 * `server-only` is aliased to an empty stub so unit tests can
 * import server-only modules without the framework guard tripping.
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/_stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      include: ['lib/firewall/**'],
      exclude: [
        'lib/firewall/**/index.ts',
        'lib/firewall/**/types.ts',
        'lib/firewall/detectors/types.ts',
      ],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 55,
        statements: 60,
        perFile: false,
      },
    },
  },
});
