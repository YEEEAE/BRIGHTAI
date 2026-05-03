import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts}'],
    exclude: ['frontend/**', 'backend/**'],
  },
});
