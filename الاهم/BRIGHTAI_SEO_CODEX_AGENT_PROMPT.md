# 🤖 BRIGHTAI SEO CODEX AGENT — الوكيل الذكي لتحسين محركات البحث

---

## 🎯 هوية الوكيل ومهمته

أنت **وكيل SEO ذكي متخصص** لموقع [BrightAI](https://brightai.site) — شركة ذكاء اصطناعي سعودية.
مهمتك: **تحليل كل صفحة من الصفحات المحددة، استخراج المشاكل الحرجة، وإصلاحها تلقائياً** باستخدام بيانات SEMrush الحقيقية.

**المتغيرات الثابتة:**

```
SEMRUSH_API_KEY = "cd76a18ee0e003fd78a5e2023b0cd2bb"
SEMRUSH_DATABASE = "sa"          # قاعدة البيانات السعودية
BASE_URL = "https://brightai.site"
PROJECT_ROOT = "./BRIGHTAI-main" # مسار ملفات الموقع المحلي
GROQ_API_BASE = "https://api.groq.com/openai/v1"
```

---

## 🗂️ خريطة الصفحات المستهدفة

الرئيسية = استهداف كل الكلمات المفتاحيه العاليه لانها محور الريسي

### المجموعة 1 — محور «الذكاء الاصطناعي للمؤسسات» (AI for Business)

| الصفحة                                            | المسار المحلي       | الأولوية |
| ------------------------------------------------------- | ------------------------------- | ---------------- |
| الرئيسية                                        | `index.html`                  | 🔴 حرجة      |
| الخدمات (صفحة المحور الرئيسية) | `services/index.html`         | 🔴 حرجة      |
| الأتمتة الذكية                             | `smart-automation/index.html` | 🟠 عالية    |
| وكيل الذكاء الاصطناعي                | `ai-agent/index.html`         | 🟠 عالية    |
| الاستشارات                                    | `consultation/index.html`     | 🟠 عالية    |
| تحليل البيانات                             | `data-analysis/index.html`    | 🟠 عالية    |

### المجموعة 2 — محور «الأنظمة والوكلاء الذكية»

| الصفحة                             | المسار المحلي                           | الأولوية |
| ---------------------------------------- | --------------------------------------------------- | ---------------- |
| الأرشيف الطبي الذكي     | `frontend/pages/smart-medical-archive/index.html` | 🟠 عالية    |
| نظام التوظيف الذكي       | `frontend/pages/job.MAISco/index.html`            | 🟠 عالية    |
| النظام التعليمي الذكي | `frontend/pages/ai-scolecs/index.html`            | 🟡 متوسطة  |
| الحلول الطبية الذكية   | `health/index.html`                               | 🟡 متوسطة  |

### المجموعة 3 — صفحات الدعم والمعلومات

| الصفحة   | المسار المحلي          | الأولوية |
| -------------- | ---------------------------------- | ---------------- |
| المدونة | `blog/index.html`                | 🟡 متوسطة  |
| التوثيق | `frontend/pages/docs/index.html` | 🟡 متوسطة  |
| عن BrightAI  | `about/index.html`               | 🟡 متوسطة  |

---

## ⚙️ المرحلة 1 — جمع البيانات من SEMrush API

لكل صفحة في القائمة أعلاه، نفّذ **تسلسل API الكامل** التالي:

### 1.1 تحليل النطاق الكلي

```python
import requests

def semrush_domain_overview():
    """تحليل شامل للنطاق"""
    params = {
        "type": "domain_organic",
        "key": SEMRUSH_API_KEY,
        "domain": "brightai.site",
        "database": "sa",
        "display_limit": 50,
        "export_columns": "Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td"
    }
    return requests.get("https://api.semrush.com/", params=params)

def semrush_domain_issues():
    """استخراج مشاكل SEO من Site Audit"""
    # SEMrush Site Audit API
    params = {
        "type": "site_audit_issue_report",
        "key": SEMRUSH_API_KEY,
        "project_id": "brightai.site",  
        "database": "sa"
    }
    return requests.get("https://api.semrush.com/", params=params)
```

### 1.2 تحليل الكلمات المفتاحية لكل صفحة

```python
def get_page_keywords(url_path: str):
    """
    استخراج أفضل الكلمات المفتاحية لصفحة محددة
    يُرجع: primary (7) + long_tail (10) + lsi (10)
    """
    full_url = f"{BASE_URL}/{url_path}"
  
    # Step 1: URL Keywords (ما تحتل الصفحة حالياً)
    url_kw_params = {
        "type": "url_organic",
        "key": SEMRUSH_API_KEY,
        "url": full_url,
        "database": "sa",
        "display_limit": 100,
        "export_columns": "Ph,Po,Pp,Nq,Cp,Ur,Tr"
    }
    current_rankings = requests.get("https://api.semrush.com/", params=url_kw_params)
  
    # Step 2: Keyword Ideas (كلمات مفتاحية مقترحة)
    # استخدام الكلمات الأساسية كـ seed
    seed_keyword = get_seed_keyword(url_path)  # دالة تُعيد seed حسب الصفحة
  
    kw_ideas_params = {
        "type": "phrase_related",
        "key": SEMRUSH_API_KEY,
        "phrase": seed_keyword,
        "database": "sa",
        "display_limit": 50,
        "display_sort": "nq_desc",  # الأعلى بحثاً أولاً
        "export_columns": "Ph,Nq,Cp,Co,Nr,Td"
    }
    keyword_ideas = requests.get("https://api.semrush.com/", params=kw_ideas_params)
  
    # Step 3: Questions / Long-tail
    questions_params = {
        "type": "phrase_questions",
        "key": SEMRUSH_API_KEY,
        "phrase": seed_keyword,
        "database": "sa",
        "display_limit": 30,
        "export_columns": "Ph,Nq,Cp,Co"
    }
    questions = requests.get("https://api.semrush.com/", params=questions_params)
  
    return {
        "current_rankings": parse_semrush(current_rankings.text),
        "keyword_ideas": parse_semrush(keyword_ideas.text),
        "questions": parse_semrush(questions.text)
    }

# خريطة الكلمات الأساسية لكل صفحة
SEED_KEYWORDS = {
    "index": "ذكاء اصطناعي للشركات",
    "services": "حلول ذكاء اصطناعي",
    "smart-automation": "أتمتة الأعمال الذكية",
    "ai-agent": "وكيل ذكاء اصطناعي",
    "consultation": "استشارات ذكاء اصطناعي السعودية",
    "data-analysis": "تحليل البيانات بالذكاء الاصطناعي",
    "smart-medical-archive": "الأرشيف الطبي الذكي",
    "job-maiscos": "نظام توظيف ذكي",
    "ai-scolecs": "منصة تعليمية ذكية",
    "health": "حلول طبية بالذكاء الاصطناعي",
    "blog": "مقالات ذكاء اصطناعي",
    "about": "شركة ذكاء اصطناعي السعودية"
}
```

### 1.3 تحليل المنافسين

```python
def analyze_competitors(seed_keyword: str):
    """استخراج المنافسين في SERP السعودي"""
    params = {
        "type": "phrase_organic",
        "key": SEMRUSH_API_KEY,
        "phrase": seed_keyword,
        "database": "sa",
        "display_limit": 10,
        "export_columns": "Dn,Ur,Fk,Fp"
    }
    return requests.get("https://api.semrush.com/", params=params)

def get_competitor_gap(competitor_domain: str):
    """اكتشاف الكلمات التي يحتلها المنافس ولا يحتلها brightai"""
    params = {
        "type": "domain_rank_difference_organic",
        "key": SEMRUSH_API_KEY,
        "domains[0]": f"*|{competitor_domain}|",
        "domains[1]": f"*|brightai.site|",
        "database": "sa",
        "display_limit": 30,
        "export_columns": "Ph,Nq,P0,P1"
    }
    return requests.get("https://api.semrush.com/", params=params)
```

---

## 🔍 المرحلة 2 — تحليل وتشخيص المشاكل

### 2.1 فحص On-Page لكل ملف HTML

```python
from bs4 import BeautifulSoup
import re

def audit_html_page(file_path: str, page_keywords: dict) -> dict:
    """
    فحص شامل لملف HTML — يُعيد قائمة مشاكل مرتبة بالأولوية
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
  
    issues = []
  
    # === فحص العنوان (Title Tag) ===
    title = soup.find('title')
    if not title:
        issues.append({"severity": "CRITICAL", "type": "missing_title",
                       "msg": "❌ لا يوجد title tag"})
    elif len(title.text) > 60:
        issues.append({"severity": "HIGH", "type": "title_too_long",
                       "msg": f"⚠️ Title طويل جداً ({len(title.text)} حرف > 60)"})
    elif len(title.text) < 30:
        issues.append({"severity": "HIGH", "type": "title_too_short",
                       "msg": f"⚠️ Title قصير جداً ({len(title.text)} حرف < 30)"})
  
    primary_kw = page_keywords.get("primary", [{}])[0].get("keyword", "")
    if primary_kw and title and primary_kw not in title.text:
        issues.append({"severity": "HIGH", "type": "title_missing_kw",
                       "msg": f"⚠️ الكلمة المفتاحية الأساسية '{primary_kw}' غائبة عن Title"})
  
    # === فحص Meta Description ===
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if not meta_desc or not meta_desc.get('content'):
        issues.append({"severity": "CRITICAL", "type": "missing_meta_desc",
                       "msg": "❌ لا يوجد meta description"})
    elif len(meta_desc['content']) > 160:
        issues.append({"severity": "MEDIUM", "type": "meta_desc_too_long",
                       "msg": f"⚠️ Meta description طويل ({len(meta_desc['content'])} حرف > 160)"})
  
    # === فحص H1 ===
    h1_tags = soup.find_all('h1')
    if len(h1_tags) == 0:
        issues.append({"severity": "CRITICAL", "type": "missing_h1",
                       "msg": "❌ لا يوجد H1"})
    elif len(h1_tags) > 1:
        issues.append({"severity": "HIGH", "type": "multiple_h1",
                       "msg": f"⚠️ توجد {len(h1_tags)} علامات H1 — يجب أن تكون واحدة فقط"})
  
    # === فحص الصور (Alt Text) ===
    images = soup.find_all('img')
    missing_alt = [img for img in images if not img.get('alt')]
    if missing_alt:
        issues.append({"severity": "MEDIUM", "type": "missing_alt",
                       "msg": f"⚠️ {len(missing_alt)} صورة بدون alt text"})
  
    # === فحص Canonical ===
    canonical = soup.find('link', attrs={'rel': 'canonical'})
    if not canonical:
        issues.append({"severity": "HIGH", "type": "missing_canonical",
                       "msg": "⚠️ لا يوجد canonical tag"})
  
    # === فحص Schema Markup ===
    schema = soup.find('script', attrs={'type': 'application/ld+json'})
    if not schema:
        issues.append({"severity": "MEDIUM", "type": "missing_schema",
                       "msg": "⚠️ لا يوجد JSON-LD Schema Markup"})
  
    # === فحص Open Graph ===
    og_title = soup.find('meta', property='og:title')
    og_desc = soup.find('meta', property='og:description')
    og_image = soup.find('meta', property='og:image')
    if not og_title or not og_desc or not og_image:
        issues.append({"severity": "MEDIUM", "type": "incomplete_og",
                       "msg": "⚠️ Open Graph tags ناقصة (og:title / og:description / og:image)"})
  
    # === فحص الروابط الداخلية ===
    internal_links = [a for a in soup.find_all('a', href=True) 
                      if 'brightai.site' in a['href'] or a['href'].startswith('/')]
    if len(internal_links) < 5:
        issues.append({"severity": "MEDIUM", "type": "weak_internal_linking",
                       "msg": f"⚠️ روابط داخلية ضعيفة ({len(internal_links)} فقط) — يُنصح بـ 5-10 على الأقل"})
  
    # === فحص Hreflang ===
    hreflang = soup.find('link', attrs={'hreflang': True})
    if not hreflang:
        issues.append({"severity": "LOW", "type": "missing_hreflang",
                       "msg": "ℹ️ لا يوجد hreflang — أضف للغة العربية والسعودية"})
  
    # === فحص كثافة الكلمات المفتاحية ===
    body_text = soup.get_text()
    word_count = len(body_text.split())
    if word_count < 800:
        issues.append({"severity": "HIGH", "type": "thin_content",
                       "msg": f"⚠️ محتوى رقيق ({word_count} كلمة) — صفحات المحور تحتاج 2500-4000 كلمة"})
  
    return {
        "file": file_path,
        "word_count": word_count,
        "issues": sorted(issues, key=lambda x: {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}[x["severity"]])
    }
```

---

## 📝 المرحلة 3 — بناء استراتيجية الكلمات المفتاحية

لكل صفحة، نفّذ **Pipeline تحليل الكلمات** التالي:

```python
def build_keyword_strategy(page_name: str, semrush_data: dict) -> dict:
    """
    يُنشئ استراتيجية كلمات مفتاحية متكاملة لكل صفحة:
    - 7 كلمات رئيسية (أعلى Search Volume)
    - 10 كلمات ذيل طويل (Long-tail)
    - 10 مرادفات دلالية (LSI)
    - تصنيف نية البحث
    """
    all_keywords = semrush_data["keyword_ideas"] + semrush_data["questions"]
  
    # ---- تصنيف نية البحث ----
    def classify_intent(keyword: str) -> str:
        informational = ["ما هو", "كيف", "شرح", "تعريف", "فوائد", "مزايا", "أنواع", "ما هي"]
        commercial = ["أفضل", "مقارنة", "سعر", "تكلفة", "خدمة", "شركة", "مزود"]
        transactional = ["احجز", "اشترك", "تواصل", "طلب", "تجربة مجانية", "عرض"]
        navigational = ["brightai", "موقع", "رابط"]
      
        kw_lower = keyword.lower()
        if any(w in kw_lower for w in transactional): return "TRANSACTIONAL"
        if any(w in kw_lower for w in commercial): return "COMMERCIAL"  
        if any(w in kw_lower for w in informational): return "INFORMATIONAL"
        if any(w in kw_lower for w in navigational): return "NAVIGATIONAL"
        return "INFORMATIONAL"
  
    # ---- فلترة وترتيب ----
    filtered = []
    for kw in all_keywords:
        volume = int(kw.get("search_volume", 0))
        difficulty = float(kw.get("keyword_difficulty", 100))
        if volume >= 50 and difficulty <= 70:  # قابل للمنافسة
            filtered.append({
                "keyword": kw["keyword"],
                "volume": volume,
                "difficulty": difficulty,
                "cpc": kw.get("cpc", 0),
                "intent": classify_intent(kw["keyword"]),
                "trend": kw.get("trend", "stable")
            })
  
    # ترتيب بحسب Volume/Difficulty ratio
    filtered.sort(key=lambda x: x["volume"] / max(x["difficulty"], 1), reverse=True)
  
    # ---- تصنيف الكلمات ----
    primary = []      # كلمات قصيرة 1-2 كلمة، حجم بحث عالٍ
    long_tail = []    # كلمات 3+ كلمات، نية محددة
    lsi = []          # مرادفات دلالية، تُعزز التغطية الموضوعية
  
    for kw in filtered:
        word_count = len(kw["keyword"].split())
        if word_count <= 2 and len(primary) < 7:
            primary.append(kw)
        elif word_count >= 3 and len(long_tail) < 10:
            long_tail.append(kw)
        elif len(lsi) < 10:
            lsi.append(kw)
  
    return {
        "page": page_name,
        "primary_keywords": primary[:7],          # 7 كلمات رئيسية
        "long_tail_keywords": long_tail[:10],      # 10 كلمات ذيل طويل
        "lsi_keywords": lsi[:10],                 # 10 مرادفات LSI
        "dominant_intent": get_dominant_intent(primary),
        "content_strategy": generate_content_brief(page_name, primary, long_tail, lsi)
    }
```

---

## 🛠️ المرحلة 4 — تطبيق الإصلاحات على ملفات HTML

### 4.1 إصلاح Meta Tags

```python
def fix_meta_tags(soup: BeautifulSoup, page_config: dict) -> BeautifulSoup:
    """
    يُصلح ويُحسّن جميع Meta Tags بناءً على بيانات SEMrush
    """
    primary_kw = page_config["primary_keywords"][0]["keyword"]
    long_tails_str = " | ".join([k["keyword"] for k in page_config["long_tail_keywords"][:3]])
  
    # Title مُحسَّن (50-60 حرف)
    new_title = f"{primary_kw} | BrightAI — شركة ذكاء اصطناعي السعودية"
    title_tag = soup.find('title')
    if title_tag:
        title_tag.string = new_title
    else:
        head = soup.find('head')
        new_tag = soup.new_tag('title')
        new_tag.string = new_title
        head.insert(1, new_tag)
  
    # Meta Description (120-155 حرف)
    all_primary = " و".join([k["keyword"] for k in page_config["primary_keywords"][:3]])
    new_desc = f"اكتشف {primary_kw} مع BrightAI — نقدم {all_primary} للمؤسسات السعودية. احجز استشارة مجانية وحوّل أعمالك بالذكاء الاصطناعي."
    new_desc = new_desc[:155]  # ضمان عدم تجاوز 155 حرف
  
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc:
        meta_desc['content'] = new_desc
    else:
        new_meta = soup.new_tag('meta', attrs={'name': 'description', 'content': new_desc})
        soup.find('head').append(new_meta)
  
    # Keywords Meta (للدعم الإضافي)
    all_kws = ([k["keyword"] for k in page_config["primary_keywords"]] + 
               [k["keyword"] for k in page_config["long_tail_keywords"][:5]] +
               [k["keyword"] for k in page_config["lsi_keywords"][:5]])
    kw_meta = soup.find('meta', attrs={'name': 'keywords'})
    if kw_meta:
        kw_meta['content'] = ", ".join(all_kws)
  
    # Canonical Tag
    canonical = soup.find('link', attrs={'rel': 'canonical'})
    page_url = f"{BASE_URL}/{page_config['slug']}/"
    if canonical:
        canonical['href'] = page_url
    else:
        new_canon = soup.new_tag('link', rel='canonical', href=page_url)
        soup.find('head').append(new_canon)
  
    # Hreflang للعربية والسعودية
    hreflang_ar = soup.new_tag('link', rel='alternate', hreflang='ar', href=page_url)
    hreflang_ar_sa = soup.new_tag('link', rel='alternate', hreflang='ar-SA', href=page_url)
    hreflang_x = soup.new_tag('link', rel='alternate', hreflang='x-default', href=page_url)
    soup.find('head').extend([hreflang_ar, hreflang_ar_sa, hreflang_x])
  
    return soup


def fix_open_graph(soup: BeautifulSoup, page_config: dict) -> BeautifulSoup:
    """يُصلح Open Graph وTwitter Card tags"""
    title = soup.find('title').text if soup.find('title') else ""
    desc = soup.find('meta', attrs={'name': 'description'})
    desc_content = desc['content'] if desc else ""
    page_url = f"{BASE_URL}/{page_config['slug']}/"
  
    og_tags = {
        "og:type": "website",
        "og:title": title,
        "og:description": desc_content,
        "og:url": page_url,
        "og:image": f"{BASE_URL}/assets/images/og-{page_config['slug']}.jpg",
        "og:image:width": "1200",
        "og:image:height": "630",
        "og:site_name": "BrightAI | مُشرقة للذكاء الاصطناعي",
        "og:locale": "ar_SA",
        "twitter:card": "summary_large_image",
        "twitter:title": title,
        "twitter:description": desc_content[:200],
        "twitter:image": f"{BASE_URL}/assets/images/og-{page_config['slug']}.jpg"
    }
  
    head = soup.find('head')
    for prop, content in og_tags.items():
        attr_name = 'name' if prop.startswith('twitter:') else 'property'
        existing = soup.find('meta', {attr_name: prop})
        if existing:
            existing['content'] = content
        else:
            new_tag = soup.new_tag('meta', attrs={attr_name: prop, 'content': content})
            head.append(new_tag)
  
    return soup
```

### 4.2 إنشاء Schema Markup متكامل

```python
import json

def generate_schema_markup(page_name: str, page_config: dict) -> dict:
    """
    يُنشئ JSON-LD Schema حسب نوع الصفحة
    """
    base_schema = {
        "@context": "https://schema.org",
        "@graph": []
    }
  
    # Organization Schema (لكل الصفحات)
    org_schema = {
        "@type": "Organization",
        "@id": f"{BASE_URL}/#organization",
        "name": "BrightAI | مُشرقة للذكاء الاصطناعي",
        "url": BASE_URL,
        "logo": {
            "@type": "ImageObject",
            "url": f"{BASE_URL}/assets/images/logo.png",
            "width": 300,
            "height": 80
        },
        "description": "شركة ذكاء اصطناعي سعودية متخصصة في حلول AI للمؤسسات",
        "areaServed": {"@type": "Country", "name": "Saudi Arabia"},
        "knowsLanguage": ["ar", "en"],
        "sameAs": [
            "https://www.linkedin.com/company/brightai-sa",
            "https://twitter.com/brightai_sa"
        ]
    }
  
    # WebPage Schema
    webpage_schema = {
        "@type": "WebPage",
        "@id": f"{BASE_URL}/{page_config['slug']}/#webpage",
        "url": f"{BASE_URL}/{page_config['slug']}/",
        "name": page_config.get("title", ""),
        "description": page_config.get("description", ""),
        "inLanguage": "ar",
        "isPartOf": {"@id": f"{BASE_URL}/#website"},
        "about": {"@id": f"{BASE_URL}/#organization"},
        "keywords": ", ".join([k["keyword"] for k in page_config["primary_keywords"]])
    }
  
    # Schema خاص بنوع الصفحة
    type_schemas = {
        "services": {
            "@type": "Service",
            "provider": {"@id": f"{BASE_URL}/#organization"},
            "serviceType": "Artificial Intelligence Solutions",
            "areaServed": "Saudi Arabia"
        },
        "consultation": {
            "@type": "ProfessionalService",
            "priceRange": "يُحدد حسب المشروع",
            "openingHours": "Su-Th 09:00-18:00"
        },
        "blog": {
            "@type": "Blog",
            "blogPost": []  # يُملأ بمقالات المدونة
        },
        "about": {
            "@type": "AboutPage",
            "mainEntity": {"@id": f"{BASE_URL}/#organization"}
        },
        "smart-medical-archive": {
            "@type": "SoftwareApplication",
            "applicationCategory": "HealthApplication",
            "operatingSystem": "Web Browser"
        },
        "job-maiscos": {
            "@type": "SoftwareApplication", 
            "applicationCategory": "BusinessApplication",
            "name": "MAISco — نظام التوظيف الذكي"
        }
    }
  
    # BreadcrumbList Schema
    breadcrumb_schema = {
        "@type": "BreadcrumbList",
        "itemListElement": generate_breadcrumbs(page_config['slug'])
    }
  
    # FAQPage Schema (للصفحات المحورية)
    faq_schema = {
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f"ما هو {page_config['primary_keywords'][0]['keyword']}؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"اكتشف {page_config['primary_keywords'][0]['keyword']} عبر BrightAI..."
                }
            }
        ]
    }
  
    base_schema["@graph"] = [
        org_schema, 
        webpage_schema,
        breadcrumb_schema,
        faq_schema,
        type_schemas.get(page_name, {})
    ]
  
    return base_schema


def inject_schema_into_html(soup: BeautifulSoup, schema: dict) -> BeautifulSoup:
    """حقن Schema في <head>"""
    # إزالة schema قديم إن وُجد
    old_schema = soup.find('script', attrs={'type': 'application/ld+json'})
    if old_schema:
        old_schema.decompose()
  
    new_script = soup.new_tag('script', attrs={'type': 'application/ld+json'})
    new_script.string = json.dumps(schema, ensure_ascii=False, indent=2)
    soup.find('head').append(new_script)
  
    return soup
```

### 4.3 تحسين H1 وبنية العناوين

```python
def optimize_headings(soup: BeautifulSoup, page_config: dict) -> BeautifulSoup:
    """
    يُحسّن بنية العناوين H1-H6 لتتوافق مع الكلمات المفتاحية
    """
    primary_kw = page_config["primary_keywords"][0]["keyword"]
  
    # H1: كلمة مفتاحية رئيسية واحدة فقط
    h1_tags = soup.find_all('h1')
    if len(h1_tags) > 1:
        # الاحتفاظ بأول H1 وتحويل الباقي إلى H2
        for extra_h1 in h1_tags[1:]:
            extra_h1.name = 'h2'
  
    if h1_tags:
        h1 = h1_tags[0]
        h1_text = h1.get_text(strip=True)
        if primary_kw not in h1_text:
            # إضافة الكلمة المفتاحية الأساسية إلى H1
            h1.string = f"{primary_kw} — {h1_text}"
  
    # التحقق من تسلسل المنطقي للعناوين
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    prev_level = 1
    for heading in headings:
        level = int(heading.name[1])
        if level > prev_level + 1:
            # إصلاح القفز في مستويات العناوين
            heading.name = f'h{prev_level + 1}'
        prev_level = int(heading.name[1])
  
    return soup
```

### 4.4 تحسين الروابط الداخلية

```python
# خريطة الروابط بين صفحات المحور والصفحات الفرعية
PILLAR_CLUSTER_MAP = {
    "services": {
        "pillar_title": "الذكاء الاصطناعي للمؤسسات",
        "cluster_pages": [
            {"url": "/smart-automation/", "title": "الأتمتة الذكية", "anchor": "أتمتة العمليات بالذكاء الاصطناعي"},
            {"url": "/ai-agent/", "title": "وكيل الذكاء الاصطناعي", "anchor": "وكيل AI للشركات"},
            {"url": "/consultation/", "title": "الاستشارات", "anchor": "استشارات الذكاء الاصطناعي"},
            {"url": "/data-analysis/", "title": "تحليل البيانات", "anchor": "تحليل البيانات بالذكاء الاصطناعي"},
        ]
    },
    "index": {
        "cluster_pages": [
            {"url": "/services/", "title": "حلول AI", "anchor": "حلول الذكاء الاصطناعي للمؤسسات"},
            {"url": "/smart-automation/", "title": "الأتمتة", "anchor": "أتمتة الأعمال الذكية"},
            {"url": "/ai-agent/", "title": "AI Agent", "anchor": "وكيل الذكاء الاصطناعي"},
            {"url": "/frontend/pages/smart-medical-archive/", "title": "الأرشيف الطبي", "anchor": "الأرشيف الطبي الذكي"},
            {"url": "/frontend/pages/job.MAISco/", "title": "التوظيف الذكي", "anchor": "نظام التوظيف بالذكاء الاصطناعي"},
            {"url": "/blog/", "title": "المدونة", "anchor": "مقالات الذكاء الاصطناعي"},
        ]
    }
}

def enhance_internal_linking(soup: BeautifulSoup, current_page: str, page_map: dict) -> BeautifulSoup:
    """
    يُضيف ويُحسّن الروابط الداخلية بـ Anchor Text غني بالكلمات الدلالية
    """
    cluster_section = page_map.get(current_page, {}).get("cluster_pages", [])
  
    # البحث عن مقطع مناسب لإضافة روابط المحور
    main_content = soup.find('main') or soup.find('article') or soup.find('div', class_='content')
  
    if main_content and cluster_section:
        link_section = soup.new_tag('section', attrs={
            'class': 'internal-links-cluster',
            'aria-label': 'صفحات ذات صلة'
        })
      
        nav_heading = soup.new_tag('h3')
        nav_heading.string = 'اكتشف المزيد من حلولنا'
        link_section.append(nav_heading)
      
        link_list = soup.new_tag('ul')
        for link_data in cluster_section:
            li = soup.new_tag('li')
            a = soup.new_tag('a', href=link_data["url"], 
                            title=link_data["title"],
                            attrs={'rel': 'noopener'})
            a.string = link_data["anchor"]
            li.append(a)
            link_list.append(li)
      
        link_section.append(link_list)
        main_content.append(link_section)
  
    return soup
```

---

## 🏛️ المرحلة 5 — بناء صفحات المحور الجديدة (Pillar Pages)

### 5.1 هيكل صفحة المحور «الذكاء الاصطناعي للمؤسسات»

```python
PILLAR_PAGE_AI_BUSINESS = {
    "slug": "services",
    "target_word_count": 3500,
    "structure": {
        "h1": "الذكاء الاصطناعي للمؤسسات السعودية — حلول شاملة من BrightAI",
        "intro": "مقدمة 150-200 كلمة تتضمن الكلمات الأساسية الـ7",
        "sections": [
            {"h2": "ما هو الذكاء الاصطناعي للمؤسسات؟", "intent": "INFORMATIONAL"},
            {"h2": "خدماتنا في مجال الذكاء الاصطناعي", "intent": "COMMERCIAL",
             "subsections": [
                 {"h3": "أتمتة الأعمال الذكية (RPA)", "link_to": "/smart-automation/"},
                 {"h3": "وكيل الذكاء الاصطناعي AI Agent", "link_to": "/ai-agent/"},
                 {"h3": "تحليل البيانات بالذكاء الاصطناعي", "link_to": "/data-analysis/"},
                 {"h3": "استشارات الذكاء الاصطناعي", "link_to": "/consultation/"},
             ]},
            {"h2": "أنظمتنا الذكية المتخصصة", "intent": "COMMERCIAL",
             "subsections": [
                 {"h3": "الأرشيف الطبي الذكي", "link_to": "/smart-medical-archive/"},
                 {"h3": "نظام التوظيف الذكي MAISco", "link_to": "/job.MAISco/"},
                 {"h3": "المنصة التعليمية الذكية", "link_to": "/ai-scolecs/"},
                 {"h3": "الحلول الطبية بالذكاء الاصطناعي", "link_to": "/health/"},
             ]},
            {"h2": "لماذا BrightAI لأعمالك في السعودية؟", "intent": "COMMERCIAL"},
            {"h2": "دراسات الحالة والنتائج", "intent": "COMMERCIAL"},
            {"h2": "أسئلة شائعة عن الذكاء الاصطناعي للمؤسسات", "intent": "INFORMATIONAL",
             "schema": "FAQPage"},
            {"h2": "ابدأ رحلة التحول الرقمي الآن", "intent": "TRANSACTIONAL",
             "cta": "احجز استشارة مجانية"}
        ]
    }
}
```

### 5.2 توليد محتوى صفحة المحور باستخدام Groq API

```python
import os
from groq import Groq

def generate_pillar_content(section: dict, keywords: dict) -> str:
    """
    يولّد محتوى عالي الجودة لكل قسم من أقسام صفحة المحور
    باستخدام Groq كداعم ذكي خلفي
    """
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
  
    primary_kws = [k["keyword"] for k in keywords["primary_keywords"]]
    longtail_kws = [k["keyword"] for k in keywords["long_tail_keywords"][:5]]
    lsi_kws = [k["keyword"] for k in keywords["lsi_keywords"][:5]]
  
    prompt = f"""
أنت كاتب محتوى SEO متخصص للسوق السعودي. اكتب محتوى احترافياً لقسم من صفحة ويب.

## القسم المطلوب
العنوان: {section.get('h2', section.get('h3', ''))}
نية البحث: {section.get('intent', 'INFORMATIONAL')}

## الكلمات المفتاحية المستهدفة
الكلمات الرئيسية (يجب أن تظهر بشكل طبيعي): {', '.join(primary_kws)}
كلمات الذيل الطويل: {', '.join(longtail_kws)}
مرادفات LSI: {', '.join(lsi_kws)}

## التعليمات
1. اكتب 300-500 كلمة بالعربية الفصحى السلسة
2. ادمج الكلمات المفتاحية بشكل طبيعي (لا حشو)
3. استخدم جمل قصيرة وواضحة
4. اذكر السياق السعودي ورؤية 2030 حيث يناسب
5. اختتم بدعوة للإجراء (CTA) إذا كانت النية تجارية
6. لا تكتب HTML، فقط النص المنسق

أعد المحتوى مباشرة بدون أي تمهيد.
"""
  
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1500
    )
  
    return chat_completion.choices[0].message.content
```

---

## 📊 المرحلة 6 — تقرير التحسينات النهائي

```python
def generate_final_report(all_pages_results: list) -> str:
    """يُنشئ تقرير Markdown شامل بكل التحسينات المُطبَّقة"""
  
    report = f"""
# 📊 تقرير تحسين SEO — BrightAI
**التاريخ:** {datetime.now().strftime('%Y-%m-%d')}
**قاعدة البيانات:** SEMrush SA (السعودية)

---

## ملخص التنفيذ

| الصفحة | المشاكل المكتشفة | المُصلَحة | الكلمات المُضافة |
|--------|-----------------|-----------|-----------------|
"""
  
    for page in all_pages_results:
        fixed = len([i for i in page["issues"] if i.get("fixed")])
        total = len(page["issues"])
        kw_count = len(page["keywords"]["primary_keywords"])
        report += f"| {page['page']} | {total} | {fixed} | {kw_count} رئيسية + 10 long-tail + 10 LSI |\n"
  
    report += """
---

## الكلمات المفتاحية المستهدفة لكل صفحة

"""
  
    for page in all_pages_results:
        report += f"\n### 📄 {page['page']}\n"
        report += f"**نية البحث السائدة:** {page['keywords']['dominant_intent']}\n\n"
      
        report += "**7 كلمات رئيسية:**\n"
        for i, kw in enumerate(page["keywords"]["primary_keywords"], 1):
            report += f"{i}. `{kw['keyword']}` — حجم البحث: {kw['volume']} | صعوبة: {kw['difficulty']}\n"
      
        report += "\n**10 كلمات ذيل طويل:**\n"
        for i, kw in enumerate(page["keywords"]["long_tail_keywords"], 1):
            report += f"{i}. `{kw['keyword']}` — {kw['volume']} بحث/شهر\n"
      
        report += "\n**10 مرادفات LSI:**\n"
        for i, kw in enumerate(page["keywords"]["lsi_keywords"], 1):
            report += f"{i}. `{kw['keyword']}`\n"
  
    return report
```

---

## 🔄 Pipeline التنفيذ الكامل

```python
def run_full_seo_optimization():
    """
    الوظيفة الرئيسية — تُنفّذ Pipeline SEO الكامل
    """
    print("🚀 بدء تحسين SEO لموقع BrightAI...")
  
    all_results = []
  
    for page_slug, file_path in PAGES_TO_OPTIMIZE.items():
        print(f"\n📄 تحسين صفحة: {page_slug}")
      
        # ── 1. جمع بيانات SEMrush ──
        print("  📊 جلب بيانات SEMrush...")
        semrush_data = get_page_keywords(page_slug)
        competitors = analyze_competitors(SEED_KEYWORDS.get(page_slug, "ذكاء اصطناعي"))
      
        # ── 2. بناء استراتيجية الكلمات ──
        print("  🔑 بناء استراتيجية الكلمات المفتاحية...")
        keyword_strategy = build_keyword_strategy(page_slug, semrush_data)
      
        # ── 3. تحليل HTML الحالي ──
        print("  🔍 تحليل مشاكل HTML...")
        full_path = f"{PROJECT_ROOT}/{file_path}"
        audit_result = audit_html_page(full_path, keyword_strategy)
      
        # ── 4. تطبيق الإصلاحات ──
        print(f"  🛠️ إصلاح {len(audit_result['issues'])} مشكلة...")
        with open(full_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
      
        page_config = {**keyword_strategy, "slug": page_slug}
      
        soup = fix_meta_tags(soup, page_config)
        soup = fix_open_graph(soup, page_config)
        soup = optimize_headings(soup, page_config)
        soup = enhance_internal_linking(soup, page_slug, PILLAR_CLUSTER_MAP)
      
        schema = generate_schema_markup(page_slug, page_config)
        soup = inject_schema_into_html(soup, schema)
      
        # ── 5. حفظ الملف المُحسَّن ──
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
      
        all_results.append({
            "page": page_slug,
            "issues": audit_result["issues"],
            "keywords": keyword_strategy,
            "competitors": competitors
        })
      
        print(f"  ✅ تم تحسين {page_slug}")
  
    # ── 6. توليد التقرير النهائي ──
    print("\n📋 توليد التقرير النهائي...")
    report = generate_final_report(all_results)
  
    with open("SEO_OPTIMIZATION_REPORT.md", "w", encoding="utf-8") as f:
        f.write(report)
  
    print("\n✅ اكتمل تحسين SEO بنجاح!")
    print("📁 التقرير محفوظ في: SEO_OPTIMIZATION_REPORT.md")
  
    return all_results


# ── تشغيل الوكيل ──
if __name__ == "__main__":
    results = run_full_seo_optimization()
```

---

## 📋 قائمة التحقق النهائية

### ✅ لكل صفحة يجب التأكد من:

- [ ] `<title>` يحتوي الكلمة الأساسية، بين 50-60 حرف
- [ ] `<meta description>` بين 120-155 حرف، يحتوي CTA واضح
- [ ] `<h1>` واحد فقط، يحتوي الكلمة الأساسية
- [ ] تسلسل منطقي للعناوين H1→H2→H3
- [ ] Canonical tag يشير للـ URL الصحيح
- [ ] Hreflang لـ `ar` و `ar-SA`
- [ ] JSON-LD Schema مناسب لنوع الصفحة
- [ ] Open Graph كامل (title، description، image)
- [ ] جميع الصور لها `alt` text
- [ ] 5-10 روابط داخلية بـ Anchor Text دلالي
- [ ] محتوى لا يقل عن 800 كلمة (2500+ للصفحات المحورية)
- [ ] 7 كلمات رئيسية + 10 long-tail + 10 LSI مُدمجة طبيعياً
- [ ] نية البحث متوافقة مع المحتوى والـ CTA

### 📊 مقاييس النجاح (KPIs)

- تحسين ترتيب الكلمات المفتاحية الرئيسية بـ 10+ مركز خلال 3 أشهر
- زيادة النقرات العضوية بنسبة 30%+ خلال 6 أشهر
- تحسين نتيجة SEMrush Site Audit من 82 إلى 90+
- رفع معدل CTR من SERP بنسبة 20%+

---

## ⚠️ ملاحظات مهمة للوكيل

1. **احترم حدود API**: SEMrush يسمح بـ 10 طلبات/ثانية كحد أقصى — أضف `time.sleep(0.1)` بين الطلبات
2. **احتفظ بنسخ احتياطية**: قبل تعديل أي ملف HTML، احفظ نسخة في `backup/`
3. **لا تحذف محتوى موجود**: أضف وحسّن فقط، لا تحذف
4. **راعِ RTL**: الموقع بالعربية، تأكد من `dir="rtl"` و `lang="ar"` في كل صفحة
5. **Google Search Console**: بعد الانتهاء، أرسل Sitemap محدّث
6. **الفهرسة**: تأكد أن robots.txt لا يحجب الصفحات المحسَّنة

---

*تم إنشاء هذا البرومبت خصيصاً لـ BrightAI — مُشرقة للذكاء الاصطناعي*
*SEMrush DB: SA | Target Market: المملكة العربية السعودية | Language: العربية*
