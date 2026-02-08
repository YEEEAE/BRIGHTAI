export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqRequest = {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
};

export type GroqChoice = {
  index: number;
  message: GroqMessage;
  finish_reason: string | null;
};

export type GroqUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type GroqResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
  usage: GroqUsage;
};

export type ModelInfo = {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  pricing: {
    per1K: number;
    currency: "USD";
  };
};

export type GroqErrorCode =
  | "NETWORK_ERROR"
  | "INVALID_API_KEY"
  | "RATE_LIMIT"
  | "MODEL_NOT_AVAILABLE"
  | "TOKEN_LIMIT_EXCEEDED"
  | "TIMEOUT"
  | "UNKNOWN";

export class GroqError extends Error {
  code: GroqErrorCode;
  status?: number;
  constructor(message: string, code: GroqErrorCode, status?: number) {
    super(message);
    this.name = "GroqError";
    this.code = code;
    this.status = status;
  }
}

type TokenTotals = {
  prompt: number;
  completion: number;
  total: number;
  requests: number;
};

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 3;
const BASE_URL = "https://api.groq.com/openai/v1";

const MODEL_CATALOG: ModelInfo[] = [
  {
    id: "llama-3.1-405b-reasoning",
    name: "لاما ٣.١ بقدرات استدلال عالية",
    description: "أفضل نموذج للاستدلال المعقد والتحليل العميق.",
    contextWindow: 128000,
    pricing: {
      per1K: Number(process.env.REACT_APP_GROQ_PRICE_405B || "0"),
      currency: "USD",
    },
  },
  {
    id: "llama-3.1-70b-versatile",
    name: "لاما ٣.١ متعدد الاستخدام",
    description: "توازن بين الأداء والسرعة للتطبيقات المؤسسية.",
    contextWindow: 128000,
    pricing: {
      per1K: Number(process.env.REACT_APP_GROQ_PRICE_70B || "0"),
      currency: "USD",
    },
  },
  {
    id: "llama-3.1-8b-instant",
    name: "لاما ٣.١ سريع الاستجابة",
    description: "زمن استجابة منخفض للمهام التفاعلية.",
    contextWindow: 128000,
    pricing: {
      per1K: Number(process.env.REACT_APP_GROQ_PRICE_8B || "0"),
      currency: "USD",
    },
  },
  {
    id: "mixtral-8x7b-32768",
    name: "ميكسترال ٨×٧بي",
    description: "أداء قوي للمهام متعددة الخطوات.",
    contextWindow: 32768,
    pricing: {
      per1K: Number(process.env.REACT_APP_GROQ_PRICE_MIXTRAL || "0"),
      currency: "USD",
    },
  },
  {
    id: "gemma2-9b-it",
    name: "جيما ٢",
    description: "خيار اقتصادي للمهام النصية المتوسطة.",
    contextWindow: 8192,
    pricing: {
      per1K: Number(process.env.REACT_APP_GROQ_PRICE_GEMMA2 || "0"),
      currency: "USD",
    },
  },
];

/**
 * خدمة تكامل مع واجهة Groq للمحادثات والبث المباشر.
 */
export class GroqService {
  private apiKey: string;
  private timeoutMs: number;
  private retries: number;
  private usageTotals: TokenTotals = {
    prompt: 0,
    completion: 0,
    total: 0,
    requests: 0,
  };

  /**
   * إنشاء عميل Groq مع إعدادات مخصصة.
   */
  constructor(
    apiKey?: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    retries: number = DEFAULT_RETRIES
  ) {
    this.apiKey = apiKey || process.env.REACT_APP_GROQ_API_KEY || "";
    this.timeoutMs = timeoutMs;
    this.retries = retries;
  }

  /**
   * تنفيذ محادثة غير متدفقة وإرجاع الاستجابة كاملة.
   */
  async chat(request: GroqRequest): Promise<GroqResponse> {
    const response = await this.request<GroqResponse>("/chat/completions", {
      ...request,
      stream: false,
    });
    this.trackUsage(response.usage);
    return response;
  }

  /**
   * بث الاستجابة مباشرة وإرجاع أجزاء النص على هيئة مولد غير متزامن.
   */
  async *streamChat(request: GroqRequest): AsyncGenerator<string> {
    const response = await this.request<Response>(
      "/chat/completions",
      { ...request, stream: true },
      true
    );

    if (!response.body) {
      throw new GroqError("تعذر بدء البث المباشر للاستجابة.", "UNKNOWN");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) {
          continue;
        }
        const payload = line.replace("data:", "").trim();
        if (payload === "[DONE]") {
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const delta =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.choices?.[0]?.message?.content ??
            "";

          if (delta) {
            yield delta;
          }

          if (parsed?.usage) {
            this.trackUsage(parsed.usage);
          }
        } catch {
          throw new GroqError("تعذر تحليل بيانات البث المباشر.", "UNKNOWN");
        }
      }
    }
  }

  /**
   * إرجاع قائمة النماذج المدعومة.
   */
  getAvailableModels(): ModelInfo[] {
    return MODEL_CATALOG;
  }

  /**
   * حساب تكلفة الطلب وفق عدد الرموز والنموذج.
   */
  calculateCost(model: string, tokens: number): number {
    const modelInfo = MODEL_CATALOG.find((item) => item.id === model);
    if (!modelInfo) {
      throw new GroqError("النموذج غير متاح.", "MODEL_NOT_AVAILABLE");
    }
    return (tokens / 1000) * modelInfo.pricing.per1K;
  }

  /**
   * التحقق من صحة مفتاح Groq.
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await this.request<Response>("/models", null, false, apiKey, "GET");
      return response.ok;
    } catch (error) {
      if (error instanceof GroqError && error.code === "INVALID_API_KEY") {
        return false;
      }
      throw error;
    }
  }

  /**
   * إرجاع إجمالي استخدام الرموز لهذا العميل.
   */
  getUsageTotals() {
    return { ...this.usageTotals };
  }

  private trackUsage(usage?: GroqUsage) {
    if (!usage) {
      return;
    }
    this.usageTotals.prompt += usage.prompt_tokens || 0;
    this.usageTotals.completion += usage.completion_tokens || 0;
    this.usageTotals.total += usage.total_tokens || 0;
    this.usageTotals.requests += 1;
  }

  private async request<T>(
    path: string,
    payload: GroqRequest | null,
    isStream = false,
    overrideApiKey?: string,
    method: "POST" | "GET" = "POST"
  ): Promise<T> {
    if (!this.apiKey && !overrideApiKey) {
      throw new GroqError("مفتاح Groq غير متوفر.", "INVALID_API_KEY");
    }

    const attemptRequest = async (attempt: number): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(
        () => controller.abort(),
        this.timeoutMs
      );

      try {
        const response = await fetch(`${BASE_URL}${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${overrideApiKey || this.apiKey}`,
            "X-Request-Id": this.generateRequestId(),
          },
          body: payload && method === "POST" ? JSON.stringify(payload) : undefined,
          signal: controller.signal,
        });

        if (!response.ok) {
          await this.handleErrorResponse(response, attempt);
        }

        if (isStream) {
          return response as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof GroqError) {
          throw error;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new GroqError("انتهت مهلة الطلب.", "TIMEOUT");
        }
        if (attempt < this.retries) {
          await this.sleep(this.calculateBackoff(attempt));
          return attemptRequest(attempt + 1);
        }
        throw new GroqError("خطأ في الشبكة أثناء الاتصال.", "NETWORK_ERROR");
      } finally {
        globalThis.clearTimeout(timeoutId);
      }
    };

    return attemptRequest(0);
  }

  private async handleErrorResponse(response: Response, attempt: number) {
    const status = response.status;
    const errorBody = await this.safeParseJson(response);
    const message =
      errorBody?.error?.message || "حدث خطأ غير متوقع أثناء طلب Groq.";

    if (status === 401 || status === 403) {
      throw new GroqError("مفتاح Groq غير صالح.", "INVALID_API_KEY", status);
    }
    if (status === 429) {
      if (attempt < this.retries) {
        const retryAfter = Number(response.headers.get("Retry-After") || "1");
        await this.sleep(
          Math.max(retryAfter * 1000, this.calculateBackoff(attempt))
        );
        return;
      }
      throw new GroqError("تم تجاوز حد الاستخدام المؤقت.", "RATE_LIMIT", status);
    }
    if (status >= 500 && attempt < this.retries) {
      await this.sleep(this.calculateBackoff(attempt));
      return;
    }
    if (message.includes("model") || message.includes("not found")) {
      throw new GroqError("النموذج غير متاح.", "MODEL_NOT_AVAILABLE", status);
    }
    if (message.includes("context") || message.includes("token")) {
      throw new GroqError("تجاوز حد الرموز المسموح.", "TOKEN_LIMIT_EXCEEDED", status);
    }

    throw new GroqError(message, "UNKNOWN", status);
  }

  private calculateBackoff(attempt: number) {
    const baseDelay = 500;
    return baseDelay * Math.pow(2, attempt);
  }

  private sleep(duration: number) {
    return new Promise((resolve) => globalThis.setTimeout(resolve, duration));
  }

  private async safeParseJson(response: Response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private generateRequestId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `req_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  }
}

const groqService = new GroqService();

export default groqService;
