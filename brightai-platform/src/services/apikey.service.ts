import supabase from "../lib/supabase";
import { trackApiKeyAdded } from "../lib/analytics";

export type ApiProvider =
  | "groq"
  | "openai"
  | "anthropic"
  | "google"
  | "custom";

export type ApiKey = {
  id: string;
  provider: ApiProvider;
  name: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  is_default: boolean;
};

type ApiKeyRow = {
  id: string;
  provider: string;
  name: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type TestResult = {
  success: boolean;
  provider: ApiProvider;
  message: string;
  rateLimited?: boolean;
  permissionsOk?: boolean;
};

export type ApiKeyErrorCode =
  | "INVALID_FORMAT"
  | "ENCRYPTION_FAILED"
  | "DECRYPTION_FAILED"
  | "PROVIDER_ERROR"
  | "NETWORK_ERROR"
  | "RATE_LIMIT"
  | "XSS_DETECTED"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export class ApiKeyError extends Error {
  code: ApiKeyErrorCode;
  constructor(message: string, code: ApiKeyErrorCode) {
    super(message);
    this.name = "ApiKeyError";
    this.code = code;
  }
}

const STORAGE_PREFIX = "brightai_apikey";
const VALIDATION_LIMIT = 5;
const VALIDATION_WINDOW_MS = 10 * 60 * 1000;
const WRAP_ITERATIONS = 120000;
const DEFAULT_TIMEOUT_MS = 10000;
const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
};

/**
 * خدمة إدارة مفاتيح التكامل مع تشفير محلي.
 */
export class ApiKeyService {
  /**
   * تشفير المفتاح قبل الإرسال إلى قاعدة البيانات.
   */
  async encryptKey(plainKey: string): Promise<string> {
    this.ensureSafeContext();
    const userId = await this.getUserId();
    const cryptoKey = await this.getUserCryptoKey(userId);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = encoder.encode(plainKey);

    try {
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        data
      );
      const encryptedBytes = new Uint8Array(encrypted);
      const payload = `enc:v1:${this.bytesToBase64(iv)}:${this.bytesToBase64(
        encryptedBytes
      )}`;
      data.fill(0);
      encryptedBytes.fill(0);
      plainKey = "";
      return payload;
    } catch (error) {
      data.fill(0);
      plainKey = "";
      throw new ApiKeyError("فشل تشفير المفتاح.", "ENCRYPTION_FAILED");
    }
  }

  /**
   * فك تشفير المفتاح بعد جلبه من قاعدة البيانات.
   */
  async decryptKey(encryptedKey: string): Promise<string> {
    this.ensureSafeContext();
    const userId = await this.getUserId();
    const cryptoKey = await this.getUserCryptoKey(userId);

    const parts = encryptedKey.split(":");
    if (parts.length !== 4 || parts[0] !== "enc" || parts[1] !== "v1") {
      throw new ApiKeyError("صيغة المفتاح غير صالحة.", "DECRYPTION_FAILED");
    }

    const iv = this.base64ToBytes(parts[2]);
    const data = this.base64ToBytes(parts[3]);

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        data
      );
      const decoded = new TextDecoder().decode(decrypted);
      iv.fill(0);
      data.fill(0);
      return decoded;
    } catch (error) {
      iv.fill(0);
      data.fill(0);
      throw new ApiKeyError("فشل فك تشفير المفتاح.", "DECRYPTION_FAILED");
    }
  }

  /**
   * حفظ مفتاح جديد بعد التحقق والتشفير.
   */
  async saveApiKey(
    provider: ApiProvider,
    key: string,
    name?: string
  ): Promise<void> {
    this.ensureSafeContext();
    const userId = await this.getUserId();
    const normalizedProvider = this.normalizeProvider(provider, key);
    const safeName = this.sanitizeName(name || null);

    await this.validateApiKey(normalizedProvider, key);
    const encrypted = await this.encryptKey(key);

    const { data, error } = await supabaseClient
      .from("api_keys")
      .insert({
        provider: normalizedProvider,
        key_encrypted: encrypted,
        name: safeName,
        is_active: true,
      })
      .select("id, provider, name, is_active, last_used_at, created_at")
      .single();

    key = "";

    if (error) {
      throw new ApiKeyError("تعذر حفظ المفتاح.", "PROVIDER_ERROR");
    }

    if (data?.id) {
      await this.ensureDefaultKey(userId, normalizedProvider, data.id, safeName);
      trackApiKeyAdded(normalizedProvider);
    }
  }

  /**
   * جلب مفتاح محدد حسب المزود والاسم مع التحقق.
   */
  async getApiKey(
    provider: ApiProvider,
    name?: string
  ): Promise<string | null> {
    this.ensureSafeContext();
    const userId = await this.getUserId();
    const normalizedProvider = this.normalizeProvider(provider, "");

    const defaultId = this.getDefaultKeyId(userId, normalizedProvider);
    let query = supabaseClient
      .from("api_keys")
      .select("id, key_encrypted, provider, name, is_active")
      .eq("provider", normalizedProvider)
      .eq("is_active", true);

    if (name) {
      query = query.eq("name", name);
    } else if (defaultId) {
      query = query.eq("id", defaultId);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !data?.key_encrypted) {
      return null;
    }

    const decrypted = await this.decryptKey(data.key_encrypted);
    const valid = await this.validateApiKey(normalizedProvider, decrypted);
    if (!valid) {
      await this.disableKey(data.id);
      return null;
    }

    await this.touchKey(data.id);
    return decrypted;
  }

  /**
   * حذف مفتاح نهائياً.
   */
  async deleteApiKey(id: string): Promise<void> {
    this.ensureSafeContext();
    const userId = await this.getUserId();
    const { error } = await supabaseClient.from("api_keys").delete().eq("id", id);
    if (error) {
      throw new ApiKeyError("تعذر حذف المفتاح.", "PROVIDER_ERROR");
    }
    this.clearDefaultIfMatch(userId, id);
  }

  /**
   * إرجاع جميع المفاتيح المتاحة للمستخدم.
   */
  async listApiKeys(): Promise<ApiKey[]> {
    this.ensureSafeContext();
    const userId = await this.getUserId();
    const { data, error } = await supabaseClient
      .from("api_keys")
      .select("id, provider, name, is_active, last_used_at, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) {
      throw new ApiKeyError("تعذر جلب المفاتيح.", "PROVIDER_ERROR");
    }

    const defaults = this.getDefaultMap(userId);
    const rows = data as ApiKeyRow[];
    return rows.map((item: ApiKeyRow) => ({
      ...item,
      provider: item.provider as ApiProvider,
      is_default: defaults[item.provider] === item.id,
    }));
  }

  /**
   * التحقق من صلاحية المفتاح حسب المزود مع حدود محاولات.
   */
  async validateApiKey(provider: ApiProvider, key: string): Promise<boolean> {
    this.ensureSafeContext();
    const normalizedProvider = this.normalizeProvider(provider, key);
    this.consumeValidationSlot(normalizedProvider);

    const formatOk = this.validateFormat(normalizedProvider, key);
    if (!formatOk) {
      throw new ApiKeyError("صيغة المفتاح غير صحيحة.", "INVALID_FORMAT");
    }

    const result = await this.testApiKey(normalizedProvider, key);
    if (!result.success) {
      if (result.rateLimited) {
        throw new ApiKeyError("تم تجاوز حد التحقق.", "RATE_LIMIT");
      }
      throw new ApiKeyError(result.message, "PROVIDER_ERROR");
    }
    return true;
  }

  /**
   * اختبار المفتاح عبر نداء بسيط للمزود.
   */
  async testApiKey(provider: ApiProvider, key: string): Promise<TestResult> {
    this.ensureSafeContext();
    const normalizedProvider = this.normalizeProvider(provider, key);

    if (normalizedProvider === "custom") {
      return {
        success: true,
        provider: normalizedProvider,
        message: "تم قبول المفتاح المخصص دون تحقق خارجي.",
      };
    }

    const request = this.buildProviderRequest(normalizedProvider, key);

    try {
      const response = await this.fetchWithTimeout(
        request.url,
        request.options
      );

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          provider: normalizedProvider,
          message: "المفتاح غير صالح أو دون صلاحيات.",
          permissionsOk: false,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          provider: normalizedProvider,
          message: "تم تجاوز الحد المؤقت لدى المزود.",
          rateLimited: true,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          provider: normalizedProvider,
          message: "فشل التحقق من المفتاح.",
        };
      }

      return {
        success: true,
        provider: normalizedProvider,
        message: "تم التحقق من المفتاح بنجاح.",
        permissionsOk: true,
      };
    } catch (error) {
      if (error instanceof ApiKeyError) {
        throw error;
      }
      throw new ApiKeyError("فشل الاتصال بالمزود.", "NETWORK_ERROR");
    } finally {
      key = "";
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiKeyError("انتهت مهلة الاتصال.", "NETWORK_ERROR");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private buildProviderRequest(
    provider: ApiProvider,
    key: string
  ): { url: string; options: RequestInit } {
    switch (provider) {
      case "groq":
        {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${key}`,
          };
          return {
            url: "https://api.groq.com/openai/v1/models",
            options: {
              method: "GET",
              headers,
            },
          };
        }
      case "openai":
        {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${key}`,
          };
          return {
            url: "https://api.openai.com/v1/models",
            options: {
              method: "GET",
              headers,
            },
          };
        }
      case "anthropic":
        {
          const headers: Record<string, string> = {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          };
          return {
            url: "https://api.anthropic.com/v1/models",
            options: {
              method: "GET",
              headers,
            },
          };
        }
      case "google":
        return {
          url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
            key
          )}`,
          options: {
            method: "GET",
          },
        };
      default:
        return {
          url: "",
          options: {},
        };
    }
  }

  private validateFormat(provider: ApiProvider, key: string) {
    if (!key || key.length < 10) {
      return false;
    }
    const patterns: Record<ApiProvider, RegExp> = {
      groq: /^gsk_[A-Za-z0-9_]{10,}$/,
      openai: /^sk-[A-Za-z0-9]{10,}$/,
      anthropic: /^sk-ant-[A-Za-z0-9-_]{10,}$/,
      google: /^AIza[0-9A-Za-z-_]{10,}$/,
      custom: /^.{10,}$/,
    };
    return patterns[provider]?.test(key) ?? false;
  }

  private normalizeProvider(provider: ApiProvider, key: string): ApiProvider {
    if (provider === "custom" && key) {
      const detected = this.detectProviderFromKey(key);
      return detected || provider;
    }
    return provider;
  }

  private detectProviderFromKey(key: string): ApiProvider | null {
    if (/^gsk_[A-Za-z0-9_]{10,}$/.test(key)) {
      return "groq";
    }
    if (/^sk-ant-[A-Za-z0-9-_]{10,}$/.test(key)) {
      return "anthropic";
    }
    if (/^sk-[A-Za-z0-9]{10,}$/.test(key)) {
      return "openai";
    }
    if (/^AIza[0-9A-Za-z-_]{10,}$/.test(key)) {
      return "google";
    }
    return null;
  }

  private ensureSafeContext() {
    if (typeof window === "undefined" || !window.isSecureContext) {
      throw new ApiKeyError("سياق غير آمن لاستخدام المفاتيح.", "XSS_DETECTED");
    }
    const html = document?.documentElement?.innerHTML || "";
    const suspicious = /<script|onerror=|onload=|javascript:/i.test(html);
    if (suspicious) {
      throw new ApiKeyError("تم رصد مؤشرات نصية غير آمنة.", "XSS_DETECTED");
    }
  }

  private async getUserId() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id) {
      throw new ApiKeyError("تعذر تحديد المستخدم.", "UNAUTHORIZED");
    }
    return data.user.id;
  }

  private async getUserCryptoKey(userId: string) {
    const storage = getStorage();
    const stored = storage?.getItem(this.getUserKeyStorageKey(userId));
    if (!stored) {
      return this.createUserKey(userId);
    }
    try {
      const payload = JSON.parse(stored) as {
        v: number;
        deviceSalt: string;
        wrapSalt: string;
        wrapIv: string;
        wrapped: string;
      };
      return await this.unwrapUserKey(userId, payload);
    } catch {
      return this.createUserKey(userId);
    }
  }

  private async createUserKey(userId: string) {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const deviceSalt = crypto.getRandomValues(new Uint8Array(16));
    const wrapSalt = crypto.getRandomValues(new Uint8Array(16));
    const wrapIv = crypto.getRandomValues(new Uint8Array(12));

    const wrappingKey = await this.deriveWrappingKey(
      userId,
      deviceSalt,
      wrapSalt
    );
    const wrapped = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: wrapIv },
      wrappingKey,
      rawKey
    );

    const payload = {
      v: 1,
      deviceSalt: this.bytesToBase64(deviceSalt),
      wrapSalt: this.bytesToBase64(wrapSalt),
      wrapIv: this.bytesToBase64(wrapIv),
      wrapped: this.bytesToBase64(new Uint8Array(wrapped)),
    };

    const storage = getStorage();
    storage?.setItem(
      this.getUserKeyStorageKey(userId),
      JSON.stringify(payload)
    );

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      false,
      ["encrypt", "decrypt"]
    );

    rawKey.fill(0);
    deviceSalt.fill(0);
    wrapSalt.fill(0);
    wrapIv.fill(0);

    return cryptoKey;
  }

  private async unwrapUserKey(
    userId: string,
    payload: {
      deviceSalt: string;
      wrapSalt: string;
      wrapIv: string;
      wrapped: string;
    }
  ) {
    const deviceSalt = this.base64ToBytes(payload.deviceSalt);
    const wrapSalt = this.base64ToBytes(payload.wrapSalt);
    const wrapIv = this.base64ToBytes(payload.wrapIv);
    const wrapped = this.base64ToBytes(payload.wrapped);

    const wrappingKey = await this.deriveWrappingKey(
      userId,
      deviceSalt,
      wrapSalt
    );

    const rawKey = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: wrapIv },
      wrappingKey,
      wrapped
    );

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      false,
      ["encrypt", "decrypt"]
    );

    deviceSalt.fill(0);
    wrapSalt.fill(0);
    wrapIv.fill(0);
    wrapped.fill(0);

    return cryptoKey;
  }

  private async deriveWrappingKey(
    userId: string,
    deviceSalt: Uint8Array,
    wrapSalt: Uint8Array
  ) {
    const encoder = new TextEncoder();
    const base = `${userId}|${navigator.userAgent}|${this.bytesToBase64(
      deviceSalt
    )}`;
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(base),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: wrapSalt,
        iterations: WRAP_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  private bytesToBase64(bytes: Uint8Array) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBytes(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private getUserKeyStorageKey(userId: string) {
    return `${STORAGE_PREFIX}:userkey:${userId}`;
  }

  private getDefaultKeyStorageKey(userId: string) {
    return `${STORAGE_PREFIX}:default:${userId}`;
  }

  private ensureDefaultKey(
    userId: string,
    provider: ApiProvider,
    id: string,
    name: string | null
  ) {
    const defaults = this.getDefaultMap(userId);
    if (!defaults[provider] || name === "افتراضي") {
      defaults[provider] = id;
      const storage = getStorage();
      storage?.setItem(
        this.getDefaultKeyStorageKey(userId),
        JSON.stringify(defaults)
      );
    }
  }

  private getDefaultKeyId(userId: string, provider: ApiProvider) {
    const defaults = this.getDefaultMap(userId);
    return defaults[provider] || null;
  }

  private getDefaultMap(userId: string) {
    const storage = getStorage();
    const stored = storage?.getItem(this.getDefaultKeyStorageKey(userId));
    if (!stored) {
      return {} as Record<string, string>;
    }
    try {
      return JSON.parse(stored) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  }

  private clearDefaultIfMatch(userId: string, id: string) {
    const defaults = this.getDefaultMap(userId);
    const entries = Object.entries(defaults);
    let changed = false;
    for (const [provider, value] of entries) {
      if (value === id) {
        delete defaults[provider];
        changed = true;
      }
    }
    if (changed) {
      const storage = getStorage();
      storage?.setItem(
        this.getDefaultKeyStorageKey(userId),
        JSON.stringify(defaults)
      );
    }
  }

  private sanitizeName(name: string | null) {
    if (!name) {
      return null;
    }
    const cleaned = name.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
    return cleaned.length > 0 ? cleaned.slice(0, 60) : null;
  }

  private async disableKey(id: string) {
    await supabaseClient.from("api_keys").update({ is_active: false }).eq("id", id);
  }

  private async touchKey(id: string) {
    await supabaseClient
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", id);
  }

  private consumeValidationSlot(provider: ApiProvider) {
    const key = `${STORAGE_PREFIX}:validation:${provider}`;
    const now = Date.now();
    const storage = getStorage();
    const stored = storage?.getItem(key);
    const timestamps = stored ? (JSON.parse(stored) as number[]) : [];
    const recent = timestamps.filter((time) => now - time < VALIDATION_WINDOW_MS);
    if (recent.length >= VALIDATION_LIMIT) {
      throw new ApiKeyError("تم تجاوز حد محاولات التحقق.", "RATE_LIMIT");
    }
    recent.push(now);
    storage?.setItem(key, JSON.stringify(recent));
  }
}

const apiKeyService = new ApiKeyService();

export default apiKeyService;
