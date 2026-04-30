import type { ReactNode } from "react";

type PlaygroundShellProps = {
  title: string;
  description: string;
  input: ReactNode;
  output: ReactNode;
  footer?: ReactNode;
};

export function PlaygroundShell({ title, description, input, output, footer }: PlaygroundShellProps) {
  return (
    <section className="playground demo-container" id="playground" aria-labelledby="playground-title">
      <div className="playground__intro">
        <p className="demo-eyebrow">المختبر الحي</p>
        <h2 id="playground-title">{title}</h2>
        <p>{description}</p>
      </div>
      <div className="playground__grid">
        <div className="playground__panel glass-panel">{input}</div>
        <div className="playground__panel glass-panel playground__panel--output">{output}</div>
      </div>
      {footer ? <div className="playground__footer">{footer}</div> : null}
    </section>
  );
}
