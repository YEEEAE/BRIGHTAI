type SecurityEvent = {
  type: string;
  message: string;
  createdAt?: string;
  meta?: Record<string, unknown>;
};

const CSRF_KEY = "brightai_csrf_token";
const SIGNING_KEY = "brightai_signing_key";
const SECURITY_LOG_KEY = "brightai_security_log";

const getSessionStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBytes = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const generateToken = (size = 16) => {
  if (typeof crypto === "undefined") {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return bytesToBase64(bytes);
};

export const getCsrfToken = () => {
  const storage = getSessionStorage();
  if (!storage) {
    return generateToken();
  }
  const existing = storage.getItem(CSRF_KEY);
  if (existing) {
    return existing;
  }
  const token = generateToken(24);
  storage.setItem(CSRF_KEY, token);
  return token;
};

export const rotateCsrfToken = () => {
  const storage = getSessionStorage();
  const token = generateToken(24);
  storage?.setItem(CSRF_KEY, token);
  return token;
};

export const getRequestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const getSigningKey = async () => {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }
  const stored = storage.getItem(SIGNING_KEY);
  const raw = stored ? base64ToBytes(stored) : crypto.getRandomValues(new Uint8Array(32));
  if (!stored) {
    storage.setItem(SIGNING_KEY, bytesToBase64(raw));
  }
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
};

export const signRequest = async (payload: string) => {
  try {
    if (typeof crypto === "undefined") {
      return "";
    }
    const key = await getSigningKey();
    if (!key) {
      return "";
    }
    const encoded = new TextEncoder().encode(payload);
    const signature = await crypto.subtle.sign("HMAC", key, encoded);
    return bytesToBase64(new Uint8Array(signature));
  } catch {
    return "";
  }
};

export const logSecurityEvent = (event: SecurityEvent) => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  const stored = storage.getItem(SECURITY_LOG_KEY);
  const current = stored ? (JSON.parse(stored) as SecurityEvent[]) : [];
  const next = [
    {
      ...event,
      createdAt: event.createdAt || new Date().toISOString(),
    },
    ...current,
  ].slice(0, 200);
  storage.setItem(SECURITY_LOG_KEY, JSON.stringify(next));
};

export const clearSecurityLog = () => {
  const storage = getSessionStorage();
  storage?.removeItem(SECURITY_LOG_KEY);
};
