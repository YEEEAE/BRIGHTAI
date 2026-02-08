import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select, { type SelectOption } from "../components/ui/Select";

type AgentPrice =
  | { type: "free"; label: "مجاني" }
  | { type: "paid"; label: "مدفوع"; amount: number; currency: "ريال" };

type AgentReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  helpful: number;
  reported: boolean;
  createdAt: string;
};

type MarketplaceAgent = {
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

type PublishForm = {
  name: string;
  description: string;
  category: string;
  tags: string;
  priceType: "free" | "paid";
  priceAmount: number;
  agree: boolean;
};

const categories = ["الكل", "محادثة", "أتمتة", "تحليل", "عمليات", "تسويق", "مبيعات"];

const sortOptions: SelectOption[] = [
  { value: "popular", label: "الأكثر استخداماً" },
  { value: "newest", label: "الأحدث" },
  { value: "top", label: "الأعلى تقييماً" },
];

const featuredHighlight = "مُوصى به للشركات السعودية";

const seedAgents: MarketplaceAgent[] = [
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

const Marketplace = () => {
  // حالة السوق والمرشحات
  const [agents, setAgents] = useState<MarketplaceAgent[]>(seedAgents);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [sortKey, setSortKey] = useState(sortOptions[0].value);
  const [activeAgent, setActiveAgent] = useState<MarketplaceAgent | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const [publishForm, setPublishForm] = useState<PublishForm>({
    name: "",
    description: "",
    category: "محادثة",
    tags: "",
    priceType: "free",
    priceAmount: 0,
    agree: false,
  });

  useEffect(() => {
    document.title = "سوق الوكلاء | منصة برايت أي آي";
  }, []);

  const categoryOptions = useMemo<SelectOption[]>(
    () => categories.map((item) => ({ value: item, label: item })),
    []
  );

  const filteredAgents = useMemo(() => {
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
  }, [agents, category, search, sortKey]);

  const featuredAgents = filteredAgents.filter((agent) => agent.isFeatured);
  const regularAgents = filteredAgents.filter((agent) => !agent.isFeatured);

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
    const newAgent: MarketplaceAgent = {
      id: `agent-${Date.now()}`,
      name: publishForm.name,
      description: publishForm.description,
      author: "المنشئ الحالي",
      category: publishForm.category,
      tags: publishForm.tags
        .split("،")
        .map((tag) => tag.trim())
        .filter(Boolean),
      rating: 0,
      reviews: [],
      downloads: 0,
      price:
        publishForm.priceType === "paid"
          ? {
              type: "paid",
              label: "مدفوع",
              amount: publishForm.priceAmount,
              currency: "ريال",
            }
          : { type: "free", label: "مجاني" },
      isFeatured: false,
      createdAt: new Date().toISOString(),
      previewImages: [],
      workflowPreview: ["إعدادات أولية", "تشغيل", "نتائج"],
    };
    setAgents((prev) => [newAgent, ...prev]);
    setPublishOpen(false);
    setMessage("تم إرسال الوكيل للمراجعة والنشر.");
    setPublishForm({
      name: "",
      description: "",
      category: "محادثة",
      tags: "",
      priceType: "free",
      priceAmount: 0,
      agree: false,
    });
  };

  const handleAddReview = () => {
    if (!activeAgent) {
      return;
    }
    if (!reviewText.trim()) {
      setMessage("يرجى كتابة رأيك قبل الإرسال.");
      return;
    }
    const newReview: AgentReview = {
      id: `review-${Date.now()}`,
      author: "مستخدم جديد",
      rating: reviewRating,
      comment: reviewText.trim(),
      helpful: 0,
      reported: false,
      createdAt: new Date().toISOString(),
    };
    const updated = agents.map((agent) => {
      if (agent.id !== activeAgent.id) {
        return agent;
      }
      const reviews = [newReview, ...agent.reviews];
      const avgRating =
        reviews.reduce((sum, item) => sum + item.rating, 0) / Math.max(1, reviews.length);
      return { ...agent, reviews, rating: Number(avgRating.toFixed(1)) };
    });
    setAgents(updated);
    const refreshed = updated.find((agent) => agent.id === activeAgent.id) || null;
    setActiveAgent(refreshed);
    setReviewText("");
    setReviewRating(5);
  };

  const handleHelpful = (reviewId: string) => {
    if (!activeAgent) {
      return;
    }
    const updated = agents.map((agent) => {
      if (agent.id !== activeAgent.id) {
        return agent;
      }
      const reviews = agent.reviews.map((review) =>
        review.id === reviewId ? { ...review, helpful: review.helpful + 1 } : review
      );
      return { ...agent, reviews };
    });
    setAgents(updated);
    setActiveAgent(updated.find((agent) => agent.id === activeAgent.id) || null);
  };

  const handleReport = (reviewId: string) => {
    if (!activeAgent) {
      return;
    }
    const updated = agents.map((agent) => {
      if (agent.id !== activeAgent.id) {
        return agent;
      }
      const reviews = agent.reviews.map((review) =>
        review.id === reviewId ? { ...review, reported: true } : review
      );
      return { ...agent, reviews };
    });
    setAgents(updated);
    setActiveAgent(updated.find((agent) => agent.id === activeAgent.id) || null);
    setMessage("تم استلام البلاغ وسيتم مراجعته.");
  };

  const renderStars = (value: number) => {
    const filled = Math.round(value);
    return (
      <div className="flex items-center gap-1 text-xs text-amber-300">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={`star-${index}`} aria-hidden="true">
            {index < filled ? "★" : "☆"}
          </span>
        ))}
        <span className="text-slate-400">{value.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">سوق الوكلاء</h1>
          <p className="mt-1 text-sm text-slate-400">
            اكتشف وكلاء جاهزين للأعمال السعودية مع نتائج قابلة للقياس.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setPublishOpen(true)}>
          نشر وكيل جديد
        </Button>
      </header>

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن وكيل أو تصنيف"
            className="flex-1"
            allowClear
          />
          <div className="w-full sm:w-48">
            <Select
              options={categoryOptions}
              value={category}
              onChange={(value) => setCategory(String(value))}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={sortOptions}
              value={sortKey}
              onChange={(value) => setSortKey(String(value))}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">الوكلاء المميزون</h2>
          <span className="text-xs text-emerald-200">{featuredHighlight}</span>
        </div>
        {featuredAgents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">لا توجد وكلاء مميزة حالياً.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {featuredAgents.map((agent) => (
              <Card
                key={agent.id}
                variant="gradient"
                hoverable
                header={
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{agent.name}</h3>
                      <p className="text-xs text-slate-400">بواسطة {agent.author}</p>
                    </div>
                    <Badge variant="info" size="sm">
                      {agent.category}
                    </Badge>
                  </div>
                }
                body={<p className="text-sm text-slate-300">{agent.description}</p>}
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {renderStars(agent.rating)}
                      <p className="mt-1 text-xs text-slate-500">
                        استخدامات: {agent.downloads}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleOpenPreview(agent)}>
                        معاينة
                      </Button>
                      <Button size="sm" onClick={() => handleOpenDetail(agent)}>
                        التفاصيل
                      </Button>
                    </div>
                  </div>
                }
              >
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.tags.map((tag) => (
                    <Badge key={`${agent.id}-${tag}`} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {regularAgents.map((agent) => (
          <Card
            key={agent.id}
            hoverable
            header={
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{agent.name}</h3>
                  <p className="text-xs text-slate-500">بواسطة {agent.author}</p>
                </div>
                <Badge variant="default" size="sm">
                  {agent.category}
                </Badge>
              </div>
            }
            body={<p className="text-sm text-slate-300">{agent.description}</p>}
            footer={
              <div className="flex items-center justify-between">
                <div>
                  {renderStars(agent.rating)}
                  <p className="text-xs text-slate-500">{agent.downloads} استخدام</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenDetail(agent)}>
                  عرض
                </Button>
              </div>
            }
          >
            <div className="mt-4 flex flex-wrap gap-2">
              {agent.tags.map((tag) => (
                <Badge key={`${agent.id}-${tag}`} variant="info" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </section>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={activeAgent ? `معاينة ${activeAgent.name}` : "معاينة"}
        size="lg"
      >
        {activeAgent ? (
          <div className="grid gap-4">
            <p className="text-sm text-slate-300">{activeAgent.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {activeAgent.previewImages.length > 0 ? (
                activeAgent.previewImages.map((image, index) => (
                  <div
                    key={`${activeAgent.id}-preview-${index}`}
                    className="overflow-hidden rounded-xl border border-slate-800"
                  >
                    <img src={image} alt="معاينة" className="h-40 w-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                  لا توجد صور معاينة.
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-slate-200">مخطط سير العمل</h3>
              <ul className="mt-2 grid gap-2 text-sm text-slate-300">
                {activeAgent.workflowPreview.map((step, index) => (
                  <li key={`${activeAgent.id}-step-${index}`}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleUseTemplate(activeAgent)}>استخدم الوكيل</Button>
              <Button variant="secondary" onClick={() => handleTryDemo(activeAgent)}>
                تجربة سريعة
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={activeAgent ? activeAgent.name : "تفاصيل الوكيل"}
        size="xl"
      >
        {activeAgent ? (
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="grid gap-2">
                <p className="text-sm text-slate-300">{activeAgent.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" size="sm">
                    {activeAgent.category}
                  </Badge>
                  <Badge variant="info" size="sm">
                    {activeAgent.price.label}
                  </Badge>
                  <Badge variant="success" size="sm">
                    {activeAgent.downloads} استخدام
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeAgent.tags.map((tag) => (
                    <Badge key={`${activeAgent.id}-detail-${tag}`} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2">
                  {renderStars(activeAgent.rating)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-sm font-semibold text-slate-200">تعليمات التثبيت</h3>
                <ol className="mt-2 grid gap-2 text-sm text-slate-300">
                  <li>١. افتح لوحة الوكلاء ثم اختر إضافة وكيل.</li>
                  <li>٢. انسخ إعدادات القالب إلى الوكيل الجديد.</li>
                  <li>٣. راجع التكاملات ثم احفظ التغييرات.</li>
                </ol>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-slate-200">معاينة سير العمل</h3>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                {activeAgent.workflowPreview.map((step, index) => (
                  <div
                    key={`${activeAgent.id}-diagram-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    <span className="text-xs text-emerald-300">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h3 className="text-sm font-semibold text-slate-200">التقييمات والمراجعات</h3>
                <div className="mt-3 grid gap-3">
                  {activeAgent.reviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                      لا توجد مراجعات بعد.
                    </div>
                  ) : (
                    activeAgent.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{review.author}</span>
                          <span>{review.createdAt}</span>
                        </div>
                        <div className="mt-2 text-xs text-amber-300">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span key={`${review.id}-star-${index}`}>
                              {index < review.rating ? "★" : "☆"}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{review.comment}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleHelpful(review.id)}>
                            مفيد ({review.helpful})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReport(review.id)}
                            disabled={review.reported}
                          >
                            {review.reported ? "تم الإبلاغ" : "إبلاغ"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h3 className="text-sm font-semibold text-slate-200">أضف تقييمك</h3>
                <div className="mt-3 grid gap-3">
                  <label className="text-xs text-slate-400">التقييم</label>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={`new-star-${value}`}
                          type="button"
                          className={
                            value <= reviewRating
                              ? "text-amber-300"
                              : "text-slate-600"
                          }
                          onClick={() => setReviewRating(value)}
                          aria-label={`تقييم ${value}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <label className="text-xs text-slate-400">مراجعتك</label>
                  <textarea
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    className="auth-field min-h-[120px] rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
                    placeholder="اكتب تجربتك مع الوكيل"
                  />
                  <Button onClick={handleAddReview}>إرسال التقييم</Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleUseTemplate(activeAgent)}>استخدم القالب</Button>
              <Button variant="secondary" onClick={() => handleTryDemo(activeAgent)}>
                تجربة سريعة
              </Button>
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                مشاهدة المعاينة
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="نشر وكيل في السوق"
        size="lg"
      >
        <div className="grid gap-4">
          <Input
            label="اسم الوكيل"
            value={publishForm.name}
            onChange={(event) =>
              setPublishForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="مثال: مساعد التحصيل الذكي"
          />
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-200">وصف الوكيل</label>
            <textarea
              value={publishForm.description}
              onChange={(event) =>
                setPublishForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="auth-field min-h-[140px] rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
              placeholder="صف القيمة التجارية والنتائج المتوقعة"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-200">التصنيف</label>
            <Select
              options={categoryOptions.filter((item) => item.value !== "الكل")}
              value={publishForm.category}
              onChange={(value) => setPublishForm((prev) => ({ ...prev, category: String(value) }))}
            />
          </div>
          <Input
            label="وسوم"
            value={publishForm.tags}
            onChange={(event) =>
              setPublishForm((prev) => ({ ...prev, tags: event.target.value }))
            }
            placeholder="مثال: مبيعات، أتمتة، دعم"
            helperText="استخدم الفاصلة العربية للفصل بين الوسوم"
          />
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-200">التسعير</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPublishForm((prev) => ({ ...prev, priceType: "free" }))}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  publishForm.priceType === "free"
                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                    : "border-slate-800 text-slate-300"
                }`}
              >
                مجاني
              </button>
              <button
                type="button"
                onClick={() => setPublishForm((prev) => ({ ...prev, priceType: "paid" }))}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  publishForm.priceType === "paid"
                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                    : "border-slate-800 text-slate-300"
                }`}
              >
                مدفوع
              </button>
              {publishForm.priceType === "paid" ? (
                <Input
                  value={publishForm.priceAmount}
                  onChange={(event) =>
                    setPublishForm((prev) => ({
                      ...prev,
                      priceAmount: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  placeholder="السعر بالريال"
                />
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
            <p>سيتم مراجعة الوكيل قبل النشر للتأكد من جودة التجربة.</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                id="publishAgree"
                type="checkbox"
                checked={publishForm.agree}
                onChange={(event) =>
                  setPublishForm((prev) => ({ ...prev, agree: event.target.checked }))
                }
              />
              <label htmlFor="publishAgree">أتعهد بصحة المحتوى واحترام سياسات المنصة.</label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePublishSubmit}>إرسال للمراجعة</Button>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Marketplace;
