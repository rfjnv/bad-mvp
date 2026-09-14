import type { Metadata } from "next";
import { getTelegramConfig } from "@/lib/telegram";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Заказы, список приёма и напоминания о повторе — вход через Telegram, без пароля.",
};

export default function AccountPage() {
  const { canLink, botUsername } = getTelegramConfig();
  return <AccountClient botUsername={canLink ? botUsername : null} />;
}
