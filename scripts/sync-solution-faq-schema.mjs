#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";
import { glob } from "glob";
import { resolveClientBuildRoot } from "./_build-output.mjs";

// REPORTS-SEO-FOUNDATION (2026-07-07): FoundationSchema is the single source
// of truth for JSON-LD now. The legacy id "brightai-production-schema"
// was emitted by SEOHead but FoundationSchema emits "brightai-foundation-schema".
const MANAGED_SCHEMA_ID = "brightai-foundation-schema";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isFaqSection($, details) {
  const section = $(details).closest("section");
  if (!section.length) return false;

  const id = section.attr("id") || "";
  const labelledBy = section.attr("aria-labelledby") || "";
  const heading = normalizeText(section.find("h2, h3").first().text());
  return /faq|أسئلة|شائعة/i.test(`${id} ${labelledBy} ${heading}`);
}

export function extractVisibleFaq(html) {
  const $ = cheerio.load(html);
  const questions = [];

  $("details").each((_, details) => {
    if (!isFaqSection($, details)) return;

    const summaryNode = $(details).find("summary").first().clone();
    summaryNode.find("iconify-icon, i, svg, .faq-icon").remove();
    const question = normalizeText(summaryNode.text());
    const answerNode = $(details).clone();
    answerNode.find("summary, script, style").remove();
    const answer = normalizeText(answerNode.text());
    if (!question || !answer) return;

    questions.push({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    });
  });

  return questions;
}

function extractCanonical(html) {
  const tag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  const href = tag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (!href) throw new Error("Solution page is missing a canonical URL.");
  return href;
}

function hasType(node, type) {
  const value = node?.["@type"];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

function findSchemaScript(html) {
  const pattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let fallback = null;
  let match;

  while ((match = pattern.exec(html))) {
    let schema;
    try {
      schema = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const graph = Array.isArray(schema)
      ? schema
      : Array.isArray(schema?.["@graph"])
      ? schema["@graph"]
      : [schema];
    const candidate = {
      full: match[0],
      inner: match[1],
      schema,
      graph,
    };

    if (new RegExp(`\\bid=["']${MANAGED_SCHEMA_ID}["']`, "i").test(match[0])) {
      return candidate;
    }
    if (graph.some((node) => hasType(node, "FAQPage"))) {
      fallback = candidate;
    }
  }

  return fallback;
}

export function syncSolutionFaqSchema(html) {
  const faqItems = extractVisibleFaq(html);
  if (faqItems.length === 0) {
    throw new Error("Solution page has no visible FAQ details.");
  }

  const canonical = extractCanonical(html);
  const script = findSchemaScript(html);
  if (!script) {
    throw new Error("Missing JSON-LD graph containing FAQPage.");
  }

  const { schema } = script;
  let graph;
  if (Array.isArray(schema)) {
    graph = schema;
  } else if (Array.isArray(schema["@graph"])) {
    graph = schema["@graph"];
  } else {
    throw new Error("Managed JSON-LD must be an array or contain an @graph array.");
  }
  const faqIndex = graph.findIndex((node) => hasType(node, "FAQPage"));
  const faqNode = {
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    mainEntity: faqItems,
  };

  if (faqIndex === -1) {
    graph.push(faqNode);
  } else {
    graph[faqIndex] = faqNode;
  }

  const replacement = script.full.replace(
    script.inner,
    `\n${JSON.stringify(schema, null, 2)}\n`,
  );
  return html.replace(script.full, replacement);
}

export async function runSync({
  root,
  check = false,
} = {}) {
  const buildRoot = root || resolveClientBuildRoot(process.cwd()).root;
  if (!buildRoot) {
    throw new Error("Client build root is missing. Run pnpm run build first.");
  }
  const files = await glob("solutions/**/index.html", {
    cwd: buildRoot,
    absolute: true,
    nodir: true,
  });
  const changed = [];

  for (const file of files.sort()) {
    const before = await fs.readFile(file, "utf8");
    if (extractVisibleFaq(before).length === 0) continue;
    const after = syncSolutionFaqSchema(before);
    if (after === before) continue;

    changed.push(path.relative(buildRoot, file));
    if (!check) await fs.writeFile(file, after, "utf8");
  }

  if (check && changed.length) {
    throw new Error(
      `Solution FAQ schema is out of sync:\n${changed.join("\n")}`,
    );
  }

  return changed;
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runSync({ check: process.argv.includes("--check") })
    .then((changed) => {
      const action = process.argv.includes("--check") ? "checked" : "updated";
      console.log(`Solution FAQ schema ${action}: ${changed.length} file(s).`);
    })
    .catch((error) => {
      console.error(`Solution FAQ schema failed: ${error.message}`);
      process.exitCode = 1;
    });
}
