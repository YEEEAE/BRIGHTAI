import { defineConfig } from 'vitest/config';

/**
 * vitest.config.ts — Lead-queue package.
 *
 * Tests run against `brightai_test` (isolation from `brightai_dev`).
 * Each test file uses `--pool=forks` so files run in separate Node
 * processes — keeps the shared Prisma client isolated per file.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // serial execution — keeps DB state predictable
      },
    },
  },
});
