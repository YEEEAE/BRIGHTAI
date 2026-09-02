// Fetch related keyword ideas (proxy volume + KD) for each CSV keyword via DataForSEO Labs.
const fs = require('fs');
const path = require('path');
const AUTH = 'Basic ' + Buffer.from(process.env.DFS_LOGIN + ':' + process.env.DFS_PASS).toString('base64');
const csvPath = path.join(__dirname, 'brightai-sa-keyword-research.csv');
function parseCSV(text) {
  const lines = []; let cur = '', line = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false; else cur += c;
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
const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const idx = k => rows[0].indexOf(k);
const jobs = [];
for (const r of rows.slice(1)) {
  const lang = r[idx('language')];
  if (lang === 'ar') jobs.push({ kw: r[idx('keyword_ar')], lang: 'ar' });
  else if (lang === 'en') jobs.push({ kw: r[idx('keyword_en')], lang: 'en' });
}
(async () => {
  const BATCH = 5;
  const out = {};
  let cost = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const tasks = batch.map(j => ({ keywords: [j.kw], location_name: 'Saudi Arabia', limit: 200 }));
    const res = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live', {
      method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify(tasks),
    });
    const data = await res.json();
    if (data.status_code !== 20000) { console.error('API error:', data.status_code, data.status_message); process.exit(1); }
    for (const t of (data.tasks || [])) {
      cost += t.cost || 0;
      const kw = t.data && t.data.keywords && t.data.keywords[0];
      if (!kw) continue;
      const items = t.result && t.result[0] && t.result[0].items ? t.result[0].items : [];
      // keep items matching the detected language of the seed (heuristic: contains Arabic chars)
      const seedIsAr = /[\u0600-\u06FF]/.test(kw);
      const filtered = items.filter(x => {
        const k2 = (x.keyword_info && x.keyword_info.keyword) || '';
        return seedIsAr ? /[\u0600-\u06FF]/.test(k2) : !/[\u0600-\u06FF]/.test(k2);
      });
      const map = x => ({
        keyword: x.keyword_info.keyword,
        sv: x.keyword_info.search_volume,
        cpc: x.keyword_info.cpc,
        competition: x.keyword_info.competition_level,
        kd: x.keyword_properties ? x.keyword_properties.keyword_difficulty : null,
        intent: x.search_intent_info ? x.search_intent_info.main_intent : null,
      });
      out[kw] = { exact: filtered.find(x => x.keyword_info.keyword === kw) ? map(filtered.find(x => x.keyword_info.keyword === kw)) : null, related: filtered.slice(0, 8).map(map) };
    }
  }
  fs.writeFileSync(path.join(__dirname, 'dfs-ideas.json'), JSON.stringify({ cost, out }, null, 2));
  const withData = Object.values(out).filter(v => v.related.length).length;
  console.log('Cost:', cost, '| keywords with related data:', withData, '/', jobs.length);
})();
