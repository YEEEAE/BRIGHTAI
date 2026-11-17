"""Read-only repository/build SEO inventory. Writes only this audit directory."""
import pathlib, re, json, csv, hashlib, subprocess, html, collections
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=pathlib.Path(__file__).resolve().parent
def save(name,rows):
 (OUT/name).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
def csvout(name,rows):
 if not rows:return
 with (OUT/name).open('w') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader()
  for row in rows:w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in row.items()})
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__(); self.meta={};self.links=[];self.images=[];self.schemas=[];self.headings=[];self.text=[];self.main=[];self.title='';self.canonical='';self.lang='';self.direction='';self.stack=[];self.skip=0;self.script=None;self.buf='';self.inmain=0;self.heading=None;self.hbuf='';self.ctas=[];self.anchor=None;self.abuf='';self.times=[]
  self.feed(s)
 def handle_starttag(self,t,aa):
  a=dict(aa)
  if t=='html':self.lang=a.get('lang');self.direction=a.get('dir')
  if t=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content','')
  if t=='link' and a.get('rel')=='canonical':self.canonical=a.get('href','')
  if t=='a':self.anchor=a.get('href','');self.abuf=''
  if t=='img':self.images.append(a)
  if t=='time':self.times.append(a.get('datetime',''))
  if t in ['script','style']:
   self.skip+=1;self.script=a.get('type') if t=='script' else None;self.buf=''
  if t in ['main','article']:self.inmain+=1
  if re.fullmatch('h[1-6]',t):self.heading=t;self.hbuf=''
  if t=='title':self.stack.append('title')
 def handle_endtag(self,t):
  if t=='title' and self.stack:self.stack.pop()
  if t in ['script','style']:
   if self.script=='application/ld+json':
    try:self.schemas.append(json.loads(self.buf))
    except Exception as e:self.schemas.append({'parse_error':str(e)})
   self.skip=max(0,self.skip-1);self.script=None
  if t in ['main','article']:self.inmain=max(0,self.inmain-1)
  if t==self.heading:self.headings.append([t,self.hbuf.strip()]);self.heading=None
  if t=='a' and self.anchor is not None:
   self.links.append({'href':self.anchor,'text':self.abuf.strip()})
   if re.search('تواصل|جرّب|جرب|استفس|عرض سعر|ابدأ|نموذج|تحميل|حمّل',self.abuf):self.ctas.append(self.links[-1])
   self.anchor=None
 def handle_data(self,d):
  if self.skip:self.buf+=d;return
  if self.stack:self.title+=d
  if self.heading:self.hbuf+=d
  if self.anchor is not None:self.abuf+=d
  self.text.append(d)
  if self.inmain:self.main.append(d)
def parsed(s):
 p=Page(s);return p
rows=[];edges=[];schemas=[];texts={}
sitemap=(ROOT/'dist/client/sitemap-0.xml').read_text()
urls=re.findall(r'<loc>(.*?)</loc>',sitemap)
for f in sorted((ROOT/'dist/client').rglob('*.html')):
 path='/'+str(f.relative_to(ROOT/'dist/client')).replace('index.html','')
 if path=='/404.html':path='/404/'
 p=parsed(f.read_text());main=' '.join(p.main or p.text);main=re.sub(r'\s+',' ',main).strip();texts[path]=main
 ty='knowledge' if path.startswith('/knowledge/') else 'demo' if path.startswith('/demo/') else 'public'
 row={'path':path,'type':ty,'indexability':p.meta.get('robots','NOT SET'),'canonical':p.canonical,'title':p.title,'description':p.meta.get('description',''),'H1':[h[1] for h in p.headings if h[0]=='h1'],'schema':[s.get('@type','graph') for s in p.schemas],'internal_links':[],'word_count_main':len(main.split()),'last_updated_visible':p.times,'dateModified_schema':[s.get('dateModified') for s in p.schemas if s.get('dateModified')],'CTA':p.ctas,'status':'BUILT; HTTP separate','lang':p.lang,'dir':p.direction,'H2':[h[1] for h in p.headings if h[0]=='h2'],'images':p.images,'og':{k:v for k,v in p.meta.items() if k.startswith(('og:','twitter:'))},'intro_words':0,'has_table':'<table' in f.read_text(),'has_numbered_steps':'<ol' in f.read_text(),'has_toc':bool(re.search('جدول المحتويات|محتويات الدليل|فهرس المحتويات',main)),'has_limit_section':'متى لا يكفي' in main}
 # Lead paragraph is a reproducible candidate, not semantic answer validation.
 lead=re.search(r'<p[^>]*class="[^"]*lead[^"]*"[^>]*>(.*?)</p>',f.read_text(),re.S)
 if lead:row['intro_words']=len(re.sub('<[^>]+>',' ',html.unescape(lead[1])).split())
 for a in p.links:
  u=urlparse(urljoin('https://brightai.live'+path,a['href']))
  if u.scheme in ['http','https'] and u.netloc=='brightai.live':
   row['internal_links'].append(u.path);edges.append({'from':path,'to':u.path,'anchor':a['text'],'fragment':u.fragment})
 for s in p.schemas:schemas.append({'path':path,'schema':s})
 rows.append(row)
csvout('route-inventory.csv',rows);save('route-inventory.json',rows);csvout('internal-links.csv',edges);save('schema-map-current.json',schemas);save('main-text.json',texts)
sources=[];routes=[]
files=subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines()
for rel in files:
 f=ROOT/rel
 if not f.is_file() or rel.startswith(('audit/','Audit/','.agents/skills/','.dsh/','.claude/skills/','plugins/')) or f.suffix.lower() not in ['.astro','.ts','.js','.mjs','.css','.json','.md','.sql','.yml','.yaml']:continue
 if f.name.startswith('.env'):continue
 b=f.read_bytes();s=b.decode('utf8',errors='replace')
 sources.append({'file':rel,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'lines':len(s.splitlines()),'seo_markers':len(re.findall('canonical|robots|schema.org|prerender|sitemap|dateModified|hreflang',s,re.I)),'review':'automated full-file scan; manual owner review separately'})
 if rel.startswith('src/pages/') and f.suffix in ['.astro','.ts','.js']:
  route='/'+rel.removeprefix('src/pages/').rsplit('.',1)[0];route=re.sub('/index$','/',route)
  if not route.endswith('/'):route+='/'
  routes.append({'source':rel,'pattern':route,'type':'API' if '/api/' in route or route=='/healthz/' else 'private' if route.startswith(('/app/','/auth/')) else 'demo' if route.startswith('/demo/') else 'public','prerender':bool(re.search('prerender\s*=\s*true',s)),'methods':re.findall(r'export\s+(?:const|async function|function)\s+(GET|POST|PATCH|DELETE|PUT|HEAD|ALL)',s),'metadata':'N/A for API; runtime inspection required for SSR'})
csvout('source-scan.csv',sources);csvout('route-source-patterns.csv',routes)
indexable=[r for r in rows if 'noindex' not in r['indexability']]
dup=lambda k:{v:[r['path'] for r in indexable if r[k]==v] for v,c in collections.Counter(r[k] for r in indexable).items() if c>1}
summary={'built_html':len(rows),'indexable':len(indexable),'sitemap':len(urls),'source_files_scanned':len(sources),'route_patterns':len(routes),'titles_duplicate':dup('title'),'descriptions_duplicate':dup('description'),'h1_invalid':[r['path'] for r in indexable if len(r['H1'])!=1],'language_invalid':[r['path'] for r in rows if r['lang']!='ar-SA' or r['dir']!='rtl'],'schema_parse_errors':[s['path'] for s in schemas if 'parse_error' in s['schema']],'images':sum(len(r['images']) for r in rows),'images_missing_alt':sum('alt' not in im for r in rows for im in r['images']),'images_missing_dimensions':sum(not (im.get('width') and im.get('height')) for r in rows for im in r['images']),'articles':len([r for r in rows if r['type']=='knowledge']),'articles_intro_40_70':len([r for r in rows if r['type']=='knowledge' and 40<=r['intro_words']<=70]),'articles_toc':len([r for r in rows if r['type']=='knowledge' and r['has_toc']]),'articles_limit_section':len([r for r in rows if r['type']=='knowledge' and r['has_limit_section']]),'sitemap_lastmod_count':sitemap.count('<lastmod>'),'schema_types':dict(collections.Counter(s['schema'].get('@type','graph') for s in schemas))}
save('summary.json',summary);print(json.dumps(summary,ensure_ascii=False,indent=2))
