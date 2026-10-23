"use client";

import { useState } from "react";
import { addToCart, announceAdded } from "@/lib/cart";
import { track } from "@/lib/track";
import { t } from "@/lib/i18n";

export default function AddToCartButton({
  slug,
  stock,
  quantity = 1,
  className,
  variant = "full",
  name,
}: {
  slug: string;
  stock: number;
  quantity?: number;
  className?: string;
  /** icon — квадрат «+» поверх фото в карточке; full — обычная кнопка с текстом */
  variant?: "full" | "icon";
  /** Название для уведомления «В корзине» */
  name?: string;
}) {
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(slug, quantity, stock);
    track("add_to_cart", slug, { quantity, from: "card" });
    if (name) announceAdded(name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  if (variant === "icon") {
    if (stock <= 0) return null;
    return (
      <button
        onClick={handleClick}
        aria-label={added ? "Добавлено в корзину" : t.catalog.addToCart}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
          added ? "bg-amber text-white animate-pop" : "bg-bg text-text hover:bg-text hover:text-bg"
        } ${className ?? ""}`}
      >
        {added ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </button>
    );
  }

  if (stock <= 0) {
    return (
      <button
        disabled
        className={`px-3 min-h-[44px] rounded-lg bg-bg-panel text-text-dim text-sm font-medium cursor-not-allowed ${className ?? ""}`}
      >
        {t.catalog.outOfStock}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`px-3 min-h-[44px] rounded-lg btn ${added ? "btn-primary animate-pop" : "btn-secondary"} text-sm ${className ?? ""}`}
    >
      {added ? "Добавлено ✓" : t.catalog.addToCart}
    </button>
  );
}
