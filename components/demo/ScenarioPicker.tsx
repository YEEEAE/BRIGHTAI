"use client";

type Scenario = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

type ScenarioPickerProps = {
  scenarios: Scenario[];
  selectedId: string;
  onSelect: (scenario: Scenario) => void;
};

export function ScenarioPicker({ scenarios, selectedId, onSelect }: ScenarioPickerProps) {
  return (
    <div className="scenario-picker" role="tablist" aria-label="سيناريوهات جاهزة">
      {scenarios.map((scenario) => (
        <button
          className="focus-ring"
          type="button"
          role="tab"
          aria-selected={selectedId === scenario.id}
          key={scenario.id}
          onClick={() => onSelect(scenario)}
        >
          <strong>{scenario.title}</strong>
          <span>{scenario.description}</span>
        </button>
      ))}
    </div>
  );
}
