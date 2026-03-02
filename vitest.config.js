import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts}'],
    exclude: ['frontend/**', 'backend/**', 'brightai-platform/**'],
  },
});
