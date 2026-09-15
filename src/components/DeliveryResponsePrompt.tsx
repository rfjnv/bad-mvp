"use client";

import { useState } from "react";
import Link from "next/link";
import TelegramLogin from "@/components/TelegramLogin";
import { useUser, USER_CHANGED_EVENT } from "@/lib/useUser";

type Step = "ask" | "login-self" | "self-done" | "gift-done" | "later-done";

/**
 * Тот же вопрос «это вам или в подарок?», что и в боте (Задача A) —
 * для гостевых заказов, у которых нет Telegram-канала: 77% заказов сейчас
 * гостевые, без этой копии функция не доходила бы почти ни до кого.
 * Показывается только когда заказ доставлен и ещё не отвечено.
 */
export default function DeliveryResponsePrompt({
  orderId,
  botUsername,
}: {
  orderId: string;
  botUsername: string | null;
}) {
  const { user } = useUser();
  const [step, setStep] = useState<Step>("ask");
  const [planUrl, setPlanUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function claimOwnershipIfGuest() {
    // «Привязывается при первом входе» — гость вошёл здесь же, значит
    // это подходящий момент забрать заказ и его подарочные планы себе
    await fetch(`/api/orders/${orderId}/claim`, { method: "POST" }).catch(() => {});
    window.dispatchEvent(new Event(USER_CHANGED_EVENT));
  }

  async function respond(action: "self" | "gift" | "later") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/delivery-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Не получилось сохранить ответ");
      return;
    }
    if (action === "gift") {
      setPlanUrl(`${window.location.origin}/plan/${data.token}`);
      setStep("gift-done");
    } else if (action === "self") {
      setStep("self-done");
    } else {
      setStep("later-done");
    }
  }

  async function handleSelf() {
    if (!user) {
      setStep("login-self");
      return;
    }
    await respond("self");
  }

  async function afterInlineLogin() {
    await claimOwnershipIfGuest();
    await respond("self");
  }

  if (step === "self-done") {
    return (
      <div className="w-full border border-border-strong rounded-2xl p-5 text-sm text-green">
        Добавлено в «Мой приём» — загляните в раздел «Мой приём» на сайте.
      </div>
    );
  }
  if (step === "later-done") {
    return (
      <div className="w-full border border-border-strong rounded-2xl p-5 text-sm text-text-dim">
        Хорошо, спросим ещё раз через пару дней.
      </div>
    );
  }
  if (step === "gift-done" && planUrl) {
    return (
      <div className="w-full border border-border-strong rounded-2xl p-5 flex flex-col gap-3">
        <div className="font-semibold">Готово! Ссылка на план приёма:</div>
        <div className="bg-bg-panel rounded-xl p-3 font-mono text-sm break-all">{planUrl}</div>
        <p className="text-sm text-text-dim">
          Отправьте её тому, для кого брали.{" "}
          <Link href={planUrl.replace(window.location.origin, "")} className="link-action">
            Открыть, чтобы добавить комментарий
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border border-border-strong rounded-2xl p-5 flex flex-col gap-3">
      <div className="font-semibold">Это вам или в подарок?</div>
      {step === "ask" && (
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSelf} disabled={busy} className="px-4 min-h-[40px] rounded-lg btn btn-primary text-sm disabled:opacity-60">
            Да, это мне
          </button>
          <button onClick={() => respond("gift")} disabled={busy} className="px-4 min-h-[40px] rounded-lg btn btn-secondary text-sm disabled:opacity-60">
            Это не мне — в подарок
          </button>
          <button onClick={() => respond("later")} disabled={busy} className="px-4 min-h-[40px] rounded-lg text-sm text-text-dim disabled:opacity-60">
            Позже
          </button>
        </div>
      )}
      {step === "login-self" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-dim">Войдите через Telegram, чтобы добавить товары в «Мой приём» и получать напоминания.</p>
          <TelegramLogin botUsername={botUsername} onSuccess={afterInlineLogin} />
        </div>
      )}
      {error && <p className="text-sm text-red">{error}</p>}
    </div>
  );
}
