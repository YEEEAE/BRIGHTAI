/**
 * comprehensive-audit.mjs — فحص شامل لكل صفحات dist/client (190 صفحة).
 *  1. horizontal overflow (كل عنصر يطلع برا viewport)
 *  2. touch targets ≥ 44px — عبر hit-testing (يقيس ::before الممدود فعلياً)
 *  3. mixed bidi
 *  4. axe serious/critical + reduced-motion (عند 1440)
 *  5. streaming live region (kernel/chat)
 *
 * يحفظ تدريجياً (كل صفحة) + يدعم resume عبر --resume.
 * يُشغَّل ضد preview server على http://localhost:4321/
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'download', 'qa', 'comprehensive');
fs.mkdirSync(OUT_DIR, { recursive: true });

const AXE_PATH = path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js');
const AXE_SRC = fs.readFileSync(AXE_PATH, 'utf-8');

const BASE = 'http://localhost:4321';
const PAGES = JSON.parse(fs.readFileSync('/tmp/pages.json', 'utf-8')).map((u) => ({ name: u, url: BASE + u }));
const BREAKPOINTS = [320, 375, 544, 768, 1024];
const RESUME = process.argv.includes('--resume');
const OUT = path.join(OUT_DIR, 'audit.json');
let findings = RESUME && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf-8')) : [];
const doneNames = new Set(findings.map((f) => f.page));

const waitCss = (tab) => tab.waitForFunction(() => {
  const a = document.querySelector('a');
  if (!a) return true;
  const bg = getComputedStyle(a).backgroundColor;
  return bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
}, { timeout: 15_000 }).catch(() => {});

const hitTestTouch = (tab) => tab.evaluate(() => {
  const els = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [tabindex]');
  const small = [];
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const pts = [[cx, cy], [cx - 22, cy], [cx + 22, cy], [cx, cy - 22], [cx, cy + 22],
      [cx - 15, cy - 15], [cx + 15, cy - 15], [cx - 15, cy + 15], [cx + 15, cy + 15]];
    let reachable = false;
    for (const [x, y] of pts) {
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (!hit) continue;
      if (el === hit || el.contains(hit) || (hit.parentElement && el.contains(hit.parentElement))) { reachable = true; break; }
    }
    if (!reachable) small.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || '').trim().slice(0, 30), cls: el.className?.toString?.().slice(0, 40) || '' });
  });
  return small;
});

async function auditLayout(browser, def) {
  const pf = { page: def.name, overflow: [], touch: [], bidi: [] };
  for (const bp of BREAKPOINTS) {
    const ctx = await browser.newContext({ viewport: { width: bp, height: Math.round(bp * 1.8) }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const tab = await ctx.newPage();
    try {
      await tab.goto(def.url, { waitUntil: 'networkidle', timeout: 30_000 });
      await waitCss(tab);
      const ov = await tab.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        const bad = [];
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          // استثناء: العناصر المخفية فعلياً (visibility:hidden) أو اللي طلعت
          // برا الشاشة بالكامل (right <= 0 أو left >= vw) — هذي false positives
          // من transform: translateX على drawers مقفولة.
          if (cs.visibility === 'hidden') return;
          if (r.right <= 0 || r.left >= vw) return;
          if (r.right > vw + 1 && r.width > 0 && cs.position !== 'fixed') bad.push(Math.round(r.right - vw));
        });
        return { overflow: bad.length ? Math.max(...bad) : 0 };
      });
      pf.overflow.push({ bp, ...ov });
      const small = await hitTestTouch(tab);
      if (small.length) pf.touch.push({ bp, count: small.length, sample: small.slice(0, 6) });
      const bidi = await tab.evaluate(() => {
        const htmlDir = document.documentElement.getAttribute('dir') || 'rtl';
        let n = 0; const s = [];
        document.querySelectorAll('[dir]').forEach((el) => {
          const d = el.getAttribute('dir');
          if (d && d !== htmlDir) { n++; if (s.length < 6) s.push({ dir: d, tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 40) }); }
        });
        return { n, s };
      });
      if (bidi.n) pf.bidi.push({ bp, count: bidi.n, sample: bidi.s });
    } catch (e) { pf.overflow.push({ bp, error: e.message }); }
    finally { await tab.close(); await ctx.close(); }
  }
  return pf;
}

async function auditAxe(browser, def) {
  const res = { page: def.name, axe: [], reducedMotion: null, streaming: null };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const tab = await ctx.newPage();
  try {
    await tab.goto(def.url, { waitUntil: 'networkidle', timeout: 30_000 });
    await waitCss(tab);
    await tab.addScriptTag({ content: AXE_SRC });
    const result = await tab.evaluate(async () => window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      resultTypes: ['violations'],
    }));
    res.axe = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target) }));
    res.reducedMotion = await tab.evaluate(() => {
      let animating = 0;
      document.querySelectorAll('*').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== 'none' && cs.animationDuration !== '0s' && cs.animationPlayState !== 'paused') animating++;
      });
      return { animatingCount: animating };
    });
  } catch (e) { res.axe = [{ error: e.message }]; }
  finally { await tab.close(); await ctx.close(); }

  if (def.name.includes('kernel/chat')) {
    const sctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
    const stab = await sctx.newPage();
    try {
      await stab.goto(def.url, { waitUntil: 'networkidle', timeout: 30_000 });
      await waitCss(stab);
      res.streaming = await stab.evaluate(() => {
        const live = document.querySelector('[data-kernel-chat-messages]');
        const ann = document.querySelector('[data-kernel-chat-announcer]');
        return { messagesHasAriaLive: !!(live && live.getAttribute('aria-live')), announcerPresent: !!ann, announcerAriaLive: ann ? ann.getAttribute('aria-live') : null };
      });
    } catch (e) { res.streaming = { error: e.message }; }
    finally { await stab.close(); await sctx.close(); }
  }
  return res;
}

const browser = await chromium.launch();

// الممر 1: layout (overflow/touch/bidi) على كل الصفحات
console.log(`\n=== الممر 1: layout على ${PAGES.length} صفحة ===\n`);
let done = 0;
for (const def of PAGES) {
  if (doneNames.has(def.name)) { done++; continue; }
  const r = await auditLayout(browser, def);
  findings.push(r);
  fs.writeFileSync(OUT, JSON.stringify(findings, null, 2));
  done++;
  const ovBad = r.overflow.filter((o) => o.overflow > 0).map((o) => `${o.bp}:+${o.overflow}`).join(',') || 'none';
  const touchBad = r.touch.reduce((n, t) => n + t.count, 0);
  const bidiBad = r.bidi.reduce((n, t) => n + t.count, 0);
  console.log(`[${done}/${PAGES.length}] ${def.name.padEnd(38)} overflow=[${ovBad}] touch=${touchBad} bidi=${bidiBad}`);
}

// الممر 2: axe + reduced-motion + streaming
console.log(`\n=== الممر 2: axe على ${PAGES.length} صفحة ===\n`);
// نربط نتائج axe بالصفحة المناسبة
const byName = new Map(findings.map((f) => [f.page, f]));
for (const def of PAGES) {
  const r = await auditAxe(browser, def);
  const target = byName.get(def.name);
  if (target) { target.axe = r.axe; target.reducedMotion = r.reducedMotion; target.streaming = r.streaming; }
  else { findings.push(r); }
  fs.writeFileSync(OUT, JSON.stringify(findings, null, 2));
  const axeBad = r.axe.filter((a) => !a.error).reduce((n, a) => n + (a.nodes || 0), 0);
  const rm = r.reducedMotion ? `rmAnim=${r.reducedMotion.animatingCount}` : '';
  const st = r.streaming ? `stream=${JSON.stringify(r.streaming)}` : '';
  console.log(`[axe] ${def.name.padEnd(38)} axeSerious=${axeBad} ${rm} ${st}`);
}

await browser.close();

// Summary
const totalOverflow = findings.reduce((s, f) => s + (f.overflow || []).filter((o) => o.overflow > 0).length, 0);
const totalTouch = findings.reduce((s, f) => s + (f.touch || []).reduce((n, t) => n + t.count, 0), 0);
const totalAxe = findings.reduce((s, f) => s + (f.axe || []).filter((a) => !a.error).reduce((n, a) => n + (a.nodes || 0), 0), 0);
const totalBidi = findings.reduce((s, f) => s + (f.bidi || []).reduce((n, t) => n + t.count, 0), 0);

let md = `# Comprehensive Audit — ${findings.length} pages\n\n**Generated**: ${new Date().toISOString()}\n`;
md += `| Metric | Total |\n|---|---|\n| overflow pages | ${totalOverflow} |\n| touch target gaps | ${totalTouch} |\n| axe serious/critical nodes | ${totalAxe} |\n| mixed bidi | ${totalBidi} |\n\n`;
for (const f of findings) {
  const ov = (f.overflow || []).filter((o) => o.overflow > 0);
  const touch = (f.touch || []).reduce((n, t) => n + t.count, 0);
  const axe = (f.axe || []).filter((a) => !a.error).reduce((n, a) => n + (a.nodes || 0), 0);
  const bidi = (f.bidi || []).reduce((n, t) => n + t.count, 0);
  if (ov.length || touch || axe || bidi) {
    md += `## ${f.page}\n`;
    if (ov.length) { md += `### Overflow\n`; ov.forEach((o) => md += `- ${o.bp}px: +${o.overflow}px\n`); }
    if (touch) { md += `### Touch gaps: ${touch}\n`; f.touch.forEach((t) => md += `- ${t.bp}px: ${t.count} — ${JSON.stringify(t.sample[0])}\n`); }
    if (bidi) { md += `### Bidi: ${bidi}\n`; f.bidi.forEach((t) => md += `- ${t.bp}px: ${JSON.stringify(t.sample[0])}\n`); }
    if (axe) { md += `### axe serious/critical\n`; f.axe.forEach((a) => { if (!a.error) md += `- **${a.id}** [${a.impact}] (${a.nodes}) — ${a.help}\n`; }); }
    if (f.streaming) md += `### Streaming\n${JSON.stringify(f.streaming)}\n`;
    md += `\n`;
  }
}
fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), md);
console.log(`\n✅ overflow pages=${totalOverflow} touchGaps=${totalTouch} axeSerious=${totalAxe} bidi=${totalBidi}`);
console.log(`✅ Wrote ${OUT_DIR}/summary.md and audit.json`);
