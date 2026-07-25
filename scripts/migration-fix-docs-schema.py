#!/usr/bin/env python3
"""
fix-docs-schema.py
إصلاح JSON-LD لجميع صفحات docs الفرعية:
- حذف الـ graph المكرر
- تصحيح @id وurl وBreadcrumb وFAQ لكل صفحة
"""

import re
import json
import os

BASE = "https://brightai.site"

# ========================
# إعدادات كل صفحة
# ========================
PAGES = {
    "docs/ai-firewall": {
        "slug": "docs/ai-firewall",
        "name": "وثائق AI Firewall | BrightAI",
        "description": "وثيقة AI Firewall من BrightAI لحماية البيانات الحساسة قبل وصولها إلى نماذج الذكاء الاصطناعي.",
        "breadcrumb_label": "AI Firewall",
        "faq": [
            {
                "@type": "Question",
                "name": "هل يحذف البيانات دائمًا؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ليس دائمًا. السلوك يعتمد على السياسة: تنقية، منع، أو تصعيد."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/ai-audit-trail": {
        "slug": "docs/ai-audit-trail",
        "name": "وثائق AI Audit Trail | BrightAI",
        "description": "وثيقة AI Audit Trail من BrightAI لتوثيق كل طلب وقرار وموافقة في منظومة الذكاء الاصطناعي.",
        "breadcrumb_label": "AI Audit Trail",
        "faq": [
            {
                "@type": "Question",
                "name": "هل يمكن حذف سجلات التدقيق؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "لا. السجلات محمية للقراءة فقط لضمان النزاهة والامتثال."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/ai-evidence-file": {
        "slug": "docs/ai-evidence-file",
        "name": "وثائق AI Evidence File | BrightAI",
        "description": "وثيقة AI Evidence File من BrightAI لحفظ الأدلة الرقمية لقرارات الذكاء الاصطناعي.",
        "breadcrumb_label": "AI Evidence File",
        "faq": [
            {
                "@type": "Question",
                "name": "هل الأدلة قابلة للتصدير؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم. يمكن تصدير ملفات الأدلة بصيغ متعددة للمدققين والجهات الرقابية."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/ai-governance-platform": {
        "slug": "docs/ai-governance-platform",
        "name": "وثائق منصة حوكمة الذكاء الاصطناعي | BrightAI",
        "description": "وثيقة منصة حوكمة الذكاء الاصطناعي من BrightAI لإدارة السياسات والامتثال والمخاطر.",
        "breadcrumb_label": "AI Governance Platform",
        "faq": [
            {
                "@type": "Question",
                "name": "هل المنصة متوافقة مع PDPL؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم. المنصة مصممة خصيصًا لمتطلبات PDPL والأنظمة السعودية."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/human-approval-layer": {
        "slug": "docs/human-approval-layer",
        "name": "وثائق Human Approval Layer | BrightAI",
        "description": "وثيقة Human Approval Layer من BrightAI لإدخال الإنسان في حلقة قرارات الذكاء الاصطناعي عالية المخاطر.",
        "breadcrumb_label": "Human Approval Layer",
        "faq": [
            {
                "@type": "Question",
                "name": "متى يُشغَّل مسار الموافقة البشرية؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "عند تجاوز عتبة المخاطرة أو عند طلب قرار يؤثر على بيانات حساسة أو عمليات حرجة."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/pdpl-ai-governance": {
        "slug": "docs/pdpl-ai-governance",
        "name": "حوكمة الذكاء الاصطناعي وفق PDPL | BrightAI",
        "description": "دليل حوكمة الذكاء الاصطناعي وفق نظام حماية البيانات الشخصية PDPL من BrightAI.",
        "breadcrumb_label": "PDPL AI Governance",
        "faq": [
            {
                "@type": "Question",
                "name": "هل PDPL يشمل أنظمة الذكاء الاصطناعي؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم. أي نظام يعالج بيانات شخصية سعودية بما في ذلك نماذج الذكاء الاصطناعي يخضع لـ PDPL."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/nca-ecc-ai-governance": {
        "slug": "docs/nca-ecc-ai-governance",
        "name": "حوكمة الذكاء الاصطناعي وفق NCA ECC | BrightAI",
        "description": "دليل حوكمة الذكاء الاصطناعي وفق ضوابط الأمن السيبراني NCA ECC من BrightAI.",
        "breadcrumb_label": "NCA ECC AI Governance",
        "faq": [
            {
                "@type": "Question",
                "name": "ما علاقة NCA ECC بالذكاء الاصطناعي؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ضوابط NCA ECC تشمل الأنظمة الرقمية بما فيها منصات الذكاء الاصطناعي المستخدمة في الجهات الحكومية والحيوية."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/ai-risk-management": {
        "slug": "docs/ai-risk-management",
        "name": "وثائق إدارة مخاطر الذكاء الاصطناعي | BrightAI",
        "description": "دليل إدارة مخاطر الذكاء الاصطناعي من BrightAI وفق أطر NIST AI RMF والأنظمة السعودية.",
        "breadcrumb_label": "AI Risk Management",
        "faq": [
            {
                "@type": "Question",
                "name": "هل يتوافق النظام مع NIST AI RMF؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "نعم. BrightAI مبني على مبادئ NIST AI RMF مع تكييف للسياق السعودي."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/ai-audit-readiness": {
        "slug": "docs/ai-audit-readiness",
        "name": "وثائق الجاهزية للتدقيق AI | BrightAI",
        "description": "دليل الجاهزية للتدقيق على أنظمة الذكاء الاصطناعي من BrightAI للتحضير للمراجعات الرقابية.",
        "breadcrumb_label": "AI Audit Readiness",
        "faq": [
            {
                "@type": "Question",
                "name": "كم يستغرق التحضير للتدقيق؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "مع BrightAI يمكن تقليص وقت التحضير من أشهر إلى أسابيع بفضل الأتمتة والتوثيق المستمر."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
    "docs/ai-governance-saudi-arabia": {
        "slug": "docs/ai-governance-saudi-arabia",
        "name": "حوكمة الذكاء الاصطناعي في السعودية | BrightAI",
        "description": "دليل حوكمة الذكاء الاصطناعي في المملكة العربية السعودية من BrightAI وفق رؤية 2030 والأنظمة المحلية.",
        "breadcrumb_label": "حوكمة الذكاء الاصطناعي في السعودية",
        "faq": [
            {
                "@type": "Question",
                "name": "ما الأطر التنظيمية المعتمدة للذكاء الاصطناعي في السعودية؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "تشمل الأطر الرئيسية: PDPL، NCA ECC، إطار حوكمة SDAIA، ومبادرات رؤية 2030 للتحول الرقمي."
                }
            },
            {
                "@type": "Question",
                "name": "تنبيه امتثال",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."
                }
            }
        ]
    },
}


def build_clean_graph(slug, name, description, breadcrumb_label, faq):
    """بناء JSON-LD graph موحد ونظيف للصفحة."""
    page_url = f"{BASE}/{slug}/"
    
    graph = [
        {
            "@type": ["Organization", "LocalBusiness"],
            "@id": f"{BASE}/#organization",
            "name": "Bright AI",
            "url": BASE,
            "logo": f"{BASE}/assets/images/logo.png",
            "areaServed": "SA",
            "sameAs": []
        },
        {
            "@type": "WebSite",
            "@id": f"{BASE}/#website",
            "url": BASE,
            "name": "Bright AI",
            "publisher": {"@id": f"{BASE}/#organization"},
            "inLanguage": ["ar-SA"]
        },
        {
            "@type": "WebPage",
            "@id": f"{BASE}/{slug}/#webpage",
            "url": page_url,
            "name": name,
            "description": description,
            "isPartOf": {"@id": f"{BASE}/#website"},
            "about": {"@id": f"{BASE}/#organization"},
            "inLanguage": "ar-SA"
        },
        {
            "@type": "BreadcrumbList",
            "@id": f"{BASE}/{slug}/#breadcrumb",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "الرئيسية",
                    "item": f"{BASE}/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "الوثائق",
                    "item": f"{BASE}/docs/"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": breadcrumb_label,
                    "item": page_url
                }
            ]
        },
        {
            "@type": "FAQPage",
            "@id": f"{BASE}/{slug}/#faq",
            "url": page_url,
            "inLanguage": "ar-SA",
            "mainEntity": faq
        }
    ]
    
    return {
        "@context": "https://schema.org",
        "@graph": graph
    }


def fix_html(content, slug, name, description, breadcrumb_label, faq):
    """إزالة جميع JSON-LD القديمة وحقن graph واحد نظيف."""
    
    # بناء الـ JSON-LD الجديد
    clean_schema = build_clean_graph(slug, name, description, breadcrumb_label, faq)
    schema_json = json.dumps(clean_schema, ensure_ascii=False, indent=2)
    new_script = f'  <script id="brightai-page-schema" type="application/ld+json">\n{schema_json}\n  </script>'
    
    # حذف كل script type="application/ld+json" سواء كانت لها id أو لا
    pattern = r'<script(?:[^>]*?)type="application/ld\+json"(?:[^>]*)>.*?</script>'
    content_clean = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # تنظيف السطور الفارغة الزائدة
    content_clean = re.sub(r'\n{3,}', '\n\n', content_clean)
    
    # حقن الـ schema الجديد قبل </head>
    content_clean = content_clean.replace('</head>', f'{new_script}\n</head>', 1)
    
    return content_clean


# ========================
# التنفيذ
# ========================
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

results = []
for rel_path, cfg in PAGES.items():
    file_path = os.path.join(base_dir, rel_path, "index.html")
    
    if not os.path.exists(file_path):
        results.append(f"  ❌ لا يوجد: {file_path}")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        original = f.read()
    
    fixed = fix_html(
        original,
        cfg["slug"],
        cfg["name"],
        cfg["description"],
        cfg["breadcrumb_label"],
        cfg["faq"]
    )
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(fixed)
    
    results.append(f"  ✅ تم إصلاح: {rel_path}/index.html")

print("\n📋 نتائج الإصلاح:")
for r in results:
    print(r)
print("\n✅ اكتمل الإصلاح")
