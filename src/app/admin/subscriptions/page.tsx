"use client";

import { useEffect, useState } from "react";
import { SUBSCRIPTION_STATUS_LABELS, t } from "@/lib/i18n";
import { planById } from "@/lib/subscriptionPlans";

interface SubRequest {
  id: string;
  plan: string;
  customerName: string;
  customerPhone: string;
  age: number | null;
  goals: string;
  healthNotes: string | null;
  comment: string | null;
  status: string;
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "ACTIVE", "CANCELLED"];

export default function AdminSubscriptionsPage() {
  const [requests, setRequests] = useState<SubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function refresh(s = status) {
    setLoading(true);
    const res = await fetch(`/api/admin/subscription-requests${s ? `?status=${s}` : ""}`);
    setRequests(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeStatus(id: string, newStatus: string) {
    setSavingId(id);
    await fetch(`/api/admin/subscription-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await refresh();
    setSavingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.subscriptions}</h1>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          refresh(e.target.value);
        }}
        className="px-3 py-2 rounded-lg bg-bg-panel border border-border text-sm max-w-xs"
      >
        <option value="">Все статусы</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {SUBSCRIPTION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {loading ? (
        <p className="text-text-dim text-sm">{t.common.loading}</p>
      ) : requests.length === 0 ? (
        <p className="text-text-dim text-sm">Заявок не найдено.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-bg-panel border border-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">{r.customerName}</div>
                  <div className="text-sm text-text-dim">{r.customerPhone}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{planById(r.plan)?.name ?? r.plan}</div>
                  <div className="text-xs text-text-dim">
                    {new Date(r.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-text-dim">Цели: </span>
                {r.goals}
              </div>
              {r.age && (
                <div className="text-sm">
                  <span className="text-text-dim">Возраст: </span>
                  {r.age}
                </div>
              )}
              {r.healthNotes && (
                <div className="text-sm">
                  <span className="text-text-dim">Особенности здоровья: </span>
                  {r.healthNotes}
                </div>
              )}
              {r.comment && (
                <div className="text-sm">
                  <span className="text-text-dim">Комментарий: </span>
                  {r.comment}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={savingId === r.id}
                    onClick={() => changeStatus(r.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-60 transition-colors ${
                      r.status === s
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-text-dim border-border"
                    }`}
                  >
                    {SUBSCRIPTION_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
