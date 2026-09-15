"use client";

import { useEffect, useState } from "react";
import { addToCart, getCart, CART_CHANGED_EVENT } from "@/lib/cart";
import { track } from "@/lib/track";
import { t } from "@/lib/i18n";
import { formatSum } from "@/lib/format";
import StickyBar from "@/components/StickyBar";
import { findInteractionsForCategory, type CompatibilityItem, type InteractionMatch } from "@/lib/compatibility";

export default function ProductAddToCart({
  slug,
  stock,
  categorySlug,
  price,
  composition,
  activeSubstance,
  activeAmount,
  activeUnit,
}: {
  slug: string;
  stock: number;
  categorySlug: string;
  price: number;
  composition: string;
  activeSubstance: string | null;
  activeAmount: number | null;
  activeUnit: string | null;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [matches, setMatches] = useState<InteractionMatch[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const cart = getCart().filter((l) => l.slug !== slug);
      const selfOnly = [{ categorySlug, composition, activeSubstance, activeAmount, activeUnit }];
      if (cart.length === 0) {
        // Пустая корзина не значит «нечего проверять» — правило про высокую
        // дозу цинка касается самого товара, а не сочетания с другим
        setMatches(findInteractionsForCategory(categorySlug, selfOnly));
        return;
      }
      const res = await fetch("/api/cart/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const data = await res.json();
      if (cancelled) return;
      type Line = {
        product: {
          category: { slug: string };
          composition: string;
          activeSubstance: string | null;
          activeAmount: number | null;
          activeUnit: string | null;
        } | null;
      };
      const cartItems: CompatibilityItem[] = (data.lines as Line[]).flatMap((l) =>
        l.product
          ? [
              {
                categorySlug: l.product.category.slug,
                composition: l.product.composition,
                activeSubstance: l.product.activeSubstance,
                activeAmount: l.product.activeAmount,
                activeUnit: l.product.activeUnit,
              },
            ]
          : []
      );
      // Товар на странице ещё не в корзине — добавляем его в проверку
      // отдельно, иначе правило «цинк 40 мг и выше» не увидит его самого
      setMatches(findInteractionsForCategory(categorySlug, [...selfOnly, ...cartItems]));
    }

    check();
    window.addEventListener(CART_CHANGED_EVENT, check);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_CHANGED_EVENT, check);
    };
  }, [slug, categorySlug, composition, activeSubstance, activeAmount, activeUnit]);

  function add() {
    addToCart(slug, qty, stock);
    track("add_to_cart", slug, { quantity: qty, from: "product" });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (stock <= 0) {
    return (
      <div className="px-4 py-3 rounded-lg bg-bg-panel text-text-dim font-medium text-center">
        {t.product.outOfStock}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm text-text-dim mb-1.5">{t.product.quantity}</div>
        <div className="flex items-center w-max border border-border rounded-lg overflow-hidden">
          <button
            aria-label="Уменьшить количество"
            className="w-12 h-12 flex items-center justify-center hover:bg-bg-panel transition-colors duration-150"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-12 text-center font-medium">{qty}</span>
          <button
            aria-label="Увеличить количество"
            className="w-12 h-12 flex items-center justify-center hover:bg-bg-panel transition-colors duration-150"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
          >
            +
          </button>
        </div>
        <div className="text-xs text-text-dim mt-1.5">{t.product.stockLeft(stock)}</div>
      </div>

      <button
        onClick={add}
        className={`px-5 min-h-[52px] rounded-lg btn btn-primary font-semibold ${added ? "animate-pop" : ""}`}
      >
        {added ? "Добавлено в корзину ✓" : t.product.addToCart}
      </button>

      <StickyBar
        label={qty > 1 ? `${qty} шт. · итого` : "Цена"}
        value={formatSum(price * qty)}
        action={
          <button
            onClick={add}
            className={`min-h-[48px] px-6 rounded-lg btn btn-primary font-semibold shrink-0 ${
              added ? "animate-pop" : ""
            }`}
          >
            {added ? "Добавлено ✓" : t.catalog.addToCart}
          </button>
        }
      />

      {matches.map((m) => (
        <div
          key={m.key}
          className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm ${
            m.type === "caution" ? "bg-red-bg text-red" : "bg-green-bg text-green"
          }`}
        >
          <span className="shrink-0 mt-0.5">{m.type === "caution" ? "⚠" : "✓"}</span>
          <span className="text-text">
            <span className="text-text-dim">{t.cart.compatibilityWarnOnProduct}</span>
            {m.message}
          </span>
        </div>
      ))}
    </div>
  );
}
