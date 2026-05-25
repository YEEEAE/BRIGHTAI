#!/usr/bin/env python3
"""
BrightAI – HTML Content Inventory Analyzer
يحلل جميع صفحات HTML ويصنفها ويستخرج بياناتها
"""

import os, re, sys
from pathlib import Path
from html.parser import HTMLParser
import json

ROOT = Path("/Users/yzydalshmry/Desktop/BRIGHTAI")
EXCLUDE_DIRS = {"node_modules", ".next", ".git", ".agents", "tmp"}

# ─── HTML Parser ──────────────────────────────────────────────────────────────
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_desc = ""
        self.canonical = ""
        self.h1s = []
        self.h2_count = 0
        self.has_schema = False
        self.has_cta = False
        self.internal_links_out = []
        self.noindex = False
        self.robots_meta = ""
        self._in_title = False
        self._in_h1 = False
        self._in_h2 = False
        self._skip_text = False  # for script/style
        self._current_tag = ""
        self._text_parts = []
        self._h1_buf = ""
        self._h2_buf = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        tag = tag.lower()

        if tag in ("script", "style", "noscript"):
            self._skip_text = True

        if tag == "title":
            self._in_title = True

        if tag == "h1":
            self._in_h1 = True
            self._h1_buf = ""

        if tag == "h2":
            self._in_h2 = True
            self.h2_count += 1

        if tag == "link":
            if attrs_dict.get("rel") == "canonical":
                self.canonical = attrs_dict.get("href", "")

        if tag == "meta":
            name = attrs_dict.get("name", "").lower()
            prop = attrs_dict.get("property", "").lower()
            content = attrs_dict.get("content", "")
            http_equiv = attrs_dict.get("http-equiv", "").lower()

            if name == "description":
                self.meta_desc = content
            if name == "robots" or http_equiv == "robots":
                self.robots_meta = content
                if "noindex" in content.lower():
                    self.noindex = True

        if tag == "a":
            href = attrs_dict.get("href", "")
            if href and not href.startswith("http") and not href.startswith("mailto") and not href.startswith("tel") and not href.startswith("#") and href.strip():
                self.internal_links_out.append(href)
            # CTA detection
            cls = attrs_dict.get("class", "").lower()
            txt_hint = attrs_dict.get("aria-label", "").lower()
            if any(kw in cls for kw in ["btn", "button", "cta", "primary"]):
                self.has_cta = True

        if tag == "button":
            cls = attrs_dict.get("class", "").lower()
            if any(kw in cls for kw in ["btn", "button", "cta", "primary"]):
                self.has_cta = True

        # Schema detection
        if tag == "script" and attrs_dict.get("type") == "application/ld+json":
            self.has_schema = True

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in ("script", "style", "noscript"):
            self._skip_text = False
        if tag == "title":
            self._in_title = False
        if tag == "h1":
            self._in_h1 = False
            if self._h1_buf.strip():
                self.h1s.append(self._h1_buf.strip())
        if tag == "h2":
            self._in_h2 = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_h1:
            self._h1_buf += data
        if not self._skip_text:
            stripped = data.strip()
            if stripped:
                self._text_parts.append(stripped)

    def word_count(self):
        text = " ".join(self._text_parts)
        return len(text.split())


# ─── CTA keyword fallback ──────────────────────────────────────────────────────
CTA_KEYWORDS = [
    "احجز", "تواصل", "ابدأ", "جرب", "طلب", "اشترك", "سجل", "احصل",
    "book", "contact", "get started", "try", "request", "sign up", "demo",
    "اطلب", "تجربة", "consultation", "استشارة"
]

# ─── Saudi targeting keywords ──────────────────────────────────────────────────
SAUDI_KW = [
    "السعودية", "الرياض", "جدة", "الدمام", "الخبر", "مكة", "المدينة",
    "نيوم", "vision 2030", "رؤية 2030", "saudi", "riyadh", "jeddah",
    "dammam", "khobar", "ksa", "kingdom"
]

# ─── Classification logic ─────────────────────────────────────────────────────
def classify(path_str: str, parser: PageParser, word_count: int) -> str:
    p = path_str.lower()
    title = parser.title.lower()
    h1 = " ".join(parser.h1s).lower()

    # Error pages
    if any(x in p for x in ["404", "500", "error", "offline"]):
        return "D"
    # Health/technical
    if "/health/" in p or p.endswith("health/index.html"):
        return "D"
    # Sitemap HTML
    if "/sitemap/" in p and p.endswith("index.html"):
        return "D"
    # Demo pages
    if "/demo/" in p:
        return "C"
    if "/try/" in p:
        return "C"
    # en/docs → docs
    if "/docs/" in p or p == "docs.html" or "/en/docs/" in p:
        return "B"
    # Legal
    if any(x in p for x in ["privacy", "terms", "cookies"]):
        return "B"
    # docs root
    if p.endswith("docs.html"):
        return "B"

    # Sectors with duplicate en/ar versions
    if re.search(r"/sectors/\w+-en(\.html|/index\.html)", p):
        return "E"  # English duplicate of Arabic sector page
    if re.search(r"/sectors/\w+\.html$", p) and not p.endswith("index.html"):
        # Flat sector files that also have /sector-name/index.html
        base = re.search(r"/sectors/(\w+)\.html$", p)
        if base:
            folder_version = str(ROOT / "sectors" / base.group(1) / "index.html")
            if Path(folder_version).exists():
                return "E"

    # Services duplicates: flat .html + folder/index.html
    if re.search(r"/services/[\w-]+\.html$", p) and not p.endswith("index.html"):
        base = re.search(r"/services/([\w-]+)\.html$", p)
        if base:
            folder_version = str(ROOT / "services" / base.group(1) / "index.html")
            if Path(folder_version).exists():
                return "E"

    # en/* = English duplicates of Arabic pages (lower priority)
    if p.startswith(str(ROOT).lower() + "/en/"):
        return "B"  # Not main Arabic, treat as support (hreflang)

    # Thin content
    if word_count < 200 and "index" in p:
        return "E"

    # Main pages
    return "A"


# ─── Search intent inference ──────────────────────────────────────────────────
def infer_intent(path_str: str, title: str, h1: str) -> str:
    combined = (path_str + " " + title + " " + h1).lower()
    if any(x in combined for x in ["pricing", "سعر", "تكلفة", "price"]):
        return "تجارية – تسعير"
    if any(x in combined for x in ["demo", "تجربة", "جرب"]):
        return "تجارية – تجريب"
    if any(x in combined for x in ["contact", "تواصل", "استشارة", "consultation"]):
        return "تجارية – تحويل"
    if any(x in combined for x in ["blog", "مقال", "article"]):
        return "معلوماتية – محتوى"
    if any(x in combined for x in ["what is", "ما هو", "ما هي", "guide", "دليل"]):
        return "معلوماتية – تعليمية"
    if any(x in combined for x in ["service", "خدمة", "حل", "solution"]):
        return "تجارية – خدمات"
    if any(x in combined for x in ["about", "عن", "من نحن"]):
        return "علامة تجارية"
    if any(x in combined for x in ["sector", "قطاع", "industry"]):
        return "تجارية – قطاعية"
    if any(x in combined for x in ["location", "موقع", "مدينة", "city"]):
        return "محلية – جغرافية"
    if any(x in combined for x in ["partner", "شريك"]):
        return "علامة تجارية"
    if any(x in combined for x in ["privacy", "terms", "خصوصية", "شروط"]):
        return "قانونية"
    return "غير محددة"


def saudi_targeted(path_str: str, title: str, desc: str, h1: str, text_sample: str) -> str:
    combined = (path_str + " " + title + " " + desc + " " + h1 + " " + text_sample).lower()
    count = sum(1 for kw in SAUDI_KW if kw in combined)
    if count >= 3:
        return "✅ نعم (قوي)"
    if count >= 1:
        return "⚠️ جزئي"
    return "❌ لا"


# ─── Main processing ─────────────────────────────────────────────────────────
def collect_html_files() -> list:
    files = []
    for root, dirs, filenames in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in filenames:
            if f.endswith(".html") or f.endswith(".htm"):
                files.append(Path(root) / f)
    return sorted(files)


def analyze_file(filepath: Path) -> dict:
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        return {"error": str(e), "path": str(filepath)}

    parser = PageParser()
    try:
        parser.feed(content)
    except Exception:
        pass

    wc = parser.word_count()
    path_str = str(filepath)
    rel_path = str(filepath.relative_to(ROOT))

    # CTA fallback via keyword scan in raw text
    if not parser.has_cta:
        text_lower = " ".join(parser._text_parts).lower()
        if any(kw in text_lower for kw in CTA_KEYWORDS):
            parser.has_cta = True

    # Schema fallback: look for ld+json in raw
    if not parser.has_schema and "application/ld+json" in content:
        parser.has_schema = True

    # Inbound links: count references from other files is expensive, skip for now
    h1_display = parser.h1s[0] if parser.h1s else "❌ مفقود"
    title_clean = parser.title.strip()
    sample_text = " ".join(parser._text_parts[:50])

    cat = classify(path_str, parser, wc)
    intent = infer_intent(rel_path, title_clean, h1_display)
    saudi = saudi_targeted(rel_path, title_clean, parser.meta_desc, h1_display, sample_text)

    return {
        "path": rel_path,
        "canonical": parser.canonical or "❌ مفقودة",
        "title": title_clean[:80] if title_clean else "❌ مفقود",
        "meta_desc": parser.meta_desc[:120] if parser.meta_desc else "❌ مفقود",
        "h1": h1_display[:80],
        "h2_count": parser.h2_count,
        "word_count": wc,
        "has_schema": "✅" if parser.has_schema else "❌",
        "has_cta": "✅" if parser.has_cta else "❌",
        "internal_links_out": len(set(parser.internal_links_out)),
        "noindex": "✅ noindex" if parser.noindex else "",
        "robots_meta": parser.robots_meta,
        "intent": intent,
        "saudi_targeted": saudi,
        "category": cat,
    }


CAT_LABELS = {
    "A": "أساسية – تحسين عاجل",
    "B": "دعم/توثيق/إنجليزية",
    "C": "ديمو",
    "D": "تقنية/أخطاء – noindex",
    "E": "مكررة/ضعيفة – دمج أو noindex",
}

def quality_score(row: dict) -> int:
    """0-100 كلما كان أقل كان التحسين أعجل"""
    score = 0
    if row["title"] and "❌" not in row["title"]: score += 15
    if row["meta_desc"] and "❌" not in row["meta_desc"]: score += 15
    if row["h1"] and "❌" not in row["h1"]: score += 15
    if row["h2_count"] >= 3: score += 10
    if row["word_count"] >= 500: score += 15
    if row["has_schema"] == "✅": score += 10
    if row["has_cta"] == "✅": score += 10
    if row["canonical"] and "❌" not in row["canonical"]: score += 5
    if "✅" in row["saudi_targeted"]: score += 5
    return score


def main():
    print("🔍 جارٍ مسح ملفات HTML...")
    files = collect_html_files()
    print(f"   وُجد {len(files)} ملف HTML")

    results = []
    for i, fp in enumerate(files):
        if i % 50 == 0:
            print(f"   تحليل {i}/{len(files)}...")
        r = analyze_file(fp)
        if "error" not in r:
            r["quality_score"] = quality_score(r)
            results.append(r)

    print(f"✅ تم تحليل {len(results)} صفحة")

    # Save JSON for reference
    out_json = ROOT / "reports" / "html_inventory_raw.json"
    out_json.parent.mkdir(exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # ── Build Markdown ──────────────────────────────────────────────────────
    md_lines = []
    md_lines.append("# 📊 جرد محتوى HTML – BrightAI")
    md_lines.append(f"\n**تاريخ التحليل:** 2026-05-25  |  **إجمالي الصفحات المحللة:** {len(results)}\n")

    # Statistics
    cats = {k: [] for k in "ABCDE"}
    for r in results:
        cats.get(r["category"], cats["A"]).append(r)

    md_lines.append("## ملخص تنفيذي\n")
    md_lines.append("| الفئة | العدد | الوصف |")
    md_lines.append("|-------|-------|--------|")
    for k, label in CAT_LABELS.items():
        md_lines.append(f"| **{k}** | {len(cats[k])} | {label} |")
    md_lines.append("")

    missing_title = sum(1 for r in results if "❌" in r["title"])
    missing_desc = sum(1 for r in results if "❌" in r["meta_desc"])
    missing_h1 = sum(1 for r in results if "❌" in r["h1"])
    missing_schema = sum(1 for r in results if r["has_schema"] == "❌")
    missing_canonical = sum(1 for r in results if "❌" in r["canonical"])
    no_cta = sum(1 for r in results if r["has_cta"] == "❌")
    thin = sum(1 for r in results if r["word_count"] < 300)

    md_lines.append("### مؤشرات الجودة الإجمالية\n")
    md_lines.append("| المشكلة | العدد | النسبة |")
    md_lines.append("|---------|-------|--------|")
    total = len(results)
    md_lines.append(f"| بدون عنوان (title) | {missing_title} | {missing_title*100//total}% |")
    md_lines.append(f"| بدون وصف (meta desc) | {missing_desc} | {missing_desc*100//total}% |")
    md_lines.append(f"| بدون H1 | {missing_h1} | {missing_h1*100//total}% |")
    md_lines.append(f"| بدون schema | {missing_schema} | {missing_schema*100//total}% |")
    md_lines.append(f"| بدون canonical | {missing_canonical} | {missing_canonical*100//total}% |")
    md_lines.append(f"| بدون CTA | {no_cta} | {no_cta*100//total}% |")
    md_lines.append(f"| محتوى رقيق (< 300 كلمة) | {thin} | {thin*100//total}% |")
    md_lines.append("")

    # ── Full Table ────────────────────────────────────────────────────────────
    md_lines.append("---\n")
    md_lines.append("## الجدول الكامل لجميع الصفحات\n")
    md_lines.append("| # | الفئة | المسار | العنوان | H1 | H2 | الكلمات | Schema | CTA | Canonical | الاستهداف السعودي | النية | جودة |")
    md_lines.append("|---|-------|--------|---------|----|----|---------|--------|-----|-----------|-------------------|-------|------|")

    for i, r in enumerate(results, 1):
        path_short = r["path"][:60]
        title_short = r["title"][:40]
        h1_short = r["h1"][:35]
        canonical_short = "✅" if (r["canonical"] and "❌" not in r["canonical"]) else "❌"
        md_lines.append(
            f"| {i} | **{r['category']}** | `{path_short}` | {title_short} | {h1_short} | {r['h2_count']} | {r['word_count']} | {r['has_schema']} | {r['has_cta']} | {canonical_short} | {r['saudi_targeted']} | {r['intent']} | {r['quality_score']}/100 |"
        )
    md_lines.append("")

    # ── Top 20 Urgent ────────────────────────────────────────────────────────
    urgent = [r for r in results if r["category"] == "A"]
    urgent_sorted = sorted(urgent, key=lambda x: x["quality_score"])[:20]

    md_lines.append("---\n")
    md_lines.append("## 🚨 أول 20 صفحة تحتاج تحسيناً عاجلاً (فئة A بأدنى جودة)\n")
    md_lines.append("| الترتيب | المسار | الجودة | المشاكل الرئيسية |")
    md_lines.append("|---------|--------|--------|-----------------|")
    for i, r in enumerate(urgent_sorted, 1):
        issues = []
        if "❌" in r["title"]: issues.append("بدون عنوان")
        if "❌" in r["meta_desc"]: issues.append("بدون وصف")
        if "❌" in r["h1"]: issues.append("بدون H1")
        if r["word_count"] < 300: issues.append(f"محتوى رقيق ({r['word_count']} كلمة)")
        if r["has_schema"] == "❌": issues.append("بدون schema")
        if r["has_cta"] == "❌": issues.append("بدون CTA")
        if "❌" in r["canonical"]: issues.append("بدون canonical")
        issues_str = " | ".join(issues) if issues else "تحسين عام"
        md_lines.append(f"| {i} | `{r['path']}` | {r['quality_score']}/100 | {issues_str} |")
    md_lines.append("")

    # ── noindex Pages ─────────────────────────────────────────────────────────
    noindex_cats = [r for r in results if r["category"] in ("C", "D")]
    md_lines.append("---\n")
    md_lines.append("## 🚫 صفحات يجب أن تبقى خارج الفهرسة (noindex)\n")
    md_lines.append("| المسار | الفئة | السبب |")
    md_lines.append("|--------|-------|-------|")
    for r in noindex_cats:
        reason = "ديمو/تجريبي" if r["category"] == "C" else "صفحة تقنية/خطأ"
        already = " *(فعّال بالفعل)*" if r["noindex"] else " ⚠️ *noindex مفقود*"
        md_lines.append(f"| `{r['path']}` | {CAT_LABELS[r['category']]} | {reason}{already} |")
    md_lines.append("")

    # ── Duplicate / Merge Candidates ─────────────────────────────────────────
    duplicates = [r for r in results if r["category"] == "E"]
    md_lines.append("---\n")
    md_lines.append("## 🔀 صفحات مكررة أو ضعيفة – مرشحة للدمج أو الحذف من Sitemap\n")
    md_lines.append("| المسار | الكلمات | السبب |")
    md_lines.append("|--------|---------|-------|")
    for r in duplicates:
        p = r["path"]
        reason = ""
        if "-en.html" in p or "-en/" in p:
            reason = "نسخة إنجليزية مكررة من صفحة عربية (يجب hreflang لا noindex)"
        elif r["word_count"] < 200:
            reason = "محتوى رقيق جداً"
        else:
            reason = "ملف flat مع نسخة مجلد موجودة"
        md_lines.append(f"| `{p}` | {r['word_count']} | {reason} |")
    md_lines.append("")

    # ── Category B summary ────────────────────────────────────────────────────
    md_lines.append("---\n")
    md_lines.append("## 📚 صفحات الدعم والتوثيق والإنجليزية (فئة B)\n")
    md_lines.append("هذه الصفحات يمكن تحسينها لاحقاً أو إضافة hreflang مناسب لها.\n")
    md_lines.append("| المسار | العنوان | الكلمات |")
    md_lines.append("|--------|---------|---------|")
    for r in cats["B"]:
        md_lines.append(f"| `{r['path']}` | {r['title'][:50]} | {r['word_count']} |")
    md_lines.append("")

    # ── Recommendations ────────────────────────────────────────────────────────
    md_lines.append("---\n")
    md_lines.append("## 💡 توصيات استراتيجية\n")
    md_lines.append("""
### أولويات فورية (هذا الأسبوع)
1. **أضف canonical لـ {} صفحة** بدون canonical tag لتجنب تضارب الفهرسة.
2. **أضف meta description لـ {} صفحة** — تأثير مباشر على CTR في نتائج البحث.
3. **أضف noindex لجميع صفحات الديمو ({} صفحة)** — الديمو لا يستحق الفهرسة.
4. **عالج صفحات القطاعات المكررة** — لكل قطاع نسخة عربية + إنجليزية flat file؛ إما دمج أو hreflang صحيح.

### متوسط الأجل
5. **رفع جودة المحتوى في أولى 20 صفحة** المدرجة أعلاه.
6. **أضف schema منظم** للصفحات الأساسية بدون schema.
7. **أضف CTA واضح** لكل صفحة خدمة بدون زر تحويل.

### طويل الأجل
8. **توحيد بنية URLs**: تخلص من النمط المزدوج (flat `.html` + folder `index.html`) لنفس المحتوى.
9. **دعم hreflang صحيح** لجميع الصفحات الإنجليزية (`/en/*`).
""".format(missing_canonical, missing_desc, len(cats["C"])))

    md_lines.append("\n---\n*تم إنشاء هذا التقرير تلقائياً بواسطة سكريبت html_inventory.py*\n")

    out_md = ROOT / "reports" / "html-content-inventory.md"
    out_md.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"\n✅ التقرير جاهز: {out_md}")
    print(f"✅ البيانات الخام: {out_json}")


if __name__ == "__main__":
    main()
