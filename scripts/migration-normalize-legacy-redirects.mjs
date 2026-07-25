#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const redirectsPath = path.join(ROOT, "redirects.json");

const destinationOverrides = new Map([
  ["/blog/ai-governance.html", "/blog/ai-governance/"],
  ["/demo/pages/Visitor-registration/", "/demo/"],
  ["/demo/pages/appointment/", "/demo/"],
  ["/demo/pages/dashboard/", "/demo/"],
  ["/demo/pages/support-ai/", "/demo/"],
  ["/docs/Governance%D9%80application/", "/docs/governance-application/"],
  ["/docs/Governanceـapplication/", "/docs/governance-application/"],
  ["/docs-en.html", "/docs/"],
  ["/en/docs/", "/docs/"],
  ["/en/", "/"],
  ["/smart-medical-archive/", "/solutions/healthcare-ai-governance/"],
  ["/try/", "/demo/"],
]);

const input = JSON.parse(await fs.readFile(redirectsPath, "utf8"));
const seen = new Set();
const redirects = [];

for (const entry of input.redirects || []) {
  const to = destinationOverrides.get(entry.to) || entry.to;
  if (entry.from === to) continue;

  const key = `${entry.from}\u0000${to}`;
  if (seen.has(key)) continue;
  seen.add(key);
  redirects.push({ ...entry, to });
}

await fs.writeFile(redirectsPath, `${JSON.stringify({ redirects }, null, 2)}\n`);
console.log(`Normalized redirects.json: ${input.redirects.length} -> ${redirects.length}`);
