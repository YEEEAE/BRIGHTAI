import type { SelectOption } from "../components/ui/Select";
import type { MarketplaceAgent, PublishForm } from "../types/marketplace.types";

export const MARKETPLACE_CATEGORIES = [
  "الكل",
  "محادثة",
  "أتمتة",
  "تحليل",
  "عمليات",
  "تسويق",
  "مبيعات",
] as const;

export const MARKETPLACE_SORT_OPTIONS: SelectOption[] = [
  { value: "popular", label: "الأكثر استخداماً" },
  { value: "newest", label: "الأحدث" },
  { value: "top", label: "الأعلى تقييماً" },
];

export const MARKETPLACE_FEATURED_HIGHLIGHT = "مُوصى به للشركات السعودية";

export const MARKETPLACE_DEFAULT_PUBLISH_FORM: PublishForm = {
  name: "",
  description: "",
  category: "محادثة",
  tags: "",
  priceType: "free",
  priceAmount: 0,
  agree: false,
};

export const MARKETPLACE_SEED_AGENTS: MarketplaceAgent[] = [
  {
    id: "agent-ksa-001",
    name: "مساعد خدمة العملاء الذكي",
    description: "يرد على العملاء بالعربية ويُصعّد الحالات الحساسة للفريق.",
    author: "فريق برايت أي آي",
    category: "محادثة",
    tags: ["دعم", "محادثة", "سعودي"],
    rating: 4.8,
    reviews: [
      {
        id: "review-1",
        author: "شركة لوجستية",
        rating: 5,
        comment: "قلل زمن الرد بشكل واضح ورفع رضا العملاء.",
        helpful: 8,
        reported: false,
        createdAt: "2025-11-05",
      },
      {
        id: "review-2",
        author: "متجر إلكتروني",
        rating: 4,
        comment: "احتجنا لضبط السيناريوهات لكن النتيجة ممتازة.",
        helpful: 3,
        reported: false,
        createdAt: "2025-12-12",
      },
    ],
    downloads: 1240,
    price: { type: "free", label: "مجاني" },
    isFeatured: true,
    createdAt: "2025-12-15",
    previewImages: [
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=900&q=80",
    ],
    demoVideo: "https://www.youtube.com/watch?v=O8wHi6kKQ98",
    workflowPreview: ["جمع الرسائل", "تصنيف الطلب", "اقتراح رد", "تسليم للفريق"],
  },
  {
    id: "agent-ksa-002",
    name: "محلل تقارير المبيعات",
    description: "يحَوّل بيانات المبيعات إلى توصيات يومية قابلة للتنفيذ.",
    author: "مختبر النمو",
    category: "تحليل",
    tags: ["مبيعات", "تقارير", "ذكاء"],
    rating: 4.6,
    reviews: [
      {
        id: "review-3",
        author: "شركة تقنية",
        rating: 5,
        comment: "ساعدنا في اكتشاف منتجات تحقق هامش ربح أعلى.",
        helpful: 5,
        reported: false,
        createdAt: "2026-01-10",
      },
    ],
    downloads: 860,
    price: { type: "paid", label: "مدفوع", amount: 249, currency: "ريال" },
    isFeatured: true,
    createdAt: "2026-01-06",
    previewImages: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    ],
    workflowPreview: ["جمع البيانات", "تحليل الاتجاهات", "مقارنة الأداء", "توصيات"],
  },
  {
    id: "agent-ksa-003",
    name: "منسق عمليات الطلبات",
    description: "يربط أنظمة الطلبات ويوزّع المهام على الفرق تلقائياً.",
    author: "فريق العمليات الذكية",
    category: "أتمتة",
    tags: ["عمليات", "تكامل", "سير عمل"],
    rating: 4.3,
    reviews: [],
    downloads: 520,
    price: { type: "free", label: "مجاني" },
    isFeatured: false,
    createdAt: "2025-10-22",
    previewImages: [
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    ],
    workflowPreview: ["استقبال الطلب", "توجيه الفريق", "متابعة التنفيذ", "تقرير ختامي"],
  },
];
