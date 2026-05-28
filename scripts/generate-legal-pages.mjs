import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const pagesData = {
  "privacy-policy": {
    titleAr: "سياسة الخصوصية | BrightAI",
    titleEn: "Privacy Policy | BrightAI",
    descAr: "سياسة خصوصية معتمدة وفق نظام حماية البيانات الشخصية السعودي (PDPL) واللوائح التنفيذية الصادرة عن سدايا (SDAIA).",
    descEn: "Official Privacy Policy compliant with Saudi Personal Data Protection Law (PDPL) and SDAIA regulations.",
    h1Ar: "سياسة الخصوصية",
    h1En: "Privacy Policy",
    subtitleAr: "وفق نظام حماية البيانات الشخصية السعودي (PDPL)",
    subtitleEn: "Pursuant to the Saudi Personal Data Protection Law (PDPL)",
    sectionsAr: [
      {
        title: "١. جمع البيانات الشخصية",
        content: "نحن نجمع البيانات الشخصية الضرورية فقط لتقديم خدماتنا الأمنية وحوكمة الذكاء الاصطناعي. ويشمل ذلك: الاسم الكامل، اسم المنشأة، البريد الإلكتروني، رقم الهاتف، والبيانات التقنية المتعلقة باستخدام النظام. يتم الحصول عليها إما مباشرة من ممثل المنشأة عند طلب ديمو أو للتسجيل في الخدمة."
      },
      {
        title: "٢. الغرض والأساس النظامي لمعالجة البيانات",
        content: "نقوم بمعالجة بياناتك لتقديم خدمات طبقة الأمان (AI Safety OS) والتحقق من التراخيص والامتثال للضوابط الأمنية. والأساس النظامي للمعالجة هو الموافقة الصريحة التي تقدمها عند استخدام المنصة، أو المصلحة المشروعة لشركتنا في تأمين خدماتنا وحماية بيئات العمل من التهديدات السيبرانية."
      },
      {
        title: "٣. حقوق صاحب البيانات الشخصية",
        content: "بموجب نظام حماية البيانات الشخصية السعودي (PDPL)، يحق لك: الحق في العلم والمعرفة بكيفية معالجة بياناتك، الحق في الوصول إليها وطلب نسخة منها، الحق في تصحيح وتحديث البيانات، والحق في طلب إتلافها إذا لم يعد هناك مسوغ نظامي للاحتفاظ بها، بالإضافة إلى سحب موافقتك على المعالجة في أي وقت."
      },
      {
        title: "٤. أمن البيانات وجدار الحماية (AI Firewall)",
        content: "نلتزم بأعلى معايير الأمن السيبراني لحماية بياناتك من الوصول غير المصرح به. نستخدم تقنية (PII Redaction) لإخفاء البيانات الحساسة تلقائياً وجدار حماية الذكاء الاصطناعي (AI Firewall)، بالإضافة إلى تشفير البيانات بالكامل أثناء النقل وحفظها في خوادم محلية آمنة داخل المملكة العربية السعودية (الرياض)."
      },
      {
        title: "٥. الاحتفاظ بالبيانات ومشاركتها",
        content: "نحتفظ ببياناتك الشخصية طوال فترة نشاط حسابك أو تقديم الخدمة، أو وفقاً للمتطلبات التنظيمية المعمول بها في المملكة العربية السعودية. لا نقوم ببيع أو تأجير أو مشاركة بياناتك الشخصية مع أي طرف ثالث خارج المنظومة إلا بموافقتك المسبقة أو بطلب رسمي من الجهات التنظيمية والقضائية المختصة."
      }
    ],
    sectionsEn: [
      {
        title: "1. Personal Data Collection",
        content: "We collect personal data necessary to provide AI safety and governance services. This includes: full name, company name, email, phone number, and technical usage metadata. Data is collected directly from you when requesting a demo or registering for the service."
      },
      {
        title: "2. Purpose and Legal Basis for Processing",
        content: "We process personal data to deliver the AI Safety OS, verify licenses, and monitor compliance. The legal bases for processing are your explicit consent given when using the platform, or our legitimate interest in securing our environments and protecting enterprise clients from cyber threats."
      },
      {
        title: "3. Data Subject Rights",
        content: "Under the Saudi Personal Data Protection Law (PDPL), you have the right to: be informed about how your data is processed, access your personal data and request a copy, rectify or update inaccurate data, request the destruction of data when there is no longer a legal basis to keep it, and withdraw your consent at any time."
      },
      {
        title: "4. Data Security and AI Firewall",
        content: "We adhere to the highest cybersecurity standards to protect your data. We deploy PII Redaction to automatically sanitize sensitive data and implement our proprietary AI Firewall. All data is encrypted in transit and stored in highly secure, localized servers within Riyadh, Kingdom of Saudi Arabia."
      },
      {
        title: "5. Data Retention and Sharing",
        content: "We retain personal data as long as your account is active, as necessary to provide our services, or to comply with Saudi regulatory requirements. We do not sell, rent, or share your personal data with third parties unless we have your explicit consent or are required by regulatory or judicial authorities."
      }
    ]
  },
  "terms": {
    titleAr: "شروط الخدمة | BrightAI",
    titleEn: "Terms of Service | BrightAI",
    descAr: "شروط وأحكام استخدام منصة برايت آي لحوكمة وأمان الذكاء الاصطناعي للشركات والمؤسسات السعودية.",
    descEn: "Terms and conditions governing the use of BrightAI enterprise platform for AI safety and governance.",
    h1Ar: "شروط الخدمة",
    h1En: "Terms of Service",
    subtitleAr: "أحكام الاستخدام والتعاقد لمنصتنا وحلولنا الذكية",
    subtitleEn: "Usage and licensing terms for our enterprise products",
    sectionsAr: [
      {
        title: "١. قبول الشروط والترخيص",
        content: "باستخدامك لمنصة BrightAI (نظام تشغيل أمان الذكاء الاصطناعي السعودي)، فإنك توافق التوافق التام على شروط الخدمة هذه. نمنح المنشآت ترخيصاً محدوداً، غير حصري، وغير قابل للتنازل عنه لاستخدام حلولنا وأدواتنا لحوكمة وتأمين عمليات الذكاء الاصطناعي داخل نطاق المنشأة الجغرافي والتقني المصرح به."
      },
      {
        title: "٢. التزامات ومسؤوليات المستخدم",
        content: "تلتزم المنشأة باستخدام الحلول وفقاً للأنظمة واللوائح المعمول بها في المملكة العربية السعودية، وعلى رأسها لوائح الأمن السيبراني للهيئة الوطنية (NCA) وهيئة البيانات والذكاء الاصطناعي (SDAIA). يمنع منعاً باتاً استغلال النظام في محاولة تجاوز الحواجز الأمنية أو محاكاة هجمات الحرمان من الخدمة أو عكس هندسة البرمجيات الكرنلية للشركة."
      },
      {
        title: "٣. حدود المسؤولية والضمانات",
        content: "نحن نقدم نظام (BrightAI OS) كطبقة أمان وحماية وحوكمة للذكاء الاصطناعي التوليدي والأنظمة الذكية. وعلى الرغم من عمل أنظمتنا بأعلى درجات الكفاءة والأمان، لا نتحمل المسؤولية القانونية المباشرة عن هلوسة النماذج أو الأخطاء الناجمة عن النماذج الخارجية المربوطة بالنظام (مثل نماذج LLM العامة)، وتتطلب كافة القرارات الحساسة موافقة الطبقة البشرية (Human Approval Layer) المدمجة لدينا."
      },
      {
        title: "٤. الملكية الفكرية لبرايت آي",
        content: "جميع الحقوق والرموز البرمجية والمصنفات والأنظمة والخوارزميات وجدران الحماية المطورة في منصة BrightAI وملحقاتها، هي ملكية فكرية حصرية لشركة برايت آي ومسجلة نظاماً بموجب القوانين السعودية والدولية لحماية الملكية الفكرية وحقوق براءات الاختراع."
      },
      {
        title: "٥. القانون الحاكم والنزاعات",
        content: "تخضع شروط الخدمة هذه وتفسر وفقاً للأنظمة والقوانين السارية في المملكة العربية السعودية. ويختص القضاء التجاري في مدينة الرياض بالنظر في أي نزاع قد ينشأ عن تفسير أو تنفيذ شروط هذا الاتفاق أو استخدام المنصة والخدمات."
      }
    ],
    sectionsEn: [
      {
        title: "1. Acceptance and Licensing",
        content: "By using BrightAI (Saudi AI Safety OS), you explicitly agree to these Terms of Service. We grant enterprise clients a limited, non-exclusive, non-transferable license to use our solutions and tools to secure and govern AI workflows within their authorized business environments."
      },
      {
        title: "2. User Obligations and Security",
        content: "Enterprise clients agree to use our systems in full compliance with the regulatory frameworks of the National Cybersecurity Authority (NCA) and the Saudi Data and AI Authority (SDAIA). Reverse engineering our proprietary kernel modules or exploiting systems to bypass cyber barriers is strictly prohibited."
      },
      {
        title: "3. Limitation of Liability",
        content: "While BrightAI provides a robust defense and safety layer, we cannot assume liability for hallucinations or errors generated by external LLM models integrated into the workflow. All high-risk autonomous decisions must be filtered through our Human Approval Layer to maintain absolute control."
      },
      {
        title: "4. Intellectual Property",
        content: "All proprietary source code, algorithms, firewall patterns, kernel structures, and methodologies developed by BrightAI are the exclusive intellectual property of BrightAI, protected by Saudi and international IP and patent laws."
      },
      {
        title: "5. Governing Law and Disputes",
        content: "These Terms of Service shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. The commercial courts of Riyadh shall have exclusive jurisdiction over any disputes arising from these terms or platform usage."
      }
    ]
  },
  "cookie-policy": {
    titleAr: "سياسة ملفات الارتباط | BrightAI",
    titleEn: "Cookie Policy | BrightAI",
    descAr: "سياسة ملفات تعريف الارتباط لمنصة BrightAI لتوضيح كيفية استخدام الكوكيز وإدارتها بما يتوافق مع الخصوصية.",
    descEn: "Cookie Policy explaining how we use and manage cookies on the BrightAI enterprise platform.",
    h1Ar: "سياسة ملفات الارتباط",
    h1En: "Cookie Policy",
    subtitleAr: "شرح شفاف لكيفية تحسين تجربة التصفح وحفظ إعدادات الأمان",
    subtitleEn: "Clear transparency on cookie management and security session storage",
    sectionsAr: [
      {
        title: "١. ما هي ملفات تعريف الارتباط (Cookies)؟",
        content: "ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارتك للموقع. تساعدنا هذه الملفات في التعرف على جهازك وحفظ تفضيلات التصفح وجعل جلستك الأمنية داخل لوحة تحكم النواة (Kernel Dashboard) آمنة وخالية من الاختراقات."
      },
      {
        title: "٢. أنواع ملفات الارتباط المستخدمة",
        content: "نحن نستخدم ثلاثة أنواع رئيسية: ١) ملفات الارتباط الضرورية: لتأمين جلسة تسجيل الدخول وتوثيق هويتك. ٢) ملفات الارتباط الوظيفية: لحفظ خيارات اللغة (العربية/الإنجليزية) وتفضيلات واجهة المستخدم التفاعلية. ٣) ملفات الارتباط التحليلية (جوجل أناليتكس): لفهم كيفية تصفح الموقع والتحسين الفني للموقع."
      },
      {
        title: "٣. إدارة الكوكيز وسحب الموافقة",
        content: "يمكنك التحكم في ملفات تعريف الارتباط أو رفضها بالكامل من خلال إعدادات متصفحك الخاص، أو من خلال شريط الموافقة الخاص بنا. يرجى العلم بأن تعطيل ملفات تعريف الارتباط الضرورية قد يعطل بعض الميزات الأمنية ويفصل جلسات العمل النشطة داخل لوحة التحكم."
      }
    ],
    sectionsEn: [
      {
        title: "1. What are Cookies?",
        content: "Cookies are small text files stored on your device when visiting a site. They help us recognize your hardware, save preferences, and maintain highly secure user sessions within our core Kernel Dashboard."
      },
      {
        title: "2. Types of Cookies Used",
        content: "We use three categories: 1) Essential Cookies: necessary for secure login sessions and multi-factor verification. 2) Functional Cookies: to store language preferences and UI theme configurations. 3) Analytical Cookies (Google Analytics): to understand visitor behavior and improve technical speed."
      },
      {
        title: "3. Cookie Management and Choice",
        content: "You can fully customize or block cookies through your browser settings or our consent banner. Please note that disabling essential cookies will directly degrade safety controls and disconnect active sessions on the dashboard."
      }
    ]
  },
  "pdpl-statement": {
    titleAr: "بيان الامتثال لـ PDPL | BrightAI",
    titleEn: "PDPL Compliance Statement | BrightAI",
    descAr: "بيان الامتثال الفعلي لنظام حماية البيانات الشخصية السعودي (PDPL) والتدابير الأمنية المعتمدة في منصتنا.",
    descEn: "Structural compliance statement aligning BrightAI systems with the Saudi PDPL regulations and SDAIA guidelines.",
    h1Ar: "بيان الامتثال لـ PDPL",
    h1En: "PDPL Compliance Statement",
    subtitleAr: "التزامنا الراسخ بالأنظمة السيادية السعودية للبيانات والذكاء الاصطناعي",
    subtitleEn: "Our rigid alignment with KSA sovereign data protection rules",
    sectionsAr: [
      {
        title: "١. حوكمة البيانات والامتثال لسدايا (SDAIA)",
        content: "تم تصميم بنية منصة BrightAI بالكامل لتكون متوافقة مع نظام حماية البيانات الشخصية (PDPL) الصادر عن هيئة البيانات والذكاء الاصطناعي سدايا. قمنا بتطوير لوحة امتثال خاصة تقوم بتتبع مسار البيانات، وتعيين مسؤول مستقل لحماية البيانات الشخصية (Data Protection Officer) لتلقي الاستفسارات وإجراء تقييمات الأثر الدورية لحماية البيانات."
      },
      {
        title: "٢. إخفاء الهوية تلقائياً وجدار الحماية (PII Redaction)",
        content: "يمثل جدار حماية الذكاء الاصطناعي لدينا (AI Firewall) خط الدفاع الأول للامتثال لـ PDPL؛ حيث يقوم بالتقاط أي نصوص أو مدخلات تحتوي على بيانات شخصية حساسة (مثل أرقام الهويات، السجلات الطبية، معلومات الحسابات البنكية) وإخفائها تلقائياً بعملية (Redaction) قبل وصولها للنماذج، مما يضمن أمانها التام من أي تسريب."
      },
      {
        title: "٣. توطين وسيادة البيانات بالكامل في الرياض",
        content: "نحن نؤمن بسيادة البيانات الوطنية. تلتزم BrightAI التزاماً كاملاً بتوطين كافة بيانات العملاء ومعالجتها محلياً داخل خوادمنا السحابية فائقة الأمان والمشفرة في مدينة الرياض بالمملكة العربية السعودية، دون إجراء أي عمليات نقل أو معالجة خارجية عابرة للحدود إلا بموافقات استثنائية وبموجب الضوابط التنظيمية الرسمية."
      }
    ],
    sectionsEn: [
      {
        title: "1. Data Governance and SDAIA Compliance",
        content: "BrightAI is architected from the ground up to comply with the Saudi Personal Data Protection Law (PDPL) regulated by SDAIA. We have built an active compliance module that maps data flows, and we maintain an appointed Data Protection Officer (DPO) to conduct impact assessments."
      },
      {
        title: "2. Autonomous PII Redaction and Protection",
        content: "Our AI Firewall acts as the primary tool for PDPL alignment. It actively intercepts all queries, dynamically parsing and redacting Personally Identifiable Information (PII) like Saudi National IDs, medical details, or banking coordinates, preventing exposure to LLMs."
      },
      {
        title: "3. 100% Localized Data Sovereignty in Riyadh",
        content: "We adhere strictly to Saudi national data sovereignty. BrightAI hosts and processes all client database records locally within our high-availability encrypted cloud server infrastructure in Riyadh, eliminating unauthorized cross-border transfers."
      }
    ]
  },
  "data-processing-agreement": {
    titleAr: "اتفاقية معالجة البيانات (DPA) | BrightAI",
    titleEn: "Data Processing Agreement | BrightAI",
    descAr: "اتفاقية معالجة البيانات المعيارية بين برايت آي كمعالج والعميل كمتحكم بالبيانات وفق الأنظمة واللوائح السعودية.",
    descEn: "Standard Data Processing Agreement defining controller-processor duties under Saudi PDPL regulations.",
    h1Ar: "اتفاقية معالجة البيانات (DPA)",
    h1En: "Data Processing Agreement (DPA)",
    subtitleAr: "العقد القانوني والتقني لتنظيم علاقة المعالجة والأمان المشترك",
    subtitleEn: "Legal contract governing controller-processor duties and security mandates",
    sectionsAr: [
      {
        title: "١. تعريفات وأطراف الاتفاقية",
        content: "تنظم هذه الاتفاقية العلاقة التعاقدية والأمنية بين الجهة أو المنشأة المستفيدة من الخدمة (المتحكم بالبيانات - Data Controller) وبين شركة BrightAI (معالج البيانات - Data Processor). وتسري هذه الاتفاقية تلقائياً كجزء لا يتجزأ من اتفاقية الاشتراك وتقديم الخدمات الرئيسية للمنصة."
      },
      {
        title: "٢. نطاق المعالجة وتوجيهات المتحكم",
        content: "يلتزم المعالج بالعمل حصراً بموجب التوجيهات الخطية والإعدادات التقنية المعتمدة من المتحكم بالبيانات. يقتصر نطاق المعالجة على توفير حلول الحوكمة وجدار الحماية وفحص المدخلات وتصدير ملفات الإثبات والتدقيق (Evidence Files) لحماية المنشأة، دون استخدام البيانات لأغراض التدريب الخاصة بنا أو أي أغراض تسويقية."
      },
      {
        title: "٣. الالتزام بالضوابط الأمنية والإخطار عن الحوادث",
        content: "يلتزم المعالج بتطبيق ضوابط أمن سيبراني صارمة تتوافق مع معايير الهيئة الوطنية للأمن السيبراني (NCA ECC) وشهادة آيزو 27001. وفي حال رصد أو الاشتباه بأي محاولة وصول غير مصرح بها أو تسريب بيانات، نلتزم بإخطار المتحكم فوراً وبمدة لا تتجاوز 72 ساعة، مع توفير كافة تفاصيل الحادثة وملف الأدلة الجنائي الفني للمساعدة في الاحتواء والتحقيق."
      }
    ],
    sectionsEn: [
      {
        title: "1. Parties and Structural Definitions",
        content: "This agreement defines the security and processing relationship between the enterprise client (Data Controller) and BrightAI (Data Processor). It forms an indivisible and binding part of the primary Master Subscription Agreement."
      },
      {
        title: "2. Scope of Processing and Guidelines",
        content: "The Processor commits to acting solely under the written instructions of the Data Controller. The processing scope is strictly confined to providing AI Firewall inspection, governance auditing, and compiling Evidence Files, without using client data for proprietary AI training."
      },
      {
        title: "3. Security Safeguards and Breach Notification",
        content: "The Processor deploys rigid technical and operational safeguards aligned with NCA ECC and ISO 27001 certifications. In the event of a detected security incident, the Processor will notify the Controller within 72 hours, delivering a forensic report and Evidence File to assist containment."
      }
    ]
  }
};

const navHtmlAr = `
<header role="banner" class="sticky top-0 z-50 backdrop-blur-xl bg-ink-900/70 border-b border-white/5">
  <nav role="navigation" aria-label="القائمة الرئيسية" class="max-w-7xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-between">
    <a href="/" class="flex items-center gap-3" aria-label="BrightAI الرئيسية">
      <div class="logo-box relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
        <img src="/frontend/images/logo-new.PNG" alt="شعار Bright AI" width="40" height="40" class="h-full w-full object-contain" decoding="async" fetchpriority="high">
      </div>
      <span class="font-extrabold text-xl tracking-tight">Bright<span class="gradient-text">AI</span></span>
      <span class="hidden md:inline text-xs text-white/50 border-r border-white/10 pr-3 mr-1">Saudi AI Safety</span>
    </a>

    <ul class="hidden lg:flex items-center gap-7 text-sm text-white/80">
      <li><a href="/#product" class="hover:text-white transition-colors">المنتج</a></li>
      <li><a href="/#layers" class="hover:text-white transition-colors">طبقات الأمان</a></li>
      <li><a href="/#compliance" class="hover:text-white transition-colors">حزم الامتثال</a></li>
      <li><a href="/#sectors" class="hover:text-white transition-colors">القطاعات</a></li>
      <li><a href="/#evidence" class="hover:text-white transition-colors">Evidence File</a></li>
      <li><a href="/#faq" class="hover:text-white transition-colors">أسئلة شائعة</a></li>
      <li><a href="/kernel/" class="hover:text-brand-300 transition-colors"><i class="fa-solid fa-microchip ml-1"></i>لوحة النواة</a></li>
    </ul>

    <div class="flex items-center gap-2">
      <a href="https://wa.me/966538229013" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold wa-btn text-white" aria-label="تواصل معنا عبر واتساب">
        <i class="fa-brands fa-whatsapp text-lg"></i> تواصل معنا
      </a>
      <a href="/#demo" class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold glow-btn text-white">
        <i class="fa-solid fa-play"></i> اطلب ديمو
      </a>
    </div>
  </nav>
</header>
`;

const navHtmlEn = `
<header role="banner" class="sticky top-0 z-50 backdrop-blur-xl bg-ink-900/70 border-b border-white/5">
  <nav role="navigation" aria-label="Main Navigation" class="max-w-7xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-between">
    <a href="/" class="flex items-center gap-3" aria-label="BrightAI Home">
      <div class="logo-box relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
        <img src="/frontend/images/logo-new.PNG" alt="Bright AI Logo" width="40" height="40" class="h-full w-full object-contain" decoding="async" fetchpriority="high">
      </div>
      <span class="font-extrabold text-xl tracking-tight">Bright<span class="gradient-text">AI</span></span>
      <span class="hidden md:inline text-xs text-white/50 border-l border-white/10 pl-3 ml-1">Saudi AI Safety</span>
    </a>

    <ul class="hidden lg:flex items-center gap-7 text-sm text-white/80">
      <li><a href="/#product" class="hover:text-white transition-colors">Product</a></li>
      <li><a href="/#layers" class="hover:text-white transition-colors">Safety Layers</a></li>
      <li><a href="/#compliance" class="hover:text-white transition-colors">Compliance Packs</a></li>
      <li><a href="/#sectors" class="hover:text-white transition-colors">Sectors</a></li>
      <li><a href="/#evidence" class="hover:text-white transition-colors">Evidence File</a></li>
      <li><a href="/#faq" class="hover:text-white transition-colors">FAQ</a></li>
      <li><a href="/kernel/" class="hover:text-brand-300 transition-colors"><i class="fa-solid fa-microchip mr-1"></i>Kernel OS</a></li>
    </ul>

    <div class="flex items-center gap-2">
      <a href="https://wa.me/966538229013" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold wa-btn text-white" aria-label="Contact us via WhatsApp">
        <i class="fa-brands fa-whatsapp text-lg"></i> Contact Us
      </a>
      <a href="/#demo" class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold glow-btn text-white">
        <i class="fa-solid fa-play"></i> Request Demo
      </a>
    </div>
  </nav>
</header>
`;

const footerHtmlAr = `
<footer role="contentinfo" class="border-t border-white/5 bg-ink-900/60 mt-20">
  <div class="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
    <div>
      <a href="/" class="flex items-center gap-3" aria-label="BrightAI">
        <span class="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500">
          <i class="fa-solid fa-shield-halved text-white"></i>
        </span>
        <span class="font-extrabold text-xl">Bright<span class="gradient-text">Trust</span></span>
      </a>
      <p class="mt-4 text-sm text-white/60 leading-loose">طبقة الأمان والحوكمة للذكاء الاصطناعي في الشركات السعودية. صُنع في الرياض 🇸🇦.</p>
    </div>

    <nav aria-label="روابط سريعة">
      <h3 class="font-bold mb-3">المنتج</h3>
      <ul class="space-y-2 text-sm text-white/60">
        <li><a href="/#layers" class="hover:text-white">AI Firewall</a></li>
        <li><a href="/#layers" class="hover:text-white">AI Audit Trail</a></li>
        <li><a href="/#layers" class="hover:text-white">Human Approval</a></li>
        <li><a href="/#evidence" class="hover:text-white">Evidence File</a></li>
      </ul>
    </nav>

    <nav aria-label="روابط الامتثال">
      <h3 class="font-bold mb-3">الوثائق القانونية</h3>
      <ul class="space-y-2 text-sm text-white/60">
        <li><a href="/privacy-policy/" class="hover:text-white">سياسة الخصوصية</a></li>
        <li><a href="/terms/" class="hover:text-white">شروط الخدمة</a></li>
        <li><a href="/cookie-policy/" class="hover:text-white">سياسة ملفات الارتباط</a></li>
        <li><a href="/pdpl-statement/" class="hover:text-white">بيان امتثال PDPL</a></li>
        <li><a href="/data-processing-agreement/" class="hover:text-white">اتفاقية معالجة البيانات</a></li>
      </ul>
    </nav>

    <div>
      <h3 class="font-bold mb-3">تواصل</h3>
      <ul class="space-y-2 text-sm text-white/60">
        <li><a href="https://wa.me/966538229013" target="_blank" rel="noopener noreferrer" class="hover:text-green-400"><i class="fa-brands fa-whatsapp text-green-400"></i> واتساب: 053-822-9013</a></li>
        <li><i class="fa-solid fa-envelope text-brand-500"></i> hello@brightai.site</li>
        <li><i class="fa-solid fa-location-dot text-brand-500"></i> الرياض، المملكة العربية السعودية</li>
      </ul>
    </div>
  </div>

  <div class="border-t border-white/5 py-5 text-center text-xs text-white/40">
    © 2026 BrightAI · Saudi AI Safety OS · جميع الحقوق محفوظة · صُنع في المملكة العربية السعودية 🇸🇦
  </div>
</footer>
`;

const footerHtmlEn = `
<footer role="contentinfo" class="border-t border-white/5 bg-ink-900/60 mt-20">
  <div class="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
    <div>
      <a href="/" class="flex items-center gap-3" aria-label="BrightAI">
        <span class="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500">
          <i class="fa-solid fa-shield-halved text-white"></i>
        </span>
        <span class="font-extrabold text-xl">Bright<span class="gradient-text">Trust</span></span>
      </a>
      <p class="mt-4 text-sm text-white/60 leading-loose">The safety and governance layer for AI in Saudi enterprises. Made in Riyadh 🇸🇦.</p>
    </div>

    <nav aria-label="Quick Links">
      <h3 class="font-bold mb-3">Product</h3>
      <ul class="space-y-2 text-sm text-white/60">
        <li><a href="/#layers" class="hover:text-white">AI Firewall</a></li>
        <li><a href="/#layers" class="hover:text-white">AI Audit Trail</a></li>
        <li><a href="/#layers" class="hover:text-white">Human Approval</a></li>
        <li><a href="/#evidence" class="hover:text-white">Evidence File</a></li>
      </ul>
    </nav>

    <nav aria-label="Legal Documents">
      <h3 class="font-bold mb-3">Legal</h3>
      <ul class="space-y-2 text-sm text-white/60">
        <li><a href="/en/privacy-policy/" class="hover:text-white">Privacy Policy</a></li>
        <li><a href="/en/terms/" class="hover:text-white">Terms of Service</a></li>
        <li><a href="/en/cookie-policy/" class="hover:text-white">Cookie Policy</a></li>
        <li><a href="/en/pdpl-statement/" class="hover:text-white">PDPL Statement</a></li>
        <li><a href="/en/data-processing-agreement/" class="hover:text-white">Data Processing Agreement</a></li>
      </ul>
    </nav>

    <div>
      <h3 class="font-bold mb-3">Contact</h3>
      <ul class="space-y-2 text-sm text-white/60">
        <li><a href="https://wa.me/966538229013" target="_blank" rel="noopener noreferrer" class="hover:text-green-400"><i class="fa-brands fa-whatsapp text-green-400"></i> WhatsApp: 053-822-9013</a></li>
        <li><i class="fa-solid fa-envelope text-brand-500"></i> hello@brightai.site</li>
        <li><i class="fa-solid fa-location-dot text-brand-500"></i> Riyadh, Kingdom of Saudi Arabia</li>
      </ul>
    </div>
  </div>

  <div class="border-t border-white/5 py-5 text-center text-xs text-white/40">
    © 2026 BrightAI · Saudi AI Safety OS · All Rights Reserved · Made in the Kingdom of Saudi Arabia 🇸🇦
  </div>
</footer>
`;

function buildPageHtml(key, isEnglish) {
  const data = pagesData[key];
  const lang = isEnglish ? "en" : "ar-SA";
  const dir = isEnglish ? "ltr" : "rtl";
  const title = isEnglish ? data.titleEn : data.titleAr;
  const desc = isEnglish ? data.descEn : data.descAr;
  const h1 = isEnglish ? data.h1En : data.h1Ar;
  const subtitle = isEnglish ? data.subtitleEn : data.subtitleAr;
  const sections = isEnglish ? data.sectionsEn : data.sectionsAr;

  const canonical = isEnglish ? `${BASE_URL}/en/${key}/` : `${BASE_URL}/${key}/`;
  const counterpart = isEnglish ? `${BASE_URL}/${key}/` : `${BASE_URL}/en/${key}/`;
  
  const nav = isEnglish ? navHtmlEn : navHtmlAr;
  const footer = isEnglish ? footerHtmlEn : footerHtmlAr;
  
  const sectionsHtml = sections.map((sec, i) => `
    <article class="glass rounded-2xl p-6 lg:p-8" id="sec-${i+1}">
      <h2 class="text-xl lg:text-2xl font-bold gradient-text mb-4">${xmlEscape(sec.title)}</h2>
      <p class="text-white/80 leading-loose text-sm lg:text-base">${xmlEscape(sec.content)}</p>
    </article>
  `).join("\n");

  const sidebarItems = sections.map((sec, i) => `
    <li>
      <a href="#sec-${i+1}" class="block py-2 px-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
        ${xmlEscape(sec.title.split(".")[0].split(" ")[0] || "")} ${xmlEscape(sec.title.split(" ").slice(1).join(" ").slice(0, 24))}...
      </a>
    </li>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#0b1220" />
  
  <title>${xmlEscape(title)}</title>
  <meta name="description" content="${xmlEscape(desc)}" />
  <meta name="robots" content="index, follow" />
  
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="${isEnglish ? 'ar-SA' : 'en-SA'}" href="${counterpart}" />
  <link rel="alternate" hreflang="${isEnglish ? 'ar' : 'en'}" href="${counterpart}" />
  <link rel="alternate" hreflang="${isEnglish ? 'en-SA' : 'ar-SA'}" href="${canonical}" />
  <link rel="alternate" hreflang="${isEnglish ? 'en' : 'ar'}" href="${canonical}" />
  <link rel="alternate" hreflang="x-default" href="${isEnglish ? counterpart : canonical}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${xmlEscape(title)}" />
  <meta property="og:description" content="${xmlEscape(desc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${BASE_URL}/frontend/images/logo-new.PNG" />
  <meta property="og:site_name" content="BrightAI – Saudi AI Safety OS" />
  <meta property="og:locale" content="${isEnglish ? 'en_US' : 'ar_SA'}" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${xmlEscape(title)}" />
  <meta name="twitter:description" content="${xmlEscape(desc)}" />
  <meta name="twitter:image" content="${BASE_URL}/frontend/images/logo-new.PNG" />

  <!-- Preloads -->
  <link rel="preload" href="/frontend/fonts/alfont_com_TheYearofTheCamel-ExtraLight.otf" as="font" type="font/otf" crossorigin />
  
  <!-- Stylesheets -->
  <link rel="stylesheet" href="/frontend/css/tailwind.local.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <link rel="stylesheet" href="/frontend/css/sitewide-modernization.css" />
  
  <style>
    @font-face {
      font-family: 'YearOfTheCamel';
      src: url('/frontend/fonts/alfont_com_TheYearofTheCamel-ExtraLight.otf') format('opentype');
      font-weight: 200;
      font-style: normal;
      font-display: swap;
    }
    h1, h2, .camel-font {
      font-family: 'YearOfTheCamel', 'Tajawal', sans-serif !important;
    }
    body {
      background: #060914;
      color: #e6edf7;
    }
    .bg-grid {
      background-image:
        radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,.18), transparent 60%),
        radial-gradient(ellipse 60% 50% at 90% 20%, rgba(124,92,255,.18), transparent 60%),
        linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
      background-size: auto, auto, 42px 42px, 42px 42px;
      background-color: #060914;
    }
    .glass {
      background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01));
      border: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(10px);
    }
    .gradient-text {
      background: linear-gradient(135deg, #00d4ff 0%, #7c5cff 50%, #ff5ca7 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .wa-btn {
      background: linear-gradient(135deg,#25D366,#128C7E);
    }
    .glow-btn {
      background: linear-gradient(135deg,#00d4ff,#7c5cff);
    }
  </style>
</head>
<body class="bg-grid">

${nav}

<main class="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
  <!-- Hero Section -->
  <div class="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
    <span class="chip inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-brand-300">
      ${isEnglish ? 'KSA PDPL Compliance Pack' : 'حقيبة الامتثال لنظام البيانات السعودي'}
    </span>
    <h1 class="mt-4 text-3xl sm:text-5xl font-black leading-tight gradient-text">${xmlEscape(h1)}</h1>
    <p class="mt-4 text-white/70 text-base lg:text-lg leading-relaxed">${xmlEscape(subtitle)}</p>
  </div>

  <div class="grid lg:grid-cols-12 gap-8 items-start">
    <!-- Sidebar -->
    <aside class="lg:col-span-4 sticky top-28 hidden lg:block">
      <div class="glass rounded-3xl p-6">
        <h3 class="font-bold text-lg mb-4 text-brand-300">${isEnglish ? 'Legal Sections' : 'أقسام الوثيقة'}</h3>
        <nav aria-label="Document sections navigation">
          <ul class="space-y-1">
            ${sidebarItems}
          </ul>
        </nav>
      </div>
    </aside>

    <!-- Content -->
    <section class="lg:col-span-8 space-y-6">
      ${sectionsHtml}
    </section>
  </div>
</main>

${footer}

</body>
</html>`;
}

async function writePage(key, isEnglish) {
  const pageHtml = buildPageHtml(key, isEnglish);
  const dirPath = isEnglish ? path.join(ROOT, "en", key) : path.join(ROOT, key);
  const filePath = path.join(dirPath, "index.html");
  
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, pageHtml, "utf8");
  console.log(`- تم تصدير الصفحة: ${isEnglish ? 'en/' : ''}${key}/index.html`);
}

async function main() {
  console.log("=== بدء توليد وتصدير الصفحات القانونية لـ PDPL ===");
  const keys = Object.keys(pagesData);
  for (const key of keys) {
    await writePage(key, false); // العربية
    await writePage(key, true);  // الإنجليزية
  }
  console.log("✓ تم بنجاح توليد كافة الصفحات القانونية العشر!");
  console.log("=========================================\n");
}

main().catch(error => {
  console.error("فشل غير متوقع في توليد الصفحات القانونية:", error);
  process.exit(1);
});
