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
