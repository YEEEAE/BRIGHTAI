import { defineConfig } from 'vitest/config';

/**
 * vitest.config.ts — Phase 1 PII detectors package.
 *
 * Mirrors the dashboard's vitest setup but is scoped to the
 * lightweight detector tests only (regex, redaction, piidetector).
 * NER + vault tests stay in the dashboard.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
