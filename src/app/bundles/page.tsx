import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BundlesPage() {
  const bundles = await prisma.bundle.findMany({
    where: { isActive: true },
    include: { items: { include: { product: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
      <div>
        <h1 className="display-1">{t.bundles.pageTitle}</h1>
        <p className="text-text-dim mt-1 max-w-xl">{t.bundles.pageSubtitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {bundles.map((b) => {
          const normalPrice = b.items.reduce((sum, i) => sum + i.product.price, 0);
          const bundlePrice = Math.round(normalPrice * (1 - b.discountPct / 100));
          return (
            <Link
              key={b.id}
              href={`/bundles/${b.slug}`}
              className="group flex flex-col bg-white border border-border rounded-3xl overflow-hidden hover:border-border-strong transition-colors duration-150"
            >
              <div className="relative aspect-[16/9] bg-bg-panel">
                <Image
                  src={b.imageUrl}
                  alt={b.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <span className="absolute top-3 left-3 bg-red text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  {t.bundles.save(b.discountPct)}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-2">
                <div className="font-semibold text-lg">{b.name}</div>
                <p className="text-sm text-text-dim line-clamp-2">{b.description}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-semibold tracking-tight">{formatSum(bundlePrice)}</span>
                  <span className="text-sm text-text-dim line-through">{formatSum(normalPrice)}</span>
                </div>
                <div className="text-xs text-text-dim">
                  {b.items.length} {b.items.length === 1 ? "товар" : "товара"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
