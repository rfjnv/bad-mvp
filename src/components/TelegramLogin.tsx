"use client";

import { useEffect, useRef, useState } from "react";
import { USER_CHANGED_EVENT } from "@/lib/useUser";
import { getDeviceId } from "@/lib/device";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

/**
 * Кнопка «Войти через Telegram».
 *
 * Telegram Login Widget рисует кнопку сам и после подтверждения в Telegram
 * отдаёт подписанные данные в window.onTelegramAuth. Мы отправляем их
 * на сервер, где подпись проверяется по токену бота — в браузере ей
 * доверять нельзя.
 *
 * Виджет работает только на домене, привязанном к боту через BotFather
 * (/setdomain). На localhost он не покажется — для разработки есть
 * dev-вход по TELEGRAM_LOGIN_DEV_BYPASS=1.
 */
export default function TelegramLogin({
  botUsername,
  size = "large",
  onSuccess,
}: {
  botUsername: string | null;
  size?: "large" | "medium" | "small";
  onSuccess?: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const devBypass = process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_DEV === "1";

  useEffect(() => {
    if (!botUsername || !holder.current) return;
    const el = holder.current;

    window.onTelegramAuth = async (data) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, deviceId: getDeviceId() }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Не удалось войти");
          return;
        }
        window.dispatchEvent(new Event(USER_CHANGED_EVENT));
        onSuccess?.();
      } finally {
        setBusy(false);
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", size);
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    el.appendChild(script);

    return () => {
      el.innerHTML = "";
      delete window.onTelegramAuth;
    };
  }, [botUsername, size, onSuccess]);

  async function devLogin() {
    setBusy(true);
    const res = await fetch("/api/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setBusy(false);
    if (res.ok) {
      window.dispatchEvent(new Event(USER_CHANGED_EVENT));
      onSuccess?.();
    } else {
      setError("Dev-вход выключен");
    }
  }

  if (!botUsername && !devBypass) {
    return (
      <p className="text-sm text-text-dim">
        Вход через Telegram появится, когда будет настроен бот.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {botUsername && <div ref={holder} className="min-h-[40px]" />}
      {devBypass && (
        <button
          onClick={devLogin}
          disabled={busy}
          className="px-4 min-h-[44px] rounded-lg btn btn-secondary text-sm font-semibold disabled:opacity-60 w-max"
        >
          Войти как тестовый пользователь (dev)
        </button>
      )}
      {busy && <span className="text-sm text-text-dim">Входим…</span>}
      {error && <span className="text-sm text-red">{error}</span>}
    </div>
  );
}
