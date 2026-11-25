import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import seoBuild from './scripts/seo-build.mjs';
import buildVersion from './scripts/build-version.mjs';
import { publicSite, isPublicIndexPath } from './src/server/seo/indexability.mjs';

export default defineConfig({
  site: publicSite,
  trailingSlash: 'always',
  // Apply Origin checks in application middleware so API refusals use the API contract.
  security: { checkOrigin: false },
  // Keep bundled scripts external so runtime CSP can allow only same-origin modules.
  vite: { build: { assetsInlineLimit: 0 } },
  build: { inlineStylesheets: 'never' },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap({ filter: page => isPublicIndexPath(new URL(page).pathname) }), seoBuild(), buildVersion()],
});
