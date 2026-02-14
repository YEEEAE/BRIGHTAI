import type { حدثويبهوك, حالةالنموذج } from "../../../types/agent-builder.types";

export type AdvancedSettingsCommonProps = {
  form: حالةالنموذج;
  onChangeForm: (patch: Partial<حالةالنموذج>) => void;
};

export type WebhookSettingsProps = AdvancedSettingsCommonProps & {
  headerKeyInput: string;
  headerValueInput: string;
  onChangeHeaderKeyInput: (value: string) => void;
  onChangeHeaderValueInput: (value: string) => void;
  onAddWebhookHeader: () => void;
  onRemoveWebhookHeader: (id: string) => void;
  onChangeWebhookEvent: (value: حدثويبهوك) => void;
};
