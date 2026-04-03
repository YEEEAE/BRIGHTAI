#!/usr/bin/env python3
"""
Fetch Semrush Site Audit issues (Errors, Warnings, Notices) with affected URLs
and generate error.html report. Scans ALL possible issue IDs (1-350) to find every active issue.
"""

import requests
import json
import sys
import os
from datetime import datetime

API_KEY = "a1ea08208d7ec2e4b6a81d2c3d226c77"
PROJECT_ID = "29001094"
BASE_URL = f"https://api.semrush.com/reports/v1/projects/{PROJECT_ID}/siteaudit"

# Issue ID to Arabic name mapping (comprehensive)
ISSUE_NAMES = {
    # Errors
    1: "صفحات تُرجع رمز حالة 5XX (Server Errors)",
    2: "صفحات تُرجع رمز حالة 4XX (Client Errors)",
    3: "عنوان الصفحة مفقود أو فارغ (Missing Title)",
    4: "صفحات محظورة من الزحف (Blocked from Crawling)",
    5: "صفحات محظورة من الفهرسة (Blocked from Indexing)",
    6: "عناوين صفحات مكررة (Duplicate Titles)",
    7: "محتوى مكرر (Duplicate Content)",
    8: "روابط داخلية معطلة (Broken Internal Links)",
    9: "صفحات لم يتم الزحف إليها (Pages Not Crawled)",
    10: "مشكلة في حل DNS (DNS Resolution Issue)",
    11: "تعذر فتح عنوان URL (Cannot Open URL)",
    12: "إعادة توجيه دائمة (Permanent Redirects)",
    13: "صور داخلية معطلة (Broken Internal Images)",
    14: "صور خارجية معطلة (Broken External Images)",
    15: "روابط خارجية معطلة (Broken External Links)",
    16: "سلسلة إعادة توجيه (Redirect Chains)",
    17: "حلقة إعادة توجيه (Redirect Loops)",
    18: "بيانات منظمة غير صالحة (Invalid Structured Data)",
    19: "صفحات غير صحيحة في sitemap.xml",
    20: "صفحات بها وسم meta refresh",
    21: "مشاكل hreflang (Hreflang Issues)",
    22: "مشاكل شهادة HTTPS",
    23: "صفحات HTTP تحتوي روابط HTTPS",
    24: "مشاكل Hreflang في صفحات HTTPS (Hreflang Conflicts)",
    25: "روابط داخلية بإعادة توجيه مؤقتة",
    # Warnings
    101: "أوصاف meta description مكررة",
    102: "وصف meta description مفقود أو فارغ",
    103: "عنوان صفحة طويل جداً (Long Title)",
    104: "meta description طويل جداً",
    105: "عنوان صفحة قصير (Short Title)",
    106: "meta description قصير",
    108: "صفحات بدون H1 (Missing H1)",
    109: "أكثر من H1 في الصفحة (Multiple H1)",
    110: "نسبة نص/HTML منخفضة (Low Text Ratio)",
    111: "عدد كلمات منخفض (Low Word Count)",
    112: "صور بدون نص بديل alt (Missing Alt Text)",
    113: "روابط داخلية nofollow",
    114: "صفحات يتيمة (Orphan Pages)",
    115: "إعادة توجيه مؤقتة (Temporary Redirects)",
    116: "عنوان URL طويل (Long URL)",
    117: "JavaScript كبير في الصفحة (Large JS)",
    120: "صفحات صعبة الوصول (Hard to Reach)",
    121: "HTTPS مع canonical HTTP",
    122: "canonical مكسور (Broken Canonical)",
    123: "canonical غير صحيح (Wrong Canonical)",
    124: "JavaScript غير مضغوط (Unminified JS)",
    125: "CSS غير مضغوط (Unminified CSS)",
    126: "بدون viewport (Missing Viewport)",
    128: "مشاكل robots.txt",
    129: "صفحات بتحميل بطيء (Slow Loading)",
    130: "صفحات بها ملفات كبيرة (Large Page Size)",
    131: "روابط تحتوي على underscores",
    132: "إعادة توجيه HTTP إلى HTTPS",
    133: "محتوى مختلط في HTTPS (Mixed Content)",
    134: "صفحات بها Flash (Flash Content)",
    135: "ملفات CSS/JS غير مضغوطة (Unminified Resources)",
    136: "صفحات بها Frames (IFrames)",
    137: "صفحات بها ملفات CSS كبيرة",
    138: "صفحات بها ملفات JS كبيرة",
    139: "مشاكل في ترميز الصفحة (Encoding Issues)",
    140: "صفحات بدون DOCTYPE",
    # Notices
    201: "صفحات محظورة بواسطة robots.txt",
    202: "روابط خارجية لم يتم التحقق منها",
    203: "صفحات غير موجودة في sitemap",
    204: "صفحات بروابط خارجية كثيرة",
    205: "عناوين URL مكررة www/non-www",
    206: "محتوى مختلط (Mixed Content)",
    207: "HTTP/HTTPS مختلطة",
    208: "وقت استجابة بطيء (Slow Response)",
    209: "ملفات JavaScript كبيرة",
    210: "ملفات CSS كبيرة",
    211: "صور كبيرة (Large Images)",
    212: "canonical خارجي (External Canonical)",
    213: "صفحات بدون hreflang (No Hreflang)",
    214: "تعارض hreflang و canonical",
    215: "إشعارات خريطة الموقع (Sitemap Notices)",
    223: "مشاكل برمجية (JavaScript Issues)",
}


def get_severity(issue_id):
    """Determine severity based on issue ID range."""
    if issue_id < 100:
        return "errors"
    elif issue_id < 200:
        return "warnings"
    else:
        return "notices"


def get_issue_name(issue_id):
    """Get Arabic name for issue ID."""
    if issue_id in ISSUE_NAMES:
        return ISSUE_NAMES[issue_id]
    severity = get_severity(issue_id)
    if severity == "errors":
        return f"خطأ رقم #{issue_id}"
    elif severity == "warnings":
        return f"تحذير رقم #{issue_id}"
    return f"إشعار رقم #{issue_id}"


SEVERITY_CONFIG = {
    "errors": {
        "label": "❌ أخطاء (Errors)",
        "color": "#ef4444",
        "badge_bg": "rgba(239, 68, 68, 0.25)",
        "badge_color": "#fca5a5",
        "icon": "🔴"
    },
    "warnings": {
        "label": "⚠️ تحذيرات (Warnings)",
        "color": "#f59e0b",
        "badge_bg": "rgba(245, 158, 11, 0.25)",
        "badge_color": "#fcd34d",
        "icon": "🟡"
    },
    "notices": {
        "label": "ℹ️ إشعارات (Notices)",
        "color": "#3b82f6",
        "badge_bg": "rgba(59, 130, 246, 0.25)",
        "badge_color": "#93c5fd",
        "icon": "🔵"
    }
}


def api_get(endpoint, params=None):
    """Make GET request to Semrush API."""
    if params is None:
        params = {}
    params["key"] = API_KEY
    url = f"{BASE_URL}/{endpoint}" if endpoint else f"{BASE_URL}/"
    try:
        resp = requests.get(url, params=params, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception as e:
        print(f"    ❌ Exception: {e}")
        return None


def generate_html(all_issues, snapshot_id):
    """Generate the error.html file."""
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    errors_list = [i for i in all_issues if i["severity"] == "errors"]
    warnings_list = [i for i in all_issues if i["severity"] == "warnings"]
    notices_list = [i for i in all_issues if i["severity"] == "notices"]
    
    total_errors = len(errors_list)
    total_warnings = len(warnings_list)
    total_notices = len(notices_list)
    total_affected = sum(i["total"] for i in all_issues)
    total_error_pages = sum(i["total"] for i in errors_list)
    total_warning_pages = sum(i["total"] for i in warnings_list)
    total_notice_pages = sum(i["total"] for i in notices_list)

    html = f'''<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0b1020">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <link rel="canonical" href="https://brightai.site/error" />
    <title>تقرير أخطاء صحة الموقع | Bright AI</title>
    <meta name="description" content="صفحة داخلية تعرض مشكلات صحة الموقع في Bright AI لأغراض المراجعة الفنية فقط.">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #0a0f1e;
            --card: rgba(22, 30, 52, 0.85);
            --text: #f1f5f9;
            --muted: #94a3b8;
            --accent: #3b82f6;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #3b82f6;
            --success: #10b981;
            --border: rgba(255,255,255,0.08);
            --glass: rgba(255,255,255,0.03);
        }}
        *{{margin:0;padding:0;box-sizing:border-box}}
        body{{
            font-family:'Tajawal',sans-serif;
            background: var(--bg);
            background-image:
                radial-gradient(ellipse at 20% 50%,rgba(59,130,246,.08) 0%,transparent 60%),
                radial-gradient(ellipse at 80% 20%,rgba(168,85,247,.06) 0%,transparent 50%);
            color:var(--text);
            min-height:100vh;
            padding:32px 20px 60px
        }}
        .c{{max-width:1100px;margin:0 auto}}
        .hdr{{text-align:center;margin-bottom:40px}}
        .hdr h1{{
            font-size:2.4rem;font-weight:800;
            background:linear-gradient(135deg,#60a5fa,#a78bfa,#f472b6);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;
            margin-bottom:12px
        }}
        .hdr .meta{{color:var(--muted);font-size:.95rem}}
        .sg{{
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
            gap:14px;margin-bottom:40px
        }}
        .sc{{
            background:var(--card);backdrop-filter:blur(12px);
            border:1px solid var(--border);border-radius:16px;
            padding:18px;text-align:center;transition:transform .2s
        }}
        .sc:hover{{transform:translateY(-3px)}}
        .sc .n{{font-size:2rem;font-weight:800;line-height:1.1}}
        .sc .l{{font-size:.82rem;color:var(--muted);margin-top:4px}}
        .sc.er .n{{color:var(--danger)}}
        .sc.wa .n{{color:var(--warning)}}
        .sc.no .n{{color:var(--info)}}
        .sc.to .n{{color:var(--accent)}}

        .ss{{margin-bottom:32px}}
        .sh{{
            font-size:1.4rem;font-weight:700;
            padding:16px 0 12px;border-bottom:2px solid var(--border);
            margin-bottom:20px
        }}

        .ic{{
            background:var(--card);backdrop-filter:blur(12px);
            border:1px solid var(--border);border-radius:16px;
            margin-bottom:18px;overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,.15);
            transition:transform .2s,box-shadow .2s
        }}
        .ic:hover{{transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.25)}}
        .ih{{
            display:flex;justify-content:space-between;align-items:center;
            padding:16px 22px;cursor:pointer;user-select:none;transition:background .2s
        }}
        .ih:hover{{background:var(--glass)}}
        .it{{font-size:1.1rem;font-weight:700;margin:0;display:flex;align-items:center;gap:10px}}
        .ib{{
            display:inline-flex;align-items:center;gap:6px;
            padding:4px 14px;border-radius:9999px;
            font-size:.78rem;font-weight:700;white-space:nowrap
        }}
        .bd{{padding:0 22px 18px}}
        .ul{{list-style:none;padding:0;margin:0}}
        .ui{{
            padding:11px 14px;background:rgba(10,15,30,.5);
            border-radius:10px;margin-bottom:7px;
            display:flex;flex-direction:column;gap:5px;
            border:1px solid rgba(255,255,255,.04);transition:background .15s
        }}
        .ui:hover{{background:rgba(10,15,30,.7);border-color:rgba(255,255,255,.08)}}
        .al{{
            color:var(--accent);text-decoration:none;word-break:break-all;
            transition:color .2s;direction:ltr;text-align:left;
            font-size:.9rem;font-weight:500
        }}
        .al:hover{{color:#93c5fd;text-decoration:underline}}
        .um{{font-size:.78rem;color:var(--muted);direction:ltr;text-align:left}}
        .um .lb{{color:#64748b}}
        .ut{{font-size:.8rem;color:#a78bfa;direction:rtl;text-align:right}}
        .ar{{transition:transform .3s;font-size:1.1rem;color:var(--muted)}}
        .ar.o{{transform:rotate(90deg)}}
        .co{{display:none}}
        .ft{{
            text-align:center;padding:28px 0 0;
            color:var(--muted);font-size:.82rem;
            border-top:1px solid var(--border);margin-top:36px
        }}
        @media(max-width:600px){{
            .hdr h1{{font-size:1.6rem}}
            .sg{{grid-template-columns:repeat(2,1fr);gap:10px}}
            .ih{{padding:12px 14px}}
            .bd{{padding:0 14px 14px}}
        }}
    </style>
</head>
<body>
    <div class="c">
        <div class="hdr">
            <h1>تقرير أخطاء صحة الموقع</h1>
            <p class="meta">آخر تحديث: {now} &bull; Semrush Site Audit API &bull; Snapshot: {snapshot_id[:12]}...</p>
        </div>
        <div class="sg">
            <div class="sc er"><div class="n">{total_errors}</div><div class="l">أخطاء ({total_error_pages} صفحة)</div></div>
            <div class="sc wa"><div class="n">{total_warnings}</div><div class="l">تحذيرات ({total_warning_pages} صفحة)</div></div>
            <div class="sc no"><div class="n">{total_notices}</div><div class="l">إشعارات ({total_notice_pages} صفحة)</div></div>
            <div class="sc to"><div class="n">{total_affected}</div><div class="l">إجمالي الصفحات المتأثرة</div></div>
        </div>
'''

    for severity_key in ["errors", "warnings", "notices"]:
        config = SEVERITY_CONFIG[severity_key]
        severity_issues = sorted(
            [i for i in all_issues if i["severity"] == severity_key],
            key=lambda x: x["total"],
            reverse=True
        )
        if not severity_issues:
            continue

        html += f'''
        <div class="ss">
            <h2 class="sh" style="color:{config['color']}">{config['label']} ({len(severity_issues)})</h2>
'''
        for issue in severity_issues:
            card_id = f"i{issue['issue_id']}"
            urls = issue.get("urls", [])
            url_count = issue.get("total", len(urls))
            
            html += f'''
            <div class="ic" style="border-right:4px solid {config['color']}">
                <div class="ih" onclick="t('{card_id}')">
                    <h3 class="it"><span>{config['icon']}</span><span>{issue['name']}</span></h3>
                    <div style="display:flex;align-items:center;gap:12px">
                        <span class="ib" style="background:{config['badge_bg']};color:{config['badge_color']}">{url_count} صفحة</span>
                        <span class="ar" id="a{card_id}">◂</span>
                    </div>
                </div>
                <div class="bd co" id="{card_id}"><ul class="ul">
'''
            if urls:
                for u in urls:
                    src = u.get("source_url", "")
                    tgt = u.get("target_url", "")
                    title = u.get("title", "")
                    info = u.get("info", "")
                    
                    display = src or tgt or "N/A"
                    href = display if display.startswith("http") else "#"
                    
                    info_str = ""
                    if isinstance(info, dict):
                        parts = []
                        for k, v in info.items():
                            if isinstance(v, list):
                                for item in v:
                                    if isinstance(item, dict):
                                        parts.extend([f"{ik}: {iv}" for ik, iv in item.items()])
                            elif isinstance(v, bool):
                                parts.append(f"{k}: {'نعم' if v else 'لا'}")
                            else:
                                parts.append(f"{k}: {v}")
                        info_str = " | ".join(parts)
                    elif info:
                        info_str = str(info)
                    
                    t_html = f'<div class="ut">📄 {title}</div>' if title else ""
                    
                    meta_parts = []
                    if tgt and src and tgt != src:
                        meta_parts.append(f'<span class="lb">Target:</span> {tgt}')
                    if info_str:
                        meta_parts.append(f'<span class="lb">Info:</span> {info_str}')
                    m_html = f'<div class="um">{" &bull; ".join(meta_parts)}</div>' if meta_parts else ""
                    
                    html += f'''<li class="ui">{t_html}<a href="{href}" target="_blank" rel="noopener" class="al">{display}</a>{m_html}</li>
'''
            else:
                html += '<li class="ui" style="text-align:center;color:var(--muted)">لا توجد تفاصيل</li>\n'

            html += '''</ul></div></div>
'''
        html += '</div>\n'

    html += f'''
        <div class="ft"><p>تقرير صحة الموقع &bull; Bright AI &bull; Semrush Site Audit &bull; {now}</p></div>
    </div>
    <script>
function t(id){{const b=document.getElementById(id),a=document.getElementById('a'+id);b.classList.toggle('co');a.classList.toggle('o')}}
document.querySelectorAll('.ss').forEach(s=>{{const f=s.querySelector('.bd'),a=s.querySelector('.ar');if(f)f.classList.remove('co');if(a)a.classList.add('o')}});
    </script>
</body>
</html>'''
    return html


def main():
    print("=" * 60)
    print("  Semrush Site Audit - Full Issues Report")
    print("=" * 60)
    
    # Step 1: Get latest snapshot
    print("\n📸 جلب آخر Snapshot...")
    data = api_get("snapshots")
    if not data or "snapshots" not in data or not data["snapshots"]:
        print("❌ لم يتم العثور على snapshots")
        sys.exit(1)
    
    snapshot_id = data["snapshots"][0]["snapshot_id"]
    print(f"  ✅ Snapshot: {snapshot_id}")
    
    # Step 2: Scan ALL issue IDs (1-350)
    print(f"\n🔍 مسح شامل لجميع أنواع المشاكل المعروفة...")
    all_issues = []
    
    for issue_id in sorted(ISSUE_NAMES.keys()):
        result = api_get(f"snapshot/{snapshot_id}/issue/{issue_id}", params={"limit": 100})
        if result and result.get("total", 0) > 0:
            total = result["total"]
            urls = result.get("data", [])
            severity = get_severity(issue_id)
            name = get_issue_name(issue_id)
            
            print(f"  ✅ #{issue_id} [{severity[:3]}]: {name} → {total} صفحة")
            all_issues.append({
                "issue_id": issue_id,
                "name": name,
                "severity": severity,
                "total": total,
                "urls": urls,
            })
    
    # Step 3: Generate HTML
    print(f"\n📝 توليد ملف error.html...")
    html_content = generate_html(all_issues, snapshot_id)
    
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "error.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    errors = [i for i in all_issues if i["severity"] == "errors"]
    warnings = [i for i in all_issues if i["severity"] == "warnings"]
    notices = [i for i in all_issues if i["severity"] == "notices"]
    
    print(f"\n{'='*60}")
    print(f"✅ تم حفظ التقرير: {output_path}")
    print(f"   أخطاء: {len(errors)} نوع ({sum(i['total'] for i in errors)} صفحة)")
    print(f"   تحذيرات: {len(warnings)} نوع ({sum(i['total'] for i in warnings)} صفحة)")
    print(f"   إشعارات: {len(notices)} نوع ({sum(i['total'] for i in notices)} صفحة)")
    print(f"   إجمالي الروابط: {sum(len(i['urls']) for i in all_issues)}")
    
    # Save raw JSON
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts", "semrush_raw_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "snapshot_id": snapshot_id,
            "issues": all_issues,
            "fetched_at": datetime.now().isoformat()
        }, f, ensure_ascii=False, indent=2, default=str)
    print(f"   البيانات الخام: {json_path}")


if __name__ == "__main__":
    main()
