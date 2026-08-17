"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCart, clearCart } from "@/lib/cart";
import { formatSum } from "@/lib/format";
import { maskPhoneInput } from "@/lib/format";
import { t } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import CompatibilityPanel from "@/components/CompatibilityPanel";
import { findInteractions } from "@/lib/compatibility";
import { getActiveBundle, isBundleValid, clearActiveBundle, type ActiveBundle } from "@/lib/bundleCart";

interface CheckedLine {
  productId: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    stock: number;
    category: { slug: string; name: string };
  } | null;
}

type PaymentMethod = "CASH" | "PAYME" | "CLICK";

export default function CheckoutPage() {
  const router = useRouter();
  const [lines, setLines] = useState<CheckedLine[] | null>(null);
  const [activeBundle, setActiveBundleState] = useState<ActiveBundle | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = getCart();
    setActiveBundleState(getActiveBundle());
    if (raw.length === 0) {
      setLines([]);
      return;
    }
    fetch("/api/cart/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: raw }),
    })
      .then((r) => r.json())
      .then((data) => setLines(data.lines));
  }, []);

  const subtotal =
    lines?.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0) ?? 0;
  const categorySlugs = (lines ?? [])
    .map((l) => l.product?.category.slug)
    .filter((s): s is string => Boolean(s));
  const interactions = findInteractions(categorySlugs);

  const bundleValid =
    activeBundle && lines
      ? isBundleValid(
          activeBundle,
          lines.filter((l) => l.product).map((l) => ({ productId: l.productId, quantity: l.quantity }))
        )
      : false;
  const bundleDiscount =
    activeBundle && bundleValid && lines
      ? Math.round(
          activeBundle.productIds.reduce((sum, id) => {
            const line = lines.find((l) => l.productId === id);
            return sum + (line?.product ? line.product.price : 0);
          }, 0) *
            (activeBundle.discountPct / 100)
        )
      : 0;
  const total = subtotal - bundleDiscount;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Укажите имя";
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 12) errs.phone = "Неверный формат телефона";
    if (address.trim().length < 5) errs.address = "Укажите адрес доставки";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    setError(null);
    if (!validate() || !lines) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          comment,
          paymentMethod,
          items: lines
            .filter((l) => l.product)
            .map((l) => ({ productId: l.productId, quantity: l.quantity })),
          appliedBundleSlug: bundleValid ? activeBundle?.slug : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.common.error);
        setSubmitting(false);
        return;
      }
      clearCart();
      clearActiveBundle();
      if (data.paymentUrl) {
        router.push(data.paymentUrl);
      } else {
        router.push(`/checkout/success?orderId=${data.orderId}`);
      }
    } catch {
      setError(t.common.error);
      setSubmitting(false);
    }
  }

  if (lines === null) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-text-dim">{t.common.loading}</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t.checkout.title}</h1>

      <div className="bg-bg-panel rounded-2xl p-5 flex flex-col gap-2">
        <div className="text-sm font-semibold mb-1">{t.checkout.orderSummary}</div>
        {lines.map(
          (l) =>
            l.product && (
              <div key={l.productId} className="flex justify-between text-sm text-text-dim">
                <span>
                  {l.product.name} × {l.quantity}
                </span>
                <span className="text-text">{formatSum(l.product.price * l.quantity)}</span>
              </div>
            )
        )}
        {bundleDiscount > 0 && (
          <div className="flex justify-between text-sm text-green border-t border-border pt-3 mt-1">
            <span>{t.bundles.save(activeBundle!.discountPct)}</span>
            <span>−{formatSum(bundleDiscount)}</span>
          </div>
        )}
        <div className={`flex justify-between font-semibold ${bundleDiscount > 0 ? "" : "border-t border-border pt-3 mt-1"}`}>
          <span>{t.cart.total}</span>
          <span>{formatSum(total)}</span>
        </div>
      </div>

      {activeBundle && !bundleValid && (
        <div className="bg-red-bg rounded-2xl p-4 text-sm text-red">{t.bundles.activeBundleInvalid}</div>
      )}

      <CompatibilityPanel matches={interactions} />

      <div className="flex flex-col gap-4">
        <Field label={t.checkout.name} error={fieldErrors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.checkout.namePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>

        <Field label={t.checkout.phone} error={fieldErrors.phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
            placeholder="+998 (XX) XXX-XX-XX"
            inputMode="numeric"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>

        <Field label={t.checkout.address} error={fieldErrors.address}>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t.checkout.addressPlaceholder}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>

        <Field label={t.checkout.comment}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.checkout.commentPlaceholder}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>

        <Field label={t.checkout.paymentMethod}>
          <div className="flex flex-col gap-2">
            {(
              [
                ["CASH", t.checkout.paymentCash],
                ["PAYME", t.checkout.paymentPayme],
                ["CLICK", t.checkout.paymentClick],
              ] as [PaymentMethod, string][]
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === value ? "border-accent bg-accent/5" : "border-border bg-bg-panel"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                  className="accent-[color:var(--accent)]"
                />
                {label}
              </label>
            ))}
          </div>
        </Field>
      </div>

      {error && (
        <div className="bg-red-bg border border-red/30 text-red rounded-xl px-4 py-2.5 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="px-4 py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-60 hover:bg-accent-dark transition-colors"
      >
        {submitting ? t.checkout.submitting : t.checkout.submit}
      </button>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-1.5">{label}</div>
      {children}
      {error && <div className="text-xs text-red mt-1">{error}</div>}
    </div>
  );
}
