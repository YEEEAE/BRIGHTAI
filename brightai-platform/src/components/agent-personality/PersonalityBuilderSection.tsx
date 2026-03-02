import { سماتالشخصية, حقولنماذجالإجابة } from "../../constants/agent-personality.constants";
import type { شخصيةمحرر } from "../../types/agent-personality.types";

type PersonalityBuilderSectionProps = {
  personality: شخصيةمحرر;
  onUpdatePersona: (patch: Partial<شخصيةمحرر>) => void;
};

const PersonalityBuilderSection = ({ personality, onUpdatePersona }: PersonalityBuilderSectionProps) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-100">بناء الشخصية البصري</h3>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs text-slate-400">
          اسم الشخصية
          <input
            value={personality.اسم}
            onChange={(event) => onUpdatePersona({ اسم: event.target.value })}
            placeholder="مثال: سارة - مساعدة خدمة العملاء"
            className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />
        </label>
        <label className="grid gap-1 text-xs text-slate-400">
          الدور
          <input
            value={personality.دور}
            onChange={(event) => onUpdatePersona({ دور: event.target.value })}
            placeholder="خبيرة في حل مشاكل العملاء"
            className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
          />
        </label>
      </div>

      <label className="mt-3 grid gap-1 text-xs text-slate-400">
        الخلفية
        <textarea
          value={personality.خلفية}
          onChange={(event) => onUpdatePersona({ خلفية: event.target.value })}
          placeholder="اكتب خلفية الشخصية ومجال خبرتها"
          className="min-h-[78px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
        />
      </label>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {سماتالشخصية.map((item) => (
          <label key={item.key} className="grid gap-1 text-xs text-slate-400">
            {item.label}
            <input
              type="range"
              min={0}
              max={100}
              value={personality[item.key]}
              onChange={(event) => onUpdatePersona({ [item.key]: Number(event.target.value) } as Partial<شخصيةمحرر>)}
            />
            <span className="text-[11px] text-slate-500">{personality[item.key]}%</span>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        <h4 className="text-xs font-semibold text-slate-300">نماذج الإجابة</h4>
        {حقولنماذجالإجابة.map((item) => (
          <label key={item.key} className="grid gap-1 text-xs text-slate-400">
            {item.label}
            <input
              value={personality[item.key]}
              onChange={(event) => onUpdatePersona({ [item.key]: event.target.value } as Partial<شخصيةمحرر>)}
              className="min-h-[40px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default PersonalityBuilderSection;
