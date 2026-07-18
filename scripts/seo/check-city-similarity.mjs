import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Strip HTML, extract visible text
function htmlToText(html) {
  // Remove script + style + comments + JSON-LD blocks
  let t = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script type="application\/ld\+json"[\s\S]*?<\/script>/g, ' ')
    // Remove tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
  return t;
}

// Generate word shingles (3-word windows) from text
function shingles(text, k = 3) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const out = new Set();
  for (let i = 0; i <= words.length - k; i++) {
    out.add(words.slice(i, i + k).join(' '));
  }
  return out;
}

// Jaccard similarity
function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  const union = a.size + b.size - inter;
  return inter / union;
}

const cityPages = [
  { label: 'riyadh/banking',  path: '/Users/yzydalshmry/Desktop/BRIGHTAI/dist/solutions/banking-ai-governance/riyadh/index.html' },
  { label: 'khobar/banking',  path: '/Users/yzydalshmry/Desktop/BRIGHTAI/dist/solutions/banking-ai-governance/khobar/index.html' },
  { label: 'dammam/gov',      path: '/Users/yzydalshmry/Desktop/BRIGHTAI/dist/solutions/government-ai-governance/dammam/index.html' },
  { label: 'madinah/gov',     path: '/Users/yzydalshmry/Desktop/BRIGHTAI/dist/solutions/government-ai-governance/madinah/index.html' },
  { label: 'jeddah/health',   path: '/Users/yzydalshmry/Desktop/BRIGHTAI/dist/solutions/healthcare-ai-governance/jeddah/index.html' },
  { label: 'mecca/health',    path: '/Users/yzydalshmry/Desktop/BRIGHTAI/dist/solutions/healthcare-ai-governance/mecca/index.html' },
];

// Load + extract
const data = await Promise.all(cityPages.map(async p => {
  const html = await readFile(p.path, 'utf-8');
  const text = htmlToText(html);
  return { ...p, text, shingled: shingles(text, 3) };
}));

console.log('=== BAI-SEO-003-S6 Body Similarity (3-shingle Jaccard) ===\n');
console.log('Pages:');
data.forEach(d => console.log(`  - ${d.label}: text=${d.text.length} chars, shingles=${d.shingled.size}`));
console.log();

const matrix = {};
let maxSim = 0;
let maxPair = null;
const allSims = [];
for (const a of data) {
  matrix[a.label] = {};
  for (const b of data) {
    if (a.label === b.label) {
      matrix[a.label][b.label] = 1.0;
      continue;
    }
    if (matrix[b.label]?.[a.label] !== undefined) {
      matrix[a.label][b.label] = matrix[b.label][a.label];
      continue;
    }
    const sim = jaccard(a.shingled, b.shingled);
    matrix[a.label][b.label] = sim;
    allSims.push({ a: a.label, b: b.label, sim });
    if (sim > maxSim) { maxSim = sim; maxPair = { a: a.label, b: b.label }; }
  }
}

// Top 15 pair similarities (descending)
console.log('=== Top 15 pairwise similarities (high → low) ===');
allSims.sort((x, y) => y.sim - x.sim);
allSims.slice(0, 15).forEach(s => {
  const flag = s.sim > 0.5 ? '⚠️ HIGH' : s.sim > 0.3 ? '⚡ MED' : '✅ LOW';
  console.log(`  ${flag}  ${s.a} ↔ ${s.b}:  ${(s.sim * 100).toFixed(1)}%`);
});

console.log();
console.log(`=== Stats ===`);
console.log(`Max similarity:        ${(maxSim * 100).toFixed(1)}% (${maxPair.a} ↔ ${maxPair.b})`);
const avg = allSims.reduce((sum, s) => sum + s.sim, 0) / allSims.length;
console.log(`Avg similarity:        ${(avg * 100).toFixed(1)}%`);
const sortedSims = allSims.map(s => s.sim).sort((x, y) => x - y);
const median = sortedSims[Math.floor(sortedSims.length / 2)];
console.log(`Median similarity:     ${(median * 100).toFixed(1)}%`);
const over50 = allSims.filter(s => s.sim > 0.5).length;
const over30 = allSims.filter(s => s.sim > 0.3).length;
console.log(`Pairs >50% similarity: ${over50}`);
console.log(`Pairs >30% similarity: ${over30}`);

// Threshold test
const THRESHOLD = 0.50;
const failed = allSims.filter(s => s.sim > THRESHOLD);
console.log();
console.log(`=== Threshold test (target ≤${(THRESHOLD * 100).toFixed(0)}%) ===`);
if (failed.length === 0) {
  console.log(`✅ PASS: 0 pairs exceed ${(THRESHOLD * 100).toFixed(0)}% similarity threshold`);
} else {
  console.log(`❌ FAIL: ${failed.length} pairs exceed threshold:`);
  failed.forEach(s => console.log(`   - ${s.a} ↔ ${s.b}: ${(s.sim * 100).toFixed(1)}%`));
}

// Also check answer-first uniqueness
console.log();
console.log('=== Answer-first uniqueness check ===');
const answerFirsts = data.map(d => {
  const m = d.text.match(/حوكمة AI في [^.]+\./);
  return { label: d.label, ans: m ? m[0] : '(NOT FOUND)' };
});
for (const a of answerFirsts) {
  const dupes = answerFirsts.filter(b => b !== a && b.ans === a.ans);
  const status = dupes.length > 0 ? '❌ DUPLICATE' : '✅ UNIQUE';
  console.log(`  ${status}  ${a.label}: ${a.ans.slice(0, 80)}...`);
}
