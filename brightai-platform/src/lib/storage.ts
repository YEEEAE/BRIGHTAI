import { decrypt, encrypt, generateKey } from "./encryption";

const STORAGE_KEY = "brightai_storage_key";

const getCryptoKey = async () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const raw = Uint8Array.from(atob(stored), (char) => char.charCodeAt(0));
    return crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
  }
  const key = await generateKey();
  const exported = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  localStorage.setItem(STORAGE_KEY, btoa(String.fromCharCode(...exported)));
  return key;
};

export const setItem = async (key: string, value: unknown) => {
  const cryptoKey = await getCryptoKey();
  const payload = JSON.stringify(value ?? null);
  const encrypted = await encrypt(payload, cryptoKey);
  localStorage.setItem(key, encrypted);
};

export const getItem = async <T>(key: string): Promise<T | null> => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    return null;
  }
  const cryptoKey = await getCryptoKey();
  const decrypted = await decrypt(stored, cryptoKey);
  return JSON.parse(decrypted) as T;
};

export const removeItem = (key: string) => {
  localStorage.removeItem(key);
};

export const clear = () => {
  localStorage.clear();
};
