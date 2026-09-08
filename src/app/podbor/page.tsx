import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PodborClient, { type CatalogItem } from "./PodborClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Подбор по образу жизни",
  description:
    "Работа в помещении, зима без солнца, город без моря — что из этого означает нехватку и что с ней делать.",
};

export default async function PodborPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { slug: true } } },
      orderBy: { price: "asc" },
    }),
  ]);

  const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const items: CatalogItem[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    price: p.price,
    oldPrice: p.oldPrice,
    stock: p.stock,
    imageUrl: p.imageUrl,
    activeSubstance: p.activeSubstance,
    activeAmount: p.activeAmount,
    activeUnit: p.activeUnit,
    servingsPerPackage: p.servingsPerPackage,
    categorySlug: p.category.slug,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="display-1 max-w-2xl">Где и как вы живёте</h1>
        <p className="text-text-dim max-w-2xl text-[17px]">
          Нехватку витаминов обычно не чувствуешь — она приходит не от болезни,
          а от города и распорядка дня. Отметьте, что про вас, и мы объясним,
          что из этого следует.
        </p>
      </header>

      <PodborClient products={items} categoryNames={categoryNames} />
    </div>
  );
}
