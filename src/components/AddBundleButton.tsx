"use client";

import { useState } from "react";
import { setCartQuantity } from "@/lib/cart";
import { setActiveBundle } from "@/lib/bundleCart";
import { t } from "@/lib/i18n";

interface BundleProductInfo {
  slug: string;
  stock: number;
}

export default function AddBundleButton({
  slug,
  name,
  discountPct,
  products,
  className,
}: {
  slug: string;
  name: string;
  discountPct: number;
  products: BundleProductInfo[];
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    for (const p of products) {
      setCartQuantity(p.slug, 1, p.stock);
    }
    setActiveBundle({
      slug,
      name,
      discountPct,
      productSlugs: products.map((p) => p.slug),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <button
        onClick={handleAdd}
        className={`px-5 min-h-[48px] rounded-lg btn font-semibold ${added ? "btn-primary animate-pop" : "btn-primary"}`}
      >
        {added ? t.bundles.addedBundle : t.bundles.addBundle}
      </button>
      <p className="text-xs text-text-dim text-center">{t.bundles.addBundleNote}</p>
    </div>
  );
}
