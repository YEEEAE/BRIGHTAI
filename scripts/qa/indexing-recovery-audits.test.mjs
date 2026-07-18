import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { auditLegacyPaths } from "./legacy-paths-audit.mjs";
import { validateLinkGraph } from "./link-graph-validator.mjs";
import { checkRedirectDestinations } from "./check-redirect-destinations.mjs";
import { checkWordCounts } from "./check-word-count.mjs";

async function fixture(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "brightai-indexing-"));
  for (const [relPath, content] of Object.entries(files)) {
    const filePath = path.join(root, relPath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }
  return root;
}

test("legacy audit reports public legacy links but ignores redirect sources", async () => {
  const root = await fixture({
    "index.html": '<a href="/consultation/">استشارة</a>',
    "contact/index.html": "<h1>تواصل</h1>",
    "_redirects": "/consultation/ /contact/ 301\n",
    "redirects.json": '{"redirects":[]}',
  });

  const result = await auditLegacyPaths({ root });

  assert.equal(result.findings.length, 1);
  assert.match(result.findings[0].value, /consultation/);
});

test("link graph reports html suffixes and missing internal destinations", async () => {
  const root = await fixture({
    "index.html": '<a href="/about.html">عنّا</a><a href="/missing/">مفقود</a>',
    "about/index.html": "<h1>عنّا</h1>",
  });

  const result = await validateLinkGraph({ root });

  assert.equal(result.htmlSuffixes.length, 1);
  assert.equal(result.brokenLinks.length, 1);
  assert.equal(result.brokenLinks[0].normalized, "/missing/");
});

test("redirect audit reports self redirects, cycles, chains, and missing destinations", async () => {
  const root = await fixture({
    "index.html": "<h1>الرئيسية</h1>",
    "about/index.html": "<h1>عنّا</h1>",
    "_redirects": [
      "/self/ /self/ 301",
      "/a/ /b/ 301",
      "/b/ /a/ 301",
      "/chain/ /a/ 301",
      "/gone/ /missing/ 301",
    ].join("\n"),
    "redirects.json": '{"redirects":[]}',
  });

  const result = await checkRedirectDestinations({ root });

  assert.equal(result.selfRedirects.length, 1);
  assert.ok(result.cycles.length >= 1);
  assert.ok(result.chains.length >= 1);
  assert.equal(result.missingDestinations.length, 1);
});

test("redirect audit works when the optional _redirects file is absent", async () => {
  const root = await fixture({
    "index.html": "<h1>الرئيسية</h1>",
    "about/index.html": "<h1>عنّا</h1>",
    "redirects.json": JSON.stringify({
      redirects: [{ from: "/about.html", to: "/about/", status: 301 }],
    }),
  });

  const result = await checkRedirectDestinations({ root });

  assert.equal(result.redirectsScanned, 1);
  assert.equal(result.missingDestinations.length, 0);
});

test("word count audit excludes kernel offline and enforces configured targets", async () => {
  const root = await fixture({
    "contact/index.html": "<main>واحد اثنان ثلاثة</main>",
    "kernel/offline.html": "<main>قصير</main>",
  });

  const result = await checkWordCounts({
    root,
    targets: { "contact/index.html": 4, "kernel/offline.html": 100 },
  });

  assert.deepEqual(result.failures.map((entry) => entry.relPath), ["contact/index.html"]);
});
