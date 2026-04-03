import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'backend',
    environment: 'node',
    globals: true,
    include: ['**/*.functional.test.js', '**/*.e2e.test.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**']
  }
});
