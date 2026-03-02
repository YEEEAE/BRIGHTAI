export type AgentPrice =
  | { type: "free"; label: "مجاني" }
  | { type: "paid"; label: "مدفوع"; amount: number; currency: "ريال" };

export type AgentReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  helpful: number;
  reported: boolean;
  createdAt: string;
};

export type MarketplaceAgent = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  rating: number;
  reviews: AgentReview[];
  downloads: number;
  price: AgentPrice;
  isFeatured: boolean;
  createdAt: string;
  previewImages: string[];
  demoVideo?: string;
  workflowPreview: string[];
};

export type PublishForm = {
  name: string;
  description: string;
  category: string;
  tags: string;
  priceType: "free" | "paid";
  priceAmount: number;
  agree: boolean;
};

export type MarketplaceSortKey = "popular" | "newest" | "top";

export type MarketplaceMessage = string | null;

export type MarketplaceQuickActionHandlers = {
  onOpenPreview: (agent: MarketplaceAgent) => void;
  onOpenDetail: (agent: MarketplaceAgent) => void;
  onUseTemplate: (agent: MarketplaceAgent) => void;
  onTryDemo: (agent: MarketplaceAgent) => void;
};
