import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";
import BannerHero from "@/components/BannerHero";
import CategoryTile from "@/components/CategoryTile";
import SeasonalAdvisoryCard from "@/components/SeasonalAdvisory";
import { getSeasonalAdvisory } from "@/lib/seasonal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, categories, bestsellerItems, newest, bundles] = await Promise.all([
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.bundle.findMany({
      where: { isActive: true },
      include: { items: { include: { product: true } } },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
  ]);

  const bestsellerIds = bestsellerItems.map((b) => b.productId);
  const bestsellerProducts = bestsellerIds.length
    ? await prisma.product.findMany({ where: { id: { in: bestsellerIds }, isActive: true } })
    : [];
  const bestsellers = bestsellerIds
    .map((id) => bestsellerProducts.find((p) => p.id === id))
    .filter((p): p is (typeof bestsellerProducts)[number] => Boolean(p));

  const advisory = getSeasonalAdvisory();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-16">
      {banners.length > 0 && <BannerHero banners={banners} />}

      <SeasonalAdvisoryCard advisory={advisory} />

      {bundles.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.bundles.pageTitle}</h2>
            <Link href="/bundles" className="text-sm text-accent font-medium hover:text-accent-dark">
              {t.home.viewAll}
            </Link>
          </div>
          <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {bundles.map((b) => {
              const normalPrice = b.items.reduce((sum, i) => sum + i.product.price, 0);
              const bundlePrice = Math.round(normalPrice * (1 - b.discountPct / 100));
              return (
                <Link
                  key={b.id}
                  href={`/bundles/${b.slug}`}
                  className="group flex flex-col shrink-0 w-[70%] sm:w-auto snap-start bg-white border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-bg-panel">
                    <Image
                      src={b.imageUrl}
                      alt={b.name}
                      fill
                      sizes="(max-width: 640px) 70vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-accent text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {t.bundles.save(b.discountPct)}
                    </span>
                  </div>
                  <div className="p-3.5 flex flex-col gap-1">
                    <div className="font-medium text-sm line-clamp-1">{b.name}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold tracking-tight">{formatSum(bundlePrice)}</span>
                      <span className="text-xs text-text-dim line-through">{formatSum(normalPrice)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-5">{t.home.categoriesTitle}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((c) => (
            <CategoryTile key={c.id} slug={c.slug} name={c.name} />
          ))}
        </div>
      </section>

      {bestsellers.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.home.bestsellersTitle}</h2>
            <Link href="/catalog" className="text-sm text-accent font-medium hover:text-accent-dark">
              {t.home.viewAll}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.home.newTitle}</h2>
          <Link href="/catalog" className="text-sm text-accent font-medium hover:text-accent-dark">
            {t.home.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
