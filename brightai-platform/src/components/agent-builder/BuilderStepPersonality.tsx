import AgentPersonalityEditor from "../agent/AgentPersonalityEditor";
import type { حالةالنموذج } from "../../types/agent-builder.types";

type BuilderStepPersonalityProps = {
  form: حالةالنموذج;
  onChangeForm: (patch: Partial<حالةالنموذج>) => void;
};

const BuilderStepPersonality = ({ form, onChangeForm }: BuilderStepPersonalityProps) => {
  return (
    <div className="grid gap-5">
      <h2 className="text-xl font-bold text-slate-100">إعداد الشخصية والسلوك</h2>
      <AgentPersonalityEditor
        value={{
          وصفتوليد: form.وصفمولد,
          الموجهالنظامي: form.الموجهالنظامي,
          اللهجة: form.اللهجة,
          لغةالرد: form.لغةالرد,
          قواعدالسلوك: form.قواعدالسلوك,
          ملفاتالمعرفة: form.ملفاتالمعرفة,
          روابطالمعرفة: form.روابطالمعرفة,
          نصالمعرفة: form.نصالمعرفة,
          الشخصية: form.الشخصية,
          temperature: form.temperature,
          model: form.النموذج,
          maxTokens: form.maxTokens,
        }}
        onChange={(patch) => {
          onChangeForm({
            وصفمولد: patch.وصفتوليد ?? form.وصفمولد,
            الموجهالنظامي: patch.الموجهالنظامي ?? form.الموجهالنظامي,
            اللهجة: patch.اللهجة ?? form.اللهجة,
            لغةالرد: patch.لغةالرد ?? form.لغةالرد,
            قواعدالسلوك: patch.قواعدالسلوك ?? form.قواعدالسلوك,
            ملفاتالمعرفة: patch.ملفاتالمعرفة ?? form.ملفاتالمعرفة,
            روابطالمعرفة: patch.روابطالمعرفة ?? form.روابطالمعرفة,
            نصالمعرفة: patch.نصالمعرفة ?? form.نصالمعرفة,
            الشخصية: patch.الشخصية ?? form.الشخصية,
          });
        }}
      />
    </div>
  );
};

export default BuilderStepPersonality;
