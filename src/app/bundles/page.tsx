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
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t.bundles.pageTitle}</h1>
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
              className="group flex flex-col bg-white border border-border rounded-3xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[16/9] bg-bg-panel">
                <Image
                  src={b.imageUrl}
                  alt={b.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 bg-accent text-white text-xs font-semibold px-3 py-1.5 rounded-full">
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
