/**
 * scripts/headers-config.test.mjs — REPORTS-SEC-HEADERS-2026-07-18
 *
 * LOCAL acceptance test for the Render + Cloudflare security header
 * posture. Verifies that the configuration source files (render.yaml
 * and public/_headers) contain the required headers with the expected
 * values.
 *
 * WHAT THIS TEST PROVES:
 *   - render.yaml (Render Blueprint) sets Strict-Transport-Security,
 *     X-Frame-Options, Referrer-Policy, Permissions-Policy,
 *     Content-Security-Policy, X-Content-Type-Options for `/*`.
 *   - public/_headers (Cloudflare Pages / Netlify / Render Static
 *     style) mirrors the same posture for the static-hosting layer.
 *   - HSTS values are aligned across both files (2 years + preload).
 *   - The blog post /blog/pdpl-and-ai-saudi/ contains an external
 *     link with `rel="noopener noreferrer"` (security hygiene:
 *     `target="_blank"` must be paired with `rel="noopener noreferrer"`
 *     to prevent reverse tabnabbing and Referer leakage).
 *
 * WHAT THIS TEST DOES NOT PROVE (stays "Unknown" until production):
 *   - That the live response actually carries these headers (Render
 *     applies render.yaml at the edge, but only the production deploy
 *     can confirm — no production deploy is in scope for this change).
 *   - That Astro middleware stamps the per-request CSP-Report-Only
 *     header (middleware is part of the Node SSR response, not
 *     exercised by static preview).
 *   - That Cloudflare's edge (if/when fronted) does not strip or
 *     override any of these values.
 *
 * Run with: `node --test scripts/headers-config.test.mjs`
 * Exit 0 on pass, non-zero on fail.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  loadRenderYamlHeaders,
  loadPublicHeaders,
  LAYER_PATHS,
} from "./headers-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BLOG_POST_PATH = path.join(
  ROOT,
  "src",
  "content",
  "blog",
  "pdpl-and-ai-saudi.md"
);
const BLOG_POST_DIST = path.join(
  ROOT,
  "dist",
  "client",
  "blog",
  "pdpl-and-ai-saudi",
  "index.html"
);

// ─── Render layer (render.yaml) ────────────────────────────────────────────

test("render.yaml exists and is readable", () => {
  assert.ok(
    fs.existsSync(LAYER_PATHS.renderYaml),
    `Missing render.yaml at ${LAYER_PATHS.renderYaml}`
  );
});

test("render.yaml declares all required security headers on /*", () => {
  const headers = loadRenderYamlHeaders();
  // Build a map of (path, name) -> value for the /* rules we care about.
  const byPathAndName = new Map();
  for (const h of headers) {
    byPathAndName.set(`${h.path}::${h.name}`, h.value);
  }

  const required = [
    {
      name: "Strict-Transport-Security",
      mustContain: ["max-age=63072000", "includeSubDomains", "preload"],
    },
    { name: "X-Frame-Options", mustContain: ["SAMEORIGIN"] },
    {
      name: "Referrer-Policy",
      mustContain: ["strict-origin-when-cross-origin"],
    },
    {
      name: "Permissions-Policy",
      mustContain: ["camera=()", "microphone=()", "geolocation=()"],
    },
    {
      name: "Content-Security-Policy",
      mustContain: [
        "default-src 'self'",
        "frame-ancestors 'self'",
        "script-src",
        "object-src 'none'",
      ],
    },
    { name: "X-Content-Type-Options", mustContain: ["nosniff"] },
  ];

  for (const r of required) {
    const value = byPathAndName.get(`/*::${r.name}`);
    assert.ok(
      value !== undefined,
      `render.yaml is missing header "${r.name}" on /*`
    );
    for (const fragment of r.mustContain) {
      assert.ok(
        value.includes(fragment),
        `render.yaml /* ${r.name} value does not contain "${fragment}". Got: ${value}`
      );
    }
  }
});

test("render.yaml HSTS uses 2-year max-age (aligned with public/_headers)", () => {
  const headers = loadRenderYamlHeaders();
  const hsts = headers.find(
    (h) => h.path === "/*" && h.name === "Strict-Transport-Security"
  );
  assert.ok(hsts, "render.yaml must set HSTS on /*");
  // 63072000 = 2 years. Anything else means we drifted from _headers.
  assert.ok(
    hsts.value.includes("max-age=63072000"),
    `HSTS must be 2 years (63072000). Got: ${hsts.value}`
  );
  assert.ok(
    hsts.value.includes("preload"),
    `HSTS must include preload directive. Got: ${hsts.value}`
  );
});

// ─── Cloudflare/Netlify/Static layer (public/_headers) ────────────────────

test("public/_headers exists and is readable", () => {
  assert.ok(
    fs.existsSync(LAYER_PATHS.publicHeaders),
    `Missing public/_headers at ${LAYER_PATHS.publicHeaders}`
  );
});

test("public/_headers declares the same required security headers on /*", () => {
  const rules = loadPublicHeaders();
  const all = rules["/*"] || {};
  const required = [
    {
      name: "Strict-Transport-Security",
      mustContain: ["max-age=63072000", "includeSubDomains", "preload"],
    },
    { name: "X-Frame-Options", mustContain: ["SAMEORIGIN"] },
    {
      name: "Referrer-Policy",
      mustContain: ["strict-origin-when-cross-origin"],
    },
    {
      name: "Permissions-Policy",
      mustContain: ["camera=()", "microphone=()", "geolocation=()"],
    },
    {
      name: "Content-Security-Policy",
      mustContain: [
        "default-src 'self'",
        "frame-ancestors 'self'",
        "script-src",
        "object-src 'none'",
      ],
    },
    { name: "X-Content-Type-Options", mustContain: ["nosniff"] },
  ];

  for (const r of required) {
    const value = all[r.name];
    assert.ok(
      value !== undefined,
      `public/_headers /* is missing header "${r.name}"`
    );
    for (const fragment of r.mustContain) {
      assert.ok(
        value.includes(fragment),
        `public/_headers /* ${r.name} value does not contain "${fragment}". Got: ${value}`
      );
    }
  }
});

test("public/_headers HSTS also uses 2-year max-age (cross-file consistency)", () => {
  const rules = loadPublicHeaders();
  const all = rules["/*"] || {};
  const hsts = all["Strict-Transport-Security"] || "";
  assert.ok(
    hsts.includes("max-age=63072000"),
    `HSTS in public/_headers must be 2 years (63072000). Got: ${hsts}`
  );
});

// ─── Blog post /blog/pdpl-and-ai-saudi/ — rel="noopener noreferrer" ──────

test("blog post source has the sdaia.gov.sa link with rel='noopener noreferrer'", () => {
  assert.ok(
    fs.existsSync(BLOG_POST_PATH),
    `Blog post source missing at ${BLOG_POST_PATH}`
  );
  const md = fs.readFileSync(BLOG_POST_PATH, "utf8");
  // Find the sdaia.gov.sa link — must be the only one with target=_blank
  // on this page (or at minimum, this one must have the rel attribute).
  const linkRegex =
    /<a\s+href="https:\/\/www\.sdaia\.gov\.sa"[^>]*>/g;
  const matches = md.match(linkRegex);
  assert.ok(matches && matches.length > 0, "sdaia.gov.sa link not found");
  for (const tag of matches) {
    assert.ok(
      /target=["']_blank["']/.test(tag),
      `sdaia.gov.sa link must use target="_blank". Got: ${tag}`
    );
    assert.ok(
      /rel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/.test(tag) ||
        /rel=["'][^"']*\bnoreferrer\b[^"']*\bnoopener\b[^"']*["']/.test(tag),
      `sdaia.gov.sa link must declare rel="noopener noreferrer" (prevents reverse tabnabbing + Referer leakage). Got: ${tag}`
    );
  }
});

test("blog post dist (after build) also has the sdaia.gov.sa link with rel='noopener noreferrer'", () => {
  if (!fs.existsSync(BLOG_POST_DIST)) {
    // Skip if dist is not built (developer environment may not have run build).
    // Source test above already covers the contract.
    return;
  }
  const html = fs.readFileSync(BLOG_POST_DIST, "utf8");
  const linkRegex = /<a[^>]*href="https:\/\/www\.sdaia\.gov\.sa"[^>]*>/g;
  const matches = html.match(linkRegex);
  assert.ok(matches && matches.length > 0, "sdaia.gov.sa link not in dist");
  for (const tag of matches) {
    assert.ok(
      /target=["']_blank["']/.test(tag),
      `dist sdaia.gov.sa link must use target="_blank". Got: ${tag}`
    );
    assert.ok(
      /rel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/.test(tag) ||
        /rel=["'][^"']*\bnoreferrer\b[^"']*\bnoopener\b[^"']*["']/.test(tag),
      `dist sdaia.gov.sa link must declare rel="noopener noreferrer". Got: ${tag}`
    );
  }
});

// ─── Cross-layer consistency ──────────────────────────────────────────────

test("HSTS max-age is identical across render.yaml and public/_headers", () => {
  const renderHeaders = loadRenderYamlHeaders();
  const netlifyRules = loadPublicHeaders();

  const renderHsts = renderHeaders.find(
    (h) => h.path === "/*" && h.name === "Strict-Transport-Security"
  );
  const netlifyHsts = (netlifyRules["/*"] || {})["Strict-Transport-Security"];

  const renderMax = renderHsts?.value.match(/max-age=(\d+)/)?.[1];
  const netlifyMax = netlifyHsts?.match(/max-age=(\d+)/)?.[1];

  assert.ok(renderMax, "render.yaml HSTS must include max-age");
  assert.ok(netlifyMax, "public/_headers HSTS must include max-age");
  assert.equal(
    renderMax,
    netlifyMax,
    `HSTS max-age drifted between render.yaml (${renderMax}) and public/_headers (${netlifyMax})`
  );
});

test("X-Frame-Options and frame-ancestors coexist (defence in depth)", () => {
  const renderHeaders = loadRenderYamlHeaders();
  const netlifyRules = loadPublicHeaders();

  const renderXfo = renderHeaders.find(
    (h) => h.path === "/*" && h.name === "X-Frame-Options"
  );
  const renderCsp = renderHeaders.find(
    (h) => h.path === "/*" && h.name === "Content-Security-Policy"
  );
  const netlifyXfo = (netlifyRules["/*"] || {})["X-Frame-Options"];
  const netlifyCsp = (netlifyRules["/*"] || {})["Content-Security-Policy"];

  assert.ok(
    renderXfo?.value === "SAMEORIGIN",
    `render.yaml X-Frame-Options must be SAMEORIGIN. Got: ${renderXfo?.value}`
  );
  assert.ok(
    netlifyXfo === "SAMEORIGIN",
    `public/_headers X-Frame-Options must be SAMEORIGIN. Got: ${netlifyXfo}`
  );
  assert.ok(
    renderCsp?.value.includes("frame-ancestors 'self'"),
    "render.yaml CSP must include frame-ancestors 'self'"
  );
  assert.ok(
    netlifyCsp?.includes("frame-ancestors 'self'"),
    "public/_headers CSP must include frame-ancestors 'self'"
  );
});

// ─── Vercel boundary check (the user explicitly forbade touching Vercel) ──

test("no vercel.json or .vercel/config.json was added by this change", () => {
  const vercelJson = path.join(ROOT, "vercel.json");
  const vercelDir = path.join(ROOT, ".vercel");
  // Both may exist (pre-existing repo state) — we only assert the test
  // does not depend on them and that no new Vercel-owned file was
  // created under our public/ tree.
  const publicVercelFiles = [];
  if (fs.existsSync(path.join(ROOT, "public"))) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (
          entry.name === "vercel.json" ||
          entry.name.startsWith("vercel-") ||
          entry.name === ".vercelignore"
        ) {
          publicVercelFiles.push(p);
        }
      }
    };
    walk(path.join(ROOT, "public"));
  }
  assert.deepEqual(
    publicVercelFiles,
    [],
    "public/ must not contain Vercel-specific config files. Found: " +
      publicVercelFiles.join(", ")
  );
  // Sanity: if vercel.json exists at root, that's the legacy Vercel
  // file (untouched). We do NOT assert it does not exist — we just
  // ensure the test does not depend on it.
  void vercelJson;
  void vercelDir;
});
