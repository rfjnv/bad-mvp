"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatSum } from "@/lib/format";
import { CATEGORY_ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, t } from "@/lib/i18n";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: { name: string; brand: string };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  comment: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

const STATUSES = ["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (res.ok) setOrder(await res.json());
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function changeStatus(status: string) {
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refresh();
    setSaving(false);
  }

  if (!order) return <p className="text-text-dim text-sm">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-accent w-max">
        ← {t.common.back}
      </Link>

      <h1 className="text-xl font-bold font-mono">{order.orderNumber}</h1>

      <div className="bg-bg-panel border border-border rounded-xl p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-text-dim">Клиент</div>
          <div className="font-medium">{order.customerName}</div>
        </div>
        <div>
          <div className="text-text-dim">Телефон</div>
          <div className="font-medium">{order.customerPhone}</div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-text-dim">Адрес</div>
          <div className="font-medium">{order.customerAddress}</div>
        </div>
        {order.comment && (
          <div className="sm:col-span-2">
            <div className="text-text-dim">Комментарий</div>
            <div className="font-medium">{order.comment}</div>
          </div>
        )}
        <div>
          <div className="text-text-dim">Оплата</div>
          <div className="font-medium">
            {PAYMENT_METHOD_LABELS[order.paymentMethod]} — {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </div>
        </div>
        <div>
          <div className="text-text-dim">Дата</div>
          <div className="font-medium">{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Состав заказа</div>
        <div className="bg-bg-panel border border-border rounded-xl divide-y divide-border">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="font-medium">{it.product.name}</div>
                <div className="text-xs text-text-dim">
                  {it.product.brand} × {it.quantity}
                </div>
              </div>
              <div className="font-semibold">{formatSum(it.priceAtPurchase * it.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between px-4 py-3 font-bold border-t border-border">
          <span>{t.cart.total}</span>
          <span>{formatSum(order.totalAmount)}</span>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Статус заказа</div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={saving}
              onClick={() => changeStatus(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-60 ${
                order.status === s ? "border-accent bg-accent text-white" : "border-border bg-bg-panel"
              }`}
            >
              {CATEGORY_ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
