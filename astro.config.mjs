import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import seoBuild from './scripts/seo-build.mjs';
import buildVersion from './scripts/build-version.mjs';
import { publicSite, isPublicIndexPath } from './src/server/seo/indexability.mjs';

const stagingOrigin = process.env.BRIGHTAI_STAGING_ORIGIN;
const staging = stagingOrigin ? new URL(stagingOrigin) : null;
if (staging && (staging.protocol !== 'https:' || staging.origin !== stagingOrigin || staging.port
  || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(staging.hostname))) {
  throw new Error('BRIGHTAI_STAGING_ORIGIN must be an exact HTTPS origin on the default port');
}

export default defineConfig({
  // Preview/staging hosts only add allowed origins; canonical links and the
  // sitemap stay on publicSite. Main-page canonicals must not change.
  site: publicSite,
  trailingSlash: 'always',
  // Apply Origin checks in application middleware so API refusals use the API contract.
  security: {
    checkOrigin: false,
    allowedDomains: [
      { hostname: 'brightai.live', protocol: 'https' },
      { hostname: 'www.brightai.live', protocol: 'https' },
      ...(staging ? [{ hostname: staging.hostname, protocol: 'https' }] : []),
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
    ],
  },
  // Keep bundled scripts external so runtime CSP can allow only same-origin modules.
  vite: { build: { assetsInlineLimit: 0 } },
  build: { inlineStylesheets: 'never' },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap({ filter: page => isPublicIndexPath(new URL(page).pathname) }), seoBuild(), buildVersion()],
});
