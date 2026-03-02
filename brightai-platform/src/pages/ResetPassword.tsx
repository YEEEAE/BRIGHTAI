import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import supabase from "../lib/supabase";

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

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // إعداد وسوم تحسين الظهور لمحركات البحث
    setMetaTags(
      "تعيين كلمة مرور جديدة | منصة برايت أي آي",
      "قم بتعيين كلمة مرور جديدة لحسابك في منصة برايت أي آي بأمان."
    );
  }, []);

  useEffect(() => {
    let active = true;

    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (active) {
          setChecking(false);
        }
        return;
      }

      const hashParams = new URLSearchParams(
        location.hash.replace("#", "")
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && active) {
          setChecking(false);
          return;
        }
      }

      if (active) {
        setChecking(false);
        setErrorMessage("رابط الاستعادة غير صالح أو انتهت صلاحيته.");
      }
    };

    ensureSession();

    return () => {
      active = false;
    };
  }, [location.hash]);

  const passwordStrength = useMemo(() => {
    const score = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
    ].filter(Boolean).length;

    const label =
      score <= 1
        ? "ضعيف"
        : score === 2
        ? "متوسط"
        : score === 3
        ? "جيد"
        : "قوي";

    return { score, label };
  }, [password]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 8) {
      setErrorMessage("كلمة المرور يجب أن تكون ٨ أحرف على الأقل.");
      return;
    }

    if (password !== confirm) {
      setErrorMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMessage("تعذر تحديث كلمة المرور حالياً.");
      setLoading(false);
      return;
    }

    setSuccessMessage("تم تحديث كلمة المرور بنجاح.");
    setLoading(false);
    window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1200);
  };

  if (checking) {
    return (
      <AuthLayout title="تعيين كلمة مرور جديدة" subtitle="جارٍ التحقق من الرابط">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-300">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          جارٍ التحقق من صلاحية الرابط...
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="تعيين كلمة مرور جديدة"
      subtitle="أنشئ كلمة مرور قوية لحسابك"
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-slate-200">
            كلمة المرور الجديدة
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="أدخل كلمة المرور الجديدة"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>قوة كلمة المرور: {passwordStrength.label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={`h-1.5 w-6 rounded-full ${
                    passwordStrength.score >= level
                      ? "bg-emerald-400"
                      : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm" className="text-sm font-semibold text-slate-200">
            تأكيد كلمة المرور
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="أعد إدخال كلمة المرور"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "جارٍ الحفظ..." : "تحديث كلمة المرور"}
        </button>

        <div className="text-sm text-slate-300">
          <Link
            to="/login"
            className="text-emerald-300 hover:text-emerald-200"
          >
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
