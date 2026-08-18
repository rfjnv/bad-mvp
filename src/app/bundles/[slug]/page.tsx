import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import { findInteractions } from "@/lib/compatibility";
import AddBundleButton from "@/components/AddBundleButton";
import CompatibilityPanel from "@/components/CompatibilityPanel";

export const dynamic = "force-dynamic";

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await prisma.bundle.findUnique({
    where: { slug },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  if (!bundle || !bundle.isActive) notFound();

  const normalPrice = bundle.items.reduce((sum, i) => sum + i.product.price, 0);
  const bundlePrice = Math.round(normalPrice * (1 - bundle.discountPct / 100));
  const categorySlugs = bundle.items.map((i) => i.product.category.slug);
  const synergies = findInteractions(categorySlugs).filter((m) => m.type === "synergy");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
      <nav className="flex items-center gap-1.5 text-sm text-text-dim flex-wrap">
        <Link href="/" className="hover:text-text transition-colors">
          {t.nav.home}
        </Link>
        <span>/</span>
        <Link href="/bundles" className="hover:text-text transition-colors">
          {t.bundles.navTitle}
        </Link>
        <span>/</span>
        <span className="text-text truncate max-w-[240px]">{bundle.name}</span>
      </nav>

      <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
        <div className="relative aspect-square bg-bg-panel rounded-3xl overflow-hidden">
          <Image src={bundle.imageUrl} alt={bundle.name} fill className="object-cover" priority />
          <span className="absolute top-4 left-4 bg-red text-white text-sm font-semibold px-3 py-1.5 rounded-lg">
            {t.bundles.save(bundle.discountPct)}
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="display-1">{bundle.name}</h1>
            <p className="text-text-dim mt-2">{bundle.description}</p>
          </div>

          <div className="bg-bg-panel rounded-2xl p-4 flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-text-dim">{t.bundles.normalPrice}</span>
              <span className="text-text-dim line-through">{formatSum(normalPrice)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">{t.bundles.bundlePrice}</span>
              <span className="display-2 text-accent">
                {formatSum(bundlePrice)}
              </span>
            </div>
          </div>

          <AddBundleButton
            slug={bundle.slug}
            name={bundle.name}
            discountPct={bundle.discountPct}
            products={bundle.items.map((i) => ({ id: i.product.id, stock: i.product.stock }))}
          />

          {synergies.length > 0 && <CompatibilityPanel matches={synergies} />}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">{t.bundles.included}</h2>
        <div className="flex flex-col gap-3">
          {bundle.items.map(({ product }) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="flex items-center gap-4 bg-white border border-border rounded-2xl p-3.5 hover:border-accent/40 transition-colors"
            >
              <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-bg-panel">
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text-dim">{product.brand}</div>
                <div className="font-medium text-sm line-clamp-1">{product.name}</div>
              </div>
              <span className="font-semibold text-sm shrink-0">{formatSum(product.price)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
