#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { glob } from "glob";

import { extractVisibleHowTo } from "./sync-docs-howto-schema.mjs";
import { extractVisibleFaq } from "./sync-solution-faq-schema.mjs";
import { resolveClientBuildRoot } from "./_build-output.mjs";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasType(node, type) {
  const value = node?.["@type"];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

function parseJsonLd(html, errors) {
  const nodes = [];
  const pattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let index = 0;
  let match;

  function processNode(schema) {
    if (!schema || typeof schema !== "object") return;
    if (Array.isArray(schema)) {
      schema.forEach(processNode);
    } else if (Array.isArray(schema["@graph"])) {
      schema["@graph"].forEach(processNode);
    } else {
      nodes.push(schema);
    }
  }

  while ((match = pattern.exec(html))) {
    try {
      const schema = JSON.parse(match[1]);
      processNode(schema);
    } catch (error) {
      errors.push(`Invalid JSON-LD block ${index}: ${error.message}`);
    }
    index += 1;
  }

  return nodes.filter((node) => node && typeof node === "object");
}

function extractCanonical(html) {
  const tag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1] || "";
}

function faqSignature(items) {
  return items.map((item) => ({
    question: normalizeText(item?.name),
    answer: normalizeText(item?.acceptedAnswer?.text),
  }));
}

function howToSteps(node) {
  return (Array.isArray(node?.step) ? node.step : []).map((step) =>
    normalizeText(step?.text || step?.name),
  );
}

export function auditHtml(relPath, html) {
  const errors = [];
  const nodes = parseJsonLd(html, errors);
  const canonical = extractCanonical(html);

  const breadcrumbs = nodes.filter((node) => hasType(node, "BreadcrumbList"));
  const hasValidBreadcrumb = breadcrumbs.some(
    (node) =>
      Array.isArray(node.itemListElement) &&
      node.itemListElement.length > 0 &&
      node.itemListElement.every(
        (item, index) =>
          hasType(item, "ListItem") &&
          item.position === index + 1 &&
          normalizeText(item.name) &&
          /^https:\/\/brightai\.site\//.test(item.item),
      ),
  );
  if (!hasValidBreadcrumb) {
    errors.push("Missing BreadcrumbList schema with valid absolute items.");
  }

  if (relPath.startsWith("solutions/")) {
    const visibleFaq = extractVisibleFaq(html);
    const faq = nodes.find((node) => hasType(node, "FAQPage"));
    if (!faq) {
      errors.push("Missing FAQPage schema.");
    } else if (
      JSON.stringify(faqSignature(faq.mainEntity || [])) !==
      JSON.stringify(faqSignature(visibleFaq))
    ) {
      errors.push("FAQPage does not match visible FAQ content.");
    }
  }

  if (relPath.startsWith("docs/")) {
    const howTo = nodes.find((node) => hasType(node, "HowTo"));
    if (howTo) {
      errors.push("HowTo schema should be removed as Google deprecated it.");
    }
  }

  if (relPath === "services/index.html") {
    const hasValidService = nodes.some(
      (node) =>
        hasType(node, "Service") &&
        normalizeText(node.name) &&
        normalizeText(node.description) &&
        node.provider &&
        node.url === canonical,
    );
    if (!hasValidService) {
      errors.push("Missing valid Service schema with name, description, provider, and canonical URL.");
    }
  }

  return errors;
}

export async function runAudit(root) {
  const buildRoot = root || resolveClientBuildRoot(process.cwd()).root;
  if (!buildRoot) {
    throw new Error("Client build root is missing. Run pnpm run build first.");
  }
  const files = await glob(
    ["solutions/*/index.html", "docs/*/index.html", "services/index.html"],
    { cwd: buildRoot, absolute: true, nodir: true },
  );
  const failures = [];

  for (const file of files.sort()) {
    const relPath = path.relative(buildRoot, file).replaceAll(path.sep, "/");
    const html = await fs.readFile(file, "utf8");
    const errors = auditHtml(relPath, html);
    if (errors.length) failures.push({ relPath, errors });
  }

  if (failures.length) {
    const details = failures
      .map(
        ({ relPath, errors }) =>
          `${relPath}\n${errors.map((error) => `  - ${error}`).join("\n")}`,
      )
      .join("\n");
    throw new Error(`Schema audit failed:\n${details}`);
  }

  return files.length;
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runAudit()
    .then((count) => {
      console.log(`Schema audit passed for ${count} page(s).`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
