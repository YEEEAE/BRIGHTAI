import type { User } from "@supabase/supabase-js";

const LOCAL_ADMIN_SESSION_KEY = "brightai_local_admin_session";

const LOCAL_ADMIN_ENABLED = process.env.REACT_APP_ENABLE_LOCAL_ADMIN === "true";

const LOCAL_ADMIN_EMAIL =
  process.env.REACT_APP_LOCAL_ADMIN_EMAIL || "admin@brightai.sa";
const LOCAL_ADMIN_PASSWORD =
  process.env.REACT_APP_LOCAL_ADMIN_PASSWORD || "admin12345";

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
};

const clearSupabaseAuthTokens = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  // تنظيف أي جلسة Supabase مخزنة لتجنب إرسال JWT غير صالح أثناء "الوضع المحلي".
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) {
      continue;
    }
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
};

export const isLocalAdminCredentials = (email: string, password: string) => {
  if (!LOCAL_ADMIN_ENABLED) {
    return false;
  }
  return (
    email.trim().toLowerCase() === LOCAL_ADMIN_EMAIL.toLowerCase() &&
    password === LOCAL_ADMIN_PASSWORD
  );
};

export const setLocalAdminSession = () => {
  if (!LOCAL_ADMIN_ENABLED) {
    return;
  }
  const storage = getStorage();
  if (!storage) {
    return;
  }
  clearSupabaseAuthTokens();
  storage.setItem(LOCAL_ADMIN_SESSION_KEY, "1");
};

export const clearLocalAdminSession = () => {
  const storage = getStorage();
  storage?.removeItem(LOCAL_ADMIN_SESSION_KEY);
};

export const isLocalAdminSessionActive = () => {
  if (!LOCAL_ADMIN_ENABLED) {
    return false;
  }
  const storage = getStorage();
  return storage?.getItem(LOCAL_ADMIN_SESSION_KEY) === "1";
};

export const getLocalAdminUser = (): User | null => {
  if (!LOCAL_ADMIN_ENABLED) {
    return null;
  }
  if (!isLocalAdminSessionActive()) {
    return null;
  }

  return {
    id: "local-admin-user",
    email: LOCAL_ADMIN_EMAIL,
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    app_metadata: {
      role: "super_admin",
      provider: "local",
      providers: ["local"],
    },
    user_metadata: {
      full_name: "مدير النظام المحلي",
      source: "local",
    },
  } as User;
};

export const getLocalAdminSession = () => {
  const user = getLocalAdminUser();
  if (!user) {
    return null;
  }

  return {
    access_token: "local-admin-access-token",
    refresh_token: "local-admin-refresh-token",
    expires_in: 60 * 60 * 24,
    token_type: "bearer",
    user,
  };
};
