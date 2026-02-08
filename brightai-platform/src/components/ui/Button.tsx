import { forwardRef } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

type CustomColor = {
  bg?: string;
  text?: string;
  border?: string;
  hoverBg?: string;
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  gradient?: boolean;
  customColor?: CustomColor;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-7 text-lg",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:ring-emerald-300",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-slate-500",
  outline:
    "border border-slate-700 text-slate-100 hover:bg-slate-800/70 focus-visible:ring-slate-500",
  ghost:
    "bg-transparent text-slate-100 hover:bg-slate-800/70 focus-visible:ring-slate-500",
  danger:
    "bg-rose-500 text-white hover:bg-rose-400 focus-visible:ring-rose-300",
};

const gradientClass =
  "bg-gradient-to-l from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-300 hover:via-emerald-400 hover:to-teal-300";

const iconOnlyClasses: Record<ButtonSize, string> = {
  sm: "h-9 w-9 p-0",
  md: "h-11 w-11 p-0",
  lg: "h-12 w-12 p-0",
  xl: "h-14 w-14 p-0",
};

/**
 * زر رئيسي للتطبيق يدعم الحالات والأحجام والأيقونات.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      iconOnly,
      gradient,
      customColor,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // زر مرن يدعم الحالات والأحجام والاتجاه العربي
    const customStyle = customColor
      ? {
          "--btn-bg": customColor.bg,
          "--btn-text": customColor.text,
          "--btn-border": customColor.border,
          "--btn-hover": customColor.hoverBg,
        }
      : undefined;

    const customClasses = customColor
      ? "bg-[var(--btn-bg)] text-[var(--btn-text)] border-[var(--btn-border)] hover:bg-[var(--btn-hover)]"
      : "";

    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        className={cn(
          baseClasses,
          iconOnly ? iconOnlyClasses[size] : sizeClasses[size],
          gradient ? gradientClass : variantClasses[variant],
          customClasses,
          fullWidth ? "w-full" : "",
          className
        )}
        style={customStyle as CSSProperties}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : "false"}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200/70 border-t-transparent"
              aria-hidden="true"
            />
            {!iconOnly && <span>جارٍ التنفيذ</span>}
          </span>
        ) : (
          <span className={cn("inline-flex items-center gap-2", iconOnly ? "" : "")}
          >
            {leftIcon ? <span className="text-current">{leftIcon}</span> : null}
            {iconOnly ? null : children}
            {rightIcon ? <span className="text-current">{rightIcon}</span> : null}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
