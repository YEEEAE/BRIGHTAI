#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// تحديد المجلدات الرئيسية
const root = process.cwd();
const demoDir = path.join(root, "demo");
const outDir = path.join(root, "assets", "images", "og");

// التأكد من وجود مجلد الحفظ
fs.mkdirSync(outDir, { recursive: true });

// قراءة الشعار وتحويله إلى Base64 لضمان تحميله بشكل فوري ومستقر في المتصفح
const logoPath = path.join(root, "assets", "images", "logo-new.PNG");
let logoBase64 = "";
try {
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  }
} catch (err) {
  console.error("فشل قراءة ملف الشعار:", err);
}

// قائمة الديموهات المستهدفة ومسمياتها المخصصة للتوليد البصري الأنيق
const customDemoData = {
  "ai-consulting": {
    title: "استشارة ذكاء اصطناعي",
    desc: "حدد حالات الاستخدام ذات الأثر العالي وخارطة طريق للتحول الذكي لشركتك.",
    badge: "جرّب مجاناً"
  },
  "ai-scolecs": {
    title: "مختبر التعليم الذكي",
    desc: "بيئة تعليمية ذكية تفاعلية للمعلمين والطلاب والإدارة بأحدث تقنيات الذكاء الاصطناعي.",
    badge: "جرّب مجاناً"
  },
  "ai-tenders-analysis": {
    title: "تحليل المناقصات والعقود",
    desc: "حلل مخاطر وبنود المناقصات والعقود الرسمية خلال دقائق بدل أيام بدقة متناهية.",
    badge: "جرّب مجاناً"
  },
  "ai-workflows": {
    title: "صانع سير العمل الذكي",
    desc: "صمّم وابنِ سير عمل مؤتمت بالذكاء الاصطناعي بالكامل وبدون كتابة كود واحد.",
    badge: "جرّب مجاناً"
  },
  "approvals-automation": {
    title: "أتمتة الموافقات الذكية",
    desc: "سرّع إجراءات الموافقة والاعتمادات الداخلية لشركتك عبر فحص وتدقيق ذكي تلقائي.",
    badge: "جرّب مجاناً"
  },
  "brightproject": {
    title: "إدارة المشاريع الذكية",
    desc: "خطط، تتبع، ونفّذ مشاريع فريقك بكفاءة عالية وتنبؤات زمنية مدعومة بالذكاء الاصطناعي.",
    badge: "جرّب مجاناً"
  },
  "brightsales": {
    title: "منصة المبيعات الذكية",
    desc: "ضاعف مبيعاتك وتوقع الفرص والصفقات الرابحة مع أتمتة كاملة لدورة المبيعات.",
    badge: "جرّب مجاناً"
  },
  "competitor-analysis-agent": {
    title: "وكيل تحليل المنافسين",
    desc: "راقب حركة السوق وحلل استراتيجيات منافسيك على مدار الساعة بتقارير فورية.",
    badge: "جرّب مجاناً"
  },
  "custom-ai-agent": {
    title: "وكيل ذكاء اصطناعي مخصص",
    desc: "ابنِ وكيلك الذكي المخصص والمدرب بالكامل على بيانات وأنظمة شركتك الخاصة.",
    badge: "جرّب مجاناً"
  },
  "customer-service-automation": {
    title: "أتمتة خدمة العملاء",
    desc: "ردود فورية وحلول ذكية لعملاء شركتك عبر كافة القنوات والمنصات بلا انقطاع.",
    badge: "جرّب مجاناً"
  },
  "data-analysis": {
    title: "تحليل البيانات التنفيذي",
    desc: "حوّل بياناتك المعقدة إلى لوحات تحكم وقرارات تجارية واضحة وقابلة للقياس الفوري.",
    badge: "جرّب مجاناً"
  },
  "data-analyzer": {
    title: "ملعب تحليل البيانات",
    desc: "استخرج الأنماط، الإحصاءات، والتوقعات المستقبلية من ملفات بياناتك بعملية تفاعلية.",
    badge: "جرّج مجاناً"
  },
  "data-quality": {
    title: "فحص جودة البيانات",
    desc: "نظّف، دقّق، واكشف الأخطاء والثغرات في قواعد بياناتك لضمان موثوقية كاملة للقرارات.",
    badge: "جرّب مجاناً"
  },
  "hr-automation": {
    title: "أتمتة الموارد البشرية",
    desc: "سهّل عمليات التوظيف، التقييم، وإدارة شؤون الموظفين بذكاء وسرعة فائقة.",
    badge: "جرّب مجاناً"
  },
  "marketing-ai-agent": {
    title: "وكيل التسويق الذكي",
    desc: "صناعة محتوى تسويقي إبداعي وإدارة حملاتك الإعلانية بشكل مؤتمت وناجح.",
    badge: "جرّب مجاناً"
  },
  "marketing-automation": {
    title: "أتمتة الحملات التسويقية",
    desc: "أطلق وتابع حملاتك عبر البريد والشبكات الاجتماعية مع تحليلات ذكية ومعدل تحويل أعلى.",
    badge: "جرّب مجاناً"
  },
  "ocr-demo": {
    title: "ذكاء المستندات وفواتير زاتكا",
    desc: "استخرج البيانات بدقة متناهية من الفواتير والمستندات الورقية مع توافق ZATCA الكامل.",
    badge: "جرّب مجاناً"
  },
  "operational-reports-automation": {
    title: "أتمتة التقارير التشغيلية",
    desc: "ولّد تقارير الأداء التشغيلي الدوري لشركتك بشكل آلي وبدقة خالية من الأخطاء البشرية.",
    badge: "جرّب مجاناً"
  },
  "opportunity-discovery-agent": {
    title: "وكيل اكتشاف الفرص",
    desc: "حلل الفجوات السوقية واكتشف مجالات النمو والاستثمار الواعدة لشركتك تلقائياً.",
    badge: "جرّب مجاناً"
  },
  "pricing": {
    title: "مقدر تكلفة حلول الـ AI",
    desc: "احسب التكلفة التقديرية لبناء حلول الذكاء الاصطناعي المخصصة لمشروعك خلال ثوانٍ.",
    badge: "جرّب مجاناً"
  },
  "seo-ai-agent": {
    title: "وكيل SEO بالذكاء الاصطناعي",
    desc: "تصدر نتائج البحث الأولى في جوجل وحسن ظهور موقعك في السعودية بتقنيات ذكية متكاملة.",
    badge: "جرّب مجاناً"
  },
  "smart-automation": {
    title: "منظومة الأتمتة الذكية",
    desc: "اربط أنظمتك وأتمت عملياتك اليومية بالكامل من الطلب وحتى التنفيذ بدون تدخل يدوي.",
    badge: "جرّب مجاناً"
  },
  "smart-education-platform": {
    title: "المنصة التعليمية الذكية",
    desc: "تخصيص مسارات التعلم وتوليد المحتوى التعليمي والتقييمات للجهات الأكاديمية والتدريبية.",
    badge: "جرّب مجاناً"
  },
  "smart-hiring-system": {
    title: "نظام التوظيف الذكي",
    desc: "فرز السير الذاتية وتصنيف وتقييم المرشحين الأنسب لوظائفك بدقة وموضوعية تامة.",
    badge: "جرّب مجاناً"
  },
  "smart-hospital-management": {
    title: "إدارة المستشفيات الذكية",
    desc: "تنسيق العمليات التشغيلية للمرافق الطبية وإدارة سجلات المرضى والجدولة الذكية للعيادات.",
    badge: "جرّب مجاناً"
  },
  "smart-medical-archive": {
    title: "الأرشيف الطبي الذكي",
    desc: "أرشفة وتصنيف السجلات السريرية والتقارير الطبية بدقة وسرية متكاملة لفرق الرعاية الصحية.",
    badge: "جرّب مجاناً"
  },
  "social-data-analysis": {
    title: "تحليل شبكات التواصل",
    desc: "رصد انطباعات الجمهور وقياس مدى نجاح وتفاعل الحملات على وسائل التواصل الاجتماعي.",
    badge: "جرّب مجاناً"
  },
  "supply-chain-optimization": {
    title: "تحسين سلاسل التوريد",
    desc: "توقع مستويات الطلب وإدارة المخزون والخدمات اللوجستية بكفاءة استباقية ممتازة.",
    badge: "جرّب مجاناً"
  },
  "text-analysis": {
    title: "منصة تحليل النصوص",
    desc: "استخرج المشاعر، الكلمات المفتاحية، والملخصات الذكية من النصوص والمستندات الكبيرة.",
    badge: "جرّب مجاناً"
  }
};

// مسار متصفح جوجل كروم في ماك
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// قراءة مجلد الديمو ومسح الصفحات المتوفرة
const items = fs.readdirSync(demoDir);

console.log(`تم البدء في توليد صور OG مخصصة لصفحات الديمو...`);

for (const item of items) {
  const itemPath = path.join(demoDir, item);
  if (!fs.statSync(itemPath).isDirectory()) continue;

  const htmlPath = path.join(itemPath, "index.html");
  if (!fs.existsSync(htmlPath)) continue;

  // استخراج البيانات وتجهيزها
  const slug = item;
  let title = customDemoData[slug]?.title;
  let desc = customDemoData[slug]?.desc;
  const badgeText = customDemoData[slug]?.badge || "جرّب مجاناً";

  // إذا لم يكن الديمو مسجلاً في البيانات المخصصة، نحاول قراءة العنوان والوصف من الملف نفسه
  if (!title || !desc) {
    try {
      const content = fs.readFileSync(htmlPath, "utf8");
      
      if (!title) {
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].replace(/\s*\|\s*Bright\s*AI/gi, "").replace(/\s*\|\s*ContractAI/gi, "").replace(/جرّب\s+/g, "").trim();
        }
      }
      
      if (!desc) {
        const descMatch = content.match(/<meta\s+name="description"\s+content="(.*?)"/i) || content.match(/<meta\s+property="og:description"\s+content="(.*?)"/i);
        if (descMatch) {
          desc = descMatch[1].trim();
        }
      }
    } catch (e) {
      console.warn(`فشل قراءة البيانات تلقائياً للديمو ${slug}:`, e.message);
    }
  }

  // وضع قيم افتراضية آمنة في حال عدم التمكن من الحصول على العنوان والوصف
  title = title || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  desc = desc || "ديمو تفاعلي مميز ومبتكر مقدم من منصة Bright AI للشركات السعودية.";

  // تنسيق النص للوصف بحيث لا يكون طويلاً جداً في الصورة
  if (desc.length > 120) {
    desc = desc.substring(0, 117) + "...";
  }

  const outImageName = `demo-${slug}.png`;
  const outImagePath = path.join(outDir, outImageName);

  // تصميم ملف HTML مؤقت فخم وأنيق ومصمم بمقاس 1200×630 بدقة بصرية مذهلة
  const tempHtmlContent = `
<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      font-family: 'Cairo', sans-serif;
      background-color: #07111f;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      color: #ffffff;
      padding: 70px 80px;
    }
    /* خلفية تدرج لوني عميق وتوهج مستقبلي جذاب */
    .background-gradient {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 85% 20%, #173559 0%, #07111f 65%);
      z-index: 1;
    }
    /* تأثير الشبكة الرقمية الأنيق للذكاء الاصطناعي */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(201, 169, 97, 0.08) 1.5px, transparent 1.5px);
      background-size: 35px 35px;
      z-index: 2;
      opacity: 0.85;
    }
    /* خطوط وتوهجات فنية ناعمة */
    .glow-accent {
      position: absolute;
      bottom: -150px;
      left: -150px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(201, 169, 97, 0.06) 0%, transparent 70%);
      z-index: 3;
      pointer-events: none;
    }
    .glow-accent-2 {
      position: absolute;
      top: -100px;
      left: 30%;
      width: 600px;
      height: 400px;
      background: radial-gradient(circle, rgba(26, 58, 92, 0.4) 0%, transparent 80%);
      z-index: 3;
      pointer-events: none;
    }
    .container {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      width: 100%;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand img {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      border: 2px solid rgba(201, 169, 97, 0.3);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .brand-text {
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(135deg, #ffffff 0%, #d8e2ef 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 0.5px;
    }
    .badge {
      background: linear-gradient(135deg, #C9A961 0%, #D8BE78 100%);
      color: #07111f;
      font-size: 20px;
      font-weight: 800;
      padding: 10px 24px;
      border-radius: 30px;
      box-shadow: 0 8px 20px rgba(201, 169, 97, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .content-area {
      max-width: 900px;
      margin-top: auto;
      margin-bottom: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .eyebrow {
      font-size: 22px;
      font-weight: 700;
      color: #C9A961;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .eyebrow::after {
      content: "";
      display: inline-block;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, #C9A961, transparent);
    }
    .title {
      font-size: 66px;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .description {
      font-size: 26px;
      font-weight: 400;
      line-height: 1.6;
      color: #94a3b8;
      margin-top: 5px;
    }
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 25px;
      width: 100%;
    }
    .footer-info {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.4);
      font-weight: 600;
    }
    .footer-url {
      font-size: 20px;
      color: #C9A961;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="background-gradient"></div>
  <div class="grid-pattern"></div>
  <div class="glow-accent"></div>
  <div class="glow-accent-2"></div>
  <div class="container">
    <div class="header-row">
      <div class="brand">
        <img src="${logoBase64}" alt="Bright AI Logo">
        <span class="brand-text">Bright AI</span>
      </div>
      <div class="badge">${badgeText}</div>
    </div>
    
    <div class="content-area">
      <div class="eyebrow">ديمو تفاعلي</div>
      <h1 class="title">${title}</h1>
      <p class="description">${desc}</p>
    </div>
    
    <div class="footer-row">
      <div class="footer-info">منصة الذكاء الاصطناعي للشركات السعودية</div>
      <div class="footer-url">brightai.site</div>
    </div>
  </div>
</body>
</html>
  `.trim();

  // كتابة ملف HTML مؤقت لالتقاط لقطة الشاشة
  const tempHtmlPath = path.join(itemPath, "temp-og.html");
  fs.writeFileSync(tempHtmlPath, tempHtmlContent, "utf8");

  // تشغيل متصفح جوجل كروم في وضع Headless لأخذ لقطة شاشة وحفظها كملف PNG
  try {
    const command = `"${chromePath}" --headless --disable-gpu --screenshot="${outImagePath}" --window-size=1200,630 "file://${tempHtmlPath}"`;
    execSync(command, { stdio: "ignore" });
    console.log(`✓ تم توليد صورة OG للديمو [${slug}] بنجاح.`);
  } catch (err) {
    console.error(`✗ فشل توليد صورة OG للديمو [${slug}]:`, err.message);
  } finally {
    // إزالة ملف الـ HTML المؤقت للحفاظ على نظافة المجلد
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }

  // تحديث ملف index.html للإشارة إلى الصورة المخصصة وتعديل الـ og:image و twitter:image
  try {
    let htmlContent = fs.readFileSync(htmlPath, "utf8");

    // 1. تحديث أو إدراج og:image
    const ogImageRegex = /<meta\s+property="og:image"\s+content="[^"]*"/gi;
    if (ogImageRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(ogImageRegex, `<meta property="og:image" content="https://brightai.site/assets/images/og/demo-${slug}.png"`);
    } else {
      // إدراج الوسم في الهيد إذا لم يكن موجوداً
      htmlContent = htmlContent.replace(/<\/head>/i, `  <meta property="og:image" content="https://brightai.site/assets/images/og/demo-${slug}.png">\n</head>`);
    }

    // 2. تحديث أو إدراج og:image:width و og:image:height
    const ogWidthRegex = /<meta\s+property="og:image:width"\s+content="[^"]*"/gi;
    if (ogWidthRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(ogWidthRegex, `<meta property="og:image:width" content="1200"`);
    } else {
      htmlContent = htmlContent.replace(/<\/head>/i, `  <meta property="og:image:width" content="1200">\n</head>`);
    }

    const ogHeightRegex = /<meta\s+property="og:image:height"\s+content="[^"]*"/gi;
    if (ogHeightRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(ogHeightRegex, `<meta property="og:image:height" content="630"`);
    } else {
      htmlContent = htmlContent.replace(/<\/head>/i, `  <meta property="og:image:height" content="630">\n</head>`);
    }

    // 3. تحديث أو إدراج twitter:image
    const twitterImageRegex = /<meta\s+name="twitter:image"\s+content="[^"]*"/gi;
    if (twitterImageRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(twitterImageRegex, `<meta name="twitter:image" content="https://brightai.site/assets/images/og/demo-${slug}.png"`);
    } else {
      htmlContent = htmlContent.replace(/<\/head>/i, `  <meta name="twitter:image" content="https://brightai.site/assets/images/og/demo-${slug}.png">\n</head>`);
    }

    // 4. التأكد من أن twitter:card هي summary_large_image لجعل الصورة تظهر بحجمها الكامل والجميل
    const twitterCardRegex = /<meta\s+name="twitter:card"\s+content="[^"]*"/gi;
    if (twitterCardRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(twitterCardRegex, `<meta name="twitter:card" content="summary_large_image"`);
    } else {
      htmlContent = htmlContent.replace(/<\/head>/i, `  <meta name="twitter:card" content="summary_large_image">\n</head>`);
    }

    fs.writeFileSync(htmlPath, htmlContent, "utf8");
    console.log(`✓ تم تحديث وسوم الميتا لـ [${slug}] بنجاح.`);
  } catch (err) {
    console.error(`✗ فشل تحديث ملف HTML للديمو [${slug}]:`, err.message);
  }
}

console.log(`\nتم الانتهاء من توليد وتحديث كافة صور الـ OG المخصصة بنجاح!`);
