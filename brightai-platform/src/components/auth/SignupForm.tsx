import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import supabase from "../../lib/supabase";

type SignupFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const emailPattern =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
    watch,
  } = useForm<SignupFormValues>({
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  useEffect(() => {
    setFocus("fullName");
  }, [setFocus]);

  const passwordValue = watch("password");
  const confirmValue = watch("confirmPassword");

  const passwordRules = useMemo(() => {
    return {
      length: passwordValue.length >= 8,
      uppercase: /[A-Z]/.test(passwordValue),
      lowercase: /[a-z]/.test(passwordValue),
      number: /[0-9]/.test(passwordValue),
    };
  }, [passwordValue]);

  const onSubmit = async (values: SignupFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setErrorMessage("تعذر إنشاء الحساب. تحقق من البيانات.");
      return;
    }

    setSuccessMessage("تم إنشاء الحساب، تحقق من بريدك لتفعيل الدخول.");
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <label htmlFor="fullName" className="text-sm font-semibold text-slate-200">
          الاسم الكامل
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
          placeholder="الاسم الكامل"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby="fullName-error"
          {...register("fullName", {
            required: "الاسم الكامل مطلوب.",
            minLength: {
              value: 3,
              message: "الاسم يجب أن يكون ٣ أحرف على الأقل.",
            },
          })}
        />
        {errors.fullName ? (
          <p id="fullName-error" className="text-xs text-red-300">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

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
        <label htmlFor="password" className="text-sm font-semibold text-slate-200">
          كلمة المرور
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="auth-field w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="أدخل كلمة المرور"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-error"
            {...register("password", {
              required: "كلمة المرور مطلوبة.",
              validate: {
                length: (value: string) =>
                  value.length >= 8 || "كلمة المرور يجب أن تكون ٨ أحرف على الأقل.",
                uppercase: (value: string) =>
                  /[A-Z]/.test(value) || "يجب أن تحتوي على حرف كبير واحد على الأقل.",
                lowercase: (value: string) =>
                  /[a-z]/.test(value) || "يجب أن تحتوي على حرف صغير واحد على الأقل.",
                number: (value: string) =>
                  /[0-9]/.test(value) || "يجب أن تحتوي على رقم واحد على الأقل.",
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

        <div className="grid gap-2 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">متطلبات كلمة المرور</p>
          <div className="flex flex-wrap gap-3">
            <span className={passwordRules.length ? "text-emerald-300" : "text-slate-500"}>
              ٨ أحرف على الأقل
            </span>
            <span className={passwordRules.uppercase ? "text-emerald-300" : "text-slate-500"}>
              حرف كبير
            </span>
            <span className={passwordRules.lowercase ? "text-emerald-300" : "text-slate-500"}>
              حرف صغير
            </span>
            <span className={passwordRules.number ? "text-emerald-300" : "text-slate-500"}>
              رقم واحد
            </span>
          </div>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-xs text-red-300">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-semibold text-slate-200"
        >
          تأكيد كلمة المرور
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            className="auth-field w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            placeholder="أعد إدخال كلمة المرور"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby="confirmPassword-error"
            {...register("confirmPassword", {
              required: "تأكيد كلمة المرور مطلوب.",
              validate: (value: string) =>
                value === passwordValue || "كلمتا المرور غير متطابقتين.",
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
            className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-emerald-300"
            aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword ? (
          <p id="confirmPassword-error" className="text-xs text-red-300">
            {errors.confirmPassword.message}
          </p>
        ) : null}
        {confirmValue && confirmValue === passwordValue ? (
          <p className="text-xs text-emerald-300">كلمتا المرور متطابقتان.</p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-700 bg-slate-950/60 text-emerald-400 focus:ring-emerald-400"
          aria-invalid={Boolean(errors.acceptTerms)}
          {...register("acceptTerms", {
            required: "يجب الموافقة على الشروط.",
          })}
        />
        أوافق على الشروط والأحكام
      </label>
      {errors.acceptTerms ? (
        <p className="text-xs text-red-300">{errors.acceptTerms.message}</p>
      ) : null}

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
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
      </button>
    </form>
  );
};

export default SignupForm;
