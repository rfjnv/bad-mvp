"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";

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
          className="w-full px-4 py-2.5 rounded-full bg-bg-panel border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div>
        <div className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2.5">
          {t.catalog.filterCategory}
        </div>
        <div className="flex flex-col gap-0.5">
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
        <div className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2.5">
          {t.catalog.filterBrand}
        </div>
        <div className="flex flex-col gap-0.5">
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
        <div className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2.5">
          {t.catalog.filterPrice}
        </div>
        <div className="flex items-center rounded-full border border-border bg-bg-panel overflow-hidden focus-within:ring-2 focus-within:ring-accent/30">
          <input
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ""))}
            placeholder={t.catalog.priceFrom}
            inputMode="numeric"
            className="w-1/2 min-w-0 px-4 py-2.5 bg-transparent text-sm text-center focus:outline-none"
          />
          <span className="w-px h-5 bg-border shrink-0" />
          <input
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))}
            placeholder={t.catalog.priceTo}
            inputMode="numeric"
            className="w-1/2 min-w-0 px-4 py-2.5 bg-transparent text-sm text-center focus:outline-none"
          />
        </div>
      </div>

      {activeCount > 0 && (
        <button onClick={resetAll} className="text-sm text-accent font-medium text-left">
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-border text-sm font-medium"
        >
          <SlidersIcon />
          {t.catalog.filters}
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[11px] font-semibold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 pb-6 max-h-[85vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">{t.catalog.filters}</div>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-bg-panel flex items-center justify-center text-text-dim"
              >
                ✕
              </button>
            </div>
            {body}
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full mt-6 px-4 py-3.5 rounded-full bg-accent text-white font-semibold"
            >
              Показать {total} {total === 1 ? "товар" : "товаров"}
            </button>
          </div>
        </div>
      )}

      <aside className="hidden md:block w-64 shrink-0">
        <div className="sticky top-24">{body}</div>
      </aside>
    </>
  );
}

function FilterRow({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2 rounded-lg text-[14px] transition-colors ${
        active ? "bg-accent/10 text-accent font-medium" : "text-text hover:bg-bg-panel"
      }`}
    >
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
