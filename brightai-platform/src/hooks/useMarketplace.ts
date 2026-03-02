import { useEffect, useMemo, useState } from "react";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_DEFAULT_PUBLISH_FORM,
  MARKETPLACE_SEED_AGENTS,
  MARKETPLACE_SORT_OPTIONS,
} from "../constants/marketplace.constants";
import {
  appendReviewToAgents,
  buildAgentReview,
  buildMarketplaceAgent,
  filterAndSortAgents,
  markReviewHelpful,
  markReviewReported,
} from "../lib/marketplace.utils";
import type {
  MarketplaceAgent,
  MarketplaceSortKey,
  PublishForm,
} from "../types/marketplace.types";

const useMarketplace = () => {
  const [agents, setAgents] = useState<MarketplaceAgent[]>(MARKETPLACE_SEED_AGENTS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [sortKey, setSortKey] = useState<MarketplaceSortKey>(MARKETPLACE_SORT_OPTIONS[0].value as MarketplaceSortKey);
  const [activeAgent, setActiveAgent] = useState<MarketplaceAgent | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const [publishForm, setPublishForm] = useState<PublishForm>(MARKETPLACE_DEFAULT_PUBLISH_FORM);

  useEffect(() => {
    document.title = "سوق الوكلاء | منصة برايت أي آي";
  }, []);

  const categoryOptions = useMemo(
    () => MARKETPLACE_CATEGORIES.map((item) => ({ value: item, label: item })),
    []
  );

  const filteredAgents = useMemo(() => {
    return filterAndSortAgents(agents, category, search, sortKey);
  }, [agents, category, search, sortKey]);

  const featuredAgents = useMemo(
    () => filteredAgents.filter((agent) => agent.isFeatured),
    [filteredAgents]
  );

  const regularAgents = useMemo(
    () => filteredAgents.filter((agent) => !agent.isFeatured),
    [filteredAgents]
  );

  const updatePublishForm = (patch: Partial<PublishForm>) => {
    setPublishForm((prev) => ({ ...prev, ...patch }));
  };

  const handleOpenDetail = (agent: MarketplaceAgent) => {
    setActiveAgent(agent);
    setDetailOpen(true);
  };

  const handleOpenPreview = (agent: MarketplaceAgent) => {
    setActiveAgent(agent);
    setPreviewOpen(true);
  };

  const handleUseTemplate = (agent: MarketplaceAgent) => {
    setMessage(`تمت إضافة ${agent.name} إلى قائمة الوكلاء لديك.`);
  };

  const handleTryDemo = (agent: MarketplaceAgent) => {
    setMessage(`تم تشغيل تجربة سريعة للوكيل ${agent.name}.`);
  };

  const handlePublishSubmit = () => {
    if (!publishForm.name || !publishForm.description || !publishForm.agree) {
      setMessage("يرجى استكمال جميع الحقول والموافقة قبل النشر.");
      return;
    }

    const newAgent = buildMarketplaceAgent(publishForm);
    setAgents((prev) => [newAgent, ...prev]);
    setPublishOpen(false);
    setMessage("تم إرسال الوكيل للمراجعة والنشر.");
    setPublishForm(MARKETPLACE_DEFAULT_PUBLISH_FORM);
  };

  const handleAddReview = () => {
    if (!activeAgent) {
      return;
    }
    if (!reviewText.trim()) {
      setMessage("يرجى كتابة رأيك قبل الإرسال.");
      return;
    }

    const review = buildAgentReview(reviewText, reviewRating);
    const updated = appendReviewToAgents(agents, activeAgent.id, review);
    const refreshed = updated.find((agent) => agent.id === activeAgent.id) || null;

    setAgents(updated);
    setActiveAgent(refreshed);
    setReviewText("");
    setReviewRating(5);
  };

  const handleHelpful = (reviewId: string) => {
    if (!activeAgent) {
      return;
    }
    const updated = markReviewHelpful(agents, activeAgent.id, reviewId);
    setAgents(updated);
    setActiveAgent(updated.find((agent) => agent.id === activeAgent.id) || null);
  };

  const handleReport = (reviewId: string) => {
    if (!activeAgent) {
      return;
    }
    const updated = markReviewReported(agents, activeAgent.id, reviewId);
    setAgents(updated);
    setActiveAgent(updated.find((agent) => agent.id === activeAgent.id) || null);
    setMessage("تم استلام البلاغ وسيتم مراجعته.");
  };

  return {
    search,
    setSearch,
    category,
    setCategory,
    sortKey,
    setSortKey,
    activeAgent,
    message,
    publishOpen,
    previewOpen,
    detailOpen,
    reviewText,
    setReviewText,
    reviewRating,
    setReviewRating,
    publishForm,
    categoryOptions,
    filteredAgents,
    featuredAgents,
    regularAgents,
    setPublishOpen,
    setPreviewOpen,
    setDetailOpen,
    setMessage,
    updatePublishForm,
    handleOpenDetail,
    handleOpenPreview,
    handleUseTemplate,
    handleTryDemo,
    handlePublishSubmit,
    handleAddReview,
    handleHelpful,
    handleReport,
  };
};

export default useMarketplace;
