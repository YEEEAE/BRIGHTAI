import os
import re

BASE_DIR = "/Users/yzydalshmry/Desktop/BrightAI"

SILOS = [
    {
        "id": 1,
        "name": "أتمتة العمليات",
        "hub": "/frontend/pages/smart-automation/index.html",
        "hub_title": "الأتمتة الذكية وسير عمل AI",
        "keywords": ["أتمتة العمليات السعودية", "RPA ذكي الرياض", "سير عمل ذكي"],
        "spokes": [
            {"path": "/frontend/pages/blogger/process-automation.html", "title": "أتمتة العمليات"},
            {"path": "/frontend/pages/blogger/auto.html", "title": "أتمتة سير العمل"},
            {"path": "/frontend/pages/blogger/smart-automation-benefits.html", "title": "فوائد الأتمتة الذكية"},
            {"path": "/frontend/pages/blogger/saudi-factory-ai-productivity.html", "title": "إنتاجية المصانع السعودية بالذكاء الاصطناعي"}
        ]
    },
    {
        "id": 2,
        "name": "تحليل البيانات",
        "hub": "/frontend/pages/data-analysis/index.html",
        "hub_title": "تحليل البيانات",
        "keywords": ["تحليل بيانات السعودية", "Power BI الرياض", "ذكاء الأعمال BI"],
        "spokes": [
            {"path": "/frontend/pages/blogger/big-data-analysis.html", "title": "تحليل البيانات الضخمة"},
            {"path": "/frontend/pages/blogger/intelligent-data-analysis.html", "title": "التحليل الذكي للبيانات"},
            {"path": "/frontend/pages/blogger/business-intelligence-saudi.html", "title": "ذكاء الأعمال في السعودية"},
            {"path": "/frontend/pages/blog/data-analytics/power-bi-saudi-guide.html", "title": "دليل Power BI في السعودية"},
            {"path": "/frontend/pages/blog/data-analytics/kpi-dashboard-guide.html", "title": "دليل لوحات تحكم KPI"}
        ]
    },
    {
        "id": 3,
        "name": "ذكاء اصطناعي كخدمة",
        "hub": "/frontend/pages/ai-agent/index.html",
        "hub_title": "AIaaS للمنشآت",
        "keywords": ["AIaaS السعودية", "ذكاء اصطناعي كخدمة", "نماذج لغوية كبيرة"],
        "spokes": [
            {"path": "/frontend/pages/blogger/ai-agent.html", "title": "وكيل الذكاء الاصطناعي"},
            {"path": "/frontend/pages/blogger/ai.html", "title": "الذكاء الاصطناعي"},
            {"path": "/frontend/pages/blogger/Generative-artificial-intelligence.html", "title": "الذكاء الاصطناعي التوليدي"},
            {"path": "/frontend/pages/blogger/ai-generative-content-industry-saudi-arabia.html", "title": "صناعة المحتوى التوليدي بالسعودية"}
        ]
    },
    {
        "id": 4,
        "name": "القطاع الصحي",
        "hub": "/frontend/pages/smart-medical-archive/index.html",
        "hub_title": "الأرشيف الطبي الذكي",
        "keywords": ["أرشيف طبي ذكي", "ملفات مرضى إلكترونية", "AI صحي السعودية"],
        "spokes": [
            {"path": "/frontend/pages/blogger/ai-healthcare-saudi.html", "title": "الذكاء الاصطناعي في الصحة السعودية"},
            {"path": "/frontend/pages/blogger/digital-health-smart-archive.html", "title": "الصحة الرقمية والأرشيف الذكي"},
            {"path": "/frontend/pages/blogger/kfshrc-breast-cancer-ai.html", "title": "AI في الكشف عن سرطان الثدي"},
            {"path": "/frontend/pages/blogger/private-hospital-scheduling-optimization.html", "title": "تحسين جدولة المستشفيات الخاصة"}
        ]
    },
    {
        "id": 5,
        "name": "القطاع المالي",
        "hub": "/frontend/pages/sectors/finance.html",
        "hub_title": "القطاع المالي",
        "keywords": ["AI مالي السعودية", "كشف احتيال ذكي", "fintech ذكاء اصطناعي"],
        "spokes": [
            {"path": "/frontend/pages/blogger/ai-finance-saudi.html", "title": "الذكاء الاصطناعي في القطاع المالي بالسعودية"},
            {"path": "/frontend/pages/blogger/digital-banking-saudi.html", "title": "الخدمات المصرفية الرقمية بالسعودية"},
            {"path": "/frontend/pages/blogger/saudi-bank-fraud-detection.html", "title": "كشف الاحتيال المصرفي للمصارف السعودية"},
            {"path": "/frontend/pages/blogger/saudi-insurance-claims-ai.html", "title": "مطالبات التأمين السعودية بـ AI"}
        ]
    },
    {
        "id": 6,
        "name": "التحول الرقمي",
        "hub": "/frontend/pages/consultation/index.html",
        "hub_title": "استشارات التحول الرقمي",
        "keywords": ["استشارات تحول رقمي السعودية", "رؤية 2030 ذكاء اصطناعي", "تحول رقمي", "NCA"],
        "spokes": [
            {"path": "/frontend/pages/blogger/ai-transformation.html", "title": "التحول بواسطة الذكاء الاصطناعي"},
            {"path": "/frontend/pages/blogger/digital.html", "title": "الرقمنة"},
            {"path": "/frontend/pages/blogger/nca-compliance.html", "title": "الامتثال لمعايير الهيئة الوطنية للأمن السيبراني"},
            {"path": "/frontend/pages/blogger/gov.html", "title": "القطاع الحكومي والرقمي"}
        ]
    }
]

def get_abs_path(rel_path):
    return os.path.join(BASE_DIR, rel_path.lstrip("/"))

def get_rel_link(from_path, to_path):
    from_dir = os.path.dirname(from_path)
    rel = os.path.relpath(to_path, from_dir)
    return rel

def calculate_depth(path):
    return path.count("/") - 1

def inject_hub_links(silo):
    hub_path = get_abs_path(silo["hub"])
    if not os.path.exists(hub_path):
        print(f"Hub not found: {hub_path}")
        return
        
    with open(hub_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check if we already injected
    if 'id="silo-spokes-links"' in content:
        print(f"Links already injected in {hub_path}")
        return
        
    links_html = f'''
<!-- SILO LINKS -->
<div id="silo-spokes-links" class="max-w-7xl mx-auto px-6 mt-12 pb-12">
    <h4 class="text-2xl font-bold text-white mb-6 text-center border-b border-white/10 pb-4">مقالات ودراسات ذات صلة ({silo["name"]})</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
'''
    for spoke in silo["spokes"]:
        href = get_rel_link(hub_path, get_abs_path(spoke["path"]))
        links_html += f'''        <a href="{href}" class="glass-card p-4 block hover:-translate-y-1 transition duration-300 border border-white/10 hover:border-indigo-500/50">
            <h5 class="text-sm font-bold text-slate-300 flex items-center justify-between">{spoke["title"]} <iconify-icon class="text-indigo-400" icon="lucide:arrow-up-left"></iconify-icon></h5>
        </a>
'''
    links_html += '''    </div>
</div>
<!-- END SILO LINKS -->
'''
    
    # Insert before <footer
    if '<footer' in content:
        content = content.replace('<footer', links_html + '\n<footer', 1)
        with open(hub_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Injected links in Hub: {hub_path}")
    else:
        print(f"Could not find <footer in Hub: {hub_path}")

def inject_spoke_links(silo):
    hub_path = get_abs_path(silo["hub"])
    spokes = silo["spokes"]
    
    for i, spoke in enumerate(spokes):
        spoke_path = get_abs_path(spoke["path"])
        if not os.path.exists(spoke_path):
            print(f"Spoke not found: {spoke_path}")
            continue
            
        with open(spoke_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'id="silo-hub-link"' in content:
            print(f"Links already injected in {spoke_path}")
            continue

        # Link to hub
        hub_href = get_rel_link(spoke_path, hub_path)
        
        # Link to 2 other spokes
        other_spokes = [s for j, s in enumerate(spokes) if j != i][:2]
        
        links_html = f'''
<!-- SILO HUB & SPOKES LINKS -->
<section id="silo-hub-link" class="related-articles mt-12 p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-xl mb-8">
    <div class="flex items-center gap-3 mb-6">
        <iconify-icon icon="lucide:link" width="24" class="text-indigo-400"></iconify-icon>
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-0">خدمات أساسية ومقالات ذات صلة</h2>
    </div>
    <div class="space-y-4">
        <a href="{hub_href}" class="block p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-indigo-500 transition-colors">
            <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 block">الخدمة الأساسية</span>
            <span class="text-lg font-bold text-slate-900 dark:text-white">{silo["hub_title"]}</span>
        </a>
'''
        for js in other_spokes:
            js_href = get_rel_link(spoke_path, get_abs_path(js["path"]))
            links_html += f'''        <a href="{js_href}" class="block p-3 border-r-4 border-indigo-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 font-medium">{js["title"]}</a>
'''
        links_html += '''    </div>
</section>
<!-- END SILO LINKS -->
'''
        
        # Add contextual link in exact first paragraph match
        added_contextual = False
        for kw in silo["keywords"]:
            if not added_contextual and kw in content:
                # Replace ONLY first occurrence outside HTML tags if possible (simplified for Python script)
                # Since we are working with raw HTML, let's just do a naive replacement of the first one
                link_str = f'<a href="{hub_href}" class="font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors" title="{kw}">{kw}</a>'
                content = content.replace(kw, link_str, 1)
                added_contextual = True

        if not added_contextual:
            # Append contextual text at end of first <p> which doesn't have class description
            p_match = re.search(r'<p(?! class="description")[^>]*>(.*?)</p>', content, re.DOTALL)
            if p_match:
                orig_p = p_match.group(0)
                new_p = orig_p.replace('</p>', f' لتعزيز قدراتك، اكتشف المزيد عن <a href="{hub_href}" class="font-bold text-indigo-600 hover:text-indigo-800 underline title="{silo["keywords"][0]}">{silo["keywords"][0]}</a>.</p>')
                content = content.replace(orig_p, new_p, 1)

        # Append links HTML
        if '</article>' in content:
            content = content.replace('</article>', links_html + '\n</article>', 1)
            with open(spoke_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Injected links in Spoke: {spoke_path}")
        else:
            print(f"Could not find </article> in {spoke_path}")


for silo in SILOS:
    print(f"Processing Silo: {silo['name']}")
    inject_hub_links(silo)
    inject_spoke_links(silo)
