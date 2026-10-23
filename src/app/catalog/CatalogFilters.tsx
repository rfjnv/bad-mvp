"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { track } from "@/lib/track";

interface Category {
  id: string;
  slug: string;
  name: string;
}

export default function CatalogFilters({
  categories,
  brands,
  total,
}: {
  categories: Category[];
  brands: string[];
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategory = searchParams.get("category") ?? "";
  const activeBrand = searchParams.get("brand") ?? "";
  const activeCount = [
    searchParams.get("q"),
    activeCategory,
    activeBrand,
    searchParams.get("priceMin"),
    searchParams.get("priceMax"),
  ].filter(Boolean).length;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/catalog?${params.toString()}`);
  }

  function resetAll() {
    setQ("");
    setPriceMin("");
    setPriceMax("");
    const params = new URLSearchParams(searchParams.toString());
    const sort = params.get("sort");
    router.push(sort ? `/catalog?sort=${sort}` : "/catalog");
  }

  // Поисковый запрос считаем один раз, когда каталог уже отдал результат:
  // запрос без результатов — самый полезный сигнал о том, чего нет в ассортименте
  const activeQ = searchParams.get("q") ?? "";
  const lastTrackedQ = useRef("");
  useEffect(() => {
    const query = activeQ.trim();
    if (!query || query === lastTrackedQ.current) return;
    lastTrackedQ.current = query;
    track("search", query.toLowerCase().slice(0, 100), { results: total });
  }, [activeQ, total]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("q", q), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (priceMin) params.set("priceMin", priceMin);
      else params.delete("priceMin");
      if (priceMax) params.set("priceMax", priceMax);
      else params.delete("priceMax");
      params.delete("page");
      router.push(`/catalog?${params.toString()}`);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMin, priceMax]);

  const body = (
    <div className="flex flex-col gap-6">
      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.catalog.searchPlaceholder}
          type="search"
          aria-label={t.catalog.searchPlaceholder}
          className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-text text-[15px] placeholder:text-text-dim focus:outline-none focus:border-amber"
        />
      </div>

      <div>
        <div className="label-mono text-text-dim mb-2">
          {t.catalog.filterCategory}
        </div>
        <div className="flex flex-col">
          <FilterRow
            active={activeCategory === ""}
            label={t.catalog.allCategories}
            onClick={() => updateParam("category", "")}
          />
          {categories.map((c) => (
            <FilterRow
              key={c.id}
              active={activeCategory === c.slug}
              label={c.name}
              onClick={() => updateParam("category", c.slug)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="label-mono text-text-dim mb-2">
          {t.catalog.filterBrand}
        </div>
        <div className="flex flex-col">
          <FilterRow
            active={activeBrand === ""}
            label={t.catalog.allBrands}
            onClick={() => updateParam("brand", "")}
          />
          {brands.map((b) => (
            <FilterRow key={b} active={activeBrand === b} label={b} onClick={() => updateParam("brand", b)} />
          ))}
        </div>
      </div>

      <div>
        <div className="label-mono text-text-dim mb-2">
          {t.catalog.filterPrice}
        </div>
        <div className="flex items-center gap-3">
          <input
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ""))}
            placeholder={t.catalog.priceFrom}
            inputMode="numeric"
            className="w-1/2 min-w-0 px-0 py-2 bg-transparent border-0 border-b border-border text-[14px] tabular focus:outline-none focus:border-text"
          />
          <span className="text-text-dim">—</span>
          <input
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))}
            placeholder={t.catalog.priceTo}
            inputMode="numeric"
            className="w-1/2 min-w-0 px-0 py-2 bg-transparent border-0 border-b border-border text-[14px] tabular focus:outline-none focus:border-text"
          />
        </div>
      </div>

      {activeCount > 0 && (
        <button onClick={resetAll} className="text-sm link-action text-left min-h-[44px] flex items-center">
          {t.catalog.resetFilters}
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg border border-text text-sm font-medium"
        >
          <SlidersIcon />
          {t.catalog.filters}
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber text-white text-[11px] font-semibold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div role="dialog"
            aria-modal="true"
            aria-label={t.catalog.filters}
            className="absolute bottom-0 inset-x-0 bg-bg rounded-t-3xl p-5 pb-6 max-h-[85vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[22px] font-medium tracking-[-0.03em]">{t.catalog.filters}</div>
              <button
                onClick={() => setSheetOpen(false)}
                className="h-11 px-1 text-[14px] font-medium"
              >
                Закрыть
              </button>
            </div>
            {body}
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full mt-6 px-4 py-3.5 rounded-lg btn btn-primary font-semibold"
            >
              Показать {total} {total === 1 ? "товар" : "товаров"}
            </button>
          </div>
        </div>
      )}

      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-24">{body}</div>
      </aside>
    </>
  );
}

function FilterRow({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left min-h-[38px] flex items-center text-[15px] transition-colors duration-200 ${
        active ? "text-text font-medium" : "text-text-dim hover:text-text"
      }`}
      aria-pressed={active}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-3 shrink-0 transition-colors duration-200 ${active ? "bg-amber" : "bg-transparent"}`} />
      {label}
    </button>
  );
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" fill="white" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="16" cy="12" r="2" fill="white" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="11" cy="18" r="2" fill="white" />
    </svg>
  );
}
