import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";
export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  closable?: boolean;
  onClose?: () => void;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-800/70 text-slate-200",
  success: "bg-emerald-500/20 text-emerald-200",
  warning: "bg-amber-500/20 text-amber-200",
  error: "bg-rose-500/20 text-rose-200",
  info: "bg-sky-500/20 text-sky-200",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-xs",
  lg: "px-3.5 py-1.5 text-sm",
};

/**
 * شارة صغيرة لإبراز الحالات أو الوسوم.
 */
const Badge = ({
  variant = "default",
  size = "md",
  dot,
  closable,
  onClose,
  className,
  children,
  ...props
}: BadgeProps) => {
  // شارة خفيفة مع مؤشرات اختيارية
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-semibold",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
      <span>{children}</span>
      {closable ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-1 text-[10px] text-current hover:opacity-80"
          aria-label="إزالة"
        >
          ×
        </button>
      ) : null}
    </span>
  );
};

export default Badge;
