import { forwardRef, useMemo } from "react";
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showCount?: boolean;
  allowClear?: boolean;
  onClear?: () => void;
  helperText?: string;
};

/**
 * حقل إدخال متقدم يدعم الأخطاء والتحميل والاتجاه العربي.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      loading,
      leftIcon,
      rightIcon,
      showCount,
      allowClear,
      onClear,
      helperText,
      className,
      value,
      maxLength,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // حقل إدخال محسّن مع دعم الاتجاه العربي
    const length = useMemo(() => {
      if (typeof value === "string" || typeof value === "number") {
        return String(value).length;
      }
      return 0;
    }, [value]);

    const handleClear = () => {
      if (disabled) {
        return;
      }
      if (onClear) {
        onClear();
      }
      if (props.onChange) {
        const event = {
          target: { value: "" },
        } as unknown as ChangeEvent<HTMLInputElement>;
        props.onChange(event);
      }
    };

    const inputId = id || `input_${props.name || "field"}`;
    const describedBy = [
      error ? `${inputId}-error` : null,
      helperText ? `${inputId}-helper` : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-200">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "auth-field w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2",
              "min-h-[44px]",
              leftIcon ? "pr-11" : "",
              rightIcon || loading || (allowClear && length > 0) ? "pl-11" : "",
              error
                ? "border-rose-500/60 focus:ring-rose-400"
                : success
                ? "border-emerald-500/60 focus:ring-emerald-400"
                : "border-slate-800 focus:ring-emerald-400/40",
              disabled ? "cursor-not-allowed opacity-60" : "",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy || undefined}
            maxLength={maxLength}
            disabled={disabled}
            value={value}
            {...props}
          />
          {rightIcon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </span>
          ) : null}
          {allowClear && length > 0 && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              aria-label="مسح الحقل"
            >
              مسح
            </button>
          ) : null}
          {loading ? (
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300/70 border-t-transparent"
                aria-hidden="true"
              />
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-xs">
          <div>
            {error ? (
              <p id={`${inputId}-error`} className="text-rose-300">
                {error}
              </p>
            ) : helperText ? (
              <p id={`${inputId}-helper`} className="text-slate-400">
                {helperText}
              </p>
            ) : null}
          </div>
          {showCount && maxLength ? (
            <span className="text-slate-500">
              {length} / {maxLength}
            </span>
          ) : null}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
