"""Public GET-only crawl; five workers, one-second pauses, no cookies."""
import pathlib,json,time,urllib.request,urllib.error,concurrent.futures,sys
from urllib.parse import urlparse,urljoin
from collect import Page,csvout,save,OUT
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*a,**k):return None
opener=urllib.request.build_opener(NoRedirect)
rows=json.loads((OUT/'route-inventory.json').read_text())
gsc=json.loads((OUT/'gsc-pages.json').read_text())
redirects=json.loads((OUT.parents[1]/'redirects.json').read_text())['redirects']
paths=set(r['path'] for r in rows)
paths.update(urlparse(r['keys'][0]).path for r in gsc['rows'])
paths.update(r['source'] for r in redirects)
paths.update(['/robots.txt','/llms.txt','/sitemap.xml','/sitemap-index.xml','/sitemap-0.xml','/auth/sign-up/','/app/kernel/','/healthz/','/missing-seo-audit/','/api/ai/chat/','/knowledge/ai-governance-saudi/?utm_source=audit','/docs?topic=audit'])
docs={}
def get(path):
 time.sleep(1)
 url='https://brightai.live'+path
 try:
  try:r=opener.open(urllib.request.Request(url,headers={'User-Agent':'BRIGHTAI-SEO-Audit/1.0'}),timeout=20)
  except urllib.error.HTTPError as e:r=e
  body=r.read().decode('utf8',errors='replace');h=dict(r.headers);p=Page(body)
  result={'path':path,'status':r.code,'location':r.headers.get('Location',''),'canonical':p.canonical,'robots':p.meta.get('robots',''),'title':p.title,'description':p.meta.get('description',''),'h1':[x[1] for x in p.headings if x[0]=='h1'],'headers':{k:v for k,v in h.items() if k.lower() in ['cache-control','x-robots-tag','content-security-policy','strict-transport-security','x-frame-options','content-type','last-modified','referrer-policy']},'schema_types':[s.get('@type') for s in p.schemas],'lang':p.lang,'dir':p.direction}
  if path in ['/robots.txt','/llms.txt','/sitemap.xml','/sitemap-index.xml','/sitemap-0.xml']:docs[path]=body
  return result
 except Exception as e:return {'path':path,'status':'BLOCKED','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:results=list(ex.map(get,sorted(paths)))
save('live-http.json',results);save('live-discovery.json',docs)
csvout('live-http.csv',[{'path':r['path'],'status':r['status'],'location':r.get('location',''),'canonical':r.get('canonical',''),'robots':r.get('robots',''),'title':r.get('title','')} for r in results])
from collections import Counter
print(json.dumps({'count':len(results),'status':dict(Counter(str(r['status']) for r in results))},indent=2))
