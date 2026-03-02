import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { lazyWithRetry } from "../lib/lazy";
import useAppToast from "./useAppToast";
import { evaluateStep } from "../lib/agent-builder.utils";
import type { خطوة } from "../types/agent-builder.types";
import useAgentBuilderState from "./agent-builder/useAgentBuilderState";
import useAgentBuilderTextDraft from "./agent-builder/useAgentBuilderTextDraft";
import useAgentBuilderData from "./agent-builder/useAgentBuilderData";
import useAgentBuilderPersistence from "./agent-builder/useAgentBuilderPersistence";
import useAgentBuilderActions from "./agent-builder/useAgentBuilderActions";
import useAgentBuilderTesting from "./agent-builder/useAgentBuilderTesting";
import useAgentBuilderSaveActions from "./agent-builder/useAgentBuilderSaveActions";
import useAgentBuilderTransfer from "./agent-builder/useAgentBuilderTransfer";
import useAgentBuilderDraftRestore from "./agent-builder/useAgentBuilderDraftRestore";

const WorkflowCanvas = lazyWithRetry(() => import("../components/agent/WorkflowCanvas"));

const useAgentBuilder = () => {
  const { id } = useParams();
  const { showError, showSuccess } = useAppToast();
  const state = useAgentBuilderState();
  const {
    form,
    saveState,
    initializedRef,
    workflowSummary,
    setLastSavedAt,
    setStep,
    setWorkflowKey,
    setWorkflowSummary,
    setSaveState,
    setLastEditedAt,
  } = state;

  const { applyPartialForm, getFieldValueFromRef, scheduleTextDraftCommit, flushTextDraft, flushBasicTextDrafts } =
    useAgentBuilderTextDraft({
      form,
      setForm: state.setForm,
      nameInputRef: state.nameInputRef,
      descriptionInputRef: state.descriptionInputRef,
      customCategoryInputRef: state.customCategoryInputRef,
      textDraftTimersRef: state.textDraftTimersRef,
    });

  const hydrateFromDraft = useAgentBuilderDraftRestore({
    id,
    applyPartialForm,
    setLastSavedAt,
    setStep,
    setWorkflowKey,
    setWorkflowSummary,
    setSaveState,
    showError,
  });

  const preloadWorkflow = useCallback(() => {
    void WorkflowCanvas.preload();
  }, []);

  const data = useAgentBuilderData({
    id,
    showError,
    setTemplates: state.setTemplates,
    setLoadingPage: state.setLoadingPage,
    setLocalMode: state.setLocalMode,
    setUserId: state.setUserId,
    setWorkflowSummary,
    setWorkflowKey,
    setSystemState: state.setSystemState,
    setLastSavedAt,
    setStep,
    applyPartialForm,
    hydrateFromDraft,
    initializedRef,
    preloadWorkflow,
    step: state.step,
    وضعالسير: form.وضعالسير,
  });

  const validateStep = useCallback(
    (stepId: خطوة, silent = false) => {
      const draftAwareForm =
        stepId === 1
          ? { ...form, الاسم: getFieldValueFromRef("الاسم"), الوصف: getFieldValueFromRef("الوصف"), فئةمخصصة: getFieldValueFromRef("فئةمخصصة") }
          : form;
      const result = evaluateStep(stepId, draftAwareForm);
      if (!result.valid && !silent) {
        showError(result.message);
      }
      return result.valid;
    },
    [form, getFieldValueFromRef, showError]
  );

  const { saveDraftLocal } = useAgentBuilderPersistence({
    id,
    form,
    step: state.step,
    workflowSummary,
    initializedRef,
    lastDraftFingerprintRef: state.lastDraftFingerprintRef,
    setLastSavedAt,
    setSaveState,
    getFieldValueFromRef,
  });

  const actions = useAgentBuilderActions({
    form,
    templates: state.templates,
    selectedTemplateId: state.selectedTemplateId,
    tagInput: state.tagInput,
    headerKeyInput: state.headerKeyInput,
    headerValueInput: state.headerValueInput,
    applyPartialForm,
    setTagInput: state.setTagInput,
    setHeaderKeyInput: state.setHeaderKeyInput,
    setHeaderValueInput: state.setHeaderValueInput,
    setStep,
    setWorkflowKey,
    setWorkflowSummary,
    flushBasicTextDrafts,
    validateStep,
    showError,
    showSuccess,
  });

  const saveActions = useAgentBuilderSaveActions({
    id,
    userId: state.userId,
    localMode: state.localMode,
    form,
    workflowSummary,
    flushBasicTextDrafts,
    validateStep,
    getFieldValueFromRef,
    saveDraftLocal,
    setSaving: state.setSaving,
    setSaveState,
    showError,
    showSuccess,
  });

  const lastEditTimerRef = useRef<number | null>(null);

  const transferActions = useAgentBuilderTransfer({
    form,
    workflowSummary,
    getFieldValueFromRef,
    applyPartialForm,
    setWorkflowKey,
    setWorkflowSummary,
    showError,
    showSuccess,
  });

  const testing = useAgentBuilderTesting({
    step: state.step,
    form,
    localMode: state.localMode,
    workflowSummary,
    isStreaming: state.isStreaming,
    setTestMessages: state.setTestMessages,
    setTestInput: state.setTestInput,
    setIsStreaming: state.setIsStreaming,
    setTestLatency: state.setTestLatency,
    setTestTokens: state.setTestTokens,
    setTestCost: state.setTestCost,
    setSystemState: state.setSystemState,
    validateStep,
    saveAgent: saveActions.saveAgent,
    jumpToStep: actions.jumpToStep,
    getFieldValueFromRef,
  });

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    setSaveState((prev) => (prev === "غير محفوظ" ? prev : "غير محفوظ"));

    if (lastEditTimerRef.current) {
      window.clearTimeout(lastEditTimerRef.current);
    }

    lastEditTimerRef.current = window.setTimeout(() => {
      setLastEditedAt(new Date().toLocaleTimeString("ar-SA"));
      lastEditTimerRef.current = null;
    }, 380);

    return () => {
      if (lastEditTimerRef.current) {
        window.clearTimeout(lastEditTimerRef.current);
        lastEditTimerRef.current = null;
      }
    };
  }, [form, initializedRef, setLastEditedAt, setSaveState, workflowSummary.edges, workflowSummary.nodes]);

  useEffect(() => {
    if (saveState !== "غير محفوظ") {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  return {
    step: state.step,
    setStep,
    form,
    userId: state.userId,
    workflowSummary,
    workflowKey: state.workflowKey,
    loadingPage: state.loadingPage,
    saving: state.saving,
    localMode: state.localMode,
    saveState,
    lastSavedAt: state.lastSavedAt,
    lastEditedAt: state.lastEditedAt,
    tagInput: state.tagInput,
    setTagInput: state.setTagInput,
    headerKeyInput: state.headerKeyInput,
    setHeaderKeyInput: state.setHeaderKeyInput,
    headerValueInput: state.headerValueInput,
    setHeaderValueInput: state.setHeaderValueInput,
    templates: state.templates,
    selectedTemplateId: state.selectedTemplateId,
    setSelectedTemplateId: state.setSelectedTemplateId,
    testMessages: state.testMessages,
    testInput: state.testInput,
    setTestInput: state.setTestInput,
    isStreaming: state.isStreaming,
    testTokens: state.testTokens,
    testCost: state.testCost,
    testLatency: state.testLatency,
    lastKnowledgeContext: testing.lastKnowledgeContext,
    lastKnowledgeSegments: testing.lastKnowledgeSegments,
    lastKnowledgeChunks: testing.lastKnowledgeChunks,
    systemState: state.systemState,
    importJsonRef: state.importJsonRef,
    iconUploadRef: state.iconUploadRef,
    nameInputRef: state.nameInputRef,
    descriptionInputRef: state.descriptionInputRef,
    customCategoryInputRef: state.customCategoryInputRef,
    applyPartialForm,
    scheduleTextDraftCommit,
    flushTextDraft,
    flushBasicTextDrafts,
    loadTemplates: data.loadTemplates,
    hydrateFromDatabase: data.hydrateFromDatabase,
    hydrateFromDraft,
    saveDraftLocal,
    addTag: actions.addTag,
    removeTag: actions.removeTag,
    addWebhookHeader: actions.addWebhookHeader,
    removeWebhookHeader: actions.removeWebhookHeader,
    handleIconUpload: actions.handleIconUpload,
    validateStep,
    goNext: () => actions.goNext(state.step),
    goPrev: actions.goPrev,
    jumpToStep: (target: خطوة) => actions.jumpToStep(target, state.step),
    applyTemplate: actions.applyTemplate,
    buildPayload: saveActions.buildPayload,
    saveAgent: saveActions.saveAgent,
    exportJson: transferActions.exportJson,
    importJson: transferActions.importJson,
    runTestMessage: testing.runTestMessage,
    clearChat: testing.clearChat,
    runScenario: testing.runScenario,
    toggleKnowledgeChunk: testing.toggleKnowledgeChunk,
    progress: testing.progress,
    selectedIcon: testing.selectedIcon,
    descriptionChars: testing.descriptionChars,
    stepHasError: testing.stepHasError,
    currentStepTitle: testing.currentStepTitle,
    previewName: testing.previewName,
    reloadWorkflowBuilder: () => {
      setWorkflowKey((prev) => prev + 1);
      preloadWorkflow();
    },
  };
};

export default useAgentBuilder;
