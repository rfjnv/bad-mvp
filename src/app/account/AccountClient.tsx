"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TelegramLogin from "@/components/TelegramLogin";
import { useUser, USER_CHANGED_EVENT } from "@/lib/useUser";
import { formatSum } from "@/lib/format";
import { getRoutine, getAllHistory } from "@/lib/tracker";
import { CATEGORY_ORDER_STATUS_LABELS as ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/i18n";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  repeatToken: string | null;
  items: { slug: string; name: string; quantity: number; expectedFinishAt: string | null }[];
}

interface RoutineRow {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  durationDays: number | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountClient({ botUsername }: { botUsername: string | null }) {
  const { user, loading, logout } = useUser();

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-text-dim">Загрузка…</div>;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="display-1">Вход через Telegram</h1>
          <p className="text-text-dim max-w-xl text-[17px]">
            Без пароля и регистрации. Заказы, список приёма и напоминания о том, что банка
            заканчивается, — на всех ваших устройствах.
          </p>
        </header>
        <TelegramLogin botUsername={botUsername} />
        <p className="text-[13px] text-text-dim border-t border-border pt-4 max-w-xl">
          Telegram передаёт нам только имя, username и фото профиля. Данные о приёме видите только вы.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-12">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.photoUrl ? (
            <Image src={user.photoUrl} alt="" width={56} height={56} className="rounded-full" unoptimized />
          ) : (
            <span className="w-14 h-14 rounded-full bg-bg-panel flex items-center justify-center text-xl font-semibold">
              {user.firstName.slice(0, 1)}
            </span>
          )}
          <div>
            <h1 className="display-2">{user.firstName}</h1>
            {user.username && <div className="text-text-dim">@{user.username}</div>}
          </div>
        </div>
        <button onClick={logout} className="text-sm link-action shrink-0 min-h-[44px]">
          Выйти
        </button>
      </header>

      <ImportFromBrowser />
      <RoutineSection />
      <OrdersSection />
      <ReminderChannel connected={user.reminderChannelConnected} />
      <ReminderSettings
        initial={{
          remindersEnabled: user.remindersEnabled,
          remindDaysBefore: user.remindDaysBefore,
          remindHour: user.remindHour,
        }}
      />
    </div>
  );
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Вход через Login Widget не даёт боту права писать пользователю — это
 * отдельное разрешение, которое Telegram выдаёт только через /start у
 * бота. Без этого блока пользователь думает, что напоминания уже
 * работают, хотя бот молча получает 403 на каждую отправку.
 */
function ReminderChannel({ connected: initialConnected }: { connected: boolean }) {
  const [status, setStatus] = useState<"connected" | "idle" | "waiting" | "timeout" | "error">(
    initialConnected ? "connected" : "idle"
  );
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "waiting") return;
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled || document.hidden) return;
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (cancelled) return;
        if (data.user?.reminderChannelConnected) {
          setStatus("connected");
          window.dispatchEvent(new Event(USER_CHANGED_EVENT));
          return;
        }
      } catch {
        // сеть моргнула — не считаем таймаутом, попробуем ещё раз
      }
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        if (!cancelled) setStatus("timeout");
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    let timer = setTimeout(poll, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
      } else if (status === "waiting") {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [status]);

  async function connect() {
    setStatus("waiting");
    setLink(null);
    try {
      const res = await fetch("/api/me/telegram-link", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.link) {
        setStatus("error");
        return;
      }
      setLink(data.link);
      window.open(data.link, "_blank", "noopener,noreferrer");
    } catch {
      setStatus("error");
    }
  }

  if (status === "connected") {
    return (
      <div className="border border-border-strong rounded-2xl p-4 flex items-center justify-between gap-3">
        <span className="text-sm">
          <span className="text-green font-medium">Напоминания подключены.</span> Бот напишет сюда, когда банка заканчивается.
        </span>
      </div>
    );
  }

  return (
    <div className="border border-border-strong rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm">
          Напоминания не подключены — вход через Telegram не даёт боту права писать вам,
          это отдельный шаг.
        </span>
        {status !== "waiting" && (
          <button onClick={connect} className="px-4 min-h-[40px] rounded-lg btn btn-primary text-sm shrink-0">
            {status === "timeout" || status === "error" ? "Попробовать снова" : "Подключить напоминания"}
          </button>
        )}
      </div>
      {status === "waiting" && (
        <p className="text-sm text-text-dim">
          Открыли бота в новой вкладке — нажмите там Start.{" "}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="link-action">
              Открыть ещё раз
            </a>
          )}
        </p>
      )}
      {status === "timeout" && (
        <p className="text-sm text-text-dim">Не дождались подтверждения от бота. Попробуйте ещё раз.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red">Не получилось получить ссылку. Попробуйте ещё раз.</p>
      )}
    </div>
  );
}

/**
 * Перенос списка из localStorage. Показывается один раз — пока в браузере
 * есть что переносить и пользователь не отказался.
 */
function ImportFromBrowser() {
  const [local, setLocal] = useState<{ routine: string[]; history: Record<string, string[]> } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const routine = getRoutine().map((r) => r.slug);
    const history = getAllHistory();
    const dismissed = localStorage.getItem("bad-mvp-import-dismissed") === "1";
    if (!dismissed && (routine.length > 0 || Object.keys(history).length > 0)) {
      setLocal({ routine, history });
    }
  }, []);

  if (!local || done) {
    return done ? <p className="text-sm text-green">{done}</p> : null;
  }

  async function run() {
    setBusy(true);
    const res = await fetch("/api/me/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(local),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      localStorage.setItem("bad-mvp-import-dismissed", "1");
      setDone(`Перенесено: ${data.routine} товаров в список и ${data.history} отметок приёма.`);
      window.dispatchEvent(new Event("bad-mvp-routine-changed"));
    }
  }

  const days = Object.keys(local.history).length;
  return (
    <div className="border border-border-strong rounded-2xl p-5 flex flex-col gap-3">
      <div className="font-semibold">В этом браузере есть список приёма</div>
      <p className="text-sm text-text-dim">
        {local.routine.length} {local.routine.length === 1 ? "товар" : "товара"} и отметки за {days}{" "}
        {days === 1 ? "день" : "дней"}. Перенести в аккаунт, чтобы видеть их на любом устройстве?
        Ничего не удалится и не перезапишется.
      </p>
      <div className="flex flex-wrap gap-3">
        <button onClick={run} disabled={busy} className="px-5 min-h-[44px] rounded-lg btn btn-primary text-sm disabled:opacity-60">
          {busy ? "Переносим…" : "Перенести"}
        </button>
        <button
          onClick={() => {
            localStorage.setItem("bad-mvp-import-dismissed", "1");
            setLocal(null);
          }}
          className="px-5 min-h-[44px] rounded-lg btn btn-secondary text-sm"
        >
          Не сейчас
        </button>
      </div>
    </div>
  );
}

function RoutineSection() {
  const [items, setItems] = useState<RoutineRow[] | null>(null);
  useEffect(() => {
    const load = () =>
      fetch("/api/me/routine")
        .then((r) => r.json())
        .then((d) => setItems(d.items ?? []));
    load();
    window.addEventListener("bad-mvp-routine-changed", load);
    return () => window.removeEventListener("bad-mvp-routine-changed", load);
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="display-2">Мой приём</h2>
        <Link href="/tracker" className="text-sm link-action shrink-0">
          Открыть трекер
        </Link>
      </div>
      {items === null ? (
        <p className="text-sm text-text-dim">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-text-dim">
          Пока пусто. Добавляйте товары кнопкой «В мой приём» на карточке — и они появятся здесь
          и на всех ваших устройствах.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {items.map((i) => (
            <li key={i.slug} className="flex items-center gap-3 py-3">
              <span className="relative w-12 h-12 rounded-lg overflow-hidden bg-bg-panel shrink-0">
                <Image src={i.imageUrl} alt="" fill className="object-contain p-1 mix-blend-multiply" sizes="48px" />
              </span>
              <span className="min-w-0 flex-1">
                <Link href={`/product/${i.slug}`} className="font-medium text-sm line-clamp-1">
                  {i.name}
                </Link>
                <span className="text-[13px] text-text-dim">
                  {i.brand}
                  {i.durationDays ? ` · банки хватает на ${i.durationDays} дн.` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  useEffect(() => {
    fetch("/api/me/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="display-2">Заказы</h2>
      {orders === null ? (
        <p className="text-sm text-text-dim">Загрузка…</p>
      ) : orders.length === 0 ? (
        <p className="text-text-dim">
          Заказов пока нет. Заказы, оформленные после входа, будут появляться здесь — с датами,
          когда закончится каждая банка.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <article key={o.id} className="border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-mono font-semibold">{o.orderNumber}</span>
                  <span className="text-text-dim text-sm ml-3">{formatDate(o.createdAt)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-text-dim">{ORDER_STATUS_LABELS[o.status]}</span>
                  <span className="text-text-dim"> · {PAYMENT_STATUS_LABELS[o.paymentStatus]}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {o.items.map((i) => (
                  <li key={i.slug} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {i.name} × {i.quantity}
                    </span>
                    {i.expectedFinishAt && (
                      <span className="text-[13px] text-text-dim shrink-0">
                        закончится ≈ {formatDate(i.expectedFinishAt)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="font-semibold">{formatSum(o.totalAmount)}</span>
                {o.repeatToken && (
                  <Link href={`/repeat/${o.repeatToken}`} className="px-4 min-h-[40px] rounded-lg btn btn-secondary text-sm">
                    Повторить заказ
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReminderSettings({
  initial,
}: {
  initial: { remindersEnabled: boolean; remindDaysBefore: number; remindHour: number };
}) {
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(false);

  async function save(next: typeof s) {
    setS(next);
    setSaved(false);
    await fetch("/api/me/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="display-2">Напоминания</h2>
      <p className="text-text-dim max-w-xl">
        Когда банка из заказа подходит к концу, бот напишет в Telegram и предложит повторить заказ
        в одно нажатие.
      </p>
      <div className="border border-border rounded-2xl divide-y divide-border">
        <label className="flex items-center justify-between gap-4 p-4 cursor-pointer">
          <span className="font-medium">Напоминать, когда заканчивается</span>
          <input
            type="checkbox"
            checked={s.remindersEnabled}
            onChange={(e) => save({ ...s, remindersEnabled: e.target.checked })}
            className="w-5 h-5 accent-[color:var(--accent)]"
          />
        </label>
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="font-medium">За сколько дней</span>
          <select
            value={s.remindDaysBefore}
            onChange={(e) => save({ ...s, remindDaysBefore: Number(e.target.value) })}
            disabled={!s.remindersEnabled}
            className="px-3 h-10 rounded-lg bg-bg-panel border border-border disabled:opacity-50"
          >
            {[3, 5, 7, 10, 14].map((d) => (
              <option key={d} value={d}>
                {d} дн.
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="font-medium">Время</span>
          <select
            value={s.remindHour}
            onChange={(e) => save({ ...s, remindHour: Number(e.target.value) })}
            disabled={!s.remindersEnabled}
            className="px-3 h-10 rounded-lg bg-bg-panel border border-border disabled:opacity-50"
          >
            {[8, 9, 10, 11, 12, 14, 18, 20].map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
      </div>
      {saved && <p className="text-sm text-green">Сохранено</p>}
    </section>
  );
}
