import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import AddBundleButton from "@/components/AddBundleButton";

export const dynamic = "force-dynamic";

export default async function BundlesPage() {
  const bundles = await prisma.bundle.findMany({
    where: { isActive: true },
    include: { items: { include: { product: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 flex flex-col gap-10 sm:gap-14">
      <header className="flex flex-col gap-3">
        <h1 className="display-1">{t.bundles.pageTitle}</h1>
        <p className="text-text-dim text-[17px] max-w-xl">{t.bundles.pageSubtitle}</p>
      </header>

      <div className="grid md:grid-cols-2 gap-x-8 gap-y-14">
        {bundles.map((b) => {
          const normalPrice = b.items.reduce((sum, i) => sum + i.product.price, 0);
          const bundlePrice = Math.round(normalPrice * (1 - b.discountPct / 100));
          return (
            <div
              key={b.id}
              className="group flex flex-col gap-5"
            >
              <Link href={`/bundles/${b.slug}`} className="relative aspect-[4/3] bg-bg-panel block rounded-3xl overflow-hidden">
                <Image
                  src={b.imageUrl}
                  alt={b.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 text-[13px] font-bold bg-sun px-3 py-1 rounded-full">
                  −{b.discountPct}% за комплект
                </span>
              </Link>
              <div className="flex flex-col gap-2 flex-1">
                <Link href={`/bundles/${b.slug}`} className="text-[24px] font-medium tracking-[-0.03em] leading-tight hover:underline underline-offset-4 decoration-border">
                  {b.name}
                </Link>
                <p className="text-[15px] text-text-dim line-clamp-2">{b.description}</p>
                {/* Набор продаёт перечень, а не слово «набор»:
                    «Витамин C + эхинацея + бузина» понятнее, чем «3 товара» */}
                <ul className="flex flex-col m-0 p-0 list-none border-t border-text mt-2">
                  {b.items.map((i) => (
                    <li key={i.id} className="flex items-baseline justify-between gap-3 text-[14px] py-2.5 border-b border-border">
                      <span className="text-text truncate">{i.product.name}</span>
                      <span className="text-text-dim shrink-0 text-[13px] tabular">
                        {formatSum(i.product.price)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-baseline gap-2 pt-3 tabular">
                  <span className="font-display text-[20px] font-bold">{formatSum(bundlePrice)}</span>
                  <span className="text-sm text-text-dim line-through">{formatSum(normalPrice)}</span>
                  <span className="label-mono text-amber ml-auto shrink-0">
                    −{formatSum(normalPrice - bundlePrice)}
                  </span>
                </div>

                {/* Купить можно прямо отсюда — раньше ради заказа
                    приходилось проваливаться в карточку набора */}
                <div className="mt-auto pt-3">
                  <AddBundleButton
                    slug={b.slug}
                    name={b.name}
                    discountPct={b.discountPct}
                    products={b.items.map((i) => ({
                      slug: i.product.slug,
                      stock: i.product.stock,
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
