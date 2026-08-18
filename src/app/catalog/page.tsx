import { prisma } from "@/lib/prisma";
import { catalogQuerySchema } from "@/lib/validation";
import { t } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "./CatalogFilters";
import CatalogSort from "./CatalogSort";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

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

  const [categories, allActive] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    }),
  ]);
  const brands = [...new Set(allActive.map((p) => p.brand))].sort();

  let filtered = allActive;

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

  switch (query.sort) {
    case "price_asc":
      filtered = [...filtered].sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filtered = [...filtered].sort((a, b) => b.price - a.price);
      break;
    case "name_asc":
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ru"));
      break;
    default:
      filtered = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = Boolean(query.q || query.category || query.brand || query.priceMin || query.priceMax);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="display-1 mb-6">{t.catalog.title}</h1>

      <div className="flex flex-col md:flex-row gap-8">
        <CatalogFilters categories={categories} brands={brands} total={total} />

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-text-dim">
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {pageItems.map((p) => (
                <ProductCard key={p.id} product={p} />
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
                    className={`w-11 h-11 flex items-center justify-center rounded-lg text-[15px] border transition-colors duration-150 ${
                      p === page
                        ? "bg-accent text-white border-accent font-semibold"
                        : "bg-white text-text border-border font-medium hover:border-border-strong"
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
