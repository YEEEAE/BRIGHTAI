import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  closeOnOverlay?: boolean;
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

/**
 * نافذة منبثقة مع فخ تركيز ومنع تمرير الخلفية.
 */
const Modal = ({
  open,
  onClose,
  size = "md",
  closeOnOverlay = true,
  title,
  header,
  footer,
  children,
}: ModalProps) => {
  // نافذة منبثقة مع منع تمرير الصفحة وفخ التركيز
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }
    return document.body;
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    lastFocusedRef.current = document.activeElement as HTMLElement;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const focusFirst = () => {
      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      } else {
        containerRef.current?.focus();
      }
    };

    focusFirst();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (!focusable || focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      body.style.overflow = previousOverflow;
      lastFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open || !portalTarget) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        className={cn(
          "relative z-10 w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-6 text-right text-slate-100 shadow-2xl shadow-slate-950/40 transition",
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title ? <h2 className="text-lg font-bold">{title}</h2> : null}
            {header ? <div className="text-sm text-slate-300">{header}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:border-emerald-400/40 hover:text-slate-200"
            aria-label="إغلاق"
          >
            إغلاق
          </button>
        </div>
        <div className="mt-4 text-sm text-slate-300">{children}</div>
        {footer ? <div className="mt-6 border-t border-slate-800 pt-4">{footer}</div> : null}
      </div>
    </div>,
    portalTarget
  );
};

export default Modal;
