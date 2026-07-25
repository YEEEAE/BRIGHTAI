#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "brightai.site";
const BASE_URL = `https://${HOST}`;
const KEY_FILE = "e158df443f2742d281a02c4aeecb4a60.txt";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;

export async function loadKey(root = process.cwd(), keyFile = KEY_FILE) {
  // Candidate locations, in priority order:
  //   1. <root>/<keyFile>                — tests + explicit override
  //   2. <root>/public/<keyFile>         — repo source layout (dev + CI)
  //   3. <root>/dist/client/<keyFile>    — post `astro build` output
  // We try each candidate; ENOENT is the only error we swallow (so a real
  // I/O failure like EACCES still propagates). Validation errors (wrong
  // key content, mismatched filename) also propagate — if a file exists
  // at a candidate path, its contents must be valid, not silently skipped.
  const candidates = [
    path.join(root, keyFile),
    path.join(root, "public", keyFile),
    path.join(root, "dist/client", keyFile),
  ];

  let lastMissing;
  for (const keyPath of candidates) {
    let key;
    try {
      key = (await fs.readFile(keyPath, "utf8")).trim();
    } catch (error) {
      if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) {
        lastMissing = keyPath;
        continue;
      }
      throw error;
    }

    const expectedKey = path.basename(keyFile, ".txt");
    if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
      throw new Error("IndexNow key must contain 8-128 letters, numbers, or dashes.");
    }
    if (key !== expectedKey) {
      throw new Error("IndexNow key contents must match the key filename.");
    }

    return key;
  }

  throw new Error(
    `IndexNow key file not found. Looked in:\n${candidates
      .map((p) => `  - ${p}`)
      .join("\n")}` +
      (lastMissing ? `\nLast attempted: ${lastMissing}` : ""),
  );
}

export async function loadSitemapUrls(
  root = process.cwd(),
  sitemapFile = "sitemap.xml",
) {
  const xml = await fs.readFile(path.join(root, sitemapFile), "utf8");
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    match[1].trim(),
  );
}

export function normalizeUrls(urls) {
  const normalized = [];
  const seen = new Set();

  for (const value of urls) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Invalid IndexNow URL: ${value}`);
    }

    if (url.protocol !== "https:") {
      throw new Error(`IndexNow URL must use HTTPS: ${value}`);
    }
    if (url.hostname !== HOST) {
      throw new Error(`IndexNow URL must belong to ${HOST}: ${value}`);
    }

    url.hash = "";
    const normalizedUrl = url.toString();
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      normalized.push(normalizedUrl);
    }
  }

  if (normalized.length === 0) {
    throw new Error("No valid URLs were provided for IndexNow.");
  }

  return normalized;
}

export function buildPayload(key, urlList) {
  return {
    host: HOST,
    key,
    keyLocation: `${BASE_URL}/${key}.txt`,
    urlList,
  };
}

export function chunkUrls(urls, size = MAX_URLS_PER_REQUEST) {
  const chunks = [];
  for (let index = 0; index < urls.length; index += size) {
    chunks.push(urls.slice(index, index + size));
  }
  return chunks;
}

export async function submitIndexNow(payload, fetchImpl = fetch) {
  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 200 || response.status === 202) {
    return response.status;
  }

  const explanations = {
    400: "invalid request format",
    403: "key file was not found or did not match",
    422: "URL host or key data did not match",
    429: "submission rate limit reached",
  };
  const detail = explanations[response.status] || "unexpected IndexNow response";
  throw new Error(`IndexNow returned HTTP ${response.status}: ${detail}.`);
}

function parseArgs(args) {
  const options = {
    dryRun: false,
    softFail: false,
    sitemapFile: "sitemap.xml",
    urls: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--soft-fail") {
      options.softFail = true;
    } else if (arg === "--url") {
      options.urls.push(args[index + 1]);
      index += 1;
    } else if (arg.startsWith("--url=")) {
      options.urls.push(arg.slice("--url=".length));
    } else if (arg === "--sitemap") {
      options.sitemapFile = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--sitemap=")) {
      options.sitemapFile = arg.slice("--sitemap=".length);
    } else if (/^https:\/\//i.test(arg)) {
      options.urls.push(arg);
    } else {
      throw new Error(`Unknown IndexNow argument: ${arg}`);
    }
  }

  return options;
}

export async function runCli(args = process.argv.slice(2), root = process.cwd()) {
  const options = parseArgs(args);
  const key = await loadKey(root);
  const sourceUrls = options.urls.length
    ? options.urls
    : await loadSitemapUrls(root, options.sitemapFile);
  const urls = normalizeUrls(sourceUrls);
  const payloads = chunkUrls(urls).map((chunk) => buildPayload(key, chunk));

  if (options.dryRun) {
    console.log(
      `IndexNow dry run: ${urls.length} URL(s), ${payloads.length} request(s), key ${KEY_FILE}.`,
    );
    return payloads;
  }

  for (const payload of payloads) {
    try {
      const status = await submitIndexNow(payload);
      console.log(
        `IndexNow accepted ${payload.urlList.length} URL(s) with HTTP ${status}.`,
      );
    } catch (error) {
      if (!options.softFail) throw error;
      console.warn(`IndexNow deploy warning: ${error.message}`);
    }
  }

  return payloads;
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runCli().catch((error) => {
    console.error(`IndexNow failed: ${error.message}`);
    process.exitCode = 1;
  });
}
