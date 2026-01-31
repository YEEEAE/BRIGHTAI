document.addEventListener('DOMContentLoaded', function () {
    // Organization + WebSite are in index.html head (static for crawlers)
    const schemas = [
        // LocalBusiness Schema
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://brightai.site/#localbusiness",
            "name": "Bright AI - مُشرقة للذكاء الاصطناعي",
            "image": "https://brightai.site/Gemini.png",
            "url": "https://brightai.site",
            "telephone": "+966538229013",
            "priceRange": "$$$$",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "الرياض",
                "addressLocality": "الرياض",
                "addressRegion": "منطقة الرياض",
                "postalCode": "12345",
                "addressCountry": "SA"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": 24.7136,
                "longitude": 46.6753
            },
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
                    "opens": "09:00",
                    "closes": "18:00"
                }
            ],
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "50"
            }
        },
        // Service Schema - AI Solutions
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": "https://brightai.site/#ai-solutions",
            "name": "حلول الذكاء الاصطناعي المؤسسية",
            "alternateName": "Enterprise AI Solutions",
            "description": "حلول ذكاء اصطناعي مؤسسية مصممة للشركات الكبرى والجهات الحكومية السعودية مع استضافة محلية وامتثال كامل",
            "provider": {
                "@type": "Organization",
                "name": "Bright AI",
                "url": "https://brightai.site"
            },
            "areaServed": {
                "@type": "Country",
                "name": "Saudi Arabia"
            },
            "serviceType": "Enterprise AI Solutions",
            "category": "Technology Services"
        },
        // Service Schema - Digital Transformation Consulting
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": "https://brightai.site/#consulting",
            "name": "استشارات التحول الرقمي",
            "alternateName": "Digital Transformation Consulting",
            "description": "استشارات استراتيجية للتحول الرقمي وتطبيق حلول الذكاء الاصطناعي في المؤسسات السعودية",
            "provider": {
                "@type": "Organization",
                "name": "Bright AI",
                "url": "https://brightai.site"
            },
            "areaServed": {
                "@type": "Country",
                "name": "Saudi Arabia"
            },
            "serviceType": "Consulting",
            "category": "Business Consulting"
        },
        // Service Schema - Data Analytics
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": "https://brightai.site/#data-analytics",
            "name": "تحليل البيانات المتقدم",
            "alternateName": "Advanced Data Analytics",
            "description": "خدمات تحليل البيانات المتقدمة باستخدام الذكاء الاصطناعي لاستخراج رؤى قابلة للتنفيذ",
            "provider": {
                "@type": "Organization",
                "name": "Bright AI",
                "url": "https://brightai.site"
            },
            "areaServed": {
                "@type": "Country",
                "name": "Saudi Arabia"
            },
            "serviceType": "Data Analytics",
            "category": "Technology Services"
        },
        // Service Schema - Process Automation
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": "https://brightai.site/#automation",
            "name": "الأتمتة الذكية",
            "alternateName": "Intelligent Process Automation",
            "description": "أتمتة العمليات المؤسسية باستخدام الذكاء الاصطناعي لتحسين الكفاءة وتقليل التكاليف",
            "provider": {
                "@type": "Organization",
                "name": "Bright AI",
                "url": "https://brightai.site"
            },
            "areaServed": {
                "@type": "Country",
                "name": "Saudi Arabia"
            },
            "serviceType": "Process Automation",
            "category": "Technology Services"
        },
        // BreadcrumbList Schema
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "الرئيسية",
                    "item": "https://brightai.site/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "خدمات الذكاء الاصطناعي",
                    "item": "https://brightai.site/#services"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": "القطاعات المستهدفة",
                    "item": "https://brightai.site/#industries"
                }
            ]
        },
        // Course Schema
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "دليل الذكاء الاصطناعي للمؤسسات السعودية",
            "description": "تعلم كيفية تطبيق حلول الذكاء الاصطناعي في مؤسستك مع Bright AI - من التقييم إلى التنفيذ",
            "provider": {
                "@type": "Organization",
                "name": "Bright AI",
                "sameAs": "https://brightai.site"
            },
            "educationalLevel": "مؤسسي",
            "inLanguage": "ar",
            "availableLanguage": ["ar", "en"],
            "teaches": [
                "تقييم احتياجات الذكاء الاصطناعي",
                "تصميم حلول الذكاء الاصطناعي المؤسسية",
                "تنفيذ ونشر الأنظمة الذكية",
                "الامتثال لمعايير NCA و NDMO"
            ]
        },
        // HowTo Schema
        {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "كيفية تطبيق الذكاء الاصطناعي في مؤسستك",
            "description": "دليل شامل لتطبيق حلول الذكاء الاصطناعي في المؤسسات السعودية",
            "image": "https://brightai.site/Gemini.png",
            "totalTime": "PT3M",
            "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "SAR",
                "value": "0"
            },
            "step": [
                {
                    "@type": "HowToStep",
                    "position": 1,
                    "name": "التقييم",
                    "text": "تحليل الوضع الراهن وتحديد الفرص والتحديات في مؤسستك",
                    "url": "https://brightai.site/#assessment"
                },
                {
                    "@type": "HowToStep",
                    "position": 2,
                    "name": "التصميم",
                    "text": "بناء الحل المناسب لاحتياجاتك مع ضمان الامتثال للمعايير السعودية",
                    "url": "https://brightai.site/#design"
                },
                {
                    "@type": "HowToStep",
                    "position": 3,
                    "name": "التنفيذ",
                    "text": "تطوير ونشر الحل بمعايير عالية مع استضافة محلية",
                    "url": "https://brightai.site/#implementation"
                },
                {
                    "@type": "HowToStep",
                    "position": 4,
                    "name": "التحسين",
                    "text": "مراقبة وتحسين مستمر للأداء مع دعم فني متواصل",
                    "url": "https://brightai.site/#optimization"
                }
            ]
        },
        // ProfessionalService Schema
        {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Bright AI - خدمات الذكاء الاصطناعي المؤسسية",
            "alternateName": "مُشرقة للذكاء الاصطناعي",
            "url": "https://brightai.site",
            "logo": "https://brightai.site/Gemini.png",
            "image": "https://brightai.site/Gemini.png",
            "description": "شركة سعودية رائدة في حلول الذكاء الاصطناعي المؤسسية للشركات الكبرى والجهات الحكومية",
            "priceRange": "$$$$",
            "telephone": "+966538229013",
            "email": "yazeed1job@gmail.com",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "الرياض",
                "addressLocality": "الرياض",
                "addressRegion": "منطقة الرياض",
                "postalCode": "12345",
                "addressCountry": "SA"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": 24.7136,
                "longitude": 46.6753
            },
            "areaServed": {
                "@type": "Country",
                "name": "Saudi Arabia"
            },
            "serviceType": [
                "ذكاء الأعمال",
                "تحليل البيانات",
                "الذكاء الاصطناعي كخدمة",
                "أتمتة ذكية",
                "استشارات الذكاء الاصطناعي",
                "التحول الرقمي",
                "معالجة اللغات الطبيعية",
                "الرؤية الحاسوبية",
                "التعلم الآلي"
            ],
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "خدمات الذكاء الاصطناعي",
                "itemListElement": [
                    {
                        "@type": "OfferCatalog",
                        "name": "حلول الذكاء الاصطناعي المؤسسية",
                        "itemListElement": [
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "الابتكار الكامل",
                                    "description": "بناء أنظمة ذكية من الصفر"
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "التطوير المخصص",
                                    "description": "تطوير الأنظمة الحالية بالذكاء الاصطناعي"
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "AIaaS للمنشآت",
                                    "description": "خدمات ذكاء اصطناعي مُدارة"
                                }
                            }
                        ]
                    },
                    {
                        "@type": "OfferCatalog",
                        "name": "استشارات التحول الرقمي",
                        "itemListElement": [
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "تقييم النضج الرقمي",
                                    "description": "تحليل الوضع الراهن وتحديد الفرص"
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "استراتيجية التحول",
                                    "description": "بناء خارطة طريق التحول الرقمي"
                                }
                            }
                        ]
                    }
                ]
            },
            "knowsAbout": [
                "الذكاء الاصطناعي في السعودية",
                "ذكاء الأعمال وتحليل البيانات",
                "التحول الرقمي الحكومي",
                "الأتمتة الذكية",
                "معايير NCA",
                "معايير NDMO",
                "رؤية 2030"
            ],
            "slogan": "نضيء مستقبل أعمالك مع الذكاء الاصطناعي"
        },
        // FAQ Schema
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "ما هي خدمات Bright AI للذكاء الاصطناعي المؤسسي؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نقدم في Bright AI حلول ذكاء اصطناعي مؤسسية شاملة تشمل: الابتكار الكامل (بناء أنظمة ذكية من الصفر)، التطوير المخصص (تطوير الأنظمة الحالية بالذكاء الاصطناعي)، AIaaS للمنشآت (خدمات مُدارة)، استشارات التحول الرقمي، وتحليل البيانات المتقدم."
                    }
                },
                {
                    "@type": "Question",
                    "name": "هل بيانات العملاء تُستضاف داخل المملكة العربية السعودية؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نعم، نلتزم بالسيادة الرقمية حيث تُدار وتُستضاف جميع بيانات العملاء داخل حدود المملكة العربية السعودية، مع الامتثال الكامل لمعايير الهيئة الوطنية للأمن السيبراني (NCA) ومكتب إدارة البيانات الوطنية (NDMO)."
                    }
                },
                {
                    "@type": "Question",
                    "name": "ما هي أفضل أدوات ذكاء الأعمال (BI) في السعودية؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نستخدم ونوصي بأدوات عالمية رائدة مثل Microsoft Power BI و Tableau و Looker، نظراً لدعمها الممتاز للغة العربية ومرونتها العالية في التكامل مع الأنظمة المحلية."
                    }
                },
                {
                    "@type": "Question",
                    "name": "كيف أختار برنامج ذكاء الأعمال المناسب لشركتي؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "يعتمد الاختيار على حجم البيانات، الميزانية، والأنظمة الحالية لديكم. نحن نقدم خدمة استشارية لتقييم بنيتكم التحتية وترشيح الأداة الأنسب التي تحقق أعلى عائد على الاستثمار."
                    }
                },
                {
                    "@type": "Question",
                    "name": "ما هي الأدوات الذكية المناسبة لإدارة الشركات الصغيرة؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "ننصح بأدوات الأتمتة منخفضة الكود (Low-Code) التي تسمح بربط التطبيقات المختلفة وأتمتة المهام الروتينية (مثل الفوترة، وجدولة المواعيد) بتكلفة معقولة."
                    }
                },
                {
                    "@type": "Question",
                    "name": "ما هي القطاعات التي تخدمها Bright AI؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نخدم مجموعة واسعة من القطاعات تشمل: قطاع التجزئة (تحليل سلوك العملاء وتحسين المخزون)، القطاع الصناعي (الصيانة التنبؤية ومراقبة الجودة)، قطاع الرعاية الصحية (التشخيص الذكي وإدارة الموارد)، والجهات الحكومية (أتمتة الخدمات وتحليل البيانات)."
                    }
                },
                {
                    "@type": "Question",
                    "name": "كيف يمكنني طلب استشارة تنفيذية من Bright AI؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "يمكنك طلب استشارة تنفيذية مجانية من خلال التواصل معنا عبر واتساب على الرقم +966538229013، أو من خلال زر 'طلب استشارة تنفيذية' الموجود في الموقع. سيقوم فريقنا بالتواصل معك لفهم احتياجاتك وتقديم الحلول المناسبة."
                    }
                },
                {
                    "@type": "Question",
                    "name": "هل Bright AI متوافقة مع معايير الأمن السيبراني السعودية؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نعم، نحن ملتزمون بالامتثال الكامل لمعايير الهيئة الوطنية للأمن السيبراني (NCA) ومكتب إدارة البيانات الوطنية (NDMO)، مما يجعلنا الشريك المثالي للجهات الحكومية والشركات الكبرى التي تتطلب أعلى معايير الأمان والحوكمة."
                    }
                }
            ]
        }
    ];

    schemas.forEach(data => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
    });
});
