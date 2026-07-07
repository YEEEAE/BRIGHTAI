#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const redirectsJsonPath = path.join(ROOT, "redirects.json");
const publicRedirectsPath = path.join(ROOT, "public", "_redirects");
const renderYamlPath = path.join(ROOT, "render.yaml");

async function main() {
  try {
    const data = await fs.readFile(redirectsJsonPath, "utf8");
    const parsed = JSON.parse(data);
    const redirects = parsed.redirects || [];

    console.log(`قراءة ${redirects.length} قاعدة تحويل من redirects.json`);

    // 1. توليد ملف public/_redirects
    let netlifyRedirects = `# ==============================================================================\n`;
    netlifyRedirects += `# BRIGHTAI - Static Redirects Configuration (AUTO-GENERATED DO NOT EDIT)\n`;
    netlifyRedirects += `# Source: redirects.json\n`;
    netlifyRedirects += `# ==============================================================================\n\n`;
    netlifyRedirects += `http://brightai.site/*        https://brightai.site/:splat  301\n`;
    netlifyRedirects += `https://www.brightai.site/*    https://brightai.site/:splat  301\n\n`;

    for (const r of redirects) {
      netlifyRedirects += `${r.from} ${r.to} 301\n`;
    }
    
    // إضافة حماية إضافية للـ frontend
    netlifyRedirects += `/frontend/* /404/ 301\n`;

    await fs.writeFile(publicRedirectsPath, netlifyRedirects, "utf8");
    console.log(`تم تحديث public/_redirects بنجاح`);

    // 2. تحديث ملف render.yaml
    const renderYamlContent = await fs.readFile(renderYamlPath, "utf8");
    const routesStartIndex = renderYamlContent.indexOf("    routes:");
    if (routesStartIndex === -1) {
      throw new Error("لم يتم العثور على '    routes:' في ملف render.yaml");
    }

    const yamlPrefix = renderYamlContent.substring(0, routesStartIndex + "    routes:\n".length);
    let yamlRoutes = "";

    // إضافة التحويلات الأساسية لـ trailing slash والصفحات الخاصة
    const baseRedirects = [
      { from: "/index.html", to: "/" },
      { from: "/about", to: "/about/" },
      { from: "/about.html", to: "/about/" },
      { from: "/about/index.html", to: "/about/" },
      { from: "/contact", to: "/contact/" },
      { from: "/contact.html", to: "/contact/" },
      { from: "/contact/index.html", to: "/contact/" },
      { from: "/services", to: "/services/" },
      { from: "/services.html", to: "/services/" },
      { from: "/services/index.html", to: "/services/" },
      { from: "/pricing", to: "/pricing/" },
      { from: "/pricing.html", to: "/pricing/" },
      { from: "/pricing/index.html", to: "/pricing/" },
      { from: "/demo", to: "/demo/" },
      { from: "/demo.html", to: "/demo/" },
      { from: "/demo/index.html", to: "/demo/" },
      { from: "/privacy-policy", to: "/privacy-policy/" },
      { from: "/privacy-policy.html", to: "/privacy-policy/" },
      { from: "/privacy-policy/index.html", to: "/privacy-policy/" },
      { from: "/cookie-policy", to: "/cookie-policy/" },
      { from: "/cookie-policy.html", to: "/cookie-policy/" },
      { from: "/cookie-policy/index.html", to: "/cookie-policy/" },
      { from: "/terms", to: "/terms/" },
      { from: "/terms.html", to: "/terms/" },
      { from: "/terms/index.html", to: "/terms/" },
      { from: "/pdpl-statement", to: "/pdpl-statement/" },
      { from: "/pdpl-statement.html", to: "/pdpl-statement/" },
      { from: "/pdpl-statement/index.html", to: "/pdpl-statement/" },
      { from: "/data-processing-agreement", to: "/data-processing-agreement/" },
      { from: "/data-processing-agreement.html", to: "/data-processing-agreement/" },
      { from: "/data-processing-agreement/index.html", to: "/data-processing-agreement/" },
      { from: "/trust", to: "/trust/" },
      { from: "/trust.html", to: "/trust/" },
      { from: "/trust/index.html", to: "/trust/" },
    ];

    const seenRoutes = new Set();
    const addYamlRoute = (from, to) => {
      if (seenRoutes.has(from) || from === to) return;
      seenRoutes.add(from);
      yamlRoutes += `      - type: redirect\n        source: ${from}\n        destination: ${to}\n`;
    };

    // إضافة التحويلات الأساسية أولاً
    for (const br of baseRedirects) {
      addYamlRoute(br.from, br.to);
    }

    // إضافة التحويلات من redirects.json
    for (const r of redirects) {
      addYamlRoute(r.from, r.to);
    }

    // إضافة حماية الـ frontend والـ RSS
    addYamlRoute("/frontend", "/404/");
    addYamlRoute("/frontend/", "/404/");
    addYamlRoute("/frontend/*", "/404/");
    addYamlRoute("/rss", "/rss.xml/");
    addYamlRoute("/rss.html", "/rss.xml/");
    addYamlRoute("/rss/index.html", "/rss.xml/");
    addYamlRoute("/blog/feed", "/rss.xml/");
    addYamlRoute("/blog/feed.html", "/rss.xml/");
    addYamlRoute("/blog/feed.xml", "/rss.xml/");
    addYamlRoute("/blog/feed.xml/", "/rss.xml/");
    addYamlRoute("/blog/feed/index.html", "/rss.xml/");

    await fs.writeFile(renderYamlPath, yamlPrefix + yamlRoutes, "utf8");
    console.log(`تم تحديث render.yaml بنجاح مع ${seenRoutes.size} قواعد تحويل`);

  } catch (error) {
    console.error("خطأ أثناء توليد التحويلات:", error);
    process.exit(1);
  }
}

main();
