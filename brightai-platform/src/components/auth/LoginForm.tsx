import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import supabase from "../../lib/supabase";
import {
  isLocalAdminCredentials,
  setLocalAdminSession,
} from "../../lib/local-admin";

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

const emailPattern =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
    watch,
  } = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: {
      email: sessionStorage.getItem("brightai_remember_email") || "",
      password: "",
      remember: Boolean(sessionStorage.getItem("brightai_remember_email")),
    },
  });

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const passwordValue = watch("password");
  const emailValue = watch("email");

  const passwordStrength = useMemo(() => {
    const score = [
      passwordValue.length >= 8,
      /[A-Z]/.test(passwordValue),
      /[a-z]/.test(passwordValue),
      /[0-9]/.test(passwordValue),
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
  }, [passwordValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRedirecting(false);

    if (values.remember) {
      sessionStorage.setItem("brightai_remember_email", values.email);
    } else {
      sessionStorage.removeItem("brightai_remember_email");
    }

    // تسجيل دخول محلي (اختياري) - عادة يكون معطلاً في بيئة الإنتاج
    if (isLocalAdminCredentials(values.email, values.password)) {
      // تنظيف أي جلسة Supabase سابقة حتى لا تُرسل رموز غير صالحة للواجهة الخلفية
      try {
        await supabase.auth.signOut();
      } catch {
        // تجاهل الأخطاء، الهدف فقط تنظيف التخزين
      }
      setLocalAdminSession();
      setSuccessMessage("تم تسجيل الدخول المحلي بنجاح.");
      setRedirecting(true);
      window.location.replace("/dashboard");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      // تمييز فشل بيانات الدخول عن أعطال خدمة المصادقة
      const status = (error as unknown as { status?: number }).status || 0;
      if (status >= 500) {
        setErrorMessage("تعذر الاتصال بخدمة تسجيل الدخول حالياً. جرّب بعد دقائق أو حدّث الصفحة.");
      } else {
        setErrorMessage("بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور.");
      }
      return;
    }

    // تحقق إضافي: بعض المتصفحات/البيئات قد تمنع التخزين، فنضمن وجود جلسة قبل التحويل
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setErrorMessage(
        "تم قبول بيانات الدخول لكن تعذر إنشاء جلسة. جرّب تحديثًا قويًا ومسح بيانات التخزين ثم أعد المحاولة."
      );
      return;
    }

    setSuccessMessage("تم تسجيل الدخول بنجاح.");
    setRedirecting(true);
    // التحويل عبر استبدال العنوان يضمن تهيئة الجلسة قبل تحميل لوحة التحكم
    window.location.replace("/dashboard");
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!emailPattern.test(emailValue || "")) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صالح لاستعادة كلمة المرور.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage("تعذر إرسال رابط الاستعادة حالياً.");
      return;
    }

    setSuccessMessage("تم إرسال رابط استعادة كلمة المرور إلى بريدك.");
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-200">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
          placeholder="بريدك الإلكتروني"
          aria-invalid={Boolean(errors.email)}
          aria-describedby="email-error"
          {...register("email", {
            required: "البريد الإلكتروني مطلوب.",
            pattern: {
              value: emailPattern,
              message: "صيغة البريد الإلكتروني غير صحيحة.",
            },
          })}
        />
        {errors.email ? (
          <p id="email-error" className="text-xs text-red-300">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-slate-200"
        >
          كلمة المرور
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="auth-field w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="أدخل كلمة المرور"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-error"
            {...register("password", {
              required: "كلمة المرور مطلوبة.",
              minLength: {
                value: 8,
                message: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل.",
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-emerald-300"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
        {errors.password ? (
          <p id="password-error" className="text-xs text-red-300">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 bg-slate-950/60 text-emerald-400 focus:ring-emerald-400"
            {...register("remember")}
          />
          تذكرني
        </label>
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-emerald-300 hover:text-emerald-200"
        >
          هل نسيت كلمة المرور؟
        </button>
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
        disabled={!isValid || isSubmitting || redirecting}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {redirecting ? "جارٍ نقلك إلى لوحة التحكم..." : isSubmitting ? "جارٍ التحقق..." : "تسجيل الدخول"}
      </button>
    </form>
  );
};

export default LoginForm;
