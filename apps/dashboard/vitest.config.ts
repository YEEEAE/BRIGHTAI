/**
 * Vitest config for the @brightai/dashboard workspace.
 *
 * Two test groups:
 *   - tests/firewall/**  — pure unit tests for the firewall engine
 *   - tests/integration/** — tests that touch Prisma or external services
 *
 * The default Vitest env is `node` (matches the firewall code which
 * is server-side only).
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
  },
});
