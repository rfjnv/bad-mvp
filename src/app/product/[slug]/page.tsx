import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import { computePricePerUnit, formatPricePerUnitShort } from "@/lib/activeValue";
import { computeDuration, formatDuration, pluralRu } from "@/lib/duration";
import { getBestValueSlugs } from "@/lib/bestValue";
import { formatNumber } from "@/lib/format";
import ProductAddToCart from "@/components/ProductAddToCart";
import { categoryColor } from "@/lib/categoryColors";
import ProductCard from "@/components/ProductCard";
import AddToTrackerButton from "@/components/AddToTrackerButton";
import DocumentsSection from "@/components/DocumentsSection";
import TrackProductView from "@/components/TrackProductView";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: t.product.notFoundTitle };

  const description = `${product.brand} — ${product.name}. ${formatSum(product.price)}.`;
  return {
    // Суффикс с названием магазина добавляет шаблон в layout — здесь только имя товара
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: [{ url: product.imageUrl }],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.isActive) notFound();

  const similar = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    take: 4,
  });

  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;
  const perUnit = computePricePerUnit(product);
  const duration = computeDuration(product);
  const bestValueSlugs = await getBestValueSlugs();

  // Честное сравнение по цене за вещество — до 4 товаров категории, включая
  // текущий. Показываем, только если есть хоть один товар для сравнения:
  // одна цифра без соседних ничего не доказывает.
  const compareRows = [product, ...similar]
    .slice(0, 4)
    .map((p) => ({ product: p, value: computePricePerUnit(p), duration: computeDuration(p) }));
  const showComparison = compareRows.filter((r) => r.value).length >= 2;

  const docsOk = [product.sesCertNumber, product.conformityCertNumber].filter(Boolean).length;
  const labelRows: { label: string; value: React.ReactNode; note?: string | null }[] = [
    ...(product.activeSubstance && product.activeAmount && product.activeUnit
      ? [{ label: "Вещество", value: `${product.activeSubstance} · ${formatNumber(product.activeAmount)} ${product.activeUnit} на порцию` }]
      : []),
    ...(perUnit ? [{ label: "Цена за вещество", value: <span className="bg-sun px-1.5 rounded-md">{formatPricePerUnitShort(perUnit)}</span> }] : []),
    ...(duration
      ? [
          {
            label: "Хватит на",
            value: `${formatNumber(duration.days)} ${pluralRu(duration.days, ["день", "дня", "дней"])} · ≈ ${formatSum(duration.pricePerDay)}/день`,
            note: formatDuration(duration),
          },
        ]
      : []),
    ...(product.form ? [{ label: "Форма", value: product.form, note: product.formNote }] : []),
    { label: "Документы", value: docsOk > 0 ? `${docsOk} из 2 · номера ниже` : "по запросу в Telegram" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-12 flex flex-col gap-16 sm:gap-24">
      <TrackProductView slug={product.slug} />

      <div className="flex flex-col gap-6">
        <nav className="label-mono flex items-center gap-2 text-text-dim flex-wrap" aria-label="Навигация">
          <Link href="/" className="hover:text-text transition-colors">
            {t.nav.home}
          </Link>
          <span>/</span>
          <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-text transition-colors">
            {product.category.name}
          </Link>
        </nav>

        <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 md:gap-14">
          {/* Правая колонка вдвое длиннее фото — фото едет вместе со страницей */}
          <div className="md:sticky md:top-24 self-start w-full">
            <div className="relative aspect-square rounded-3xl overflow-hidden" style={{ backgroundColor: categoryColor(product.category.slug).tint }}>
              <Image
                src={product.imageUrl}
                alt={`${product.brand} — ${product.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-contain p-[12%] mix-blend-multiply brightness-[1.04]"
                priority
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 text-[14px] font-bold bg-red text-white px-3 py-1 rounded-full">−{discountPct}%</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <span className="label-mono text-text-dim">{product.brand}</span>
              <h1 className="text-[26px] sm:text-[34px] leading-[1.1]">{product.name}</h1>
              <div className="flex items-baseline gap-3 tabular mt-1">
                <span className="font-display text-[26px] sm:text-[30px] font-bold">{formatSum(product.price)}</span>
                {hasDiscount && <span className="text-text-dim line-through">{formatSum(product.oldPrice!)}</span>}
              </div>
              <span className={`label-mono flex items-center gap-2 ${product.stock > 0 ? "text-green" : "text-red"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? "bg-green" : "bg-red"}`} />
                {product.stock > 0 ? `${t.product.inStock} · доставка сегодня` : t.product.outOfStock}
              </span>
            </div>

            {/* Панель как «Supplement Facts» на банке: всё, что магазин посчитал за покупателя */}
            <section className="rounded-2xl border-[3px] border-text px-4 sm:px-5 pt-4 pb-2" aria-label="Что в банке">
              <h2 className="font-display text-[22px] font-extrabold leading-none">Что в банке</h2>
              <div className="h-2 bg-text rounded-full mt-3" aria-hidden="true" />
              <dl className="m-0">
                {labelRows.map((row, i) => (
                  <div key={row.label} className={`grid grid-cols-[8rem_minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] gap-3 py-3 ${i > 0 ? "border-t border-text/20" : ""}`}>
                    <dt className="text-[14px] text-text-dim">{row.label}</dt>
                    <dd className="m-0 flex flex-col gap-1">
                      <span className="text-[15px] font-semibold tabular">{row.value}</span>
                      {row.note && <span className="text-[13px] text-text-dim leading-relaxed">{row.note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <ProductAddToCart
              slug={product.slug}
              name={product.name}
              stock={product.stock}
              categorySlug={product.category.slug}
              price={product.price}
              composition={product.composition}
              activeSubstance={product.activeSubstance}
              activeAmount={product.activeAmount}
              activeUnit={product.activeUnit}
            />

            <AddToTrackerButton
              item={{
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                imageUrl: product.imageUrl,
                dosage: product.dosage,
              }}
            />

            <div className="flex flex-col gap-6 pt-2">
              {product.description && <p className="text-[17px] leading-relaxed max-w-prose">{product.description}</p>}
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[15px] font-sans font-semibold">{t.product.composition}</h2>
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{product.composition}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[15px] font-sans font-semibold">{t.product.dosage}</h2>
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{product.dosage}</p>
              </div>
            </div>

            {product.contraindications && (
              <div className="border-l-2 border-red pl-4 py-1 text-[14px] leading-relaxed">
                <span className="text-[14px] font-semibold text-red block mb-1">Кому не подходит</span>
                {product.contraindications}
              </div>
            )}

            <DocumentsSection
              items={[
                {
                  label: t.product.sesCert,
                  number: product.sesCertNumber,
                  fileUrl: product.sesCertFileUrl,
                  issuedAt: product.sesCertIssuedAt?.toISOString() ?? null,
                  expiresAt: product.sesCertExpiresAt?.toISOString() ?? null,
                },
                {
                  label: t.product.conformityCert,
                  number: product.conformityCertNumber,
                  fileUrl: product.conformityCertFileUrl,
                  issuedAt: product.conformityCertIssuedAt?.toISOString() ?? null,
                  expiresAt: product.conformityCertExpiresAt?.toISOString() ?? null,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {showComparison && (
        <section>
                    <h2 className="display-2 mt-2 mb-2">Цена за вещество рядом с соседями</h2>
          <p className="text-[15px] text-text-dim mb-6">
            Честно — если наш же другой товар выгоднее, это будет видно здесь.
          </p>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left label-mono text-text-dim border-b border-text">
                  <th className="py-2 pr-3 font-semibold">Товар</th>
                  <th className="py-2 px-3 font-semibold">Форма</th>
                  <th className="py-2 px-3 font-semibold text-right">Цена</th>
                  <th className="py-2 px-3 font-semibold text-right">Цена за вещество</th>
                  <th className="py-2 pl-3 font-semibold text-right">Хватит</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => {
                  const isCurrent = row.product.id === product.id;
                  return (
                    <tr
                      key={row.product.id}
                      className={`border-b border-border last:border-b-0 ${isCurrent ? "bg-bg-panel" : ""}`}
                    >
                      <td className="py-3 pr-3 min-w-[180px] max-w-[260px]">
                        {isCurrent ? (
                          <span className="font-semibold">{row.product.name}</span>
                        ) : (
                          <Link href={`/product/${row.product.slug}`} className="link-action">
                            {row.product.name}
                          </Link>
                        )}
                        {bestValueSlugs.has(row.product.slug) && (
                          <span className="block text-[11px] font-semibold text-green mt-0.5">
                            Лучшая цена в категории
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-text-dim whitespace-nowrap">{row.product.form ?? "—"}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap">
                        {formatSum(row.product.price)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap">
                        {row.value ? formatPricePerUnitShort(row.value) : "—"}
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums whitespace-nowrap text-text-dim">
                        {row.duration ? `${formatNumber(row.duration.days)} дн.` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section>
          <h2 className="display-2 mb-8">{t.product.similar}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} categorySlug={product.category.slug} />
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-text-dim border-t border-border pt-5">{t.common.disclaimer}</p>
    </div>
  );
}
