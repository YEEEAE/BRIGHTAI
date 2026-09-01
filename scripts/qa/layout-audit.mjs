#!/usr/bin/env node
/**
 * Layout + background audit harness.
 *
 * Drives a real Chromium over a route list and records measurable layout facts
 * instead of visual impressions: horizontal overflow, elements escaping the
 * viewport, content clipped by an ancestor, animation state left behind after
 * settle, suspicious vertical voids, section-group separation, and the full
 * background-video contract. Optionally captures full-page screenshots.
 *
 * Usage:
 *   node scripts/qa/layout-audit.mjs --label=baseline --app=site --shots
 *   node scripts/qa/layout-audit.mjs --label=after --app=site --viewports=1440x1000
 *   node scripts/qa/layout-audit.mjs --label=rtl-zoom --app=site --zoom=2
 *
 * Flags:
 *   --label=<name>        output subdirectory (required)
 *   --app=site|qc-task-manager|dashboard|all
 *   --base=<url>          override the app base URL
 *   --routes=a,b,c        explicit route list instead of the inventory
 *   --templates-only      one representative route per unique template
 *   --viewports=WxH,...   default: the 8 mandated sizes
 *   --shots               capture full-page screenshots
 *   --reduced-motion      emulate prefers-reduced-motion: reduce
 *   --print               emulate print media
 *   --zoom=N              CSS text zoom factor (200% => 2)
 *   --limit=N             cap the number of routes (smoke runs)
 *   --concurrency=N       parallel pages (default 4)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { chromium } from 'playwright';

const REPO = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const arg = (n, d = null) => {
  const hit = process.argv.find((a) => a === `--${n}` || a.startsWith(`--${n}=`));
  if (!hit) return d;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};

const LABEL = arg('label');
if (!LABEL) { console.error('--label=<name> is required'); process.exit(2); }

const BASES = {
  site: arg('base-site', arg('base', 'http://localhost:4321')),
  'qc-task-manager': arg('base-qc', arg('base', 'http://localhost:4322')),
  dashboard: arg('base-dashboard', arg('base', 'http://localhost:3000')),
};
const NAV_TIMEOUT = Number(arg('timeout', 45000));

const DEFAULT_VIEWPORTS = '360x800,375x812,768x1024,1024x900,1440x1000,1600x1200,1920x1080,2048x1178';
const VIEWPORTS = String(arg('viewports', DEFAULT_VIEWPORTS)).split(',').map((v) => {
  const [w, h] = v.trim().split('x').map(Number);
  return { w, h, name: `${w}x${h}` };
});

const APP = arg('app', 'site');
const SHOTS = !!arg('shots', false);
// Full-page captures of 14 000 px pages at eight sizes cost ~1 GB and an hour per
// pass. Measurements stay at every mandated viewport; captures default to the
// three sizes a human actually compares before/after at.
const SHOT_VIEWPORTS = String(arg('shot-viewports', '360x800,1440x1000,1920x1080')).split(',').map((s) => s.trim());
const SHOT_QUALITY = Number(arg('shot-quality', 78));

const REDUCED = !!arg('reduced-motion', false);
const PRINT = !!arg('print', false);
const ZOOM = Number(arg('zoom', 1));
const LIMIT = Number(arg('limit', 0));
const CONC = Math.max(1, Number(arg('concurrency', 4)));
const TEMPLATES_ONLY = !!arg('templates-only', false);

const OUT_DIR = join(REPO, 'download/qa/global-bg-audit', LABEL);
mkdirSync(OUT_DIR, { recursive: true });
if (SHOTS) mkdirSync(join(OUT_DIR, 'shots'), { recursive: true });

/* ------------------------------------------------------------ route selection */
const INV = join(REPO, 'download/qa/global-bg-audit/route-inventory.json');
let targets = [];
const explicit = arg('routes');
if (explicit) {
  targets = String(explicit).split(',').map((url) => ({ app: APP === 'all' ? 'site' : APP, url: url.trim(), templateFile: '(explicit)' }));
} else {
  if (!existsSync(INV)) { console.error('route-inventory.json missing — run scripts/qa/route-inventory.mjs first'); process.exit(2); }
  const inv = JSON.parse(readFileSync(INV, 'utf8'));
  targets = inv.routes.filter((r) => (APP === 'all' ? true : r.app === APP));
  if (TEMPLATES_ONLY) {
    const seen = new Set();
    targets = targets.filter((r) => { const k = `${r.app}:${r.templateFile}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  // Dynamic patterns cannot be fetched as-is; they are covered by their concrete siblings.
  targets = targets.filter((r) => !r.url.includes('['));
}
if (LIMIT > 0) targets = targets.slice(0, LIMIT);

/* ------------------------------------------------------- in-page measurements */
// Every number here must be reproducible by opening the same URL at the same
// viewport and reading the same DOM/CSSOM property. No heuristics that cannot
// be re-derived, and no visual judgement.
const MEASURE = function measure() {
  const vw = window.innerWidth;
  const de = document.documentElement;
  // Patterns that are hidden/offset on purpose. Excluding them keeps the counts
  // actionable; every entry here is a deliberate UI mechanism, not a layout bug.
  const BY_DESIGN = /skip-link|tooltip|honeypot|sr-only|visually-hidden|__backdrop|dropdown|submenu|mobile-nav|cookie-consent|trap-focus|marquee|reveal-mask/i;
  const name = (el) => {
    const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${c ? `.${c}` : ''}`;
  };
  const designed = (el) => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      if (typeof p.className === 'string' && BY_DESIGN.test(p.className)) return true;
      if (p.id && BY_DESIGN.test(p.id)) return true;
      if (p.hasAttribute('hidden') || p.getAttribute('aria-hidden') === 'true') return true;
    }
    return false;
  };
  const box = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
  const nodes = Array.from(document.querySelectorAll('body *'));

  const escapees = []; const clipped = []; const stuck = []; const srLeak = []; const bareTextOnMedia = [];
  for (const el of nodes) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const tag = el.tagName.toLowerCase();

    // .sr-only whose clipping rules were not delivered renders as visible text.
    // Checked before the by-design bail-out, since sr-only is in that list.
    if (typeof el.className === 'string' && /\bsr-only\b/.test(el.className)
      && r.width > 8 && r.height > 8 && cs.position === 'static' && cs.clipPath === 'none') {
      srLeak.push(Object.assign({ el: name(el), text: (el.textContent || '').trim().slice(0, 60) }, box(r)));
    }

    if (designed(el)) continue;
    // SVG internals are laid out by viewBox, not CSS box model.
    if (['path', 'circle', 'rect', 'g', 'polygon', 'line', 'use', 'defs', 'stop', 'linearGradient', 'radialGradient', 'filter', 'text', 'tspan'].includes(tag)) continue;

    if (cs.position !== 'fixed' && (r.left < -1 || r.right > vw + 1)) {
      // A wide table or code block inside a deliberately scrollable wrapper is
      // correct responsive behaviour, not an escape. Only report content that
      // leaves the viewport with no scrollable ancestor to reach it through.
      let scrollable = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const pcs = getComputedStyle(p);
        if (/auto|scroll/.test(pcs.overflowX) && p.scrollWidth > p.clientWidth + 1) { scrollable = true; break; }
      }
      if (!scrollable) {
        escapees.push(Object.assign({ el: name(el), position: cs.position, decorative: cs.position === 'absolute' && !(el.textContent || '').trim() }, box(r)));
      }
    }

    // Clipped by an ancestor that hides overflow.
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (!/hidden|clip/.test(pcs.overflowX + pcs.overflowY)) continue;
      // A collapsed <details> hides its own panel by design.
      if (p.tagName === 'DETAILS' && !p.open) break;
      const pr = p.getBoundingClientRect();
      if (pr.width === 0 || pr.height === 0) break;
      const dx = Math.max(0, Math.round(pr.left - r.left), Math.round(r.right - pr.right));
      const dy = Math.max(0, Math.round(pr.top - r.top), Math.round(r.bottom - pr.bottom));
      // Only report clipping that hides real content, not decorative bleed, and
      // not text the author explicitly truncated with an ellipsis.
      const truncated = cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none';
      if ((dx > 2 || dy > 2) && (el.textContent || '').trim() && !truncated) {
        clipped.push(Object.assign({ el: name(el), by: name(p), dx, dy }, box(r)));
      }
      break;
    }

    // Leaf text nodes still carrying pre-animation state after settle.
    if (el.children.length === 0 && (el.textContent || '').trim()) {
      if (parseFloat(cs.opacity) === 0) {
        stuck.push(Object.assign({ el: name(el), reason: 'opacity:0' }, box(r)));
      } else if (cs.transform !== 'none' && /matrix\(1, 0, 0, 1, (?:-?[3-9]\d|-?\d{3,}), |matrix\(1, 0, 0, 1, [^,]+, (?:-?[3-9]\d|-?\d{3,})\)/.test(cs.transform)) {
        stuck.push(Object.assign({ el: name(el), reason: `transform:${cs.transform}` }, box(r)));
      }
    }
  }

  /* A text node is safe only when an ancestor before <body> paints an opaque or
     alpha-known background. Body is deliberately excluded: its fallback paint
     does not protect text once the video layer is behind the content. */
  const video = document.querySelector('video');
  const videoBox = video?.getBoundingClientRect();
  const overlaps = (a, b) => b && a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  const hasSurface = (el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor.match(/^rgba?\(([^)]+)\)$/)?.[1]?.split(',').map(Number);
    const alpha = bg?.length === 4 ? bg[3] : bg?.length === 3 ? 1 : 0;
    return alpha > 0.01 || cs.backgroundImage !== 'none';
  };
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const parent = node.parentElement;
    if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|SVG)$/i.test(parent.tagName) || designed(parent)) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.height <= 12 || !overlaps(rect, videoBox)) continue;
    let surface = null;
    for (let p = parent; p && p !== document.body; p = p.parentElement) {
      if (hasSurface(p)) { surface = p; break; }
    }
    if (!surface) bareTextOnMedia.push({ el: name(parent), text: node.textContent.trim().slice(0, 80), ...box(rect) });
  }
  return { vw, escapees, clipped, stuck, srLeak, bareTextOnMedia, nodeCount: nodes.length,
    escapeesContent: escapees.filter((e) => !e.decorative).length,
    overflowX: { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, delta: de.scrollWidth - de.clientWidth },
    docHeight: de.scrollHeight };
};


/* ------------------------------- background contract + structure measurements */
const MEASURE2 = function measure2() {
  const name = (el) => {
    const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${c ? `.${c}` : ''}`;
  };

  /* Background video contract — every clause from the approved SystemBackground. */
  const videos = Array.from(document.querySelectorAll('video')).map((v) => {
    const cs = getComputedStyle(v);
    const r = v.getBoundingClientRect();
    const wrap = v.parentElement ? getComputedStyle(v.parentElement) : null;
    return {
      el: name(v),
      src: (v.currentSrc || v.querySelector('source')?.getAttribute('src') || '').replace(location.origin, ''),
      poster: v.getAttribute('poster'),
      cssWidth: cs.width, cssHeight: cs.height,
      renderedW: Math.round(r.width), renderedH: Math.round(r.height),
      opacity: cs.opacity, filter: cs.filter, position: cs.position,
      objectFit: cs.objectFit, mixBlendMode: cs.mixBlendMode, transform: cs.transform,
      pointerEvents: cs.pointerEvents, zIndex: cs.zIndex, display: cs.display,
      wrapperPosition: wrap ? wrap.position : null,
      wrapperPointerEvents: wrap ? wrap.pointerEvents : null,
      wrapperOverflow: wrap ? wrap.overflow : null,
      wrapperZIndex: wrap ? wrap.zIndex : null,
      ariaHidden: v.closest('[aria-hidden="true"]') ? true : false,
      autoplay: v.autoplay, muted: v.muted, loop: v.loop, playsInline: v.playsInline,
      readyState: v.readyState, paused: v.paused,
      naturalW: v.videoWidth, naturalH: v.videoHeight,
    };
  });

  /* A global scrim is a fixed full-viewport translucent layer painted between the
     background and the content. The background layer itself is not a scrim, so
     anything that is (or contains) the designated background element is excluded. */
  const scrims = Array.from(document.querySelectorAll('body *')).filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width < window.innerWidth * 0.95 || r.height < window.innerHeight * 0.95) return false;
    if (el.querySelector('video')) return false;
    if (/system-background|site-background|dotted-bg|background/i.test(String(el.className))) return false;
    return /rgba?\([^)]*0?\.\d+\)/.test(cs.backgroundColor) || cs.backgroundImage !== 'none';
  }).map((el) => { const cs = getComputedStyle(el); return { el: name(el), bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0, 90), zIndex: cs.zIndex }; });

  /* Suspicious vertical voids between consecutive siblings inside main. */
  const voids = [];
  const main = document.querySelector('main') || document.body;
  const tops = Array.from(main.children).filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.position === 'fixed' || cs.position === 'absolute') return false;
    return el.getBoundingClientRect().height > 0;
  });
  for (let i = 1; i < tops.length; i += 1) {
    const a = tops[i - 1].getBoundingClientRect();
    const b = tops[i].getBoundingClientRect();
    const gap = Math.round(b.top - a.bottom);
    if (gap > 240) voids.push({ after: name(tops[i - 1]), before: name(tops[i]), gap });
  }

  /* Section group cohesion. A heading is only "split" from its group when the
     band between them is genuinely EMPTY — no rendered text box in between. An
     earlier version reported the distance to the heading wrapper's next sibling,
     which counted the intervening lead paragraph as a gap and produced ~40 false
     positives. Verified against the DOM before tightening. */
  const groupSplits = [];
  const textBoxes = Array.from(main.querySelectorAll('*')).filter((e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    if (e.children.length > 0) return false;
    if (!(e.textContent || '').trim() && !/^(IMG|SVG|VIDEO|CANVAS|INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) return false;
    const r = e.getBoundingClientRect();
    return r.height > 0 && r.width > 0;
  }).map((e) => e.getBoundingClientRect());

  for (const h of main.querySelectorAll('h2, h3')) {
    const sec = h.closest('section');
    if (!sec || sec.querySelector('h2, h3') !== h) continue;
    const hb = h.getBoundingClientRect();
    const candidates = textBoxes
      .filter((r) => r.top >= hb.bottom - 1)
      .sort((x, y) => x.top - y.top);
    if (!candidates.length) continue;
    const gap = Math.round(candidates[0].top - hb.bottom);
    if (gap > 200) {
      groupSplits.push({ heading: (h.textContent || '').trim().slice(0, 48), gap, emptyBand: true });
    }
  }


  /* CSS delivery probe — which load-bearing selectors the CSSOM actually knows. */
  const probes = ['.home-trust', '.home-cta-primary', '.home-cta-strip', '.bg-ambient-dots', '.section__title',
    '.section__eyebrow', '.card--glass', '.page-hero__title', '.k-units', '.k-unit-card', '.inner-section', '.sr-only', '.legal-page'];
  const ruleCounts = Object.fromEntries(probes.map((p) => [p, 0]));
  let totalRules = 0;
  const walk = (rules) => { for (const r of rules) {
    if (r.selectorText) { totalRules += 1; for (const p of probes) if (r.selectorText.includes(p)) ruleCounts[p] += 1; }
    if (r.styleSheet && r.styleSheet.cssRules) { try { walk(r.styleSheet.cssRules); } catch (e) { /* cross-origin */ } }
    else if (r.cssRules) walk(r.cssRules);
  } };
  for (const s of document.styleSheets) { try { walk(s.cssRules); } catch (e) { /* cross-origin */ } }

  const h1 = Array.from(document.querySelectorAll('h1')).map((e) => (e.textContent || '').trim().slice(0, 60));
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const htmlBg = getComputedStyle(document.documentElement).backgroundColor;

  /* Content that occupies layout space but is invisible because an ANCESTOR is
     transparent. A leaf-only opacity check misses this, which is how a site-wide
     stuck scroll-reveal went unnoticed: the cards reserved their full height
     while rendering nothing. */
  const invisibleContent = [];
  for (const el of main.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.height < 12 || r.width < 12) continue;
    if (!(el.textContent || '').trim()) continue;
    if (el.closest('[aria-hidden="true"], details:not([open]), [hidden]')) continue;
    let eff = 1; let culprit = null;
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const o = parseFloat(getComputedStyle(p).opacity);
      if (o < 1) { eff *= o; if (o === 0 && !culprit) culprit = p; }
    }
    if (eff < 0.05) {
      invisibleContent.push({ el: name(el), hiddenBy: culprit ? name(culprit) : null, h: Math.round(r.height), text: (el.textContent || '').trim().slice(0, 40) });
    }
  }

  return { videos, scrims, voids, groupSplits, ruleCounts, totalRules, h1Count: h1.length, h1, bodyBg, htmlBg,
    invisibleContent: invisibleContent.slice(0, 40),
    invisibleContentCount: invisibleContent.length,
    revealReady: document.documentElement.classList.contains('reveal-ready'),
    isVisibleCount: document.querySelectorAll('.is-visible').length,
    canvases: Array.from(document.querySelectorAll('canvas')).map(name) };
};

/* ------------------------------------------------------------------- driver */
const slug = (app, url) => `${app}${url}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 90) || 'root';

async function auditOne(context, target, vp) {
  const base = BASES[target.app];
  const url = base + (target.url.startsWith('/') ? target.url : `/${target.url}`);
  const page = await context.newPage();
  const consoleErrors = []; const pageErrors = []; const failed = []; const requests = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push({ type: m.type(), text: m.text().slice(0, 220) }); });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 220)));
  page.on('requestfailed', (r) => failed.push({ url: r.url().replace(base, ''), err: r.failure()?.errorText }));
  page.on('response', (r) => {
    const u = r.url();
    if (/\.(mp4|webm|jpg|jpeg|png|webp|avif|css|woff2)(\?|$)/i.test(u)) {
      requests.push({ url: u.replace(base, ''), status: r.status(), type: r.request().resourceType() });
    }
  });

  const rec = { app: target.app, url: target.url, templateFile: target.templateFile, viewport: vp.name, httpStatus: null, error: null };
  try {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    if (ZOOM !== 1) await page.addInitScript((z) => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = `${16 * z}px`; }); }, ZOOM);
    const resp = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT });
    rec.httpStatus = resp ? resp.status() : null;
    // Let scroll-triggered reveals settle, then return to the top so measurements
    // reflect the state a real reader lands on. The reveal observer boots after
    // `load` via requestIdleCallback, so wait for the reveal flag (or give up)
    // before sweeping — otherwise the sweep outruns the observer and every card
    // measures invisible.
    await page.evaluate(async () => {
      const deadline = Date.now() + 6000;
      while (!document.documentElement.classList.contains('reveal-ready') && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 100));
      }
      const step = Math.max(200, Math.floor(window.innerHeight * 0.9));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 700));
    });
    if (PRINT) await page.emulateMedia({ media: 'print' });
    rec.layout = await page.evaluate(MEASURE);
    rec.bg = await page.evaluate(MEASURE2);
    rec.requests = requests;
    rec.videoRequests = requests.filter((r) => /\.mp4(\?|$)/i.test(r.url));
    rec.missingAssets = requests.filter((r) => r.status >= 400);
    rec.consoleErrors = consoleErrors.slice(0, 12);
    rec.pageErrors = pageErrors.slice(0, 6);
    rec.failedRequests = failed.slice(0, 12);
    if (SHOTS && SHOT_VIEWPORTS.includes(vp.name)) {
      const file = join(OUT_DIR, 'shots', `${slug(target.app, target.url)}@${vp.name}.jpg`);
      await page.screenshot({ path: file, fullPage: true, animations: 'disabled', type: 'jpeg', quality: SHOT_QUALITY });
      rec.shot = file.replace(`${REPO}/`, '');
    }
  } catch (e) {
    rec.error = String(e).slice(0, 300);
  } finally {
    await page.close();
  }
  return rec;
}

const browser = await chromium.launch();
const STORAGE = arg('storage-state', null);
const context = await browser.newContext({
  reducedMotion: REDUCED ? 'reduce' : 'no-preference',
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
  ...(STORAGE && existsSync(STORAGE) ? { storageState: STORAGE } : {}),
});

const jobs = [];
for (const t of targets) for (const vp of VIEWPORTS) jobs.push({ t, vp });
console.log(`layout-audit "${LABEL}": ${targets.length} routes x ${VIEWPORTS.length} viewports = ${jobs.length} runs`
  + `${REDUCED ? ' [reduced-motion]' : ''}${PRINT ? ' [print]' : ''}${ZOOM !== 1 ? ` [zoom x${ZOOM}]` : ''}${SHOTS ? ' [shots]' : ''}`);

const results = [];
let done = 0;
const queue = jobs.slice();
await Promise.all(Array.from({ length: CONC }, async () => {
  for (;;) {
    const job = queue.shift();
    if (!job) return;
    const r = await auditOne(context, job.t, job.vp);
    results.push(r);
    done += 1;
    if (done % 20 === 0 || done === jobs.length) process.stdout.write(`  ${done}/${jobs.length}\r`);
  }
}));
process.stdout.write('\n');
await browser.close();

/* ---------------------------------------------------------------- roll-up */
const num = (r, f) => (r.layout ? f(r.layout) : 0);
const summary = {
  label: LABEL,
  generatedAt: new Date().toISOString(),
  conditions: { app: APP, viewports: VIEWPORTS.map((v) => v.name), reducedMotion: REDUCED, print: PRINT, zoom: ZOOM, shots: SHOTS, templatesOnly: TEMPLATES_ONLY },
  runs: results.length,
  routes: targets.length,
  templates: new Set(targets.map((t) => `${t.app}:${t.templateFile}`)).size,
  failures: {
    errored: results.filter((r) => r.error).length,
    nonOk: results.filter((r) => r.httpStatus && r.httpStatus >= 400).length,
    horizontalOverflow: results.filter((r) => num(r, (l) => l.overflowX.delta) > 1).length,
    escapees: results.filter((r) => num(r, (l) => l.escapeesContent) > 0).length,
    escapeesIncludingDecor: results.filter((r) => num(r, (l) => l.escapees.length) > 0).length,

    clipped: results.filter((r) => num(r, (l) => l.clipped.length) > 0).length,
    stuck: results.filter((r) => num(r, (l) => l.stuck.length) > 0).length,
    srLeak: results.filter((r) => num(r, (l) => l.srLeak.length) > 0).length,
    bareTextOnMedia: results.filter((r) => num(r, (l) => l.bareTextOnMedia.length) > 0).length,
    bareTextOnMediaNodes: results.reduce((s, r) => s + num(r, (l) => l.bareTextOnMedia.length), 0),
    bigVoids: results.filter((r) => r.bg && r.bg.voids.length > 0).length,
    groupSplits: results.filter((r) => r.bg && r.bg.groupSplits.length > 0).length,
    globalScrim: results.filter((r) => r.bg && r.bg.scrims.length > 0).length,
    multipleVideos: results.filter((r) => r.bg && r.bg.videos.length > 1).length,
    noVideo: results.filter((r) => r.bg && r.bg.videos.length === 0).length,
    duplicateVideoRequests: results.filter((r) => (r.videoRequests || []).length > 1).length,
    missingAssets: results.filter((r) => (r.missingAssets || []).length > 0).length,
    consoleErrors: results.filter((r) => (r.consoleErrors || []).some((c) => c.type === 'error')).length,
    h1NotOne: results.filter((r) => r.bg && r.bg.h1Count !== 1).length,
    lostCss: results.filter((r) => r.bg && r.bg.ruleCounts['.section__title'] === 0).length,
    invisibleContent: results.filter((r) => r.bg && r.bg.invisibleContentCount > 0).length,
    invisibleContentNodes: results.reduce((s, r) => s + (r.bg ? r.bg.invisibleContentCount : 0), 0),
    revealNotReady: results.filter((r) => r.bg && r.bg.revealReady === false).length,

  },
};

const outFile = join(OUT_DIR, 'measurements.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ summary, results }, null, 2));
writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.failures, null, 2));
console.log(`→ ${outFile.replace(`${REPO}/`, '')}`);
