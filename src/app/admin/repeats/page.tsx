"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Row {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  phone: string;
  channel: "telegram" | "off" | "none";
  product: string;
  quantity: number;
  expectedFinishAt: string;
  overdue: boolean;
  reminder: { status: string; dueAt: string; sentAt: string | null } | null;
}

interface Data {
  days: number;
  rows: Row[];
  summary: { pending: number; sent: number; repeated: number; noChannel: number; conversion: number | null };
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "запланировано", cls: "text-text-dim" },
  SENT: { label: "отправлено", cls: "text-green" },
  REPEATED: { label: "повторил заказ", cls: "text-green font-semibold" },
  NO_CHANNEL: { label: "канал недоступен", cls: "text-red" },
};

const CHANNEL: Record<Row["channel"], string> = {
  telegram: "Telegram",
  off: "напоминания выключены",
  none: "гость — без Telegram",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function AdminRepeatsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/admin/repeats?days=${days}`)
      .then((r) => r.json())
      .then(setData);
  }, [days]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Ожидаемые повторы</h1>
          <p className="text-sm text-text-dim mt-0.5">
            У кого и когда заканчивается банка, и что с напоминанием.
          </p>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {[14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 min-h-[40px] text-sm font-medium ${days === d ? "bg-accent text-white" : "bg-white hover:bg-bg-panel"}`}
            >
              {d} дней
            </button>
          ))}
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Запланировано" value={data.summary.pending} />
          <Stat label="Отправлено" value={data.summary.sent} />
          <Stat label="Повторили заказ" value={data.summary.repeated} />
          <Stat
            label="Конверсия напоминаний"
            value={data.summary.conversion === null ? "—" : `${data.summary.conversion}%`}
          />
        </div>
      )}

      {data && data.summary.noChannel > 0 && (
        <p className="text-sm text-text-dim border-l-2 border-red pl-3">
          {data.summary.noChannel} напоминаний без канала: покупатель оформлял заказ гостем и не входил через
          Telegram. Их можно обзвонить вручную — телефон в таблице.
        </p>
      )}

      {!data ? (
        <p className="text-text-dim">Загрузка…</p>
      ) : data.rows.length === 0 ? (
        <p className="text-text-dim">
          В ближайшие {data.days} дней ни у кого ничего не заканчивается. Даты появляются у заказов
          с товарами, у которых заполнено «на сколько хватит».
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-text-dim border-b border-border">
                <th className="py-2 pr-3 font-semibold">Закончится</th>
                <th className="py-2 px-3 font-semibold">Покупатель</th>
                <th className="py-2 px-3 font-semibold">Товар</th>
                <th className="py-2 px-3 font-semibold">Канал</th>
                <th className="py-2 pl-3 font-semibold">Напоминание</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.orderItemId} className="border-b border-border last:border-b-0 align-top">
                  <td className={`py-2.5 pr-3 whitespace-nowrap tabular-nums ${r.overdue ? "text-red font-medium" : ""}`}>
                    {fmt(r.expectedFinishAt)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div>{r.customer}</div>
                    <div className="text-xs text-text-dim">
                      {r.phone} ·{" "}
                      <Link href={`/admin/orders/${r.orderId}`} className="link-action">
                        {r.orderNumber}
                      </Link>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {r.product}
                    {r.quantity > 1 && <span className="text-text-dim"> × {r.quantity}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-text-dim whitespace-nowrap">{CHANNEL[r.channel]}</td>
                  <td className="py-2.5 pl-3 whitespace-nowrap">
                    {r.reminder ? (
                      <>
                        <span className={STATUS[r.reminder.status]?.cls}>{STATUS[r.reminder.status]?.label}</span>
                        <div className="text-xs text-text-dim">
                          {r.reminder.sentAt ? `ушло ${fmt(r.reminder.sentAt)}` : `на ${fmt(r.reminder.dueAt)}`}
                        </div>
                      </>
                    ) : (
                      <span className="text-text-dim">ещё не запланировано</span>
                    )}
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-bg-panel rounded-2xl p-4">
      <div className="text-xs text-text-dim">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}
