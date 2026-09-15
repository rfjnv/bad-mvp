"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

interface Subscriber {
  id: string;
  telegramId: string;
  firstName: string;
  username: string | null;
  routineCount: number;
  createdAt: string;
  channelConnected: boolean;
}

interface SendResult {
  userId: string;
  telegramId: string;
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

      <ShopChannel />
      <MessageBudget />

      <h2 className="text-lg font-semibold tracking-tight">Напоминания покупателям</h2>
      <div className="flex items-center gap-3">
        <button
          onClick={sendReminders}
          disabled={sending}
          className="px-5 py-2.5 rounded-lg btn btn-primary font-semibold text-sm disabled:opacity-60"
        >
          {sending ? "Отправляем..." : "Отправить напоминания сейчас"}
        </button>
        <p className="text-xs text-text-dim">
          Уходит тем, кто подключил канал напоминаний (не просто вошёл), не выключил напоминания
          и что-то держит в «Моём приёме». Без TELEGRAM_BOT_TOKEN сообщения не уходят реально —
          ниже показывается, что было бы отправлено.
        </p>
      </div>

      {results && (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold">Результат отправки ({results.length})</div>
          {results.length === 0 ? (
            <p className="text-sm text-text-dim">Некому отправлять — см. список ниже.</p>
          ) : (
            results.map((r) => (
              <div key={r.userId} className="bg-bg-panel border border-border rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-text-dim">{r.telegramId}</span>
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
        <div className="text-sm font-semibold mb-2">Получатели ({subscribers.length})</div>
        {loading ? (
          <p className="text-sm text-text-dim">{t.common.loading}</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-text-dim">
            Пока никто не вошёл через Telegram с непустым списком приёма.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {subscribers.map((s) => (
              <div key={s.id} className="bg-bg-panel border border-border rounded-xl p-3 text-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {s.firstName}
                    {s.username && <span className="text-text-dim"> · @{s.username}</span>}
                  </div>
                  <div className="text-text-dim text-xs">
                    {s.routineCount} {s.routineCount === 1 ? "товар" : "товара"} в приёме
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    s.channelConnected ? "bg-green-bg text-green" : "bg-white border border-border text-text-dim"
                  }`}
                >
                  {s.channelConnected ? "канал подключён" : "вошёл, канал не подключён"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ShopStatus {
  sandbox: boolean;
  botUsername: string | null;
  chatConfigured: boolean;
}

/**
 * Канал уведомлений магазина о заказах. Без него заказ ложится в базу
 * и никто об этом не узнаёт, пока не откроет админку.
 */
function ShopChannel() {
  const [status, setStatus] = useState<ShopStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/telegram/shop")
      .then((r) => r.json())
      .then(setStatus);
  }, []);

  async function sendTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/admin/telegram/shop", { method: "POST" });
    const data = await res.json();
    setTestResult(
      data.sandbox
        ? "Песочница: сообщение напечатано в лог сервера, а не отправлено."
        : data.ok
          ? "Отправлено — проверьте чат."
          : `Ошибка: ${data.error}`
    );
    setTesting(false);
  }

  const live = status && !status.sandbox && status.chatConfigured;

  return (
    <div className="bg-bg-panel rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold">Уведомления о заказах</div>
          <div className="text-sm text-text-dim mt-0.5">
            Каждый новый заказ и каждая оплата приходят сообщением в чат магазина.
          </div>
        </div>
        <span
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg ${
            live ? "bg-green-bg text-green" : "bg-white border border-border text-text-dim"
          }`}
        >
          {status === null ? "…" : live ? "Подключено" : "Песочница"}
        </span>
      </div>

      {status && !live && (
        <p className="text-sm text-text-dim border-l-2 border-border-strong pl-3">
          {status.sandbox
            ? "Не задан TELEGRAM_BOT_TOKEN — сообщения печатаются в лог сервера."
            : "Бот подключён, но не задан TELEGRAM_ADMIN_CHAT_ID — некуда отправлять."}{" "}
          Свой chat_id можно узнать, написав боту @userinfobot.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={sendTest}
          disabled={testing}
          className="px-4 py-2 rounded-lg btn btn-secondary text-sm font-semibold disabled:opacity-60"
        >
          {testing ? "Отправляем…" : "Отправить тестовое сообщение"}
        </button>
        {testResult && <span className="text-sm text-text-dim">{testResult}</span>}
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  ORDER_STATUS: "статус заказа",
  DELIVERY_PROMPT: "доставка",
  BANK_REMINDER: "банка",
  INTAKE_REMINDER: "приём",
};

interface BudgetUser {
  userId: string;
  firstName: string;
  username: string | null;
  total: number;
  byCategory: Record<string, number>;
}

/** Реальная картина отправок за сегодня, а не догадки — пункт 6 из обсуждения шума */
function MessageBudget() {
  const [data, setData] = useState<{ budget: number; users: BudgetUser[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/telegram/message-budget")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="bg-bg-panel rounded-2xl p-5 flex flex-col gap-3">
      <div className="font-semibold">Сообщения бота сегодня</div>
      <p className="text-sm text-text-dim -mt-1">
        Бюджет {data?.budget ?? "…"} сообщений в сутки на пользователя. Что не влезло — не копится,
        досылается по приоритету (статус заказа → банка → приём) или не досылается вовсе.
      </p>
      {data && data.users.length === 0 && <p className="text-sm text-text-dim">Сегодня сообщений ещё не было.</p>}
      {data && data.users.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.users.map((u) => (
            <div key={u.userId} className="flex items-center justify-between gap-3 text-sm border-t border-border pt-2">
              <span>
                {u.firstName}
                {u.username && <span className="text-text-dim"> · @{u.username}</span>}
              </span>
              <span className={`font-semibold ${u.total >= data.budget ? "text-red" : ""}`}>
                {u.total} / {data.budget}
                <span className="text-text-dim font-normal ml-2">
                  ({Object.entries(u.byCategory).map(([c, n]) => `${CATEGORY_LABELS[c] ?? c}: ${n}`).join(", ")})
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
