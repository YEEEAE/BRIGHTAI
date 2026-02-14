import type { VariableOption } from "../../types/node-editor.types";

type VariableChipsProps = {
  variables: VariableOption[];
  onInsert: (token: string) => void;
};

const VariableChips = ({ variables, onInsert }: VariableChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {variables.map((variable) => (
        <button
          key={variable.token}
          type="button"
          onClick={() => onInsert(variable.token)}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400/60 hover:text-emerald-300"
        >
          {variable.label}
        </button>
      ))}
    </div>
  );
};

export default VariableChips;
