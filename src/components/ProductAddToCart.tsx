"use client";

import { useEffect, useState } from "react";
import { addToCart, getCart, CART_CHANGED_EVENT } from "@/lib/cart";
import { t } from "@/lib/i18n";
import { findInteractionsForCategory, type InteractionMatch } from "@/lib/compatibility";

export default function ProductAddToCart({
  productId,
  stock,
  categorySlug,
}: {
  productId: string;
  stock: number;
  categorySlug: string;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [matches, setMatches] = useState<InteractionMatch[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const cart = getCart().filter((l) => l.productId !== productId);
      if (cart.length === 0) {
        setMatches([]);
        return;
      }
      const res = await fetch("/api/cart/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const data = await res.json();
      if (cancelled) return;
      const categories = (data.lines as { product: { category: { slug: string } } | null }[])
        .map((l) => l.product?.category.slug)
        .filter((s): s is string => Boolean(s));
      setMatches(findInteractionsForCategory(categorySlug, categories));
    }

    check();
    window.addEventListener(CART_CHANGED_EVENT, check);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_CHANGED_EVENT, check);
    };
  }, [productId, categorySlug]);

  if (stock <= 0) {
    return (
      <div className="px-4 py-3 rounded-full bg-bg-panel text-text-dim font-medium text-center">
        {t.product.outOfStock}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm text-text-dim mb-1.5">{t.product.quantity}</div>
        <div className="flex items-center gap-3 w-max border border-border rounded-full overflow-hidden">
          <button
            className="w-10 h-10 flex items-center justify-center hover:bg-bg-panel transition-colors"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center font-medium">{qty}</span>
          <button
            className="w-10 h-10 flex items-center justify-center hover:bg-bg-panel transition-colors"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
          >
            +
          </button>
        </div>
        <div className="text-xs text-text-dim mt-1.5">{t.product.stockLeft(stock)}</div>
      </div>

      <button
        onClick={() => {
          addToCart(productId, qty, stock);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className={`px-5 py-3.5 rounded-full bg-accent text-white font-semibold hover:bg-accent-dark transition-colors ${added ? "animate-pop" : ""}`}
      >
        {added ? "Добавлено в корзину ✓" : t.product.addToCart}
      </button>

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
