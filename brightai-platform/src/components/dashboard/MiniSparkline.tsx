import { memo } from "react";

type MiniSparklineProps = {
  values: number[];
};

const MiniSparkline = ({ values }: MiniSparklineProps) => {
  if (values.length === 0) {
    return <div className="h-10 w-full rounded-lg bg-slate-800/40" />;
  }

  const width = 140;
  const height = 40;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default memo(MiniSparkline);
