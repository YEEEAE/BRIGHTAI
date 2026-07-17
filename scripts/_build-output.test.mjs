#!/usr/bin/env node
/**
 * scripts/_build-output.test.mjs
 *
 * Unit + integration tests for the unified build output helper. Uses the
 * fixture under scripts/__fixtures__/build-output/ which contains:
 *   - dist/client/index.html  (the canonical client root the helper prefers)
 *   - dist/client/sitemap.xml (166 <loc> + 23 en-SA alternates = 189 URLs)
 *   - 190 HTML files total under dist/client/
 *   - dist/index.html (legacy flat fallback)
 *
 * Acceptance criteria from the user's request (2026-07-18):
 *   1. resolveClientBuildRoot prefers dist/client/ when present
 *   2. Falls back to dist/ when dist/client/ is absent
 *   3. Returns null when neither exists
 *   4. listClientHtmlFiles returns 190 HTML paths from the fixture
 *   5. resolveClientSitemapFile returns the sitemap path
 *   6. readClientSitemapUrls reads 166 <loc> entries
 *   7. readClientSitemapEntries reports total = 189 (loc + alternates)
 *   8. ensureNonEmptySitemap refuses 0-URL payloads
 *
 * Run with: node --test scripts/_build-output.test.mjs
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { describe, it, before, after } from "node:test";
import { fileURLToPath } from "node:url";

import {
  _internals,
  ensureNonEmptySitemap,
  listClientHtmlFiles,
  readClientSitemapEntries,
  readClientSitemapUrls,
  resolveClientBuildRoot,
  resolveClientSitemapFile,
} from "./_build-output.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.join(HERE, "__fixtures__", "build-output");
const FIXTURE_CLIENT = path.join(FIXTURE_ROOT, "dist", "client");
const FIXTURE_FLAT = path.join(FIXTURE_ROOT, "dist");

/* ──────────────────────────────────────────────────────────────────────────
 * Setup: ensure the fixture exists. If missing, build it.
 * ────────────────────────────────────────────────────────────────────────── */
before(async () => {
  const fixtureEntry = path.join(FIXTURE_CLIENT, "index.html");
  if (!fs.existsSync(fixtureEntry)) {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const script = path.join(FIXTURE_ROOT, "build-fixture.mjs");
    await execFileAsync(process.execPath, [script], { cwd: path.dirname(HERE) });
  }
  assert.ok(
    fs.existsSync(fixtureEntry),
    "fixture must contain dist/client/index.html — run scripts/__fixtures__/build-output/build-fixture.mjs to generate it"
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * 1. resolveClientBuildRoot — adapter-laid wins over legacy flat
 * ────────────────────────────────────────────────────────────────────────── */
describe("resolveClientBuildRoot", () => {
  it("prefers dist/client/ when dist/client/index.html exists", () => {
    const result = resolveClientBuildRoot(FIXTURE_ROOT);
    assert.equal(result.adapter, true);
    assert.equal(result.root, FIXTURE_CLIENT);
    assert.match(result.reason, /dist\/client\/index\.html/);
  });

  it("falls back to dist/ when dist/client/index.html is absent", () => {
    // Move the fixture's dist/client aside, verify fallback picks dist/.
    const tempClient = path.join(FIXTURE_ROOT, "dist", "client.bak");
    fs.renameSync(FIXTURE_CLIENT, tempClient);
    try {
      const result = resolveClientBuildRoot(FIXTURE_ROOT);
      assert.equal(result.adapter, false);
      assert.equal(result.root, FIXTURE_FLAT);
      assert.match(result.reason, /dist\/index\.html/);
    } finally {
      fs.renameSync(tempClient, FIXTURE_CLIENT);
    }
  });

  it("returns null when neither dist/client/ nor dist/ has index.html", () => {
    const emptyRoot = path.join(FIXTURE_ROOT, "..", "..", "__empty-fixture__");
    fs.mkdirSync(path.join(emptyRoot, "dist"), { recursive: true });
    try {
      const result = resolveClientBuildRoot(emptyRoot);
      assert.equal(result.root, null);
      assert.equal(result.adapter, false);
      assert.match(result.reason, /no built HTML/);
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
  });

  it("rejects non-string or empty rootDir", () => {
    assert.equal(resolveClientBuildRoot("").root, null);
    assert.equal(resolveClientBuildRoot(null).root, null);
    assert.equal(resolveClientBuildRoot(undefined).root, null);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 2. listClientHtmlFiles — 190 HTML files from the fixture
 * ────────────────────────────────────────────────────────────────────────── */
describe("listClientHtmlFiles", () => {
  it("returns 190 HTML files from dist/client/", async () => {
    const files = await listClientHtmlFiles(FIXTURE_ROOT);
    assert.equal(files.length, 190, `expected 190 HTML files, got ${files.length}`);
    for (const file of files) {
      assert.ok(file.startsWith(FIXTURE_CLIENT), `file ${file} should be under client root`);
      assert.ok(file.endsWith(".html"), `file ${file} should be .html`);
    }
  });

  it("returns [] when no build exists", async () => {
    const emptyRoot = path.join(FIXTURE_ROOT, "..", "..", "__empty-fixture-list__");
    fs.mkdirSync(path.join(emptyRoot, "dist"), { recursive: true });
    try {
      const files = await listClientHtmlFiles(emptyRoot);
      assert.deepEqual(files, []);
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
  });

  it("skips .git and node_modules", async () => {
    // Plant decoy HTML files inside dist/client/node_modules and dist/client/.git
    // to confirm the ignore list still applies.
    const decoyClient = path.join(FIXTURE_ROOT, "..", "__decoy-client__", "dist", "client");
    fs.mkdirSync(path.join(decoyClient, "node_modules"), { recursive: true });
    fs.mkdirSync(path.join(decoyClient, ".git"), { recursive: true });
    fs.mkdirSync(path.join(decoyClient, "_astro"), { recursive: true });
    await fsp.writeFile(path.join(decoyClient, "index.html"), "<html></html>");
    await fsp.writeFile(path.join(decoyClient, "real.html"), "<html></html>");
    await fsp.writeFile(path.join(decoyClient, "node_modules", "leaked.html"), "<html></html>");
    await fsp.writeFile(path.join(decoyClient, ".git", "leaked.html"), "<html></html>");
    try {
      const decoyRoot = path.dirname(path.dirname(decoyClient));
      const files = await listClientHtmlFiles(decoyRoot);
      const names = files.map((f) => path.basename(f)).sort();
      assert.deepEqual(names, ["index.html", "real.html"]);
    } finally {
      fs.rmSync(path.dirname(path.dirname(decoyClient)), { recursive: true, force: true });
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 3. resolveClientSitemapFile — picks sitemap.xml from client root
 * ────────────────────────────────────────────────────────────────────────── */
describe("resolveClientSitemapFile", () => {
  it("returns the absolute path to sitemap.xml when present", () => {
    const file = resolveClientSitemapFile(FIXTURE_ROOT);
    assert.ok(file);
    assert.equal(file, path.join(FIXTURE_CLIENT, "sitemap.xml"));
  });

  it("returns null when no sitemap candidate exists", () => {
    const emptyRoot = path.join(FIXTURE_ROOT, "..", "..", "__no-sitemap__");
    fs.mkdirSync(path.join(emptyRoot, "dist", "client"), { recursive: true });
    fs.writeFileSync(
      path.join(emptyRoot, "dist", "client", "index.html"),
      "<html></html>"
    );
    try {
      const file = resolveClientSitemapFile(emptyRoot);
      assert.equal(file, null);
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 4. readClientSitemapUrls — 166 <loc> entries from the fixture
 * ────────────────────────────────────────────────────────────────────────── */
describe("readClientSitemapUrls", () => {
  it("reads 166 <loc> entries from the fixture sitemap", async () => {
    const urls = await readClientSitemapUrls(FIXTURE_ROOT);
    assert.equal(urls.length, 166, `expected 166 <loc> entries, got ${urls.length}`);
    assert.ok(urls[0].startsWith("https://brightai.site/"));
  });

  it("returns [] when no sitemap exists", async () => {
    const emptyRoot = path.join(FIXTURE_ROOT, "..", "..", "__no-sitemap-urls__");
    fs.mkdirSync(path.join(emptyRoot, "dist", "client"), { recursive: true });
    fs.writeFileSync(
      path.join(emptyRoot, "dist", "client", "index.html"),
      "<html></html>"
    );
    try {
      const urls = await readClientSitemapUrls(emptyRoot);
      assert.deepEqual(urls, []);
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 5. readClientSitemapEntries — total = 189 (loc + alternates)
 * ────────────────────────────────────────────────────────────────────────── */
describe("readClientSitemapEntries", () => {
  it("counts 189 unique URLs across <loc> + <xhtml:link rel=alternate>", async () => {
    const entries = await readClientSitemapEntries(FIXTURE_ROOT);
    assert.equal(entries.locs.length, 166);
    assert.equal(entries.total, 189, `expected total 189 (166 loc + 23 en-SA alternates), got ${entries.total}`);
    assert.match(entries.source, /sitemap\.xml$/);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 6. ensureNonEmptySitemap — 0-URL guard
 * ────────────────────────────────────────────────────────────────────────── */
describe("ensureNonEmptySitemap", () => {
  it("accepts non-empty payloads", () => {
    const result = ensureNonEmptySitemap({
      urls: ["https://brightai.site/", "https://brightai.site/about/"],
      outputPath: "dist/client/sitemap.xml",
    });
    assert.equal(result.skipped, false);
  });

  it("refuses empty payloads and returns a clear reason", () => {
    const result = ensureNonEmptySitemap({
      urls: [],
      outputPath: "dist/client/sitemap.xml",
    });
    assert.equal(result.skipped, true);
    assert.match(result.reason, /Refusing to write/);
    assert.match(result.reason, /0 URLs/);
  });

  it("refuses non-array payloads", () => {
    const result = ensureNonEmptySitemap({
      urls: "not an array",
      outputPath: "dist/client/sitemap.xml",
    });
    assert.equal(result.skipped, true);
    assert.match(result.reason, /not an array/);
  });

  it("refuses null/undefined payloads", () => {
    assert.equal(ensureNonEmptySitemap({ urls: null, outputPath: "x" }).skipped, true);
    assert.equal(ensureNonEmptySitemap({ urls: undefined, outputPath: "x" }).skipped, true);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 7. Integration — all 4 verification scripts read 190 HTML / 189 URLs
 *
 * Subprocess-based smoke test (kept light: just resolveClientBuildRoot +
 * listClientHtmlFiles + readClientSitemapEntries on the real dist/).
 * ────────────────────────────────────────────────────────────────────────── */
describe("integration: production dist/client/", () => {
  // The test file lives at .../BRIGHTAI/scripts/_build-output.test.mjs,
  // so HERE = .../BRIGHTAI/scripts and one `..` lands on the project root.
  const PROD_ROOT = path.resolve(HERE, "..");

  it("production dist/client/index.html exists", () => {
    const result = resolveClientBuildRoot(PROD_ROOT);
    assert.ok(result.root, "expected resolveClientBuildRoot to find dist/client/ in production");
    assert.equal(result.adapter, true);
    assert.ok(
      fs.existsSync(path.join(result.root, "index.html")),
      "production client root must contain index.html"
    );
  });

  it("production client root has the expected HTML count (>= 189)", async () => {
    const files = await listClientHtmlFiles(PROD_ROOT);
    assert.ok(
      files.length >= 189,
      `expected >= 189 HTML files in production dist/client/, got ${files.length}`
    );
  });

  it("production sitemap.xml has >= 165 <loc> entries", async () => {
    const urls = await readClientSitemapUrls(PROD_ROOT);
    assert.ok(
      urls.length >= 165,
      `expected >= 165 sitemap URLs in production, got ${urls.length}`
    );
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 8. parseSitemapXml — internal parser unit tests
 * ────────────────────────────────────────────────────────────────────────── */
describe("_internals.parseSitemapXml", () => {
  it("extracts locs and alternates from a urlset", async () => {
    const xml = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://brightai.site/about/</loc>
    <xhtml:link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/about/" />
  </url>
</urlset>`;
    const result = await _internals.parseSitemapXml(xml, "inline.xml", FIXTURE_ROOT);
    assert.equal(result.locs.length, 1);
    assert.equal(result.total, 2);
  });

  it("returns 0 for an empty urlset", async () => {
    const xml = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    const result = await _internals.parseSitemapXml(xml, "empty.xml", FIXTURE_ROOT);
    assert.equal(result.locs.length, 0);
    assert.equal(result.total, 0);
  });
});
