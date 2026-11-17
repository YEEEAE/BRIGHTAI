import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isPublicIndexPath } from '../src/server/seo/indexability.mjs';
const output = process.argv[2] ?? 'audit/sitemap-contract-2026-11-17';
const local = process.env.SEO_LOCAL_ORIGIN ?? 'http://127.0.0.1:4467';
const live = 'https://brightai.live';
const locs = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(x => x[1].replaceAll('&amp;', '&'));
async function get(url, method = 'GET') {
  try { const r = await fetch(url, { method, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    return { url, method, status: r.status, headers: Object.fromEntries(r.headers), body: method === 'HEAD' ? '' : await r.text() };
  } catch (e) { return { url, method, status: 0, error: e.message, body: '', headers: {} }; }
}
async function pool(items, fn) { const out = []; let i = 0; await Promise.all(Array.from({length: 6}, async () => { while(i < items.length) { const n = i++; out[n] = await fn(items[n]); } })); return out; }
async function tree(origin, entry) {
 const documents = [], urls = [], seen = new Set();
 async function walk(path) { if(seen.has(path)) return; seen.add(path); const r = await get(origin + path); documents.push(r);
 if(r.status >= 300 && r.status < 400 && r.headers.location) { await walk(new URL(r.headers.location, origin).pathname); return; }
 if(r.status !== 200) return;
 if(/<sitemapindex\b/.test(r.body)) for(const u of locs(r.body)) await walk(new URL(u).pathname);
 else urls.push(...locs(r.body)); }
 await walk(entry); return { documents, urls };
}
await mkdir(output, {recursive:true});
const localTree = await tree(local, '/sitemap-index.xml');
const liveTree = await tree(live, '/sitemap-index.xml');
const legacyTree = await tree(live, '/sitemap.xml');
async function check(url, origin) {
 const path = new URL(url).pathname; const r = await get(origin + path);
 const head = await get(origin + path, 'HEAD');
 const canonical = [...r.body.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(x=>x[1]);
 const robots = [...r.body.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/gi)].map(x=>x[1]);
 const errors = [];
 if(r.status !== 200) errors.push('status');
 if(head.status !== 200 || head.headers.location) errors.push('head-status');
 if(!isPublicIndexPath(path)) errors.push('excluded-path');
 if(canonical.length !== 1 || canonical[0] !== url) errors.push('canonical');
 if(robots.length !== 1 || /noindex/i.test(robots.join()) || /noindex/i.test(r.headers['x-robots-tag'] ?? '')) errors.push('robots');
 return {url, status:r.status, headStatus:head.status, location:r.headers.location, canonical, robots, errors, error:r.error};
}
const localRows = await pool(localTree.urls, u=>check(u,local));
const liveRows = await pool([...new Set([...localTree.urls,...liveTree.urls,...legacyTree.urls])], u=>check(u,live));
const probes = await pool([local,live].flatMap(o=>['/sitemap.xml','/404/','/404.html','/missing-sitemap-contract-20261117/','/knowledge/missing-sitemap-contract-20261117/'].flatMap(p=>['GET','HEAD'].map(m=>[o+p,m]))), async ([u,m])=>{const r=await get(u,m); delete r.body; return r;});
const result = {checkedAt:new Date().toISOString(), localTree,liveTree,legacyTree,localRows,liveRows,probes};
await writeFile(output+'/results.json',JSON.stringify(result,null,2));
const summary = {local:localRows.length,localFailures:localRows.filter(r=>r.errors.length).length,liveCurrent:liveTree.urls.length,legacy:legacyTree.urls.length,liveChecked:liveRows.length,liveFailures:liveRows.filter(r=>r.errors.length).length,probes:probes.map(r=>({url:r.url,method:r.method,status:r.status,location:r.headers.location})),lastmod:localTree.documents.some(r=>/<lastmod>/.test(r.body))};
await writeFile(output+'/summary.json',JSON.stringify(summary,null,2)); console.log(JSON.stringify(summary,null,2));
const localProbeFailures = probes.filter(r=>r.url.startsWith(local)).filter(r=>r.url.endsWith('/sitemap.xml') ? r.status !== 301 || r.headers.location !== '/sitemap-index.xml' : r.status !== 404);
if(!localRows.length || new Set(localTree.urls).size !== localTree.urls.length || summary.localFailures || summary.lastmod || localProbeFailures.length) process.exitCode=1;
