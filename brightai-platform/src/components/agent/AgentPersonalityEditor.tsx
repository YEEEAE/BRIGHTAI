import {
  BehaviorRulesSection,
  EditorStatusPanel,
  FullscreenPromptModal,
  KnowledgeBaseSection,
  LivePreviewPanel,
  PersonalityBuilderSection,
  PromptEditorSection,
} from "../agent-personality";
import useAgentPersonalityEditor from "../../hooks/useAgentPersonalityEditor";
import { حجمملف } from "../../lib/agent-personality.utils";
import type { خصائصمحررالشخصية } from "../../types/agent-personality.types";

export type {
  خصائصمحررالشخصية,
  قيمةمحررالشخصية,
  شخصيةمحرر,
  رابطمحرر,
  ملفمعرفةمحرر,
  لغةمحرر,
  لهجةمحرر,
} from "../../types/agent-personality.types";

const AgentPersonalityEditor = ({ value, onChange }: خصائصمحررالشخصية) => {
  const {
    promptRef,
    fullscreen,
    setFullscreen,
    variableOpen,
    ruleInput,
    setRuleInput,
    urlInput,
    setUrlInput,
    fileBusy,
    dragOver,
    setDragOver,
    fetchingUrlId,
    previewInput,
    setPreviewInput,
    previewMessages,
    generating,
    improving,
    tokenEstimate,
    promptValidation,
    promptSegments,
    suggestions,
    update,
    updatePersona,
    applyFormat,
    handlePromptChange,
    handlePromptCursorChange,
    chooseVariable,
    generatePrompt,
    addRule,
    removeRule,
    onUploadFiles,
    onDropFiles,
    addUrl,
    removeUrl,
    fetchUrl,
    removeFile,
    stats,
    sendPreview,
    clearPreview,
  } = useAgentPersonalityEditor({ value, onChange });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        <PromptEditorSection
          value={value}
          promptRef={promptRef}
          tokenEstimate={tokenEstimate}
          promptValidation={promptValidation}
          promptSegments={promptSegments}
          variableOpen={variableOpen}
          suggestions={suggestions}
          generating={generating}
          improving={improving}
          onApplyFormat={applyFormat}
          onSetFullscreen={setFullscreen}
          onPromptChange={handlePromptChange}
          onPromptCursorChange={handlePromptCursorChange}
          onChooseVariable={chooseVariable}
          onUpdateGenerateDescription={(nextValue) => update({ وصفتوليد: nextValue })}
          onGeneratePrompt={generatePrompt}
        />

        <BehaviorRulesSection
          rules={value.قواعدالسلوك}
          ruleInput={ruleInput}
          onRuleInputChange={setRuleInput}
          onAddRule={addRule}
          onRemoveRule={removeRule}
        />

        <PersonalityBuilderSection personality={value.الشخصية} onUpdatePersona={updatePersona} />

        <KnowledgeBaseSection
          files={value.ملفاتالمعرفة}
          urls={value.روابطالمعرفة}
          directText={value.نصالمعرفة}
          stats={stats}
          dragOver={dragOver}
          fileBusy={fileBusy}
          fetchingUrlId={fetchingUrlId}
          urlInput={urlInput}
          formatFileSize={حجمملف}
          onSetDragOver={setDragOver}
          onDropFiles={onDropFiles}
          onUploadFiles={onUploadFiles}
          onRemoveFile={removeFile}
          onSetUrlInput={setUrlInput}
          onAddUrl={addUrl}
          onFetchUrl={fetchUrl}
          onRemoveUrl={removeUrl}
          onUpdateDirectText={(nextValue) => update({ نصالمعرفة: nextValue })}
        />
      </div>

      <aside className="space-y-4">
        <LivePreviewPanel
          previewMessages={previewMessages}
          previewInput={previewInput}
          temperature={value.temperature}
          model={value.model}
          onPreviewInputChange={setPreviewInput}
          onSendPreview={sendPreview}
          onClearPreview={clearPreview}
        />
        <EditorStatusPanel
          promptValidation={promptValidation}
          tokenEstimate={tokenEstimate}
          rulesCount={value.قواعدالسلوك.length}
          sourcesCount={stats.sources}
        />
      </aside>

      <FullscreenPromptModal open={fullscreen} onClose={() => setFullscreen(false)}>
        <PromptEditorSection
          value={value}
          promptRef={promptRef}
          tokenEstimate={tokenEstimate}
          promptValidation={promptValidation}
          promptSegments={promptSegments}
          variableOpen={variableOpen}
          suggestions={suggestions}
          generating={generating}
          improving={improving}
          onApplyFormat={applyFormat}
          onSetFullscreen={setFullscreen}
          onPromptChange={handlePromptChange}
          onPromptCursorChange={handlePromptCursorChange}
          onChooseVariable={chooseVariable}
          onUpdateGenerateDescription={(nextValue) => update({ وصفتوليد: nextValue })}
          onGeneratePrompt={generatePrompt}
        />
      </FullscreenPromptModal>
    </div>
  );
};

export default AgentPersonalityEditor;
