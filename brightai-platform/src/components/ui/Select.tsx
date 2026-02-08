import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type SelectProps = {
  options?: SelectOption[];
  loadOptions?: (query: string) => Promise<SelectOption[]>;
  value?: string | string[];
  onChange?: (value: string | string[], options: SelectOption | SelectOption[]) => void;
  placeholder?: string;
  searchable?: boolean;
  isMulti?: boolean;
  disabled?: boolean;
  error?: string;
  renderOption?: (option: SelectOption, selected: boolean) => ReactNode;
  className?: string;
  noOptionsText?: string;
  loadingText?: string;
};

/**
 * قائمة اختيار قابلة للبحث والتعدد والتحميل غير المتزامن.
 */
const Select = ({
  options = [],
  loadOptions,
  value,
  onChange,
  placeholder = "اختر خياراً",
  searchable = true,
  isMulti,
  disabled,
  error,
  renderOption,
  className,
  noOptionsText = "لا توجد نتائج",
  loadingText = "جارٍ التحميل",
}: SelectProps) => {
  // قائمة اختيار متقدمة بدعم البحث والخيارات المتعددة
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SelectOption[]>(options);

  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }, [value]);

  const selectedOptions = useMemo(() => {
    if (!selectedValues.length) {
      return [];
    }
    return items.filter((option) => selectedValues.includes(option.value));
  }, [items, selectedValues]);

  const displayLabel = useMemo(() => {
    if (selectedOptions.length === 0) {
      return "";
    }
    if (isMulti) {
      return selectedOptions.map((option) => option.label).join("، ");
    }
    return selectedOptions[0]?.label || "";
  }, [isMulti, selectedOptions]);

  const loadAsync = useCallback(
    async (keyword: string) => {
      if (!loadOptions) {
        return;
      }
      setLoading(true);
      try {
        const data = await loadOptions(keyword);
        setItems(data);
      } finally {
        setLoading(false);
      }
    },
    [loadOptions]
  );

  useEffect(() => {
    setItems(options);
  }, [options]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (loadOptions) {
      loadAsync(query);
    }
  }, [open, query, loadAsync, loadOptions]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query) {
      return items;
    }
    const lowered = query.toLowerCase();
    return items.filter(
      (option) =>
        option.label.toLowerCase().includes(lowered) ||
        option.value.toLowerCase().includes(lowered)
    );
  }, [items, query, searchable]);

  const toggleOption = (option: SelectOption) => {
    if (option.disabled) {
      return;
    }
    if (isMulti) {
      const exists = selectedValues.includes(option.value);
      const nextValues = exists
        ? selectedValues.filter((item) => item !== option.value)
        : [...selectedValues, option.value];
      const nextOptions = items.filter((item) => nextValues.includes(item.value));
      onChange?.(nextValues, nextOptions);
    } else {
      onChange?.(option.value, option);
      setOpen(false);
    }
  };

  const handleClear = () => {
    if (disabled) {
      return;
    }
    if (isMulti) {
      onChange?.([], []);
    } else {
      onChange?.("", { value: "", label: "" });
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border bg-slate-950/60 px-4 py-3 text-base text-slate-100 transition",
          error
            ? "border-rose-500/60"
            : "border-slate-800 hover:border-emerald-400/50",
          disabled ? "cursor-not-allowed opacity-60" : ""
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn("truncate text-right", displayLabel ? "" : "text-slate-500")}>
          {displayLabel || placeholder}
        </span>
        <span className="text-slate-400">▾</span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-xl shadow-slate-950/40">
          {searchable ? (
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mb-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              placeholder="ابحث عن خيار"
            />
          ) : null}
          <div className="max-h-64 overflow-auto pr-1">
            {loading ? (
              <div className="py-4 text-center text-sm text-slate-400">{loadingText}</div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-slate-400">{noOptionsText}</div>
            ) : (
              filteredOptions.map((option) => {
                const selected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-right text-sm transition",
                      selected ? "bg-emerald-400/10 text-emerald-200" : "text-slate-200",
                      option.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-slate-800/70"
                    )}
                    role="option"
                    aria-selected={selected}
                  >
                    <span className="flex flex-col">
                      <span>{renderOption ? renderOption(option, selected) : option.label}</span>
                      {option.description ? (
                        <span className="text-xs text-slate-500">{option.description}</span>
                      ) : null}
                    </span>
                    {selected ? <span className="text-emerald-300">✓</span> : null}
                  </button>
                );
              })
            )}
          </div>
          {(isMulti ? selectedValues.length > 0 : Boolean(displayLabel)) ? (
            <button
              type="button"
              onClick={handleClear}
              className="mt-3 w-full rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:border-emerald-400/40 hover:text-slate-200"
            >
              مسح الاختيارات
            </button>
          ) : null}
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
};

export default Select;
