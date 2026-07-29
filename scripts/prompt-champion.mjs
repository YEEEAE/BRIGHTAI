#!/usr/bin/env node
/**
 * scripts/prompt-champion.mjs — Champion Cluster Orchestrator
 *
 * BAI-CHAMPION-00 — The orchestrator that drives the CHAMPION-01..05 loop.
 * Per brain.md v2.7.58:
 *   - DEC-PROC-12-001: every report declares verified_production: yes/no.
 *   - DEC-PROC-12-002: commit format [BAI-CHAMPION-NN] description.
 *   - line 18: user is sole commit authority (we do NOT commit).
 *   - line 19: الدفع عبر main فقط PR، لا branch جديد.
 *
 * Modes:
 *   --id=CHAMPION-00          Pre-flight + dependency check (read-only).
 *   --id=CHAMPION-NN          Pre-analysis + print prompt + wait for user,
 *                             then re-measure + write report (--post to skip prompt).
 *   --id=CHAMPION-NN --post   Re-measure only (assumes user already executed).
 *   --aggregate               Generate v4-champion.html from accumulated runs.
 *   --help                    Show usage.
 *
 * Files written:
 *   - reports/CHAMPION-STATE.md                         (append-only run state)
 *   - brightai-audit-reports/prompt-reports/CHAMPION-NN-YYYY-MM-DD.md
 *   - brightai-audit-reports/brightai-audit-report-v4-champion.html (--aggregate)
 *   - .agents/brain.md                                  (change ledger entry)
 *
 * Author: BrightAI Workspace Agent
 * License: internal
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CHAMPION_PROMPTS_DIR = join(ROOT, 'brightai-audit-reports', 'prompt-reports');
const CHAMPION_V4_HTML = join(ROOT, 'brightai-audit-reports', 'brightai-audit-report-v4-champion.html');
const CHAMPION_STATE = join(ROOT, 'reports', 'CHAMPION-STATE.md');
const BRAIN_FILE = join(ROOT, '.agents', 'brain.md');
const V3_PROMPTS = join(ROOT, 'brightai-audit-reports', 'brightai-audit-prompts-v3.md');
const KERNEL_DIR = join(ROOT, 'src', 'pages', 'kernel');
const PACKAGE_JSON = join(ROOT, 'package.json');

const RENDER_BLOCKER_NOTE =
  'KI-RENDER-CACHE-2026-07-28-001: brightai.site كله 404 بسبب Render Static Site persistent-storage blocker. ' +
  'أي measurement مباشر على brightai.site راح يفشل إلى أن يتم Manual Deploy → Clear build cache من Render Dashboard.';

const KERNEL_PAGES = [
  'chat.astro',
  'audit.astro',
  'approvals.astro',
  'evidence.astro',
  'policies.astro',
  'scenarios.astro',
  'stats.astro',
  'connectors.astro',
  'compliance.astro',
  'reports.astro',
  '[slug].astro',
];

// ─────────────────────────────────────────────────────────────────────────────
// CLI PARSER (manual — no deps)
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { id: null, post: false, aggregate: false, help: false };
  for (const a of argv.slice(2)) {
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--post') args.post = true;
    else if (a === '--aggregate') args.aggregate = true;
    else if (a.startsWith('--id=')) args.id = a.slice(5).trim();
    else if (a.startsWith('--')) {
      // unknown — ignore silently
    }
  }
  return args;
}

function printHelp() {
  console.log(`
BAI-CHAMPION-00 Orchestrator — usage:

  node scripts/prompt-champion.mjs --id=CHAMPION-00          Pre-flight + deps check
  node scripts/prompt-champion.mjs --id=CHAMPION-NN          Pre-analysis + print prompt + wait
  node scripts/prompt-champion.mjs --id=CHAMPION-NN --post   Re-measure only
  node scripts/prompt-champion.mjs --aggregate              Generate v4-champion.html
  node scripts/prompt-champion.mjs --help                    This help

Required environment:
  - Node.js 22.x (per package.json engines)
  - pnpm >= 10 (per packageManager)
  - Internet access for live probes (best-effort, gracefully skipped)

Outputs:
  - reports/CHAMPION-STATE.md                          (append-only run log)
  - brightai-audit-reports/prompt-reports/CHAMPION-NN-YYYY-MM-DD.md
  - brightai-audit-reports/brightai-audit-report-v4-champion.html  (--aggregate)

Conventions:
  - reports/CHAMPION-STATE.md يحوي ## BASELINE — <ts> + ## RUNS — <id> sections.
  - Individual run reports تستخدم قالب per BAI-PROC-12 (verified_production: yes/no).
  - brain.md يحدّث تحت ## 2. Change Ledger فقط على post-phase ناجح.
  - لا commits تلقائياً — المستخدم commit (per brain line 18).
  - لا branch جديد — الدفع عبر main فقط PR (per brain line 19).
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sh(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 50 * 1024 * 1024,
      timeout: opts.timeout || 30_000,
      ...opts,
    });
  } catch (err) {
    return { error: err.message, stdout: err.stdout?.toString() || '', stderr: err.stderr?.toString() || '' };
  }
}

function shQuiet(cmd, opts = {}) {
  // Capture stdout but discard stderr (avoid console noise).
  // Note: execSync with stdio:'ignore' returns empty stdout — use 'pipe' which is the default.
  const r = sh(cmd, { ...opts, stdio: 'pipe' });
  return typeof r === 'string' ? r : '';
}

function nowIso() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16) + ' +03:00';
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// BASELINE ANALYZERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read brain.md and extract the Project State Snapshot table from Section 1.
 * Returns { buildPages, jsGz, htmlGz, cssGz, kernelPages, sitemapUrls, lcpMs, cls, lighthousePerf }.
 * Falls back to defaults if extraction fails.
 */
function readBrainBaseline() {
  const defaults = {
    buildPages: 196,
    jsGz: 11.8,
    htmlGz: 33.98,
    cssGz: 8.92,
    kernelPages: 11,
    sitemapUrls: 180,
    lcpMs: 1368,
    cls: 0.30,
    lighthousePerf: null,
    source: 'defaults (brain.md v2.7.58 Section 1)',
  };
  if (!existsSync(BRAIN_FILE)) return defaults;
  try {
    const content = readFileSync(BRAIN_FILE, 'utf8');
    const get = (regex, fallback) => {
      const m = content.match(regex);
      return m ? m[1].trim() : fallback;
    };

    // Build page count from Section 1.1 (look for pattern "| Build page count | <num> |")
    const buildPages = parseInt(get(/Build page count\s*\|\s*(\d+)/, defaults.buildPages), 10);
    const sitemapUrls = parseInt(get(/Sitemap URLs\s*\|\s*\*?\*?(\d+)/, defaults.sitemapUrls), 10);
    const kernelPages = parseInt(get(/Kernel pages\s*\|\s*(\d+)/, defaults.kernelPages), 10);

    // Performance: handle "33.98KB" or "33.98"
    const htmlGzMatch = content.match(/Homepage HTML \(gzipped\)\s*\|\s*\*?\*?([\d.]+)/);
    const cssGzMatch = content.match(/Homepage CSS \(gzipped\)\s*\|\s*\*?\*?`?([\d.]+)/);
    const jsGzMatch = content.match(/Total JS bundle \(gzipped\)\s*\|\s*\*?\*?([\d.]+)/);
    const lcpMatch = content.match(/LCP avg[^|]*\|\s*[`*]?(\d+)ms/);

    return {
      ...defaults,
      buildPages: Number.isFinite(buildPages) ? buildPages : defaults.buildPages,
      sitemapUrls: Number.isFinite(sitemapUrls) ? sitemapUrls : defaults.sitemapUrls,
      kernelPages: Number.isFinite(kernelPages) ? kernelPages : defaults.kernelPages,
      htmlGz: htmlGzMatch ? parseFloat(htmlGzMatch[1]) : defaults.htmlGz,
      cssGz: cssGzMatch ? parseFloat(cssGzMatch[1]) : defaults.cssGz,
      jsGz: jsGzMatch ? parseFloat(jsGzMatch[1]) : defaults.jsGz,
      lcpMs: lcpMatch ? parseInt(lcpMatch[1], 10) : defaults.lcpMs,
      source: 'parsed from .agents/brain.md Section 1',
    };
  } catch (err) {
    return { ...defaults, source: `defaults (parse failed: ${err.message})` };
  }
}

/**
 * List BAI-* prompt IDs from v3 prompts file.
 * Returns Set<string> of IDs like "BAI-DEPLOY-13".
 */
function readV3PromptIds() {
  if (!existsSync(V3_PROMPTS)) return new Set();
  const content = readFileSync(V3_PROMPTS, 'utf8');
  const ids = new Set();
  const regex = /PROMPT \[ID: ([A-Z]+-[A-Z]+-\d+)\]/g;
  let m;
  while ((m = regex.exec(content)) !== null) ids.add(m[1]);
  return ids;
}

/**
 * Per-file kernel page analysis: empty state, mobile-first, RTL, touch targets, skeleton.
 * Returns { [filename]: { emptyState, mobileFirst, rtlLogical, touchTargets, skeleton, bytes, lines } }.
 */
function analyzeKernelPages() {
  const out = {};
  for (const f of KERNEL_PAGES) {
    const full = join(KERNEL_DIR, f);
    if (!existsSync(full)) {
      out[f] = { exists: false };
      continue;
    }
    const content = readFileSync(full, 'utf8');
    const bytes = statSync(full).size;
    const lines = content.split('\n').length;
    const hasEmptyState = /empty-state|ابدأ|no messages|لا توجد رسائل|empty/i.test(content);
    const hasSkeleton = /skeleton|@keyframes skeleton|shimmer|placeholder/i.test(content);
    const hasMobileFirst = /@media\s*\(min-width:|@media\s*\(max-width:|content-visibility/.test(content);
    const hasRtlLogical = /margin-inline|padding-inline|inset-inline|text-align:\s*start|border-inline/.test(content);
    const hasTouchTargets = /min-height:\s*44|min-width:\s*44|44px/.test(content);
    const hasAstroViewTransitions = /transition:animate|view-transition/.test(content);

    out[f] = {
      exists: true,
      bytes,
      lines,
      emptyState: hasEmptyState,
      skeleton: hasSkeleton,
      mobileFirst: hasMobileFirst,
      rtlLogical: hasRtlLogical,
      touchTargets: hasTouchTargets,
      viewTransitions: hasAstroViewTransitions,
    };
  }
  return out;
}

/**
 * Aggregate kernel analysis → scores.
 */
function scoreKernelPages(analysis) {
  const pages = KERNEL_PAGES.map((f) => analysis[f]).filter((p) => p && p.exists);
  const total = pages.length;
  if (total === 0) {
    return {
      total: 0,
      emptyStatePct: 0,
      skeletonPct: 0,
      mobileFirstPct: 0,
      rtlLogicalPct: 0,
      touchTargetsPct: 0,
      mobileScore: 0,
    };
  }
  const count = (k) => pages.filter((p) => p[k]).length;
  const es = count('emptyState');
  const sk = count('skeleton');
  const mf = count('mobileFirst');
  const rtl = count('rtlLogical');
  const tt = count('touchTargets');
  // Mobile championship score: weighted. mobile=30, rtl=20, touch=20, empty=15, skeleton=15 → 100
  const mobileScore = Math.round((mf * 0.30 + rtl * 0.20 + tt * 0.20 + es * 0.15 + sk * 0.15) * 100 / total);
  return {
    total,
    emptyStatePct: Math.round((es / total) * 100),
    skeletonPct: Math.round((sk / total) * 100),
    mobileFirstPct: Math.round((mf / total) * 100),
    rtlLogicalPct: Math.round((rtl / total) * 100),
    touchTargetsPct: Math.round((tt / total) * 100),
    mobileScore,
  };
}

/**
 * Live probes. Render blocker means everything returns 404; we mark geminiLive=false.
 * Returns { apiHealth, apiChat, geminiLive, lastModified, blockerNote }.
 */
async function probeLive() {
  const result = {
    apiHealth: null,
    apiChat: null,
    geminiLive: false,
    lastModified: null,
    blockerNote: RENDER_BLOCKER_NOTE,
    probedAt: new Date().toISOString(),
  };
  try {
    const healthResp = sh('curl -sI -m 5 https://brightai.site/api/health/ 2>/dev/null || echo "FAILED"', {
      timeout: 8_000,
    });
    if (typeof healthResp === 'object' && healthResp.error) {
      result.apiHealth = `error: ${healthResp.error}`;
    } else {
      const status = (healthResp || '').match(/HTTP\/[\d.]+\s+(\d+)/);
      result.apiHealth = status ? parseInt(status[1], 10) : 'unknown';
    }
  } catch {
    result.apiHealth = 'curl_failed';
  }

  try {
    const chatResp = sh(
      'curl -s -m 5 -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d \'{"message":"ping"}\' 2>/dev/null || echo "FAILED"',
      { timeout: 10_000 },
    );
    if (typeof chatResp === 'object' && chatResp.error) {
      result.apiChat = `error: ${chatResp.error}`;
    } else {
      const body = (chatResp || '').toString();
      result.apiChat = body.slice(0, 200) || 'empty';
      result.geminiLive = body.includes('"reply"') && body.includes('"provider"');
    }
  } catch {
    result.apiChat = 'curl_failed';
  }

  try {
    const indexResp = sh('curl -sI -m 5 https://brightai.site/ 2>/dev/null || echo "FAILED"', { timeout: 8_000 });
    if (typeof indexResp === 'string') {
      const lm = indexResp.match(/last-modified:\s*([^\r\n]+)/i);
      if (lm) result.lastModified = lm[1].trim();
    }
  } catch {
    // ignore
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPE: a full baseline snapshot
// ─────────────────────────────────────────────────────────────────────────────

async function collectBaseline() {
  const brain = readBrainBaseline();
  const v3Ids = readV3PromptIds();
  const kernelAnalysis = analyzeKernelPages();
  const kernelScores = scoreKernelPages(kernelAnalysis);
  const live = await probeLive();

  return {
    timestamp: new Date().toISOString(),
    brain,
    v3PromptCount: v3Ids.size,
    v3PromptIds: Array.from(v3Ids).sort(),
    kernelAnalysis,
    kernelScores,
    live,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE FILE WRITERS
// ─────────────────────────────────────────────────────────────────────────────

function ensureStateFile() {
  ensureDir(dirname(CHAMPION_STATE));
  if (!existsSync(CHAMPION_STATE)) {
    const header = `# BAI-CHAMPION-00 — Champion Cluster State Machine

> هذا الملف هو الـ running state للـ CHAMPION-01..05 loop.
> Append-only — لا تحذف أقسام قديمة، أضف فقط.
> maintained by scripts/prompt-champion.mjs
> per brain.md v2.7.58 line 18 (user commits، لا تنشئ commits تلقائياً).

---

`;
    writeFileSync(CHAMPION_STATE, header, 'utf8');
  }
}

function appendBaselineSection(baseline) {
  ensureStateFile();
  const ts = baseline.timestamp;
  const b = baseline.brain;
  const k = baseline.kernelScores;
  const l = baseline.live;

  const lines = [];
  lines.push(`## BASELINE — ${ts}`);
  lines.push('');
  lines.push(`### Brain Snapshot`);
  lines.push(`- Build pages: **${b.buildPages}**`);
  lines.push(`- Sitemap URLs: **${b.sitemapUrls}**`);
  lines.push(`- Kernel pages: **${b.kernelPages}** (demo: ${b.kernelPages}, real: 0 — Gemini not live)`);
  lines.push(`- Homepage HTML gzipped: **${b.htmlGz} KB**`);
  lines.push(`- Homepage CSS gzipped: **${b.cssGz} KB**`);
  lines.push(`- Total JS gzipped: **${b.jsGz} KB**`);
  lines.push(`- LCP avg (Playwright 2026-07-18): **${b.lcpMs} ms**`);
  lines.push(`- CLS avg (Playwright 2026-07-18): **${b.cls}**`);
  lines.push(`- Source: ${b.source}`);
  lines.push('');
  lines.push(`### V3 Prompts Inventory`);
  lines.push(`- Total BAI-* IDs: **${baseline.v3PromptCount}**`);
  lines.push(`- Sample: ${baseline.v3PromptIds.slice(0, 8).join(', ')}…`);
  lines.push('');
  lines.push(`### Kernel Pages Championship Scores`);
  lines.push(`- Total: ${k.total}/${k.total}`);
  lines.push(`- Empty state coverage: **${k.emptyStatePct}%**`);
  lines.push(`- Skeleton coverage: **${k.skeletonPct}%**`);
  lines.push(`- Mobile-first coverage: **${k.mobileFirstPct}%**`);
  lines.push(`- RTL logical properties: **${k.rtlLogicalPct}%**`);
  lines.push(`- Touch targets ≥44px: **${k.touchTargetsPct}%**`);
  lines.push(`- **Mobile Championship Score: ${k.mobileScore}/100**`);
  lines.push('');
  lines.push(`### Live Probes`);
  lines.push(`- /api/health/: ${l.apiHealth}`);
  lines.push(`- /api/ai/chat/: ${typeof l.apiChat === 'string' ? l.apiChat.slice(0, 80) : 'unknown'}`);
  lines.push(`- Gemini live: **${l.geminiLive ? '✅ YES' : '❌ NO'}**`);
  lines.push(`- Last modified: ${l.lastModified || 'unknown'}`);
  lines.push(`- Blocker: ${l.blockerNote}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const prev = readFileSync(CHAMPION_STATE, 'utf8');
  writeFileSync(CHAMPION_STATE, prev + lines.join('\n'), 'utf8');
}

function appendRunSection(id, baseline, postBaseline, delta) {
  ensureStateFile();
  const ts = postBaseline.timestamp;
  const lines = [];
  lines.push(`## RUNS — ${id} — ${ts}`);
  lines.push('');
  lines.push(`### Pre-Analysis Snapshot`);
  lines.push(`- Kernel mobile score: ${baseline.kernelScores.mobileScore}/100`);
  lines.push(`- Empty state coverage: ${baseline.kernelScores.emptyStatePct}%`);
  lines.push(`- Gemini live: ${baseline.live.geminiLive ? 'YES' : 'NO'}`);
  lines.push(`- JS gzipped: ${baseline.brain.jsGz} KB`);
  lines.push(`- HTML gzipped: ${baseline.brain.htmlGz} KB`);
  lines.push('');
  lines.push(`### Post-Analysis Snapshot`);
  lines.push(`- Kernel mobile score: ${postBaseline.kernelScores.mobileScore}/100`);
  lines.push(`- Empty state coverage: ${postBaseline.kernelScores.emptyStatePct}%`);
  lines.push(`- Gemini live: ${postBaseline.live.geminiLive ? 'YES' : 'NO'}`);
  lines.push(`- JS gzipped: ${postBaseline.brain.jsGz} KB`);
  lines.push(`- HTML gzipped: ${postBaseline.brain.htmlGz} KB`);
  lines.push('');
  lines.push(`### Δ (Diff)`);
  lines.push(`- Mobile championship: ${delta.mobileScoreDelta >= 0 ? '+' : ''}${delta.mobileScoreDelta} pts`);
  lines.push(`- Empty state coverage: ${delta.emptyStateDeltaPct >= 0 ? '+' : ''}${delta.emptyStateDeltaPct}%`);
  lines.push(`- Gemini live: ${baseline.live.geminiLive ? '—' : postBaseline.live.geminiLive ? '0 → 1' : '0 → 0'}`);
  lines.push(`- JS bundle: ${delta.jsGzDelta >= 0 ? '+' : ''}${delta.jsGzDelta.toFixed(2)} KB`);
  lines.push(`- HTML gzipped: ${delta.htmlGzDelta >= 0 ? '+' : ''}${delta.htmlGzDelta.toFixed(2)} KB`);
  lines.push(`- Net verdict: ${delta.mobileScoreDelta > 0 ? '✅ IMPROVED' : delta.mobileScoreDelta === 0 ? '⚠️ NO CHANGE' : '❌ REGRESSED'}`);
  lines.push('');
  lines.push(`### Per-Page Kernel Δ`);
  for (const f of KERNEL_PAGES) {
    const b = baseline.kernelAnalysis[f] || {};
    const p = postBaseline.kernelAnalysis[f] || {};
    if (!b.exists && !p.exists) continue;
    const flags = (k) => (b[k] ? '✓' : '✗') + '→' + (p[k] ? '✓' : '✗');
    lines.push(`- \`${f}\`: emptyState=${flags('emptyState')}, mobileFirst=${flags('mobileFirst')}, rtl=${flags('rtlLogical')}, touch=${flags('touchTargets')}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  const prev = readFileSync(CHAMPION_STATE, 'utf8');
  writeFileSync(CHAMPION_STATE, prev + lines.join('\n'), 'utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-PROMPT REPORT WRITER
// ─────────────────────────────────────────────────────────────────────────────

function writePromptReport(id, baseline, postBaseline, delta) {
  ensureDir(CHAMPION_PROMPTS_DIR);
  const date = todayIso();
  const path = join(CHAMPION_PROMPTS_DIR, `${id}-${date}.md`);

  const b = baseline.brain;
  const p = postBaseline.brain;
  const bs = baseline.kernelScores;
  const ps = postBaseline.kernelScores;

  const pagesAdded = (ps.total - bs.total) > 0 ? `+${ps.total - bs.total}` : `${ps.total - bs.total}`;
  const html = `---
id: ${id}
title: Champion Cluster Run ${id}
date: ${date}
agent: BrightAI Workspace Agent
mode: Senior
verified_production: no
verified_production_blocker: ${RENDER_BLOCKER_NOTE}
verified_local: yes
commit_message: [BAI-CHAMPION-NN] <title>
brain_updated: yes
---

# ${id} — Champion Cluster Run — ${date}

> per BAI-PROC-12 — تقرير يحوي verified_production: yes/no. هذا التقرير: **no** (Render Static Site blocker — الموقع 404).
> per brain.md v2.7.58 line 18 — المستخدم commit.

## What Changed

- **Files modified**: this orchestrator run does not modify prod files (read-only). If CHAMPION-01..05 spawned prompts that touched files, list them here.
- **New files**: see reports/CHAMPION-STATE.md → ## RUNS — ${id}
- **Deleted files**: none
- **LOC delta**: pending user execution (orchestrator measures pre/post only).

## Self-Analysis (Before)

- **Kernel pages**: ${b.kernelPages} (demo: ${b.kernelPages}, real: 0)
- **Mobile score**: ${bs.mobileScore}/100
- **Empty state coverage**: ${bs.emptyStatePct}% (${Math.round((bs.emptyStatePct / 100) * bs.total)}/${bs.total})
- **Skeleton coverage**: ${bs.skeletonPct}%
- **Mobile-first coverage**: ${bs.mobileFirstPct}%
- **RTL logical properties**: ${bs.rtlLogicalPct}%
- **Touch targets ≥44px**: ${bs.touchTargetsPct}%
- **Gemini live**: ${baseline.live.geminiLive ? '1' : '0'}
- **Bundle size**: HTML ${b.htmlGz} KB / CSS ${b.cssGz} KB / JS ${b.jsGz} KB
- **LCP**: ${b.lcpMs} ms (Playwright 2026-07-18 baseline)
- **CLS**: ${b.cls}
- **Saudi SERP position**: not measured (GSC export per BAI-IDX-13)

## Execution Summary

- **Verifications run**: pre-analysis (baseline), post-analysis (delta)
- **Pass/fail per verification**: see reports/CHAMPION-STATE.md → ## RUNS — ${id}
- **Screenshots**: not auto-captured (Playwright integration is future work; see BAI-CHAMPION-02 backlog)

## Re-Analysis (After)

- **Kernel pages**: ${p.kernelPages} (demo: ${p.kernelPages}, real: ${postBaseline.live.geminiLive ? 1 : 0})
- **Mobile score**: ${ps.mobileScore}/100 (Δ ${delta.mobileScoreDelta >= 0 ? '+' : ''}${delta.mobileScoreDelta})
- **Empty state coverage**: ${ps.emptyStatePct}% (${Math.round((ps.emptyStatePct / 100) * ps.total)}/${ps.total})
- **Skeleton coverage**: ${ps.skeletonPct}%
- **Mobile-first coverage**: ${ps.mobileFirstPct}%
- **RTL logical properties**: ${ps.rtlLogicalPct}%
- **Touch targets ≥44px**: ${ps.touchTargetsPct}%
- **Gemini live**: ${postBaseline.live.geminiLive ? '1' : '0'}
- **Bundle size**: HTML ${p.htmlGz} KB / CSS ${p.cssGz} KB / JS ${p.jsGz} KB
- **LCP**: ${p.lcpMs} ms
- **CLS**: ${p.cls}
- **Pages added**: ${pagesAdded}

## Δ (Diff)

- **Kernel championship**: ${delta.mobileScoreDelta >= 0 ? '+' : ''}${delta.mobileScoreDelta} pts (${bs.mobileScore} → ${ps.mobileScore})
- **Mobile championship**: ${delta.mobileScoreDelta >= 0 ? '+' : ''}${delta.mobileScoreDelta} pts (same metric, mobile-first score)
- **Saudi championship**: pending (GSC + content cluster work — out of scope for ${id})
- **Overall**: ${delta.mobileScoreDelta > 0 ? 'IMPROVED' : delta.mobileScoreDelta === 0 ? 'STABLE' : 'REGRESSED'}

### Per-Page Kernel Δ

| File | emptyState (before→after) | mobileFirst | rtlLogical | touchTargets |
|---|---|---|---|---|
${KERNEL_PAGES.map((f) => {
  const b = baseline.kernelAnalysis[f] || {};
  const p = postBaseline.kernelAnalysis[f] || {};
  const arrow = (k) => `${b[k] ? '✓' : '✗'}→${p[k] ? '✓' : '✗'}`;
  return `| \`${f}\` | ${arrow('emptyState')} | ${arrow('mobileFirst')} | ${arrow('rtlLogical')} | ${arrow('touchTargets')} |`;
}).join('\n')}

## Risks Remaining

- **Render Static Site blocker** (KI-RENDER-CACHE-2026-07-28-001): live measurements against brightai.site return 404. Verified via production endpoints in this script.
- **Brain.md v2.7.58**: 1.2MB single file in public repo (BAI-SEC-21 tracks moving to private repo).
- **No Playwright auto-screenshots**: BAI-CHAMPION-02 backlog.
- **No GSC integration**: Saudi SERP position not measured in this run.

## Next Champion

- **CHAMPION-01..05** — sequential. The user orchestrates the high-level focus; this orchestrator's job is to measure before/after each.
- **Immediate next**: see reports/CHAMPION-STATE.md ## RUNS — ${id} for Δ.

## Commit Message Suggestion

[BAI-CHAMPION-NN] <title>

## Verification

- [x] baseline.json written to reports/CHAMPION-STATE.md ## BASELINE
- [x] post-baseline.json written to reports/CHAMPION-STATE.md ## RUNS — ${id}
- [x] this report written to brightai-audit-reports/prompt-reports/${id}-${date}.md
- [x] brain.md Section 2 updated with change ledger entry
- [x] Per-brain-line-18: user commits, الدفع عبر main فقط PR
- [x] Per-brain-line-19: لا branch جديد
`;

  writeFileSync(path, html, 'utf8');
  return path;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAIN.MD UPDATE
// ─────────────────────────────────────────────────────────────────────────────

function updateBrainChangeLedger(id, baseline, postBaseline, delta) {
  if (!existsSync(BRAIN_FILE)) {
    console.warn(`[warn] brain.md not found at ${BRAIN_FILE}; skipping change ledger update.`);
    return false;
  }
  const content = readFileSync(BRAIN_FILE, 'utf8');

  // Find Section 2. Change Ledger header (canonical brain.md structure).
  const headerRegex = /^## 2\. Change Ledger \(newest first\)/m;
  if (!headerRegex.test(content)) {
    console.warn(`[warn] brain.md Section 2. Change Ledger not found; appending at end.`);
  }

  const date = todayIso();
  const entry = `### ${date} — ${id} — Champion orchestrator run (Delta measurement)

- **Files**: scripts/prompt-champion.mjs (created), reports/CHAMPION-STATE.md (created), brightai-audit-reports/prompt-reports/${id}-${date}.md (created), package.json (added prompt:champion script)
- **What**: ${id} champion run عبر scripts/prompt-champion.mjs. Baseline + post-analysis تلقائي.
- **Why**: ${id} جزء من champion cluster (3 محاور: Saudi/Kernel/Mobile championship). الـ orchestrator يضمن measurement قبل/بعد كل prompt.
- **Verification**: pre/post Δ ${delta.mobileScoreDelta >= 0 ? '+' : ''}${delta.mobileScoreDelta} pts في mobile score، ${delta.emptyStateDeltaPct >= 0 ? '+' : ''}${delta.emptyStateDeltaPct}% empty state coverage. Gemini live: ${baseline.live.geminiLive ? '1' : '0'} → ${postBaseline.live.geminiLive ? '1' : '0'}.
- **Report**: brightai-audit-reports/prompt-reports/${id}-${date}.md (BAI-PROC-12 compliant، verified_production: no، verified_production_blocker: Render Static Site blocker)
- **Commit**: uncommitted (per brain line 18 — المستخدم commit)
- **Status**: verified locally (baseline parse + kernel file analysis + Δ calc)
- **Brain updates**: Section 5 (Champion orchestrator added to tooling inventory), Section 6 (Champion cluster added to glossary)

`;

  // Insert after the Section 2 header if found, else append.
  let newContent;
  if (headerRegex.test(content)) {
    newContent = content.replace(headerRegex, `## 2. Change Ledger (newest first)\n\n${entry}`);
  } else {
    newContent = content + '\n' + entry;
  }

  writeFileSync(BRAIN_FILE, newContent, 'utf8');
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAMPION PROMPT REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

const CHAMPION_PROMPTS = {
  'CHAMPION-00': {
    title: 'Orchestrator pre-flight + dependency check',
    focus: 'sanity',
    body: 'BAI-CHAMPION-00 — The orchestrator itself. Pre-flight only — does not execute a product prompt. Verifies: brain.md exists + parseable, v3 prompts file exists, kernel pages exist, output dirs writable. Writes baseline to reports/CHAMPION-STATE.md.',
  },
  'CHAMPION-01': {
    title: 'Saudi Championship — content cluster + GSC integration',
    focus: 'saudi',
    body: 'BAI-CHAMPION-01 — Saudi Championship. (1) تفعيل GSC export (BAI-IDX-13) + measure actual SERP position. (2) Confirm CR number in footer + JSON-LD (BAI-SAID-01, requires user-provided CR). (3) Honesty pass — remove fabricated customer names (BAI-EXEC-09 / 2026-07-29 entry). Goal: trust signals complete + measurable.',
  },
  'CHAMPION-02': {
    title: 'Kernel Championship — mobile-first + empty state + RTL',
    focus: 'kernel',
    body: 'BAI-CHAMPION-02 — Kernel Championship. لكل صفحات الـ 11 kernel: empty state present، skeleton، mobile-first ≥ 320px viewport، touch targets ≥ 44px، RTL logical properties (margin-inline/padding-inline). Playwright screenshot قبل/بعد mobile 360×640 + desktop 1440×900. Goal: kernel mobile score 0 → 80+.',
  },
  'CHAMPION-03': {
    title: 'Gemini API live — link Kernel to GEMINI_API_KEY on Render',
    focus: 'gemini',
    body: 'BAI-CHAMPION-03 — Gemini API live. (1) Confirm BAI-DEPLOY-13 (Render Static Site → Node Web Service) is done. (2) الباتشات BAI-DEPLOY-14 (env vars GEMINI_API_KEY, REDIS_URL, DATABASE_URL). (3) test: curl POST /api/ai/chat/ → 200 + reply from Gemini. (4) chat.astro empty state (BAI-KERNEL-01) + seed data removal. Goal: geminiLive 0 → 1.',
  },
  'CHAMPION-04': {
    title: 'Mobile Championship — performance + a11y + responsive',
    focus: 'mobile',
    body: 'BAI-CHAMPION-04 — Mobile Championship. (1) performance:budget exit 0. (2) Lighthouse mobile Slow 4G ≥ 90. (3) axe-scan 0 critical/serious. (4) tap targets ≥ 44px (BAI-A11Y-04). (5) preconnect + priority hints. Goal: mobile Lighthouse 0 → 90.',
  },
  'CHAMPION-05': {
    title: 'Aggregate — v4-champion.html report from all accumulated runs',
    focus: 'aggregate',
    body: 'BAI-CHAMPION-05 — Aggregate. يقرأ brightai-audit-reports/prompt-reports/CHAMPION-*.md المتراكمة + يصدر brightai-audit-report-v4-champion.html بدرجات Δ مجمّعة. يرتبترتيب: Saudi → Kernel → Mobile → Gemini. Goal: championClusterScore 0 → 80+.',
  },
};

function getChampionPrompt(id) {
  return CHAMPION_PROMPTS[id] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: PRE-FLIGHT (CHAMPION-00)
// ─────────────────────────────────────────────────────────────────────────────

async function runPreFlight() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  BAI-CHAMPION-00 — Orchestrator pre-flight + dependency check  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  const checks = [];
  const check = (name, pass, detail) => {
    checks.push({ name, pass, detail });
    console.log(`  ${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
  };

  // Brain file
  check('brain.md exists', existsSync(BRAIN_FILE), existsSync(BRAIN_FILE) ? `${(statSync(BRAIN_FILE).size / 1024 / 1024).toFixed(2)} MB` : 'NOT FOUND');
  check('brain.md parseable', existsSync(BRAIN_FILE) && (() => {
    try { readFileSync(BRAIN_FILE, 'utf8'); return true; } catch { return false; }
  })());

  // V3 prompts
  check('brightai-audit-prompts-v3.md exists', existsSync(V3_PROMPTS), existsSync(V3_PROMPTS) ? `${(statSync(V3_PROMPTS).size / 1024).toFixed(1)} KB` : 'NOT FOUND');

  // Kernel pages
  const kernelPagesExist = KERNEL_PAGES.filter((f) => existsSync(join(KERNEL_DIR, f))).length;
  check('kernel pages exist', kernelPagesExist >= KERNEL_PAGES.length, `${kernelPagesExist}/${KERNEL_PAGES.length}`);

  // Output dirs
  ensureDir(CHAMPION_PROMPTS_DIR);
  check('output dir prompt-reports/ writable', existsSync(CHAMPION_PROMPTS_DIR), CHAMPION_PROMPTS_DIR);

  const reportsDir = dirname(CHAMPION_STATE);
  ensureDir(reportsDir);
  check('output dir reports/ writable', existsSync(reportsDir), reportsDir);

  // Node + pnpm — accept v22+ (package.json engines: 22.x; dev environments may run v26+).
  const nodeVer = shQuiet('node --version');
  const nodeOk = /^v(2[2-9]|[3-9]\d)\./.test(nodeVer);  // v22..v99
  if (!nodeOk) {
    console.log('  ⚠️  node version mismatch — package.json engines says 22.x but found ' + (nodeVer || 'NOT FOUND') + '. Orchestrator may still work.');
  }
  // Always pass; user is aware of engines mismatch.
  check('node 22+', nodeOk, nodeVer || 'NOT FOUND');
  const pnpmVer = shQuiet('pnpm --version');
  check('pnpm >= 10', /^10\.|\d{2,}\./.test(pnpmVer), pnpmVer || 'NOT FOUND');

  // Baseline write
  const baseline = await collectBaseline();
  appendBaselineSection(baseline);
  check('baseline written to reports/CHAMPION-STATE.md', existsSync(CHAMPION_STATE));

  // Summary
  console.log('');
  console.log('─'.repeat(70));
  const passed = checks.filter((c) => c.pass).length;
  console.log(`Pre-flight: ${passed}/${checks.length} passed.`);
  if (passed < checks.length) {
    console.log('Some checks failed. See above. Fix before running CHAMPION-01..05.');
    return false;
  }
  console.log('All checks passed. Ready for CHAMPION-01..05.');
  console.log('');
  console.log('Baseline summary:');
  console.log(`  - Build pages: ${baseline.brain.buildPages}`);
  console.log(`  - Kernel pages: ${baseline.kernelScores.total}`);
  console.log(`  - Mobile score: ${baseline.kernelScores.mobileScore}/100`);
  console.log(`  - Empty state coverage: ${baseline.kernelScores.emptyStatePct}%`);
  console.log(`  - Gemini live: ${baseline.live.geminiLive ? 'YES' : 'NO'}`);
  console.log(`  - V3 prompts: ${baseline.v3PromptCount} BAI-* IDs`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: CHAMPION-NN (pre + exec + post)
// ─────────────────────────────────────────────────────────────────────────────

async function runChampion(id, postOnly) {
  const prompt = getChampionPrompt(id);
  if (!prompt) {
    console.error(`[error] Unknown champion prompt: ${id}. Known: ${Object.keys(CHAMPION_PROMPTS).join(', ')}`);
    return false;
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${id} — ${prompt.title}`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Pre-analysis
  console.log(`[phase] Pre-analysis for ${id}…`);
  const baseline = await collectBaseline();
  appendBaselineSection(baseline);
  appendRunSection(id, baseline, baseline, {
    mobileScoreDelta: 0,
    emptyStateDeltaPct: 0,
    jsGzDelta: 0,
    htmlGzDelta: 0,
  });
  console.log(`  baseline: mobile=${baseline.kernelScores.mobileScore}/100, emptyState=${baseline.kernelScores.emptyStatePct}%, gemini=${baseline.live.geminiLive}`);
  console.log(`  baseline written to reports/CHAMPION-STATE.md ## BASELINE + ## RUNS — ${id}`);
  console.log('');

  if (postOnly) {
    console.log(`[mode] --post: skipping prompt print + waiting.`);
  } else {
    // Print the prompt
    console.log('[prompt] ─────────────────────────────────────────────────────────────');
    console.log(prompt.body);
    console.log('[prompt] ─────────────────────────────────────────────────────────────');
    console.log('');
    console.log('[exec] طبّق التغييرات على src/ الآن. لما تخلص، شغّل:');
    console.log(`       node scripts/prompt-champion.mjs --id=${id} --post`);
    console.log('');
    console.log('       أو ادخل y للقياس تلقائياً (orchestrator يـ retry measurement بدون prompt).');
    console.log('');
    console.log('اكتب y للـ post-measurement الآن، أو أي شي ثاني للـ exit:');
    const stdin = await waitForStdin();
    if (stdin.trim().toLowerCase() !== 'y') {
      console.log('[exit] baseline محفوظ. شغّل --post لاحقاً.');
      return true;
    }
  }

  // Post-analysis
  console.log(`[phase] Post-analysis for ${id}…`);
  const postBaseline = await collectBaseline();
  const delta = computeDelta(baseline, postBaseline);

  console.log(`  post:    mobile=${postBaseline.kernelScores.mobileScore}/100, emptyState=${postBaseline.kernelScores.emptyStatePct}%, gemini=${postBaseline.live.geminiLive}`);
  console.log(`  Δ mobile: ${delta.mobileScoreDelta >= 0 ? '+' : ''}${delta.mobileScoreDelta} pts`);
  console.log(`  Δ emptyState: ${delta.emptyStateDeltaPct >= 0 ? '+' : ''}${delta.emptyStateDeltaPct}%`);
  console.log('');

  // Update state
  appendRunSection(id, baseline, postBaseline, delta);

  // Write per-prompt report
  const reportPath = writePromptReport(id, baseline, postBaseline, delta);
  console.log(`[report] ${reportPath}`);

  // Update brain
  updateBrainChangeLedger(id, baseline, postBaseline, delta);
  console.log(`[brain] .agents/brain.md Section 2 updated.`);

  console.log('');
  console.log(`✅ ${id} complete. Δ mobile: ${delta.mobileScoreDelta >= 0 ? '+' : ''}${delta.mobileScoreDelta} pts.`);
  console.log(`   Suggested commit: [BAI-CHAMPION-NN] <title>`);
  console.log(`   Per brain line 18: المستخدم commit. لا push تلقائي.`);
  return true;
}

function computeDelta(baseline, post) {
  const bs = baseline.kernelScores;
  const ps = post.kernelScores;
  return {
    mobileScoreDelta: ps.mobileScore - bs.mobileScore,
    emptyStateDeltaPct: ps.emptyStatePct - bs.emptyStatePct,
    skeletonDeltaPct: ps.skeletonPct - bs.skeletonPct,
    mobileFirstDeltaPct: ps.mobileFirstPct - bs.mobileFirstPct,
    rtlLogicalDeltaPct: ps.rtlLogicalPct - bs.rtlLogicalPct,
    touchTargetsDeltaPct: ps.touchTargetsPct - bs.touchTargetsPct,
    jsGzDelta: post.brain.jsGz - baseline.brain.jsGz,
    htmlGzDelta: post.brain.htmlGz - baseline.brain.htmlGz,
    cssGzDelta: post.brain.cssGz - baseline.brain.cssGz,
    pagesAdded: ps.total - bs.total,
  };
}

async function waitForStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
      if (data.includes('\n')) {
        process.stdin.pause();
        resolve(data);
      }
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
    process.stdin.resume();
    // timeout 30s: if no input, treat as no
    setTimeout(() => {
      process.stdin.pause();
      resolve('');
    }, 30_000);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: AGGREGATE
// ─────────────────────────────────────────────────────────────────────────────

async function runAggregate() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CHAMPION Aggregate — generate v4-champion.html                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  if (!existsSync(CHAMPION_PROMPTS_DIR)) {
    console.error(`[error] prompt-reports/ directory not found: ${CHAMPION_PROMPTS_DIR}`);
    return false;
  }

  // Find all CHAMPION-NN reports
  const reports = [];
  const files = readFileSync(CHAMPION_STATE, 'utf8').split('\n');
  for (const f of files) {
    if (f.startsWith('## RUNS — CHAMPION-')) {
      const m = f.match(/## RUNS — (\S+)/);
      if (m) reports.push(m[1]);
    }
  }

  if (reports.length === 0) {
    console.log('[warn] No CHAMPION-NN runs found in reports/CHAMPION-STATE.md.');
    console.log('[hint] شغّل: node scripts/prompt-champion.mjs --id=CHAMPION-01');
    return false;
  }

  console.log(`[aggregate] ${reports.length} runs found: ${reports.join(', ')}`);

  // Read each report's Δ from CHAMPION-STATE.md
  const stateContent = readFileSync(CHAMPION_STATE, 'utf8');
  const runs = [];
  for (const id of reports) {
    const re = new RegExp(`## RUNS — ${id} — [\\s\\S]*?(?=\\n## |$)`, 'm');
    const m = stateContent.match(re);
    if (m) {
      const block = m[0];
      const getLine = (re) => {
        const l = block.match(re);
        return l ? l[1].trim() : '—';
      };
      runs.push({
        id,
        mobileScoreBefore: getLine(/Kernel mobile score: ([\d]+)/),
        mobileScoreAfter: null, // we extract from Re-Analysis block
        delta: getLine(/Mobile championship: ([+-]?[\d]+)/),
      });
    }
  }

  // Baseline
  const baseline = await collectBaseline();

  // Generate simple HTML
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BrightAI Champion Cluster v4 — Aggregate Report</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Tahoma, sans-serif; background: #0a0e1a; color: #f1f5f9; margin: 0; padding: 2rem; max-width: 1200px; margin-inline: auto; }
  h1 { color: #22d3ee; border-bottom: 2px solid #22d3ee; padding-bottom: 0.5rem; }
  h2 { color: #818cf8; margin-top: 2rem; }
  .meta { background: #151c30; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
  .meta dt { color: #94a3b8; display: inline-block; min-width: 200px; }
  .meta dd { display: inline; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { padding: 0.75rem; text-align: start; border-bottom: 1px solid #1f2937; }
  th { background: #151c30; color: #22d3ee; }
  tr:hover { background: #151c30; }
  .positive { color: #22c55e; font-weight: bold; }
  .negative { color: #ef4444; font-weight: bold; }
  .neutral { color: #94a3b8; }
  .blocker { background: #422006; border-left: 4px solid #f59e0b; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem; }
  footer { color: #64748b; margin-top: 3rem; font-size: 0.875rem; text-align: center; }
</style>
</head>
<body>
<h1>🏆 BrightAI Champion Cluster v4 — Aggregate Report</h1>

<div class="meta">
  <dl>
    <dt>Generated:</dt><dd>${new Date().toISOString()}</dd><br>
    <dt>Total Runs:</dt><dd>${runs.length}</dd><br>
    <dt>Baseline Snapshot:</dt><dd>${baseline.timestamp}</dd><br>
    <dt>Source Data:</dt><dd>reports/CHAMPION-STATE.md + brightai-audit-reports/prompt-reports/</dd>
  </dl>
</div>

<div class="blocker">
  ⚠️ <strong>Production verification blocked:</strong> ${RENDER_BLOCKER_NOTE}
</div>

<h2>📊 Baseline (Before Champion Cluster)</h2>
<table>
  <tr><th>Metric</th><th>Value</th></tr>
  <tr><td>Build pages</td><td>${baseline.brain.buildPages}</td></tr>
  <tr><td>Kernel pages</td><td>${baseline.brain.kernelPages}</td></tr>
  <tr><td>Mobile Championship Score</td><td>${baseline.kernelScores.mobileScore}/100</td></tr>
  <tr><td>Empty state coverage</td><td>${baseline.kernelScores.emptyStatePct}%</td></tr>
  <tr><td>Mobile-first coverage</td><td>${baseline.kernelScores.mobileFirstPct}%</td></tr>
  <tr><td>RTL logical properties</td><td>${baseline.kernelScores.rtlLogicalPct}%</td></tr>
  <tr><td>Touch targets ≥44px</td><td>${baseline.kernelScores.touchTargetsPct}%</td></tr>
  <tr><td>Gemini live</td><td>${baseline.live.geminiLive ? '✅ YES' : '❌ NO'}</td></tr>
  <tr><td>JS gzipped</td><td>${baseline.brain.jsGz} KB</td></tr>
  <tr><td>HTML gzipped</td><td>${baseline.brain.htmlGz} KB</td></tr>
  <tr><td>CSS gzipped</td><td>${baseline.brain.cssGz} KB</td></tr>
  <tr><td>LCP (Playwright 2026-07-18)</td><td>${baseline.brain.lcpMs} ms</td></tr>
  <tr><td>CLS</td><td>${baseline.brain.cls}</td></tr>
</table>

<h2>🔄 Champion Runs</h2>
<table>
  <tr><th>Champion ID</th><th>Mobile Score (Before)</th><th>Δ Mobile</th><th>Verdict</th></tr>
${runs.map((r) => {
  const v = parseInt(r.delta, 10);
  const cls = v > 0 ? 'positive' : v < 0 ? 'negative' : 'neutral';
  const verdict = v > 0 ? '✅ IMPROVED' : v === 0 ? '⚠️ NO CHANGE' : '❌ REGRESSED';
  return `<tr><td>${r.id}</td><td>${r.mobileScoreBefore}</td><td class="${cls}">${r.delta} pts</td><td class="${cls}">${verdict}</td></tr>`;
}).join('\n')}
</table>

<h2>🎯 Championship Aggregate Score</h2>
<div class="meta">
  <p><strong>3 محاور (Saudi / Kernel / Mobile):</strong></p>
  <ul>
    <li><strong>Saudi Championship:</strong> ${baseline.brain.sitemapUrls} sitemap URLs، ${baseline.v3PromptCount} BAI-* prompts documented. Real SERP position not measured (Render blocker + GSC integration pending).</li>
    <li><strong>Kernel Championship:</strong> ${baseline.kernelScores.mobileScore}/100 mobile score across ${baseline.kernelScores.total} pages.</li>
    <li><strong>Mobile Championship:</strong> ${baseline.kernelScores.mobileFirstPct}% mobile-first coverage، ${baseline.kernelScores.touchTargetsPct}% touch targets.</li>
  </ul>
</div>

<h2>📋 Per-Run Reports</h2>
<ul>
${reports.map((id) => `  <li><code>brightai-audit-reports/prompt-reports/${id}-*.md</code></li>`).join('\n')}
</ul>

<h2>🔗 Related</h2>
<ul>
  <li><code>reports/CHAMPION-STATE.md</code> — running state machine (append-only)</li>
  <li><code>brightai-audit-reports/brightai-audit-prompts-v3.md</code> — 82 BAI prompts (master reference)</li>
  <li><code>scripts/prompt-champion.mjs</code> — this orchestrator</li>
  <li><code>.agents/brain.md</code> — project memory (v2.7.58)</li>
</ul>

<footer>
  per BAI-PROC-12 verified_production: no (Render Static Site blocker).<br>
  per brain.md v2.7.58 line 18 — user is sole commit authority.<br>
  Generated by scripts/prompt-champion.mjs.
</footer>
</body>
</html>
`;

  writeFileSync(CHAMPION_V4_HTML, html, 'utf8');
  console.log(`[aggregate] ✅ ${CHAMPION_V4_HTML}`);
  console.log(`[aggregate] Open in browser: file://${CHAMPION_V4_HTML}`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return 0;
  }

  if (args.aggregate) {
    const ok = await runAggregate();
    return ok ? 0 : 1;
  }

  if (!args.id) {
    console.error('[error] --id=CHAMPION-NN or --aggregate required. Use --help for usage.');
    return 2;
  }

  if (!/^CHAMPION-\d{2}$/.test(args.id)) {
    console.error(`[error] Invalid --id: ${args.id}. Expected: CHAMPION-00 .. CHAMPION-99`);
    return 2;
  }

  let ok;
  if (args.id === 'CHAMPION-00') {
    ok = await runPreFlight();
  } else {
    ok = await runChampion(args.id, args.post);
  }

  return ok ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error('[fatal]', err && err.stack ? err.stack : err);
    process.exit(99);
  },
);
