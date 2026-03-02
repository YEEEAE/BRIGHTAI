// أدوات تشفير محلية باستخدام Web Crypto

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));

const fromBase64 = (base64: string) =>
  Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

export const generateKey = async () =>
  crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

export const encrypt = async (data: string, key: CryptoKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = textEncoder.encode(data);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `v1:${toBase64(iv)}:${toBase64(new Uint8Array(encrypted))}`;
};

export const decrypt = async (payload: string, key: CryptoKey) => {
  const [version, ivBase64, dataBase64] = payload.split(":");
  if (version !== "v1") {
    throw new Error("صيغة غير مدعومة.");
  }
  const iv = fromBase64(ivBase64);
  const data = fromBase64(dataBase64);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return textDecoder.decode(decrypted);
};

// توليد بصمة لكلمة المرور
export const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    key,
    256
  );
  return `pbkdf2:${toBase64(salt)}:${toBase64(new Uint8Array(derived))}`;
};

export const compareHash = async (password: string, hash: string) => {
  const [method, saltBase64, hashBase64] = hash.split(":");
  if (method !== "pbkdf2") {
    return false;
  }
  const salt = fromBase64(saltBase64);
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    key,
    256
  );
  const derivedBase64 = toBase64(new Uint8Array(derived));
  return derivedBase64 === hashBase64;
};
