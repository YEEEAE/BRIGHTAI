import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://brightai.live',
  trailingSlash: 'always',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/app/') && !['/README/', '/kernel/', '/404/', '/auth/accept-invitation/'].includes(new URL(page).pathname) })],
});
