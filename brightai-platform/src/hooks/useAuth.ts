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

const AuthContext = createContext<AuthContextValue | null>(null);

const readCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children, redirectOnLogout }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => readCachedUser());
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const redirectRef = useRef(redirectOnLogout || "/login");

  const persistUser = useCallback((user: User | null) => {
    if (!user) {
      localStorage.removeItem(USER_CACHE_KEY);
      return;
    }
    const cache = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    } as User;
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }
      if (data.session?.user) {
        setCurrentUser(data.session.user);
        persistUser(data.session.user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    };

    init();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }
      if (!session?.user) {
        setCurrentUser(null);
        persistUser(null);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return false;
    }
    return true;
  }, []);

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
    await supabase.auth.signOut();
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
