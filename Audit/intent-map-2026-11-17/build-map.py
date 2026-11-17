import pathlib,json,gzip,csv,re,hashlib,collections
R=pathlib.Path(__file__).resolve().parents[2]; O=R/'audit/intent-map-2026-11-17'; E=O/'evidence'; P=R/'Audit/outhers/seo-authority-2026-11-17'
K='/knowledge/'; H='/hub/ai-governance/'; D='/docs/ai-governance-saudi-arabia/'; G='/solutions/government-ai-governance/'; F='/solutions/banking-ai-governance/'; C='/solutions/healthcare-ai-governance/'
# slug | primary keyword | reader question | audience | stage | cluster | boundary/action
raw='''ai-governance-saudi|حوكمة الذكاء الاصطناعي في السعودية|ما الحوكمة ومن أين تبدأ المنشأة؟|قيادات التحول والمخاطر|وعي|governance|merge
protect-company-data-chatgpt|حماية بيانات الشركة في ChatGPT|ماذا يستطيع الموظف إدخاله وما الذي يصعّده؟|الموظفون والأمن والخصوصية|تطبيق|privacy|update
ai-risk-assessment|تقييم مخاطر الذكاء الاصطناعي|كيف أوثق الاحتمال والأثر والضابط والمالك؟|إدارة المخاطر ومالك الاستخدام|تطبيق|risk|update
prompt-injection|حقن الأوامر Prompt Injection|كيف تدخل التعليمات غير الموثوقة وما طبقات الفحص؟|المطورون وفرق الأمن|تطبيق|security|keep
ai-use-policy-employees|سياسة استخدام الذكاء الاصطناعي للموظفين|كيف أكتب المسموح والمشروط والمحظور والاستثناء؟|الموارد البشرية والامتثال|تطبيق|policy|update
sdaia-ai-adoption-framework|إطار تبني الذكاء الاصطناعي سدايا|كيف أرتب النضج ومحاور التبني؟|مدير برنامج التحول|تخطيط|implementation|update
saudi-ai-ethics-principles|مبادئ أخلاقيات الذكاء الاصطناعي السعودية|كيف أربط كل مبدأ بسؤال ومالك ودليل؟|الحوكمة والامتثال|تخطيط|ethics|update
sdaia-generative-ai-guidelines|إرشادات سدايا للذكاء الاصطناعي التوليدي|أي نسخة تخص الجهة وكيف أستخدمها؟|الحوكمة الحكومية والخاصة|تخطيط|government|update
pdpl-and-ai|PDPL والذكاء الاصطناعي|متى أحتاج مراجعة أساس المعالجة والأدوار والنقل؟|مسؤول الخصوصية والقانوني|تخطيط|privacy|update
saudi-ai-law-binding-vs-guidance|قانون الذكاء الاصطناعي في السعودية|ما الفرق بين النظام والإرشاد والمسودة؟|الامتثال والقيادة|وعي|regulators|keep
sdaia-ai-ethics-self-assessment|التقييم الذاتي لأخلاقيات الذكاء الاصطناعي سدايا|ماذا أجهز قبل التقييم وكيف أعالج الفجوات؟|مالك الحوكمة والمراجعة|تقييم|ethics|keep
iso-42001-saudi|ISO 42001 السعودية|متى أحتاج نظام إدارة AI وما حدود الشهادة؟|الجودة والحوكمة|تقييم|iso|update
shadow-ai-detection|اكتشاف Shadow AI|كيف أحصر الاستخدام غير المعتمد دون مراقبة زائدة؟|الأمن وتقنية المعلومات|تطبيق|inventory|keep
ai-hallucinations-controls|ضوابط هلوسة الذكاء الاصطناعي|كيف أراجع إجابة مولدة وأقرر عدم استخدامها؟|مالكو الأعمال والجودة|تطبيق|quality|keep
deepfake-policy-organizations|سياسة التزييف العميق للمنشآت|كيف أتحقق من صوت أو صورة وأصعّد الاشتباه؟|الأمن والاتصال المؤسسي|تطبيق|security|keep
ai-inventory-register|سجل جرد استخدامات الذكاء الاصطناعي|ما حقول السجل ومن يحدثه؟|مالك البرنامج وتقنية المعلومات|تطبيق|inventory|update
ai-employee-training|تدريب الموظفين على الذكاء الاصطناعي|كيف أحول السياسة إلى سلوك يمكن اختباره؟|التدريب والموارد البشرية|تطبيق|policy|keep
ai-vendor-assessment|تقييم موردي الذكاء الاصطناعي|ما الأدلة التي أطلبها قبل التعاقد والتكامل؟|المشتريات والأمن والخصوصية|تقييم|procurement|update
data-classification-for-ai|تصنيف البيانات للذكاء الاصطناعي|ما البيانات المسموحة لكل قناة وأداة؟|مكتب البيانات ومالك الأصل|تطبيق|privacy|keep
ai-governance-committee-raci|لجنة حوكمة الذكاء الاصطناعي RACI|من ينفذ ومن يعتمد ومن يملك الاعتراض؟|القيادة ومدير البرنامج|تخطيط|implementation|update
ai-impact-assessment|تقييم أثر الذكاء الاصطناعي|من يتأثر بالقرار وما حقوق المراجعة؟|المخاطر ومالك الاستخدام|تخطيط|risk|update
ai-audit-trail|سجل تدقيق الذكاء الاصطناعي|ما الحد الأدنى للدليل ومن يطلع عليه؟|المراجعة الداخلية والأمن|تطبيق|evidence|update
saudi-ai-regulators-map|الجهات المنظمة للذكاء الاصطناعي السعودية|أي جهة ومرجع أراجع حسب استخدامي؟|الامتثال والقانوني|وعي|regulators|update
choose-ai-governance-platform|اختيار منصة حوكمة ذكاء اصطناعي|كيف أقارن الموردين وأطلب إثبات القدرات؟|المشتريات والقيادة التقنية|تقييم|platform|update
ai-cybersecurity-nca|NCA ECC والذكاء الاصطناعي|كيف أربط ضابطًا منطبقًا بمالك ودليل؟|الأمن السيبراني والامتثال|تطبيق|nca|update
ai-governance-financial-sector|تطبيق حوكمة AI في القطاع المالي|كيف أراجع استخدامًا ماليًا قبل قرار مؤثر؟|مخاطر البنوك والامتثال|تطبيق|finance|update
ai-governance-healthcare|تطبيق حوكمة AI في المستشفى|كيف أفصل الاستخدام الإداري عن السريري؟|الجودة السريرية والخصوصية|تطبيق|healthcare|update
ai-bias-fairness|اختبار التحيز والعدالة في AI|من يتحمل الخطأ وما حدود العينة؟|الجودة والمخاطر وفرق التقييم|تطبيق|quality|keep
ai-contract-clauses|بنود عقود الذكاء الاصطناعي|ما الذي أثبته قبل توقيع عقد المورد؟|المشتريات والقانوني|قرار|procurement|keep
data-breach-72-hours-ai|تسرب البيانات عبر AI و72 ساعة|كيف أوثق العلم والوقائع وأصعّد للمختص؟|الاستجابة للحوادث والخصوصية|تطبيق|privacy|keep
ai-data-residency-saudi|إقامة بيانات الذكاء الاصطناعي السعودية|أين تعالج المدخلات والسجلات والدعم والنسخ؟|البنية والأمن والخصوصية|تقييم|privacy|keep
data-governance-vs-ai-governance|حوكمة البيانات مقابل حوكمة الذكاء الاصطناعي|كيف تختلف المسؤوليات وكيف تربط السجلات؟|مكتب البيانات والحوكمة|وعي|governance|keep'''
specs=[dict(zip(['slug','keyword','question','audience','stage','cluster','decision'],l.split('|'))) for l in raw.splitlines()]
prim={'governance':H,'implementation':D,'government':G,'finance':F,'healthcare':C,'privacy':K+'pdpl-and-ai/','risk':K+'ai-risk-assessment/','security':K+'prompt-injection/','policy':K+'ai-use-policy-employees/','ethics':K+'saudi-ai-ethics-principles/','iso':K+'iso-42001-saudi/','inventory':K+'ai-inventory-register/','quality':K+'ai-hallucinations-controls/','procurement':K+'ai-vendor-assessment/','evidence':K+'ai-audit-trail/','regulators':K+'saudi-ai-regulators-map/','platform':'/products/','nca':K+'ai-cybersecurity-nca/','services':'/services/'}
legacy=list(csv.DictReader(open(P/'legacy-migration.csv')))
extra={r['path']:r for r in json.load(gzip.open(R/'Audit/outhers/repository-seo-discovery-2026-11-17/evidence/live-extra-routes.json.gz'))}
current=json.load(open(P/'route-inventory.json')); main=json.load(open(P/'main-text.json'))
gsc={r['keys'][0].replace('https://brightai.live',''):r for r in json.load(open(E/'gsc-page.json'))['rows']}
# Read all guide body sources, not just catalog titles; preserve hashes/extracts for audit.
guide_sources=[]
for f in sorted((R/'src/pages/knowledge').glob('*.astro'))+[R/'src/data/knowledge-guides.ts']:
 s=f.read_text(); guide_sources.append({'source':str(f.relative_to(R)),'sha256':hashlib.sha256(s.encode()).hexdigest(),'characters':len(s),'headings':re.findall(r'<h[123][^>]*>(.*?)</h[123]>',s,re.S),'body':s})
(E/'guide-source-snapshot.json').write_text(json.dumps(guide_sources,ensure_ascii=False,indent=2))
# Explicit consolidations only where same question and answer format repeat.
merge={
 '/hub/':'/docs/','/hub/solutions/':'/products/','/hub/use-cases/':'/solutions/',
 '/docs/governance-application/':D,
 '/blog/ai-governance/':H,'/blog/ai-governance-saudi-arabia/':H,'/blog/what-is-ai-governance-saudi-companies/':H,
 '/answer/ai-governance-saudi-arabia-ar/':H,
 '/docs/ai-risk-management/':K+'ai-risk-assessment/',
 '/docs/pdpl-ai-governance/':K+'pdpl-and-ai/','/docs/pdpl-ai-complete-guide/':K+'pdpl-and-ai/',
 '/blog/pdpl-ai-compliance-guide/':K+'pdpl-and-ai/','/blog/pdpl-and-ai-saudi/':K+'pdpl-and-ai/',
 '/blog/chatgpt-pdpl-data-compliance/':K+'protect-company-data-chatgpt/',
 '/docs/pdpl-chatgpt-data-protection/':K+'protect-company-data-chatgpt/',
 '/docs/sdaia-generative-ai-guidelines/':K+'sdaia-generative-ai-guidelines/',
 '/blog/sdaia-generative-ai-guidelines-practical-compliance/':K+'sdaia-generative-ai-guidelines/',
 '/blog/sdaia-seven-principles-practical-guide/':K+'saudi-ai-ethics-principles/',
 '/blog/ai-usage-policy-template-saudi/':K+'ai-use-policy-employees/',
 '/blog/shadow-ai-discovery-saudi-company/':K+'shadow-ai-detection/',
 '/blog/saudi-ai-regulators-guide/':K+'saudi-ai-regulators-map/',
 '/blog/sdaia-nca-pdpl-regulatory-map/':K+'saudi-ai-regulators-map/',
 '/docs/nca-ecc-ai-controls/':K+'ai-cybersecurity-nca/',
 '/docs/nca-ecc-ai-governance/':K+'ai-cybersecurity-nca/',
 '/docs/nca-ecc-ai-controls-mapping/':K+'ai-cybersecurity-nca/',
 '/docs/nca-ecc-ai-guide/':K+'ai-cybersecurity-nca/',
 '/blog/nca-ecc-ai-controls-guide/':K+'ai-cybersecurity-nca/',
 '/blog/ndmo-data-governance-saudi/':'/blog/ndmo-roles-requirements-guide/',
 '/blog/ai-audit-trail-compliance-path/':K+'ai-audit-trail/',
 '/blog/ai-audit-trail-saudi/':K+'ai-audit-trail/',
 '/docs/ai-audit-trail/':K+'ai-audit-trail/',
 '/lp/government/':G,'/lp/healthcare/':C,'/lp/banking/':F,
 '/solutions/government/':G,'/solutions/healthcare/':C,'/solutions/finance/':F,
 '/solutions/banking-ai-governance/khobar/':F,
 '/solutions/government-ai-governance/dammam/':G,
 '/solutions/government-ai-governance/madinah/':G,
 '/solutions/healthcare-ai-governance/jeddah/':C,
 '/solutions/healthcare-ai-governance/mecca/':C,
 '/solutions/ai-firewall/':'/products/firewall/',
 '/solutions/ai-audit-trail/':'/products/ledger/',
 '/solutions/human-approval-layer/':'/products/human-gate/',
 '/solutions/ai-governance-platform/':'/products/',
 '/docs/ai-governance-platform/':K+'choose-ai-governance-platform/',
 '/blog/best-ai-governance-platforms-2026/':K+'choose-ai-governance-platform/',
 '/docs/ai-firewall/':K+'prompt-injection/',
}
# Avoid false equivalence: data redaction guide is broader than prompt injection; keep this technical guide distinct.
merge.pop('/docs/ai-firewall/')

def cluster(path,title=''):
 s=(path+' '+title).lower()
 for pattern,c in [(r'bank|financ|sama|مصرف|بنوك','finance'),(r'health|hospital|patient|صحي|الصحي','healthcare'),(r'government|حكوم','government'),(r'pdpl|privacy|data-protect|consent|breach|إقامة|بيانات شخصية','privacy'),(r'iso.?42001|iso-42001','iso'),(r'nca|ecc|cscc|ccc|cyber','nca'),(r'audit|evidence|ledger|سجل تدقيق','evidence'),(r'risk|impact|مخاطر','risk'),(r'policy|policies|training|employee|raci|committee','policy'),(r'shadow|inventory|discovery|جرد','inventory'),(r'agentic|injection|redteam|red-team|firewall|security|deepfake','security'),(r'platform|comparison|choose-ai|منصة|منصات','platform'),(r'contract|vendor','procurement'),(r'sdaia|ethic|أخلاق','ethics'),(r'implementation|governance-application|تنفيذ|تطبيق','implementation')]:
  if re.search(pattern,s): return c
 return 'governance'

def mk(path,title,kind,keyword,question,audience,stage,c,decision='update',target='',reason='',boundary='',confidence='متوسطة',source=''):
 text=extra.get(path,{}).get('text',main.get(path,'')); m=gsc.get(path,{})
 return dict(path=path,title=title,type=kind,keyword=keyword,question=question,audience=audience,decision_stage=stage,intent={'وعي':'معلوماتية','تخطيط':'إجرائية/تخطيط','تطبيق':'إجرائية','تقييم':'مقارنة/تحقق','قرار':'تجارية/تواصل'}.get(stage,'ملاحية'),cluster=c,primary_page=prim.get(c,H),decision=decision,merge_target=target,reason=reason,boundary=boundary,confidence=confidence,gsc_clicks=m.get('clicks','NOT OBSERVED'),gsc_impressions=m.get('impressions','NOT OBSERVED'),gsc_position=m.get('position','NOT OBSERVED'),live_status=extra.get(path,{}).get('live_status','snapshot'),evidence=source or 'snapshot 2026-11-17: '+str(P.relative_to(R)),content_excerpt=text[:650],content_characters=len(text),execution='RECOMMENDATION ONLY')
rows=[]
for a in specs:
 p=K+a['slug']+'/'
 rows.append(mk(p,a['keyword'],'guide32',a['keyword'],a['question'],a['audience'],a['stage'],a['cluster'],a['decision'],H if a['decision']=='merge' else '',reason='دمج المدخل العام في المرجع العام مع نقل الخطوات إلى دليل التنفيذ' if a['decision']=='merge' else 'حفظ السؤال المتخصص؛ تحسين الربط والحدود' if a['decision']=='update' else 'نية متخصصة مستقلة؛ صيانة المصادر عند تغيرها',boundary='سؤال محدد كما في question؛ لا تكرار مقدمة الحوكمة أو عرض المنتج أو بيع استشارات',confidence='عالية للمحتوى؛ متوسطة للأداء',source='src/data/knowledge.ts + src/data/knowledge-guides.ts + src/pages/knowledge/*; evidence/guide-source-snapshot.json'))
product_specs={
 '/products/':('منصة حوكمة الذكاء الاصطناعي','كيف تختلف وحدات AIGAS وما حدود التجربة؟','المشتريات والقيادة التقنية','تقييم','platform'),
 '/kernel/':('AIGAS Kernel','ما دور الأساس المشترك وما الذي يحتاج تحققًا؟','المعماريون والأمن','تقييم','platform'),
 '/products/firewall/':('جدار حماية الذكاء الاصطناعي AI Firewall','ماذا يفحص Firewall وكيف أجرب حدوده؟','الأمن والمعماريون','تقييم','security'),
 '/products/risk-engine/':('محرك تقييم مخاطر AI','كيف تبدو تجربة تقييم حالة استخدام؟','المخاطر ومالك الاستخدام','تقييم','risk'),
 '/products/human-gate/':('الموافقات البشرية على قرارات AI','كيف توزع صلاحية المراجعة والقرار؟','المخاطر والعمليات','تقييم','policy'),
 '/products/ledger/':('منتج سجل تدقيق AI','كيف أختبر عرض الدليل والتحقق والتصدير؟','المراجعة الداخلية والأمن','تقييم','evidence'),
 '/products/secure-chat/':('محادثة ذكاء اصطناعي مؤسسية','ما حدود تجربة المحادثة والبيانات والمزود؟','التقنية والأمن','تقييم','platform'),
 '/services/':('استشارات حوكمة الذكاء الاصطناعي','ما نطاق الدعم المطلوب ومخرجاته ومن يعتمده؟','المشتريات والقيادة والامتثال','قرار','services'),
 '/solutions/':('حلول حوكمة الذكاء الاصطناعي حسب القطاع','أي سياق قطاعي يطابق احتياج الجهة؟','القيادة ومالك الأعمال','تخطيط','governance'),
 '/solutions/enterprise/':('حوكمة الذكاء الاصطناعي للشركات','كيف أحدد أدوات الموظفين والبيانات ومسار المراجعة؟','تقنية ومخاطر الشركات','تخطيط','policy'),
 '/solutions/government/':('حوكمة الذكاء الاصطناعي للحكومات','كيف أحوّل احتياج جهة حكومية إلى نطاق قابل للمراجعة؟','التحول الرقمي والمخاطر الحكومية','تقييم','government'),
 '/solutions/finance/':('حوكمة الذكاء الاصطناعي في المصارف','كيف أحدد نطاق برنامج الحوكمة المالي؟','المخاطر والامتثال المالي','تقييم','finance'),
 '/solutions/healthcare/':('حوكمة الذكاء الاصطناعي للرعاية الصحية','كيف أحدد حدود الاستخدام الصحي والقرار السريري؟','الجودة والخصوصية بالمستشفيات','تقييم','healthcare'),
 '/docs/':('أدلة حوكمة الذكاء الاصطناعي','أي دليل يجيب عن سؤالي؟','كل القراء','تصفح','governance'),
}
bycur={r['path']:r for r in current}
for p,(kw,q,a,stage,c) in product_specs.items():
 rows.append(mk(p,bycur.get(p,{}).get('title',kw),'current',kw,q,a,stage,c,'merge' if p in merge else 'update',merge.get(p,''),'توحيد الصفحة القطاعية مع URL المنشور ذي الإشارة البحثية' if p in merge else 'تخصيص النية والإجابة والربط',boundary='عرض قدرة وحدودها ودليلها؛ لا تكرار مقال تعليمي' if '/products/' in p else 'فهرس لا ينافس المقالات' if p=='/docs/' else 'نطاق استفسار دون وعد إتاحة أو مدة أو سعر' if p=='/services/' else 'سياق الجهة لا دليل عام',confidence='عالية للمحتوى؛ متوسطة للأداء'))
# Other current public trust/navigation pages still receive a row.
seen={r['path'] for r in rows}
for r in current:
 p=r['path']
 if p in seen or '/app/' in p or '/auth/' in p or p.startswith('/demo/') or p in ['/404/','/healthz/']: continue
 rows.append(mk(p,r['title'],'current-other',r['title'].split('|')[0], 'ما المعلومات والحدود التي توضحها صفحة '+r['title'].split('|')[0]+'؟','المشتري والمدقق' if any(s in p for s in ['trust','compliance','pricing','terms','privacy']) else 'زائر الموقع','قرار' if p=='/contact/' else 'تصفح',cluster(p,r['title']),'keep',reason='صفحة ثقة أو تنقل مستقلة؛ لا تستهدف الكلمات القطاعية العامة',boundary='تقتصر على وظيفتها الملاحية أو الثقة'))
# All legacy entries are individually enumerated; low confidence explicitly marks rule-assisted assignments.
for r in legacy:
 p=r['legacy_url'].replace('https://brightai.live',''); title=r['title']; c=cluster(p,title); target=merge.get(p,''); text=extra.get(p,{}).get('text','')
 stage='تطبيق' if p.startswith('/docs/') else 'تقييم' if p.startswith(('/solutions/','/kernel/','/lp/')) else 'وعي'
 audience={'finance':'مخاطر وامتثال البنوك','healthcare':'الجودة السريرية والخصوصية','government':'التحول والمخاطر الحكومية','privacy':'الخصوصية والقانوني','nca':'الأمن السيبراني','evidence':'المراجعة الداخلية','security':'الأمن والمطورون'}.get(c,'الحوكمة ومالك الاستخدام')
 boundary='سؤال متخصص في العنوان؛ يحيل للمرجع الرئيسي ولا يعيد المدخل العام'
 decision='merge' if target else 'update'; reason='نفس السؤال والوظيفة؛ نقل الأجزاء الفريدة ثم تحويل إلى الهدف' if target else 'حفظ النية المتخصصة ومراجعة الادعاءات والروابط؛ ليس قرار حذف'
 confidence='متوسطة' if text else 'منخفضة — metadata فقط؛ لا تنفيذ دمج'
 if p in [H,D,G,F,C]:
  decision='update';reason='صفحة رئيسية منشورة؛ الاحتفاظ بعنوان URL وتقوية حدود النية';confidence='عالية لاختيار الوظيفة؛ متوسطة لحجم الفرصة';boundary={H:'تعريف الحوكمة ودورة الحياة؛ تنفيذ تفصيلي في docs؛ شراء دعم في services',D:'خطوات تنفيذ ومالكون ومخرجات وبوابات؛ تعريف مختصر يحيل إلى hub؛ لا بيع خدمات',G:'نطاق حكومي ومراجعة احتياج؛ لا استهداف استشارات عامة أو مصانع',F:'نطاق مصرفي وقرار اختيار الحل؛ لا حوكمة البيانات العامة',C:'نطاق منشأة صحية؛ فصل الإداري والسريري دون ادعاء اعتماد'}[p]
 if p=='/solutions/banking-ai-governance/riyadh/':
  decision='keep';reason='56 ظهورًا للاستعلام المصرفي و77 للصفحة؛ لا دمج متعجل مع الأصل العام';boundary='لجان واعتماد وتطبيق محلي بالرياض؛ ربط بالأصل المالي؛ إعادة قرار الدمج بعد قياس الاستعلامات المحلية';confidence='متوسطة — الأداء مثبت والتميّز المحلي يحتاج اختبارًا'
 if p.startswith('/answer/') and re.search(r'What is|What are',title):
  decision='update';target='';boundary='إجابة إنجليزية مستقلة؛ لا 301 إلى العربية؛ ربط بالمرجع المناسب وتحقق اللغة';reason='اختلاف اللغة يمنع افتراض تطابق النية العربية'
 if p.startswith(('/authors/','/events/','/customers/','/en/')) or any(s in p for s in ['privacy','cookie','agreement','terms','statement','referral','partners','newsletter','sales-deck','sitemap']):
  if not target: decision='update';reason='تحقق الهوية أو الوقائع أو اللغة أو العقد؛ خارج أولوية الكلمات الخمس';stage='تصفح';audience='المشتري والمدقق أو قارئ الإنجليزية';boundary='لا استهداف عام للحوكمة؛ إثبات الأسماء والعملاء والحدث والادعاءات قبل تقويتها'
 if p in ['/hub/','/hub/solutions/','/hub/use-cases/']: c='governance';stage='تصفح';boundary='تجميع تنقل مكرر؛ نقل الروابط إلى الفهرس الموافق لا تجميع كل شيء في الصفحة الرئيسية'
 kw=title.split('|')[0].strip(); question='كيف أستخدم '+kw+' لاتخاذ خطوة واضحة؟' if stage in ['تطبيق','تقييم'] else 'ما '+kw+' وما حدود ما يثبته؟'
 rows.append(mk(p,title,'legacy',kw,question,audience,stage,c,decision,target,reason,boundary,confidence,source='legacy-migration.csv + live-extra-routes.json.gz; '+('fresh Firecrawl evidence/live-*.json' if p in [H,D,G,C,'/solutions/banking-ai-governance/riyadh/'] else 'snapshot 2026-11-17; not re-fetched in this task')))
# Specific question/keyword owners for core legacy pages.
for r in rows:
 if r['path'] in [H,D,G,F,C]:
  kw,q,a,stage,c={H:('حوكمة الذكاء الاصطناعي','ما الحوكمة وكيف تختلف عن الأمان وحوكمة البيانات؟','القيادة ومالك البرنامج','وعي','governance'),D:('تنفيذ حوكمة الذكاء الاصطناعي','ما خطوات التنفيذ ومالك ومخرج وبوابة كل خطوة؟','مدير برنامج الحوكمة','تطبيق','implementation'),G:('حوكمة الذكاء الاصطناعي للحكومات','ما نطاق حوكمة جهة حكومية وما الأدلة التي تراجعها؟','التحول الرقمي والمخاطر الحكومية','تقييم','government'),F:('حوكمة الذكاء الاصطناعي في المصارف','كيف أقيم نطاق حل الحوكمة للمصرف؟','المخاطر والامتثال والمشتريات المصرفية','تقييم','finance'),C:('حوكمة الذكاء الاصطناعي للرعاية الصحية','كيف أحدد نطاق حوكمة منشأة صحية قبل اختيار الحل؟','الجودة والخصوصية والمشتريات الصحية','تقييم','healthcare')}[r['path']]
  r.update(keyword=kw,question=q,audience=a,decision_stage=stage,cluster=c,primary_page=r['path'],intent='إجرائية' if stage=='تطبيق' else 'معلوماتية' if stage=='وعي' else 'تقييم حل قطاعي')
# No multi-hop consolidation; every terminal is existing and preserved.
lookup={r['path']:r for r in rows}
for r in rows:
 if r['merge_target']:
  target=r['merge_target']; visited=set()
  while target in lookup and lookup[target]['merge_target']:
   assert target not in visited;visited.add(target);target=lookup[target]['merge_target']
  r['merge_target']=target
  if target not in lookup: raise Exception('Missing target '+target)
fields=list(rows[0]);
with open(O/'keyword-to-page-map.csv','w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
with open(O/'guides-32.md','w') as f:
 f.write('# خريطة الأدلة الـ32\n\nكل الكلمات هنا أهداف تحريرية، وليست أحجام بحث أو ترتيبًا مثبتًا. غياب صف GSC = NOT OBSERVED وليس صفر طلب. تفاصيل الجمهور والحدود والدليل في CSV.\n\n| الصفحة | الكلمة / السؤال | الجمهور | المرحلة | القرار | المرجع الرئيسي |\n|---|---|---|---|---|---|\n')
 for r in rows:
  if r['type']=='guide32': f.write('| '+ ' | '.join([r['path'],r['keyword']+' — '+r['question'],r['audience'],r['decision_stage'],r['decision'],r['primary_page']])+' |\n')
provenance={'date':'2026-11-17','head':__import__('subprocess').check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'gsc':'fresh connector sc-domain:brightai.live; web/final; 2026-10-18..2026-11-14; comparison 2026-09-20..2026-10-17','source_snapshots':[str(P.relative_to(R)), 'Audit/outhers/repository-seo-discovery-2026-11-17/evidence/live-extra-routes.json.gz'],'rows':len(rows),'guides':len(specs),'legacy':len(legacy),'legacy_with_body':sum(bool(extra.get(r['legacy_url'].replace('https://brightai.live',''),{}).get('text')) for r in legacy),'decisions':dict(collections.Counter(r['decision'] for r in rows)),'network':'local urllib blocked DNS; five fresh Firecrawl reads succeeded','not_done':['no page edits','no redirects changed','no deploy','no full live recrawl','no causal cannibalization proof','no keyword search-volume measurement']}
(E/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)); print(json.dumps(provenance,ensure_ascii=False,indent=2))
