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
  // Keep CSRF handling inside our middleware so rejected requests also pass
  // through the uniform security-header wrapper. The middleware's explicit
  // Origin check is required on every unsafe route, including /login.
  security: {
    checkOrigin: false,
  },
  // Emit page stylesheets as same-origin files (/_astro/*.css) instead of
  // inlining small ones — the strict CSP in src/middleware.ts whitelists only
  // the Astro island style hash, so an inlined <style> for src/styles/global.css
  // (skip link + prefers-reduced-motion) would be blocked by the browser.
  build: {
    inlineStylesheets: 'never',
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
      // better-sqlite3 is a native addon and exceljs is a CJS package with
      // dynamic requires — both must be externalized from the SSR bundle so
      // they resolve from node_modules at runtime (Vite bundling breaks the
      // CJS default-export interop: ExcelJS.Workbook becomes undefined).
      external: ['better-sqlite3', 'bcryptjs', 'exceljs'],
    },
  },
});
