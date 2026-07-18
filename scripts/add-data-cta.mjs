#!/usr/bin/env node
/**
 * add-data-cta.mjs — Bulk-inject data-cta attributes onto known CTA patterns.
 *
 * For the CRO audit Prompt 5 (unified analytics) — adds tracking metadata
 * to every CTA we can identify by class + href pattern. Idempotent: skips
 * any CTA that already has data-cta.
 *
 * Usage:
 *   node scripts/add-data-cta.mjs [file1.astro file2.astro ...]
 *   node scripts/add-data-cta.mjs  # scans the common set
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/** Mapping rules: match on the existing class + href substring, emit
 *  a deterministic data-cta set. Each rule is (matcher, builder). */
const RULES = [
  // WhatsApp buttons — always data-whatsapp
  {
    name: 'whatsapp',
    test: (ctx) => ctx.href.startsWith('https://wa.me/'),
    build: (ctx) => ({
      'data-whatsapp': '',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
    }),
  },
  // Hero primary CTA (home-cta-primary class)
  {
    name: 'home_cta_primary',
    test: (ctx) => ctx.className.includes('home-cta-primary') && ctx.href === '/contact/',
    build: (ctx) => ({
      'data-cta': ctx.position === 'final' ? 'secondary_cta_click' : 'hero_cta_click',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
      'data-offer': 'assessment',
    }),
  },
  // glow-btn CTAs to /solutions/* — primary
  {
    name: 'glow_btn_solutions',
    test: (ctx) => ctx.className.includes('glow-btn') && ctx.href.startsWith('/solutions/'),
    build: (ctx) => ({
      'data-cta': 'hero_cta_click',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
    }),
  },
  // glow-btn CTAs to /contact/ — MOFU
  {
    name: 'glow_btn_contact',
    test: (ctx) => ctx.className.includes('glow-btn') && ctx.href === '/contact/',
    build: (ctx) => ({
      'data-cta': 'hero_cta_click',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
      'data-offer': 'assessment',
    }),
  },
  // section-mini-link — secondary nav
  {
    name: 'section_mini_link',
    test: (ctx) => ctx.className.includes('section-mini-link'),
    build: (ctx) => ({
      'data-cta-secondary': '',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
    }),
  },
  // card--feature with href to /solutions/* — solution card
  {
    name: 'solution_card',
    test: (ctx) => ctx.className.includes('card') && ctx.href.startsWith('/solutions/'),
    build: (ctx) => ({
      'data-cta': 'hero_cta_click',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
    }),
  },
  // card--glass with href to /solutions/* — solution card
  {
    name: 'solution_card_glass',
    test: (ctx) => ctx.className.includes('card--glass') && ctx.href.startsWith('/solutions/'),
    build: (ctx) => ({
      'data-cta': 'hero_cta_click',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
    }),
  },
  // Kernel links (home-kernel-action / home-kernel-feature-link)
  {
    name: 'kernel_link',
    test: (ctx) => ctx.className.includes('home-kernel') || ctx.href.startsWith('/kernel/'),
    build: (ctx) => ({
      'data-cta': 'hero_cta_click',
      'data-cta-label': ctx.label,
      'data-position': ctx.position || 'kernel_demo',
      'data-page-type': ctx.pageType,
    }),
  },
  // /assessment/ — assessment_start
  {
    name: 'assessment_link',
    test: (ctx) => ctx.href.startsWith('/assessment/'),
    build: (ctx) => ({
      'data-cta': 'assessment_start',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
    }),
  },
  // /contact/ — secondary or hero based on position
  {
    name: 'contact_link',
    test: (ctx) => ctx.href === '/contact/' && !ctx.className.includes('home-cta-primary'),
    build: (ctx) => ({
      'data-cta': 'secondary_cta_click',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
      'data-offer': 'assessment',
    }),
  },
  // /services/ — explore
  {
    name: 'services_link',
    test: (ctx) => ctx.href === '/services/',
    build: (ctx) => ({
      'data-cta-secondary': '',
      'data-cta-label': ctx.label,
      'data-position': ctx.position,
      'data-page-type': ctx.pageType,
    }),
  },
];

/** Extract `class="..."`, `href="..."`, and visible-text label from an
 *  anchor tag. Tolerant of multi-line / multi-attribute. */
function parseAnchor(html) {
  const classMatch = html.match(/\bclass\s*=\s*"([^"]*)"/);
  const hrefMatch = html.match(/\bhref\s*=\s*"([^"]*)"/);
  if (!hrefMatch) return null;
  const className = classMatch ? classMatch[1] : '';
  const href = hrefMatch[1];
  // Strip nested tags from the anchor body to get visible text
  const inner = html.replace(/^<a\b[^>]*>/, '').replace(/<\/a>\s*$/, '');
  const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { className, href, label: text.slice(0, 80) };
}

function hasDataCta(html) {
  return /\bdata-cta\b\s*=/.test(html) ||
         /\bdata-whatsapp\b/.test(html) ||
         /\bdata-cta-secondary\b/.test(html);
}

function detectPageTypeFromPath(file) {
  if (file.endsWith('/index.astro')) {
    const parts = file.split('/');
    const parent = parts[parts.length - 2];
    if (parent === 'pages' || !parent) return 'home';
    return parent;
  }
  return 'unknown';
}

function processFile(file) {
  const full = resolve(ROOT, file);
  let src = readFileSync(full, 'utf8');
  const pageType = detectPageTypeFromPath(file);
  let added = 0;
  let skipped = 0;

  // Match <a ...>...</a> non-greedily. Astro files are flat, so this is OK.
  src = src.replace(/<a\s[^>]*>[\s\S]*?<\/a>/g, (anchor) => {
    if (hasDataCta(anchor)) { skipped += 1; return anchor; }
    const parsed = parseAnchor(anchor);
    if (!parsed) return anchor;
    // Skip empty hrefs, anchors, mailto, tel
    if (!parsed.href || parsed.href === '#' || parsed.href.startsWith('javascript:')) {
      return anchor;
    }
    // Detect position from parent class (best-effort)
    let position = 'inline';
    if (/card--feature/.test(parsed.className) || /card--metric/.test(parsed.className)) position = 'card';
    else if (/home-cta-(primary|secondary)/.test(parsed.className)) position = parsed.className.includes('primary') ? 'hero' : 'hero';
    else if (/home-cta-strip/.test(parsed.className)) position = 'final';
    else if (/home-kernel/.test(parsed.className)) position = 'kernel_demo';
    else if (/footer/.test(parsed.className)) position = 'footer';
    else if (/site-header/.test(parsed.className)) position = 'header';
    else if (/section-mini-link/.test(parsed.className)) position = 'section';

    const ctx = {
      href: parsed.href,
      className: parsed.className,
      label: parsed.label || parsed.href,
      position,
      pageType,
    };
    for (const rule of RULES) {
      if (rule.test(ctx)) {
        const attrs = rule.build(ctx);
        // Build the new opening tag with attrs inserted before the closing >
        const newAttrs = Object.entries(attrs)
          .map(([k, v]) => v === '' ? ` ${k}` : ` ${k}="${v.replace(/"/g, '&quot;')}"`)
          .join('');
        const newAnchor = anchor.replace(/^<a(\s[^>]*)?>/, (m, rest) => `<a${rest || ''}${newAttrs}>`);
        added += 1;
        return newAnchor;
      }
    }
    return anchor;
  });

  writeFileSync(full, src);
  return { file, added, skipped };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/add-data-cta.mjs <file.astro> [file2.astro ...]');
  process.exit(1);
}

let totalAdded = 0;
for (const f of files) {
  const result = processFile(f);
  console.log(`  ${relative(ROOT, f)}: +${result.added} CTAs (${result.skipped} already had data-cta)`);
  totalAdded += result.added;
}
console.log(`\nTotal: ${totalAdded} CTAs enriched with tracking attributes.`);
