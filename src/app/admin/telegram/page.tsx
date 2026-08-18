"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

interface Subscriber {
  id: string;
  deviceId: string;
  chatId: string | null;
  routineSnapshot: string | null;
  createdAt: string;
}

interface SendResult {
  deviceId: string;
  ok: boolean;
  sandbox: boolean;
  preview: string;
  error?: string;
}

export default function AdminTelegramPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/telegram/subscribers");
    setSubscribers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function sendReminders() {
    setSending(true);
    setResults(null);
    const res = await fetch("/api/admin/telegram/send-reminders", { method: "POST" });
    const data = await res.json();
    setResults(data.results);
    setSending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.telegram}</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={sendReminders}
          disabled={sending}
          className="px-5 py-2.5 rounded-lg btn btn-primary font-semibold text-sm disabled:opacity-60"
        >
          {sending ? "Отправляем..." : "Отправить напоминания сейчас"}
        </button>
        <p className="text-xs text-text-dim">
          Без TELEGRAM_BOT_TOKEN сообщения не уходят реально — ниже показывается, что было бы отправлено.
        </p>
      </div>

      {results && (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold">Результат отправки ({results.length})</div>
          {results.length === 0 ? (
            <p className="text-sm text-text-dim">Нет подключённых подписчиков.</p>
          ) : (
            results.map((r) => (
              <div key={r.deviceId} className="bg-bg-panel border border-border rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-text-dim">{r.deviceId.slice(0, 12)}...</span>
                  <span className={r.sandbox ? "text-text-dim" : r.ok ? "text-green" : "text-red"}>
                    {r.sandbox ? "песочница" : r.ok ? "отправлено" : "ошибка"}
                  </span>
                </div>
                <div className="whitespace-pre-line text-text-dim">{r.preview}</div>
                {r.error && <div className="text-red mt-1">{r.error}</div>}
              </div>
            ))
          )}
        </div>
      )}

      <div>
        <div className="text-sm font-semibold mb-2">Подписчики ({subscribers.length})</div>
        {loading ? (
          <p className="text-sm text-text-dim">{t.common.loading}</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-text-dim">Пока никто не подключил Telegram-напоминания.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {subscribers.map((s) => {
              const items: string[] = s.routineSnapshot ? JSON.parse(s.routineSnapshot) : [];
              return (
                <div key={s.id} className="bg-bg-panel border border-border rounded-xl p-3 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-text-dim">{s.deviceId.slice(0, 16)}...</div>
                    <div className="text-text-dim truncate">
                      {items.length > 0 ? items.join(", ") : "Список приёма пуст"}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      s.chatId ? "bg-green-bg text-green" : "bg-bg text-text-dim"
                    }`}
                  >
                    {s.chatId ? "подключён" : "не подключён"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
