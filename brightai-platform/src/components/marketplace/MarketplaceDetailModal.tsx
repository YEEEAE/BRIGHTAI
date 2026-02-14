import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import RatingStars from "./RatingStars";
import type { MarketplaceAgent } from "../../types/marketplace.types";

type MarketplaceDetailModalProps = {
  open: boolean;
  agent: MarketplaceAgent | null;
  reviewText: string;
  reviewRating: number;
  onClose: () => void;
  onSetReviewText: (value: string) => void;
  onSetReviewRating: (value: number) => void;
  onAddReview: () => void;
  onHelpful: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
  onUseTemplate: (agent: MarketplaceAgent) => void;
  onTryDemo: (agent: MarketplaceAgent) => void;
  onOpenPreview: () => void;
};

const MarketplaceDetailModal = ({
  open,
  agent,
  reviewText,
  reviewRating,
  onClose,
  onSetReviewText,
  onSetReviewRating,
  onAddReview,
  onHelpful,
  onReport,
  onUseTemplate,
  onTryDemo,
  onOpenPreview,
}: MarketplaceDetailModalProps) => {
  return (
    <Modal open={open} onClose={onClose} title={agent ? agent.name : "تفاصيل الوكيل"} size="xl">
      {agent ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="grid gap-2">
              <p className="text-sm text-slate-300">{agent.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" size="sm">
                  {agent.category}
                </Badge>
                <Badge variant="info" size="sm">
                  {agent.price.label}
                </Badge>
                <Badge variant="success" size="sm">
                  {agent.downloads} استخدام
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag) => (
                  <Badge key={`${agent.id}-detail-${tag}`} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-2">
                <RatingStars value={agent.rating} />
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
              {agent.workflowPreview.map((step, index) => (
                <div
                  key={`${agent.id}-diagram-${index}`}
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
                {agent.reviews.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                    لا توجد مراجعات بعد.
                  </div>
                ) : (
                  agent.reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{review.author}</span>
                        <span>{review.createdAt}</span>
                      </div>
                      <div className="mt-2 text-xs text-amber-300">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={`${review.id}-star-${index}`}>{index < review.rating ? "★" : "☆"}</span>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{review.comment}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onHelpful(review.id)}>
                          مفيد ({review.helpful})
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onReport(review.id)} disabled={review.reported}>
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
                        className={value <= reviewRating ? "text-amber-300" : "text-slate-600"}
                        onClick={() => onSetReviewRating(value)}
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
                  onChange={(event) => onSetReviewText(event.target.value)}
                  className="auth-field min-h-[120px] rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
                  placeholder="اكتب تجربتك مع الوكيل"
                />
                <Button onClick={onAddReview}>إرسال التقييم</Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onUseTemplate(agent)}>استخدم القالب</Button>
            <Button variant="secondary" onClick={() => onTryDemo(agent)}>
              تجربة سريعة
            </Button>
            <Button variant="outline" onClick={onOpenPreview}>
              مشاهدة المعاينة
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default MarketplaceDetailModal;
