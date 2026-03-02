import { useEffect } from "react";
import type { خطوة } from "../../types/agent-builder.types";

type Params = {
  step: خطوة;
  saveAgent: (type: "مسودة" | "تفعيل" | "سوق") => Promise<void>;
  jumpToStep: (target: خطوة, step: خطوة) => void;
};

const useBuilderKeyboardShortcuts = ({ step, saveAgent, jumpToStep }: Params) => {
  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      const metaOrCtrl = event.ctrlKey || event.metaKey;
      if (!metaOrCtrl) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveAgent("مسودة");
      }

      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        jumpToStep(Number(event.key) as خطوة, step);
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [jumpToStep, saveAgent, step]);
};

export default useBuilderKeyboardShortcuts;
