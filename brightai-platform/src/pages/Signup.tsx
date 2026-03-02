import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import SignupForm from "../components/auth/SignupForm";
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

const Signup = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  useEffect(() => {
    // إعداد وسوم تحسين الظهور لمحركات البحث
    setMetaTags(
      "إنشاء حساب | منصة برايت أي آي",
      "أنشئ حسابك في منصة برايت أي آي لبدء الأتمتة وتحليل البيانات بأمان."
    );
  }, []);

  useEffect(() => {
    let active = true;

    const ensureProfile = async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      const fullName =
        (user.user_metadata?.full_name as string) ||
        (user.email ? user.email.split("@")[0] : null);

      const supabaseClient = supabase as unknown as { from: (table: string) => any };
      await supabaseClient.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      });
    };

    const handleSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await ensureProfile(data.session.user);
        setWelcomeMessage("مرحباً بك في برايت أي آي، يتم تجهيز حسابك الآن.");
        window.setTimeout(() => {
          navigate(DASHBOARD_PATH, { replace: true });
        }, 1200);
        return;
      }
      if (active) {
        setChecking(false);
      }
    };

    handleSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await ensureProfile(session.user);
        setWelcomeMessage("مرحباً بك في برايت أي آي، تم تسجيل دخولك.");
        window.setTimeout(() => {
          navigate(DASHBOARD_PATH, { replace: true });
        }, 1200);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <AuthLayout title="إنشاء حساب" subtitle="جارٍ التحقق من الجلسة">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-300">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          جارٍ تجهيز بوابة التسجيل...
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="إنشاء حساب"
      subtitle="انضم إلى برايت أي آي وابدأ الأتمتة بذكاء"
    >
      <div className="flex flex-col gap-6">
        {welcomeMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {welcomeMessage}
          </div>
        ) : null}

        <SignupForm />

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-300">
          سيتم إرسال رسالة تحقق إلى بريدك الإلكتروني لإكمال التسجيل.
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-800" />
          <span>أو</span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <OAuthButtons />

        <div className="flex flex-col gap-3 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <span>لديك حساب بالفعل؟</span>
            <Link
              to="/login"
              className="text-emerald-300 hover:text-emerald-200"
            >
              تسجيل الدخول
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <Link to="/terms" className="hover:text-emerald-200">
              الشروط والأحكام
            </Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-emerald-200">
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;
