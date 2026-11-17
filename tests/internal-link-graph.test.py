import contextlib, importlib.util, io, json, tempfile, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('link_graph',Path(__file__).parents[1]/'scripts/internal-link-graph.py')
graph=importlib.util.module_from_spec(spec);spec.loader.exec_module(graph)

class GraphTests(unittest.TestCase):
    def scan(self, html, target='<h1 id="part">Destination</h1>'):
        with tempfile.TemporaryDirectory() as root:
            dist=Path(root)/'dist';dist.mkdir();(dist/'index.html').write_text(html)
            (dist/'target').mkdir();(dist/'target/index.html').write_text(target)
            with contextlib.redirect_stdout(io.StringIO()): return graph.audit(dist,Path(root)/'out')
    def test_context_anchor_and_fragment(self):
        result=self.scan('<header><nav><a href="/target/">Menu</a></nav></header><main><a href="/target/#part">Read &amp; decide</a></main>')
        self.assertFalse(result['issues']);self.assertEqual([x['context'] for x in result['edges']],['navigation','content'])
        self.assertEqual(result['edges'][1]['anchor'],'Read & decide')
        self.assertEqual(next(n for n in result['nodes'] if n['path']=='/target/')['depth'],1)
    def test_missing_page_and_fragment(self):
        result=self.scan('<a href="/missing/">Missing</a><a href="/target/#absent">Section</a>')
        self.assertEqual({i['type'] for i in result['issues']},{'MISSING_TARGET','BROKEN_ANCHOR'})
    def test_alias_detected_instead_of_followed(self):
        result=self.scan('<a href="/index.html">Home alias</a>')
        self.assertEqual(result['issues'][0]['type'],'REDIRECT_LINK')
    def test_external_links_ignored(self):
        self.assertFalse(self.scan('<a href="https://example.org/">External</a><a href="mailto:a@example.org">Mail</a>')['edges'])
    def test_empty_anchor_and_accessible_image(self):
        result=self.scan('<a href="/target/"></a><a href="/target/"><img alt="Destination"></a>')
        self.assertEqual(len(result['issues']),1);self.assertEqual(result['issues'][0]['type'],'EMPTY_ANCHOR')

if __name__=='__main__':unittest.main()
