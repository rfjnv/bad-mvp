import { NextResponse } from "next/server";
import { getTelegramConfig, getShopChatId, sendTelegramMessage } from "@/lib/telegram";

/** Статус канала уведомлений магазина: подключён ли бот и задан ли чат */
export async function GET() {
  const { sandbox, botUsername } = getTelegramConfig();
  const chatId = getShopChatId();
  return NextResponse.json({
    sandbox,
    botUsername: botUsername || null,
    chatConfigured: Boolean(chatId),
  });
}

/** Тестовое сообщение в чат магазина — проверить, что заказы будут доходить */
export async function POST() {
  const { sandbox } = getTelegramConfig();
  const chatId = getShopChatId();
  const text = "🔔 Тест: уведомления о заказах подключены. Новые заказы будут приходить сюда.";

  if (sandbox || !chatId) {
    console.log("[telegram → магазин, песочница]\n" + text);
    return NextResponse.json({ ok: true, sandbox: true, preview: text });
  }

  const result = await sendTelegramMessage(chatId, text);
  return NextResponse.json(result);
}
