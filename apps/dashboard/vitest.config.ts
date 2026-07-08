/**
 * Vitest config for the @brightai/dashboard workspace.
 *
 * Two test groups:
 *   - tests/firewall/**  — pure unit tests for the firewall engine
 *   - tests/integration/** — tests that touch Prisma or external services
 *
 * The default Vitest env is `node` (matches the firewall code which
 * is server-side only).
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: [],
  },
});
