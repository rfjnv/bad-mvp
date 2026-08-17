import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number | string };
  };
}

/**
 * Реальный вебхук Telegram (Bot API вызывает его при получении сообщений).
 * Без боевого бота этот роут никто не вызывает — актуален только при
 * настроенном TELEGRAM_BOT_TOKEN и зарегистрированном через setWebhook URL.
 */
export async function POST(req: NextRequest) {
  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const text = update?.message?.text ?? "";
  const chatId = update?.message?.chat?.id;

  if (!chatId || !text.startsWith("/start ")) {
    return NextResponse.json({ ok: true });
  }

  const deviceId = text.replace("/start ", "").trim();
  if (!deviceId) {
    return NextResponse.json({ ok: true });
  }

  await prisma.telegramSubscriber
    .update({ where: { deviceId }, data: { chatId: String(chatId) } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
