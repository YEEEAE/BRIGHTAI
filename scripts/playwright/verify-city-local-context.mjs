import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const base = 'http://localhost:4321';
const cities = [
  '/solutions/banking-ai-governance/riyadh/',
  '/solutions/banking-ai-governance/khobar/',
  '/solutions/government-ai-governance/dammam/',
  '/solutions/government-ai-governance/madinah/',
  '/solutions/healthcare-ai-governance/jeddah/',
  '/solutions/healthcare-ai-governance/mecca/',
];

function tokens(s) {
  return new Set(s.replace(/[^\u0600-\u06FF\s]/g, ' ').split(/\s+/).filter(Boolean));
}
function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const paras = {};
let failures = 0;

for (const c of cities) {
  const res = await page.goto(base + c, { waitUntil: 'networkidle' });
  if (res.status() !== 200) {
    console.error(`FAIL ${c} status ${res.status()}`);
    failures++;
    continue;
  }
  const text = await page.evaluate(() => {
    const el = document.querySelector('#local-context .inner-card__text');
    return el ? el.textContent.trim() : null;
  });
  if (!text) {
    console.error(`FAIL ${c} no local-context paragraph in SSR`);
    failures++;
    continue;
  }
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  paras[c] = text;
  console.log(`OK ${c} | words=${wordCount} | ${text.slice(0, 40)}...`);
}

// Similarity matrix (core text, excluding sector/city proper nouns is hard;
// report pairwise Jaccard over full paragraph).
const keys = Object.keys(paras);
console.log('\n--- Pairwise similarity (Jaccard, Arabic tokens) ---');
let maxSim = 0, maxPair = '';
for (let i = 0; i < keys.length; i++) {
  for (let j = i + 1; j < keys.length; j++) {
    const s = jaccard(paras[keys[i]], paras[keys[j]]);
    if (s > maxSim) { maxSim = s; maxPair = `${keys[i]} vs ${keys[j]}`; }
    console.log(`${(s * 100).toFixed(1)}%  ${keys[i]} <> ${keys[j]}`);
  }
}
console.log(`\nMAX similarity: ${(maxSim * 100).toFixed(1)}% (${maxPair}) — threshold <70%`);

await browser.close();
process.exit(failures > 0 || maxSim >= 0.7 ? 1 : 0);
