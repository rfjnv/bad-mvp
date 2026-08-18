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
}: {
  slug: string;
  name: string;
  discountPct: number;
  products: BundleProductInfo[];
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
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleAdd}
        className="px-5 py-3.5 rounded-lg btn btn-primary font-semibold"
      >
        {added ? t.bundles.addedBundle : t.bundles.addBundle}
      </button>
      <p className="text-xs text-text-dim text-center">{t.bundles.addBundleNote}</p>
    </div>
  );
}
