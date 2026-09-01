#!/usr/bin/env node
/**
 * Route + template inventory for the global background / layout audit.
 *
 * Emits one record per visible HTML route across every app in the monorepo, plus
 * the unique-template roll-up the audit coverage percentages are computed from.
 *
 * Route URLs for the main site come from public/sitemap.xml (the authoritative
 * published list) and are then attributed back to the source page file that
 * produced them, so dynamic routes inherit their template's layout.
 *
 * Usage: node scripts/qa/route-inventory.mjs [--out=path.json]
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const REPO = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const OUT = (process.argv.find((a) => a.startsWith('--out=')) || '').slice(6)
  || join(REPO, 'download/qa/global-bg-audit/route-inventory.json');

const walk = (dir, filter, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, filter, acc);
    else if (filter(p)) acc.push(p);
  }
  return acc;
};

const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };

/* ------------------------------------------------------------------ layouts */
// Resolve the full layout chain so CSS delivery can be reasoned about.
const LAYOUT_DIR = join(REPO, 'src/layouts');
const layoutMeta = {};
for (const f of walk(LAYOUT_DIR, (p) => p.endsWith('.astro'))) {
  const name = f.split('/').pop().replace('.astro', '');
  const src = read(f);
  const parent = (src.match(/^import (\w+) from '\.\/(\w+)\.astro'/m) || [])[2] || null;
  const css = [...src.matchAll(/@import '\.\.\/styles\/([\w.-]+\.css)'/g)].map((m) => m[1]);
  layoutMeta[name] = { file: relative(REPO, f), parent, ownCss: css };
}
const layoutChain = (name, seen = []) => {
  if (!name || !layoutMeta[name] || seen.includes(name)) return seen;
  seen.push(name);
  return layoutChain(layoutMeta[name].parent, seen);
};
const layoutCss = (name) => layoutChain(name).flatMap((l) => layoutMeta[l].ownCss);

/* -------------------------------------------------------------- page sources */
// Map every page source file to the route pattern it serves and the layout it uses.
const pageFileToRoute = (pagesDir, file) => {
  let r = '/' + relative(pagesDir, file);
  r = r.replace(/\.(astro|md|mdx|ts)$/, '');
  r = r.replace(/\/index$/, '/');
  if (!r.endsWith('/')) r += '/';
  return r === '//' ? '/' : r;
};

const collectPages = (app, pagesDir) => {
  const out = [];
  for (const f of walk(pagesDir, (p) => /\.(astro|md|mdx|ts)$/.test(p))) {
    const src = read(f);
    const pattern = pageFileToRoute(pagesDir, f);
    const isEndpoint = f.endsWith('.ts') || /\.xml\.ts$/.test(f);
    const prerender = /export const prerender = false/.test(src) ? 'ssr' : 'prerender';
    const layout = (src.match(/^import (\w*Layout) from ['"][^'"]*\/(\w+)\.astro['"]/m) || [])[2]
      || (/<html[\s>]/.test(src) ? '(own-html)' : null);
    out.push({
      app,
      templateFile: relative(REPO, f),
      pattern,
      dynamic: /\[/.test(pattern),
      kind: isEndpoint ? 'endpoint' : 'html',
      prerender,
      layout,
      layoutChain: layout && layoutMeta[layout] ? layoutChain(layout) : layout ? [layout] : [],
      cssDelivered: layout && layoutMeta[layout] ? layoutCss(layout) : [],
      robots: /noindex/.test(src) ? 'noindex' : 'index',
    });
  }
  return out;
};

const mainPages = collectPages('site', join(REPO, 'src/pages'));
const qcPages = collectPages('qc-task-manager', join(REPO, 'apps/qc-task-manager/src/pages'));

/* -------------------------------------------------- dashboard (Next.js app router) */
const DASH = join(REPO, 'apps/dashboard/app');
const dashPages = [];
for (const f of walk(DASH, (p) => /\/(page|not-found)\.tsx$/.test(p))) {
  const rel = relative(DASH, f);
  let route = '/' + dirname(rel).replace(/\((?:[^)]+)\)\/?/g, '');
  route = route.replace(/\/\.$/, '/').replace(/\/+/g, '/');
  if (!route.endsWith('/')) route += '/';
  if (rel.endsWith('not-found.tsx')) route = '(404)';
  dashPages.push({
    app: 'dashboard',
    templateFile: relative(REPO, f),
    pattern: route,
    dynamic: /\[/.test(route),
    kind: 'html',
    prerender: 'ssr',
    layout: 'app/layout.tsx',
    layoutChain: ['app/layout.tsx'],
    cssDelivered: ['globals.css', 'tokens.css'],
    robots: 'noindex',
  });
}

/* ------------------------------------------------ published URLs (main site) */
const sitemap = read(join(REPO, 'public/sitemap.xml'));
const publishedUrls = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

// Attribute a concrete URL back to the page source that renders it.
const staticPatterns = new Map(mainPages.filter((p) => !p.dynamic).map((p) => [p.pattern, p]));
const dynamicPatterns = mainPages.filter((p) => p.dynamic && p.kind === 'html');
const matchDynamic = (url) => {
  const seg = url.split('/').filter(Boolean);
  let best = null;
  for (const p of dynamicPatterns) {
    const pseg = p.pattern.split('/').filter(Boolean);
    const rest = pseg.some((s) => s.startsWith('[...'));
    if (!rest && pseg.length !== seg.length) continue;
    if (rest && seg.length < pseg.length - 1) continue;
    let ok = true; let score = 0;
    for (let i = 0; i < pseg.length; i += 1) {
      if (pseg[i].startsWith('[')) continue;
      if (pseg[i] !== seg[i]) { ok = false; break; }
      score += 1;
    }
    if (ok && (!best || score > best.score)) best = { p, score };
  }
  return best ? best.p : null;
};

/* ------------------------------------------------------------------- records */
const records = [];
const seen = new Set();
const push = (r) => { const k = `${r.app}${r.url}`; if (seen.has(k)) return; seen.add(k); records.push(r); };

const localeOf = (url) => (url.startsWith('/en/') || url === '/en/' ? 'en' : 'ar');

for (const url of publishedUrls) {
  const tpl = staticPatterns.get(url) || matchDynamic(url);
  push({
    app: 'site',
    url,
    source: 'sitemap',
    templateFile: tpl ? tpl.templateFile : '(unattributed)',
    layout: tpl ? tpl.layout : null,
    layoutChain: tpl ? tpl.layoutChain : [],
    cssDelivered: tpl ? tpl.cssDelivered : [],
    locale: localeOf(url),
    role: 'visitor',
    robots: tpl ? tpl.robots : 'index',
  });
}

// Visible main-site routes that are intentionally outside the sitemap.
for (const extra of [
  { url: '/404/', templateFile: 'src/pages/404.astro' },
  { url: '/500.html', templateFile: 'public/500.html' },
]) {
  const tpl = mainPages.find((p) => p.templateFile === extra.templateFile);
  push({
    app: 'site', url: extra.url, source: 'out-of-sitemap',
    templateFile: extra.templateFile,
    layout: tpl ? tpl.layout : '(static-html)',
    layoutChain: tpl ? tpl.layoutChain : [],
    cssDelivered: tpl ? tpl.cssDelivered : [],
    locale: 'ar', role: 'visitor', robots: 'noindex',
  });
}

// Any HTML page source with no sitemap URL at all (orphan / excluded).
for (const p of mainPages) {
  if (p.kind !== 'html' || p.dynamic) continue;
  if (records.some((r) => r.app === 'site' && r.templateFile === p.templateFile)) continue;
  push({
    app: 'site', url: p.pattern, source: 'source-only',
    templateFile: p.templateFile, layout: p.layout, layoutChain: p.layoutChain,
    cssDelivered: p.cssDelivered, locale: localeOf(p.pattern), role: 'visitor', robots: p.robots,
  });
}

// QC + dashboard: one record per route pattern (dynamic ids resolved at test time).
const QC_ROLE = (u) => {
  if (u.startsWith('/admin/')) return 'admin';
  if (u.startsWith('/lab/')) return 'lab';
  if (u.startsWith('/manager/')) return 'manager';
  if (u.startsWith('/supervisor/')) return 'supervisor';
  if (u.startsWith('/employee/')) return 'employee';
  if (u === '/login/' || u === '/404/') return 'anonymous';
  return 'authenticated';
};
for (const p of [...qcPages, ...dashPages]) {
  if (p.kind !== 'html') continue;
  push({
    app: p.app, url: p.pattern, source: 'source',
    templateFile: p.templateFile, layout: p.layout, layoutChain: p.layoutChain,
    cssDelivered: p.cssDelivered,
    locale: p.app === 'dashboard' ? 'ar' : 'en',
    role: p.app === 'qc-task-manager' ? QC_ROLE(p.pattern) : 'tenant-user',
    robots: p.app === 'site' ? p.robots : 'noindex',
    print: /\/print\/?$/.test(p.pattern),
  });
}

/* --------------------------------------------------------------- excluded set */
const excluded = [
  ...mainPages.filter((p) => p.kind === 'endpoint'),
  ...qcPages.filter((p) => p.kind === 'endpoint'),
].map((p) => ({ app: p.app, pattern: p.pattern, templateFile: p.templateFile, reason: 'non-HTML endpoint (API/JSON/XML/RSS)' }));

/* ---------------------------------------------------------------- roll-up */
const templates = [...new Map(records.map((r) => [`${r.app}:${r.templateFile}`, {
  app: r.app,
  templateFile: r.templateFile,
  layout: r.layout,
  layoutChain: r.layoutChain,
  cssDelivered: r.cssDelivered,
  routeCount: 0,
  sampleUrl: r.url,
}])).values()];
for (const r of records) {
  const t = templates.find((x) => x.app === r.app && x.templateFile === r.templateFile);
  if (t) t.routeCount += 1;
}

const payload = {
  generatedAt: new Date().toISOString(),
  repo: REPO,
  layouts: layoutMeta,
  totals: {
    visibleRoutes: records.length,
    uniqueTemplates: templates.length,
    byApp: Object.fromEntries(['site', 'qc-task-manager', 'dashboard'].map((a) => [a, records.filter((r) => r.app === a).length])),
    excludedEndpoints: excluded.length,
  },
  templates: templates.sort((a, b) => b.routeCount - a.routeCount),
  routes: records,
  excluded,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`route-inventory → ${relative(REPO, OUT)}`);
console.log(`  visible routes    : ${payload.totals.visibleRoutes}`);
console.log(`  unique templates  : ${payload.totals.uniqueTemplates}`);
console.log(`  by app            : ${JSON.stringify(payload.totals.byApp)}`);
console.log(`  excluded endpoints: ${payload.totals.excludedEndpoints}`);
