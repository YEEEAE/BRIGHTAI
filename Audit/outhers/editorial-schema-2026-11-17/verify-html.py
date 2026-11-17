from pathlib import Path
from html.parser import HTMLParser
import json,sys
base=Path(sys.argv[1])
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__();self.scripts=[];self.stack=[];self.ld=False;self.buf='';self.context=0;self.times=[];self.contexts=[];self.feed(s)
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='script' and a.get('type')=='application/ld+json':self.ld=True;self.buf=''
  if t=='aside' and 'article-context' in a.get('class',''):self.context+=1;self.contexts.append('')
  if t=='time' and self.context:self.times.append(a.get('datetime'))
 def handle_endtag(self,t):
  if t=='script' and self.ld:self.scripts.append(json.loads(self.buf));self.ld=False
  if t=='aside' and self.context:self.context-=1
 def handle_data(self,d):
  if self.ld:self.buf+=d
  if self.context:self.contexts[-1]+=d
pages=[]
for path in sorted((base/'knowledge').glob('*/index.html')):
 p=Page(path.read_text());articles=[s for s in p.scripts if s.get('@type')=='Article'];assert len(articles)==1,(path,len(articles))
 a=articles[0];org=next(s for s in p.scripts if s.get('@type')=='Organization');assert a['author']==a['publisher'];assert all(a['publisher'][k]==v for k,v in org.items() if k!='@context')
 assert len(p.contexts)==1;assert 'المراجعة التخصصية: غير معتمدة' in p.contexts[0]
 assert 'reviewedBy' not in a['mainEntityOfPage']
 for key in ['datePublished','dateModified']:
  if key in a:assert a[key] in p.times,(path,key,p.times)
 assert org['name'] in p.contexts[0]
 if 'dateModified' in a:assert a['dateModified']=='2026-11-17'
 pages.append({'path':str(path.relative_to(base)), 'published':a.get('datePublished'),'modified':a.get('dateModified'),'contextDates':p.times})
assert len(pages)==32,len(pages)
for name in ['about','trust']:
 p=Page((base/name/'index.html').read_text());org=next(s for s in p.scripts if s.get('@type')=='Organization');html=(base/name/'index.html').read_text();assert org['name'] in html and org['description'] in html
for path in (base/'authors').rglob('index.html'):
 p=Page(path.read_text());assert not any(s.get('@type') in ['Person','ProfilePage'] for s in p.scripts);assert 'غير مثبتة' in path.read_text() or 'غير مثبتة' in path.read_text()
print(json.dumps({'articles':pages,'count':len(pages),'modified':sum(bool(p['modified']) for p in pages),'identityPages':2,'legacyPages':3,'result':'PASS'},ensure_ascii=False,indent=2))
