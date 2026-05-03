import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/analytics/audit";
import {
  buildOcrPrompt,
  OCR_FALLBACK_RESULT,
  OcrInputSchema,
  OcrResultSchema,
  SUPPORTED_OCR_FILE_MIME_TYPES
} from "@/lib/demo/ocr";
import { ratelimit } from "@/lib/ratelimit";
import { containsSensitivePII, sanitizeText } from "@/lib/security/pii";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OcrFailureKind = "request_json" | "model" | "model_json" | "model_validation";

class OcrRouteError extends Error {
  constructor(
    readonly kind: OcrFailureKind,
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "OcrRouteError";
  }
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    if (trimmed.startsWith("{")) return JSON.parse(trimmed);
    const match = trimmed.match(/\{[\s\S]*\}/u);
    if (!match) throw new OcrRouteError("model_json", "NO_JSON");
    return JSON.parse(match[0]);
  } catch (error) {
    if (error instanceof OcrRouteError) throw error;
    throw new OcrRouteError("model_json", "INVALID_MODEL_JSON", error);
  }
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch (error) {
    throw new OcrRouteError("request_json", "INVALID_REQUEST_JSON", error);
  }
}

function normalizeOcrError(error: unknown): OcrRouteError {
  if (error instanceof OcrRouteError) return error;
  return new OcrRouteError("model", "MODEL_GENERATION_FAILED", error);
}

function logOcrFailure(error: OcrRouteError): void {
  console.error("[brightai-ocr-demo]", { kind: error.kind, message: error.message, cause: error.cause });
}

function fallbackResponse(modelName: string, ipHash: string) {
  recordAuditEvent({ route: "/api/demo/ocr", ipHash, status: "fallback", model: modelName });
  return NextResponse.json({ ok: true, model: "sample-fallback", result: OCR_FALLBACK_RESULT });
}

const supportedFileMimes = new Set<string>(SUPPORTED_OCR_FILE_MIME_TYPES);

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipHash = await hashIp(ip);
  const limited = await ratelimit(`ocr:${ip}`);

  if (!limited.success) {
    recordAuditEvent({ route: "/api/demo/ocr", ipHash, status: "blocked" });
    return NextResponse.json(
      { error: "تم الوصول للحد المؤقت للتجربة. جرّب بعد دقيقة أو تواصل معنا للنسخة المخصصة." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await readJsonBody(req);
  } catch (error) {
    logOcrFailure(normalizeOcrError(error));
    return NextResponse.json({ error: "صيغة JSON في الطلب غير صالحة." }, { status: 400 });
  }

  const parsed = OcrInputSchema.safeParse({
    ...(rawBody && typeof rawBody === "object" ? rawBody : {}),
    prompt: sanitizeText(String(rawBody && typeof rawBody === "object" && "prompt" in rawBody ? rawBody.prompt : ""))
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "المدخلات غير مكتملة أو تتجاوز الحد المسموح." }, { status: 400 });
  }

  if (containsSensitivePII(parsed.data.prompt)) {
    recordAuditEvent({ route: "/api/demo/ocr", ipHash, status: "blocked" });
    return NextResponse.json(
      { error: "لا ترفع أرقام هوية أو بطاقات أو بريد شخصي في الديمو العام. استخدم عينة غير حساسة." },
      { status: 400 }
    );
  }

  if (parsed.data.fileBase64 && !parsed.data.fileMime) {
    return NextResponse.json({ error: "نوع الملف مطلوب عند إرسال محتوى ملف." }, { status: 400 });
  }

  if (parsed.data.fileMime && !supportedFileMimes.has(parsed.data.fileMime)) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم. المقبول: صور PNG وJPG وWEBP أو PDF." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = "gemini-2.5-flash";

  if (!apiKey) {
    recordAuditEvent({ route: "/api/demo/ocr", ipHash, status: "fallback", model: "sample" });
    return NextResponse.json({ ok: true, model: "sample-fallback", result: OCR_FALLBACK_RESULT });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction:
        "أنت محلل وثائق خبير في Bright AI للسوق السعودي. أجب بالعربية المهنية. أعد JSON فقط. لا تحفظ البيانات ولا تعط قرارات نهائية.",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.25
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
      ]
    });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: buildOcrPrompt(parsed.data) }
    ];

    if (parsed.data.fileBase64 && parsed.data.fileMime) {
      parts.push({ inlineData: { mimeType: parsed.data.fileMime, data: parsed.data.fileBase64 } });
    }

    let response;
    try {
      response = await model.generateContent({ contents: [{ role: "user", parts }] });
    } catch (error) {
      throw new OcrRouteError("model", "MODEL_GENERATION_FAILED", error);
    }

    const text = response.response.text();
    const modelJson = extractJson(text);
    const resultParse = OcrResultSchema.safeParse(modelJson);
    if (!resultParse.success) {
      throw new OcrRouteError("model_validation", "MODEL_RESULT_VALIDATION_FAILED", resultParse.error);
    }

    recordAuditEvent({ route: "/api/demo/ocr", ipHash, status: "accepted", model: modelName });
    return NextResponse.json({ ok: true, model: modelName, result: resultParse.data });
  } catch (error) {
    logOcrFailure(normalizeOcrError(error));
    return fallbackResponse(modelName, ipHash);
  }
}
