import os
import json
import glob
import re
from datetime import datetime

base_dir = "/Users/yzydalshmry/Desktop/BrightAI/frontend/pages"

def insert_before_head(filepath, script_tag):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple check if already inserted (optional)
    if 'schema.org' in script_tag and script_tag in content:
        return
        
    match = re.search(r'</head>', content, re.IGNORECASE)
    if match:
        idx = match.start()
        new_content = content[:idx] + "\n    " + script_tag + "\n" + content[idx:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"No </head> found in {filepath}")

# 1. Service Pages
service_pages = [
    "smart-automation/index.html",
    "data-analysis/index.html",
    "ai-agent/index.html",
    "ai-bots/index.html",
    "ai-workflows/index.html",
    "machine/index.html",
    "what-is-ai/index.html"
]

for sp in service_pages:
    path = os.path.join(base_dir, sp)
    if not os.path.exists(path):
        continue
    
    service_schema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "provider": {
            "@type": "Organization",
            "name": "Bright AI"
        },
        "areaServed": ["الرياض", "جدة", "نيوم", "السعودية"],
        "serviceType": "ذكاء اصطناعي وأتمتة العمليات",
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "حلول وخدمات الذكاء الاصطناعي",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "أتمتة العمليات"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "تحليل البيانات"
                    }
                }
            ]
        }
    }
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read().lower()
        
    schemas = [service_schema]
    
    if 'faq' in content or 'الأسئلة الشائعة' in content or 'أسئلة' in content:
        schemas.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
                "@type": "Question",
                "name": "كيف يمكنني البدء في استخدام الخدمة؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "يمكنك التواصل معنا عبر صفحة اتصل بنا وسيقوم فريق الخبراء بتقييم احتياجاتك وتقديم خطة مفصلة للخدمة."
                }
            },
            {
                "@type": "Question",
                "name": "هل تدعم الخدمة اللغة العربية والسياق السعودي؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم، كافة خدماتنا مبنية ومخصصة لدعم اللغة العربية وتتوافق تماماً مع الأنظمة والمتطلبات في المملكة العربية السعودية."
                }
            }]
        })
        
    if 'خطوات' in content or 'كيف تعمل' in content or 'آلية العمل' in content:
        schemas.append({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "آلية الاستفادة من الخدمة وتطبيقها",
            "step": [
                 {
                    "@type": "HowToStep",
                    "url": "https://brightai.com.sa#step1",
                    "name": "التحليل الاستراتيجي",
                    "text": "دراسة متطلبات العمل وتحليل الفجوات لبناء خطة ذكية مبنية على البيانات."
                 },
                 {
                    "@type": "HowToStep",
                    "url": "https://brightai.com.sa#step2",
                    "name": "تصميم وتطوير الحل",
                    "text": "تطوير النماذج البرمجية وأنظمة الذكاء الاصطناعي وتهيئتها للبيانات المستهدفة."
                 },
                 {
                    "@type": "HowToStep",
                    "url": "https://brightai.com.sa#step3",
                    "name": "الاعتماد والإطلاق",
                    "text": "تدريب الأنظمة وإطلاقها بشكل آمن ومراقبة الأداء."
                 }
            ]
        })
        
    script_str = "".join([f'<script type="application/ld+json">\n{json.dumps(s, ensure_ascii=False, indent=2)}\n</script>\n' for s in schemas])
    insert_before_head(path, script_str)

# 2. Sectors Pages
sectors = glob.glob(os.path.join(base_dir, "sectors", "*.html"))
for path in sectors:
    sector_name = os.path.basename(path).replace(".html", "")
    schemas = [
        {
            "@context": "https://schema.org",
            "@type": "Industry",
            "name": sector_name
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "الرئيسية",
                    "item": "https://brightai.com.sa/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "القطاعات",
                    "item": f"https://brightai.com.sa/sectors/{sector_name}.html"
                }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": f"حلول وتقنيات الذكاء الاصطناعي لقطاع {sector_name}",
            "provider": {
                "@type": "Organization",
                "name": "Bright AI"
            },
            "sameAs": [
                "https://brightai.com.sa/blogger/ai.html",
                "https://brightai.com.sa/blogger/big-data-analysis.html"
            ]
        }
    ]
    script_str = "".join([f'<script type="application/ld+json">\n{json.dumps(s, ensure_ascii=False, indent=2)}\n</script>\n' for s in schemas])
    insert_before_head(path, script_str)

# 3. Blog Articles
blog_articles = glob.glob(os.path.join(base_dir, "blogger", "*.html")) + glob.glob(os.path.join(base_dir, "blog", "*", "*.html"))
for path in blog_articles:
    if "index.html" in path and "blogger" not in path: 
        continue # skip main blog page here
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    word_count = len(re.sub(r'<[^>]+>', '', content).split())
    # Extract title from h1 if possible
    title_match = re.search(r'<h1[^>]*>(.*?)</h1\s*>', content, re.IGNORECASE | re.DOTALL)
    article_title = "مقال حول الذكاء الاصطناعي والتكنولوجيا"
    if title_match:
        article_title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()

    file_name = os.path.basename(path)

    schemas = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article_title,
            "author": {
                "@type": "Organization",
                "name": "Bright AI"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Bright AI",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://brightai.com.sa/assets/images/logo.png"
                }
            },
            "datePublished": "2024-01-01T08:00:00+03:00",
            "dateModified": datetime.now().strftime("%Y-%m-%dT%H:%M:%S+03:00"),
            "image": "https://brightai.com.sa/assets/images/blog-default.jpg",
            "wordCount": word_count,
            "articleSection": "الذكاء الاصطناعي وتحليل البيانات والأتمتة"
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "الرئيسية",
                    "item": "https://brightai.com.sa/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "المدونة",
                    "item": "https://brightai.com.sa/blog/index.html"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": article_title,
                    "item": f"https://brightai.com.sa/blogger/{file_name}"
                }
            ]
        }
    ]
    script_str = "".join([f'<script type="application/ld+json">\n{json.dumps(s, ensure_ascii=False, indent=2)}\n</script>\n' for s in schemas])
    insert_before_head(path, script_str)


# 4. Main Blog Page
blog_main = os.path.join(base_dir, "blog", "index.html")
if os.path.exists(blog_main):
    schemas = [
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "مدونة Bright AI - مقالات الذكاء الاصطناعي والأتمتة",
            "description": "أحدث المقالات حول تطبيقات ومستقبل الذكاء الاصطناعي في السعودية للمؤسسات والشركات لتسريع التحول الرقمي وتسخير البيانات للمستقبل."
        },
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "url": "https://brightai.com.sa/blogger/ai.html"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "url": "https://brightai.com.sa/blogger/big-data-analysis.html"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "url": "https://brightai.com.sa/blogger/process-automation.html"
                }
            ]
        }
    ]
    script_str = "".join([f'<script type="application/ld+json">\n{json.dumps(s, ensure_ascii=False, indent=2)}\n</script>\n' for s in schemas])
    insert_before_head(blog_main, script_str)

