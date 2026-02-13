import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { logSecurityEvent } from "../lib/security";
import { setUserContext, setUserProperties } from "../lib/analytics";
import {
  clearLocalAdminSession,
  getLocalAdminUser,
  isLocalAdminCredentials,
  setLocalAdminSession,
} from "../lib/local-admin";

type AuthContextValue = {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: Record<string, unknown>) => Promise<boolean>;
};

type AuthProviderProps = {
  children: ReactNode;
  redirectOnLogout?: string;
};

type UseAuthOptions = {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuthed?: string;
};

const USER_CACHE_KEY = "brightai_auth_user";
const LOGIN_STATE_KEY = "brightai_login_state";
const LAST_ACTIVITY_KEY = "brightai_last_activity";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

type LoginState = {
  attempts: number[];
  lockedUntil?: number;
};

const getSessionStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
};

const readCachedUser = () => {
  try {
    const storage = getSessionStorage();
    const raw = storage?.getItem(USER_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const readLoginState = (): LoginState => {
  const storage = getSessionStorage();
  if (!storage) {
    return { attempts: [] };
  }
  try {
    const raw = storage.getItem(LOGIN_STATE_KEY);
    if (!raw) {
      return { attempts: [] };
    }
    return JSON.parse(raw) as LoginState;
  } catch {
    return { attempts: [] };
  }
};

const writeLoginState = (state: LoginState) => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  storage.setItem(LOGIN_STATE_KEY, JSON.stringify(state));
};

const clearLoginState = () => {
  const storage = getSessionStorage();
  storage?.removeItem(LOGIN_STATE_KEY);
};

const isLoginLocked = () => {
  const state = readLoginState();
  if (!state.lockedUntil) {
    return false;
  }
  if (Date.now() >= state.lockedUntil) {
    clearLoginState();
    return false;
  }
  return true;
};

const recordFailedLogin = () => {
  const state = readLoginState();
  const now = Date.now();
  const attempts = state.attempts.filter((time) => now - time < LOGIN_WINDOW_MS);
  attempts.push(now);
  let lockedUntil = state.lockedUntil;
  if (attempts.length >= MAX_LOGIN_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_MS;
    logSecurityEvent({
      type: "auth-lockout",
      message: "تم تفعيل قفل الحساب بسبب محاولات متكررة.",
      meta: { attempts: attempts.length },
    });
  }
  writeLoginState({ attempts, lockedUntil });
};

export const AuthProvider = ({ children, redirectOnLogout }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => readCachedUser());
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const redirectRef = useRef(redirectOnLogout || "/login");
  const idleTimerRef = useRef<number | null>(null);

  const persistUser = useCallback((user: User | null) => {
    if (!user) {
      const storage = getSessionStorage();
      storage?.removeItem(USER_CACHE_KEY);
      return;
    }
    const cache = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    } as User;
    const storage = getSessionStorage();
    storage?.setItem(USER_CACHE_KEY, JSON.stringify(cache));
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }
      const storage = getSessionStorage();
      const lastActivity = storage?.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity && Date.now() - Number(lastActivity) > IDLE_TIMEOUT_MS) {
        await supabase.auth.signOut();
        setCurrentUser(null);
        persistUser(null);
        setSessionExpired(true);
        setLoading(false);
        logSecurityEvent({
          type: "session-timeout",
          message: "انتهت الجلسة بسبب عدم النشاط.",
        });
        return;
      }
      if (data.session?.user) {
        setCurrentUser(data.session.user);
        persistUser(data.session.user);
      } else {
        const localUser = getLocalAdminUser();
        setCurrentUser(localUser);
        persistUser(localUser);
      }
      setLoading(false);
    };

    init();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }
      if (!session?.user) {
        const localUser = getLocalAdminUser();
        setCurrentUser(localUser);
        persistUser(localUser);
        if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          setSessionExpired(true);
        }
      } else {
        setSessionExpired(false);
        setCurrentUser(session.user);
        persistUser(session.user);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [persistUser]);

  const login = useCallback(async (email: string, password: string) => {
    if (isLoginLocked()) {
      logSecurityEvent({
        type: "auth-blocked",
        message: "تم رفض محاولة تسجيل الدخول بسبب القفل المؤقت.",
      });
      return false;
    }

    // مسار مؤقت لتسجيل الدخول المحلي عند تعطل مصادقة قاعدة البيانات
    if (isLocalAdminCredentials(email, password)) {
      setLocalAdminSession();
      const localUser = getLocalAdminUser();
      if (localUser) {
        setCurrentUser(localUser);
        persistUser(localUser);
      }
      setSessionExpired(false);
      clearLoginState();
      return true;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      recordFailedLogin();
      logSecurityEvent({
        type: "auth-failed",
        message: "فشل تسجيل الدخول.",
        meta: { reason: error.message },
      });
      return false;
    }
    clearLoginState();
    return true;
  }, [persistUser]);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    clearLocalAdminSession();
    await supabase.auth.signOut();
    const storage = getSessionStorage();
    storage?.removeItem(LAST_ACTIVITY_KEY);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      return false;
    }
    return true;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      return false;
    }
    return true;
  }, []);

  const updateProfile = useCallback(async (data: Record<string, unknown>) => {
    const { error } = await supabase.auth.updateUser({ data });
    if (error) {
      return false;
    }
    return true;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      loading,
      isAuthenticated: Boolean(currentUser),
      sessionExpired,
      login,
      signup,
      logout,
      loginWithGoogle,
      resetPassword,
      updateProfile,
    }),
    [
      currentUser,
      loading,
      sessionExpired,
      login,
      signup,
      logout,
      loginWithGoogle,
      resetPassword,
      updateProfile,
    ]
  );

  useEffect(() => {
    if (!loading && sessionExpired) {
      window.location.replace(redirectRef.current);
    }
  }, [loading, sessionExpired]);

  useEffect(() => {
    if (!currentUser) {
      setUserContext({ id: "مجهول" });
      setUserProperties({ authenticated: false });
      return;
    }
    setUserContext({
      id: currentUser.id,
      email: currentUser.email || undefined,
      name: currentUser.user_metadata?.full_name || undefined,
    });
    setUserProperties({
      authenticated: true,
      role: currentUser.app_metadata?.role || "user",
    });
    const storage = getSessionStorage();
    const updateActivity = () => {
      const now = Date.now();
      storage?.setItem(LAST_ACTIVITY_KEY, String(now));
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(async () => {
        await supabase.auth.signOut();
        setSessionExpired(true);
        logSecurityEvent({
          type: "session-timeout",
          message: "انتهت الجلسة بسبب عدم النشاط.",
        });
      }, IDLE_TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));
    updateActivity();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [currentUser]);

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (options?: UseAuthOptions) => {
  const navigate = useNavigate();
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("يجب استخدام مزود المصادقة قبل استدعاء useAuth.");
  }

  const { loading, isAuthenticated } = context;

  useEffect(() => {
    if (loading) {
      return;
    }
    if (options?.requireAuth && !isAuthenticated) {
      navigate(options.redirectTo || "/login", { replace: true });
    }
    if (options?.redirectIfAuthed && isAuthenticated) {
      navigate(options.redirectIfAuthed, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, options]);

  return context;
};
