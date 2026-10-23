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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 flex flex-col gap-20 sm:gap-28">
      <SunHero />

      {/* Единственный h1 страницы: позиционирование магазина и три вещи, которые мы проверяем за покупателя */}
      <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-8 lg:gap-14 border-t border-text pt-8">
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.035em] leading-[1.05] max-w-sm">
          Витамины и БАД в Ташкенте — видно, за что вы платите
        </h1>
        <ol className="m-0 p-0 list-none grid sm:grid-cols-3 gap-6 sm:gap-8">
          {FACTS.map((fact, i) => (
            <li key={fact.title} className="flex flex-col gap-2">
              <span className="label-mono text-amber">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[17px] font-medium tracking-[-0.02em] leading-snug">{fact.title}</span>
              <span className="text-[14px] text-text-dim leading-relaxed">{fact.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <GoalPicker />

      {banners.length > 0 && <BannerHero banners={banners} />}

      {bundles.length > 0 && (
        <section>
          <SectionHead eyebrow="Со скидкой за комплект" title={t.bundles.pageTitle} href="/bundles" />
          <ScrollCarousel
            count={bundles.length}
            trackClassName="sm:grid sm:grid-cols-3 sm:gap-6 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
            dotsClassName="sm:hidden"
          >
            {bundles.map((b) => {
              const normalPrice = b.items.reduce((sum, i) => sum + i.product.price, 0);
              const bundlePrice = Math.round(normalPrice * (1 - b.discountPct / 100));
              return (
                <Link
                  key={b.id}
                  href={`/bundles/${b.slug}`}
                  className="group flex flex-col gap-3 shrink-0 w-[78%] sm:w-auto snap-start"
                >
                  <div className="relative aspect-[4/5] bg-bg-panel rounded-3xl overflow-hidden">
                    <Image
                      src={b.imageUrl}
                      alt={b.name}
                      fill
                      sizes="(max-width: 640px) 78vw, 33vw"
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    />
                    <span className="label-mono absolute top-3 left-3 bg-bg/90 backdrop-blur px-1.5 py-0.5 rounded-md">
                      −{b.discountPct}% за комплект
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-0.5">
                    <span className="label-mono text-text-dim">{b.items.length} позиции</span>
                    <span className="text-[17px] font-medium tracking-[-0.02em] leading-snug group-hover:underline underline-offset-4 decoration-border">
                      {b.name}
                    </span>
                    <span className="flex items-baseline gap-2 tabular">
                      <span className="text-[15px] font-medium">{formatSum(bundlePrice)}</span>
                      <span className="text-[13px] text-text-dim line-through">{formatSum(normalPrice)}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </ScrollCarousel>
        </section>
      )}

      {bestsellers.length > 0 && (
        <section>
          <SectionHead eyebrow="Чаще всего берут" title={t.home.bestsellersTitle} href="/catalog" />
          <ProductGrid>
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}

      <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 lg:gap-14">
        <div className="flex flex-col gap-3">
          <span className="label-mono text-text-dim">Каталог</span>
          <h2 className="display-2">{t.home.categoriesTitle}</h2>
        </div>
        <ul className="m-0 p-0 list-none flex flex-wrap gap-x-6 sm:gap-x-8 gap-y-1">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/catalog?category=${c.slug}`}
                className="inline-block text-[26px] sm:text-[36px] font-medium tracking-[-0.04em] leading-[1.25] hover:text-amber transition-colors duration-300"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHead eyebrow="Только что на полке" title={t.home.newTitle} href="/catalog" />
        <ProductGrid>
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </ProductGrid>
      </section>
    </div>
  );
}

const FACTS = [
  {
    title: "Документы у каждого товара",
    text: "Сертификат СЭС и соответствия с номером и сроком — на странице товара, а не «по запросу».",
  },
  {
    title: "Цена за действующее вещество",
    text: "Считаем, сколько стоят 100 мг, и показываем, если наш же другой товар выгоднее.",
  },
  {
    title: "Доставка в день заказа",
    text: "По Ташкенту — сегодня при заказе до 18:00. Ответим в Telegram, если сомневаетесь.",
  },
];

function SectionHead({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
      <div className="flex flex-col gap-2">
        <span className="label-mono text-text-dim">{eyebrow}</span>
        <h2 className="display-2">{title}</h2>
      </div>
      <Link href={href} className="text-[14px] link-action shrink-0 pb-1">
        {t.home.viewAll}
      </Link>
    </div>
  );
}

function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">{children}</div>;
}
