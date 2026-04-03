#!/usr/bin/env python3
"""توليد ملف DOCX من تقارير SEMrush الخاصة بالروابط والموقع."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt


PROJECTS_ENDPOINT = "https://api.semrush.com/management/v1/projects"
SNAPSHOTS_ENDPOINT = "https://api.semrush.com/reports/v1/projects/{project_id}/siteaudit/snapshots"
ISSUE_ENDPOINT = (
    "https://api.semrush.com/reports/v1/projects/{project_id}/siteaudit/"
    "snapshot/{snapshot_id}/issue/{issue_id}"
)
BROKEN_LINKS_ISSUE_ID = 8
BROKEN_LINKS_ISSUE_NAME = "Internal links are broken"
SITEMAP_ISSUE_ID = 18
SITEMAP_ISSUE_NAME = "Incorrect pages found in sitemap.xml"
FOUR_XX_ISSUE_ID = 2
FOUR_XX_ISSUE_NAME = "Pages returned 4XX status code"
META_REFRESH_ISSUE_ID = 40
META_REFRESH_ISSUE_NAME = "Pages have a meta refresh tag"
STRUCTURED_DATA_ISSUE_ID = 45
STRUCTURED_DATA_ISSUE_NAME = "Structured data item is invalid"
LOW_TEXT_HTML_ISSUE_ID = 112
LOW_TEXT_HTML_ISSUE_NAME = "Pages have low text-HTML ratio"
UNMINIFIED_ASSETS_ISSUE_ID = 135
UNMINIFIED_ASSETS_ISSUE_NAME = "Issues with unminified JavaScript and CSS files"
BROKEN_EXTERNAL_LINKS_ISSUE_ID = 12
BROKEN_EXTERNAL_LINKS_ISSUE_NAME = "External links are broken"
ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = ROOT / "reports"


def set_rtl(paragraph) -> None:
    """ضبط الفقرة لتعمل بصيغة RTL داخل Word."""
    p_pr = paragraph._p.get_or_add_pPr()
    bidi = p_pr.find(qn("w:bidi"))
    if bidi is None:
        bidi = OxmlElement("w:bidi")
        p_pr.append(bidi)
    bidi.set(qn("w:val"), "1")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT


def fetch_json(url: str) -> dict[str, Any]:
    try:
        with urlopen(url) as response:
            return json.load(response)
    except HTTPError as exc:
        raise SystemExit(f"فشل استدعاء SEMrush API: HTTP {exc.code} على الرابط: {url}") from exc
    except URLError as exc:
        raise SystemExit(f"تعذر الوصول إلى SEMrush API: {exc.reason}") from exc


def build_url(endpoint: str, **params: Any) -> str:
    clean = {key: value for key, value in params.items() if value is not None}
    return f"{endpoint}?{urlencode(clean)}"


def get_project(api_key: str, project_id: int | None, domain: str | None) -> dict[str, Any]:
    url = build_url(PROJECTS_ENDPOINT, key=api_key, filter="all")
    payload = fetch_json(url)

    if project_id is not None:
        for item in payload:
            if item.get("project_id") == project_id:
                return item
        raise SystemExit(f"لم يتم العثور على المشروع رقم {project_id} داخل حساب SEMrush.")

    if domain:
        normalized = domain.lower().strip().rstrip("/")
        for item in payload:
            if str(item.get("url", "")).lower().rstrip("/") == normalized:
                return item

    if len(payload) == 1:
        return payload[0]

    raise SystemExit("تعذر تحديد المشروع تلقائيًا. مرر project_id أو domain بشكل صريح.")


def get_latest_snapshot(api_key: str, project_id: int) -> dict[str, Any]:
    url = build_url(SNAPSHOTS_ENDPOINT.format(project_id=project_id), key=api_key)
    payload = fetch_json(url)
    snapshots = payload.get("snapshots", [])
    if not snapshots:
        raise SystemExit("لم يتم العثور على أي Site Audit snapshots لهذا المشروع.")
    return max(snapshots, key=lambda item: item.get("finish_date", 0))


def get_issue_rows(api_key: str, project_id: int, snapshot_id: str, issue_id: int) -> list[dict[str, Any]]:
    page = 1
    limit = 100
    rows: list[dict[str, Any]] = []

    while True:
        url = build_url(
            ISSUE_ENDPOINT.format(project_id=project_id, snapshot_id=snapshot_id, issue_id=issue_id),
            key=api_key,
            limit=limit,
            page=page,
        )
        payload = fetch_json(url)
        data = payload.get("data", [])
        rows.extend(data)
        total = int(payload.get("total", len(rows)))
        if len(rows) >= total or not data:
            break
        page += 1

    return rows


def to_riyadh_datetime(timestamp_ms: int) -> str:
    dt = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).astimezone()
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def aggregate_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = defaultdict(lambda: {"count": 0, "source_urls": set()})

    for row in rows:
        target_url = row.get("target_url", "").strip()
        source_url = row.get("source_url", "").strip()
        grouped[target_url]["count"] += 1
        if source_url:
            grouped[target_url]["source_urls"].add(source_url)

    items: list[dict[str, Any]] = []
    for target_url, data in grouped.items():
        items.append(
            {
                "target_url": target_url,
                "count": data["count"],
                "source_urls": sorted(data["source_urls"]),
            }
        )

    items.sort(key=lambda item: (-item["count"], item["target_url"]))
    return items


def aggregate_sitemap_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = defaultdict(lambda: {"count": 0, "problems": set(), "source_urls": set()})

    for row in rows:
        target_url = row.get("target_url", "").strip()
        source_url = row.get("source_url", "").strip()
        problem = row.get("info", {}).get("problem")
        grouped[target_url]["count"] += 1
        if source_url:
            grouped[target_url]["source_urls"].add(source_url)
        if problem is not None:
            grouped[target_url]["problems"].add(str(problem))

    items: list[dict[str, Any]] = []
    for target_url, data in grouped.items():
        items.append(
            {
                "target_url": target_url,
                "count": data["count"],
                "problem_codes": ", ".join(sorted(data["problems"])) if data["problems"] else "-",
                "source_urls": sorted(data["source_urls"]),
            }
        )

    items.sort(key=lambda item: (-item["count"], item["target_url"]))
    return items


def aggregate_4xx_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for row in rows:
        items.append(
            {
                "target_url": row.get("target_url", "").strip(),
                "status_code": str(row.get("info", "")),
                "source_url": row.get("source_url", "").strip() or "-",
            }
        )
    items.sort(key=lambda item: item["target_url"])
    return items


def aggregate_meta_refresh_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for row in rows:
        items.append(
            {
                "source_url": row.get("source_url", "").strip() or "-",
                "target_url": row.get("target_url", "").strip() or "-",
                "title": row.get("title", "").strip() or "-",
            }
        )
    items.sort(key=lambda item: item["source_url"])
    return items


def aggregate_structured_data_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for row in rows:
        info = row.get("info", {}) or {}
        field_errors = info.get("fields", []) or []
        error_texts = []
        for field in field_errors:
            cause = field.get("cause", "")
            names = ", ".join(field.get("names", []) or [])
            if cause and names:
                error_texts.append(f"{cause}: {names}")
            elif names:
                error_texts.append(names)
            elif cause:
                error_texts.append(cause)
        items.append(
            {
                "source_url": row.get("source_url", "").strip() or "-",
                "item_type": info.get("item", "-"),
                "errors": " | ".join(error_texts) if error_texts else "-",
            }
        )
    items.sort(key=lambda item: item["source_url"])
    return items


def aggregate_low_text_html_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for row in rows:
        items.append(
            {
                "source_url": row.get("source_url", "").strip() or "-",
                "title": row.get("title", "").strip() or "-",
                "ratio": str(row.get("info", "-")),
            }
        )
    items.sort(key=lambda item: (item["ratio"], item["source_url"]))
    return items


def aggregate_unminified_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for row in rows:
        resource_type = row.get("info", {}).get("resourceType", "-")
        items.append(
            {
                "source_url": row.get("source_url", "").strip() or "-",
                "target_url": row.get("target_url", "").strip() or "-",
                "resource_type": resource_type,
            }
        )
    items.sort(key=lambda item: item["target_url"])
    return items


def aggregate_broken_external_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for row in rows:
        items.append(
            {
                "source_url": row.get("source_url", "").strip() or "-",
                "target_url": row.get("target_url", "").strip() or "-",
                "status_code": str(row.get("info", "-")),
            }
        )
    items.sort(key=lambda item: item["target_url"])
    return items


def add_heading(document: Document, text: str, level: int = 1) -> None:
    paragraph = document.add_heading(level=level)
    run = paragraph.add_run(text)
    run.font.name = "Tajawal"
    set_rtl(paragraph)


def add_paragraph(document: Document, text: str, bold: bool = False) -> None:
    paragraph = document.add_paragraph()
    run = paragraph.add_run(text)
    run.bold = bold
    run.font.name = "Tajawal"
    run.font.size = Pt(11)
    set_rtl(paragraph)


def add_bullet(document: Document, text: str) -> None:
    paragraph = document.add_paragraph(style="List Bullet")
    run = paragraph.add_run(text)
    run.font.name = "Tajawal"
    run.font.size = Pt(11)
    set_rtl(paragraph)


def add_table(document: Document, headers: list[str], rows: list[list[str]]) -> None:
    table = document.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    header_cells = table.rows[0].cells
    for idx, header in enumerate(headers):
        paragraph = header_cells[idx].paragraphs[0]
        paragraph.clear()
        run = paragraph.add_run(header)
        run.bold = True
        run.font.name = "Tajawal"
        set_rtl(paragraph)

    for row in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row):
            paragraph = cells[idx].paragraphs[0]
            paragraph.clear()
            run = paragraph.add_run(value)
            run.font.name = "Tajawal"
            run.font.size = Pt(10)
            set_rtl(paragraph)


def build_broken_links_prompt(domain: str, total_errors: int, unique_targets: int, top_targets: list[dict[str, Any]]) -> str:
    target_lines = "\n".join(
        f"- {item['target_url']} (ظهر {item['count']} مرة)"
        for item in top_targets[:10]
    )
    return (
        f"أنت مهندس SEO تقني ومهندس Frontend أول. أصلح خطأ SEMrush "
        f"\"{BROKEN_LINKS_ISSUE_NAME}\" على موقع {domain}. عدد الحالات الحالية {total_errors}، "
        f"وعدد الروابط المكسورة الفريدة {unique_targets}. ابدأ بالروابط الأعلى تكرارًا التالية:\n"
        f"{target_lines}\n\n"
        "المطلوب:\n"
        "- افحص كل source_url وحدد مكان الرابط المكسور داخل HTML أو القوالب أو ملفات JS.\n"
        "- استبدل كل target_url مكسور بالمسار الصحيح الموجود فعليًا داخل المشروع.\n"
        "- إذا كانت الصفحة الهدف غير موجودة ولكن يجب أن تبقى، فأنشئ إعادة توجيه 301 أو عدل بنية الربط الداخلي بحسب معمارية الموقع.\n"
        "- وحّد الصياغة بين الروابط العربية والإنجليزية وتأكد من التوافق مع RTL حيث يلزم.\n"
        "- بعد الإصلاح، شغّل فحصًا داخليًا للتأكد من زوال روابط 404 وعدم ظهور روابط داخلية مكسورة جديدة.\n"
        "- أعطني في النهاية قائمة مختصرة: ما الذي تم إصلاحه، وما الذي يحتاج قرارًا تحريريًا أو بنيويًا."
    )


def build_sitemap_prompt(domain: str, total_errors: int, grouped: list[dict[str, Any]]) -> str:
    target_lines = "\n".join(
        f"- {item['target_url']} (problem={item['problem_codes']})"
        for item in grouped[:10]
    )
    return (
        f"أنت مهندس SEO تقني أول. أصلح خطأ SEMrush "
        f"\"{SITEMAP_ISSUE_NAME}\" على موقع {domain}. عدد الحالات الحالية {total_errors}. "
        "الروابط التي يجب البدء بها هي:\n"
        f"{target_lines}\n\n"
        "المطلوب:\n"
        "- افحص ملف sitemap.xml وآلية توليده وحدد لماذا ظهرت هذه الصفحات كصفحات غير صحيحة داخل الخريطة.\n"
        "- إذا كانت الصفحة تعيد 404 أو 3xx أو canonical إلى عنوان آخر أو noindex أو غير قابلة للفهرسة، فأزلها من sitemap.xml فورًا.\n"
        "- إذا كانت الصفحة يجب أن تكون صالحة للفهرسة، فأصلح حالتها لتصبح 200 indexable self-canonical ثم أبقها داخل الخريطة.\n"
        "- تحقّق من اتساق الروابط النهائية مع النسخة المنشورة فعليًا على الموقع، وامنع إدراج أي مسارات تجريبية أو غير منشورة أو مكررة.\n"
        "- بعد التعديل، أعد التحقق من sitemap.xml وتأكد أن كل رابط فيها قابل للفهرسة ولا يعيد توجيهًا أو خطأ.\n"
        "- أعطني خلاصة نهائية تتضمن: الروابط التي أزيلت من الخريطة، الروابط التي تم إصلاحها، وأي روابط تحتاج قرارًا تحريريًا."
    )


def build_4xx_prompt(domain: str, rows: list[dict[str, Any]]) -> str:
    lines = "\n".join(f"- {item['target_url']} ({item['status_code']})" for item in rows[:13])
    return (
        f"أنت مهندس SEO تقني ومهندس نشر أول. أصلح خطأ SEMrush "
        f"\"{FOUR_XX_ISSUE_NAME}\" على موقع {domain}. الصفحات المتأثرة هي:\n"
        f"{lines}\n\n"
        "المطلوب:\n"
        "- افحص لماذا تعيد هذه الصفحات كود 404 أو أي 4XX في البيئة المنشورة.\n"
        "- إذا كانت الصفحة يجب أن تبقى، فأعد نشرها بحالة 200 مع canonical صحيح.\n"
        "- إذا تغيّر المسار، فأنشئ 301 redirect إلى المسار النهائي الصحيح وحدّث كل الروابط الداخلية وsitemap.xml.\n"
        "- إذا كانت الصفحة محذوفة نهائيًا، فأزل الإشارات إليها من الربط الداخلي وخريطة الموقع.\n"
        "- أعطني في النهاية قائمة: ما الذي عاد 200، ما الذي أصبح 301، وما الذي تم تنظيفه من الروابط."
    )


def build_meta_refresh_prompt(domain: str, rows: list[dict[str, Any]]) -> str:
    lines = "\n".join(f"- {item['source_url']} -> {item['target_url']}" for item in rows[:10])
    return (
        f"أنت مهندس SEO تقني أول. أصلح خطأ SEMrush "
        f"\"{META_REFRESH_ISSUE_NAME}\" على موقع {domain}. الصفحات الحالية هي:\n"
        f"{lines}\n\n"
        "المطلوب:\n"
        "- أزل أي meta refresh من HTML.\n"
        "- استخدم 301 redirect على مستوى الخادم أو المنصة بدلًا من إعادة التوجيه داخل الصفحة.\n"
        "- حدّث الروابط الداخلية لتشير مباشرة إلى الوجهة النهائية.\n"
        "- تأكد أن الصفحة النهائية لا تدخل في سلسلة redirect وأن canonical يشير إلى العنوان النهائي.\n"
        "- أعطني ملخصًا نهائيًا يوضح ما تم استبداله من meta refresh وما تم نقله إلى redirect دائم."
    )


def build_structured_data_prompt(domain: str, rows: list[dict[str, Any]]) -> str:
    lines = "\n".join(
        f"- {item['source_url']} | النوع: {item['item_type']} | الأخطاء: {item['errors']}"
        for item in rows[:10]
    )
    return (
        f"أنت مهندس SEO تقني ومتخصص Schema.org. أصلح خطأ SEMrush "
        f"\"{STRUCTURED_DATA_ISSUE_NAME}\" على موقع {domain}. الحالة الحالية:\n"
        f"{lines}\n\n"
        "المطلوب:\n"
        "- افحص JSON-LD أو microdata في الصفحة المتأثرة.\n"
        "- أصلح الحقول المطلوبة المفقودة أو غيّر نوع الـ schema إلى نوع صحيح يعكس المحتوى الحقيقي للصفحة.\n"
        "- لا تضف تقييمات أو مراجعات وهمية. إذا لم توجد بيانات موثقة، فاحذف الخصائص غير المدعومة بدل اختلاقها.\n"
        "- تحقّق بعد الإصلاح من صلاحية الـ schema وأنها متطابقة مع المحتوى الظاهر للمستخدم.\n"
        "- أعطني خلاصة بما تم تعديله وأي حقل تم حذفه أو استبداله."
    )


def build_low_text_html_prompt(domain: str, rows: list[dict[str, Any]]) -> str:
    lines = "\n".join(
        f"- {item['source_url']} | ratio={item['ratio']}"
        for item in rows[:15]
    )
    return (
        f"أنت مهندس SEO تقني ومحرر محتوى أول. أصلح تحذير SEMrush "
        f"\"{LOW_TEXT_HTML_ISSUE_NAME}\" على موقع {domain}. أمثلة الصفحات المتأثرة:\n"
        f"{lines}\n\n"
        "المطلوب:\n"
        "- افحص الصفحات ذات النسبة المنخفضة وحدد هل المشكلة من تضخم الـ HTML أو ضعف المحتوى النصي.\n"
        "- قلّل العناصر الزخرفية أو التكرارية داخل DOM عندما تكون غير ضرورية.\n"
        "- أضف محتوى نصيًا حقيقيًا يشرح الصفحة بوضوح: مقدمة، فوائد، حالات استخدام، أسئلة شائعة، وCTA متسق.\n"
        "- تجنب الحشو. المطلوب نص مفيد وقابل للفهرسة لا مجرد زيادة عدد الكلمات.\n"
        "- أعطني في النهاية الصفحات التي تم تحسينها، وما إذا كان التحسين كان عبر تقليل HTML أو تقوية المحتوى أو الاثنين معًا."
    )


def build_unminified_prompt(domain: str, rows: list[dict[str, Any]]) -> str:
    lines = "\n".join(
        f"- {item['target_url']} | type={item['resource_type']} | page={item['source_url']}"
        for item in rows[:10]
    )
    return (
        f"أنت مهندس Frontend Performance أول. أصلح تحذير SEMrush "
        f"\"{UNMINIFIED_ASSETS_ISSUE_NAME}\" على موقع {domain}. الملفات المتأثرة:\n"
        f"{lines}\n\n"
        "المطلوب:\n"
        "- فعّل minification حقيقية لملفات JS وCSS في مسار البناء أو النشر.\n"
        "- إذا كان الملف محليًا، فاستخدم نسخة مصغرة أو اجعل أداة البناء تنتج bundle مصغرًا.\n"
        "- إذا كان الملف خارجيًا، فتحقق هل توجد نسخة production/minified أو بديل أخف.\n"
        "- تأكد أن أي تغيير لا يكسر التحميل ولا يؤثر على التتبع أو الوظائف التفاعلية.\n"
        "- أعطني في النهاية الملفات التي صُغرت، والملفات الخارجية التي احتاجت قرارًا مختلفًا."
    )


def build_broken_external_prompt(domain: str, rows: list[dict[str, Any]]) -> str:
    lines = "\n".join(
        f"- {item['source_url']} -> {item['target_url']} ({item['status_code']})"
        for item in rows[:10]
    )
    return (
        f"أنت مهندس SEO تقني أول. أصلح تحذير SEMrush "
        f"\"{BROKEN_EXTERNAL_LINKS_ISSUE_NAME}\" على موقع {domain}. الروابط الحالية:\n"
        f"{lines}\n\n"
        "المطلوب:\n"
        "- افحص كل رابط خارجي وتأكد إن كان الكسر دائمًا أو مؤقتًا.\n"
        "- إذا كان الرابط الخارجي تغيّر، فاستبدله بالرابط الصحيح المباشر.\n"
        "- إذا كانت الجهة الخارجية تعيد 429 مؤقتًا، فراجع صيغة الرابط ويفضل استخدام رابط أكثر استقرارًا إن وجد.\n"
        "- إذا لم يعد المحتوى متاحًا، فاحذف الرابط أو استبدله بمصدر موثوق بديل.\n"
        "- أعطني ملخصًا نهائيًا يوضح ما تم استبداله، وما تم حذفه، وما احتاج مراجعة تحريرية."
    )


def create_docx(
    output_path: Path,
    project: dict[str, Any],
    snapshot: dict[str, Any],
    broken_rows: list[dict[str, Any]],
    broken_grouped: list[dict[str, Any]],
    sitemap_rows: list[dict[str, Any]],
    sitemap_grouped: list[dict[str, Any]],
    four_xx_rows: list[dict[str, Any]],
    meta_refresh_rows: list[dict[str, Any]],
    structured_data_rows: list[dict[str, Any]],
    low_text_html_rows: list[dict[str, Any]],
    unminified_rows: list[dict[str, Any]],
    broken_external_rows: list[dict[str, Any]],
) -> None:
    document = Document()
    section = document.sections[0]
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width, section.page_height = section.page_height, section.page_width

    style = document.styles["Normal"]
    style.font.name = "Tajawal"
    style.font.size = Pt(11)

    project_name = project.get("project_name", "غير معروف")
    domain = project.get("url", "")
    finish_date = to_riyadh_datetime(int(snapshot.get("finish_date", 0)))

    add_heading(document, "تقرير SEMrush: الروابط المكسورة وأخطاء sitemap", level=0)
    add_paragraph(document, f"المشروع: {project_name}")
    add_paragraph(document, f"النطاق: {domain}")
    add_paragraph(document, f"تاريخ آخر Snapshot: {finish_date}")
    add_paragraph(document, f"إجمالي حالات الروابط الداخلية المكسورة: {len(broken_rows)}")
    add_paragraph(document, f"إجمالي الروابط الداخلية المكسورة الفريدة: {len(broken_grouped)}")
    add_paragraph(document, f"إجمالي حالات الصفحات غير الصحيحة في sitemap.xml: {len(sitemap_rows)}")
    add_paragraph(document, f"إجمالي الروابط الفريدة غير الصحيحة داخل sitemap.xml: {len(sitemap_grouped)}")
    add_paragraph(document, f"إجمالي صفحات 4XX: {len(four_xx_rows)}")
    add_paragraph(document, f"إجمالي صفحات meta refresh: {len(meta_refresh_rows)}")
    add_paragraph(document, f"إجمالي عناصر structured data غير الصالحة: {len(structured_data_rows)}")
    add_paragraph(document, f"إجمالي صفحات low text/HTML ratio: {len(low_text_html_rows)}")
    add_paragraph(document, f"إجمالي ملفات JS/CSS غير المصغرة: {len(unminified_rows)}")
    add_paragraph(document, f"إجمالي الروابط الخارجية المكسورة: {len(broken_external_rows)}")

    add_heading(document, "الملخص التنفيذي", level=1)
    add_bullet(document, "الخطأ مكرر عبر عدد كبير من الصفحات، لكنه يتركز فعليًا في مجموعة صغيرة من الروابط الهدف المكسورة.")
    add_bullet(document, "أكثر الروابط تكرارًا عادةً تشير إلى مسارات تم تغييرها أو صفحات لم تعد منشورة لكن ما زالت مربوطة داخليًا.")
    add_bullet(document, "أولوية الإصلاح يجب أن تبدأ بالروابط الأعلى تكرارًا لأنها ستخفض العدد الكلي بسرعة في SEMrush.")
    add_bullet(document, "وجود صفحات غير صحيحة داخل sitemap.xml يعني أن خريطة الموقع نفسها تحتاج تنظيفًا أو أن بعض الصفحات ما زالت منشورة بحالة غير قابلة للفهرسة.")
    add_bullet(document, "صفحات 4XX وmeta refresh ومشكلات structured data تؤثر مباشرة على الزحف والفهرسة وإشارات الجودة التقنية.")
    add_bullet(document, "تحذيرات المحتوى والأصول غير المصغرة والروابط الخارجية المكسورة تؤثر على الجودة التقنية وتجربة الزحف حتى لو لم تكن أخطاء حرجة.")

    add_heading(document, f"القسم الأول: {BROKEN_LINKS_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={BROKEN_LINKS_ISSUE_ID} | إجمالي الحالات: {len(broken_rows)} | الروابط الفريدة: {len(broken_grouped)}")

    add_heading(document, "أكثر الروابط المكسورة تكرارًا", level=2)
    top_rows = [
        [str(index), item["target_url"], str(item["count"]), "\n".join(item["source_urls"][:6])]
        for index, item in enumerate(broken_grouped[:20], start=1)
    ]
    add_table(document, ["#", "الرابط المكسور", "عدد مرات الظهور", "أمثلة من الصفحات المتأثرة"], top_rows)

    add_heading(document, "جميع الروابط المكسورة وروابط الصفحات المتأثرة", level=2)
    full_rows = [
        [
            str(index),
            item["target_url"],
            str(item["count"]),
            "\n".join(item["source_urls"]) if item["source_urls"] else "-",
        ]
        for index, item in enumerate(broken_grouped, start=1)
    ]
    add_table(document, ["#", "الرابط المكسور", "العدد", "روابط الصفحات التي تشير إليه"], full_rows)

    add_heading(document, "Prompt جاهز لإصلاح الروابط الداخلية المكسورة", level=2)
    add_paragraph(document, build_broken_links_prompt(domain, len(broken_rows), len(broken_grouped), broken_grouped))

    add_heading(document, f"القسم الثاني: {SITEMAP_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={SITEMAP_ISSUE_ID} | إجمالي الحالات: {len(sitemap_rows)} | الروابط الفريدة: {len(sitemap_grouped)}")

    sitemap_table_rows = [
        [
            str(index),
            item["target_url"],
            item["problem_codes"],
            "\n".join(item["source_urls"]) if item["source_urls"] else "-",
        ]
        for index, item in enumerate(sitemap_grouped, start=1)
    ]
    add_table(document, ["#", "الرابط داخل sitemap.xml", "problem code", "مصدر الاكتشاف"], sitemap_table_rows)

    add_heading(document, "Prompt جاهز لإصلاح sitemap.xml", level=2)
    add_paragraph(document, build_sitemap_prompt(domain, len(sitemap_rows), sitemap_grouped))

    add_heading(document, f"القسم الثالث: {FOUR_XX_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={FOUR_XX_ISSUE_ID} | إجمالي الحالات: {len(four_xx_rows)}")
    four_xx_table_rows = [
        [str(index), item["target_url"], item["status_code"], item["source_url"]]
        for index, item in enumerate(four_xx_rows, start=1)
    ]
    add_table(document, ["#", "الرابط", "HTTP status", "مصدر الاكتشاف"], four_xx_table_rows)
    add_heading(document, "How to fix / Prompt", level=2)
    add_paragraph(document, build_4xx_prompt(domain, four_xx_rows))

    add_heading(document, f"القسم الرابع: {META_REFRESH_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={META_REFRESH_ISSUE_ID} | إجمالي الحالات: {len(meta_refresh_rows)}")
    meta_refresh_table_rows = [
        [str(index), item["source_url"], item["target_url"], item["title"]]
        for index, item in enumerate(meta_refresh_rows, start=1)
    ]
    add_table(document, ["#", "الصفحة", "وجهة meta refresh", "العنوان"], meta_refresh_table_rows)
    add_heading(document, "How to fix / Prompt", level=2)
    add_paragraph(document, build_meta_refresh_prompt(domain, meta_refresh_rows))

    add_heading(document, f"القسم الخامس: {STRUCTURED_DATA_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={STRUCTURED_DATA_ISSUE_ID} | إجمالي الحالات: {len(structured_data_rows)}")
    structured_data_table_rows = [
        [str(index), item["source_url"], item["item_type"], item["errors"]]
        for index, item in enumerate(structured_data_rows, start=1)
    ]
    add_table(document, ["#", "الصفحة", "نوع العنصر", "تفاصيل الخطأ"], structured_data_table_rows)
    add_heading(document, "How to fix / Prompt", level=2)
    add_paragraph(document, build_structured_data_prompt(domain, structured_data_rows))

    add_heading(document, f"القسم السادس: {LOW_TEXT_HTML_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={LOW_TEXT_HTML_ISSUE_ID} | إجمالي الحالات: {len(low_text_html_rows)}")
    low_text_rows = [
        [str(index), item["source_url"], item["ratio"], item["title"]]
        for index, item in enumerate(low_text_html_rows, start=1)
    ]
    add_table(document, ["#", "الصفحة", "ratio", "العنوان"], low_text_rows)
    add_heading(document, "How to fix / Prompt", level=2)
    add_paragraph(document, build_low_text_html_prompt(domain, low_text_html_rows))

    add_heading(document, f"القسم السابع: {UNMINIFIED_ASSETS_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={UNMINIFIED_ASSETS_ISSUE_ID} | إجمالي الحالات: {len(unminified_rows)}")
    unminified_table_rows = [
        [str(index), item["target_url"], item["resource_type"], item["source_url"]]
        for index, item in enumerate(unminified_rows, start=1)
    ]
    add_table(document, ["#", "الملف", "النوع", "الصفحة المتأثرة"], unminified_table_rows)
    add_heading(document, "How to fix / Prompt", level=2)
    add_paragraph(document, build_unminified_prompt(domain, unminified_rows))

    add_heading(document, f"القسم الثامن: {BROKEN_EXTERNAL_LINKS_ISSUE_NAME}", level=1)
    add_paragraph(document, f"issue_id={BROKEN_EXTERNAL_LINKS_ISSUE_ID} | إجمالي الحالات: {len(broken_external_rows)}")
    broken_external_table_rows = [
        [str(index), item["source_url"], item["target_url"], item["status_code"]]
        for index, item in enumerate(broken_external_rows, start=1)
    ]
    add_table(document, ["#", "الصفحة", "الرابط الخارجي", "HTTP status"], broken_external_table_rows)
    add_heading(document, "How to fix / Prompt", level=2)
    add_paragraph(document, build_broken_external_prompt(domain, broken_external_rows))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    document.save(output_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="تصدير تقارير SEMrush الخاصة بالروابط و sitemap إلى DOCX")
    parser.add_argument("--api-key", required=True, help="مفتاح SEMrush API")
    parser.add_argument("--project-id", type=int, default=None, help="رقم المشروع في SEMrush")
    parser.add_argument("--domain", default="brightai.site", help="النطاق إذا لم يتم تمرير project_id")
    parser.add_argument("--output", default=None, help="مسار ملف الإخراج DOCX")
    args = parser.parse_args()

    project = get_project(args.api_key, args.project_id, args.domain)
    snapshot = get_latest_snapshot(args.api_key, project["project_id"])
    broken_rows = get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], BROKEN_LINKS_ISSUE_ID)
    broken_grouped = aggregate_rows(broken_rows)
    sitemap_rows = get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], SITEMAP_ISSUE_ID)
    sitemap_grouped = aggregate_sitemap_rows(sitemap_rows)
    four_xx_rows = aggregate_4xx_rows(
        get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], FOUR_XX_ISSUE_ID)
    )
    meta_refresh_rows = aggregate_meta_refresh_rows(
        get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], META_REFRESH_ISSUE_ID)
    )
    structured_data_rows = aggregate_structured_data_rows(
        get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], STRUCTURED_DATA_ISSUE_ID)
    )
    low_text_html_rows = aggregate_low_text_html_rows(
        get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], LOW_TEXT_HTML_ISSUE_ID)
    )
    unminified_rows = aggregate_unminified_rows(
        get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], UNMINIFIED_ASSETS_ISSUE_ID)
    )
    broken_external_rows = aggregate_broken_external_rows(
        get_issue_rows(args.api_key, project["project_id"], snapshot["snapshot_id"], BROKEN_EXTERNAL_LINKS_ISSUE_ID)
    )

    output_path = (
        Path(args.output)
        if args.output
        else REPORTS_DIR / f"semrush-broken-internal-links-{datetime.now().strftime('%Y-%m-%d')}.docx"
    )
    create_docx(
        output_path,
        project,
        snapshot,
        broken_rows,
        broken_grouped,
        sitemap_rows,
        sitemap_grouped,
        four_xx_rows,
        meta_refresh_rows,
        structured_data_rows,
        low_text_html_rows,
        unminified_rows,
        broken_external_rows,
    )
    print(output_path)


if __name__ == "__main__":
    main()
