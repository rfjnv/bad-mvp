import { NextResponse } from "next/server";
import { getTelegramConfig } from "@/lib/telegram";

/**
 * Диагностика бота — только чтение, ничего не меняет и не отправляет.
 * getWebhookInfo показывает, куда (если куда-то) Telegram шлёт апдейты
 * и последнюю ошибку доставки; getMe подтверждает, что токен в окружении
 * относится к тому самому боту, а не к другому/тестовому.
 */
export async function GET() {
  const { sandbox, botToken, botUsername } = getTelegramConfig();
  if (sandbox) {
    return NextResponse.json({ sandbox: true, note: "TELEGRAM_BOT_TOKEN не задан — обращаться некуда" });
  }

  const [me, webhook] = await Promise.all([
    fetch(`https://api.telegram.org/bot${botToken}/getMe`).then((r) => r.json()),
    fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`).then((r) => r.json()),
  ]);

  return NextResponse.json({
    envBotUsername: botUsername,
    getMe: me,
    getWebhookInfo: webhook,
  });
}

/**
 * Очищает очередь необработанных апдейтов у Telegram (drop_pending_updates).
 * Мы не используем вебхук вовсе — вход идёт через Login Widget без единого
 * сообщения боту, — поэтому очередь безопасно сбросить, чтобы диагностика
 * не показывала зависшие /start с прошлой, нерабочей схемы привязки.
 */
export async function POST() {
  const { sandbox, botToken } = getTelegramConfig();
  if (sandbox) {
    return NextResponse.json({ sandbox: true, note: "TELEGRAM_BOT_TOKEN не задан" });
  }
  const result = await fetch(
    `https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=true`
  ).then((r) => r.json());
  return NextResponse.json(result);
}
