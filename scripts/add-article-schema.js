#!/usr/bin/env node
/**
 * Injects Article JSON-LD schema into all blogger HTML files.
 * Run from project root: node scripts/add-article-schema.js
 */

const fs = require('fs');
const path = require('path');

const BLOGGER_DIR = path.join(__dirname, '..', 'frontend', 'pages', 'blogger');
const BASE_URL = 'https://brightai.site/blogger';
const DEFAULT_IMAGE = 'https://brightai.site/Gemini.png';
const DEFAULT_DATE = '2024-06-01';

function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+property=["']og:description["']/i);
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+property=["']og:image["']/i);

  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
  const description = (descMatch && descMatch[1]) || (ogDescMatch && ogDescMatch[1]) || title;
  let image = (ogImageMatch && ogImageMatch[1].trim()) || DEFAULT_IMAGE;
  // Normalize to domain image if external
  if (image.includes('0zz0.com') || image.includes('top4top.io')) {
    image = DEFAULT_IMAGE;
  }
  if (!image.startsWith('http')) {
    image = image.startsWith('/') ? 'https://brightai.site' + image : DEFAULT_IMAGE;
  }
  return { title, description, image };
}

function buildArticleSchema(basename, { title, description, image }) {
  const slug = basename.replace(/\.html$/i, '');
  const url = `${BASE_URL}/${encodeURIComponent(slug)}`.replace(/%2F/g, '/');
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image,
    url: url,
    datePublished: DEFAULT_DATE,
    dateModified: DEFAULT_DATE,
    author: {
      '@type': 'Organization',
      name: 'Bright AI',
      url: 'https://brightai.site'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bright AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://brightai.site/Gemini.png'
      }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }
  };
}

function escapeJsonForHtml(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const files = fs.readdirSync(BLOGGER_DIR).filter(f => f.endsWith('.html'));
let count = 0;

files.forEach(file => {
  const filePath = path.join(BLOGGER_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('"@type":"Article"') || html.includes('"@type": "Article"')) {
    return; // already has Article schema
  }

  const meta = extractMeta(html);
  const schema = buildArticleSchema(file, meta);
  const scriptBlock = `  <!-- Article Schema -->\n  <script type="application/ld+json">\n  ${escapeJsonForHtml(schema)}\n  </script>\n</head>`;

  html = html.replace(/\s*<\/head>/i, '\n' + scriptBlock);
  fs.writeFileSync(filePath, html, 'utf8');
  count++;
});

console.log(`Added Article schema to ${count} blogger pages.`);
