import { useRef, useState } from "react";
import { الحالةالافتراضية } from "../../constants/agent-builder.constants";
import type {
  بياناتنموذج,
  حالةحفظ,
  حالةالنموذج,
  حالةنظام,
  حقلمسودةنصي,
  خطوة,
  ملخصسير,
  رسالةاختبار,
} from "../../types/agent-builder.types";

const useAgentBuilderState = () => {
  const [step, setStep] = useState<خطوة>(1);
  const [form, setForm] = useState<حالةالنموذج>(الحالةالافتراضية);
  const [userId, setUserId] = useState<string>("");
  const [workflowSummary, setWorkflowSummary] = useState<ملخصسير>({
    nodes: 0,
    edges: 0,
    sizeKb: 0,
    raw: null,
  });
  const [workflowKey, setWorkflowKey] = useState(0);

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [saveState, setSaveState] = useState<حالةحفظ>("غير محفوظ");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [lastEditedAt, setLastEditedAt] = useState<string>("");

  const [tagInput, setTagInput] = useState("");
  const [headerKeyInput, setHeaderKeyInput] = useState("");
  const [headerValueInput, setHeaderValueInput] = useState("");

  const [templates, setTemplates] = useState<بياناتنموذج[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [testMessages, setTestMessages] = useState<رسالةاختبار[]>([]);
  const [testInput, setTestInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [testTokens, setTestTokens] = useState(0);
  const [testCost, setTestCost] = useState(0);
  const [testLatency, setTestLatency] = useState(0);

  const [systemState, setSystemState] = useState<حالةنظام>({
    apiConnected: false,
    promptReady: false,
    workflowReady: false,
    warnings: [],
  });

  const importJsonRef = useRef<HTMLInputElement | null>(null);
  const iconUploadRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const customCategoryInputRef = useRef<HTMLInputElement | null>(null);
  const textDraftTimersRef = useRef<Record<حقلمسودةنصي, number | null>>({
    الاسم: null,
    الوصف: null,
    فئةمخصصة: null,
  });
  const initializedRef = useRef(false);
  const lastDraftFingerprintRef = useRef("");

  return {
    step,
    setStep,
    form,
    setForm,
    userId,
    setUserId,
    workflowSummary,
    setWorkflowSummary,
    workflowKey,
    setWorkflowKey,
    loadingPage,
    setLoadingPage,
    saving,
    setSaving,
    localMode,
    setLocalMode,
    saveState,
    setSaveState,
    lastSavedAt,
    setLastSavedAt,
    lastEditedAt,
    setLastEditedAt,
    tagInput,
    setTagInput,
    headerKeyInput,
    setHeaderKeyInput,
    headerValueInput,
    setHeaderValueInput,
    templates,
    setTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    testMessages,
    setTestMessages,
    testInput,
    setTestInput,
    isStreaming,
    setIsStreaming,
    testTokens,
    setTestTokens,
    testCost,
    setTestCost,
    testLatency,
    setTestLatency,
    systemState,
    setSystemState,
    importJsonRef,
    iconUploadRef,
    nameInputRef,
    descriptionInputRef,
    customCategoryInputRef,
    textDraftTimersRef,
    initializedRef,
    lastDraftFingerprintRef,
  };
};

export default useAgentBuilderState;
