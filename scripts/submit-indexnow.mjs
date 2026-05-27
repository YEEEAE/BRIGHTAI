#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const DEFAULT_SITEMAP_PATH = path.join(ROOT_DIR, "sitemap.xml");
const DEFAULT_KEY_FILE = path.join(ROOT_DIR, "brightai-indexnow-key.txt");
const DEFAULT_ENDPOINTS = [
  { name: "Bing", url: "https://www.bing.com/indexnow" },
  { name: "Yandex", url: "https://yandex.com/indexnow" },
];
const MAX_URLS_PER_BATCH = 10000;

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractUrlsFromSitemap(xml) {
  const matches = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)];

  return [...new Set(matches.map((match) => decodeXmlEntities(match[1].trim())).filter(Boolean))];
}

function chunkArray(values, chunkSize) {
  const chunks = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

function truncate(text, maxLength = 240) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function describeIndexNowStatus(status) {
  if (status === 200) {
    return "تم قبول الروابط ومعالجة الطلب مباشرة.";
  }

  if (status === 202) {
    return "تم قبول الطلب، وغالباً المفتاح بانتظار التحقق الأولي لدى محرك البحث.";
  }

  if (status === 403) {
    return "المفتاح غير صالح أو لا يطابق النطاق.";
  }

  if (status === 422) {
    return "الطلب مرفوض بسبب بيانات غير صالحة في المفتاح أو الروابط أو keyLocation.";
  }

  if (status === 429) {
    return "تم تجاوز الحد المسموح مؤقتاً من نفس عنوان IP.";
  }

  return "";
}

async function loadIndexNowKey(keyFilePath) {
  const fileName = path.basename(keyFilePath);
  const expectedKey = fileName.replace(/\.txt$/i, "");
  const fileContents = (await fs.readFile(keyFilePath, "utf8")).trim();

  if (!fileContents) {
    throw new Error(`ملف المفتاح فارغ: ${keyFilePath}`);
  }

  if (fileContents !== expectedKey) {
    throw new Error(
      `محتوى ملف المفتاح يجب أن يطابق اسم الملف بدون الامتداد. المتوقع "${expectedKey}" لكن الموجود "${fileContents}".`
    );
  }

  return fileContents;
}

function resolveSitemapHost(urls) {
  const hosts = [...new Set(urls.map((url) => new URL(url).hostname))];

  if (hosts.length === 0) {
    throw new Error("لم يتم العثور على أي روابط صالحة داخل sitemap.xml.");
  }

  if (hosts.length > 1) {
    throw new Error(`تم العثور على أكثر من نطاق داخل sitemap.xml: ${hosts.join(", ")}`);
  }

  return hosts[0];
}

async function submitBatch({ endpoint, host, key, keyLocation, urls, dryRun }) {
  const payload = {
    host,
    key,
    keyLocation,
    urlList: urls,
  };

  if (dryRun) {
    return {
      ok: true,
      status: 0,
      body: "dry-run",
      submittedCount: urls.length,
    };
  }

  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body,
    submittedCount: urls.length,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sitemapPath = process.env.INDEXNOW_SITEMAP_PATH || DEFAULT_SITEMAP_PATH;
  const keyFilePath = process.env.INDEXNOW_KEY_FILE || DEFAULT_KEY_FILE;
  const sitemapXml = await fs.readFile(sitemapPath, "utf8");
  const urls = extractUrlsFromSitemap(sitemapXml);
  const key = await loadIndexNowKey(keyFilePath);
  const host = process.env.INDEXNOW_HOST || resolveSitemapHost(urls);
  const keyLocation =
    process.env.INDEXNOW_KEY_LOCATION ||
    `https://${host}/${path.basename(keyFilePath)}`;
  const filteredUrls = urls.filter((url) => new URL(url).hostname === host);
  const batches = chunkArray(filteredUrls, MAX_URLS_PER_BATCH);

  if (filteredUrls.length === 0) {
    throw new Error("لا توجد روابط قابلة للإرسال بعد التصفية حسب النطاق.");
  }

  console.log(`تم اكتشاف ${filteredUrls.length} رابط من ${path.relative(ROOT_DIR, sitemapPath)}.`);
  console.log(`المفتاح المستخدم: ${path.basename(keyFilePath)}`);
  console.log(`النطاق المستهدف: ${host}`);
  console.log(`عدد الدفعات: ${batches.length}`);

  for (const endpoint of DEFAULT_ENDPOINTS) {
    console.log(`\n${endpoint.name}`);
    console.log("-".repeat(endpoint.name.length));

    let successCount = 0;

    for (const [index, batch] of batches.entries()) {
      try {
        const result = await submitBatch({
          endpoint,
          host,
          key,
          keyLocation,
          urls: batch,
          dryRun,
        });

        if (result.ok) {
          successCount += result.submittedCount;
        }

        const prefix = result.ok ? "نجاح" : "فشل";
        const extra =
          dryRun || !result.body
            ? ""
            : ` | الرد: ${truncate(result.body.replace(/\s+/g, " ").trim())}`;
        const statusHint = describeIndexNowStatus(result.status);
        const hint = statusHint ? ` | التفسير: ${statusHint}` : "";

        console.log(
          `${prefix} | الدفعة ${index + 1}/${batches.length} | الحالة ${result.status} | الروابط ${result.submittedCount}${hint}${extra}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`فشل | الدفعة ${index + 1}/${batches.length} | الخطأ: ${message}`);
      }
    }

    console.log(`المحصلة لـ ${endpoint.name}: ${successCount}/${filteredUrls.length} رابط أُرسل بنجاح.`);
  }
}

main().catch((error) => {
  console.error(`تعذر تنفيذ إرسال IndexNow: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
