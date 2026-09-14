"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clearCart, setCartQuantity } from "@/lib/cart";
import { clearActiveBundle } from "@/lib/bundleCart";
import { formatSum } from "@/lib/format";

interface RepeatItem {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
  quantity: number;
}

export const REPEAT_OF_KEY = "bad-mvp-repeat-of";

export default function RepeatClient({
  orderId,
  orderNumber,
  items,
}: {
  orderId: string;
  orderNumber: string;
  items: RepeatItem[];
}) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.slug, i.isActive && i.stock > 0 ? Math.min(i.quantity, i.stock) : 0]))
  );

  const available = items.filter((i) => i.isActive && i.stock > 0);
  const total = available.reduce((s, i) => s + i.price * (qty[i.slug] ?? 0), 0);
  const anySelected = available.some((i) => (qty[i.slug] ?? 0) > 0);

  function proceed() {
    // Корзина собирается заново из прошлого заказа; набор со скидкой
    // здесь не применяется — это повтор, а не покупка комплекта
    clearCart();
    clearActiveBundle();
    for (const i of available) {
      const q = qty[i.slug] ?? 0;
      if (q > 0) setCartQuantity(i.slug, q, i.stock);
    }
    // Чекаут прочитает и передаст на сервер — чтобы считать конверсию напоминаний
    try {
      localStorage.setItem(REPEAT_OF_KEY, orderId);
    } catch {
      /* без этого заказ всё равно оформится */
    }
    router.push("/checkout");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="display-1">Повторить заказ</h1>
        <p className="text-text-dim">
          Состав заказа <span className="font-mono">{orderNumber}</span> с текущими ценами. Количество можно
          поменять.
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {items.map((i) => {
          const gone = !i.isActive || i.stock <= 0;
          return (
            <li key={i.slug} className={`flex items-center gap-3 py-3 ${gone ? "opacity-50" : ""}`}>
              <span className="relative w-14 h-14 rounded-lg overflow-hidden bg-bg-panel shrink-0">
                <Image src={i.imageUrl} alt="" fill className="object-contain p-1 mix-blend-multiply" sizes="56px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-medium text-sm line-clamp-1">{i.name}</span>
                <span className="text-[13px] text-text-dim">
                  {gone ? "Сейчас нет в наличии" : formatSum(i.price)}
                </span>
              </span>
              {!gone && (
                <span className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
                  <button
                    aria-label="Меньше"
                    onClick={() => setQty((q) => ({ ...q, [i.slug]: Math.max(0, (q[i.slug] ?? 0) - 1) }))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-bg-panel"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">{qty[i.slug] ?? 0}</span>
                  <button
                    aria-label="Больше"
                    onClick={() => setQty((q) => ({ ...q, [i.slug]: Math.min(i.stock, (q[i.slug] ?? 0) + 1) }))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-bg-panel"
                  >
                    +
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-4">
        <span>
          <span className="text-text-dim text-sm">Товары</span>
          <span className="block text-xl font-semibold tracking-tight">{formatSum(total)}</span>
        </span>
        <button
          onClick={proceed}
          disabled={!anySelected}
          className="px-6 min-h-[48px] rounded-lg btn btn-primary font-semibold disabled:opacity-50"
        >
          Оформить
        </button>
      </div>
    </div>
  );
}
