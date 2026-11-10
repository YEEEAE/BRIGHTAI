import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import seoBuild from './scripts/seo-build.mjs';
import buildVersion from './scripts/build-version.mjs';

export default defineConfig({
  site: 'https://brightai.live',
  trailingSlash: 'always',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap({ filter: (page) => {
    const pathname = new URL(page).pathname;
    if (['/healthz', '/healthz/'].includes(pathname)) return false;
    return !pathname.startsWith('/app/') && !pathname.startsWith('/auth/') && !['/README/', '/404/'].includes(pathname);
  } }), seoBuild(), buildVersion()],
});
