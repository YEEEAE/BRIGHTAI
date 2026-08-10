// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// QC Task Manager — Astro SSR config.
// output: 'server' with @astrojs/node standalone adapter.
// Dev server on port 4321, host true for LAN testing on a personal machine.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: {
    port: 4321,
    host: true,
  },
  integrations: [
    react(),
    tailwind({
      // Base style entry; component-level utilities live alongside.
      applyBaseStyles: true,
    }),
  ],
  // Database file lives under the app's db/ directory (generated at runtime).
  vite: {
    ssr: {
      // better-sqlite3 is a native addon — must be externalized from the SSR bundle.
      external: ['better-sqlite3', 'bcryptjs'],
    },
  },
});
