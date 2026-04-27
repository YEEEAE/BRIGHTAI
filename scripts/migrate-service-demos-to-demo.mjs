import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const site = "https://brightai.site";
const today = "2026-04-28";

const demos = [
  {
    slug: "ai-scolecs",
    serviceName: "نظام منصة تعليمية متكاملة ذكية",
    oldAppUrl: "/ai-scolecs/",
    demoLabel: "جرّب ديمو المنصة التعليمية",
  },
  {
    slug: "ai-tenders-analysis",
    serviceName: "نظام تحليل المناقصات بالذكاء الاصطناعي",
    oldAppUrl: "/tenders/",
    demoLabel: "جرّب ديمو تحليل المناقصات",
  },
  {
    slug: "brightproject",
    serviceName: "BrightProject - إدارة المشاريع الذكي",
    oldAppUrl: "/ai-bots/BrightProject/",
    demoLabel: "جرّب ديمو BrightProject",
  },
  {
    slug: "brightsales",
    serviceName: "BrightSales - روبوت المبيعات الذكي",
    oldAppUrl: "/ai-bots/BrightSales/",
    demoLabel: "جرّب ديمو BrightSales",
  },
  {
    slug: "smart-hospital-management",
    serviceName: "نظام إدارة المستشفيات الذكية",
    oldAppUrl: "/health/",
    demoLabel: "جرّب ديمو إدارة المستشفيات",
  },
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceAll(input, from, to) {
  return input.split(from).join(to);
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function addDemoBackLink(html, slug) {
  if (html.includes(`href="/services/${slug}/"`)) return html;
  const block = `<li><a href="/services/${slug}/">صفحة الخدمة الرسمية</a></li>`;
  return html.replace(
    /(<li><a href="\/services\/">كل خدمات الذكاء الاصطناعي من Bright AI<\/a><\/li>)/,
    `$1\n        ${block}`
  );
}

function normalizeDemoHtml(html, item) {
  const serviceUrl = `${site}/services/${item.slug}/`;
  const demoUrl = `${site}/demo/${item.slug}/`;
  let next = html;

  next = replaceAll(next, serviceUrl, demoUrl);
  next = replaceAll(next, `href="/services/${item.slug}/"`, `href="/demo/${item.slug}/"`);
  next = next.replace(/<title>(?!ديمو )([^<]+)<\/title>/, "<title>ديمو $1</title>");
  next = next.replace(
    /(<meta name="description" content=")([^"]+)(")/,
    `$1ديمو تفاعلي: $2$3`
  );
  next = next.replace(
    /"@type"\s*:\s*"Service"/,
    '"@type":"SoftwareApplication"'
  );
  next = next.replace(
    /"serviceType"\s*:\s*"([^"]+)"/,
    '"applicationCategory":"BusinessApplication"'
  );
  next = next.replace(
    /"potentialAction"\s*:\s*\{"@type":"ViewAction","name":"([^"]+)","target":"([^"]+)"\}/,
    `"potentialAction":{"@type":"UseAction","name":"${item.demoLabel}","target":"${demoUrl}"}`
  );
  next = addDemoBackLink(next, item.slug);
  next = next.replace(
    /(<main class="bai-live-demo">)/,
    `$1\n    <p class="bai-demo-eyebrow"><a href="/services/${item.slug}/">العودة إلى صفحة الخدمة</a></p>`
  );
  return next;
}

function moveDemoFile(item) {
  const source = join(root, "services", item.slug, "index.html");
  const target = join(root, "demo", item.slug, "index.html");
  ensureDir(dirname(target));

  if (existsSync(source)) {
    renameSync(source, target);
  }

  if (!existsSync(target)) return;
  const html = readFileSync(target, "utf8");
  writeFileSync(target, normalizeDemoHtml(html, item));
}

function updateServicesIndex() {
  const path = join(root, "services/index.html");
  if (!existsSync(path)) return;
  let html = readFileSync(path, "utf8");

  for (const item of demos) {
    const serviceUrl = `${site}/services/${item.slug}/`;
    const demoUrl = `${site}/demo/${item.slug}/`;
    html = replaceAll(html, `"demoUrl":"${item.oldAppUrl}"`, `"demoUrl":"${demoUrl}"`);
    html = replaceAll(html, `"demoUrl":"${serviceUrl}"`, `"demoUrl":"${demoUrl}"`);
    html = replaceAll(html, `"demoUrl":"https://brightai.site${item.oldAppUrl}"`, `"demoUrl":"${demoUrl}"`);
    html = replaceAll(html, `"demoUrl":"https://brightai.site${item.oldAppUrl.replace(/\/$/, "")}/"`, `"demoUrl":"${demoUrl}"`);
  }

  const demoBlock = `<article class="answer-list-card">
                        <h3>ديموهات الخدمات</h3>
                        <ul>
                            ${demos.map((item) => `<li><a href="/demo/${item.slug}/"><strong>${item.demoLabel}</strong><span>نموذج تجريبي منفصل عن صفحة الخدمة الرسمية.</span></a></li>`).join("\n                            ")}
                        </ul>
                    </article>`;

  if (!html.includes("<h3>ديموهات الخدمات</h3>")) {
    html = html.replace(
      /(<article class="answer-list-card">\s*<h3>استكشف حلول Bright AI حسب احتياجك<\/h3>[\s\S]*?<\/article>)/,
      `$1\n                    ${demoBlock}`
    );
  }

  writeFileSync(path, html);
}

function updateServicePages() {
  for (const item of demos) {
    const servicePath = join(root, "services", `${item.slug}.html`);
    if (!existsSync(servicePath)) continue;
    let html = readFileSync(servicePath, "utf8");
    const demoUrl = `/demo/${item.slug}/`;

    html = replaceAll(html, `href="${item.oldAppUrl}"`, `href="${demoUrl}"`);
    html = replaceAll(html, `target":"https://brightai.site${item.oldAppUrl}"`, `target":"${site}${demoUrl}"`);
    html = replaceAll(html, `target":"${site}${item.oldAppUrl}"`, `target":"${site}${demoUrl}"`);

    if (!html.includes(`href="/demo/${item.slug}/"`)) {
      html = html.replace(
        /(<div class="hero-actions">)/,
        `$1\n            <a class="btn btn-soft" href="/demo/${item.slug}/">${item.demoLabel}</a>`
      );
    }

    writeFileSync(servicePath, html);
  }
}

function updateSitemap() {
  const path = join(root, "sitemap.xml");
  if (!existsSync(path)) return;
  let xml = readFileSync(path, "utf8");

  const blocks = [];
  for (const item of demos) {
    const loc = `${site}/demo/${item.slug}/`;
    if (!xml.includes(`<loc>${loc}</loc>`)) {
      blocks.push(`  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="ar-SA" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
  </url>`);
    }
  }

  if (blocks.length) {
    xml = xml.replace("\n</urlset>", `\n${blocks.join("\n")}\n</urlset>`);
  }

  writeFileSync(path, xml);
}

for (const item of demos) moveDemoFile(item);
updateServicesIndex();
updateServicePages();
updateSitemap();
