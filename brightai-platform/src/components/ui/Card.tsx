import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "soft";
};

const toneClasses: Record<NonNullable<CardProps["tone"]>, string> = {
  default: "bg-slate-900/70 border border-slate-800",
  soft: "bg-slate-900/40 border border-slate-800/60",
};

const Card = ({ tone = "default", className = "", ...props }: CardProps) => {
  // بطاقة منظمة لعرض المحتوى
  return (
    <div
      className={`rounded-2xl p-6 shadow-lg shadow-slate-950/30 ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
};

export default Card;
