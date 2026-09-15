"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatSum } from "@/lib/format";
import { CATEGORY_ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, t } from "@/lib/i18n";
import { buildOrderStatusMessage } from "@/lib/orderStatusMessages";

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
  courierPhone: string | null;
  cancelReason: string | null;
  items: OrderItem[];
}

const STATUSES = ["NEW", "CONFIRMED", "PACKED", "WITH_COURIER", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RETURNED"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [courierPhone, setCourierPhone] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [notify, setNotify] = useState(true);

  async function refresh() {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data);
      setCourierPhone(data.courierPhone ?? "");
      setCancelReason(data.cancelReason ?? "");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startStatusChange(status: string) {
    setPendingStatus(status);
    setNotify(true);
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return;
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: pendingStatus,
        courierPhone: pendingStatus === "WITH_COURIER" ? courierPhone || null : undefined,
        cancelReason: pendingStatus === "CANCELLED" ? cancelReason || null : undefined,
        notify,
      }),
    });
    setPendingStatus(null);
    await refresh();
    setSaving(false);
  }

  if (!order) return <p className="text-text-dim text-sm">{t.common.loading}</p>;

  const preview = pendingStatus
    ? buildOrderStatusMessage(order.orderNumber, pendingStatus, {
        courierPhone: pendingStatus === "WITH_COURIER" ? courierPhone : order.courierPhone,
        cancelReason: pendingStatus === "CANCELLED" ? cancelReason : order.cancelReason,
      })
    : null;

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
            {PAYMENT_METHOD_LABELS[order.paymentMethod]} —{" "}
            <span className={order.paymentStatus === "DEMO_PAID" ? "text-red font-semibold" : ""}>
              {order.paymentStatus === "DEMO_PAID" && "⚠ "}
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </span>
          </div>
        </div>
        <div>
          <div className="text-text-dim">Дата</div>
          <div className="font-medium">{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
        </div>
        {order.courierPhone && (
          <div>
            <div className="text-text-dim">Телефон курьера</div>
            <div className="font-medium">{order.courierPhone}</div>
          </div>
        )}
        {order.cancelReason && (
          <div className="sm:col-span-2">
            <div className="text-text-dim">Причина отмены</div>
            <div className="font-medium">{order.cancelReason}</div>
          </div>
        )}
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
              onClick={() => startStatusChange(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-60 ${
                order.status === s ? "border-accent bg-accent text-white" : "border-border bg-bg-panel"
              }`}
            >
              {CATEGORY_ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {pendingStatus && (
        <div className="border border-border-strong rounded-2xl p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold">
            Перевести в «{CATEGORY_ORDER_STATUS_LABELS[pendingStatus]}»
          </div>

          {pendingStatus === "WITH_COURIER" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-dim">Телефон курьера (необязательно)</span>
              <input
                value={courierPhone}
                onChange={(e) => setCourierPhone(e.target.value)}
                placeholder="+998 90 000-00-00"
                className="px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
              />
            </label>
          )}
          {pendingStatus === "CANCELLED" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-dim">Причина отмены (необязательно)</span>
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Нет на складе"
                className="px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
              />
            </label>
          )}

          {preview && (
            <div className="bg-bg-panel rounded-xl p-3 text-sm">
              <div className="text-xs text-text-dim mb-1">Клиенту уйдёт (если не отключено и есть канал):</div>
              <div className="whitespace-pre-line">{preview.text}</div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!notify}
              onChange={(e) => setNotify(!e.target.checked)}
              className="w-4 h-4 accent-[color:var(--accent)]"
            />
            Без уведомления
          </label>

          <div className="flex gap-2">
            <button
              onClick={confirmStatusChange}
              disabled={saving}
              className="px-4 py-2 rounded-lg btn btn-primary text-sm font-semibold disabled:opacity-60"
            >
              Подтвердить
            </button>
            <button
              onClick={() => setPendingStatus(null)}
              disabled={saving}
              className="px-4 py-2 rounded-lg btn btn-secondary text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
