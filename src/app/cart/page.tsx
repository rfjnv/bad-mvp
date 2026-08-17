"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCart, setCartQuantity, removeFromCart, type CartLine } from "@/lib/cart";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import CompatibilityPanel from "@/components/CompatibilityPanel";
import { findInteractions } from "@/lib/compatibility";
import {
  getActiveBundle,
  isBundleValid,
  clearActiveBundle,
  BUNDLE_CHANGED_EVENT,
  type ActiveBundle,
} from "@/lib/bundleCart";

interface CheckedLine {
  productId: string;
  quantity: number;
  adjusted: boolean;
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    price: number;
    stock: number;
    imageUrl: string;
    category: { slug: string; name: string };
  } | null;
}

export default function CartPage() {
  const [lines, setLines] = useState<CheckedLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBundle, setActiveBundleState] = useState<ActiveBundle | null>(null);

  async function refresh() {
    const raw: CartLine[] = getCart();
    setActiveBundleState(getActiveBundle());
    if (raw.length === 0) {
      setLines([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/cart/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: raw }),
    });
    const data = await res.json();
    setLines(data.lines);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    window.addEventListener(BUNDLE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(BUNDLE_CHANGED_EVENT, refresh);
  }, []);

  const subtotal = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0);
  const categorySlugs = lines
    .map((l) => l.product?.category.slug)
    .filter((s): s is string => Boolean(s));
  const interactions = findInteractions(categorySlugs);

  const bundleValid = activeBundle
    ? isBundleValid(
        activeBundle,
        lines.filter((l) => l.product).map((l) => ({ productId: l.productId, quantity: l.quantity }))
      )
    : false;
  const bundleDiscount =
    activeBundle && bundleValid
      ? Math.round(
          activeBundle.productIds.reduce((sum, id) => {
            const line = lines.find((l) => l.productId === id);
            return sum + (line?.product ? line.product.price : 0);
          }, 0) *
            (activeBundle.discountPct / 100)
        )
      : 0;
  const total = subtotal - bundleDiscount;

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-text-dim">{t.common.loading}</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          title={t.cart.empty}
          hint={t.cart.emptyHint}
          action={
            <Link href="/catalog" className="px-5 py-2.5 rounded-full bg-accent text-white font-semibold inline-block">
              {t.cart.goToCatalog}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t.cart.title}</h1>

      <div className="flex flex-col gap-3">
        {lines.map((line) =>
          line.product ? (
            <div
              key={line.productId}
              className="flex gap-4 bg-white border border-border rounded-2xl p-3.5"
            >
              <Link href={`/product/${line.product.slug}`} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-bg-panel">
                <Image src={line.product.imageUrl} alt={line.product.name} fill className="object-cover" />
              </Link>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <Link href={`/product/${line.product.slug}`} className="font-medium text-sm line-clamp-2">
                  {line.product.name}
                </Link>
                <div className="text-xs text-text-dim">{line.product.brand}</div>
                {line.adjusted && (
                  <div className="text-xs text-red">{t.cart.maxStock(line.product.stock)}</div>
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 border border-border rounded-full overflow-hidden">
                    <button
                      className="w-8 h-8 flex items-center justify-center hover:bg-bg-panel transition-colors"
                      onClick={() => {
                        setCartQuantity(line.productId, line.quantity - 1, line.product!.stock);
                        refresh();
                      }}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <button
                      className="w-8 h-8 flex items-center justify-center hover:bg-bg-panel transition-colors"
                      onClick={() => {
                        setCartQuantity(line.productId, line.quantity + 1, line.product!.stock);
                        refresh();
                      }}
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold">{formatSum(line.product.price * line.quantity)}</span>
                </div>
              </div>
              <button
                aria-label={t.cart.remove}
                className="text-text-dim hover:text-red self-start transition-colors"
                onClick={() => {
                  removeFromCart(line.productId);
                  refresh();
                }}
              >
                ✕
              </button>
            </div>
          ) : null
        )}
      </div>

      <CompatibilityPanel matches={interactions} />

      {activeBundle && (
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${bundleValid ? "bg-green-bg" : "bg-red-bg"}`}>
          <div className="flex-1 text-sm">
            <div className={`font-semibold mb-0.5 ${bundleValid ? "text-green" : "text-red"}`}>
              {t.bundles.activeBundleTitle}
            </div>
            <div className="text-text">
              {bundleValid
                ? t.bundles.activeBundleValid(activeBundle.name, activeBundle.discountPct)
                : t.bundles.activeBundleInvalid}
            </div>
          </div>
          <button
            onClick={() => {
              clearActiveBundle();
              refresh();
            }}
            className="shrink-0 text-sm font-medium text-text-dim hover:text-text"
          >
            {t.bundles.cancelBundle}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5 border-t border-border pt-5">
        {bundleDiscount > 0 && (
          <div className="flex items-center justify-between text-sm text-green">
            <span>{t.bundles.save(activeBundle!.discountPct)}</span>
            <span>−{formatSum(bundleDiscount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-text-dim">{t.cart.total}</span>
          <span className="text-2xl font-semibold tracking-tight">{formatSum(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="px-4 py-3.5 rounded-full bg-accent text-white font-semibold text-center hover:bg-accent-dark transition-colors"
      >
        {t.cart.checkout}
      </Link>
    </div>
  );
}
