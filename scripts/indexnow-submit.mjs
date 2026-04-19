#!/usr/bin/env node
/**
 * IndexNow Submit Script for BrightAI
 * Sends updated URLs to IndexNow-enabled search engines (Bing, Yandex, etc.)
 * Usage: node scripts/indexnow-submit.mjs [url1] [url2] ...
 *   or:  node scripts/indexnow-submit.mjs --sitemap   (submits all sitemap URLs)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SITE = 'https://brightai.site';
const KEY = 'brightai-indexnow-key';
const ENGINES = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

async function submit(urls) {
  if (!urls.length) {
    console.error('No URLs to submit');
    process.exit(1);
  }

  const body = JSON.stringify({
    host: 'brightai.site',
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList: urls,
  });

  for (const engine of ENGINES) {
    try {
      const res = await fetch(engine, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      console.log(`${engine} → ${res.status} ${res.statusText}`);
    } catch (err) {
      console.error(`${engine} → ERROR: ${err.message}`);
    }
  }
}

function parseSitemap() {
  const xml = readFileSync(resolve(import.meta.dirname, '../sitemap.xml'), 'utf-8');
  const urls = [];
  for (const match of xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)) {
    urls.push(match[1]);
  }
  return urls;
}

const args = process.argv.slice(2);
if (args.includes('--sitemap')) {
  const urls = parseSitemap();
  console.log(`Submitting ${urls.length} URLs from sitemap...`);
  // IndexNow max 10,000 per request
  for (let i = 0; i < urls.length; i += 10000) {
    await submit(urls.slice(i, i + 10000));
  }
} else if (args.length) {
  await submit(args);
} else {
  console.log('Usage:');
  console.log('  node scripts/indexnow-submit.mjs --sitemap');
  console.log('  node scripts/indexnow-submit.mjs https://brightai.site/page1/ https://brightai.site/page2/');
}
