import { X } from "lucide-react";
import type { PropsWithChildren } from "react";

type FullscreenPromptModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
}>;

const FullscreenPromptModal = ({ open, onClose, children }: FullscreenPromptModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 p-4 backdrop-blur-xl">
      <div className="mx-auto h-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100">محرر System Prompt - ملء الشاشة</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
            إغلاق
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default FullscreenPromptModal;
