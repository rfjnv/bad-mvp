"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCart, setCartQuantity, removeFromCart, type CartLine } from "@/lib/cart";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import StickyBar from "@/components/StickyBar";
import CompatibilityPanel from "@/components/CompatibilityPanel";
import { deliveryFee, amountUntilFreeDelivery, DELIVERY_TERMS } from "@/lib/delivery";
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
  const afterDiscount = subtotal - bundleDiscount;
  const fee = deliveryFee(afterDiscount);
  const untilFree = amountUntilFreeDelivery(afterDiscount);
  const total = afterDiscount + fee;

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
            <Link href="/catalog" className="px-5 py-2.5 rounded-lg btn btn-primary font-semibold inline-block">
              {t.cart.goToCatalog}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-28 sm:pb-8 flex flex-col gap-5">
      <h1 className="display-1">{t.cart.title}</h1>

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
                  <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-11 h-11 flex items-center justify-center hover:bg-bg-panel transition-colors duration-150"
                      onClick={() => {
                        setCartQuantity(line.productId, line.quantity - 1, line.product!.stock);
                        refresh();
                      }}
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm">{line.quantity}</span>
                    <button
                      className="w-11 h-11 flex items-center justify-center hover:bg-bg-panel transition-colors duration-150"
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
                className="w-11 h-11 -mt-1 -mr-1 flex items-start justify-end text-text-dim hover:text-red transition-colors duration-150"
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-dim">Товары</span>
          <span>{formatSum(subtotal)}</span>
        </div>
        {bundleDiscount > 0 && (
          <div className="flex items-center justify-between text-sm text-green">
            <span>{t.bundles.save(activeBundle!.discountPct)}</span>
            <span>−{formatSum(bundleDiscount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-dim">Доставка по Ташкенту</span>
          <span className={fee === 0 ? "text-green font-medium" : ""}>
            {fee === 0 ? "Бесплатно" : formatSum(fee)}
          </span>
        </div>
        {untilFree > 0 && (
          <div className="text-[13px] text-text-dim border-l-2 border-border-strong pl-2.5 mt-1">
            До бесплатной доставки осталось {formatSum(untilFree)}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border mt-2.5 pt-3">
          <span className="text-text-dim">{t.cart.total}</span>
          <span className="display-2">{formatSum(total)}</span>
        </div>
        <div className="text-[13px] text-text-dim mt-1">{DELIVERY_TERMS}</div>
      </div>

      {/* Отступ под липкую панель, чтобы она не перекрывала итоги */}
      <div className="h-20 sm:hidden" />

      <Link
        href="/checkout"
        className="hidden sm:flex px-4 py-3.5 rounded-lg btn btn-primary font-semibold text-center"
      >
        {t.cart.checkout}
      </Link>

      <StickyBar
        label={t.cart.total}
        value={formatSum(total)}
        action={
          <Link
            href="/checkout"
            className="min-h-[48px] px-6 rounded-lg btn btn-primary font-semibold shrink-0"
          >
            {t.cart.checkout}
          </Link>
        }
      />
    </div>
  );
}
