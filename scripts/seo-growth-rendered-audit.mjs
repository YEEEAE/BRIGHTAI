import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const out = 'audit/seo-growth-2026/evidence';
fs.mkdirSync(out, {recursive:true});
const sitemap = load(fs.readFileSync('public/sitemap.xml','utf8'), {xml:true});
const urls = sitemap('url > loc').map((_,e)=>sitemap(e).text()).get();
const rows = [], edges = [];
const files = [];
function walk(dir) { for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,e.name); if(e.isDirectory()) walk(p); else if(p.endsWith('.html')) files.push(p); } }
walk('dist/client');
const byCanonical = new Map();
for(const file of files) { const $=load(fs.readFileSync(file,'utf8')); const c=$('link[rel="canonical"]').attr('href'); if(c && !byCanonical.has(c)) byCanonical.set(c,file); }
for(const url of urls) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const direct = path.join('dist/client',pathname,'index.html');
  const file = fs.existsSync(direct) ? direct : byCanonical.get(url);
  if(!file) {rows.push({url,rendered:false});continue;}
  const html=fs.readFileSync(file,'utf8'),$=load(html);
  const types=[], errors=[];
  $('script[type="application/ld+json"]').each((_,e)=>{try{const obj=JSON.parse($(e).text());const visit=x=>{if(!x||typeof x!=='object')return;if(x['@type'])types.push(...[].concat(x['@type']));Object.values(x).forEach(v=>{if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);});};visit(obj);}catch(e){errors.push(e.message);}});
  $('a[href]').each((_,e)=>{try{const target=new URL($(e).attr('href'),url);if(target.origin==='https://brightai.live')edges.push({from:url,to:target.origin+target.pathname,anchor:$(e).text().trim().replace(/\s+/g,' '),fragment:target.hash});}catch{}});
  const body=$('main').length ? $('main').clone() : $('body').clone();body.find('script,style,nav,footer').remove();
  rows.push({url,rendered:true,file,title:$('title').text(),description:$('meta[name="description"]').attr('content')||'',canonical:$('link[rel="canonical"]').attr('href')||'',lang:$('html').attr('lang'),dir:$('html').attr('dir'),h1_count:$('h1').length,h1:$('h1').map((_,e)=>$(e).text().trim()).get(),robots:$('meta[name="robots"]').attr('content')||'',words:body.text().trim().split(/\s+/).length,schema_types:[...new Set(types)],schema_errors:errors,hreflang:$('link[rel="alternate"][hreflang]').map((_,e)=>({lang:$(e).attr('hreflang'),href:$(e).attr('href')})).get(),images:$('img').length,missing_alt:$('img:not([alt])').length,html_bytes:Buffer.byteLength(html)});
}
for(const r of rows) {r.incoming_pages=new Set(edges.filter(e=>e.to===r.url && e.from!==r.url).map(e=>e.from)).size;r.incoming_anchors=[...new Set(edges.filter(e=>e.to===r.url&&e.from!==r.url).map(e=>e.anchor))].filter(Boolean);}
const problems=rows.filter(r=>!r.rendered||r.canonical!==r.url||r.h1_count!==1||r.schema_errors?.length||!r.description||!r.title);
const summary={generated_at:new Date().toISOString(),scope:'local final build; not Google indexation or live HTTP',sitemap_urls:urls.length,html_files:files.length,rendered:rows.filter(r=>r.rendered).length,problems:problems.map(r=>({url:r.url,rendered:r.rendered,canonical:r.canonical,h1_count:r.h1_count,schema_errors:r.schema_errors,title:r.title})),zero_incoming_pages:rows.filter(r=>!r.incoming_pages).map(r=>r.url),missing_alt_total:rows.reduce((n,r)=>n+(r.missing_alt||0),0)};
fs.writeFileSync(out+'/rendered-pages.json',JSON.stringify(rows,null,2));
fs.writeFileSync(out+'/rendered-links.json',JSON.stringify(edges,null,2));
fs.writeFileSync(out+'/rendered-summary.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
