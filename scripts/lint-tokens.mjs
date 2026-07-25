#!/usr/bin/env node
// lint-tokens.mjs
// Check for raw hex colors and raw px spacing values in CSS and Astro files.
// Scans src/styles/*.css (excluding tokens.css) and <style> blocks in .astro files.
// Exit code: 0 = clean, 1 = violations found.
// Usage:     node scripts/lint-tokens.mjs

import { promises as fs } from "fs";
import { glob } from "glob";

const ROOT = process.cwd();
const HEX_6 = /#[0-9a-fA-F]{6}\b/g;
const PX_SPACING = /\b(padding|margin|gap)\s*:\s*\d+px\b/i;

const violations = [];

// CSS files in src/styles/ that define tokens themselves (raw hex is expected there)
const TOKEN_DEF_FILES = new Set(["global.css", "color-usage.css"]);

// Px values that are exempt (borders, hairline touches)
const EXEMPT_PX = new Set(["1px", "2px"]);

function isInsideVarOrCustomProp(line, charIndex) {
  // Check if inside var(--...)
  const opens = [];
  for (let i = 0; i < line.length; i++) {
    if (line.slice(i, i + 6) === "var(--") opens.push(i);
    if (line[i] === ")" && opens.length > 0) {
      const start = opens.pop();
      if (charIndex >= start && charIndex < i + 1) return true;
    }
  }
  // Check if this hex is the value of a CSS custom property (--name: #xxx)
  const cpMatch = line.match(/--[\w-]+:\s*/);
  if (cpMatch && charIndex > cpMatch.index) return true;
  return false;
}

async function scanCSS(filePath, relative) {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trimStart();

    if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//")) return;

    // Hex check: skip documentation-like lines
    const isDocLine =
      trimmed.startsWith("WCAG") ||
      trimmed.startsWith("was ") ||
      trimmed.startsWith("fails") ||
      trimmed.includes("—") ||
      trimmed.startsWith("small body") ||
      trimmed.startsWith("- Teal tokens") ||
      trimmed.startsWith("DEC-SovB");

    if (!isDocLine) {
      for (const m of line.matchAll(HEX_6)) {
        if (!isInsideVarOrCustomProp(line, m.index) && !trimmed.startsWith("`")) {
          violations.push({ file: relative, line: lineNum, content: line.trim(), type: "hex" });
        }
      }
    }

    // Px spacing check
    if (PX_SPACING.test(line) && !line.includes("var(--")) {
      const val = line.match(/\d+px/);
      if (val && !EXEMPT_PX.has(val[0])) {
        violations.push({ file: relative, line: lineNum, content: line.trim(), type: "px-spacing" });
      }
    }
  });
}

async function scanAstro(filePath, relative) {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split("\n");
  let inStyle = false;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (/^<style\b/.test(trimmed)) {
      inStyle = trimmed.endsWith(">");
      return;
    }
    if (inStyle && trimmed === "</style>") {
      inStyle = false;
      return;
    }
    if (!inStyle) return;

    if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//")) return;

    for (const m of line.matchAll(HEX_6)) {
      if (!isInsideVarOrCustomProp(line, m.index)) {
        violations.push({ file: relative, line: lineNum, content: line.trim(), type: "hex" });
      }
    }

    if (PX_SPACING.test(line) && !line.includes("var(--")) {
      const val = line.match(/\d+px/);
      if (val && !EXEMPT_PX.has(val[0])) {
        violations.push({ file: relative, line: lineNum, content: line.trim(), type: "px-spacing" });
      }
    }
  });
}

async function main() {
  const cssFiles = await glob("src/styles/*.css", { cwd: ROOT });
  for (const f of cssFiles) {
    if (f === "src/styles/tokens.css") continue;
    const basename = f.replace("src/styles/", "");
    if (TOKEN_DEF_FILES.has(basename)) continue;
    await scanCSS(f, f);
  }

  const astroFiles = await glob("src/**/*.astro", { cwd: ROOT });
  for (const f of astroFiles) {
    await scanAstro(f, f);
  }

  if (violations.length > 0) {
    console.error(`[FAIL] Found ${violations.length} token violation(s):\n`);
    for (const v of violations) {
      const label = v.type === "hex" ? "raw hex" : "raw px (spacing)";
      console.error(`  ${v.file}:${v.line}  [${label}]  ${v.content}`);
    }
    process.exit(1);
  } else {
    console.log("[PASS] 0 token violations found.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("lint-tokens.mjs failed:", err);
  process.exit(1);
});
