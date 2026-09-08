"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { CONDITIONS, recommendFor } from "@/lib/lifestyle";

export interface CatalogItem extends ProductCardData {
  categorySlug: string;
}

export default function PodborClient({
  products,
  categoryNames,
}: {
  products: CatalogItem[];
  categoryNames: Record<string, string>;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  const recommendations = recommendFor(selected);

  return (
    <div className="flex flex-col gap-10">
      <div className="grid sm:grid-cols-2 border-t border-l border-border">
        {CONDITIONS.map((condition) => {
          const active = selected.includes(condition.slug);
          return (
            <button
              key={condition.slug}
              onClick={() => toggle(condition.slug)}
              aria-pressed={active}
              className={`flex items-center gap-3 text-left border-b border-r border-border p-4 min-h-[64px] transition-colors duration-150 ${
                active ? "bg-accent text-white" : "hover:bg-bg-panel"
              }`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-[4px] border flex items-center justify-center text-[13px] ${
                  active ? "bg-white text-accent border-white" : "border-border-strong"
                }`}
              >
                {active ? "✓" : ""}
              </span>
              <span className="font-medium leading-tight">{condition.title}</span>
            </button>
          );
        })}
      </div>

      {selected.length === 0 ? (
        <p className="text-text-dim border-l-2 border-border-strong pl-4 max-w-2xl">
          Отметьте всё, что про вас. Дефицит чаще возникает не от болезни,
          а от того, как устроен обычный день — и именно поэтому он незаметен.
        </p>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <h2 className="display-2">Что стоит добавить</h2>
            <button onClick={() => setSelected([])} className="text-sm link-action shrink-0">
              Сбросить
            </button>
          </div>

          {recommendations.map((rec) => {
            const items = products.filter((p) => p.categorySlug === rec.categorySlug).slice(0, 4);
            const name = categoryNames[rec.categorySlug];

            // Категория из подбора, которой пока нет в каталоге, — не показываем
            if (!name || items.length === 0) return null;

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
