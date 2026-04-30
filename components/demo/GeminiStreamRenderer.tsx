"use client";

import { useEffect, useMemo, useState } from "react";

type GeminiStreamRendererProps = {
  text: string;
  isStreaming: boolean;
};

export function GeminiStreamRenderer({ text, isStreaming }: GeminiStreamRendererProps) {
  const tokens = useMemo(() => text.split(/(\s+)/u).filter(Boolean), [text]);
  const [visible, setVisible] = useState(tokens.length);

  useEffect(() => {
    if (!isStreaming) {
      setVisible(tokens.length);
      return;
    }
    setVisible(0);
    const timer = window.setInterval(() => {
      setVisible((current) => {
        if (current >= tokens.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 18);
    return () => window.clearInterval(timer);
  }, [isStreaming, tokens.length]);

  return (
    <p className="stream-text" aria-live="polite">
      {tokens.slice(0, visible).join("")}
      {isStreaming ? <span className="stream-caret" aria-hidden="true" /> : null}
    </p>
  );
}
