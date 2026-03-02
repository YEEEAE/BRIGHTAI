import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type CardVariant = "default" | "glass" | "gradient";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  tone?: "default" | "soft";
  hoverable?: boolean;
  clickable?: boolean;
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  image?: ReactNode;
  badge?: ReactNode;
};

const variantClasses: Record<CardVariant, string> = {
  default: "border border-slate-800 bg-slate-950/70",
  glass: "border border-white/10 bg-white/5 backdrop-blur-xl",
  gradient: "border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/60",
};

/**
 * بطاقة عرض مرنة مع دعم الصور والرؤوس والحواشي.
 */
const Card = ({
  variant,
  tone,
  hoverable,
  clickable,
  header,
  body,
  footer,
  image,
  badge,
  className,
  children,
  ...props
}: CardProps) => {
  // بطاقة مرنة تدعم الأقسام والوسوم
  const resolvedVariant = variant ?? (tone === "soft" ? "glass" : "default");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-lg shadow-slate-950/30 transition",
        variantClasses[resolvedVariant],
        hoverable ? "hover:-translate-y-0.5 hover:shadow-xl" : "",
        clickable ? "cursor-pointer" : "",
        className
      )}
      {...props}
    >
      {badge ? <div className="absolute left-4 top-4 z-10">{badge}</div> : null}
      {image ? <div className="mb-4 overflow-hidden rounded-xl">{image}</div> : null}
      {header ? <div className="mb-4">{header}</div> : null}
      {body ? <div className="text-sm text-slate-300">{body}</div> : null}
      {children}
      {footer ? <div className="mt-6 border-t border-slate-800 pt-4">{footer}</div> : null}
    </div>
  );
};

export default Card;
