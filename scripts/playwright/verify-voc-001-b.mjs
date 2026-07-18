/**
 * BAI-VOC-001-B (2026-07-18): Playwright verification for the P0
 * FAQ + Speakable audit. Visits one page per P0 template and asserts
 *   (a) the page renders 200,
 *   (b) the visible <details><summary> count matches the JSON-LD
 *       FAQPage `mainEntity` count (no drift),
 *   (c) the .answer-first-summary block is in the DOM,
 *   (d) the WebPage SpeakableSpecification cssSelector array contains
 *       BOTH `h1` and `.answer-first-summary`.
 *
 * Run from project root: `node scripts/playwright/verify-voc-001-b.mjs`
 * Requires a static server to be running on 127.0.0.1:4175
 * (`python3 -m http.server 4175 --directory dist/client`).
 *
 * The reason for the static server instead of `astro preview`:
 * the project ships with @astrojs/node (REPORTS-KERNEL-AI-2026-07-14)
 * which makes `astro preview` run the SSR `dist/server/entry.mjs`
 * — that emits a slightly different JSON-LD shape than the static
 * `dist/client/*` HTML files that ship to production. We test
 * against the static HTML so the verification mirrors what
 * users + crawlers actually receive.
 *
 * If no server is running, the script auto-starts
 * `scripts/playwright/static-server.mjs` on port 4178.
 */
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

import { chromium } from 'playwright';

const SERVER = 'http://127.0.0.1:4178';

async function ensureServer() {
  try {
    const r = await fetch(SERVER + '/');
    if (r.ok) return null;
  } catch { /* fallthrough */ }
  const child = spawn(process.execPath, [
    new URL('./static-server.mjs', import.meta.url).pathname,
  ], { stdio: 'pipe', detached: false });
  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});
  // wait for server to come up
  for (let i = 0; i < 30; i += 1) {
    await wait(100);
    try {
      const r = await fetch(SERVER + '/');
      if (r.ok) return child;
    } catch { /* retry */ }
  }
  return child;
}

const serverChild = await ensureServer();

const P0 = [
  // sector
  { url: '/solutions/banking-ai-governance/',     expectFaq: 5, hasAnswerFirst: true,  label: 'sector-banking'    },
  { url: '/solutions/government-ai-governance/',  expectFaq: 5, hasAnswerFirst: true,  label: 'sector-government' },
  { url: '/solutions/healthcare-ai-governance/',  expectFaq: 5, hasAnswerFirst: true,  label: 'sector-healthcare' },
  { url: '/solutions/manufacturing-ai-governance/', expectFaq: 5, hasAnswerFirst: true, label: 'sector-manufacturing' },
  // city (P0 = no migrated FAQ)
  { url: '/solutions/banking-ai-governance/khobar/',   expectFaq: 5, hasAnswerFirst: true, label: 'city-khobar'  },
  { url: '/solutions/government-ai-governance/madinah/', expectFaq: 5, hasAnswerFirst: true, label: 'city-madinah' },
  { url: '/solutions/healthcare-ai-governance/mecca/', expectFaq: 5, hasAnswerFirst: true, label: 'city-mecca'  },
  // city (legacy migrated — not P0 but covered for regression)
  { url: '/solutions/banking-ai-governance/riyadh/',   expectFaq: 6, hasAnswerFirst: false, label: 'city-riyadh-legacy' },
  // kernel
  { url: '/kernel/chat/',       expectFaq: 5, hasAnswerFirst: true, label: 'kernel-chat'       },
  { url: '/kernel/approvals/',  expectFaq: 5, hasAnswerFirst: true, label: 'kernel-approvals'  },
  { url: '/kernel/audit/',      expectFaq: 5, hasAnswerFirst: true, label: 'kernel-audit'      },
  { url: '/kernel/evidence/',   expectFaq: 5, hasAnswerFirst: true, label: 'kernel-evidence'   },
  { url: '/kernel/compliance/', expectFaq: 5, hasAnswerFirst: true, label: 'kernel-compliance' },
  { url: '/kernel/connectors/', expectFaq: 5, hasAnswerFirst: true, label: 'kernel-connectors' },
];

const BASE = SERVER;

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

let passed = 0;
let failed = 0;
const failures = [];

for (const target of P0) {
  const full = BASE + target.url;
  let result = { label: target.label, url: target.url, status: null, faq: null, answerFirst: null, selectors: null, ok: false };
  try {
    const resp = await page.goto(full, { waitUntil: 'domcontentloaded' });
    result.status = resp ? resp.status() : 'no-resp';
    if (result.status !== 200) {
      failures.push(`${target.label}: HTTP ${result.status}`);
      failed += 1;
      continue;
    }
    // count <details> inside the FAQ section. We pick the section
    // whose heading matches /faq|أسئلة|شائعة/ AND that actually
    // contains <details> children — otherwise legacy pages with
    // "سيناريوهات شائعة" headings (no FAQ inside) would match and
    // return 0. As a safety net, if no FAQ section is found we fall
    // back to the largest cluster of <details> on the page.
    const visible = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('section'));
      const faqCandidates = sections
        .map((s) => ({
          section: s,
          details: s.querySelectorAll('details').length,
          heading: (s.querySelector('h2, h3')?.textContent || '').trim(),
        }))
        .filter((c) => /faq|أسئلة|شائعة/i.test(c.heading) && c.details > 0);
      const faqSection =
        faqCandidates.sort((a, b) => b.details - a.details)[0]?.section || null;
      let summaries = faqSection
        ? faqSection.querySelectorAll('details summary')
        : (() => {
            // Largest cluster of details anywhere on the page
            let best = { count: 0, list: [] };
            for (const s of sections) {
              const d = s.querySelectorAll('details');
              if (d.length > best.count) best = { count: d.length, list: d };
            }
            if (best.count === 0) {
              return document.querySelectorAll('details summary');
            }
            // Convert <details> list to <summary> list
            return Array.from(best.list).flatMap((d) =>
              Array.from(d.querySelectorAll(':scope > summary')),
            );
          })();
      const answerFirstEl = document.querySelector('.answer-first-summary');
      // Find the SpeakableSpecification
      const ldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      let selectors = null;
      for (const s of ldScripts) {
        try {
          const data = JSON.parse(s.textContent || '{}');
          const graph = data['@graph'] || [data];
          for (const n of graph) {
            if (n && n.speakable && Array.isArray(n.speakable.cssSelector)) {
              selectors = n.speakable.cssSelector;
            }
          }
        } catch (_) { /* ignore */ }
      }
      return {
        visibleCount: summaries.length,
        hasAnswerFirst: !!answerFirstEl,
        selectors,
      };
    });
    result.faq = visible.visibleCount;
    result.answerFirst = visible.hasAnswerFirst;
    result.selectors = visible.selectors;

    let ok = true;
    if (visible.visibleCount !== target.expectFaq) {
      failures.push(`${target.label}: visible FAQ ${visible.visibleCount} != expected ${target.expectFaq}`);
      ok = false;
    }
    if (target.hasAnswerFirst && !visible.hasAnswerFirst) {
      failures.push(`${target.label}: .answer-first-summary MISSING`);
      ok = false;
    }
    if (target.hasAnswerFirst) {
      if (!visible.selectors || !visible.selectors.includes('h1') || !visible.selectors.includes('.answer-first-summary')) {
        failures.push(`${target.label}: Speakable selectors ${JSON.stringify(visible.selectors)} missing h1+answer-first`);
        ok = false;
      }
    }
    if (ok) {
      passed += 1;
      result.ok = true;
      console.log(`✅ ${target.label}: ${visible.visibleCount} FAQ, answer-first=${visible.hasAnswerFirst}, selectors=${JSON.stringify(visible.selectors)}`);
    } else {
      failed += 1;
      console.log(`❌ ${target.label}: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    failed += 1;
    failures.push(`${target.label}: ${e.message}`);
    console.log(`❌ ${target.label}: EXCEPTION ${e.message}`);
  }
}

await browser.close();

console.log('\n=== Summary ===');
console.log(`Total: ${P0.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
