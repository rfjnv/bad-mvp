import { prisma } from "@/lib/prisma";
import { catalogQuerySchema } from "@/lib/validation";
import { t } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "./CatalogFilters";
import CatalogSort from "./CatalogSort";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { findGoal } from "@/lib/goals";
import { computePricePerUnit } from "@/lib/activeValue";
import { getBestValueSlugs } from "@/lib/bestValue";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );
  const query = catalogQuerySchema.parse(flat);

  const [categories, allActive, bestValueSlugs] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    }),
    getBestValueSlugs(),
  ]);
  const activeCategory = query.category ? categories.find((c) => c.slug === query.category) : null;
  const brands = [...new Set(allActive.map((p) => p.brand))].sort();

  let filtered = allActive;

  // Цель раскрывается в набор категорий: «Плохо сплю» → магний + B-комплекс
  const goal = findGoal(query.goal);
  if (goal) {
    filtered = filtered.filter((p) => goal.categorySlugs.includes(p.category.slug));
  }
  if (query.category) {
    filtered = filtered.filter((p) => p.category.slug === query.category);
  }
  if (query.brand) {
    filtered = filtered.filter((p) => p.brand === query.brand);
  }
  if (query.priceMin !== undefined) {
    filtered = filtered.filter((p) => p.price >= query.priceMin!);
  }
  if (query.priceMax !== undefined) {
    filtered = filtered.filter((p) => p.price <= query.priceMax!);
  }
  if (query.q && query.q.trim()) {
    const needle = query.q.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        p.composition.toLowerCase().includes(needle)
    );
  }

  // «Дешевле за вещество» сравнивает мг с мг только внутри одной категории —
  // без выбранной категории откатываемся к обычной сортировке по дате
  const sort = query.sort === "value_asc" && !query.category ? undefined : query.sort;

  switch (sort) {
    case "price_asc":
      filtered = [...filtered].sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filtered = [...filtered].sort((a, b) => b.price - a.price);
      break;
    case "name_asc":
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ru"));
      break;
    case "value_asc": {
      // Товары без действующего вещества (BCAA, протеин) не выпадают
      // из выдачи — уходят в конец, отсортированные как обычно
      const withValue = filtered
        .map((p) => ({ p, v: computePricePerUnit(p) }))
        .filter((x): x is { p: (typeof filtered)[number]; v: NonNullable<ReturnType<typeof computePricePerUnit>> } => x.v !== null)
        .sort((a, b) => a.v.pricePerBasis - b.v.pricePerBasis)
        .map((x) => x.p);
      const withoutValue = filtered
        .filter((p) => !computePricePerUnit(p))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      filtered = [...withValue, ...withoutValue];
      break;
    }
    default:
      filtered = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = Boolean(
    query.q || query.goal || query.category || query.brand || query.priceMin || query.priceMax
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
      <header className="flex flex-col gap-3 mb-8 sm:mb-12">
        <span className="label-mono text-text-dim">
          {goal ? "Подбор по ощущению" : "Каталог"} · {total} {total === 1 ? "товар" : "товаров"}
        </span>
        <h1 className="display-1">{goal ? goal.title : activeCategory ? activeCategory.name : t.catalog.title}</h1>
        {goal && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-text-dim text-[17px]">{goal.hint}</p>
            <Link href="/catalog" className="text-sm link-action">
              Показать весь каталог
            </Link>
          </div>
        )}
        {activeCategory?.formGuide && (
          <p className="border-l-2 border-amber pl-4 mt-2 max-w-2xl text-[15px] text-text-dim leading-relaxed">
            {activeCategory.formGuide}
          </p>
        )}
      </header>

      {/* Телефон: категории лентой — не открывать шторку фильтров ради одной категории */}
      <nav className="md:hidden -mx-4 px-4 mb-5 flex gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] border-b border-border" aria-label="Категории">
        {[{ slug: "", name: "Все" }, ...categories].map((c) => {
          const active = (query.category ?? "") === c.slug;
          const params = new URLSearchParams(flat as Record<string, string>);
          if (c.slug) params.set("category", c.slug);
          else params.delete("category");
          params.delete("page");
          return (
            <Link
              key={c.slug || "all"}
              href={`/catalog?${params.toString()}`}
              className={`py-3 text-[15px] border-b-2 -mb-px transition-colors ${active ? "border-text text-text font-medium" : "border-transparent text-text-dim"}`}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col md:flex-row gap-5 md:gap-12">
        <CatalogFilters categories={categories} brands={brands} total={total} />

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="label-mono text-text-dim hidden md:block">
              {t.catalog.found}: {total}
            </div>
            <CatalogSort />
          </div>

          {pageItems.length === 0 ? (
            <EmptyState
              title={t.catalog.empty}
              hint={t.catalog.emptyHint}
              action={
                hasFilters && (
                  <Link href="/catalog" className="text-sm link-action">
                    {t.catalog.resetFilters}
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
              {pageItems.map((p) => (
                <ProductCard key={p.id} product={p} bestValue={bestValueSlugs.has(p.slug)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams(flat as Record<string, string>);
                params.set("page", String(p));
                return (
                  <Link
                    key={p}
                    href={`/catalog?${params.toString()}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`w-11 h-11 flex items-center justify-center rounded-lg text-[15px] tabular border transition-colors duration-200 ${
                      p === page ? "bg-text text-bg border-text" : "text-text border-border hover:border-text"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
