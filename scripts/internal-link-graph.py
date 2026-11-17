"""Audit rendered HTML, preserving anchors and separating navigation from content.
Usage: python3 scripts/internal-link-graph.py DIST OUTPUT [--base http://127.0.0.1:PORT]
"""
import argparse, collections, csv, json, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote, quote
from urllib.request import build_opener, HTTPRedirectHandler, Request
from urllib.error import HTTPError

class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.stack, self.ids, self.links, self.current = [], set(), [], None
        self.feed(html)
    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'a' and a.get('name'): self.ids.add(a['name'])
        if tag == 'a' and 'href' in a:
            context = 'navigation' if any(t in ('nav', 'header', 'footer', 'aside') for t in self.stack) else 'content'
            self.current = {'href': a['href'], 'anchor': a.get('aria-label', ''), 'context': context, 'line': self.getpos()[0]}
        if tag == 'img' and self.current: self.current['anchor'] += ' ' + a.get('alt', '')
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'): self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag == 'a' and self.current:
            self.current['anchor'] = ' '.join(self.current['anchor'].split())
            self.links.append(self.current); self.current = None
        if tag in self.stack: self.stack = self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
    def handle_data(self, data):
        if self.current and not any(t in ('script','style','svg') for t in self.stack): self.current['anchor'] += ' ' + data

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None

def audit(dist, output, base=None):
    dist, output = Path(dist), Path(output); output.mkdir(parents=True, exist_ok=True)
    pages = {}
    for f in sorted(dist.rglob('*.html')):
        relative = f.relative_to(dist).as_posix()
        route = '/' + relative[:-10] if relative.endswith('index.html') else '/' + relative
        pages[route] = Document(f.read_text())
    redirect_file = Path(__file__).resolve().parents[1] / 'redirects.json'
    redirects = {x['source']: x['destination'] for x in json.loads(redirect_file.read_text())['redirects']}
    edges, issues = [], []
    for route, doc in pages.items():
        for a in doc.links:
            url = urlsplit(urljoin('https://brightai.live'+route, a['href']))
            if url.scheme not in ('http','https') or url.netloc != 'brightai.live': continue
            target = unquote(url.path)
            edge = dict(source=route, target=target, query=url.query, fragment=unquote(url.fragment), **a)
            edges.append(edge)
            if target in redirects:
                issues.append(dict(type='REDIRECT_LINK', destination=redirects[target], **edge)); continue
            file = dist / target.lstrip('/')
            if target not in pages and not file.is_file():
                # Server-only routes are checked with HTTP, never assumed missing or healthy.
                if not target.startswith(('/app/', '/auth/', '/healthz/')): issues.append(dict(type='MISSING_TARGET', **edge))
            if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                issues.append(dict(type='BROKEN_ANCHOR', **edge))
            if not a['anchor']: issues.append(dict(type='EMPTY_ANCHOR', **edge))
    http = []
    if base:
        opener = build_opener(NoRedirect())
        for target in sorted({e['target'] + ('?'+e['query'] if e['query'] else '') for e in edges if not (e['source'] == e['target'] and e['href'].startswith('#'))}):
            try:
                with opener.open(Request(base.rstrip('/')+quote(target, safe="/%?=&:+,;@!$'()*~-._")), timeout=20) as r: status, location = r.status, r.headers.get('Location')
            except HTTPError as e: status, location = e.code, e.headers.get('Location')
            http.append(dict(target=target, status=status, location=location))
            if status >= 300: issues.append(dict(type='HTTP_TARGET', target=target, status=status, location=location))
    adjacency = {p: sorted({e['target'] for e in edges if e['source']==p and e['target'] in pages and e['target'] != p}) for p in pages}
    distance = {'/':0}; queue = collections.deque(['/'])
    while queue:
        p = queue.popleft()
        for target in adjacency.get(p, []):
            if target not in distance: distance[target] = distance[p]+1; queue.append(target)
    nodes = [dict(path=p, depth=distance.get(p), incoming=len({e['source'] for e in edges if e['target']==p and e['source']!=p}), contentIncoming=len({e['source'] for e in edges if e['target']==p and e['source']!=p and e['context']=='content'})) for p in pages]
    result = dict(nodes=nodes, edges=edges, issues=issues, http=http)
    (output/'graph.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    with (output/'edges.csv').open('w') as f:
        writer=csv.DictWriter(f,fieldnames=['source','target','query','fragment','href','anchor','context','line']);writer.writeheader();writer.writerows(edges)
    (output/'graph.dot').write_text('digraph InternalLinks {\n'+''.join(f'  {json.dumps(s)} -> {json.dumps(t)};\n' for s, ts in adjacency.items() for t in ts)+'}\n')
    summary=dict(pages=len(pages),edges=len(edges),issues=len(issues),types=dict(collections.Counter(i['type'] for i in issues)),httpTargets=len(http),unreachable=[n['path'] for n in nodes if n['depth'] is None])
    (output/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)); print(json.dumps(summary,ensure_ascii=False))
    return result
if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('dist');p.add_argument('output');p.add_argument('--base');a=p.parse_args();result=audit(a.dist,a.output,a.base);sys.exit(bool(result['issues']))
