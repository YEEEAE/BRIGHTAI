import {
  FeaturedAgentsSection,
  MarketplaceDetailModal,
  MarketplaceFilters,
  MarketplaceHeader,
  MarketplacePreviewModal,
  MarketplacePublishModal,
  RegularAgentsGrid,
} from "../components/marketplace";
import {
  MARKETPLACE_FEATURED_HIGHLIGHT,
  MARKETPLACE_SORT_OPTIONS,
} from "../constants/marketplace.constants";
import useMarketplace from "../hooks/useMarketplace";

const Marketplace = () => {
  const {
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
    featuredAgents,
    regularAgents,
    setPublishOpen,
    setPreviewOpen,
    setDetailOpen,
    updatePublishForm,
    handleOpenDetail,
    handleOpenPreview,
    handleUseTemplate,
    handleTryDemo,
    handlePublishSubmit,
    handleAddReview,
    handleHelpful,
    handleReport,
  } = useMarketplace();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <MarketplaceHeader onOpenPublish={() => setPublishOpen(true)} />

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <MarketplaceFilters
        search={search}
        category={category}
        sortKey={sortKey}
        categoryOptions={categoryOptions}
        sortOptions={MARKETPLACE_SORT_OPTIONS}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onSortChange={(value) => setSortKey(value as typeof sortKey)}
      />

      <FeaturedAgentsSection
        agents={featuredAgents}
        highlight={MARKETPLACE_FEATURED_HIGHLIGHT}
        onOpenPreview={handleOpenPreview}
        onOpenDetail={handleOpenDetail}
      />

      <RegularAgentsGrid agents={regularAgents} onOpenDetail={handleOpenDetail} />

      <MarketplacePreviewModal
        open={previewOpen}
        agent={activeAgent}
        onClose={() => setPreviewOpen(false)}
        onUseTemplate={handleUseTemplate}
        onTryDemo={handleTryDemo}
      />

      <MarketplaceDetailModal
        open={detailOpen}
        agent={activeAgent}
        reviewText={reviewText}
        reviewRating={reviewRating}
        onClose={() => setDetailOpen(false)}
        onSetReviewText={setReviewText}
        onSetReviewRating={setReviewRating}
        onAddReview={handleAddReview}
        onHelpful={handleHelpful}
        onReport={handleReport}
        onUseTemplate={handleUseTemplate}
        onTryDemo={handleTryDemo}
        onOpenPreview={() => setPreviewOpen(true)}
      />

      <MarketplacePublishModal
        open={publishOpen}
        form={publishForm}
        categoryOptions={categoryOptions}
        onClose={() => setPublishOpen(false)}
        onSubmit={handlePublishSubmit}
        onChangeForm={updatePublishForm}
      />
    </div>
  );
};

export default Marketplace;
