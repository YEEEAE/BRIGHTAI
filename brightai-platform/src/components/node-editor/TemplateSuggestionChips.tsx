type TemplateSuggestionChipsProps = {
  suggestions: string[];
  onPick: (value: string) => void;
};

const TemplateSuggestionChips = ({ suggestions, onPick }: TemplateSuggestionChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onPick(suggestion)}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400/60 hover:text-emerald-300"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default TemplateSuggestionChips;
