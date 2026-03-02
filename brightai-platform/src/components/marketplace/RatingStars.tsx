type RatingStarsProps = {
  value: number;
};

const RatingStars = ({ value }: RatingStarsProps) => {
  const filled = Math.round(value);

  return (
    <div className="flex items-center gap-1 text-xs text-amber-300">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={`star-${index}`} aria-hidden="true">
          {index < filled ? "★" : "☆"}
        </span>
      ))}
      <span className="text-slate-400">{value.toFixed(1)}</span>
    </div>
  );
};

export default RatingStars;
