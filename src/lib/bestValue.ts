import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "./prisma";
import { computePricePerUnit } from "./activeValue";

/**
 * Товар с минимальной ценой за единицу вещества в своей категории.
 *
 * Сравнивать имеет смысл только внутри категории (мг магния и МЕ витамина D
 * не сопоставимы), и только когда есть с чем сравнивать — «лучшая цена»
 * при одном товаре с данными ничего не говорит покупателю.
 *
 * Кешируется на 10 минут и сбрасывается сразу при сохранении товара
 * в админке — так карточки не бьют по базе на каждый показ каталога,
 * но и не показывают вчерашнего лидера после смены цены.
 */
async function computeBestValueSlugs(): Promise<Set<string>> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      categoryId: true,
      price: true,
      activeSubstance: true,
      activeAmount: true,
      activeUnit: true,
      servingsPerPackage: true,
    },
  });

  const byCategory = new Map<string, { slug: string; pricePerBasis: number }[]>();
  for (const p of products) {
    const v = computePricePerUnit(p);
    if (!v) continue;
    const list = byCategory.get(p.categoryId) ?? [];
    list.push({ slug: p.slug, pricePerBasis: v.pricePerBasis });
    byCategory.set(p.categoryId, list);
  }

  const best = new Set<string>();
  for (const list of byCategory.values()) {
    if (list.length < 2) continue; // не с чем сравнивать
    const winner = list.reduce((a, b) => (b.pricePerBasis < a.pricePerBasis ? b : a));
    best.add(winner.slug);
  }
  return best;
}

export const BEST_VALUE_TAG = "best-value";

const cached = unstable_cache(
  async () => [...(await computeBestValueSlugs())],
  ["best-value-slugs"],
  { tags: [BEST_VALUE_TAG], revalidate: 600 }
);

export async function getBestValueSlugs(): Promise<Set<string>> {
  return new Set(await cached());
}

export function invalidateBestValue(): void {
  revalidateTag(BEST_VALUE_TAG);
}
