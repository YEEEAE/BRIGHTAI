/**
 * RSS Feed — /solutions/feed.xml/
 *
 * AEO enhancement: exposes the Solutions and Sectors catalogue as an
 * RSS feed so AI search engines (Perplexity, SGE, ChatGPT Search) can
 * index BrightAI's product/service pages quickly.
 *
 * Solutions are static data (not a content collection), so we import
 * from src/data/solutions.ts directly. There is no per-item pubDate in
 * the data model, so we use a stable build date for all items.
 *
 * Pattern mirrors /rss.xml/ (blog feed).
 */
import rss from '@astrojs/rss';
import { solutions, sectors } from '../../data/solutions';
import { SITE } from '../../data/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  // Combine solutions + sectors into a single feed.
  // Solutions first (core products), then sectors (industry verticals).
  const allItems = [
    ...solutions.map((s) => ({
      title: s.title,
      description: s.description,
      link: s.href,
    })),
    ...sectors.map((s) => ({
      title: s.title,
      description: s.description,
      link: s.href,
    })),
  ];

  // Stable date for all items (solutions have no individual pubDate).
  const buildDate = new Date();

  return rss({
    title: 'حلول BrightAI',
    description:
      'حلول حوكمة الذكاء الاصطناعي — AI Firewall, AI Audit Trail, Human Approval Layer, AI Evidence File',
    site: context.site || SITE.url,
    items: allItems.map((item) => ({
      title: item.title,
      pubDate: buildDate,
      description: item.description,
      link: item.link,
      author: 'BrightAI Team',
    })),
    customData: `<language>ar-SA</language>
<link href="${SITE.url}/solutions/feed.xml" rel="self" type="application/rss+xml"/>
<link href="${SITE.url}/solutions/" rel="alternate" type="text/html"/>
<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE.url}/solutions/feed.xml" rel="self" type="application/rss+xml" />`,
    stylesheet: false,
  });
}
