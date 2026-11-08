import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';

const site = 'https://brightai.live';
const locations = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
const plain = text => text.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replace(/\s+/g, ' ').trim();

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await htmlFiles(url));
    else if (entry.name.endsWith('.html')) files.push(url);
  }
  return files;
}

// Run after @astrojs/sitemap. Use built HTML as the source of truth so expanded
// dynamic routes are covered, without publishing auth, workspace or draft pages.
export default function seoBuild() {
  let client;
  return {
    name: 'brightai-seo-coverage',
    hooks: {
      'astro:config:done': ({ config }) => { client = config.build.client; },
      'astro:build:done': async ({ logger }) => {
        const index = await readFile(new URL('sitemap-index.xml', client), 'utf8');
        const sitemapUrls = [];
        for (const url of locations(index)) {
          assert.equal(new URL(url).origin, site, 'Unexpected sitemap origin');
          sitemapUrls.push(...locations(await readFile(new URL(new URL(url).pathname.slice(1), client), 'utf8')));
        }
        const pages = [];
        for (const file of await htmlFiles(client)) {
          const html = await readFile(file, 'utf8');
          if (!html.includes('name="robots" content="index, follow"')) continue;
          const url = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
          assert(url, `Missing canonical: ${file.pathname}`);
          const canonical = new URL(url);
          assert.equal(canonical.origin, site, `Canonical origin: ${url}`);
          assert(!/^\/(app|auth)(\/|$)/.test(canonical.pathname), `Private page indexed: ${url}`);
          assert(canonical.pathname.endsWith('/') && !canonical.search, `Unclean canonical: ${url}`);
          const expected = canonical.pathname === '/' ? 'index.html' : canonical.pathname.slice(1) + 'index.html';
          assert.equal(file.href, new URL(expected, client).href, `Canonical points to another page: ${url}`);
          pages.push({ url, title: plain(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? ''),
            description: plain(html.match(/name="description" content="([^"]*)"/)?.[1] ?? '') });
        }
        assert(pages.length > 0, 'No public pages built');
        assert.deepEqual(sitemapUrls.sort(), pages.map(page => page.url).sort(),
          'Sitemap must contain every indexable built page exactly once');
        const { redirects } = JSON.parse(await readFile(new URL('../redirects.json', import.meta.url), 'utf8'));
        assert.equal(new Set(redirects.map(item => item.source)).size, redirects.length, 'Duplicate redirect sources');
        for (const { url, title, description } of pages) {
          assert(title && description, `Missing search metadata: ${url}`);
          const path = new URL(url).pathname;
          const aliases = path === '/' ? ['/index.html'] : [path.slice(0, -1) + '.html', path + 'index.html'];
          for (const alias of aliases) assert(redirects.some(item => item.source === alias && item.destination === path),
            `Add ${alias} -> ${path} to redirects.json`);
        }
        const groups = [
          ['التعريف والخدمات والثقة', page => !/^\/(knowledge|products|solutions|pillars)\//.test(new URL(page.url).pathname)],
          ['المنتجات المخططة', page => new URL(page.url).pathname.startsWith('/products/')],
          ['القطاعات وأركان الحوكمة', page => /^\/(solutions|pillars)\//.test(new URL(page.url).pathname)],
          ['أدلة المعرفة', page => new URL(page.url).pathname.startsWith('/knowledge/')],
        ];
        const text = ['# BRIGHTAI — مؤسسة مُشرقة', '',
          '> محتوى عربي عن حوكمة وأمان الذكاء الاصطناعي للمنشآت في السعودية.', '',
          'المواد تعليمية وليست استشارة قانونية أو شهادة امتثال. منتجات AIGAS مخططة وإتاحتها التشغيلية غير متحققة؛ لا توجد أسعار نهائية معتمدة.',
          'الصفحات التالية هي الروابط العامة الأساسية. لا يشمل الدليل مساحة العمل أو المصادقة أو المحاكاة غير المفهرسة.', '',
          'خريطة XML: https://brightai.live/sitemap-index.xml', '',
          ...groups.flatMap(([name, matches]) => [`## ${name}`, '', ...pages.filter(matches)
            .sort((a, b) => a.url.localeCompare(b.url))
            .map(page => `- [${page.title}](${page.url}): ${page.description}`), '']),
        ].join('\n');
        await writeFile(new URL('llms.txt', client), text);
        // Keep a reviewable, deployable copy in the source tree as requested.
        await writeFile(new URL('../public/llms.txt', import.meta.url), text);
        logger.info(`PASS: ${pages.length} public pages in sitemap and llms.txt; HTML aliases covered`);
      },
    },
  };
}
