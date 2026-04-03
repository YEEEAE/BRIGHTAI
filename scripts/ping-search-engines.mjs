#!/usr/bin/env node
const DEFAULT_SITEMAP_URL = "https://brightai.site/sitemap.xml";
const GOOGLE_PING_URL = "https://www.google.com/ping";
const BING_PING_URL = "https://www.bing.com/ping";

function truncate(text, maxLength = 240) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function explainPingStatus(name, status) {
  if (name === "Google" && status === 404) {
    return "Google أوقف sitemap ping endpoint رسمياً.";
  }

  if (name === "Bing" && status === 410) {
    return "استناداً إلى الاستجابة الحالية، Bing لم يعد يفعّل endpoint القديم للـ sitemap ping.";
  }

  return "";
}

async function pingEndpoint({ name, baseUrl, sitemapUrl, dryRun, note }) {
  const endpointUrl = `${baseUrl}?sitemap=${encodeURIComponent(sitemapUrl)}`;

  if (note) {
    console.log(`ملاحظة ${name}: ${note}`);
  }

  if (dryRun) {
    console.log(`dry-run | ${name} | ${endpointUrl}`);
    return;
  }

  try {
    const response = await fetch(endpointUrl, {
      method: "GET",
      redirect: "follow",
    });
    const body = await response.text();
    const hint = explainPingStatus(name, response.status);

    console.log(
      `${name} | الحالة ${response.status} ${response.ok ? "OK" : "ERROR"}${hint ? ` | ${hint}` : ""} | ${truncate(
        body.replace(/\s+/g, " ").trim()
      ) || "لا يوجد محتوى رد"}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${name} | فشل الطلب | ${message}`);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sitemapUrl = process.env.SITEMAP_URL || DEFAULT_SITEMAP_URL;

  new URL(sitemapUrl);

  console.log(`Sitemap URL: ${sitemapUrl}\n`);

  await pingEndpoint({
    name: "Google",
    baseUrl: GOOGLE_PING_URL,
    sitemapUrl,
    dryRun,
    note: "Google أعلن في 26 يونيو 2023 إيقاف sitemap ping endpoint، لذا قد تُعيد هذه المحاولة 404 أو لا يكون لها أثر فعلي.",
  });

  await pingEndpoint({
    name: "Bing",
    baseUrl: BING_PING_URL,
    sitemapUrl,
    dryRun,
    note: "إذا أعاد Bing الحالة 410 فهذا يعني عملياً أن الاعتماد يجب أن يكون على IndexNow ووجود sitemap في robots.txt أكثر من ping التقليدي.",
  });
}

main().catch((error) => {
  console.error(`تعذر تنفيذ ping لمحركات البحث: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
