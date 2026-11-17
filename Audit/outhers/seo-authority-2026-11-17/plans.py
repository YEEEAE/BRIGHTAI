import pathlib,json,csv
P=pathlib.Path(__file__).resolve().parent
def write(name,rows):
 with (P/name).open('w') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
items=[
('P0','SEO-01','البناء الحالي يفشل','src/pages/knowledge/pdpl-and-ai.astro:448; build-final.log','تصحيح توازن الوسوم فقط ثم build وroutes على HEAD ثابت','كسر البنية أو حذف محتوى؛ ممنوع حذف التحذير','Astro','build PASS و57 صفحة عامة على SHA نهائي'),
('P1','SEO-02','تحويلات النشر غائبة','138 تحويلًا محليًا؛ أول crawl حي 0 استجابة301','تطبيق جدول301 المعتمد في أصل النشر/الحافة بعد بروفة وربط الهدف بالمحتوى','فقد نية البحث أو حلقات؛ لا تحويل جماعي إلى الرئيسية','DevOps/SEO','GET+HEAD/query:301 واحد إلى200 لكل alias'),
('P1','SEO-03','sitemap قديم حي ومُرسل','sitemap.xml=264 مقابل sitemap-0.xml=57؛ GSC سجل قديم','حسم جرد الروابط القديمة ثم301 للقديم إلىindex وتحديث الإرسال يدويًا','إزالة صفحات ذات قيمة قبل mapping؛ الإرسال لا يضمن الفهرسة','SEO/Owner','خريطة موحدة وروابطها canonical200 عامة فقط'),
('P1','SEO-04','إرث خارج المستودع ما زال200 ومفهرسًا','/en/ و/authors/yazeed-alshareef/ و/solutions/ai-risk-classification/','تصنيف كل legacy إلىkeep+import أوmerge301 أو404/410 مبرر؛ مراجعة ادعاءات المؤلفين والتشغيل','استعادة ادعاء غير مثبت أو فقد زيارات قديمة','Editorial/SEO','migration-map يحسم كل URL مع سبب ومراجعة بشرية'),
('P1','SEO-05','وجهة التجربة والمصادقة حية404','/auth/sign-up/ و/app/kernel/','CTA العام يوضح مختبرًا اصطناعيًا؛ توجيه التشغيل إلىاستفسار حتى نشر مصادق مثبت','تحويل الزائر لوعد تشغيل غير متاح','Product','لا CTA عام ينتهي404؛ لا ادعاء48h فعّال دون دليل'),
('P1','SEO-06','المراجعة التخصصية غير معتمدة','ArticleContext ومقالPDPL يصرحان بانتظار المراجعة','إضافة سير مراجعة حقيقي ونطاق ومسؤول دون اختلاق شخص أو اعتماد','تبسيط حكم نظامي أو إزالة التحذيرات','Legal/Editorial','ادعاءات مهمة ترتبط بمادة/نسخة/نوع مصدر ومراجع مخول'),
('P1','SEO-07','قياس التحويل غير مثبت','GA4 key events=0؛4form_start؛إزالةgtag أثناءالجولة','اعتماد تعريف lead مؤهل وربطه باستلام فعلي؛ حسم بنية القياس الحالية أولًا','mailto_open ليسlead؛ إرسال PII أو query حساسة','Analytics/Privacy','حدث موثق بلاPII؛ مؤهل ومُستلم في نظام حقيقة مستقل'),
('P2','SEO-08','تواريخ التحرير متعارضة','helper dateModified=2026-10-31؛ إضافات2026-11-08','جعل تاريخ الصفحة مصدرًا واحدًا؛ تمييز نشر/تعديل/اطلاع ومراجعة','إيهام تحديث غير حقيقي','Editorial/Astro','تطابق النص وArticle؛lastmod من تعديل جوهري فقط'),
('P2','SEO-09','AEO غير متسق','20/32 lead فقط ضمن40–70 كلمة؛32 بلا عنوانمتى لايكفي','حزمة تحرير مخصصة لكل دليل: جواب/تعريف/ثابت ومشروط/خطوات/حدود/مصادر','قالب مكرر أو حشو؛ العدد شرط تحريري لا عامل ترتيب','Editorial','32 rubric مكتمل مع الحفاظ على المحتوى المتميز'),
('P2','SEO-10','هوية العربية في demo غير موحدة','6demo lang=ar مقابلar-SA','توحيدlang معRTL دون تغييرnoindex','تغييرindexability للمحاكاة خطأ','Astro','6demo ar-SA وnoindex وخارجsitemap'),
('P2','SEO-11','أداء ووصول يحتاجان معالجة مقيسة','browser-lab.json؛ نتائج مختبر فقط','إصلاح أسبابCLS/LCP المثبتة فيtargets فقط؛ إعادة3قياسات مماثلة','تغييرHero أو تحميل كل الصورlazy بلا قياس','Frontend','LCP≤2.5s/CLS≤0.1 فيبروفة؛fieldp75 مستقل'),
('P2','SEO-12','Product Schema لتصورات غير متاحة','5Product بلاoffers/reviews','مراجعةWebPage/about أوProduct وصفي صادق؛ لااختلاقprice/review لإرضاءvalidator','إشارة بيع غير مثبتة؛JSON parse ليسrich result','SEO','الترميز يطابق المحتوى؛لاOffer/Rating وهمي'),
('P2','SEO-13','مصادر عامة بدل الإسناد الموضعي','الأدلة القديمة تربط أحيانًا صفحةسدايا الرئيسية','ربط الادعاء بالمستند/المادة والجهة والنسخة ونوعها وتاريخاطلاع حقيقي','تسمية مسودة نظامًا أو نسخ النصوص','Editorial','claim-source matrix لكل مقال حساس'),
('P3','SEO-14','فرص صور المشاركة والخطوط','OG موحد1536×1024؛TTF swap وpreload400','صورةمشاركة1200×630 لاحقًا؛تجربةWOFF2 وفحصCLS','تغيير الشعار المعتمد أو خط بلا ترخيص','Brand/Frontend','مقارنةبصرية وهويةثابتة؛قياسحجم/زمن قبلوبعد'),
('P3','SEO-15','سلطة خارجية غير مقيسة','لاOpenSEOproject؛لاbacklinkdataset','خطةأصولوبحثأصلي وتواصلتحريري بعداعتماد','شراء/PBN/روابطمدفوعةأومؤلفوهمي','Marketing','روابطتحريرية موثقة؛لامراسلات آلية'),
]
issues=[dict(zip(['priority','id','issue','evidence','proposed_change','seo_risk','owner','acceptance'],i)) for i in items];write('issues.csv',issues)
topics=[
('حوكمة الذكاء الاصطناعي في السعودية','ai-governance-saudi','sdaia-ai-adoption-framework','ai-governance-committee-raci;ai-inventory-register','كيف تبدأ المنشأة؟ من المسؤول؟','معلوماتي/إجرائي','حوكمة الذكاء الاصطناعي;AI governance Saudi','SDAIA','https://sdaia.gov.sa/ar/SDAIA/about/Pages/AboutAI.aspx','دليل إرشادي؛ يراجع النص والنسخة'),
('سياسة الموظفين','ai-governance-saudi','ai-use-policy-employees','ai-employee-training;shadow-ai-detection','ما المسموح؟ كيف يعتمد الاستثناء؟','إجرائي','سياسة استخدام الذكاء الاصطناعي;acceptable use policy','SDAIA','https://sdaia.gov.sa/en/MediaCenter/KnowledgeCenter/ResearchLibrary/AIGuidelinesForGovernment.pdf','دليل موجه للحكومة؛لايعُمّم علىالجميع'),
('تقييم المخاطر','ai-governance-saudi','ai-risk-assessment','ai-impact-assessment;ai-bias-fairness','كيف أصنف الخطر وأراجع المتبقي؟','إجرائي','تقييم مخاطر الذكاء الاصطناعي;AI risk assessment','NIST','https://www.nist.gov/itl/ai-risk-management-framework','إطار طوعي؛ لا حكمامتثال سعودي'),
('حماية بيانات المنشأة','ai-governance-saudi','protect-company-data-chatgpt','data-classification-for-ai;ai-data-residency-saudi','ماالبياناتالتييمكنإدخالها؟','إجرائي','حماية بيانات ChatGPT;enterprise AI data protection','SDAIA','https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL','نظام؛تحددالمادةوالنطاق'),
('PDPL والذكاء الاصطناعي','pdpl-and-ai','pdpl-and-ai','data-breach-72-hours-ai;ai-contract-clauses','متىيكونالإدخال معالجة؟ منالمتحكم؟','معلوماتي/إجرائي','PDPL AI;نظام حماية البيانات الشخصية','SDAIA','https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2','لائحة تنفيذية؛لافتوى'),
('ISO/IEC 42001','ai-governance-saudi','iso-42001-saudi','ai-governance-committee-raci;ai-audit-trail','هل أحتاج نظامإدارة أمشهادة؟','مقارن/إجرائي','ISO 42001 Saudi;AIMS','ISO','https://www.iso.org/standard/42001','معيار دولي؛لاتثبتشهادةالموقع'),
('أخلاقيات سدايا','saudi-ai-ethics-principles','saudi-ai-ethics-principles','sdaia-ai-ethics-self-assessment;ai-bias-fairness','كيفتترجمالمبادئإلىاختبار؟','معلوماتي/إجرائي','SDAIA AI ethics;مبادئ أخلاقيات AI','SDAIA','https://dgp.sdaia.gov.sa/wps/portal/pdp/services/AIEthicsAssessment','أداة تقييم؛ليستشهادة'),
('Shadow AI','ai-governance-saudi','shadow-ai-detection','ai-inventory-register;ai-use-policy-employees','كيفأكتشفاستخدامًاغيرمعتمد بلاانتهاكخصوصية؟','إجرائي','Shadow AI;الذكاء الاصطناعي غير المعتمد','NIST','https://www.nist.gov/itl/ai-risk-management-framework','مرجع منهجي؛الخطواتتفسيرتحريري'),
('Prompt Injection','ai-governance-saudi','prompt-injection','protect-company-data-chatgpt;ai-vendor-assessment','ماالحقنالمباشروغيرالمباشر؟','معلوماتي/إجرائي','Prompt Injection;حقن التوجيهات','OWASP','https://genai.owasp.org/glossary/prompt-injection/','مرجع تقني غيرملزم'),
('تقييم الموردين','ai-governance-saudi','ai-vendor-assessment','ai-contract-clauses;ai-data-residency-saudi','ماأدلةالأمنوالاحتفاظقبلالتعاقد؟','تجاري استقصائي/إجرائي','AI vendor assessment;تقييم موردي AI','SDAIA/ISO','https://www.iso.org/standard/42001','قائمةتعليمية؛لاادعاءتكاملمعتمد'),
('سجل التدقيق','ai-governance-saudi','ai-audit-trail','data-classification-for-ai;ai-inventory-register','ماذا نحفظ؟ من يقرأ؟ متى نحذف؟','معلوماتي/إجرائي','AI audit trail;سجل تدقيق الذكاء الاصطناعي','NIST','https://www.nist.gov/itl/ai-risk-management-framework','لاتساويhashchainامتثالًا'),
('الإشراف البشري','ai-governance-saudi','ai-impact-assessment','ai-governance-committee-raci;ai-risk-assessment','متىتلزمالمراجعةومنلهصلاحيتها؟','إجرائي','human oversight;مراجعة بشرية AI','ISO/SDAIA','https://www.iso.org/standard/42001','فجوة محتوى:أضفقسمًا متخصصًا أولًا؛لاURLجديدالآن'),
('الجهات الحكومية','ai-governance-saudi','sdaia-generative-ai-guidelines','sdaia-ai-adoption-framework;saudi-ai-law-binding-vs-guidance','أينتختلفنسخةالحكومةعنالعموم؟','معلوماتي/تجاري استقصائي','حوكمة AI للحكومات;government AI governance','SDAIA','https://sdaia.gov.sa/en/MediaCenter/KnowledgeCenter/ResearchLibrary/AIGuidelinesForGovernment.pdf','دليلحكومي؛فصلالإلزامعنالتوصية'),
('القطاع المالي','ai-governance-saudi','ai-governance-financial-sector','ai-vendor-assessment;ai-contract-clauses','ماالمتطلباتالقطاعيةالتيتنطبقعلىالجهة؟','إجرائي/تجاري استقصائي','حوكمة AI المصارف;financial AI governance','SAMA','https://rulebook.sama.gov.sa/','اختيارنصونطاقوإصدارقبلأيادعاء؛الرابطمساربحثفقط'),
('الرعاية الصحية','ai-governance-saudi','ai-governance-healthcare','pdpl-and-ai;ai-impact-assessment','هليؤثرالاستخدامفيقرارصحي؟','إجرائي/تجاري استقصائي','حوكمة AI الصحية;healthcare AI governance','SFDA/SDAIA','https://www.sfda.gov.sa/','تحديدتصنيفالأداةوالنصأولًا؛الرابطمساربحث'),
('الشركات','ai-governance-saudi','choose-ai-governance-platform','ai-use-policy-employees;ai-vendor-assessment','كيفأقارنمتطلباتالأداةبالدليلالفعلي؟','مقارن/تجاري استقصائي','AI governance platform;منصة حوكمة AI','ISO/SDAIA','https://www.iso.org/standard/42001','مقارنةمعاييرلاادعاءأفضليةمنتج'),
]
tm=[];linkplan=[]
for t in topics:
 topic,pillar,corner,support,q,intent,kw,org,url,kind=t
 path=lambda s:'/knowledge/'+s+'/'
 tm.append({'topic':topic,'pillar':path(pillar),'cornerstone':path(corner),'supporting':';'.join(path(s) for s in support.split(';')),'user_questions':q,'intent':intent,'keywords_ar_en':kw,'internal_link_opportunity':'pillar → cornerstone → supporting → contact; supporting → cornerstone','primary_source_owner':org,'source_url':url,'source_status':kind,'keyword_volume':'NOT MEASURED; GSC observed demand separately'})
 for slug in support.split(';'):linkplan.append({'from':path(corner),'to':path(slug),'anchor_intent':topic+' — خطوةمحددة','state':'PROPOSED; deduplicate against internal-links.csv','conversion':'/contact/ only when relevant; secondary /docs/'})
write('topical-map.csv',tm);write('internal-linking-plan.csv',linkplan)
prospects=[
('جمعية الذكاء الاصطناعي السعودية','https://sdaia.gov.sa/','اكتشاف الجهة/المجتمع المختص؛لايُفترضشراكة','ندوة عنسجل الاستخدامات وتقديمقالبموثق','صفحةمواردتحريرية','صفحةالتواصلالرسميةبعدتحققالجهة؛لاتواصلمنفذ','متوسط:ليسكلجهةتقبلروابط'),
('KAUST Artificial Intelligence','https://ai.kaust.edu.sa/','ملاءمةبحثيةلموضوعالتقييموالأمان','بروتوكولبحثأصليمفتوحومراجعةمنهجية','اقتباسبحث/مورد','نموذجالتواصلالرسميبعدتحققصفحةالفريق','منخفضتحريريًا؛لامقابلللرابط'),
('جامعةالملكسعود','https://ksu.edu.sa/','تعليموبحوثتقنيةبالسعودية','ورشةعمليةعنPromptInjectionببياناتاصطناعية','مواردورشة/فعالية','قسمأوكليةمختصةبعدبحثيدوي','متوسط:رفضالترويجالتجاري'),
('الاتحادالسعوديللأمنالسيبراني','https://safcsp.org.sa/','تقاطعحوكمةAIوالأمن','نموذجتهديدموثقوقابلللتكرار','مرجعفعاليات/مجتمع','نموذجتواصلمعلنبعدالتحقق','متوسط:تحريريومرتبطبالموضوعفقط'),
('OWASP GenAI','https://genai.owasp.org/','مرجعتقنيملائمومفتوح','مساهمةأصليةباختباراتعربيةوحدودواضحة','استشهادمشروع/مساهمة','مسارالمساهمةالرسمي؛لاطلبروابطمجرد','منخفضعندالقيمة؛لامساهمةترويجية'),
('مجتمعاتحوكمةالبياناتوDPO','https://dgp.sdaia.gov.sa/','بوابةلاكتشافالفعالياتوالجهاتالمناسبة','قاموسيربطالادعاءبالمصدرونوعالإلزام','رابطقائمةموارد','تحقققناةتحريريةفعليةقبلالتواصل','مرتفعإذااستُخدمرابطحكوميكاعتمادللشركة'),
]
write('backlink-prospects.csv',[dict(zip(['prospect','discovery_url','fit','asset_pitch','link_type','contact_method','spam_risk'],x)) for x in prospects])
changes={
 'src/pages/knowledge/pdpl-and-ai.astro':('P0','تصحيحالوسم؛مراجعةتحريريةبعدالاعتماد','SEO-01/06/08'),
 'src/data/knowledge-guides.ts':('P2','توحيدحقولالإجابةوالحدودوالإسناد؛لاتوسيعآلي','SEO-09/13'),
 'src/data/structured-data.ts':('P2','تاريخمملوكلكلصفحةوربطكياناتثابت','SEO-08/12'),
 'src/pages/knowledge/[article].astro':('P2','قالبمراجعةومصادرودليلحدودمخصص','SEO-06/09'),
 'src/pages/knowledge/ai-governance-saudi.astro':('P2','إجابةمباشرة40–70وتوحيدتاريخالمراجعة','SEO-08/09'),
 'src/pages/knowledge/ai-risk-assessment.astro':('P2','قالبعمليوحدودتقييمونموذجقابلللتنزيلبعدمراجعة','SEO-09'),
 'src/pages/knowledge/ai-use-policy-employees.astro':('P2','تخصيصخطواتاعتمادالسياسةومخرجاتها','SEO-09'),
 'src/pages/knowledge/protect-company-data-chatgpt.astro':('P2','ربطالضوابطبالعقدوالبياناتوالإسناد','SEO-09/13'),
 'src/components/ArticleContext.astro':('P2','فصلالنشروالتحديثوالمراجعةالحقيقية','SEO-06/08'),
 'src/pages/contact.astro':('P1','CTAواضحووصفmailtoوحالاتفتحوفشلصادقة','SEO-05/07'),
 'src/components/ProductJourney.astro':('P1','توجيهCTAإلىوجهةعاملةحتىاعتمادالتشغيل','SEO-05'),
 'src/pages/products/[product].astro':('P2','تقييمschemaالوصفيوحمايةتنبيهالتصور','SEO-12'),
 'src/pages/demo/[product].astro':('P2','توحيدar-SAفقطوإبقاءnoindex','SEO-10'),
 'scripts/verify-routes.mjs':('P1','فصلعقدSEOعنتضمينGA4الثابتالملغى؛لاإخفاءفشل','SEO-07'),
 'scripts/seo-build.mjs':('P2','lastmodفقطإذاوصلتتواريخموثقة؛لاtimestampبناء','SEO-08'),
 'redirects.json':('P1','توسيعmappingبعدمراجعةجردالإرث','SEO-02/04'),
}
manifest=json.loads((P/'summary.json').read_text())
sources=list(csv.DictReader((P/'source-scan.csv').open()))
plan=[]
for row in sources:
 f=row['file'];change=changes.get(f)
 if change:plan.append({'file':f,'action':'PROPOSED CHANGE; approval pending','priority':change[0],'reason':change[1],'issues':change[2]})
 else:plan.append({'file':f,'action':'UNCHANGED','priority':'','reason':'خارجالإصلاحالمثبتحاليًا؛يحفظالعقدوالهوية؛لاتغييراحتياطي','issues':''})
write('file-plan.csv',plan)
(P/'PLAN.md').write_text("""# خطة التنفيذ للاعتماد

الحالة: PROPOSED. لم تُنفّذ تعديلات SEO أو المحتوى في هذه المهمة.

1. **تثبيت المصدر وإزالة عائق البناء:** اعتماد SHA ثابت، تصحيح وسم PDPL فقط، build ثم اختبار المسارات. لا اعتماد على PASS البداية كدليل للنسخة الحالية.
2. **حسم إرث النشر:** مراجعة legacy-migration.csv والصفحات الإنجليزية والمؤلفين؛ إبقاء ما له أصل موثوق أو دمجه إلى أقرب مقصد أو404/410 مبرر. لا حذف شامل ولا تحويل لكلشيء إلى الرئيسية.
3. **توحيد الزحف والتحويلات:** تطبيق301 في أصل/حافة مخوّلة بعد بروفة GET/HEAD/query، إزالة تناقض sitemap القديم، ثم تحديث إرساله في Search Console كعملية مستقلة.
4. **إغلاق مسار التحويل:** مختبر عام موضح؛ استفسار مؤهل عندطلبتشغيل. لاوعدبالتجربةالمصادقعليهاوالرابط404. تحسينmailto لايعنيإنشاءنظاماستقبال.
5. **تحرير المصدر والإسناد:** مراجعة32مقالًا بمصفوفة answer/definition/ثابتومشروط/خطوات/حدود/مصدر؛ بدءالحوكمةوPDPLوالمخاطروالسياسة، ثمبقيةالعناقيد.
6. **Schema والتواريخ:** الحفاظ علىOrganization/WebSite/Article/Breadcrumb؛الFAQموجودمرئيًا فقط؛Productوصفيقيدالمراجعة. لاسعروتقييموتوفرمختلق.
7. **الأداء والوصول:** استهدافالعناصرالمثبتةفيbrowser-lab.json؛مقارنة3مراتبنفسالإعدادات؛إبقاءHeroوالهويةمعموافقةتصميممحددةعندالحاجة.
8. **السلطة:** قوالبCSV/Markdown ومراجعقابلةللاستشهاد، ثمبحثأصليبموافقةومنهجيةوعينةوحدود.لاتواصلخارجيأودفعروابطبهذهالخطة.

الملفات المقترحة وأسبابها بالكامل في file-plan.csv، ومخاطر كل تغيير ومعيار قبوله في issues.csv. لا تعديل في SQL أو API أو منطق الصلاحيات والتجارب؛ لا تعديل .env أو workflows أو render.yaml ضمن تفويض SEO الحالي. إعداد الحافة/النشر وSearch Console والإرسال الخارجي تحتاجتفويضالعمليةنفسها، ولاتنفذباعتمادالتحريرالمحليفقط.

## القياس قبل وبعد

| المجال | قبل | بعد ومعيار النجاح | الزمن |
|---|---|---|---|
| GSC web | 2026-10-18…2026-11-14:9clicks/970impressions/0.928%CTR؛SA6/643 | نوافذ28يومًابعدالنشرمعمقارنةسابقةومراعاةالبلدوdevice؛لاوعدترتيب | أسبوعي ثم28/56يوم |
| GA4 | 180sessions من5channels؛Organic4sessions/3users/1engaged؛0keyevents | خاصيةونطاقhostnameوقناةثابتة؛مؤشرإرسالفعليثمqualifiedlead،لاmailtoopen | تحققجمعقبلأيA/B |
| الزحف | 57حاليًا+264قديمًا؛تحويلاتمحلية138لاتعملحيًا | 100%منقائمةالتحويلاتالمعتمدةذات301واحد؛كلtarget200؛خاص/demoخارجsitemap | قبلالنشروبعده |
| المحتوى | 32Article؛20leadضمن40–70كلمة؛التواريخمتعددة | تدقيق32rubric؛مصادروتاريخومراجعحقيقي؛اختبارنيةلاتطويلكلمات | دفعات4–8مقالات |
| CWV | browser-lab.json:LABبنسخةبدايةمعزولة |3قياساتمماثلةثمfieldp75إذاوجد؛LCP≤2.5s/INP≤200ms/CLS≤0.1 | labقبل/بعد؛field28يوم |
| GEO | لابياناقتباساتحاليفيالمحركات | سجلأسئلةعربيةثابتةومحرك/بلد/تاريخ/جواب/مصادر؛اقتباسفعليلاادعاءschema | عينةشهريةبعداعتمادالكلفة |
| الروابطالخلفية | NOT MEASURED | روابطتحريريةجديدةذاتصلة،referralengagementواستفسارات؛لافصلدومينعددي | 60/90يوم |

GA4المقارنةالأقدمحُجبتبحدتاريخالموصل؛لاتفترضصفرًا. تعطيل/إزالةالقياسفيالمصدريقطعالمقارنة،فيجباعتمادوتوثيقتاريخالجمعالجديد.لاqueryأونصبحثأوبياناتنموذجأومعرفtenantفيالتحليلات.فصلبياناتاختباراتالمتصفحعنالزياراتالحقيقية.

## اعتماد مطلوب

المطلوب اعتماد هذه الخطة وتعديلات الملفات المحلية المدرجة فقط؛ التنفيذ والنشر منفصلان. سبب التوقف: نص طلب المستخدم في الملف المرفق: «بعد اعتماد الخطة فقط: نفّذ التعديلات بأقل تغيير ممكن». لم يُنشأ مشروعOpenSEO ولم تُصرفcredits ولم تُرسل مراسلات ولمتنفذعملياتGitبهذهالمهمة.
""")
print('Plans written',len(issues),len(tm),len(plan))
