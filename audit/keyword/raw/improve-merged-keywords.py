"""Rebuild the keyword deliverables from preserved input and Semrush evidence.

No network calls. Numeric facts come from exact matching provider observations;
classification, ownership, fit and priority are explicitly editorial.
"""
import csv
import io
import json
import math
import re
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'audit/keyword'
RAW = OUT / 'raw'
CSV = OUT / 'BRIGHTAI-KEYWORDS-MERGED-2026-09-08.csv'
MD = CSV.with_suffix('.md')
BASELINE = RAW / 'merged-before-improvement-2026-09-08.json'
DOMAIN = 'https://brightai.live'


def clean(value):
    if value is None:
        return ''
    value = unicodedata.normalize('NFKC', str(value))
    value = re.sub(r'[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]', '', value)
    return re.sub(r'\s+', ' ', value.replace('`', '')).strip()


def key(value):
    return clean(value).casefold()


def numeric(value):
    value = clean(value).replace(',', '')
    if not value or value.lower() in {'n/a', 'none', 'null', 'غير متاح'}:
        return None
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except ValueError:
        return None


def numtext(value):
    if value is None:
        return ''
    return format(value, '.10g')


def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def relative(path):
    return str(path.relative_to(ROOT))


def url(value):
    value = clean(value)
    # A tracked domain is not a keyword's landing-page recommendation.
    if value in {'', 'TBD', 'brightai.live'}:
        return ''
    if value.startswith('/'):
        value = DOMAIN + value
    if not value.startswith(DOMAIN + '/'):
        return ''
    return value.rstrip('/') + '/'


def language(value):
    ar = bool(re.search(r'[\u0600-\u06ff]', value))
    en = bool(re.search(r'[a-zA-Z]', value))
    return 'mixed-ar-en' if ar and en else 'ar' if ar else 'en'


def load_semrush():
    observations = {}
    errors = []
    for path in sorted(RAW.glob('semrush-*-refresh-2026-09-08.json')):
        doc = json.loads(path.read_text())
        for batch in doc['batches']:
            response = batch['response']
            text = '\n'.join(c.get('text', '') for c in response.get('content', []) if c['type'] == 'text')
            no_data = 'ERROR 50 :: NOTHING FOUND' in text
            success = text.startswith('Keyword;') and not response.get('isError')
            returned = list(csv.DictReader(io.StringIO(text), delimiter=';')) if success else []
            matching = {key(r['Keyword']): r for r in returned}
            if not success and not no_data:
                errors.append({'file': relative(path), 'error': text})
            for requested in batch['requested']:
                k = key(requested)
                row = matching.get(k)
                observations[k] = {
                    'status': 'measured' if row else 'no_data' if success or no_data else 'api_error',
                    'row': row or {}, 'requested': requested,
                    'retrieved_at': batch['retrieved_at'], 'evidence': relative(path),
                }
    return observations, errors


def load_dataforseo():
    path = ROOT / 'audit/website-builder-SEO/brightai-sa-keyword-research.csv'
    result = {}
    for row in read_csv(path):
        for lang in ['ar', 'en']:
            k = key(row[f'keyword_{lang}'])
            if not k:
                continue
            # The original file contains TWO phrases per row. Never use the
            # opposite language's metrics or shared language column.
            result[k] = {
                'volume': numeric(row.get(f'monthly_searches_sa_{lang}')),
                'cpc': numeric(row.get(f'cpc_usd_{lang}')),
                'kd': numeric(row.get(f'keyword_difficulty_{lang}')),
                'ads_index': numeric(row.get(f'ads_competition_index_{lang}')),
                'status': row.get(f'dataforseo_status_{lang}', ''),
                'language': lang, 'file': relative(path),
            }
    return result


# Per-query exceptions take precedence over older, conflicting source maps.
OVERRIDES = {
    'حوكمة الذكاء الاصطناعي في السعودية': '/',
    'brightai حوكمة الذكاء الاصطناعي السعودية': '/',
    'شركات الذكاء الاصطناعي في السعودية': '/',
    'شركة ذكاء اصطناعي في السعودية': '/',
    'ai governance saudi arabia': '/en/',
    'brightai kernel': '/kernel/',
    'تواصل مع brightai': '/contact/',
    'حوكمة الذكاء الاصطناعي': '/hub/ai-governance/',
    'ai governance': '/hub/ai-governance/',
    'حوكمة الذكاء الاصطناعي pdf': '/hub/ai-governance/',
    'ai governance pdf': '/hub/ai-governance/',
    'حوكمة البيانات': '/blog/ndmo-data-governance-saudi/',
    'معنى حوكمة البيانات': '/blog/ndmo-data-governance-saudi/',
    'ما هي حوكمة البيانات': '/blog/ndmo-data-governance-saudi/',
    'نظام حماية البيانات الشخصية': '/pdpl-statement/',
    'نظام حماية البيانات الشخصية السعودي': '/pdpl-statement/',
    'حماية البيانات الشخصية': '/docs/pdpl-ai-complete-guide/',
    'حماية البيانات الشخصية مع الذكاء الاصطناعي': '/docs/pdpl-ai-complete-guide/',
    'الذكاء الاصطناعي ونظام حماية البيانات الشخصية': '/docs/pdpl-ai-governance/',
    'personal data protection ai': '/docs/pdpl-ai-complete-guide/',
    'ai and saudi pdpl': '/en/pdpl-statement/',
    'pdpl والذكاء الاصطناعي': '/blog/pdpl-ai-safety/',
    'امتثال pdpl للشركات السعودية': '/blog/pdpl-compliance-guide-saudi-companies/',
    'شركة أتمتة': '/services/',
    'استشارات التحول الرقمي': '/services/',
    'خدمات حوكمة الذكاء الاصطناعي': '/services/',
    'شركة حوكمة ذكاء اصطناعي السعودية': '/services/',
    'ai governance company saudi arabia': '/services/',
    'ai governance for companies': '/solutions/ai-governance-platform/',
    'ai governance for saudi enterprises': '/solutions/ai-governance-platform/',
    'حوكمة الذكاء الاصطناعي للشركات': '/solutions/ai-governance-platform/',
    'حوكمة الذكاء الاصطناعي للمؤسسات السعودية': '/solutions/ai-governance-platform/',
    'حلول أمان وحوكمة الذكاء الاصطناعي': '/solutions/',
    'أدلة امتثال الذكاء الاصطناعي': '/solutions/ai-evidence-file/',
    'أسعار منصة حوكمة الذكاء الاصطناعي': '/pricing/',
    'استخدام chatgpt في الشركات السعودية': '/blog/chatgpt-pdpl-data-compliance/',
    'تطبيق حوكمة الذكاء الاصطناعي في الشركة': '/docs/governance-application/',
    'تقييم مخاطر الذكاء الاصطناعي': '/docs/ai-risk-management/',
    'إدارة المخاطر pdf': '/docs/ai-risk-management/',
    'تكلفة شهادة iso 42001 في السعودية': '/blog/iso-42001-certification-cost-saudi/',
    'قائمة تدقيق iso 42001': '/blog/iso-42001-audit-checklist-saudi/',
    'iso 42001 certification saudi arabia': '/blog/iso-42001-certification-cost-saudi/',
    'شهادة iso 42001 السعودية': '/blog/iso-42001-certification-cost-saudi/',
    'sdaia ai governance': '/blog/sdaia-nca-pdpl-regulatory-map/',
    'sdaia ai guidelines': '/docs/sdaia-generative-ai-guidelines/',
    'إرشادات سدايا للذكاء الاصطناعي': '/docs/sdaia-generative-ai-guidelines/',
    'حوكمة الذكاء الاصطناعي سدايا': '/blog/sdaia-nca-pdpl-regulatory-map/',
    'ضوابط الأمن السيبراني للذكاء الاصطناعي السعودية': '/docs/nca-ecc-ai-controls/',
    'متطلبات nca للذكاء الاصطناعي': '/docs/nca-ai-cybersecurity-guidelines/',
    'nca ai requirements saudi arabia': '/docs/nca-ai-cybersecurity-guidelines/',
    'nca ecc ai controls saudi arabia': '/docs/nca-ecc-ai-controls/',
    'nca ecc compliance': '/docs/nca-ecc-ai-controls/',
    'الامتثال لضوابط nca ecc': '/docs/nca-ecc-ai-controls/',
    'حوكمة الذكاء الاصطناعي للبنوك في الرياض': '/solutions/banking-ai-governance/riyadh/',
    'حوكمة الذكاء الاصطناعي للمستشفيات في جدة': '/solutions/healthcare-ai-governance/jeddah/',
    'حوكمة الذكاء الاصطناعي للجهات الحكومية في الدمام': '/solutions/government-ai-governance/dammam/',
    'روبوت دردشة': '/blog/arabic-chatbot-customer-service-saudi/',
    'human in the loop ai': '/solutions/human-approval-layer/',
    'human review ai': '/docs/human-approval-layer/',
    'shadow ai': '/blog/shadow-ai-discovery-saudi-company/',
    'قياس التحول الرقمي': '/blog/digital-transformation-sme-saudi/',
}
EXCLUDED = {
    'chatgpt', 'شات جي بي تي', 'سدايا', 'منصة حوكمة البيانات الوطنية',
    'saudi company for artificial intelligence', 'جمعية حوكمة الذكاء الاصطناعي',
    'ai governance association', 'وظائف الذكاء الاصطناعي', 'دورات الذكاء الاصطناعي',
    'إنشاء صور بالذكاء الاصطناعي', 'محادثة مع الذكاء الاصطناعي',
}
BROAD = {
    'الذكاء الاصطناعي', 'ذكاء اصطناعي', 'الذكاء الاصطناعي بالعربي', 'الذكاء الاصطناعي في',
    'الذكاء الاصطناعي السعودية', 'برمجة الذكاء الاصطناعي', 'تطبيق الذكاء الاصطناعي',
    'تطبيقات الذكاء الاصطناعي', 'استخدام الذكاء الاصطناعي', 'استخدامات الذكاء الاصطناعي',
    'تعلم الآلة', 'تحليل البيانات', 'ذكاء الأعمال', 'الأمن السيبراني', 'الامتثال',
    'الخصوصية', 'حوكمة الشركات', 'لائحة حوكمة الشركات', 'ai network security',
    'ماهو الذكاء الاصطناعي', 'حوكمة الشركات في السعودية',
}
FOUNDATION = {'حوكمة الذكاء الاصطناعي في السعودية', 'منصة حوكمة الذكاء الاصطناعي',
              'جدار حماية الذكاء الاصطناعي', 'ai firewall', 'تقييم جاهزية حوكمة الذكاء الاصطناعي'}


def classify(row, suggestion, sitemap):
    k = key(row['keyword'])
    candidates = list(dict.fromkeys(filter(None, (url(x) for x in row.get('target_url', '').split(' | ')))))
    target = url(suggestion['target_url']) if suggestion else url(OVERRIDES.get(k, ''))
    if not target:
        target = next((x for x in candidates if x in sitemap), candidates[0] if candidates else '')
    if target == url('/blog/ai-firewall-vs-dlp-waf-ai-gateway/'):
        target = url('/solutions/ai-firewall/')
    if not suggestion and '42001' in k and k not in OVERRIDES:
        target = url('/blog/iso-42001-saudi-implementation-guide/')
    if k in EXCLUDED or k in BROAD:
        target = ''
    path = target.removeprefix(DOMAIN)
    categories = [
        ('agentic-ai-governance', 'agentic-governance'), ('agentic-ai-security', 'agentic-security'),
        ('banking', 'banking'), ('healthcare', 'healthcare'), ('government', 'government'),
        ('manufacturing', 'manufacturing'), ('firewall-vs', 'firewall-comparison'),
        ('ai-firewall', 'ai-firewall'), ('iso-42001', 'iso-42001'), ('pdpl', 'pdpl'),
        ('landscape', 'saudi-ai'), ('sdaia', 'sdaia'), ('nca', 'nca'), ('risk', 'risk'), ('audit', 'audit'),
        ('evidence', 'evidence'), ('human', 'human-approval'), ('use-case', 'discovery'),
        ('shadow-ai', 'discovery'), ('hidden-ai', 'discovery'), ('policy', 'policy'),
        ('ndmo', 'data-governance'), ('chatbot', 'chatbot'), ('transformation', 'automation'),
        ('best-ai-companies', 'providers'), ('landscape', 'saudi-ai'), ('ecommerce', 'ecommerce'),
        ('cost', 'pricing'), ('pricing', 'pricing'), ('services', 'services'),
        ('governance', 'governance'), ('trust', 'compliance'),
    ]
    cluster = suggestion['cluster'] if suggestion else next((name for token, name in categories if token in path), 'brand' if target in {DOMAIN+'/', DOMAIN+'/en/', DOMAIN+'/kernel/', DOMAIN+'/contact/'} else 'general')
    if k in EXCLUDED:
        cluster = 'excluded-external-or-consumer'
    elif k in BROAD:
        cluster = 'broad-support-only'
    if suggestion:
        intent, fit = suggestion['intent'], suggestion['business_relevance']
    elif k in EXCLUDED:
        intent, fit = 'navigational' if not any(x in k for x in ['وظائف', 'دورات', 'إنشاء', 'محادثة']) else 'informational', 10
    elif k in BROAD:
        intent, fit = 'informational', 25
    elif any(x in path for x in ['/assessment/', '/tools/', 'policy-template']):
        intent, fit = 'transactional', 95
    elif any(x in path for x in ['best-', 'cost', '/pricing/']):
        intent, fit = 'commercial', 90
    elif any(x in path for x in ['/docs/', '/blog/', '/hub/']):
        intent, fit = 'informational', 85
    elif path in {'/contact/', '/kernel/'}:
        intent, fit = 'navigational' if 'brightai' in k else 'commercial', 90
    else:
        intent, fit = 'commercial', 95 if target else 65
    if not suggestion and cluster in {'chatbot', 'automation', 'saudi-ai', 'ecommerce'}:
        fit = 65
    if not suggestion and k in {'ai security', 'أمن الذكاء الاصطناعي', 'chatgpt saudi arabia', 'حماية البيانات', 'قياس التحول الرقمي', 'human in the loop', 'human in the loop ai'}:
        fit = 65
    if k in {'سياسة الخصوصية', 'حوكمة الشركات في السعودية'}:
        fit = 40
    if k in {'إدارة المخاطر', 'إدارة المخاطر pdf'}:
        fit = 65
    if k == 'تواصل مع brightai':
        intent = 'transactional'
    if k in EXCLUDED:
        status, action = 'not_targeted', 'لا تستهدف تجاريًا؛ احتفظ بالكلمة للمرجع فقط'
    elif k in BROAD:
        status, action = 'deferred_broad_intent', 'لا تنشئ صفحة مستقلة؛ استخدم فقط ضمن سياق متخصص عند الحاجة'
    elif not target:
        status, action = 'proposed_page_unassigned', 'راجع النية واختر مالكًا للمحتوى قبل إنشاء صفحة'
    elif target not in sitemap:
        status, action = 'needs_url_review', 'تحقق من مسار الصفحة المقترح؛ غير موجود في sitemap المحلي'
    else:
        status = 'listed_in_local_sitemap'
        action = 'حسّن قسمًا مطابقًا للنية داخل الصفحة المالكة واربطه بالحل المناسب'
    if 'pdf' in k:
        action = 'راجع توفر ملف PDF أصلي مفيد واربطه بصفحة HTML المالكة؛ لا يوجد إثبات توفر التنزيل هنا'
    return target, candidates, cluster, intent, fit, status, action


def main():
    if not BASELINE.exists():
        BASELINE.write_text(json.dumps(read_csv(CSV), ensure_ascii=False, indent=2)+'\n')
    original = json.loads(BASELINE.read_text())
    suggestions = []
    for name in ['keyword-suggestions-2026-09-08.json', 'keyword-additional-suggestions-2026-09-08.json']:
        suggestions.extend(json.loads((RAW/name).read_text()))
    suggested = {key(r['keyword']): r for r in suggestions}
    inputs = {key(r['keyword']): r for r in original}
    for k, r in suggested.items():
        if k not in inputs:
            inputs[k] = {'keyword': r['keyword'], 'source_files': 'assistant_suggestion', 'source_fields': 'keyword'}
    sitemap = {x.text for x in ET.parse(ROOT/'public/sitemap.xml').getroot().iter() if x.tag.endswith('loc')}
    measured, errors = load_semrush()
    assert not errors, errors
    assert set(inputs) <= set(measured), 'Every keyword must have an API observation'
    dfs = load_dataforseo()
    result = []
    changes = Counter()
    for k, old in inputs.items():
        suggestion = suggested.get(k)
        target, candidates, cluster, intent, fit, target_status, action = classify(old, suggestion, sitemap)
        m = measured[k]
        fact = m['row']
        volume, kd = numeric(fact.get('Search Volume')), numeric(fact.get('Keyword Difficulty Index'))
        cpc, ads = numeric(fact.get('CPC')), numeric(fact.get('Competition'))
        lang = language(old['keyword'])
        lang_fit = 'not_applicable' if not target else 'matched' if (lang == 'en') == ('/en/' in target) else 'english_content_needed' if lang == 'en' else 'review_mixed_query' if lang == 'mixed-ar-en' else 'arabic_content_needed'
        if lang == 'mixed-ar-en' and target:
            lang_fit = 'review_mixed_query'
        # No missing metric is imputed. Score is a documented lower bound;
        # completeness shows exactly how much of the 100-point model is known.
        intent_factor = {'commercial': 1, 'transactional': 1, 'informational': .6, 'navigational': .3}[intent]
        demand_points = 0 if volume is None else 20 * min(1, math.log1p(volume)/math.log1p(2000))
        kd_points = 0 if kd is None or kd == 0 else 10 * (1-kd/100)
        gap_points = 5 if target_status in {'needs_url_review', 'proposed_page_unassigned'} or lang_fit == 'english_content_needed' else 0
        score = round(.45*fit + 20*intent_factor + demand_points + kd_points + gap_points, 1)
        completeness = 70 + (20 if volume is not None else 0) + (10 if kd is not None and kd > 0 else 0)
        if k in EXCLUDED or k in BROAD or fit < 50:
            priority, opportunity = 'P3', 'deferred_or_excluded'
        elif k in FOUNDATION:
            priority, opportunity = 'P0', 'core_business_foundation'
        elif fit >= 85 and volume is not None and volume >= 20 and kd is not None and 0 < kd <= 30:
            priority, opportunity = 'P0', 'measured_low_difficulty'
        elif fit >= 85:
            priority, opportunity = 'P1', 'strategic_no_data' if volume is None else 'measured_core_topic'
        else:
            priority, opportunity = 'P2', 'adjacent_support'
        if lang_fit == 'english_content_needed' and priority == 'P0' and k not in FOUNDATION:
            priority = 'P1'
        if lang_fit == 'english_content_needed':
            action += '؛ جهّز محتوى إنجليزي مطابقًا قبل استهداف العبارة الإنجليزية'
        historical = dfs.get(k, {})
        disagreements = []
        for name, value in [('volume',volume),('cpc',cpc),('kd',kd)]:
            d = historical.get(name)
            if d is not None and value is not None and d != value:
                disagreements.append(f'{name}:Semrush={numtext(value)};DataForSEO={numtext(d)}')
        sources = list(dict.fromkeys(x for x in old.get('source_files','').split(' | ') if x and x != 'assistant_suggestion'))
        notes = []
        if suggestion:
            notes.append('اقتراح تحريري جديد؛ لم يثبت طلب بحث فعلي إلا عند وجود قياس Semrush')
        if m['status'] == 'no_data':
            notes.append('Semrush لم يرجع صفًا مطابقًا في السعودية؛ غياب البيانات لا يعني حجم بحث صفر')
        if kd == 0:
            notes.append('KD=0 كما أعاده المزود؛ لم يُستخدم كدليل سهولة في التقييم')
        if historical:
            notes.append('DataForSEO تاريخي من الملف المحلي؛ تاريخ التقرير 2026-09-03 وليس وقت سحب API مثبتًا')
        if len(candidates)>1:
            notes.append('تم اختيار مالك تحريري واحد من اقتراحات المصادر؛ لا يوجد إثبات تنافس داخلي من GSC')
        if target_status == 'listed_in_local_sitemap':
            notes.append('وجود URL في sitemap المحلي لا يثبت فهرسة Google أو HTTP حي')
        if target_status == 'needs_url_review':
            notes.append('رابط موروث يحتاج مراجعة؛ لا تنشئ صفحة جديدة قبل التحقق من الصفحات الحالية')
        row = dict(
            keyword=clean(old['keyword']), origin='assistant_suggestion' if suggestion else 'original_sources',
            language=lang, country='SA', database='sa',
            city=next((city for city,patterns in [('Riyadh',['الرياض','رياض','riyadh']),('Jeddah',['جدة','jeddah']),('Dammam',['الدمام','دمام','dammam']),('Khobar',['الخبر','khobar']),('Mecca',['مكة','mecca']),('Madinah',['المدينة','madinah'])] if any(p in k for p in patterns)), ''),
            cluster=cluster, intent=intent, intent_source='editorial_query_and_page_mapping',
            funnel='bottom' if intent in {'commercial','transactional'} else 'top' if intent=='informational' else 'navigation',
            business_relevance=fit, priority=priority, priority_score=score, score_completeness_pct=completeness,
            opportunity_type=opportunity, keyword_role='', target_url=target, target_status=target_status,
            target_language_fit=lang_fit, recommended_action=action,
            search_volume_sa=numtext(volume), keyword_difficulty=numtext(kd),
            kd_status='not_available' if kd is None else 'returned_zero_not_used_in_score' if kd==0 else 'measured',
            cpc_usd=numtext(cpc), paid_competition=numtext(ads),
            semrush_status=m['status'], semrush_intent_codes=fact.get('Intent',''), semrush_trend=fact.get('Trends',''),
            metrics_source='Semrush', metrics_report='phrase_these', metrics_retrieved_at=m['retrieved_at'],
            metrics_period='latest_available_snapshot; period_not_returned', metrics_evidence=m['evidence'],
            dfs_search_volume_sa=numtext(historical.get('volume')), dfs_cpc_usd=numtext(historical.get('cpc')),
            dfs_keyword_difficulty=numtext(historical.get('kd')), dfs_ads_competition_index=numtext(historical.get('ads_index')),
            dfs_status=historical.get('status','not_in_source'),
            dfs_source_file=historical.get('file',''), dfs_report_date='2026-09-03' if historical else '',
            metric_disagreement=' | '.join(disagreements), gsc_status='not_provided',
            clicks='', impressions='', ctr='', average_position='',
            original_source_file_count=len(sources), source_files=' | '.join(sources),
            source_fields=old.get('source_fields',''), inherited_source_row_count=old.get('source_row_count',''),
            alternative_target_urls=' | '.join(x for x in candidates if x != target),
            normalized_keyword=k, notes=' | '.join(notes),
        )
        result.append(row)
        if not suggestion:
            changes['language_corrected'] += old.get('language','') != lang
            changes['volume_changed'] += numeric(old.get('search_volume_sa')) != volume
            changes['cpc_changed'] += numeric(old.get('cpc_usd')) != cpc
            changes['target_changed'] += old.get('target_url','') != target
    result.sort(key=lambda r:(r['priority'], -r['priority_score'], -(numeric(r['search_volume_sa']) or 0), r['normalized_keyword']))
    preferred = {(DOMAIN+'/', 'ar'): 'حوكمة الذكاء الاصطناعي في السعودية',
                 (DOMAIN+'/solutions/ai-firewall/', 'ar'): 'جدار حماية الذكاء الاصطناعي',
                 (DOMAIN+'/solutions/ai-firewall/', 'en'): 'ai firewall',
                 (DOMAIN+'/solutions/ai-governance-platform/', 'ar'): 'منصة حوكمة الذكاء الاصطناعي'}
    owners = {}
    for r in result:
        owner = (r['target_url'], r['language'])
        if owner not in owners or r['normalized_keyword'] == preferred.get(owner):
            owners[owner] = r['normalized_keyword']
    for r in result:
        owner = (r['target_url'], r['language'])
        if not r['target_url']:
            r['keyword_role'] = 'reference_only'
        elif owners[owner] != r['normalized_keyword']:
            r['keyword_role'] = 'secondary'
        else:
            r['keyword_role'] = 'primary_candidate'
    assert len(result) == len({r['normalized_keyword'] for r in result})
    with CSV.open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(result[0]), lineterminator='\n')
        writer.writeheader()
        writer.writerows(result)
    summary = {
        'original_keywords':len(original), 'new_keywords':len(suggested), 'total_keywords':len(result),
        'semrush_measured':sum(r['semrush_status']=='measured' for r in result),
        'semrush_no_data':sum(r['semrush_status']=='no_data' for r in result),
        'new_measured':sum(r['origin']=='assistant_suggestion' and r['semrush_status']=='measured' for r in result),
        'metrics_disagree':sum(bool(r['metric_disagreement']) for r in result),
        'target_status':dict(Counter(r['target_status'] for r in result)),
        'priority_counts':dict(Counter(r['priority'] for r in result)), 'changes':dict(changes),
    }
    (RAW/'improvement-validation-2026-09-08.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    write_report(result,summary)
    print(json.dumps(summary,ensure_ascii=False,indent=2))


def escape(value):
    return str(value).replace('|','\\|').replace('\n',' ')


def write_report(rows, summary):
    lines = [
        '# BRIGHTAI — الكلمات المفتاحية الموحّدة والمحسّنة', '',
        'تاريخ التحديث: 2026-09-08 — النطاق: `https://brightai.live` — السوق: السعودية (`sa`).', '',
        f"النتيجة: **{summary['total_keywords']} كلمة فريدة**؛ {summary['original_keywords']} كلمة أصلية و{summary['new_keywords']} اقتراحًا جديدًا ({summary['new_measured']} منها له قياس Semrush).",
        f"Semrush: **{summary['semrush_measured']} كلمة بقياسات فعلية** و**{summary['semrush_no_data']} كلمة بدون صف مطابق**. لا توجد بيانات GSC فعلية.", '',
        '## ما تغير', '',
        '- تحديث كل الكلمات الأصلية والمقترحة عبر Semrush `phrase_these` في السعودية، مع حفظ الطلب والرد وتوقيت السحب.',
        '- تصحيح خلط أعمدة العربية والإنجليزية في المصدر الثنائي، والحفاظ على أصفار CPC والحجم الحقيقية.',
        '- فصل مقاييس DataForSEO التاريخية في أعمدة مستقلة؛ لم تُخلط أو تُجمع أو تُحسب متوسطاتها مع Semrush.',
        '- الاحتفاظ بكل الكلمات الأصلية؛ الكلمات العامة أو الملاحية غير المناسبة معلّمة P3 للمرجع.',
        '- اختيار صفحة هدف تحريرية واحدة لكل كلمة، وتوحيد الروابط وفحص وجودها في sitemap المحلي.',
        '- إضافة نية البحث، مرحلة القمع، المدينة المذكورة في العبارة، ملاءمة العمل، الأولوية، وسبب الخطوة التالية.', '',
        '## قواعد القراءة', '',
        '- `origin=assistant_suggestion`: كلمة أضيفت باجتهاد تحريري؛ لا يعني أنها ظهرت في GSC أو بحث مستخدم فعلي.',
        '- `search_volume_sa` و`cpc_usd` و`paid_competition` و`keyword_difficulty`: قيم Semrush فقط. `no_data` يعني عدم إرجاع صف مطابق وليس صفر طلب.',
        '- `kd_status=returned_zero_not_used_in_score`: أعاد Semrush الصفر؛ احتُفظ به لكن لم يمنح نقاط سهولة منافسة.',
        '- `semrush_intent_codes` و`semrush_trend`: قيم المزود الخام. لم تُخترع أسماء أشهر لسلسلة trend لأن التقرير لا يحدد فترتها.',
        '- `intent` و`cluster` و`business_relevance` وملكية URL والأولوية: استنتاج تحريري، وليست قياسًا من المزود.',
        '- `dfs_*`: معلومات محفوظة من ملف DataForSEO المحلي مع مطابقة suffix اللغة. تاريخ 2026-09-03 هو تاريخ التقرير، وليس إثبات توقيت API.',
        '- `metric_disagreement`: اختلاف بين مزودين/فترتين؛ لا يعني بالضرورة خطأ أحدهما. Semrush الحالي يملك الأعمدة الأساسية.',
        '- `city`: المدينة المذكورة في الكلمة فقط؛ القياسات على السعودية كلها وليست حجم بحث المدينة.',
        '- `target_status=listed_in_local_sitemap`: وجود محلي فقط؛ لا يثبت HTTP حي أو فهرسة Google. `needs_url_review` رابط موروث يحتاج مراجعة.',
        '- `target_language_fit=english_content_needed`: المالك الحالي عربي ويحتاج محتوى إنجليزي قبل الاستهداف. لم يُفترض وجود ترجمة منشورة.',
        '- `primary_candidate`: مرشح تحريري واحد لكل مالك ولغة، مع تفضيل كلمات الأساس المحددة للصفحات الرئيسية ثم الأولوية والدرجة؛ الباقي كلمات مساندة داخل الصفحة نفسها.',
        '- `alternative_target_urls`: اقتراحات المصادر السابقة للاحتفاظ بالأثر؛ تعددها ليس إثبات cannibalization من GSC.',
        '- أعمدة GSC فارغة و`gsc_status=not_provided`. حجم البحث تقدير سوقي وليس نقرات BrightAI.', '',
        '## الأولوية وطريقة الحساب', '',
        'الدرجة `priority_score` حد أدنى من 100: ملاءمة العمل ×0.45 + ملاءمة النية ×20 + الطلب ×20 + سهولة المنافسة ×10 + فجوة صفحة/لغة ×5.',
        'ملاءمة النية: commercial/transactional=1، informational=0.6، navigational=0.3. الطلب = min(1, ln(1+volume)/ln(2001)). سهولة المنافسة = 1−KD/100 عندما KD>0. فجوة الصفحة/اللغة تساوي 5 عند غياب المالك أو الحاجة لمحتوى إنجليزي، وإلا صفر.',
        'المكوّن غير المقاس لا يمنح نقاطًا؛ لا يُعتبر حجمًا صفريًا. `score_completeness_pct` يساوي 70 +20 عند توفر الحجم +10 عند KD>0. لا تقارن الدرجات دون هذا العمود.',
        'P0: صفحات الأساس الخمس المحددة في السكربت أو كلمة ملاءمتها ≥85 وحجمها ≥20 وKD بين 1 و30. P1: الكلمات الأساسية الأخرى أو فجوات اللغة الإنجليزية. P2: كلمات مجاورة. P3: مؤجلة/مستبعدة أو ملاءمتها <50. الأولوية التحريرية منفصلة عن الدرجة؛ ليست توقعًا للترتيب أو الزيارات.', '',
        f"التوزيع: {json.dumps(summary['priority_counts'],ensure_ascii=False)}.", '',
        '## مصادر وأدلة', '',
        '- [CSV المحدث](BRIGHTAI-KEYWORDS-MERGED-2026-09-08.csv)',
        '- [نسخة ما قبل التحسين](raw/merged-before-improvement-2026-09-08.json)',
        '- [سحب Semrush للكلمات الأصلية](raw/semrush-merged-refresh-2026-09-08.json)',
        '- [سحب الاقتراحات الأولى](raw/semrush-suggestions-refresh-2026-09-08.json)',
        '- [سحب الاقتراحات الإضافية](raw/semrush-additional-refresh-2026-09-08.json)',
        '- [نتيجة التحقق](raw/improvement-validation-2026-09-08.json)',
        '- [سكربت إعادة الإنتاج](improve-merged-keywords.py)', '',
        'مسارات المصادر القديمة محفوظة في `source_files` حتى لو أُزيلت لاحقًا من الشجرة؛ بعض مصادر مجلد `sa-ar/2026-09-08` لم تعد موجودة وقت التحسين. النسخة السابقة محفوظة في JSON للمراجعة. `inherited_source_row_count` عدّ موروث غير معاد إثباته؛ `original_source_file_count` عدد أسماء الملفات الفريدة فقط.',
        'الطلب الأول الكبير أعاد HTTP 414؛ صُغّرت الدفعات ونجحت تغطية كل الكلمات. ERROR 50 NOTHING FOUND يعامل كغياب بيانات، وأي خطأ آخر يوقف إعادة الإنتاج.', '',
        '## خطوات التنفيذ', '',
        '1. ابدأ بكلمات P0 وصفحاتها، ثم كلمات P1 الملائمة للمنتج ولو كانت بلا حجم مثبت.',
        '2. استخدم الكلمات المساندة في أقسام وأسئلة الصفحة المالكة؛ راجع النية قبل إنشاء صفحة جديدة.',
        '3. راجع صفوف `needs_url_review` و`english_content_needed` قبل استخدام روابطها أو بناء محتوى جديد.',
        '4. استورد GSC بفترة وبلد وجهاز محددين لاحقًا لتقييم الظهور والنقرات وتنافس الصفحات فعليًا.', '',
        '## قائمة الكلمات الكاملة', '',
        '| الكلمة | أصل الكلمة | الأولوية | العنقود | الحجم السعودي | KD | حالة القياس | الصفحة المالكة |',
        '|---|---|---|---|---:|---:|---|---|',
    ]
    for r in rows:
        values=[r['keyword'],'مقترحة' if r['origin']=='assistant_suggestion' else 'أصلية',r['priority'],r['cluster'],r['search_volume_sa'] or 'غير متاح',r['keyword_difficulty'] or 'غير متاح',r['semrush_status'],r['target_url'] or 'مؤجل / غير مخصص']
        lines.append('| '+' | '.join(escape(x) for x in values)+' |')
    MD.write_text('\n'.join(lines)+'\n',encoding='utf-8')


if __name__ == '__main__':
    main()
