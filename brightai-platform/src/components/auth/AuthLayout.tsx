import React from "react";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  return (
    <div className="auth-bg min-h-screen px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-xl flex-col items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-emerald-300">
            منصة برايت أي آي
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-100">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
          ) : null}
        </div>

        <div className="auth-card w-full rounded-3xl p-8 shadow-glass-soft">
          {children}
        </div>

        <p className="text-xs text-slate-400">
          من خلال المتابعة أنت توافق على سياسات الأمان والخصوصية الخاصة بالمنصة.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
