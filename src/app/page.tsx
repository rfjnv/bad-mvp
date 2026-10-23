import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";
import BannerHero from "@/components/BannerHero";
import ScrollCarousel from "@/components/ScrollCarousel";
import GoalPicker from "@/components/GoalPicker";
import SunHero from "@/components/SunHero";
import { categoryColor } from "@/lib/categoryColors";

export const dynamic = "force-dynamic";

const withCategory = { category: { select: { slug: true } } } as const;

export default async function HomePage() {
  const [banners, categories, shelf, bestsellerItems, newest, bundles] = await Promise.all([
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { categoryId: true, imageUrl: true },
      orderBy: { price: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: withCategory,
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
    ? await prisma.product.findMany({ where: { id: { in: bestsellerIds }, isActive: true }, include: withCategory })
    : [];
  const bestsellers = bestsellerIds
    .map((id) => bestsellerProducts.find((p) => p.id === id))
    .filter((p): p is (typeof bestsellerProducts)[number] => Boolean(p));

  // Полка: у каждой категории — её цвет, банка и число товаров
  const tiles = categories
    .map((c) => {
      const items = shelf.filter((p) => p.categoryId === c.id);
      return { ...c, count: items.length, image: items[0]?.imageUrl ?? null };
    })
    .filter((c) => c.count > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 flex flex-col gap-16 sm:gap-24">
      <SunHero />

      <GoalPicker />

      <section>
        <SectionHead title={t.home.categoriesTitle} href="/catalog" />
        <ul className="m-0 p-0 list-none grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {tiles.map((c) => {
            const color = categoryColor(c.slug);
            return (
              <li key={c.id}>
                <Link
                  href={`/catalog?category=${c.slug}`}
                  className="group relative flex flex-col aspect-[4/5] sm:aspect-square rounded-3xl p-4 sm:p-5 overflow-hidden"
                  style={{ backgroundColor: color.solid, color: color.onSolid }}
                >
                  <span className="relative z-10 flex flex-col gap-1">
                    <span className="font-display text-[16px] sm:text-[22px] font-bold leading-[1.1] max-w-[90%]">{c.name}</span>
                    <span className="text-[13px] font-medium opacity-80">
                      {c.count} {c.count === 1 ? "товар" : c.count < 5 ? "товара" : "товаров"}
                    </span>
                  </span>
                  {c.image && (
                    <span className="absolute -right-[8%] -bottom-[6%] w-[68%] aspect-square rounded-full transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-[-6deg]" style={{ backgroundColor: color.tint }}>
                      <Image src={c.image} alt="" fill sizes="(max-width: 640px) 34vw, 200px" className="object-contain p-[14%] mix-blend-multiply brightness-[1.04]" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/catalog"
              className="group flex flex-col justify-between aspect-[4/5] sm:aspect-square rounded-3xl p-4 sm:p-5 border-2 border-text hover:bg-sun transition-colors duration-200"
            >
              <span className="font-display text-[16px] sm:text-[22px] font-bold leading-[1.1]">Весь каталог</span>
              <span className="flex items-end justify-between gap-2">
                <span className="text-[13px] font-medium">{shelf.length} товаров</span>
                <span className="w-11 h-11 rounded-full bg-text text-white flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </section>

      {bestsellers.length > 0 && (
        <section>
          <SectionHead title={t.home.bestsellersTitle} href="/catalog" />
          <ProductGrid>
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} categorySlug={p.category.slug} />
            ))}
          </ProductGrid>
        </section>
      )}

      {/* Единственный h1 страницы: позиционирование магазина и три вещи, которые мы проверяем за покупателя */}
      <section className="rounded-3xl bg-text text-white p-6 sm:p-12 flex flex-col gap-10">
        <h1 className="display-1 text-white max-w-3xl">
          Витамины в Ташкенте. Видно, <span className="text-sun">за что вы платите.</span>
        </h1>
        <ul className="m-0 p-0 list-none grid sm:grid-cols-3 gap-4">
          {FACTS.map((fact) => (
            <li key={fact.title} className="rounded-2xl bg-white/[0.07] p-5 flex flex-col gap-2">
              <span className="text-[18px] font-semibold leading-snug">{fact.title}</span>
              <span className="text-[15px] text-white/70 leading-relaxed">{fact.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {banners.length > 0 && <BannerHero banners={banners} />}

      {bundles.length > 0 && (
        <section>
          <SectionHead title={t.bundles.pageTitle} href="/bundles" />
          <ScrollCarousel
            count={bundles.length}
            trackClassName="sm:grid sm:grid-cols-3 sm:gap-5 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
            dotsClassName="sm:hidden"
          >
            {bundles.map((b) => {
              const normalPrice = b.items.reduce((sum, i) => sum + i.product.price, 0);
              const bundlePrice = Math.round(normalPrice * (1 - b.discountPct / 100));
              return (
                <Link key={b.id} href={`/bundles/${b.slug}`} className="group flex flex-col gap-3 shrink-0 w-[80%] sm:w-auto snap-start">
                  <div className="relative aspect-[4/3] bg-bg-panel rounded-3xl overflow-hidden">
                    <Image
                      src={b.imageUrl}
                      alt={b.name}
                      fill
                      sizes="(max-width: 640px) 80vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                    <span className="absolute top-3 left-3 text-[13px] font-bold bg-sun px-3 py-1 rounded-full">−{b.discountPct}%</span>
                  </div>
                  <div className="flex flex-col gap-1 px-1">
                    <span className="text-[16px] font-semibold leading-snug">{b.name}</span>
                    <span className="flex items-baseline gap-2 tabular">
                      <span className="font-display font-bold">{formatSum(bundlePrice)}</span>
                      <span className="text-[13px] text-text-dim line-through">{formatSum(normalPrice)}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </ScrollCarousel>
        </section>
      )}

      <section>
        <SectionHead title={t.home.newTitle} href="/catalog" />
        <ProductGrid>
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} categorySlug={p.category.slug} />
          ))}
        </ProductGrid>
      </section>
    </div>
  );
}

const FACTS = [
  {
    title: "Документы на каждый товар",
    text: "Номер сертификата СЭС и срок его действия есть прямо на странице товара.",
  },
  {
    title: "Цена за действующее вещество",
    text: "Считаем, сколько стоят 100 мг. Если другой наш товар выгоднее, вы это увидите.",
  },
  {
    title: "Доставка в день заказа",
    text: "По Ташкенту привезём сегодня, если заказать до 18:00.",
  },
];

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 sm:mb-7">
      <h2 className="display-2">{title}</h2>
      <Link href={href} className="text-[15px] link-action shrink-0 pb-1">
        {t.home.viewAll}
      </Link>
    </div>
  );
}

function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-8">{children}</div>;
}
