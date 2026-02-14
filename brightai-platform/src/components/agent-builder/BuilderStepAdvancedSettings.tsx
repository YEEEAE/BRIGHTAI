import type { حدثويبهوك, حالةالنموذج } from "../../types/agent-builder.types";
import {
  ModelParamsSection,
  ModelSelectionSection,
  PrivacySettingsSection,
  RuntimeSettingsSection,
  WebhookSettingsSection,
} from "./advanced";

type BuilderStepAdvancedSettingsProps = {
  form: حالةالنموذج;
  onChangeForm: (patch: Partial<حالةالنموذج>) => void;
  headerKeyInput: string;
  headerValueInput: string;
  onChangeHeaderKeyInput: (value: string) => void;
  onChangeHeaderValueInput: (value: string) => void;
  onAddWebhookHeader: () => void;
  onRemoveWebhookHeader: (id: string) => void;
};

const BuilderStepAdvancedSettings = ({
  form,
  onChangeForm,
  headerKeyInput,
  headerValueInput,
  onChangeHeaderKeyInput,
  onChangeHeaderValueInput,
  onAddWebhookHeader,
  onRemoveWebhookHeader,
}: BuilderStepAdvancedSettingsProps) => {
  return (
    <div className="grid gap-5">
      <h2 className="text-xl font-bold text-slate-100">الإعدادات المتقدمة</h2>
      <ModelSelectionSection form={form} onChangeForm={onChangeForm} />

      <div className="grid gap-4 md:grid-cols-2">
        <ModelParamsSection form={form} onChangeForm={onChangeForm} />
        <RuntimeSettingsSection form={form} onChangeForm={onChangeForm} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PrivacySettingsSection form={form} onChangeForm={onChangeForm} />
        <WebhookSettingsSection
          form={form}
          onChangeForm={onChangeForm}
          headerKeyInput={headerKeyInput}
          headerValueInput={headerValueInput}
          onChangeHeaderKeyInput={onChangeHeaderKeyInput}
          onChangeHeaderValueInput={onChangeHeaderValueInput}
          onAddWebhookHeader={onAddWebhookHeader}
          onRemoveWebhookHeader={onRemoveWebhookHeader}
          onChangeWebhookEvent={(value: حدثويبهوك) => onChangeForm({ webhookEvent: value })}
        />
      </div>
    </div>
  );
};

export default BuilderStepAdvancedSettings;
