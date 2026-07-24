#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";
import { glob } from "glob";
import { resolveClientBuildRoot } from "./_build-output.mjs";

const MINIMUM_SPEAKABLE_PAGES = 30;

function hasType(node, type) {
  const value = node?.["@type"];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

function collectNodes(value, nodes = []) {
  if (!value || typeof value !== "object") return nodes;
  if (!Array.isArray(value)) nodes.push(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    collectNodes(child, nodes);
  }
  return nodes;
}

function parseJsonLd(html, relPath) {
  const schemas = [];
  const pattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let blockIndex = 0;

  while ((match = pattern.exec(html))) {
    try {
      schemas.push(JSON.parse(match[1]));
    } catch (error) {
      throw new Error(
        `${relPath}: invalid JSON-LD block ${blockIndex}: ${error.message}`,
      );
    }
    blockIndex += 1;
  }

  return schemas;
}

export function auditSpeakablePage(relPath, html) {
  const errors = [];
  const $ = cheerio.load(html);
  const schemas = parseJsonLd(html, relPath);
  const nodes = schemas.flatMap((schema) => collectNodes(schema));
  const speakableNodes = nodes.filter((node) => node?.speakable);

  for (const node of speakableNodes) {
    if (!hasType(node, "WebPage")) {
      errors.push("speakable must be attached to a WebPage node.");
      continue;
    }

    const specification = node.speakable;
    if (!hasType(specification, "SpeakableSpecification")) {
      errors.push("speakable must use SpeakableSpecification.");
      continue;
    }

    if (specification.xPath) {
      errors.push("Use cssSelector only; xPath is not allowed in this project.");
    }

    const selectors = specification.cssSelector;
    if (!Array.isArray(selectors) || selectors.length === 0) {
      errors.push("SpeakableSpecification requires a non-empty cssSelector array.");
      continue;
    }

    for (const selector of selectors) {
      if (typeof selector !== "string" || !selector.trim()) {
        errors.push("cssSelector values must be non-empty strings.");
        continue;
      }
      try {
        if ($(selector).length === 0) {
          errors.push(`cssSelector does not match visible HTML: ${selector}`);
        }
      } catch {
        errors.push(`Invalid cssSelector: ${selector}`);
      }
    }
  }

  return { errors, hasSpeakable: speakableNodes.length > 0 };
}

export async function runSpeakableAudit(root) {
  const buildRoot = root || resolveClientBuildRoot(process.cwd()).root;
  if (!buildRoot) {
    throw new Error("Client build root is missing. Run pnpm run build first.");
  }
  const files = await glob("**/*.html", {
    cwd: buildRoot,
    absolute: true,
    nodir: true,
    ignore: ["node_modules/**", ".git/**", ".render-static/**"],
  });
  const failures = [];
  const speakablePages = [];

  for (const file of files.sort()) {
    const relPath = path.relative(buildRoot, file).replaceAll(path.sep, "/");
    const html = await fs.readFile(file, "utf8");
    const result = auditSpeakablePage(relPath, html);
    if (result.hasSpeakable) speakablePages.push(relPath);
    if (result.errors.length) failures.push({ relPath, errors: result.errors });
  }

  if (speakablePages.length < MINIMUM_SPEAKABLE_PAGES) {
    failures.unshift({
      relPath: ".",
      errors: [
        `Expected at least ${MINIMUM_SPEAKABLE_PAGES} Speakable pages, found ${speakablePages.length}.`,
      ],
    });
  }

  if (failures.length) {
    const details = failures
      .map(
        ({ relPath, errors }) =>
          `${relPath}\n${errors.map((error) => `  - ${error}`).join("\n")}`,
      )
      .join("\n");
    throw new Error(`Speakable schema audit failed:\n${details}`);
  }

  return speakablePages;
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runSpeakableAudit()
    .then((pages) => {
      console.log(`Speakable schema audit passed for ${pages.length} page(s).`);
      for (const page of pages) console.log(`  - ${page}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
