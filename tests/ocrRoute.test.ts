import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { POST } from "../app/api/demo/ocr/route";
import { OCR_FALLBACK_RESULT } from "../lib/demo/ocr";
import { ratelimit } from "@/lib/ratelimit";

const googleMock = vi.hoisted(() => ({
  generateContent: vi.fn()
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: googleMock.generateContent
    })
  })),
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: "BLOCK_MEDIUM_AND_ABOVE"
  },
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
    HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
    HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT"
  }
}));

vi.mock("@/lib/ratelimit", () => ({
  ratelimit: vi.fn()
}));

vi.mock("@/lib/analytics/audit", () => ({
  recordAuditEvent: vi.fn()
}));

function makeRequest(body: unknown): Request {
  return new Request("https://brightai.site/api/demo/ocr/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": "127.0.0.1"
    },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    documentKind: "invoice",
    prompt: "فاتورة تجريبية طويلة بما يكفي لاختبار مسار التحليل.",
    ...overrides
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("/api/demo/ocr", () => {
  let consoleError: MockInstance<Parameters<typeof console.error>, ReturnType<typeof console.error>>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    vi.mocked(ratelimit).mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60_000 });
    googleMock.generateContent.mockReset();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("يرفض طلب JSON غير صالح كخطأ صيغة طلب ولا يستدعي النموذج", async () => {
    const response = await POST(makeRequest("{not-json"));
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "صيغة JSON في الطلب غير صالحة." });
    expect(googleMock.generateContent).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[brightai-ocr-demo]",
      expect.objectContaining({ kind: "request_json", message: "INVALID_REQUEST_JSON" })
    );
  });

  it("يرفض المدخلات غير المكتملة كخطأ تحقق دون استدعاء النموذج", async () => {
    const response = await POST(makeRequest(validPayload({ prompt: "قصير" })));
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "المدخلات غير مكتملة أو تتجاوز الحد المسموح." });
    expect(googleMock.generateContent).not.toHaveBeenCalled();
  });

  it("يرفض محتوى الملف عندما لا يرسل العميل نوع الملف", async () => {
    const response = await POST(makeRequest(validPayload({ fileBase64: "abc123" })));
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "نوع الملف مطلوب عند إرسال محتوى ملف." });
    expect(googleMock.generateContent).not.toHaveBeenCalled();
  });

  it("يرفض نوع الملف غير المدعوم قبل استدعاء النموذج", async () => {
    const response = await POST(makeRequest(validPayload({ fileMime: "text/plain", fileBase64: "abc123" })));
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "نوع الملف غير مدعوم. المقبول: صور PNG وJPG وWEBP أو PDF." });
    expect(googleMock.generateContent).not.toHaveBeenCalled();
  });

  it("يعيد النتيجة الاحتياطية عند فشل استدعاء النموذج مع تصنيف الخطأ", async () => {
    googleMock.generateContent.mockRejectedValue(new Error("provider unavailable"));

    const response = await POST(makeRequest(validPayload()));
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, model: "sample-fallback", result: OCR_FALLBACK_RESULT });
    expect(consoleError).toHaveBeenCalledWith(
      "[brightai-ocr-demo]",
      expect.objectContaining({ kind: "model", message: "MODEL_GENERATION_FAILED" })
    );
  });

  it("يعيد النتيجة الاحتياطية عند رجوع النموذج بنص لا يحتوي JSON", async () => {
    googleMock.generateContent.mockResolvedValue({
      response: {
        text: () => "لا توجد صيغة JSON هنا"
      }
    });

    const response = await POST(makeRequest(validPayload()));
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, model: "sample-fallback", result: OCR_FALLBACK_RESULT });
    expect(consoleError).toHaveBeenCalledWith(
      "[brightai-ocr-demo]",
      expect.objectContaining({ kind: "model_json", message: "NO_JSON" })
    );
  });

  it("يعيد النتيجة الاحتياطية عندما تكون صيغة JSON صحيحة لكن لا تطابق مخطط النتيجة", async () => {
    googleMock.generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ documentType: "فاتورة", confidence: 0.9 })
      }
    });

    const response = await POST(makeRequest(validPayload()));
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, model: "sample-fallback", result: OCR_FALLBACK_RESULT });
    expect(consoleError).toHaveBeenCalledWith(
      "[brightai-ocr-demo]",
      expect.objectContaining({ kind: "model_validation", message: "MODEL_RESULT_VALIDATION_FAILED" })
    );
  });
});
