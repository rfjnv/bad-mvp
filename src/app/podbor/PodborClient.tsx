"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import BodyMap, { BodyMapCompact } from "@/components/BodyMap";
import { CONDITIONS, recommendFor } from "@/lib/lifestyle";
import { zonesForCategories } from "@/lib/bodyMap";
import { getCart, setCartQuantity } from "@/lib/cart";
import { formatSum } from "@/lib/format";
import { track } from "@/lib/track";

export interface CatalogItem extends ProductCardData {
  categorySlug: string;
}

/** Больше пяти позиций в одном наборе — уже не «набор под ваш день», а полка */
const SET_LIMIT = 5;

export default function PodborClient({
  products,
  categoryNames,
}: {
  products: CatalogItem[];
  categoryNames: Record<string, string>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  function toggle(slug: string) {
    const turningOn = !selected.includes(slug);
    // Считаем только включения: это и есть ответ, какие условия про людей
    if (turningOn) track("condition_select", slug);
    setAdded(false);
    setSelected((prev) => (turningOn ? [...prev, slug] : prev.filter((s) => s !== slug)));
  }

  // Категории, которых нет в каталоге, отбрасываем сразу — иначе силуэт
  // подсветил бы зону, под которую нечего предложить
  const recommendations = recommendFor(selected).filter(
    (rec) => categoryNames[rec.categorySlug] && products.some((p) => p.categorySlug === rec.categorySlug)
  );
  const activeZones = zonesForCategories(recommendations.map((r) => r.categorySlug));

  const set = useMemo(() => {
    return recommendFor(selected)
      .map((rec) => {
        // products уже отсортированы по цене — первый в наличии и есть разумный старт
        const product = products.find((p) => p.categorySlug === rec.categorySlug && p.stock > 0);
        if (!product || !categoryNames[rec.categorySlug]) return null;
        const because = CONDITIONS.filter(
          (c) => selected.includes(c.slug) && c.categorySlugs.includes(rec.categorySlug)
        ).map((c) => c.title);
        return { product, categoryName: categoryNames[rec.categorySlug], because };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, SET_LIMIT);
  }, [selected, products, categoryNames]);

  const setTotal = set.reduce((sum, item) => sum + item.product.price, 0);

  function addSetToCart() {
    const inCart = new Set(getCart().map((l) => l.slug));
    for (const { product } of set) {
      if (!inCart.has(product.slug)) setCartQuantity(product.slug, 1, product.stock);
    }
    track("bundle_add", "podbor-set", { slugs: set.map((s) => s.product.slug), conditions: selected });
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-14">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-6 lg:gap-12 items-start">
        {/* Телефон: силуэт с легендой залипает над списком — видно, что загорается от каждого тапа */}
        <div className="lg:hidden sticky top-16 z-10 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-border">
          <BodyMapCompact active={activeZones} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 border-t border-l border-border">
            {CONDITIONS.map((condition) => {
              const active = selected.includes(condition.slug);
              return (
                <button
                  key={condition.slug}
                  onClick={() => toggle(condition.slug)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 text-left border-b border-r border-border p-3 sm:p-4 min-h-[72px] transition-colors duration-150 ${
                    active ? "bg-accent text-white" : "bg-white hover:bg-bg-panel"
                  }`}
                >
                  <span
                    className={`shrink-0 w-5 h-5 rounded-[4px] border flex items-center justify-center text-[13px] ${
                      active ? "bg-white text-accent border-white" : "border-border-strong"
                    }`}
                  >
                    {active ? <span className="animate-check-in">✓</span> : ""}
                  </span>
                  <span className="font-medium leading-tight text-[14px] sm:text-base">{condition.title}</span>
                </button>
              );
            })}
          </div>

          <p className="text-text-dim border-l-2 border-border-strong pl-4 text-[15px]">
            Отметьте всё, что про вас. Дефицит чаще возникает не от болезни,
            а от того, как устроен обычный день, — поэтому его и не замечают.
          </p>
        </div>

        <div className="hidden lg:block sticky top-24">
          <BodyMap active={activeZones} />
        </div>
      </div>

      {set.length > 0 && (
        <section key={set.map((s) => s.product.slug).join()} className="animate-fade-in-up flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4 border-b border-border-strong pb-3">
            <h2 className="display-2">Ваш набор под ваш день</h2>
            <button
              onClick={() => {
                setSelected([]);
                setAdded(false);
              }}
              className="text-sm link-action shrink-0"
            >
              Сбросить
            </button>
          </div>

          <ul className="m-0 p-0 list-none flex flex-col">
            {set.map(({ product, categoryName, because }) => (
              <li key={product.slug} className="flex items-center gap-4 border-b border-border py-3">
                <Link
                  href={`/product/${product.slug}`}
                  className="relative w-16 h-16 shrink-0 bg-bg-panel rounded-xl overflow-hidden"
                >
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-contain p-1.5 mix-blend-multiply"
                  />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wide text-text-dim">{categoryName}</span>
                  <Link href={`/product/${product.slug}`} className="font-medium leading-snug line-clamp-2 hover:underline">
                    {product.name}
                  </Link>
                  <span className="text-[13px] text-green">{because.join(" · ")}</span>
                </div>
                <span className="font-semibold tracking-tight shrink-0">{formatSum(product.price)}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-text-dim">Итого</span>
              <span className="text-2xl font-bold tracking-tight">{formatSum(setTotal)}</span>
            </div>
            {added ? (
              <Link href="/cart" className="px-6 min-h-[52px] rounded-lg btn btn-primary animate-pop">
                В корзине — оформить
              </Link>
            ) : (
              <button onClick={addSetToCart} className="px-6 min-h-[52px] rounded-lg btn btn-primary">
                Добавить весь набор в корзину
              </button>
            )}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <div className="flex flex-col gap-12">
          <h2 className="display-2 border-b border-border pb-3">Почему именно это</h2>

          {recommendations.map((rec) => {
            const items = products.filter((p) => p.categorySlug === rec.categorySlug).slice(0, 4);
            const name = categoryNames[rec.categorySlug];

            return (
              <section key={rec.categorySlug} className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
                    <Link
                      href={`/catalog?category=${rec.categorySlug}`}
                      className="text-sm link-action shrink-0"
                    >
                      Все товары
                    </Link>
                  </div>
                  <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                    {rec.reasons.map((reason) => (
                      <li
                        key={reason}
                        className="text-[15px] text-text-dim leading-relaxed border-l-2 border-border-strong pl-4"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            );
          })}

          <p className="text-[13px] text-text-dim border-t border-border pt-5 max-w-2xl">
            Это подбор по образу жизни, а не медицинская рекомендация. Если принимаете
            лекарства или есть хронические заболевания — сначала посоветуйтесь с врачом.
          </p>
        </div>
      )}
    </div>
  );
}
