import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const targetPages = [
  "kernel/index.html",
  "kernel/chat.html",
  "kernel/stats.html",
  "kernel/approvals.html",
  "kernel/audit.html",
  "kernel/evidence.html",
  "kernel/reports.html",
  "kernel/scenarios.html",
  "kernel/compliance.html",
  "kernel/policies.html",
  "kernel/connectors.html",
  "kernel/offline.html",
  "services/index.html",
];

function hasType(node, type) {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.includes(type);
}

function extractNodes(html, relPath) {
  const nodes = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const schema = JSON.parse(match[1]);
    if (Array.isArray(schema?.["@graph"])) nodes.push(...schema["@graph"]);
    else if (Array.isArray(schema)) nodes.push(...schema);
    else nodes.push(schema);
  }

  assert.ok(nodes.length, `${relPath}: expected at least one JSON-LD node`);
  return nodes;
}

for (const relPath of targetPages) {
  test(`${relPath} exposes the shared BrightAI web application schema`, async () => {
    const html = await readFile(new URL(`../${relPath}`, import.meta.url), "utf8");
    const nodes = extractNodes(html, relPath);
    const application = nodes.find(
      (node) => node?.["@id"] === "https://brightai.site/#product",
    );
    const linkedWebPage = nodes.find(
      (node) =>
        hasType(node, "WebPage") &&
        node?.mainEntity?.["@id"] === "https://brightai.site/#product",
    );

    assert.ok(application, `${relPath}: missing shared application entity`);
    assert.ok(hasType(application, "SoftwareApplication"));
    assert.ok(hasType(application, "WebApplication"));
    assert.equal(application.name, "BrightAI Kernel");
    assert.equal(application.applicationCategory, "BusinessApplication");
    assert.equal(application.operatingSystem, "Cloud, Hybrid, On-Premise");
    assert.match(application.description, /[\u0600-\u06FF]/);
    assert.deepEqual(application.provider, {
      "@id": "https://brightai.site/#organization",
    });
    assert.equal(application.offers?.["@type"], "Offer");
    assert.equal(application.offers?.price, 0);
    assert.equal(application.offers?.priceCurrency, "SAR");
    assert.equal(application.offers?.availability, "https://schema.org/InStock");
    assert.equal(application.offers?.url, "https://brightai.site/contact/");
    // featureList must exist and have at least 5 items
    assert.ok(Array.isArray(application.featureList), `${relPath}: featureList must be an array`);
    assert.ok(application.featureList.length >= 5, `${relPath}: featureList must have >= 5 items`);
    assert.deepEqual(linkedWebPage?.mainEntity, {
      "@id": "https://brightai.site/#product",
    });

    for (const requiredType of [
      "Organization",
      "WebSite",
      "WebPage",
      "BreadcrumbList",
    ]) {
      assert.ok(
        nodes.some((node) => hasType(node, requiredType)),
        `${relPath}: existing ${requiredType} schema must remain`,
      );
    }
  });
}
