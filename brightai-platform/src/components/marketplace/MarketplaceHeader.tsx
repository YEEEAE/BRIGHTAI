import Button from "../ui/Button";

type MarketplaceHeaderProps = {
  onOpenPublish: () => void;
};

const MarketplaceHeader = ({ onOpenPublish }: MarketplaceHeaderProps) => {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">سوق الوكلاء</h1>
        <p className="mt-1 text-sm text-slate-400">
          اكتشف وكلاء جاهزين للأعمال السعودية مع نتائج قابلة للقياس.
        </p>
      </div>
      <Button variant="secondary" onClick={onOpenPublish}>
        نشر وكيل جديد
      </Button>
    </header>
  );
};

export default MarketplaceHeader;
