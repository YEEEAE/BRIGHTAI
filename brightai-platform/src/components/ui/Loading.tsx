import { cn } from "../../lib/utils";

export type LoadingVariant = "spinner" | "dots" | "skeleton" | "progress";
export type LoadingSize = "sm" | "md" | "lg";

export type LoadingProps = {
  variant?: LoadingVariant;
  size?: LoadingSize;
  colorClass?: string;
  lines?: number;
  progress?: number;
  className?: string;
};

const sizeMap: Record<LoadingSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

/**
 * مؤشرات تحميل متنوعة لتجارب سريعة الاستجابة.
 */
const Loading = ({
  variant = "spinner",
  size = "md",
  colorClass = "text-emerald-300",
  lines = 3,
  progress = 0,
  className,
}: LoadingProps) => {
  // مؤشرات تحميل متعددة الأنماط
  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)} aria-label="جارٍ التحميل">
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:240ms]" />
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2", className)} aria-label="جارٍ التحميل">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 w-full animate-pulse rounded-full bg-slate-800/70"
          />
        ))}
      </div>
    );
  }

  if (variant === "progress") {
    return (
      <div className={cn("w-full", className)} aria-label="جاري التقدّم">
        <div className="h-2 w-full rounded-full bg-slate-800/70">
          <div
            className="h-2 rounded-full bg-emerald-400 transition"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeMap[size],
        colorClass,
        className
      )}
      aria-label="جارٍ التحميل"
    />
  );
};

export default Loading;
