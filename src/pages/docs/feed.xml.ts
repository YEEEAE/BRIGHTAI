/**
 * RSS Feed — /docs/feed.xml/
 *
 * AEO enhancement: exposes the full Docs collection as an RSS feed so
 * AI search engines (Perplexity, SGE, ChatGPT Search) can index
 * BrightAI's technical documentation quickly.
 *
 * Pattern mirrors /rss.xml/ (blog feed).
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../../data/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const docs = await getCollection('docs');

  // Sort by `updated` descending (newest first). Entries without
  // `updated` fall to the bottom with epoch-0.
  const sorted = docs.sort((a, b) => {
    const da = a.data.updated ? new Date(a.data.updated).getTime() : 0;
    const db = b.data.updated ? new Date(b.data.updated).getTime() : 0;
    return db - da;
  });

  return rss({
    title: 'وثائق BrightAI',
    description:
      'دليل شامل لحوكمة وأمان الذكاء الاصطناعي في السعودية — PDPL, NCA ECC, SDAIA, ISO 42001',
    site: context.site || SITE.url,
    items: sorted.map((entry) => {
      // Docs slug = filename without extension (matches /docs/[slug]/ route)
      const slug = entry.id.replace(/\.mdx?$/, '');
      return {
        title: entry.data.title,
        pubDate: entry.data.updated ? new Date(entry.data.updated) : new Date('2026-01-01'),
        description: entry.data.description,
        link: `/docs/${slug}/`,
        author: 'BrightAI Team',
      };
    }),
    customData: `<language>ar-SA</language>
<link href="${SITE.url}/docs/feed.xml" rel="self" type="application/rss+xml"/>
<link href="${SITE.url}/docs/" rel="alternate" type="text/html"/>
<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE.url}/docs/feed.xml" rel="self" type="application/rss+xml" />`,
    stylesheet: false,
  });
}
