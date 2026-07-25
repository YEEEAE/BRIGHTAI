import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseArgs, printHelp, run } from "./hreflang-bidirectional-audit.mjs";

// ────────────────────────────────────────────────────────────────
// parseArgs tests
// ────────────────────────────────────────────────────────────────

describe("parseArgs", () => {
  test("default values when no flags passed", () => {
    const args = parseArgs(["node", "script.js"]);
    assert.equal(args.live, false);
    assert.equal(args.host, "https://brightai.site");
    assert.equal(args.sample, 200);
    assert.equal(args.concurrency, 10);
    assert.equal(args.timeout, 15000);
    assert.equal(args.report, null);
    assert.equal(args.showHelp, false);
  });

  test("--live sets live=true", () => {
    const args = parseArgs(["node", "script.js", "--live"]);
    assert.equal(args.live, true);
  });

  test("--local sets live=false (parity with check-mobile-375)", () => {
    const args = parseArgs(["node", "script.js", "--live", "--local"]);
    assert.equal(args.live, false);
  });

  test("--host accepts URL", () => {
    const args = parseArgs(["node", "script.js", "--host", "https://staging.brightai.site"]);
    assert.equal(args.host, "https://staging.brightai.site");
  });

  test("--sample parses integer", () => {
    const args = parseArgs(["node", "script.js", "--sample", "50"]);
    assert.equal(args.sample, 50);
  });

  test("--concurrency parses integer", () => {
    const args = parseArgs(["node", "script.js", "--concurrency", "5"]);
    assert.equal(args.concurrency, 5);
  });

  test("--timeout parses integer", () => {
    const args = parseArgs(["node", "script.js", "--timeout", "30000"]);
    assert.equal(args.timeout, 30000);
  });

  test("--report captures path", () => {
    const args = parseArgs(["node", "script.js", "--report", "/tmp/out.json"]);
    assert.equal(args.report, "/tmp/out.json");
  });

  test("-h sets showHelp=true", () => {
    const args = parseArgs(["node", "script.js", "-h"]);
    assert.equal(args.showHelp, true);
  });

  test("--help sets showHelp=true", () => {
    const args = parseArgs(["node", "script.js", "--help"]);
    assert.equal(args.showHelp, true);
  });
});

// ────────────────────────────────────────────────────────────────
// printHelp tests
// ────────────────────────────────────────────────────────────────

describe("printHelp", () => {
  test("contains Usage line", () => {
    const originalLog = console.log;
    const captured = [];
    console.log = (...args) => captured.push(args.join(" "));
    try {
      printHelp();
    } finally {
      console.log = originalLog;
    }
    const out = captured.join("\n");
    assert.match(out, /Usage: node scripts\/hreflang-bidirectional-audit\.mjs/);
    assert.match(out, /--live/);
    assert.match(out, /--host/);
    assert.match(out, /--sample/);
    assert.match(out, /Exit codes/);
  });
});

// ────────────────────────────────────────────────────────────────
// run() tests — filesystem source (in-process, no I/O)
// ────────────────────────────────────────────────────────────────

describe("run with filesystem source", () => {
  test("exit 0 when fixtures have valid hreflang (regression check)", async () => {
    // NOTE: Uses /privacy-policy/ ↔ /en/privacy-policy/ because they are in the
    // explicit bilingual pair map (src/data/hreflang-pairs.ts). /about/ is NOT
    // in the pair map, so /en/about/ would be flagged by checkArOnlyPageNoEnAlternate
    // as an "invented en" — violating the BAI-SEO-003-S3 invariant. The happy
    // path must use a URL pair that is genuinely bilingual per the pair map.
    const sampleIndex = new Map([
      ["https://brightai.site/privacy-policy/", {
        file: "/fake/privacy-policy.html",
        alternates: new Map([
          ["ar-SA", "https://brightai.site/privacy-policy/"],
          ["en-SA", "https://brightai.site/en/privacy-policy/"],
          ["x-default", "https://brightai.site/privacy-policy/"],
        ]),
      }],
      ["https://brightai.site/en/privacy-policy/", {
        file: "/fake/en/privacy-policy.html",
        alternates: new Map([
          ["en-SA", "https://brightai.site/en/privacy-policy/"],
          ["ar-SA", "https://brightai.site/privacy-policy/"],
          ["x-default", "https://brightai.site/privacy-policy/"],
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {};

    // Capture process.exit
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: "filesystem", args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, null, "should not exit when no errors");
  });

  test("exit 1 when reciprocity fails (missing return tag)", async () => {
    const sampleIndex = new Map([
      ["https://brightai.site/about/", {
        file: "/fake/about.html",
        alternates: new Map([
          ["ar-SA", "https://brightai.site/about/"],
          ["ar-EG", "https://brightai.site/eg/about/"], // target exists but doesn't return
          ["x-default", "https://brightai.site/about/"],
        ]),
      }],
      ["https://brightai.site/eg/about/", {
        file: "/fake/eg/about.html",
        alternates: new Map([
          ["ar-EG", "https://brightai.site/eg/about/"],
          // MISSING: no return to /about/
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: "filesystem", args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, 1, "should exit 1 on reciprocity violation");
  });

  test("exit 1 when x-default points to /en/", async () => {
    const sampleIndex = new Map([
      ["https://brightai.site/about/", {
        file: "/fake/about.html",
        alternates: new Map([
          ["ar-SA", "https://brightai.site/about/"],
          ["x-default", "https://brightai.site/en/about/"], // VIOLATION per AC#3
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: "filesystem", args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, 1);
  });

  test("exit 1 when AR-only page invents en-SA (BAI-SEO-003-S3 invariant)", async () => {
    const sampleIndex = new Map([
      ["https://brightai.site/blog/some-post/", {
        file: "/fake/blog/some-post.html",
        alternates: new Map([
          ["ar-SA", "https://brightai.site/blog/some-post/"],
          ["en-SA", "https://brightai.site/en/blog/some-post/"], // VIOLATION: invented
          ["x-default", "https://brightai.site/blog/some-post/"],
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: "filesystem", args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, 1);
  });

  test("skips non-200 check in live mode (filesystem-only)", async () => {
    // If non-200 is checked in live mode, we'd try to read non-existent files.
    // Live mode should ONLY call fetchLive and skip filesystem-specific checks.
    const sampleIndex = new Map();
    const fetchLive = async () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: "live", args: { host: "https://test", sample: 0 }, fetchLive, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    // Empty index → 0 errors → no exit (exitCode stays null)
    assert.equal(exitCode, null);
  });
});

// ────────────────────────────────────────────────────────────────
// run() with JSON report writer
// ────────────────────────────────────────────────────────────────

describe("run with JSON report", () => {
  test("writes JSON file when args.report is set", async () => {
    const sampleIndex = new Map([
      ["https://brightai.site/about/", {
        file: "/fake/about.html",
        alternates: new Map([
          ["ar-SA", "https://brightai.site/about/"],
          ["x-default", "https://brightai.site/about/"],
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportPath = "/tmp/hreflang-test-report.json";
    const fs = await import("node:fs/promises");
    const reportWriter = async (path, data) => {
      await fs.writeFile(path, JSON.stringify(data, null, 2));
    };

    const originalExit = process.exit;
    process.exit = () => {};
    try {
      await run({
        source: "filesystem",
        args: { report: reportPath },
        fetchFilesystem,
        reportWriter,
      });
    } finally {
      process.exit = originalExit;
    }
    const written = await fs.readFile(reportPath, "utf8");
    const parsed = JSON.parse(written);
    assert.equal(parsed.errors.missingReturn, 0);
    assert.ok(Array.isArray(parsed.violations));
    assert.equal(typeof parsed.timestamp, "string");
    await fs.unlink(reportPath);
  });
});
