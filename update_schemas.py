import os
import glob
import json
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re

base_path = '/Users/yzydalshmry/Desktop/BrightAI'

def save_html(soup, file_path):
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

def add_script_if_not_exists(soup, new_schema):
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            schema = json.loads(script.string)
            if hasattr(schema, 'get'):
                # Check for @type match or exact structure match
                if schema.get('@type') == new_schema.get('@type'):
                    # Check if it's the exact same type (like speakable or SiteNavigationElement)
                    if new_schema.get('@type') in ['SiteNavigationElement', 'SpeakableSpecification']:
                        script.string = json.dumps(new_schema, ensure_ascii=False, indent=2)
                        return
                    if new_schema.get('@type') == 'Article' and schema.get('@type') == 'Article':
                        script.string = json.dumps(new_schema, ensure_ascii=False, indent=2)
                        return
        except Exception:
            pass
    
    new_script = soup.new_tag('script', type='application/ld+json')
    new_script.string = '\n' + json.dumps(new_schema, ensure_ascii=False, indent=2) + '\n'
    if soup.head:
        soup.head.append(new_script)
    else:
        soup.append(new_script)

def update_home_page():
    index_path = os.path.join(base_path, 'index.html')
    if not os.path.exists(index_path):
        return
    with open(index_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # 1. SiteNavigationElement schema
    site_nav_schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {
                "@type": "SiteNavigationElement",
                "position": 1,
                "name": "الرئيسية",
                "url": "https://brightai.site/"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 2,
                "name": "خدمات الذكاء الاصطناعي",
                "url": "https://brightai.site/#services"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 3,
                "name": "حلول الأعمال",
                "url": "https://brightai.site/#solutions"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 4,
                "name": "المدونة",
                "url": "https://brightai.site/frontend/pages/blog/"
            }
        ]
    }
    
    add_script_if_not_exists(soup, site_nav_schema)

    # 2. SearchAction is already there, make sure it's valid
    # 3. Speakable Schema
    speakable_schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Bright AI - مُشرقة للذكاء الاصطناعي",
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": [".hero-title", ".hero-subtitle", ".service-title", ".faq-question"]
        },
        "url": "https://brightai.site/"
    }
    add_script_if_not_exists(soup, speakable_schema)

    save_html(soup, index_path)

def update_service_pages():
    service_dirs = ['frontend/pages/ai-agent', 'frontend/pages/ai-bots', 'frontend/pages/ai-workflows', 'frontend/pages/ai-scolecs']
    for sdir in service_dirs:
        dir_path = os.path.join(base_path, sdir)
        if not os.path.exists(dir_path):
            continue
        for root, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith('.html'):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        soup = BeautifulSoup(f.read(), 'html.parser')
                    
                    scripts = soup.find_all('script', type='application/ld+json')
                    for script in scripts:
                        try:
                            schema = json.loads(script.string)
                            if schema.get('@type') in ['Service', 'WebPage', 'LocalBusiness', 'ProfessionalService']:
                                # Add dateModified
                                schema['datePublished'] = schema.get('datePublished', '2025-01-01T08:00:00+03:00')
                                schema['dateModified'] = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+03:00')
                                
                                # Process VideoObject if exists video tag
                                video_tags = soup.find_all(['video', 'iframe'])
                                has_video = False
                                for v in video_tags:
                                    if v.name == 'video' or (v.name == 'iframe' and 'youtube' in v.get('src', '')):
                                        has_video = True
                                        break
                                
                                if has_video and 'video' not in schema:
                                    schema['video'] = {
                                        "@type": "VideoObject",
                                        "name": "شرح خدمات " + schema.get('name', 'Bright AI'),
                                        "description": "فيديو توضيحي لخدمات الذكاء الاصطناعي للشركات السعودية",
                                        "thumbnailUrl": "https://brightai.site/frontend/assets/images/video-thumbnail.jpg",
                                        "uploadDate": schema.get('datePublished')
                                    }
                                
                                # Process image schema
                                if 'image' not in schema:
                                    img = soup.find('img')
                                    img_url = "https://brightai.site/frontend/assets/images/service-default.jpg"
                                    if img and img.get('src'):
                                        img_src = img.get('src')
                                        if not img_src.startswith('http'):
                                            img_url = "https://brightai.site/" + img_src.lstrip('/')
                                        else:
                                            img_url = img_src
                                    schema['image'] = img_url
                                
                                script.string = '\n' + json.dumps(schema, ensure_ascii=False, indent=2) + '\n'
                        except Exception:
                            pass
                    
                    save_html(soup, file_path)

def generate_saudi_faq_schema():
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "كيف يمكن للذكاء الاصطناعي مساعدة الشركات في السعودية على تحقيق رؤية 2030؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "يساهم الذكاء الاصطناعي في تحسين كفاءة العمليات، تقليل التكاليف التشغيلية، وزيادة الأرباح من خلال تحليل البيانات بدقة. تعمل حلولنا على تمكين الشركات السعودية من تبني التقنيات الحديثة وأتمتة المهام اليومية، مما يدعم الأهداف الاستراتيجية للتحول الرقمي في المملكة ضمن رؤية 2030."
                }
            },
            {
                "@type": "Question",
                "name": "هل تدعم حلولكم متطلبات الأمن السيبراني في السعودية مثل NCA و NDMO؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم بالتأكيد، كافة حلول الذكاء الاصطناعي التي نقدمها تعتمد على استضافة محلية سيادية داخل المملكة العربية السعودية، مما يضمن التوافق التام مع ضوابط الهيئة الوطنية للأمن السيبراني (NCA) ومكتب إدارة البيانات الوطنية (NDMO). بياناتك آمنة ومحمية ولا تغادر حدود المملكة أبداً."
                }
            },
            {
                "@type": "Question",
                "name": "ما هي تكلفة تطوير وكيل ذكاء اصطناعي لخدمة العملاء في الرياض؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "تختلف التكلفة بناءً على التعقيد المطلوب وتكامل الأنظمة. نحن نقدم في Bright AI باقات مرنة تناسب الشركات الناشئة والمؤسسات الكبرى بدءًا من الباقات الأساسية وصولًا إلى الحلول المتخصصة للمؤسسات الكبيرة في الرياض وجدة وكافة أنحاء المملكة. يمكنك التواصل معنا للحصول على عرض سعر مخصص يلبي احتياجات مؤسستك الفعلية."
                }
            },
            {
                "@type": "Question",
                "name": "كيف يمكنني استخدام تحليل البيانات الضخمة لتحسين المبيعات في السوق السعودي؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "من خلال أدوات ذكاء الأعمال المدعومة بالذكاء الاصطناعي، يمكنك تحليل سلوكيات المستهلكين السعوديين واكتشاف الأنماط الخفية. تساعدك حلولنا على بناء لوحات تحكم تفاعلية تتوقع اتجاهات السوق، وتحسن من اتخاذ القرارات، مما يؤدي بصورة مباشرة إلى زيادة المبيعات وتعزيز تنافسية الشركة في السوق السعودي."
                }
            },
            {
                "@type": "Question",
                "name": "هل يمكن ربط أنظمتكم مع برامج إدارة الموارد (ERP) المعتمدة في الجهات الحكومية السعودية؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم، تمتلك حلولنا قدرات تكامل متقدمة عبر واجهات برمجة التطبيقات (APIs) الآمنة التي يمكن ربطها بكفاءة مع مختلف أنظمة إدارة الموارد البشرية والمالية (ERP) المتبعة في الجهات الحكومية والشركات الخاصة في السعودية. يضمن هذا الربط تدفق البيانات بسلاسة وأتمتة عمليات إدخال ومراجعة البيانات."
                }
            }
        ]
    }

def update_faq_pages():
    faq_dirs = [os.path.join(base_path, 'frontend', 'pages')]
    # also update index.html's faq
    index_path = os.path.join(base_path, 'index.html')
    # Update index.html
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
        faq_updated = False
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                schema = json.loads(script.string)
                if schema.get('@type') == 'FAQPage':
                    # Has already many questions, but just making sure
                    if len(schema.get('mainEntity', [])) < 5:
                        script.string = '\n' + json.dumps(generate_saudi_faq_schema(), ensure_ascii=False, indent=2) + '\n'
                    faq_updated = True
            except:
                pass
        if not faq_updated:
            # Maybe not needed if it doesn't have faq
            pass
        save_html(soup, index_path)

def update_blog_articles():
    blog_dirs = ['frontend/pages/blog', 'frontend/pages/blogger']
    for bdir in blog_dirs:
        dir_path = os.path.join(base_path, bdir)
        if not os.path.exists(dir_path):
            continue
        for root, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith('.html') and file != 'index.html':
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        soup = BeautifulSoup(f.read(), 'html.parser')
                    
                    title = soup.title.string if soup.title else ""
                    h1 = soup.find('h1')
                    headline = h1.get_text(strip=True) if h1 else title
                    
                    img = soup.find('img')
                    img_url = "https://brightai.site/frontend/assets/images/blog-default.jpg"
                    if img and img.get('src'):
                        img_src = img.get('src')
                        if not img_src.startswith('http'):
                            img_url = "https://brightai.site/" + img_src.lstrip('/')
                        else:
                            img_url = img_src
                            
                    text_content = soup.get_text(separator=' ', strip=True)
                    word_count = len(re.findall(r'\b\w+\b', text_content))
                    
                    article_schema = {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": headline,
                        "image": img_url,
                        "author": {
                            "@type": "Organization",
                            "name": "Bright AI",
                            "url": "https://brightai.site/"
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Bright AI",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://brightai.site/frontend/assets/images/Gemini.png"
                            }
                        },
                        "datePublished": "2025-01-01T08:00:00+03:00",
                        "dateModified": datetime.now().strftime('%Y-%m-%dT%H:%M:%S+03:00'),
                        "wordCount": word_count,
                        "inLanguage": "ar"
                    }
                    
                    # check url if needed
                    # replace existing article schema or add it
                    script_found = False
                    for script in soup.find_all('script', type='application/ld+json'):
                        try:
                            schema = json.loads(script.string)
                            if schema.get('@type') in ['Article', 'BlogPosting']:
                                schema.update(article_schema)
                                script.string = '\n' + json.dumps(schema, ensure_ascii=False, indent=2) + '\n'
                                script_found = True
                        except:
                            pass
                    
                    if not script_found:
                        new_script = soup.new_tag('script', type='application/ld+json')
                        new_script.string = '\n' + json.dumps(article_schema, ensure_ascii=False, indent=2) + '\n'
                        if soup.head:
                            soup.head.append(new_script)
                        else:
                            soup.append(new_script)
                            
                    save_html(soup, file_path)

if __name__ == '__main__':
    print("Updating home page...")
    update_home_page()
    print("Updating service pages...")
    update_service_pages()
    print("Updating FAQ pages...")
    update_faq_pages()
    print("Updating blog articles...")
    update_blog_articles()
    print("Schemas updated successfully.")
