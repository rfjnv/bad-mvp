"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { t } from "@/lib/i18n";

export default function AddToCartButton({
  productId,
  stock,
  quantity = 1,
  className,
}: {
  productId: string;
  stock: number;
  quantity?: number;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(productId, quantity, stock);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className={`px-3 min-h-[44px] rounded-lg btn ${added ? "btn-primary animate-pop" : "btn-secondary"} text-sm font-semibold ${className ?? ""}`}
    >
      {added ? "Добавлено ✓" : t.catalog.addToCart}
    </button>
  );
}
