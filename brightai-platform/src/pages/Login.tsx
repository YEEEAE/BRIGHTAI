import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import OAuthButtons from "../components/auth/OAuthButtons";
import supabase from "../lib/supabase";

const DASHBOARD_PATH = "/dashboard";

const setMetaTags = (title: string, description: string) => {
  document.title = title;
  let meta = document.querySelector("meta[name='description']");
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", description);
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    // إعداد وسوم تحسين الظهور لمحركات البحث
    setMetaTags(
      "تسجيل الدخول | منصة برايت أي آي",
      "تسجيل الدخول إلى منصة برايت أي آي للوصول إلى لوحة التحكم والأتمتة الذكية."
    );
  }, []);

  useEffect(() => {
    let active = true;

    const handleAuth = async () => {
      setChecking(true);
      setErrorMessage(null);
      setInfoMessage(null);

      const params = new URLSearchParams(location.search);
      const errorParam = params.get("error_description") || params.get("error");
      const code = params.get("code");

      const hashParams = new URLSearchParams(
        location.hash.replace("#", "")
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (errorParam) {
          setErrorMessage("تعذر إكمال تسجيل الدخول عبر المزود.");
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
          setInfoMessage("تم استكمال الربط بنجاح.");
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
          setInfoMessage("تم تحديث الجلسة بنجاح.");
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate(DASHBOARD_PATH, { replace: true });
          return;
        }
      } catch {
        setErrorMessage("تعذر إكمال تسجيل الدخول عبر المزود.");
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    handleAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate(DASHBOARD_PATH, { replace: true });
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [location.hash, location.search, navigate]);

  if (checking) {
    return (
      <AuthLayout title="تسجيل الدخول" subtitle="جارٍ التحقق من جلستك">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-300">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          جارٍ التحقق من الهوية...
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="تسجيل الدخول"
      subtitle="ابدأ جلسة العمل بسرعة وأمان"
    >
      <div className="flex flex-col gap-6">
        {errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {infoMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {infoMessage}
          </div>
        ) : null}

        <LoginForm />

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-800" />
          <span>أو</span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <OAuthButtons />

        <div className="flex flex-col gap-3 text-sm text-slate-300">
          <Link
            to="/forgot-password"
            className="text-emerald-300 hover:text-emerald-200"
          >
            نسيت كلمة المرور؟
          </Link>
          <div className="flex items-center gap-2">
            <span>لا تملك حساباً؟</span>
            <Link
              to="/signup"
              className="text-emerald-300 hover:text-emerald-200"
            >
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
