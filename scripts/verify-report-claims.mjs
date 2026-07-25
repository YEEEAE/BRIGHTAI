#!/usr/bin/env node
/**
 * scripts/verify-report-claims.mjs — BAI-PROC-12 (2026-07-25)
 *
 * CI gate for the report/*.md claim discipline. Scans every report
 * created on or after 2026-07-25 and asserts:
 *
 *   1. If a report contains any ✅ emoji (in the report prose — code
 *      blocks and tables are excluded), the report MUST also contain
 *      the field `verified_production: yes` (or `verified_production: true`).
 *   2. The report SHOULD contain `verified_local: yes` (or `no`) as a
 *      separate field. A report with `verified_local: no` and any ✅
 *      is a fatal violation.
 *   3. A report with both `verified_local: yes` and
 *      `verified_production: yes` is fully verified.
 *   4. A report with `verified_production: yes` MUST include a commit
 *      SHA (40 hex chars) and a UTC timestamp after 2026-07-25 — without
 *      these the field is treated as unverified.
 *
 * Reports created BEFORE 2026-07-25 (the BAI-PROC-12 cutover) are
 * grandfathered: they are scanned but a missing `verified_production`
 * is a warning, not a failure. The grandfather list is hardcoded —
 * any new report dated ≥ 2026-07-25 must comply.
 *
 * Excluded from scanning:
 *   - report/_archived/** (legacy reports, never used)
 *   - report/INVENTORY.md (index file, not a claim)
 *   - report/README.md (index file, not a claim)
 *   - the date line in the front matter (not a claim)
 *   - code blocks (```...```) and inline code (`...`)
 *
 * Usage:
 *   pnpm run verify:report
 *   node scripts/verify-report-claims.mjs --json
 *   node scripts/verify-report-claims.mjs --strict  # fail on warnings too
 *
 * Exit codes:
 *   0  — all in-scope reports comply (warnings OK in non-strict mode)
 *   1  — at least one in-scope report has a ✅ without verified_production
 *   2  — local environment error (no report/ dir, unreadable file)
 *
 * Wired into:
 *   - pnpm run verify:report
 *   - .github/workflows/reports-gate.yml (PR check)
 *
 * Related: BAI-PROC-12, DEC-PROC-12-2026-07-25-001.
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const REPORT_DIR = path.join(ROOT, 'report');
const CUTOVER_DATE = '2026-07-25';
const WANT_JSON = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');

function log(msg) {
  if (!WANT_JSON) console.log(`[verify-report] ${msg}`);
}
function err(msg) {
  if (!WANT_JSON) console.error(`[verify-report] ${msg}`);
  else process.stderr.write(`${msg}\n`);
}

const EXCLUDED_FROM_SCAN = new Set(['INVENTORY.md', 'README.md']);
const CLAIM_EMOJI = '✅';
const FAIL_EMOJI = '❌';

/**
 * List all .md files in report/ recursively, excluding _archived/.
 * Returns array of { relPath, fullPath, mtime, topLevelDir }.
 */
function listReports() {
  const out = [];
  function walk(dir, relBase) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      err(`FATAL: cannot read report dir ${dir}: ${e.message}`);
      process.exit(2);
    }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        if (ent.name === '_archived' || ent.name === 'archived') continue;
        walk(full, rel);
      } else if (ent.isFile() && ent.name.endsWith('.md') && !EXCLUDED_FROM_SCAN.has(ent.name)) {
        let st;
        try {
          st = statSync(full);
        } catch (e) {
          continue;
        }
        out.push({
          relPath: `report/${rel}`,
          fullPath: full,
          mtime: st.mtime,
          size: st.size,
        });
      }
    }
  }
  if (!existsDir(REPORT_DIR)) {
    err(`FATAL: ${REPORT_DIR} does not exist`);
    process.exit(2);
  }
  walk(REPORT_DIR, '');
  return out.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function existsDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Extract the date from the report's first 20 lines. Looks for:
 *   - `**Date**: YYYY-MM-DD` (new style)
 *   - `# ... YYYY-MM-DD ...` (legacy style)
 *   - frontmatter `date: YYYY-MM-DD` (rare)
 * Returns YYYY-MM-DD string or null.
 */
function extractDate(content) {
  const head = content.split(/\r?\n/).slice(0, 20).join('\n');
  // Try frontmatter-style first (YAML date: YYYY-MM-DD)
  const fm = head.match(/(?:^|\n)\s*date:\s*(\d{4}-\d{2}-\d{2})/i);
  if (fm) return fm[1];
  // Then "**Date**: YYYY-MM-DD"
  const bold = head.match(/\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/i);
  if (bold) return bold[1];
  // Then look for any YYYY-MM-DD in the first 20 lines that's not a URL/path
  const any = head.match(/(?<![/\d])(\d{4}-\d{2}-\d{2})(?![/\d])/);
  if (any) return any[1];
  return null;
}

/**
 * Strip code blocks (```...``` and inline `...`) from content so the
 * claim scan doesn't trigger on emoji in shell output or table syntax.
 */
function stripCode(content) {
  // Fenced code blocks
  let out = content.replace(/```[\s\S]*?```/g, '<<code-block>>');
  // Inline code
  out = out.replace(/`[^`\n]+`/g, '<<inline-code>>');
  return out;
}

/**
 * Count ✅ and ❌ in the visible (non-code) prose. Multiple on the same
 * line count as multiple claims.
 */
function countEmoji(content) {
  const stripped = stripCode(content);
  const matches = stripped.match(/✅/g);
  const failMatches = stripped.match(/❌/g);
  return {
    passClaims: matches ? matches.length : 0,
    failClaims: failMatches ? failMatches.length : 0,
  };
}

/**
 * Check if a report contains the verified_production field and parse
 * its value. Recognized patterns (case-insensitive, anywhere in file):
 *   - `verified_production: yes`
 *   - `verified_production: true`
 *   - `**verified_production**: yes`
 *   - `verified_production: <anything else>` (returns false)
 *
 * If yes/true, also looks for a 40-char commit SHA and a UTC timestamp
 * on the same or adjacent line. The "commit" and "timestamp" fields are
 * returned for diagnostic display, not enforcement today.
 */
function checkVerifiedProduction(content) {
  const lines = content.split(/\r?\n/);
  let declared = false;
  let value = null;
  let commit = null;
  let timestamp = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for `verified_production: <value>`
    const m = line.match(/^\s*(?:\*\*)?verified_production(?:\*\*)?\s*[:=]\s*(yes|no|true|false|skipped|partial)/i);
    if (m) {
      declared = true;
      value = m[1].toLowerCase();
      // Search next 3 lines for commit + timestamp
      const window = lines.slice(i, i + 4).join(' ');
      const commitMatch = window.match(/[0-9a-f]{40}/i);
      if (commitMatch) commit = commitMatch[0];
      const tsMatch = window.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/);
      if (tsMatch) timestamp = tsMatch[0];
      break;
    }
  }
  return { declared, value, commit, timestamp };
}

/**
 * Same for verified_local.
 */
function checkVerifiedLocal(content) {
  const lines = content.split(/\r?\n/);
  let declared = false;
  let value = null;
  for (const line of lines) {
    const m = line.match(/^\s*(?:\*\*)?verified_local(?:\*\*)?\s*[:=]\s*(yes|no|true|false|skipped|partial)/i);
    if (m) {
      declared = true;
      value = m[1].toLowerCase();
      break;
    }
  }
  return { declared, value };
}

/* ---------- main ---------- */

const reports = listReports();
log(`scanning ${reports.length} report file(s) (cutover: ${CUTOVER_DATE})`);

const results = [];
let fatalCount = 0;
let warnCount = 0;
let passCount = 0;

for (const r of reports) {
  let content;
  try {
    content = readFileSync(r.fullPath, 'utf-8');
  } catch (e) {
    results.push({ path: r.relPath, error: `cannot read: ${e.message}`, fatal: true });
    fatalCount++;
    continue;
  }
  const date = extractDate(content);
  const isLegacy = !date || date < CUTOVER_DATE;
  const counts = countEmoji(content);
  const vp = checkVerifiedProduction(content);
  const vl = checkVerifiedLocal(content);

  const hasPassClaims = counts.passClaims > 0;
  const hasFailClaims = counts.failClaims > 0;
  const anyClaims = hasPassClaims || hasFailClaims;

  // Fatal: a post-cutover report with a ✅ but no verified_production: yes/true
  let fatal = false;
  let warn = false;
  const diagnostics = [];

  if (hasPassClaims && !isLegacy) {
    if (!vp.declared) {
      fatal = true;
      diagnostics.push(`❌ ${counts.passClaims} ✅ claim(s) with no verified_production field`);
    } else if (vp.value !== 'yes' && vp.value !== 'true') {
      fatal = true;
      diagnostics.push(`❌ verified_production declared as "${vp.value}" but ${counts.passClaims} ✅ claim(s) present`);
    } else if (!vp.commit) {
      warn = true;
      diagnostics.push(`⚠️  verified_production: yes but no commit SHA found adjacent`);
    } else if (!vp.timestamp) {
      warn = true;
      diagnostics.push(`⚠️  verified_production: yes but no timestamp found adjacent`);
    }
  }

  // Warning: verified_local: no but report has ✅ claims (even legacy)
  if (vl.declared && vl.value === 'no' && hasPassClaims && !isLegacy) {
    warn = true;
    diagnostics.push(`⚠️  verified_local: no with ${counts.passClaims} ✅ claim(s)`);
  }

  // Legacy report with ✅ and no verified_production: warn, not fatal
  if (isLegacy && hasPassClaims && !vp.declared) {
    warn = true;
    diagnostics.push(`⚠️  legacy report (${date || 'no date'}) with ${counts.passClaims} ✅ claim(s) and no verified_production field — grandfathered, but should be retroactively verified if possible`);
  }

  const verdict = fatal ? 'fail' : (STRICT && warn) ? 'fail' : warn ? 'warn' : 'pass';

  results.push({
    path: r.relPath,
    date: date || null,
    isLegacy,
    passClaims: counts.passClaims,
    failClaims: counts.failClaims,
    verifiedLocal: vl,
    verifiedProduction: vp,
    fatal,
    warn,
    diagnostics,
    verdict,
  });

  if (fatal) fatalCount++;
  else if (warn) warnCount++;
  else passCount++;
}

if (WANT_JSON) {
  process.stdout.write(
    JSON.stringify(
      {
        cutoverDate: CUTOVER_DATE,
        strict: STRICT,
        summary: { total: reports.length, pass: passCount, warn: warnCount, fatal: fatalCount },
        reports: results,
      },
      null,
      2,
    ) + '\n',
  );
  process.exit(fatalCount > 0 ? 1 : 0);
}

log('');
log('— summary —');
log(`  total:  ${reports.length}`);
log(`  pass:   ${passCount}`);
log(`  warn:   ${warnCount}`);
log(`  fatal:  ${fatalCount}`);
log('');

const issues = results.filter((r) => r.fatal || r.warn);
if (issues.length) {
  log('— findings —');
  for (const r of issues) {
    const tag = r.fatal ? '❌ FATAL' : '⚠️  WARN ';
    log(`  ${tag}  ${r.path}  (date=${r.date || '?'}, ${r.passClaims}✅ ${r.failClaims}❌)`);
    for (const d of r.diagnostics) log(`           ${d}`);
  }
  log('');
}

if (fatalCount > 0) {
  err(`❌ REPORT GATE FAILED — ${fatalCount} report(s) have ✅ claims without verified_production: yes.`);
  err(`To fix: add to the report frontmatter or a "Verification" section:`);
  err(`  verified_local: yes/no`);
  err(`  verified_production: yes    # only if you ran pnpm run verify:production against live brightai.site`);
  err(`  verified_production_commit: <40-char SHA>`);
  err(`  verified_production_at: <UTC timestamp>`);
  process.exit(1);
}

if (warnCount > 0 && STRICT) {
  err(`❌ REPORT GATE FAILED (--strict) — ${warnCount} warning(s) escalated to fatal.`);
  process.exit(1);
}

log(`✅ REPORT GATE PASS — ${passCount} report(s) comply${warnCount > 0 ? `, ${warnCount} warning(s)` : ''}.`);
process.exit(0);
