import pathlib,csv,json,collections
O=pathlib.Path('audit/intent-map-2026-11-17'); report=O/'REPORT.md';s=report.read_text().replace('84 صف صفحة','116 صف صفحة');s=s if 'فحص صفحة الرياض →' in s else s.replace('المصدر: ستة ملفات', 'فحص صفحة الرياض → الاستعلامات أعاد استعلامين مصرفيين عامين (56 و12 ظهورًا)، دون استعلام محلي مكشوف؛ إبقاؤها مؤقت لصون الإشارة، وليس إثبات نية محلية. صفحة services أعادت صفر استعلامات مكشوفة رغم 5 مرات ظهور على مستوى الصفحة؛ لا يفسّر هذا بأنه صفر طلب.\n\nالمصدر: ستة ملفات');report.write_text(s)
items=[
(0,'بوابة صون الإرث','الصفحات الخمس الفائزة + المصدر والخريطة',5,.95,1,'مسؤول المحتوى + المطور','لا شيء','سجل URL ونسخة مصدر قابلة للاستيراد؛ تحديد تعارض المصدر ذي57 صفحة مع الإرث','عدم إسقاط أي صفحة ذات إشارة؛ لا نشر ضمن هذه المهمة'),
(1,'حكومة: سؤال نطاق واضح','/solutions/government-ai-governance/',5,.85,1.5,'محرر قطاعي + مختص مخول','بوابة صون الإرث','مقدمة مباشرة؛ استخدام موظفين/خدمة مستفيد؛ بيانات ومالك وضابط ودليل؛ CTA استفسار','عنوان وحيد للنية؛ حذف الوعود غير المثبتة؛ ربط docs والسياسة وNCA؛ مراجعة كل ادعاء رسمي'),
(2,'صحة: فصل القرار السريري','/solutions/healthcare-ai-governance/',5,.85,1.5,'محرر + جودة سريرية وخصوصية','بوابة صون الإرث','تمييز إداري/سريري؛ حدود المنتج؛ قائمة أدلة للمراجعة المختصة','لا وعد اعتماد طبي أو إتاحة؛ دعم knowledge healthcare؛ تمييز نية المقال عن الحل'),
(3,'مصارف: تثبيت الأصل وصون الرياض','/solutions/banking-ai-governance/;/solutions/banking-ai-governance/riyadh/',5,.70,2,'محرر مالي + امتثال مالي','بوابة صون الإرث','تحسين أصل القطاع؛ إبقاء الرياض؛ فصل البيانات عن استخدام AI ومراجعة القرار','لا301 للرياض؛ توثيق غياب استعلام محلي مكشوف؛ مثال AML مساعد لا قرار آلي؛ لا ادعاء اعتماد SAMA'),
(4,'تنفيذ: مالك ومخرج وبوابة','/docs/ai-governance-saudi-arabia/;/docs/governance-application/',4,.80,2,'محرر حوكمة + مدير برنامج','بوابة صون الإرث','خطة مراحل مع RACI وجرد ومخاطر وسياسة ودليل؛ نقل المفيد من30يوم','لا مدة تسليم أو امتثال تلقائي؛ إحالة التعريف إلى hub؛ حل روابط الأدوات غير المثبتة'),
(5,'استشارات: تأهيل نطاق الدعم','/services/',4,.75,1,'محرر تجاري + المالك','تحديد حدود العرض من المصدر؛ أي وعد جديد يحتاج المالك','سؤال الاحتياج؛ المخرجات الممكن مناقشتها؛ مدخلات عامة ومراجعة وحدود مسؤولية','H1/title يوضحان نطاق الاستفسار؛ لا خدمة متاحة أو SLA أو سعر أو مدة دون اعتماد؛ ربط من docs/hub/القطاعات'),
(6,'مرجع الحوكمة: وقف خلط النية','/hub/ai-governance/;/knowledge/ai-governance-saudi/',4,.80,1.5,'محرر حوكمة','بوابة صون الإرث + docs التنفيذ','مرجع تعريف ودورة حياة؛ نقل خطوات طويلة إلى docs؛ توحيد المدخل العام','دمج knowledge بعد نقل الفريد؛ الحفاظ على قسم النضج والوكلاء بإحالات متخصصة؛ لا استهداف استشارات في المقدمة'),
(7,'ربط الأدلة المساندة الستة','/knowledge/ai-inventory-register/;/knowledge/ai-governance-committee-raci/;/knowledge/ai-risk-assessment/;/knowledge/sdaia-generative-ai-guidelines/;/knowledge/ai-governance-healthcare/;/knowledge/ai-governance-financial-sector/',4,.85,1.5,'محرر المعرفة','تثبيت أهداف الفرص الخمس','روابط سياقية باتجاه الصفحة الرئيسية والعكس؛ منع تكرار العرض العام','سؤال ومخرج مستقل لكل دليل؛ رابط تنفيذ/قطاع/استفسار حسب السياق؛ لا روابط محشوة'),
(8,'إزالة استهداف الحكومة من الصناعة','/solutions/manufacturing-ai-governance/',3,.80,1,'محرر قطاعي','مراجعة النص الصناعي كاملًا قبل التحرير','تركيز الاستخدام الصناعي؛ إزالة فقرة حكومة/استشارات عامة ونقل المناسب','لا تحويل للصفحة إلى قطاع غير مكافئ؛ إحالات وصفية إلى الحكومة والخدمات'),
(9,'فهرس واحد للمعرفة','/docs/;/hub/;/knowledge/',3,.80,1,'محرر IA + مطور','نقل المحتوى والروابط الفريدة؛ فحص مصدر كل وجهة','docs فهرس أدلة؛ hub→docs؛ knowledge يبقى التحويل القائم','لا تحويل جماعي docs/*؛ تحديث روابط الفهارس؛ هدف200 canonical ذاتي بلا سلسلة'),
(10,'فصل عرض المنتج عن الشرح','/products/;/products/firewall/;/products/ledger/;/products/human-gate/;/solutions/ai-governance-platform/',3,.65,2,'محرر منتج + مطور','فحص GSC/backlinks لكل مصدر دمج ثم نقل الفريد','توحيد نسخ حلول المنتجات مع صفحات المنتجات؛ إبقاء أسئلة الأدلة','لا ضياع نية audit-trail أو redaction؛ لا دمج risk-classification في risk-engine؛ حالة تجربة لا إثبات تشغيل'),
(11,'توحيد الأدلة التنظيمية العامة','PDPL/NCA/SDAIA: صفوفmerge في الخريطة',3,.65,3,'محرر + مختص مخول','بعد الفرص الخمس؛ مراجعة المصادر الرسمية والنسخ','نقل المحتوى الفريد إلى الدليل32 المناسب؛ إبقاء الأسئلة الدقيقة','لا تعميم إلزام/موافقة/مدة احتفاظ؛ لا دمج المقارنة أو الحوادث أو حقوق الموظف في مقدمة عامة'),
(12,'المحليات محدودة التميز','government dammam/madinah;healthcare jeddah/mecca;banking khobar',2,.55,2,'محرر قطاعي + مطور','قراءة كاملة ومراجعةbacklinks وGSC لكل صفحة؛ استثناء الرياض','نقل أي قيمة محلية مثبتة إلى أصل القطاع ثم301 واحد','عدم تنفيذ دمج الرياض؛ مقصد مكافئ؛ لا صفحات مدينة جديدة'),
(13,'صيانة بقية الأدلة32 والإرث','الصفوف keep/update الأقل أولوية',2,.55,4,'مالك المحتوى','المجموعات ذات الأثر الأعلى أولًا','مراجعة العناوين والمصادر والإسناد والحدود؛ فصل الإنجليزية والهوية عن العربي','لا تقوية أسماء مؤلفين أو عملاء أو حالات نجاح أو نسب توفير دون إثبات'),
(14,'تحقق ما بعد نشر مصرح','كل الصفحات المتغيرة',4,.80,1,'SEO + مطور','تنفيذ ونشر منفصلان؛ نافذة بيانات نهائية','HTTP/canonical/robots/سلاسل؛ مقارنة فترتين28يوم query→page','توثيق تاريخ النشر؛ النقرات وCTR وحصة الوجهة؛ no-volume claims؛ تقييم فقد الأسئلة المتخصصة')]
fields=['dependency_order','task','pages','impact_1_5','confidence_0_1','effort_editorial_days_estimate','priority_score','owner','dependency','deliverable','acceptance']
plan=[]
for order,title,pages,i,c,e,owner,dep,out,acc in items:plan.append(dict(zip(fields,[order,title,pages,i,c,e,round(i*c/e,2),owner,dep,out,acc])))
# Execution order respects prerequisites. Score supports within-wave selection; not a fake traffic forecast.
with open(O/'editorial-plan.csv','w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(plan)
with open(O/'editorial-plan.md','w') as f:
 f.write('# خطة التحرير المرتبة\n\nالأيام تقدير تحرير ومراجعة، لا وعد تسليم. الترتيب يراعي الاعتماد ثم أولوية GSC؛ الدرجة أثر×ثقة÷جهد للمقارنة داخل الموجة، ولا تتجاوز بوابات الحفظ والتحقق.\n\n| ترتيب | المهمة | الأثر /5 | الثقة | الجهد المقدّر (يوم عمل) | درجة الفرز |\n|---|---|---:|---:|---:|---:|\n')
 for r in plan:f.write('| '+' | '.join(str(r[k]) for k in ['dependency_order','task','impact_1_5','confidence_0_1','effort_editorial_days_estimate','priority_score'])+' |\n')
 f.write('\nتفاصيل المالك والمخرج والاعتماد ومعيار القبول في [CSV](editorial-plan.csv). لا تُجمع الأيام كتاريخ إطلاق؛ المراجعات والانتظار غير مقدّرة.\n')
# Explicit recommendation rows, easily reviewed independently of the broad inventory.
rows=list(csv.DictReader(open(O/'keyword-to-page-map.csv')))
for r in rows:
 r['keyword_owner']=r['merge_target'] or r['path']
 r['evidence_level']='SOURCE_CURRENT' if r['type']=='guide32' else 'FRESH_LIVE' if r['path'] in ['/hub/ai-governance/','/docs/ai-governance-saudi-arabia/','/solutions/government-ai-governance/','/solutions/healthcare-ai-governance/','/solutions/banking-ai-governance/riyadh/'] else 'SAME_DAY_SNAPSHOT'
with open(O/'keyword-to-page-map.csv','w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
with open(O/'merge-decisions.csv','w',newline='') as f:
 fs=['path','title','merge_target','reason','confidence','gsc_clicks','gsc_impressions','gsc_position','execution'];w=csv.DictWriter(f,fieldnames=fs,extrasaction='ignore');w.writeheader();w.writerows(r for r in rows if r['decision']=='merge')
paths={r['path'] for r in rows};errors=[]
assert len(rows)==len(paths)==311
assert sum(r['type']=='guide32' for r in rows)==32
assert sum(r['type']=='legacy' for r in rows)==254
for r in rows:
 for k in ['keyword','question','audience','decision_stage','intent','decision','boundary','evidence']:
  if not r[k]:errors.append(r['path']+': missing '+k)
 if r['merge_target']:
  assert r['merge_target'] in paths
  assert not next(z for z in rows if z['path']==r['merge_target'])['merge_target']
assert not errors,errors
v={'result':'PASS','unique_pages':len(paths),'guides':32,'legacy_pages':254,'all_have_keyword_question_audience_stage_intent_decision_boundary_evidence':True,'merge_targets_existing_and_terminal':True,'decisions':dict(collections.Counter(r['decision'] for r in rows)),'gsc_current_query_rows':json.load(open(O/'evidence/gsc-query.json'))['row_count'],'gsc_page_rows':json.load(open(O/'evidence/gsc-page.json'))['row_count'],'new_public_urls_proposed':0,'page_content_changes':0,'limitations':'semantic editorial review assisted by rules for legacy tail; not backlink, legal, causal or release verification'}
(O/'evidence/validation.json').write_text(json.dumps(v,ensure_ascii=False,indent=2));print(json.dumps(v,ensure_ascii=False,indent=2))
