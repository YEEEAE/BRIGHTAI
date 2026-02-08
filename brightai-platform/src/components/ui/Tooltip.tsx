import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type TooltipPosition = "top" | "right" | "bottom" | "left";
export type TooltipTrigger = "hover" | "click" | "focus";

export type TooltipProps = {
  content: ReactNode;
  position?: TooltipPosition;
  trigger?: TooltipTrigger;
  delay?: number;
  children: ReactNode;
  className?: string;
};

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
  right: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
  bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2",
  left: "left-full top-1/2 -translate-y-1/2 translate-x-2",
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: "left-1/2 top-full -translate-x-1/2 -translate-y-1/2",
  right: "left-full top-1/2 -translate-y-1/2 -translate-x-1/2",
  bottom: "left-1/2 bottom-full -translate-x-1/2 translate-y-1/2",
  left: "right-full top-1/2 -translate-y-1/2 translate-x-1/2",
};

/**
 * تلميح سياقي بسيط يدعم الاتجاه العربي.
 */
const Tooltip = ({
  content,
  position = "top",
  trigger = "hover",
  delay = 120,
  children,
  className,
}: TooltipProps) => {
  // تلميح بسيط مع دعم الاتجاه العربي
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const show = () => {
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    setOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerProps =
    trigger === "click"
      ? {
          onClick: () => setOpen((prev) => !prev),
        }
      : trigger === "focus"
      ? {
          onFocus: show,
          onBlur: hide,
        }
      : {
          onMouseEnter: show,
          onMouseLeave: hide,
        };

  return (
    <span className="relative inline-flex">
      <span {...triggerProps} tabIndex={0}>
        {children}
      </span>
      {open ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-20 whitespace-nowrap rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-lg shadow-slate-950/40",
            positionClasses[position],
            className
          )}
        >
          {content}
          <span
            className={cn(
              "absolute h-2 w-2 rotate-45 border border-slate-800 bg-slate-950/95",
              arrowClasses[position]
            )}
            aria-hidden="true"
          />
        </span>
      ) : null}
    </span>
  );
};

export default Tooltip;
