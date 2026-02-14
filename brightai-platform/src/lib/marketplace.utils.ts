import type {
  AgentReview,
  MarketplaceAgent,
  MarketplaceSortKey,
  PublishForm,
} from "../types/marketplace.types";

export const filterAndSortAgents = (
  agents: MarketplaceAgent[],
  category: string,
  search: string,
  sortKey: MarketplaceSortKey
): MarketplaceAgent[] => {
  return agents
    .filter((agent) => (category === "الكل" ? true : agent.category === category))
    .filter((agent) => {
      if (!search) {
        return true;
      }
      const query = search.toLowerCase();
      return (
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortKey === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortKey === "top") {
        return b.rating - a.rating;
      }
      return b.downloads - a.downloads;
    });
};

export const parseTags = (value: string): string[] => {
  return value
    .split("،")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const buildMarketplaceAgent = (form: PublishForm): MarketplaceAgent => {
  return {
    id: `agent-${Date.now()}`,
    name: form.name,
    description: form.description,
    author: "المنشئ الحالي",
    category: form.category,
    tags: parseTags(form.tags),
    rating: 0,
    reviews: [],
    downloads: 0,
    price:
      form.priceType === "paid"
        ? {
            type: "paid",
            label: "مدفوع",
            amount: form.priceAmount,
            currency: "ريال",
          }
        : { type: "free", label: "مجاني" },
    isFeatured: false,
    createdAt: new Date().toISOString(),
    previewImages: [],
    workflowPreview: ["إعدادات أولية", "تشغيل", "نتائج"],
  };
};

export const buildAgentReview = (text: string, rating: number): AgentReview => {
  return {
    id: `review-${Date.now()}`,
    author: "مستخدم جديد",
    rating,
    comment: text.trim(),
    helpful: 0,
    reported: false,
    createdAt: new Date().toISOString(),
  };
};

const computeAverageRating = (reviews: AgentReview[]): number => {
  const average = reviews.reduce((sum, item) => sum + item.rating, 0) / Math.max(1, reviews.length);
  return Number(average.toFixed(1));
};

export const appendReviewToAgents = (
  agents: MarketplaceAgent[],
  agentId: string,
  review: AgentReview
): MarketplaceAgent[] => {
  return agents.map((agent) => {
    if (agent.id !== agentId) {
      return agent;
    }
    const reviews = [review, ...agent.reviews];
    return { ...agent, reviews, rating: computeAverageRating(reviews) };
  });
};

export const markReviewHelpful = (
  agents: MarketplaceAgent[],
  agentId: string,
  reviewId: string
): MarketplaceAgent[] => {
  return agents.map((agent) => {
    if (agent.id !== agentId) {
      return agent;
    }
    return {
      ...agent,
      reviews: agent.reviews.map((review) =>
        review.id === reviewId ? { ...review, helpful: review.helpful + 1 } : review
      ),
    };
  });
};

export const markReviewReported = (
  agents: MarketplaceAgent[],
  agentId: string,
  reviewId: string
): MarketplaceAgent[] => {
  return agents.map((agent) => {
    if (agent.id !== agentId) {
      return agent;
    }
    return {
      ...agent,
      reviews: agent.reviews.map((review) =>
        review.id === reviewId ? { ...review, reported: true } : review
      ),
    };
  });
};
