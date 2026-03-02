import { useCallback, useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { حالةالنموذج, حقلمسودةنصي } from "../../types/agent-builder.types";

type Params = {
  form: حالةالنموذج;
  setForm: Dispatch<SetStateAction<حالةالنموذج>>;
  nameInputRef: MutableRefObject<HTMLInputElement | null>;
  descriptionInputRef: MutableRefObject<HTMLTextAreaElement | null>;
  customCategoryInputRef: MutableRefObject<HTMLInputElement | null>;
  textDraftTimersRef: MutableRefObject<Record<حقلمسودةنصي, number | null>>;
};

const useAgentBuilderTextDraft = ({
  form,
  setForm,
  nameInputRef,
  descriptionInputRef,
  customCategoryInputRef,
  textDraftTimersRef,
}: Params) => {
  const applyPartialForm = useCallback((partial: Partial<حالةالنموذج>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, [setForm]);

  useEffect(() => {
    const timers = textDraftTimersRef.current;
    return () => {
      (Object.keys(timers) as حقلمسودةنصي[]).forEach((field) => {
        if (timers[field]) {
          window.clearTimeout(timers[field] as number);
        }
      });
    };
  }, [textDraftTimersRef]);

  const getFieldValueFromRef = useCallback(
    (field: حقلمسودةنصي) => {
      if (field === "الاسم") {
        return nameInputRef.current?.value ?? form.الاسم;
      }
      if (field === "الوصف") {
        return descriptionInputRef.current?.value ?? form.الوصف;
      }
      return customCategoryInputRef.current?.value ?? form.فئةمخصصة;
    },
    [customCategoryInputRef, descriptionInputRef, form.الاسم, form.الوصف, form.فئةمخصصة, nameInputRef]
  );

  const commitTextDraft = useCallback((field: حقلمسودةنصي, nextValue: string) => {
    setForm((prev) => {
      if (prev[field] === nextValue) {
        return prev;
      }
      return {
        ...prev,
        [field]: nextValue,
      };
    });
  }, [setForm]);

  const scheduleTextDraftCommit = useCallback(
    (field: حقلمسودةنصي, value: string, delayMs = 260) => {
      const timers = textDraftTimersRef.current;
      if (timers[field]) {
        window.clearTimeout(timers[field] as number);
      }
      timers[field] = window.setTimeout(() => {
        commitTextDraft(field, value);
        textDraftTimersRef.current[field] = null;
      }, delayMs);
    },
    [commitTextDraft, textDraftTimersRef]
  );

  const flushTextDraft = useCallback(
    (field: حقلمسودةنصي) => {
      const timers = textDraftTimersRef.current;
      if (timers[field]) {
        window.clearTimeout(timers[field] as number);
        timers[field] = null;
      }
      commitTextDraft(field, getFieldValueFromRef(field));
    },
    [commitTextDraft, getFieldValueFromRef, textDraftTimersRef]
  );

  const flushBasicTextDrafts = useCallback(() => {
    flushTextDraft("الاسم");
    flushTextDraft("الوصف");
    if (form.الفئة === "أخرى (مخصصة)") {
      flushTextDraft("فئةمخصصة");
    }
  }, [flushTextDraft, form.الفئة]);

  useEffect(() => {
    const nameInput = nameInputRef.current;
    if (nameInput && document.activeElement !== nameInput && nameInput.value !== form.الاسم) {
      nameInput.value = form.الاسم;
    }

    const descriptionInput = descriptionInputRef.current;
    if (
      descriptionInput &&
      document.activeElement !== descriptionInput &&
      descriptionInput.value !== form.الوصف
    ) {
      descriptionInput.value = form.الوصف;
    }

    const customCategoryInput = customCategoryInputRef.current;
    if (
      customCategoryInput &&
      document.activeElement !== customCategoryInput &&
      customCategoryInput.value !== form.فئةمخصصة
    ) {
      customCategoryInput.value = form.فئةمخصصة;
    }
  }, [customCategoryInputRef, descriptionInputRef, form.الاسم, form.الوصف, form.فئةمخصصة, nameInputRef]);

  return {
    applyPartialForm,
    getFieldValueFromRef,
    scheduleTextDraftCommit,
    flushTextDraft,
    flushBasicTextDrafts,
  };
};

export default useAgentBuilderTextDraft;
