import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:ring-emerald-300",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-slate-500",
  ghost:
    "bg-transparent text-slate-100 hover:bg-slate-800 focus-visible:ring-slate-500",
};

const Button = ({ variant = "primary", className = "", ...props }: ButtonProps) => {
  // زر قابل لإعادة الاستخدام مع أنماط ثابتة
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};

export default Button;
