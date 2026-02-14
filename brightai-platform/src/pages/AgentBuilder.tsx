import { Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  BuilderHeader,
  BuilderSidebar,
  BuilderStatusBar,
  BuilderStepAdvancedSettings,
  BuilderStepBasicInfo,
  BuilderStepNavigation,
  BuilderStepPersonality,
  BuilderStepTestPublish,
  BuilderStepWorkflow,
} from "../components/agent-builder";
import useAgentBuilder from "../hooks/useAgentBuilder";

const AgentBuilder = () => {
  const { id } = useParams();
  const {
    step,
    form,
    workflowSummary,
    loadingPage,
    saving,
    localMode,
    saveState,
    lastSavedAt,
    lastEditedAt,
    tagInput,
    setTagInput,
    headerKeyInput,
    setHeaderKeyInput,
    headerValueInput,
    setHeaderValueInput,
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    testMessages,
    testInput,
    setTestInput,
    isStreaming,
    testTokens,
    testCost,
    testLatency,
    lastKnowledgeContext,
    lastKnowledgeSegments,
    systemState,
    importJsonRef,
    iconUploadRef,
    nameInputRef,
    descriptionInputRef,
    customCategoryInputRef,
    applyPartialForm,
    scheduleTextDraftCommit,
    flushTextDraft,
    addTag,
    removeTag,
    addWebhookHeader,
    removeWebhookHeader,
    handleIconUpload,
    goNext,
    goPrev,
    jumpToStep,
    applyTemplate,
    saveAgent,
    exportJson,
    importJson,
    runTestMessage,
    clearChat,
    runScenario,
    progress,
    selectedIcon,
    descriptionChars,
    stepHasError,
    currentStepTitle,
    previewName,
    reloadWorkflowBuilder,
    workflowKey,
  } = useAgentBuilder();

  if (loadingPage) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-8 text-slate-200">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          جارٍ تجهيز مصمم الوكلاء...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Link to="/dashboard" className="rounded-lg border border-slate-800 px-2 py-1 hover:text-emerald-200">
          لوحة التحكم
        </Link>
        {id ? (
          <Link
            to={`/agents/${id}`}
            className="rounded-lg border border-slate-800 px-2 py-1 hover:text-emerald-200"
          >
            تفاصيل الوكيل
          </Link>
        ) : null}
        <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
          مصمم الوكلاء
        </span>
      </nav>

      <BuilderHeader
        localMode={localMode}
        currentStepTitle={currentStepTitle}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplateId={setSelectedTemplateId}
        onApplyTemplate={applyTemplate}
        onOpenImportJson={() => importJsonRef.current?.click()}
        onExportJson={exportJson}
        onSaveDraft={() => void saveAgent("مسودة")}
        saving={saving}
        importJsonRef={importJsonRef}
        onImportJson={importJson}
        progress={progress}
        step={step}
        onJumpToStep={jumpToStep}
      />

      <main className="grid gap-4 xl:grid-cols-[1.8fr_0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-6">
          {step === 1 ? (
            <BuilderStepBasicInfo
              form={form}
              descriptionChars={descriptionChars}
              nameInputRef={nameInputRef}
              descriptionInputRef={descriptionInputRef}
              customCategoryInputRef={customCategoryInputRef}
              scheduleTextDraftCommit={scheduleTextDraftCommit}
              flushTextDraft={flushTextDraft}
              onChangeForm={applyPartialForm}
              iconUploadRef={iconUploadRef}
              onIconUpload={handleIconUpload}
              selectedIcon={selectedIcon}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              onAddTag={addTag}
              onRemoveTag={removeTag}
            />
          ) : null}

          {step === 2 ? <BuilderStepPersonality form={form} onChangeForm={applyPartialForm} /> : null}

          {step === 3 ? (
            <BuilderStepWorkflow
              mode={form.وضعالسير}
              onChangeMode={(mode) => applyPartialForm({ وضعالسير: mode })}
              workflowKey={workflowKey}
              onReloadWorkflow={reloadWorkflowBuilder}
            />
          ) : null}

          {step === 4 ? (
            <BuilderStepAdvancedSettings
              form={form}
              onChangeForm={applyPartialForm}
              headerKeyInput={headerKeyInput}
              headerValueInput={headerValueInput}
              onChangeHeaderKeyInput={setHeaderKeyInput}
              onChangeHeaderValueInput={setHeaderValueInput}
              onAddWebhookHeader={addWebhookHeader}
              onRemoveWebhookHeader={removeWebhookHeader}
            />
          ) : null}

          {step === 5 ? (
            <BuilderStepTestPublish
              testMessages={testMessages}
              testInput={testInput}
              onChangeTestInput={setTestInput}
              onRunTestMessage={runTestMessage}
              isStreaming={isStreaming}
              onClearChat={clearChat}
              onRunScenario={runScenario}
              testTokens={testTokens}
              testCost={testCost}
              testLatency={testLatency}
              lastKnowledgeContext={lastKnowledgeContext}
              lastKnowledgeSegments={lastKnowledgeSegments}
              systemState={systemState}
              saving={saving}
              canPublishMarket={form.عام}
              onSaveDraft={() => void saveAgent("مسودة")}
              onPublish={() => void saveAgent("تفعيل")}
              onPublishMarket={() => void saveAgent("سوق")}
            />
          ) : null}

          <BuilderStepNavigation step={step} onPrev={goPrev} onNext={goNext} />
        </section>

        <BuilderSidebar
          form={form}
          previewName={previewName}
          selectedIcon={selectedIcon}
          workflowSummary={workflowSummary}
          stepHasError={stepHasError}
        />
      </main>

      <BuilderStatusBar
        saveState={saveState}
        lastSavedAt={lastSavedAt}
        lastEditedAt={lastEditedAt}
        workflowSummary={workflowSummary}
      />
    </div>
  );
};

export default AgentBuilder;
