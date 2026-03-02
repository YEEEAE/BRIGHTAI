import type { ReactNode } from "react";
import Button from "./Button";
import { cn } from "../../lib/utils";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
  className?: string;
};

/**
 * حالة فارغة مع وصف وإجراء واضحين.
 */
const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  className,
}: EmptyStateProps) => {
  // حالة فارغة قابلة لإعادة الاستخدام
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 px-6 py-10 text-center",
        className
      )}
    >
      {illustration ? (
        <div className="w-full max-w-xs">{illustration}</div>
      ) : icon ? (
        <div className="text-emerald-300">{icon}</div>
      ) : null}
      <h3 className="text-lg font-bold text-slate-100">{title}</h3>
      {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      {actionLabel ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
