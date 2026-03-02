import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // إعداد وسوم تحسين الظهور لمحركات البحث
    setMetaTags(
      "استعادة كلمة المرور | منصة برايت أي آي",
      "أرسل رابط استعادة كلمة المرور لحسابك في منصة برايت أي آي."
    );
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage("تعذر إرسال رابط الاستعادة حالياً.");
      setLoading(false);
      return;
    }

    setSuccessMessage("تم إرسال رابط الاستعادة إلى بريدك الإلكتروني.");
    setLoading(false);
  };

  return (
    <AuthLayout
      title="استعادة كلمة المرور"
      subtitle="سنرسل لك رابطاً لتعيين كلمة مرور جديدة"
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-slate-200">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="بريدك الإلكتروني"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
          {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
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

export default ForgotPassword;
