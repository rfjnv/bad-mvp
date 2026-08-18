import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import { computePricePerUnit, formatPricePerUnit } from "@/lib/activeValue";
import ProductAddToCart from "@/components/ProductAddToCart";
import ProductCard from "@/components/ProductCard";
import AddToTrackerButton from "@/components/AddToTrackerButton";
import DocumentsSection from "@/components/DocumentsSection";

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-28 sm:pb-12 flex flex-col gap-8">
      <nav className="flex items-center gap-1.5 text-sm text-text-dim flex-wrap">
        <Link href="/" className="hover:text-text transition-colors">
          {t.nav.home}
        </Link>
        <span>/</span>
        <Link
          href={`/catalog?category=${product.category.slug}`}
          className="hover:text-text transition-colors"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-text truncate max-w-[240px]">{product.name}</span>
      </nav>

      <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
        <div className="relative aspect-square bg-bg-panel rounded-3xl overflow-hidden">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
          {hasDiscount && (
            <span className="absolute top-4 left-4 bg-red text-white text-sm font-semibold px-3 py-1.5 rounded-lg">
              −{discountPct}%
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="text-sm text-text-dim mb-1">{product.brand}</div>
            <h1 className="display-2">{product.name}</h1>
          </div>

          <div>
            <div className="flex items-baseline gap-3">
              <span className="display-2">{formatSum(product.price)}</span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-text-dim line-through">{formatSum(product.oldPrice)}</span>
              )}
            </div>
            {perUnit && (
              <div className="text-sm text-text-dim mt-1">{formatPricePerUnit(perUnit)}</div>
            )}
          </div>

          <div>
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green bg-green-bg px-3 py-1 rounded-lg">
                {t.product.inStock}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-red bg-red-bg px-3 py-1 rounded-lg">
                {t.product.outOfStock}
              </span>
            )}
          </div>

          <ProductAddToCart
            slug={product.slug}
            stock={product.stock}
            categorySlug={product.category.slug}
            price={product.price}
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

          <div className="border-t border-border pt-5 flex flex-col gap-4 text-sm">
            <div>
              <div className="font-semibold mb-1">{t.product.composition}</div>
              <div className="text-text-dim whitespace-pre-line">{product.composition}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">{t.product.dosage}</div>
              <div className="text-text-dim whitespace-pre-line">{product.dosage}</div>
            </div>
            <div className="text-text-dim">{product.description}</div>
          </div>

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

      {similar.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-4">{t.product.similar}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-text-dim border-t border-border pt-5">{t.common.disclaimer}</p>
    </div>
  );
}
