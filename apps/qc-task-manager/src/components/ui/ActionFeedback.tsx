import type { ReactNode } from 'react';

type ActionFeedbackTone = 'success' | 'warning' | 'error' | 'info';

interface Props {
  tone: ActionFeedbackTone;
  message: string | null;
  recovery?: ReactNode;
  className?: string;
}

const toneClasses: Record<ActionFeedbackTone, string> = {
  success: 'border-success-border bg-success-soft text-success',
  warning: 'border-warning-border bg-warning-soft text-warning',
  error: 'border-danger-border bg-danger-soft text-danger',
  info: 'border-info-border bg-info-soft text-info',
};

/**
 * Stable live region for React islands. Keep it mounted so screen readers do
 * not miss a message when an action changes state; error messages include the
 * next available recovery step at the call site.
 */
export default function ActionFeedback({ tone, message, recovery, className = '' }: Props) {
  const visible = Boolean(message);
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`${visible ? 'mt-3 flex items-start gap-2 rounded-qc-md border px-3 py-2 text-sm' : 'sr-only'} ${visible ? toneClasses[tone] : ''} ${className}`}
    >
      {visible && <span aria-hidden="true" className="font-semibold">{tone === 'success' ? '✓' : tone === 'error' ? '!' : tone === 'warning' ? '!' : 'i'}</span>}
      <span>{message}</span>
      {visible && recovery}
    </div>
  );
}
