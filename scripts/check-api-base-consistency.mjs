#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = "/Users/yzydalshmry/Desktop/BRIGHTAI";

function readExistingSource(candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(repoRoot, candidate);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, "utf8");
    }
  }
  throw new Error(`Missing expected source file. Tried: ${candidates.join(", ")}`);
}

const runtimeConfigSource = readExistingSource([
  "frontend/js/runtime-config.js",
  "frontend/js/runtime-config.min.js"
]);
const apiGatewaySource = readExistingSource([
  "frontend/js/api-gateway.js",
  "frontend/js/api-gateway.min.js"
]);
const tendersConfigSource = fs.readFileSync(
  path.join(repoRoot, "tenders/api-config.js"),
  "utf8"
);

function createBrowserContext({ hostname, explicitBase }) {
  const document = {
    readyState: "loading",
    body: {
      insertBefore() {}
    },
    createElement() {
      return {
        style: {},
        appendChild() {},
        addEventListener() {},
        setAttribute() {},
        remove() {},
        textContent: ""
      };
    },
    getElementById() {
      return null;
    },
    addEventListener() {},
    querySelector() {
      return null;
    }
  };

  const windowObject = {
    location: {
      hostname,
      pathname: "/",
      search: "",
      origin: hostname === "localhost" ? "http://localhost:4321" : "https://brightai.site"
    },
    document,
    console,
    setTimeout,
    clearTimeout,
    setInterval() {
      return 0;
    },
    clearInterval() {},
    fetch: async () => {
      throw new Error("network disabled in config smoke check");
    }
  };

  document.defaultView = windowObject;

  if (explicitBase) {
    windowObject.BRIGHTAI_API_BASE = explicitBase;
  }

  const context = {
    window: windowObject,
    document,
    console,
    setTimeout,
    clearTimeout,
    setInterval: windowObject.setInterval,
    clearInterval: windowObject.clearInterval,
    fetch: windowObject.fetch,
    globalThis: windowObject
  };

  windowObject.globalThis = windowObject;
  return vm.createContext(context);
}

function loadScripts(context, sources) {
  for (const source of sources) {
    vm.runInContext(source, context, { timeout: 2000 });
  }
  return context.window;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}" but received "${actual}"`);
  }
}

function runChecks() {
  const localWindow = loadScripts(
    createBrowserContext({ hostname: "localhost" }),
    [runtimeConfigSource]
  );
  assertEqual(
    localWindow.BrightAIRuntimeConfig.getApiBase(),
    "http://localhost:3000",
    "Localhost API base"
  );
  assertEqual(
    localWindow.BrightAIRuntimeConfig.buildApiUrl("/api/health"),
    "http://localhost:3000/api/health",
    "Localhost health URL"
  );

  const productionWindow = loadScripts(
    createBrowserContext({ hostname: "brightai.site" }),
    [runtimeConfigSource, apiGatewaySource]
  );
  assertEqual(
    productionWindow.BrightAIRuntimeConfig.getApiBase(),
    "/",
    "Production API base"
  );
  assertEqual(
    productionWindow.BrightAIRuntimeConfig.buildApiUrl("/api/health"),
    "/api/health",
    "Production health URL"
  );
  assertEqual(
    productionWindow.BrightAIGateway.buildUrl("/api/gemini/chat"),
    "/api/gemini/chat",
    "Gateway chat URL"
  );

  const explicitBaseWindow = loadScripts(
    createBrowserContext({
      hostname: "brightai.site",
      explicitBase: "https://api.example.test"
    }),
    [runtimeConfigSource, apiGatewaySource, tendersConfigSource]
  );

  assertEqual(
    explicitBaseWindow.BrightAIRuntimeConfig.getApiBase(),
    "https://api.example.test",
    "Explicit API base"
  );
  assertEqual(
    explicitBaseWindow.BrightAIGateway.buildUrl("/api/health"),
    "https://api.example.test/api/health",
    "Gateway health URL"
  );
  assertEqual(
    explicitBaseWindow.BrightAIGateway.buildUrl("/api/ai/openai-chat"),
    "https://api.example.test/api/ai/openai-chat",
    "Gateway OpenAI-compatible URL"
  );
  assertEqual(
    explicitBaseWindow.ContractAIAPI.API_CONFIG.settings.buildApiUrl("/api/health"),
    "https://api.example.test/api/health",
    "Tenders health URL"
  );
  assertEqual(
    explicitBaseWindow.ContractAIAPI.API_CONFIG.settings.getProxyUrl("/api/ai/chat/completions"),
    "https://api.example.test/api/ai/chat/completions",
    "Tenders proxy URL"
  );

  console.log("API base consistency checks passed.");
}

runChecks();
