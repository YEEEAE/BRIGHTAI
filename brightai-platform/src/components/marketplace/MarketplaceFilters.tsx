import Input from "../ui/Input";
import Select, { type SelectOption } from "../ui/Select";

type MarketplaceFiltersProps = {
  search: string;
  category: string;
  sortKey: string;
  categoryOptions: SelectOption[];
  sortOptions: SelectOption[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

const MarketplaceFilters = ({
  search,
  category,
  sortKey,
  categoryOptions,
  sortOptions,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: MarketplaceFiltersProps) => {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث عن وكيل أو تصنيف"
          className="flex-1"
          allowClear
        />
        <div className="w-full sm:w-48">
          <Select options={categoryOptions} value={category} onChange={(value) => onCategoryChange(String(value))} />
        </div>
        <div className="w-full sm:w-48">
          <Select options={sortOptions} value={sortKey} onChange={(value) => onSortChange(String(value))} />
        </div>
      </div>
    </section>
  );
};

export default MarketplaceFilters;
