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
 * Без query-параметра: чистит очередь необработанных апдейтов у Telegram
 * (drop_pending_updates) — на случай зависших /start от старой схемы.
 *
 * С ?testSendTo=<telegramId>: шлёт этому chat_id тестовое сообщение и
 * возвращает сырой ответ Telegram как есть — способ фактически проверить,
 * может ли бот писать конкретному пользователю (a не гадать по докам).
 */
export async function POST(req: Request) {
  const { sandbox, botToken } = getTelegramConfig();
  if (sandbox) {
    return NextResponse.json({ sandbox: true, note: "TELEGRAM_BOT_TOKEN не задан" });
  }

  const testSendTo = new URL(req.url).searchParams.get("testSendTo");
  if (testSendTo) {
    const result = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: testSendTo, text: "Диагностика доставки сообщений (можно игнорировать)" }),
    }).then((r) => r.json());
    return NextResponse.json(result);
  }

  const result = await fetch(
    `https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=true`
  ).then((r) => r.json());
  return NextResponse.json(result);
}
