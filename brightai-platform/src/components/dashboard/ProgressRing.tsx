import { memo } from "react";

type ProgressRingProps = {
  value: number;
};

const ProgressRing = ({ value }: ProgressRingProps) => {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="#34d399"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        className="fill-emerald-200 text-[12px] font-bold"
      >
        {`${Math.round(normalized)}%`}
      </text>
    </svg>
  );
};

export default memo(ProgressRing);
