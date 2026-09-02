// DataForSEO keyword metrics fetch for brightai-sa-keyword-research.csv
// Reads CSV, queries DataForSEO Labs keyword_data/live in batches, writes enriched JSON + CSV.
const fs = require('fs');
const path = require('path');

const AUTH = 'Basic ' + Buffer.from(process.env.DFS_LOGIN + ':' + process.env.DFS_PASS).toString('base64');

const csvPath = path.join(__dirname, 'brightai-sa-keyword-research.csv');
const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const header = rows[0];
const idx = k => header.indexOf(k);

// Build query list: language column decides which keyword + language
const jobs = [];
for (const r of rows.slice(1)) {
  const lang = r[idx('language')];
  if (lang === 'ar') jobs.push({ row: r, kw: r[idx('keyword_ar')], lang: 'ar' });
  else if (lang === 'en') jobs.push({ row: r, kw: r[idx('keyword_en')], lang: 'en' });
}

function parseCSV(text) {
  const lines = [];
  let cur = '', line = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { line.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        line.push(cur); cur = '';
        if (line.length > 1 || line[0] !== '') lines.push(line);
        line = [];
      } else cur += c;
    }
  }
  if (cur !== '' || line.length) { line.push(cur); lines.push(line); }
  return lines;
}

async function fetchBatch(jobsBatch) {
  const tasks = jobsBatch.map(j => ({
    keywords: [j.kw],
    location_name: 'Saudi Arabia',
    language_name: j.lang === 'ar' ? 'Arabic' : 'English',
  }));
  const res = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {

    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify(tasks),
  });
  const data = await res.json();
  return data;
}

(async () => {
  // DataForSEO limits: up to 700 keywords per task array item chunk; use batches of 50 tasks
  const BATCH = 50;
  const results = {};
  let cost = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const data = await fetchBatch(batch);
    if (data.status_code !== 20000) { console.error('API error:', data.status_code, data.status_message); process.exit(1); }
    for (const t of (data.tasks || [])) {
      cost += t.cost || 0;
      const kw = t.data && t.data.keywords && t.data.keywords[0];
      const items = t.result || [];
      if (kw) {
        const it = items[0] || null;
        results[kw] = it ? {
          search_volume: it.search_volume,
          competition: it.competition,
          competition_index: it.competition_index,
          cpc: it.cpc,
        } : { note: 'no_data' };
      }
    }
  }
  fs.writeFileSync(path.join(__dirname, 'dfs-metrics.json'), JSON.stringify({ cost, results }, null, 2));
  console.log('Cost:', cost, '| keywords measured:', Object.keys(results).length, '/', jobs.length);
})();
