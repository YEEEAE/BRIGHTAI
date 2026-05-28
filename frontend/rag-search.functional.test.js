import { afterEach, describe, expect, it, vi } from "vitest";

const TRACKED_ENV_KEYS = [
  "NODE_ENV",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GROQ_API_KEY",
  "RAG_MAX_FILES",
  "RAG_INDEX_REFRESH_MS",
  "RAG_MAX_FILE_BYTES"
];

async function loadRagService(envOverrides = {}) {
  const previousEnv = {};

  for (const key of TRACKED_ENV_KEYS) {
    previousEnv[key] = process.env[key];
  }

  process.env.NODE_ENV = "test";
  process.env.GEMINI_API_KEY = envOverrides.GEMINI_API_KEY ?? "";
  process.env.GOOGLE_API_KEY = envOverrides.GOOGLE_API_KEY ?? "";
  process.env.GROQ_API_KEY = envOverrides.GROQ_API_KEY ?? "";
  process.env.RAG_MAX_FILES = String(envOverrides.RAG_MAX_FILES ?? 80);
  process.env.RAG_INDEX_REFRESH_MS = String(envOverrides.RAG_INDEX_REFRESH_MS ?? 60000);
  process.env.RAG_MAX_FILE_BYTES = String(envOverrides.RAG_MAX_FILE_BYTES ?? 400000);

  vi.resetModules();
  const module = await import("./services/ragSearch.js");

  return {
    ...module,
    restoreEnv() {
      for (const key of TRACKED_ENV_KEYS) {
        const value = previousEnv[key];
        if (typeof value === "undefined") {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RAG Search Service", () => {
  it("returns retrieval-based answer with sources when Groq is not configured", async () => {
    const runtime = await loadRagService({ GROQ_API_KEY: "" });

    try {
      const output = await runtime.searchSiteWithRag("ما هي حلول الأتمتة للمستشفيات؟", {
        maxSources: 5,
        retrievalLimit: 10
      });

      expect(output).toBeTruthy();
      expect(output.mode).toBe("retrieval_only");
      expect(Array.isArray(output.sources)).toBe(true);
      expect(output.sources.length).toBeGreaterThan(0);
      expect(Array.isArray(output.results)).toBe(true);
      expect(output.results.length).toBeGreaterThan(0);
      expect(typeof output.answer).toBe("string");
      expect(output.answer.length).toBeGreaterThan(10);
    } finally {
      runtime.restoreEnv();
    }
  });

  it("retrieves real public HTML pages for Arabic and English site-search queries", async () => {
    const runtime = await loadRagService({ RAG_MAX_FILES: 80 });

    try {
      const cases = [
        {
          query: "وكلاء ذكاء اصطناعي",
          expectedUrlPattern: /\/(services|demo\/ai-tenders-analysis)\//
        },
        {
          query: "الشات بوت",
          expectedUrlPattern: /\/(services|kernel\/chat|demo\/ai-reject-dashboard)\//
        },
        {
          query: "الرعاية الصحية",
          expectedUrlPattern: /\/(services|docs|about)\//
        },
        {
          query: "تحليل البيانات",
          expectedUrlPattern: /\/(services|demo\/ai-tenders-analysis)\//
        },
        {
          query: "AI agents Saudi Arabia",
          expectedUrlPattern: /\/(services|docs|demo\/ai-tenders-analysis)\//
        }
      ];

      for (const testCase of cases) {
        const matches = runtime.retrieveRelevantChunks(testCase.query, {
          limit: 6,
          maxPerUrl: 1
        });

        expect(matches.length, testCase.query).toBeGreaterThan(0);
        expect(
          matches.some(item => testCase.expectedUrlPattern.test(item.url)),
          `${testCase.query}: ${matches.map(item => item.url).join(", ")}`
        ).toBe(true);
      }
    } finally {
      runtime.restoreEnv();
    }
  });
});
