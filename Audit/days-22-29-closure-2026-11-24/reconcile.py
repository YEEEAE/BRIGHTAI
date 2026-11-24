"""Generate the closure register from project requirements and checked evidence."""
import csv
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

import yaml

here = Path(__file__).resolve().parent
root = here.parent.parent
baseline = here.parent / 'project-closure-2026-11-18' / 'REGISTER.csv'
catalog_file = 'docs/PRODUCT-MASTER-CATALOG.yaml'
registry_file = 'docs/WEBSITE-PAGE-REGISTRY.yaml'
catalog = yaml.safe_load((root / catalog_file).read_text())
registry = yaml.safe_load((root / registry_file).read_text())
rows = {r['id']: r for r in csv.DictReader(baseline.open())}
assert len(rows) == 382
baseline_ids = set(rows)
http = json.loads((here / 'http.json').read_text())
http_open = json.loads((here / 'http-open.json').read_text())
browser = json.loads((here / 'browser.json').read_text())
migration = json.loads((here / 'migration-summary.json').read_text())
route_audit = json.loads((here / 'routes.json').read_text())
assert route_audit['status'] == 'PASS'
rls = json.loads((here / 'rls.json').read_text())
assert rls['verdict'] == 'PASS'
assert (here / 'restore-summary.txt').read_text().startswith('PASS:')
assert '# pass 211\n# fail 0\n' in (here / 'tests.tap').read_text()

verified, model, unknown = 'مثبت', 'نموذج', 'غير متحقق'
node_env = 'Node 22.22.2 / Astro 6.4.8 / loopback'
pg_env = 'Node 22.22.2 / PostgreSQL 18.6 محلي اصطناعي'
chrome_env = 'Chrome محلي 390×844 / حجب الوجهات الخارجية'
none = '—'
for r in rows.values():
    r.update(classification=unknown, evidence_environment=none,
             final_evidence='الدليل السابق محفوظ في عمود evidence. لم يُعد فحص معيار القبول كاملًا.',
             remaining_verification=r['acceptance'])
    if r['status'] == 'مثبت في وثيقة النطاق / مستبعد':
        r.update(classification=verified, evidence_environment='وثيقة النطاق',
                 final_evidence='الاستبعاد موثق في المصدر المذكور. قرار المالك مطلوب لأي تغيير للنطاق.',
                 remaining_verification=none)
    elif r['status'] == 'نموذج / لاحق أو اختياري':
        r.update(classification=model, evidence_environment='خارطة المنتج',
                 final_evidence='اختياري أو لاحق بحسب الكتالوج.',
                 remaining_verification='اعتماد النطاق أولًا، ثم إثبات السلوك في البيئة المختارة إذا قُدّم.')

def outcome(id_, classification, environment, evidence, next_):
    rows[id_].update(classification=classification, evidence_environment=environment,
                     final_evidence=evidence, remaining_verification=next_)

def add(id_, source, requirement, owner, target, next_, classification=unknown, environment=none, evidence=none):
    assert id_ not in rows, id_
    rows[id_] = dict(id=id_, source=source, requirement=requirement, target=target, owner=owner,
                     dependencies='حسب العقد المشار إليه', acceptance=next_, evidence=none, status='مضاف في المطابقة',
                     classification=classification, evidence_environment=environment,
                     final_evidence=evidence, remaining_verification=next_)

methods = {'GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'}
http_routes = {}
for r in http['rows']:
    http_routes.setdefault(r['route'], []).append(r)
open_routes = {}
for r in http_open['rows']:
    open_routes.setdefault(r['route'], []).append(r)
for id_, row in list(rows.items()):
    if id_.startswith('WEB-'):
        path = urlsplit(row['requirement']).path
        hits = [r for r in http_routes[path] if not r['error'] and r['status'] == 200]
        assert {'GET', 'HEAD'} <= {r['method'] for r in hits}, path
        outcome(id_, verified, node_env, f'http.json {path}؛ routes.json: HTML وcanonical وrobots والوصول من الرئيسية.',
                'مسؤول الموقع: أعد GET/HEAD وcanonical وrobots على الإصدار المنشور بعد تفويضه؛ حالة الفهرسة تحتاج GSC.')
    elif id_.startswith('API-'):
        verbs, path = row['requirement'].rsplit(' ', 1)
        observed = http_routes[path]
        enabled = open_routes[path]
        assert set(verbs.split(', ')) == {r['method'] for r in observed} == {r['method'] for r in enabled}, path
        assert all(not r['error'] for r in observed + enabled)
        observed_status = ', '.join(sorted({str(r['status']) for r in observed}))
        if path.startswith('/app/api/'):
            open_status = ', '.join(sorted({str(r['status']) for r in enabled}))
            observed_status += f' مغلق، {open_status} عند الفتح بلا جلسة'
            remaining = 'اختبر صلاحية العملية والعزل والنتيجة بعد المصادقة في بيئة معتمدة؛ دليل الحارس وحده لا يغطي ذلك.'
        else:
            remaining = 'أعد عقد الواجهة في البيئة المستهدفة، بما في ذلك الحالة المهيأة فقط عند اعتمادها.'
        outcome(id_, verified, node_env, f'http.json / http-open.json {path}: {observed_status}.', remaining)
    elif id_.startswith('MIG-'):
        key = id_.removeprefix('MIG-')
        phases = [k for k, values in migration['phases'].items() if key in values]
        if phases:
            outcome(id_, verified, pg_env, f'migration-summary.json: {key} في ' + '، '.join(phases),
                    'شغّل تحقق المصالحة على دفتر البيئة المعتمدة وبصماته قبل أي ترحيل.')
        else:
            outcome(id_, unknown, pg_env, 'سجل الترحيل النهائي لا يحتوي إيصالًا لهذا الملف.',
                    'طابق سبب الاستبدال أو عدم التطبيق ودليل المسار التاريخي قبل التشغيل على الهدف.')

demo_ids = {
    'DEM-01': 'DEM-01', 'DEM-02': 'DEM-02+UX-06', 'DEM-03': 'DEM-03+UX-04',
    'DEM-04': 'DEM-04', 'DEM-05': 'DEM-05', 'DEM-06': 'DEM-06',
    'DEM-07': 'DEM-07+GAP-11', 'DEM-08': 'DEM-08+UX-07',
}
for id_, browser_id in demo_ids.items():
    test = next(r for r in browser['results'] if r['id'] == browser_id)
    outcome(id_, (verified if id_ == 'DEM-08' else model) if test['pass'] else unknown,
            chrome_env, f'browser.json: {browser_id} · ' + ('نجح التفاعل.' if test['pass'] else 'فشل التفاعل.'),
            rows[id_]['acceptance'] if not test['pass'] else
            'أثبت القبول في البيئة المستهدفة إذا كان المطلوب سلوكًا تشغيليًا أو تقديمًا فعليًا.')
for id_ in ('UX-04','UX-06','UX-07','GAP-11'):
    case = next(r for r in browser['results'] if id_ in r['id'])
    outcome(id_, verified if case['pass'] else unknown, chrome_env, 'browser.json: ' + case['id'],
            {'UX-04':'اختبر حالة الخادم المغلق عند الموافقة فقط بمحاكاة محلية؛ اعتماد وتشغيل المزود خارج القبول المحلي.',
             'UX-06':'أعد رحلة العودة في المتصفحات المستهدفة ومع حجب التخزين.',
             'UX-07':'أعد مصفوفة الإعداد في البيئة المعتمدة مع خدمة Auth المخوّلة.',
             'GAP-11':'بعد قرار المالك، تحقق من استلام طلب معتمد؛ الدليل الحالي يقتصر على المسودة والعودة المحلية.'}[id_])
anchor = [r for r in browser['results'] if r['id'].startswith('UX-02/')]
outcome('UX-02', verified if all(r['pass'] for r in anchor) else unknown, chrome_env,
        'browser.json: ' + str(sum(r['pass'] for r in anchor)) + '/4 حالات تركيز.',
        'شغّل التحقق باستخدام لوحة المفاتيح مع JavaScript وبدونه في المتصفحات المستهدفة، ثم أعد القياس بعد النشر المصرح.')
outcome('UX-03', verified, node_env, 'routes.json: 304 طلب GET/HEAD عبر 152 تحويلًا مع حفظ query.',
        'مالك الواجهة يحسم عقد astro dev. مشغل الأصل يعيد فحص تحويلات الحافة عند التفويض.')
outcome('GAP-02', verified, 'Node 22.22.2، محوّل اصطناعي بلا اتصال', 'tests.tap: ten synthetic complaints؛ مسار fixture صالح على النسخة الحالية.', none)
outcome('GAP-12', verified, node_env, 'build-summary.txt: إصدارات مقفلة في نسخة مبنية دون ملفات بيئة.', none)
outcome('DEC-06', verified, node_env, 'build-summary.txt: مقارنة 196 ملفًا في dist/client؛ الاختلاف الوحيد صفحة about.', none)
for id_ in ('CLM-03','CLM-13','CLM-21'):
    outcome(id_, verified, chrome_env, 'خريطة الادعاءات صححت قناة واتساب والمسودة المحلية؛ browser.json يثبت المسار.', 'استلام فعلي بعد قرار المالك.')
for id_ in ('UX-05','GAP-10'):
    outcome(id_, verified, f'{node_env} / Chrome ووسم ومجمّعات وهمية', 'measurement.json: القواطع والتنقية والتواصل وحالات relay.',
            'راجع M1–M3 لاعتماد الإفصاح، الإعداد الحقيقي، اختبار SDK، الاستقبال والتنبيه.')

# Match catalog IDs in the other direction, then account for explicit criteria
# that share an umbrella ID in the original closure register.
catalog_ids = {r['id'] for r in catalog['shared_component']['core_capabilities']}
catalog_ids |= {r['id'] for p in catalog['products'] for r in p['capabilities']}
catalog_ids |= {r['id'] for r in catalog['integration_matrix']['scenarios']}
for field in ('deployment_profiles', 'minimum_global_acceptance', 'verification_backlog'):
    catalog_ids |= {r['id'] for r in catalog[field]}
assert catalog_ids <= rows.keys(), catalog_ids - rows.keys()
for p in catalog['products']:
    code = p['short_code']
    owner = f'مالك {p["display_name"]} والأمن'
    for index, criterion in enumerate(p['minimum_viable_product']['acceptance_criteria_ar'], 1):
        source = f'{catalog_file} products.{p["slug"]}.minimum_viable_product'
        add(f'MVP-{code}-{index:02d}', source, criterion, owner, 'Pilot / بيئة معتمدة',
            'أثبت معيار القبول المذكور أعلاه من نقطة دخول المنتج في Pilot مصرح وسجّل النتيجة والإصدار.')
    for index, field in enumerate(('post_mvp_or_optional_scope_ar', 'deliberate_exclusions_ar'), 1):
        assert all(f'{code}-S{index}-{i}' in rows for i in range(1, len(p[field]) + 1))

for file in sorted((root / 'docs/products').glob('*/API-CONTRACT.yaml')):
    contract = yaml.safe_load(file.read_text())
    slug = file.parent.name
    owner = f'مالك {slug} وعقد API'
    for path, operations in contract['paths'].items():
        for verb in sorted(methods & {k.upper() for k in operations}):
            details = operations[verb.lower()] or {}
            add(f'CONTRACT-{slug}-{verb}-{path}', str(file.relative_to(root)) + ' paths',
                f'{verb} {path} · {details.get("summary") or details.get("operationId") or "عقد المنتج"}',
                owner, 'بيئة معتمدة لعقد المنتج',
                'وقّع قرار مواءمة هذا المسار مع Node أو تنفيذه ثم اختبر مخطط الطلب والرد والسماح والرفض للـverb نفسه.',
                evidence='جرد HTTP يغطي واجهات Astro الفعلية تحت /app/api/. عقد /v1 المستهدف يحتاج دليل مطابقة مستقل.')

for file in sorted((root / 'docs/products').glob('*/ACCEPTANCE-AND-EVIDENCE.md')):
    slug = file.parent.name
    for number, line in enumerate(file.read_text().splitlines(), 1):
        match = re.match(r'^\|\s*`((?:AC|AT|EV|HG|FW|LD|RE|SC)-[A-Z0-9.-]+)`\s*\|\s*(.*?)\s*\|', line)
        if match:
            key, description = match.groups()
            add(f'ACCEPT-{slug}-{key}-{number}', f'{file.relative_to(root)}:{number}',
                line.strip().strip('|'), f'مالك {slug} ومراجع القبول', 'البيئة المحددة في المعيار',
                f'نفّذ معيار {key} وسلّم الدليل المحدد في الصف للبيئة والإصدار. {description}',
                evidence='تُراجع الأدلة المحلية عبر صفوف API وINT ومعايير المنتج ذات الصلة؛ القبول الكامل للمعيار مفتوح.')

web_ids = {urlsplit(r['requirement']).path: i for i,r in rows.items() if i.startswith('WEB-')}
for r in registry['page_routes']:
    path = r['path']
    hits = http_routes.get(path, [])
    page_id = web_ids.get(path)
    add(r['id'] + '-REGISTRY', registry_file + ' page_routes', path, 'مالك الموقع والمحتوى', 'الموقع المحلي ثم المنشور',
        'طابق نية الصفحة والروابط والحالة بعد النشر المصرح. راجع قرار المالك لأي مسار قديم بلا بديل.',
        verified if page_id else unknown, node_env if page_id else none,
        f'{page_id}: {len(hits)} طلبًا إلى صفحة canonical' if page_id else 'لا تطابق مباشر في الخريطة النهائية؛ راجع ملف التحويلات.')
for r in registry['future_content_backlog']:
    add(r['id'], registry_file + ' future_content_backlog', r['suggested_path_not_reserved'], 'مالك المحتوى وSEO',
        'خارطة المحتوى', r['quality_gate'], model, 'مقترح في سجل الموقع', 'يتطلب اعتمادًا بشريًا.')
add('WEB-404-REGISTRY', registry_file + ' special_routes', '/404/ و/404.html ومسار مفقود', 'مشغل الأصل', 'Node ثم الحافة',
    'أعد GET/HEAD 404 مع noindex على الأصل والنطاق بعد معالجة W2.', verified, node_env, 'http.json: ست حالات 404.')

for key in sorted(migration['files']):
    if not re.fullmatch(r'\d{4}', key) or f'MIG-{key}' in rows:
        continue
    phases = [p for p, entries in migration['phases'].items() if key in entries]
    add(f'MIG-{key}', 'migrations/' + migration['files'][key]['name'], f'أثر الترحيل {key}', 'مالك البيانات والتشغيل',
        'PostgreSQL محلي ثم Neon هدف', 'طابق بصمة الملف والدفتر الفعلي والـACL على الهدف قبل اختيار مسار الترحيل.',
        verified if phases else unknown, pg_env, 'migration-summary.json: ' + '، '.join(phases))

for path in sorted(http_routes):
    match = re.fullmatch(r'/products/([^/]+)/complaint/', path)
    if match:
        add('COMPLAINT-' + match[1].upper(), 'src/pages/products/[product]/complaint.astro', path, 'مالك المختبر والورشة',
            'Chrome محلي', 'أعد السيناريو عند تغيير انتقال المحطات أو التخزين.', model, chrome_env,
            'http.json: 200/noindex ومرساة lab؛ browser.json: COMPLAINT-FLOW.')
for r in http['rows']:
    if r['method'] == 'GET' and r['route'].startswith('/app/') and not r['route'].startswith('/app/api/'):
        add('PORTAL-' + r['route'], 'src/pages/app/', r['route'], 'مالك المنصة والهوية', 'Node ثم Staging',
            'في بيئة مهيأة، تحقق من مسار مصادق ورفض المستأجر الآخر مع تعطيل المزود.', verified, node_env,
            'http.json: إغلاق 503 مع no-store.')

# Recent reports add narrower acceptance points and external dependencies.
measurement = '../days-17-25-measurement-2026-11-24/OPERATOR-PLAN.md'
runtime = '../days-08-17-runtime-2026-11-18/REPORT.md'
products = '../days-12-21-product-contracts-2026-11-24/REPORT.md'
for id_, owner, requirement, next_ in [
    ('M1', 'الخصوصية والتحليلات', 'عقد GA4 وإعداد Enhanced Measurement',
     'اعتمد الإفصاح وقائمة الحملات، وافحص إعدادات Admin وكل طلب SDK حقيقي في وجهة اختبار مصرح بها.'),
    ('M2', 'تشغيل الأصل', 'قاطع GA4 في وضع الاستضافة الفعلي',
     'حدد Node أو static ثم افحص القاطع من تبويب قائم وجديد على النطاق والأصل مع رصد الكاش.'),
    ('M3', 'التشغيل والخصوصية', 'استقبال Sentry/PostHog والتنبيه',
     'حدد الوجهات والاحتفاظ ثم أثبت canary منقحًا، وتوقفه بالقواطع، وإقرار المستلم في Staging مخوّل.'),
    ('W1', 'تشغيل الأصل وSEO', 'الخريطة القديمة والبدائل',
     'صنّف روابط الإرث ثم أعد GET/HEAD وLocation وخرائط XML وGSC بعد إجراء مستقل.'),
    ('W2', 'مشغّل الأصل', '404 صريح على الأصل والحافة',
     'أثبت 404/noindex للعنوان الصريح والمفقود على الأصل والنطاق؛ أبقِ الصفحات والأصول السليمة 200.'),
    ('W3', 'مشغّل الأصل ومالك DNS', 'النطاق والأصول والتواصل',
     'أثبت TLS والتحويلات والأصول والملاحة من شبكتين، مع فحص الاتصال دون إرسال.'),
]:
    add(id_, measurement, requirement, owner, 'الهدف المعتمد', next_,
        evidence='التقرير السابق مؤرخ. لهذه الجولة دليل محلي في http.json وmeasurement.json بحسب البند.')

for row in [
    ('RUNTIME-STAGING', runtime, 'إصدار Staging ودور Pooler وData API',
     'مالك Neon والمشغّل', 'Staging معزول', 'اعتمد الفرع ثم طابق البصمات والدور الفعلي وSET ROLE وتعطيل وصول العميل.'),
    ('RUNTIME-AUTH', runtime, 'Neon Auth وaud والإبطال والبريد وOTP وMFA/SSO',
     'مالك الهوية والأمن', 'Staging معزول', 'أعد جلسة ودعوة وتجربة بهوية اصطناعية، وأثبت الإبطال والمنطقة وتقييد الجمهور وتسليم OTP.'),
    ('RUNTIME-RESTORE', runtime, 'استعادة الهدف إلى نقطة زمنية وRPO/RTO',
     'مالك Neon والاستمرارية', 'فرع استعادة مفوض', 'استعد فرعًا معزولًا، طابق الدفتر والصلاحيات، وأعد العزل في الاتجاهين مع قياس الاستعادة.'),
    ('KERNEL-APPROVAL', products, 'إحالة Kernel REQUEST_APPROVAL واستئناف عملية محددة',
     'مالك Kernel وHuman Gate والأمن', 'عقد محلي ثم Staging', 'حدد العملية المسموح بها وبصمة مدخلاتها وولاية الطرفين، ثم أثبت الاستهلاك مرة واحدة والفشل الآمن.'),
    ('FW-RESUME', products, 'استئناف Firewall بعد قرار Human Gate',
     'مالك Firewall وHuman Gate', 'Node محلي / Pilot', 'عرّف عملية اصطناعية مأذونة وأثبت أثرًا وحيدًا؛ استئناف المزوّد يحتاج عقدًا واعتمادًا.'),
    ('SC-RESUME', products, 'ربط إذن بشري بإجراء Secure Chat',
     'مالك Secure Chat والأمن', 'عقد محلي ثم Pilot', 'حدد الإجراء والمالك والحدود وأثبت غياب السلطة المستمدة من النص والرفض بعد انتهاء الإذن.'),
    ('RISK-ASSIST', products, 'Risk Assist بمزود مؤسسي مؤهل',
     'مالك Risk Engine والخصوصية', 'عقد مزود ثم Staging', 'أثبت الترخيص والمنطقة والميزانية والمخرجات المسموحة بعد اعتماد مستقل.'),
    ('GROQ-EVAL', '../groq-governance-2026-11-18/REPORT.md', 'Groq/Qwen 3.8 27B تقييم فقط',
     'المالك والأمن والخصوصية', 'مراجعة مكتبية', 'تحقق من الأهلية والمنطقة وعدم التدريب واعتماد سقف التكلفة قبل طلب تفويض منفصل للاستدلال.'),
    ('WORKSHOP-PRICE', '../../outputs/customer-complaints-workshop/PACK.ar.md', 'سعر الورشة والضريبة والقدرة والإتاحة',
     'المالك والمالية', 'خاص', 'اعتمد الأسعار والتكاليف وتوفر الوقت، ثم نفذ بروفة بشرية قبل أي عرض أو نشر.'),
    ('WORKSHOP-SALES', '../../outputs/prospect-discovery-2026-11-29/OWNER-PACK.ar.md', 'الاكتشاف والطلب والتسليم والتحصيل',
     'المالك', 'خاص', 'راجع نتائج اصطناعية مع المالك؛ أي تشغيل تجاري يحتاج قرارات القناة والعينة والإذن.'),
    ('WORKSHOP-NET', '../../outputs/01a1ec79-ff36-70e0-abbd-0337c0692782/OWNER-DECISIONS.ar.md',
     '1,000 دولار هدف صافي طموح', 'المالك والمالية', 'خاص / اليوم 30',
     'طابق التسليم والتحصيل والمستردات والتكاليف من مجاميع معتمدة؛ افصل الوقت عن النقد.'),
    ('EDITORIAL-REVIEW', 'docs/EDITORIAL-EVIDENCE.md', 'المراجعة التخصصية وهوية المساهمين',
     'مالك المحتوى والمراجع المخوّل', 'إصدار معتمد', 'احصل على دليل صلاحية وموافقة ونطاق ونسخة قبل نسبة المراجعة.'),
    ('SEO-EXTERNAL', 'docs/WEBSITE-PAGE-REGISTRY.yaml validation_and_maintenance', 'الفهرسة وقياس الأداء والوصول',
     'مسؤول SEO ومالك الواجهة', 'GSC وقياس ميداني', 'تحقق من الفهرسة وعينات القياس الميداني والمتصفحات؛ افصل ذلك عن الترتيب والاقتباس.'),
    ('BROWSER-TRANSITION', 'browser.json', 'تحذير انتقال Chrome بين صفحات مختلفة في opt-in',
     'مالك الواجهة', 'Chrome محلي والمتصفحات المستهدفة', 'افحص حدود الانتقال والمساعدة التقنية مع بقاء الهيرو محميًا.'),
]:
    add(*row)
for id_ in ('GROQ-EVAL', 'WORKSHOP-PRICE', 'WORKSHOP-SALES', 'WORKSHOP-NET', 'RISK-ASSIST'):
    outcome(id_, model, 'عينة اصطناعية أو مراجعة خاصة', 'المصدر المشار إليه؛ وبالنسبة للمزوّد اختبارات محقونة فقط.',
            rows[id_]['remaining_verification'])

for id_, code in [
    ('INT-02', 'Firewall → Human Gate؛ إحالة وموافقة ووقف الاستئناف'),
    ('INT-03', 'Firewall → Ledger؛ صف قرار واحد عبر التطبيق'),
    ('INT-04', 'Risk → Human Gate؛ الإحالة ثم ظهور الرفض بعد العودة'),
    ('INT-05', 'Human Gate → Ledger؛ آثار مرتبطة بالإحالات في مسار التطبيق'),
    ('INT-07', 'Secure Chat → Ledger؛ منع النموذج والإثبات في تفاصيل Ledger'),
]:
    outcome(id_, verified, f'{chrome_env} + PostgreSQL 18.6 + هوية اصطناعية',
            f'auth-browser.json وtests.tap: {code}.',
            'أعد نطاق الاختبار نفسه على Pilot مصرح بهوية حقيقية؛ استئناف المزود لا يزال مفتوحًا.')
outcome('INT-06', verified, pg_env, 'tests.tap: Chat policy؛ تطبيق قرار Kernel/Firewall في PostgreSQL، ونموذج محوّل منفصل.',
        'تحقق من ترخيص الإضافة والمزوّد المسموح والرد في بيئة معتمدة بعد تفويض منفصل.')
outcome('INT-01', unknown, node_env, 'تقييم Firewall وتقييم أصل Risk يعملان في مسارين؛ لا مرجع موثوق مُختبر بينهما.',
        'مالك Firewall وRisk: اعتمد مرجع ارتباط الأصل ثم اختبر السماح والحجب، ورفض أصل من مؤسسة أخرى.')
outcome('CAT-AC-08', verified, pg_env, 'tests.tap: مسارا Trial وExploration، الحصة والانتهاء وعدم التحويل في بيئة اصطناعية.',
        'أعد تجربة 48 ساعة بهوية مخولة في Staging وراجع غياب أي تحصيل تلقائي.')
outcome('P0-02', verified, pg_env, 'migration-summary.json: 35 fresh و36 delta حتى 0039 مع حراسات الترتيب.',
        'قارن مخطط ودفتر الهدف وبصماته قبل أي تطبيق.')
outcome('P0-03', verified, pg_env, 'tests.tap: رفض القراءة عبر نطاقات المؤسسة ودور تشغيل محلي محدود.',
        'مالك البيانات يثبت في Staging الدور الفعلي للـPooler وإغلاق Data API ويعيد العزل بالاتجاهين.')
rows['P0-03']['final_evidence'] += ' rls.json: مصفوفة الصلاحيات والإجراءات 90/90.'
rows['RUNTIME-RESTORE']['final_evidence'] = (
    'restore-summary.txt: مطابقة المخطط والصلاحيات وأعداد خمسة جداول في استعادة PostgreSQL منطقية محلية. '
    'إثبات RPO/RTO واستعادة Neon ما زال مفتوحًا.'
)
outcome('P0-06', model, pg_env, 'tests.tap وauth-browser.json: حسابات وجلسات ومفاتيح اصطناعية والتطبيق الفعلي.',
        rows['RUNTIME-AUTH']['remaining_verification'])
outcome('P0-10', verified, node_env, 'build-summary.txt وtests.tap وhttp*.json وbrowser.json.',
        'أعد بوابات قبول الإصدار ونطاق الأمن والأداء في البيئة المستهدفة.')
outcome('P0-12', verified, pg_env, 'tests.tap: تصدير Ledger وفاحص مستقل يرفض التلاعب في العينة.',
        'مالك Ledger والأمن: أثبت التوقيع أو مرساة مستقلة وحماية المفاتيح والتخزين في النطاق المعتمد.')
outcome('P1-06', verified, node_env, 'http.json: ‎/healthz/‎ GET/HEAD في الحالة المغلقة؛ auth-browser.json لتشغيل التطبيق الاصطناعي.',
        'المشغّل يثبت ربط health check بالإصدار العامل على الأصل ورموز الجاهزية في البيئتين.')
outcome('P2-05', verified, pg_env, 'migration-summary.json: حراسات ترتيب المسارات ومصالحة التاريخ.',
        'راجع مجموعة الترحيلات المسموح بها على الهدف وقارن ACL عند الترقية.')

for id_, requirement, files in [
    ('FIX-HARNESS', 'استعادة المدخل الموحد لاختبارات 12 قاعدة مخصصة', 'scripts/verify-contracts-local.mjs وscripts/verify-trial-local.mjs'),
    ('FIX-IDENTITY-TEST', 'مواءمة توقعات AU03/AU04 مع الترحيلين 0036 و0038', 'tests/identity-runtime-db.test.mjs وdocs/IDENTITY-AND-INVITATION-RUNBOOK.md'),
    ('FIX-ROUTE-SCHEMA', 'مطابقة JSON-LD مع تواريخ التحرير الظاهرة', 'scripts/verify-routes.mjs وdocs/EDITORIAL-EVIDENCE.md'),
    ('FIX-ROUTE-ANCHORS', 'التحقق من مرساة صفحة noindex عبر HTTP', 'scripts/verify-routes.mjs'),
    ('FIX-AUTHOR-LINK', 'إتاحة صفحات الناشر الثلاث من صفحة عن BRIGHTAI', 'src/pages/about.astro'),
    ('FIX-CONTACT-DOC', 'مطابقة خريطة الادعاءات لقناتَي التواصل والمسودة المحلية', 'docs/SOURCE-TO-CLAIM-MAP.md'),
]:
    evidence = 'tests.tap' if id_ in ('FIX-HARNESS', 'FIX-IDENTITY-TEST') else 'routes.json'
    if id_ == 'FIX-CONTACT-DOC':
        evidence = 'browser.json وmeasurement.json'
    add(id_, files, requirement, 'مالك الاختبارات' if id_ != 'FIX-AUTHOR-LINK' else 'مالك الموقع',
        'محلي', none, verified, node_env, evidence)

for path, observed in http_routes.items():
    if path.startswith('/demo/') or path.startswith('/downloads/') or path.startswith('/auth/'):
        assert all(not r['error'] for r in observed)
        requirement = f'GET {path} → {observed[0]["status"]}'
        view = path.startswith('/demo/') and '/workshop-preview/' not in path
        add('SURFACE-' + path, 'src/pages/ أو public/downloads/؛ http.json', requirement,
            'مالك الموقع والواجهة' if '/auth/' not in path else 'مالك الهوية',
            'Node محلي ثم أصل الإصدار', 'أعد الحالة وترويسات الخصوصية أو نوع الملف في البيئة المعتمدة.',
            model if view else verified, node_env, 'http.json: الحالة في البناء النهائي.')

arch_owners = [
    'مالك المنصة', 'مالك البيانات والأمن', 'الخصوصية وقانوني الموردين', 'الأمن ومالك الترخيص',
    'مالك Human Gate والأمن', 'مالك Ledger والأمن', 'المالية ومالك المنتج', 'القانوني والمالك',
    'التشغيل والاستمرارية', 'مالك النشر المعزول', 'مالك Kernel والوثائق', 'مالك الوثائق والإصدار',
    'الخصوصية والتحليلات', 'مشغّل الترحيل', 'التشغيل وأمن سلسلة التوريد',
]
file = root / 'docs/PLATFORM-ARCHITECTURE.md'
for no, line in enumerate(file.read_text().splitlines(), 1):
    match = re.match(r'^\| `(GAP-A(\d+))` \| (.*?) \| .*? \| (.*?) \|', line)
    if match:
        id_, index, requirement, next_ = match.groups()
        add(id_, f'{file.relative_to(root)}:{no}', requirement, arch_owners[int(index)-1], 'عقد المنصة',
            next_, evidence='راجع دليل البند الموازي في السجل. لا يُستنتج القبول من دليل محلي جزئي.')

assert baseline_ids <= rows.keys()
assert set(web_ids) == {r['route'] for r in http['rows'] if r['method'] == 'HEAD' and r['status'] == 200}
assert len({r['route'] for r in http_open['rows']}) == http_open['endpointFiles']
assert all(r['owner'] and r['source'] and r['classification'] and r['remaining_verification'] for r in rows.values())
with (here / 'REGISTER.csv').open('w', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=list(next(iter(rows.values()))))
    writer.writeheader()
    writer.writerows(rows.values())

summary = dict(baseline=len(baseline_ids), new=len(rows)-len(baseline_ids), total=len(rows),
               classification=dict(Counter(r['classification'] for r in rows.values())),
               no_remaining_step=sum(r['remaining_verification'] == none for r in rows.values()),
               catalog_ids=len(catalog_ids), public_routes=len(web_ids), endpoint_files=http_open['endpointFiles'],
               proposed_api_operations=sum(id_.startswith('CONTRACT-') for id_ in rows),
               detailed_acceptance_rows=sum(id_.startswith('ACCEPT-') for id_ in rows))
(here / 'coverage.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False))
