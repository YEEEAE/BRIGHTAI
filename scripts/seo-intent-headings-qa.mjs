import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const site = "https://brightai.site";
const reportsDir = path.join(root, "reports");
const indexablePath = path.join(reportsDir, "indexable-pages-final.txt");
const outputPath = path.join(reportsDir, "seo-intent-headings-qa-report.md");
const forbiddenSchema = new Set(["FAQPage", "HowTo", "SpecialAnnouncement", "VehicleListing", "ClaimReview"]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (["node_modules", ".git", ".next", "dist", "build", "coverage", "venv", "render-public"].includes(name)) continue;
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) walk(abs, out);
    else if (name.endsWith(".html")) out.push(abs);
  }
  return out;
}

function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function routeFromUrl(url) {
  return new URL(url).pathname;
}

function rel(file) {
  return path.relative(root, file);
}

function routeToFile(route) {
  const candidates = route === "/"
    ? ["index.html"]
    : [`${decodeURIComponent(route).replace(/^\/|\/$/g, "")}/index.html`, `${decodeURIComponent(route).replace(/^\/|\/$/g, "")}.html`];
  for (const candidate of candidates) {
    const abs = path.join(root, candidate);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function schemaTypes(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((item) => schemaTypes(item, out));
    return out;
  }
  if (value["@type"]) out.push(...(Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]]));
  if (value["@graph"]) schemaTypes(value["@graph"], out);
  return out;
}

function hasEarlyRedirect(html) {
  return /location\.(href|replace|assign)\s*\(/i.test(html) || /<meta[^>]+http-equiv=["']refresh/i.test(html);
}

function hasLocalStorageGate(html) {
  return /localStorage\.(getItem|setItem)[\s\S]{0,300}(redirect|location|auth|login|token)/i.test(html);
}

function main() {
  fs.mkdirSync(reportsDir, { recursive: true });
  const indexableUrls = new Set(fs.readFileSync(indexablePath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  const canonicalToFile = new Map();
  for (const file of walk(root)) {
    const $ = cheerio.load(fs.readFileSync(file, "utf8"), { decodeEntities: false });
    const canonical = $("link[rel='canonical']").attr("href");
    if (canonical) canonicalToFile.set(canonical, file);
  }

  const issues = [];
  const h1Map = new Map();
  const intentKeywordMap = new Map();
  const moneyLinks = new Map();

  for (const url of indexableUrls) {
    const route = routeFromUrl(url);
    const file = canonicalToFile.get(url) || routeToFile(route);
    if (!file) {
      issues.push(["CRITICAL", url, "لا يوجد ملف مطابق للصفحة القابلة للفهرسة."]);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const $ = cheerio.load(html, { decodeEntities: false });
    const fileRel = rel(file);
    const canonical = $("link[rel='canonical']").attr("href") || "";
    const robots = clean($("meta[name='robots']").attr("content")).toLowerCase();
    const intent = $("meta[name='seo:intent']").attr("content") || "";
    const keyword = $("meta[name='seo:primary_keyword']").attr("content") || "";
    const h1s = $("h1").map((_, el) => clean($(el).text())).get();
    const h2s = $("h2").map((_, el) => clean($(el).text())).get();
    const headings = $("h1,h2,h3").map((_, el) => ({ tag: el.tagName.toLowerCase(), text: clean($(el).text()) })).get();
    const links = $("a[href]").map((_, el) => $(el).attr("href")).get();

    if (!intent) issues.push(["CRITICAL", fileRel, "الصفحة القابلة للفهرسة لا تحتوي meta seo:intent."]);
    if (!keyword) issues.push(["CRITICAL", fileRel, "الصفحة القابلة للفهرسة لا تحتوي meta seo:primary_keyword."]);
    if (h1s.length !== 1) issues.push(["CRITICAL", fileRel, `عدد H1 يجب أن يكون 1، الحالي ${h1s.length}.`]);
    if (h1s.some((h) => !h) || h2s.some((h) => !h) || headings.some((h) => !h.text)) issues.push(["HIGH", fileRel, "يوجد عنوان H1/H2/H3 فارغ."]);
    if (!h2s.length && !route.startsWith("/docs/")) issues.push(["HIGH", fileRel, "لا توجد H2 على صفحة مهمة."]);
    if (canonical !== url) issues.push(["CRITICAL", fileRel, `canonical لا يطابق URL النهائي: ${canonical || "مفقود"}.`]);
    if (!canonical.startsWith(site) || canonical.includes(".html") || canonical.includes("/index.html") || canonical.startsWith("http://")) issues.push(["HIGH", fileRel, `canonical غير نظيف: ${canonical || "مفقود"}.`]);
    if (robots.includes("noindex")) issues.push(["CRITICAL", fileRel, "صفحة مهمة تحمل noindex."]);
    if (!$("[data-seo-intent-answer='true']").length) issues.push(["HIGH", fileRel, "لا توجد answer block معتمدة."]);
    if (!$("script[type='application/ld+json']").length) issues.push(["MEDIUM", fileRel, "لا توجد JSON-LD."]);

    const firstH2Index = headings.findIndex((h) => h.tag === "h2");
    const firstH3Index = headings.findIndex((h) => h.tag === "h3");
    if (firstH3Index !== -1 && (firstH2Index === -1 || firstH3Index < firstH2Index)) issues.push(["MEDIUM", fileRel, "يوجد H3 قبل أول H2."]);

    for (const [i, node] of $("script[type='application/ld+json']").toArray().entries()) {
      try {
        const parsed = JSON.parse($(node).contents().text());
        const bad = schemaTypes(parsed).filter((type) => forbiddenSchema.has(type));
        if (bad.length) issues.push(["CRITICAL", fileRel, `schema ممنوع: ${bad.join(", ")}.`]);
      } catch (error) {
        issues.push(["HIGH", fileRel, `JSON-LD غير صالح في السكربت رقم ${i + 1}: ${error.message}`]);
      }
    }

    for (const href of links) {
      if (/^https?:\/\/localhost/i.test(href) || /^http:\/\/brightai\.site/i.test(href) || href.includes("/frontend/pages/") || href.endsWith(".html") || href.includes("/index.html")) {
        issues.push(["MEDIUM", fileRel, `رابط داخلي غير نظيف: ${href}`]);
      }
    }

    if (route.includes("/blog/") && !links.some((href) => ["/services/", "/ai-agent/", "/smart-automation/", "/data-analysis/", "/tenders/", "/consultation/", "/demo/smart-hiring-system/", "/smart-medical-archive/"].includes(href))) {
      issues.push(["HIGH", fileRel, "مقال المدونة لا يربط إلى money page واضحة."]);
    }

    if (route.includes("/tenders/")) {
      if (hasEarlyRedirect(html)) issues.push(["CRITICAL", fileRel, "صفحة tender عامة تحتوي redirect قبل المحتوى."]);
      if (hasLocalStorageGate(html)) issues.push(["CRITICAL", fileRel, "صفحة tender عامة قد تكون مخفية خلف localStorage/auth gate."]);
    }

    if (h1s[0]) h1Map.set(h1s[0], [...(h1Map.get(h1s[0]) || []), fileRel]);
    if (keyword && intent) {
      const key = `${keyword}::${intent}`;
      intentKeywordMap.set(key, [...(intentKeywordMap.get(key) || []), fileRel]);
    }
    for (const href of links) {
      if (["/services/", "/ai-agent/", "/smart-automation/", "/data-analysis/", "/tenders/", "/consultation/", "/contact/"].includes(href)) {
        moneyLinks.set(href, (moneyLinks.get(href) || 0) + 1);
      }
    }
  }

  for (const [h1, files] of h1Map.entries()) {
    if (files.length > 1) issues.push(["HIGH", h1, `H1 مكرر في صفحات عامة: ${files.join(", ")}`]);
  }
  for (const [key, files] of intentKeywordMap.entries()) {
    const nonSupport = files.filter((file) => !file.includes("/blog/") && !file.includes("/docs/"));
    if (nonSupport.length > 1) issues.push(["HIGH", key, `أكثر من صفحة ranking تستخدم نفس keyword + intent: ${nonSupport.join(", ")}`]);
  }
  for (const page of ["/services/", "/ai-agent/", "/smart-automation/", "/data-analysis/", "/tenders/", "/consultation/"]) {
    if ((moneyLinks.get(page) || 0) < 5) issues.push(["MEDIUM", page, `صفحة money page تستقبل أقل من 5 روابط سياقية: ${moneyLinks.get(page) || 0}.`]);
  }
  const llmsPath = path.join(root, "llms.txt");
  if (!fs.existsSync(llmsPath)) issues.push(["CRITICAL", "llms.txt", "ملف llms.txt غير موجود."]);
  else {
    const llms = fs.readFileSync(llmsPath, "utf8");
    for (const page of ["/", "/services/", "/ai-agent/", "/data-analysis/", "/tenders/", "/consultation/", "/contact/"]) {
      if (!llms.includes(`${site}${page}`)) issues.push(["MEDIUM", "llms.txt", `لا يحتوي الصفحة الاستراتيجية ${site}${page}.`]);
    }
  }

  const counts = issues.reduce((acc, [level]) => {
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  const lines = [
    "# تقرير QA لعناوين SEO وIntent",
    "",
    `- الصفحات العامة المفحوصة: ${indexableUrls.size}`,
    `- Critical: ${counts.CRITICAL || 0}`,
    `- High: ${counts.HIGH || 0}`,
    `- Medium: ${counts.MEDIUM || 0}`,
    `- Low: ${counts.LOW || 0}`,
    "",
    "## النتائج",
    ""
  ];
  if (!issues.length) {
    lines.push("لا توجد مشاكل حرجة أو عالية ضمن نطاق فحص intent/headings الحالي.");
  } else {
    lines.push("| Severity | Target | Issue |", "|---|---|---|");
    for (const issue of issues) lines.push(`| ${issue[0]} | ${issue[1]} | ${issue[2]} |`);
  }
  fs.writeFileSync(outputPath, lines.join("\n") + "\n");
  console.log(`SEO intent headings QA: ${issues.length} issues. Report: ${path.relative(root, outputPath)}`);
  if ((counts.CRITICAL || 0) > 0) process.exitCode = 1;
}

main();
