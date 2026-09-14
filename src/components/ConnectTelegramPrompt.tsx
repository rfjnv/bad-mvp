"use client";

import Link from "next/link";
import { useUser } from "@/lib/useUser";

/**
 * После оформления — предложение войти через Telegram, чтобы получить
 * напоминание, когда банка закончится. Вошедшему не показывается.
 */
export default function ConnectTelegramPrompt() {
  const { user, loading } = useUser();
  if (loading || user) return null;
  return (
    <div className="w-full border border-border-strong rounded-2xl p-5 text-left flex flex-col gap-3">
      <div className="font-semibold">Напомнить, когда закончится?</div>
      <p className="text-sm text-text-dim">
        Войдите через Telegram — бот напишет за неделю до того, как банка подойдёт к концу,
        и предложит повторить заказ в одно нажатие.
      </p>
      <Link href="/account?login=1" className="px-5 min-h-[44px] rounded-lg btn btn-primary text-sm w-max">
        Подключить Telegram
      </Link>
    </div>
  );
}
