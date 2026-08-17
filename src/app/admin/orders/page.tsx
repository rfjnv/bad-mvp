"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSum } from "@/lib/format";
import { CATEGORY_ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, t } from "@/lib/i18n";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: { id: string }[];
}

const STATUSES = ["", "NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function refresh(s = status) {
    setLoading(true);
    const res = await fetch(`/api/admin/orders${s ? `?status=${s}` : ""}`);
    setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">{t.admin.orders}</h1>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          refresh(e.target.value);
        }}
        className="px-3 py-2 rounded-lg bg-bg-panel-2 border border-border text-sm max-w-xs"
      >
        <option value="">Все статусы</option>
        {STATUSES.slice(1).map((s) => (
          <option key={s} value={s}>
            {CATEGORY_ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {loading ? (
        <p className="text-text-dim text-sm">{t.common.loading}</p>
      ) : orders.length === 0 ? (
        <p className="text-text-dim text-sm">Заказов не найдено.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-text-dim border-b border-border">
                <th className="py-2 pr-3">Номер</th>
                <th className="py-2 pr-3">Клиент</th>
                <th className="py-2 pr-3">Сумма</th>
                <th className="py-2 pr-3">Оплата</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2 pr-3">Дата</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold hover:text-accent">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    {o.customerName}
                    <div className="text-xs text-text-dim">{o.customerPhone}</div>
                  </td>
                  <td className="py-2 pr-3">{formatSum(o.totalAmount)}</td>
                  <td className="py-2 pr-3 text-text-dim">{PAYMENT_STATUS_LABELS[o.paymentStatus]}</td>
                  <td className="py-2 pr-3">{CATEGORY_ORDER_STATUS_LABELS[o.status]}</td>
                  <td className="py-2 pr-3 text-text-dim">
                    {new Date(o.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
