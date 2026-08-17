"use client";

import { useState } from "react";
import { setCartQuantity } from "@/lib/cart";
import { setActiveBundle } from "@/lib/bundleCart";
import { t } from "@/lib/i18n";

interface BundleProductInfo {
  id: string;
  stock: number;
}

export default function AddBundleButton({
  slug,
  name,
  discountPct,
  products,
}: {
  slug: string;
  name: string;
  discountPct: number;
  products: BundleProductInfo[];
}) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    for (const p of products) {
      setCartQuantity(p.id, 1, p.stock);
    }
    setActiveBundle({
      slug,
      name,
      discountPct,
      productIds: products.map((p) => p.id),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleAdd}
        className="px-5 py-3.5 rounded-full bg-accent text-white font-semibold hover:bg-accent-dark transition-colors"
      >
        {added ? t.bundles.addedBundle : t.bundles.addBundle}
      </button>
      <p className="text-xs text-text-dim text-center">{t.bundles.addBundleNote}</p>
    </div>
  );
}
