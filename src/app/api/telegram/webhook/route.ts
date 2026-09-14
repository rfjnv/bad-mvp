import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, getTelegramConfig, getWebhookSecretToken } from "@/lib/telegram";

/**
 * Вебхук бота. Единственная его задача — довести /start <token> до
 * привязки канала напоминаний к уже существующему аккаунту (вход остаётся
 * через Login Widget, это не альтернативный логин). Отвечает боту всегда:
 * молчание при неизвестном/просроченном токене — отдельный дефект UX,
 * которого здесь не должно быть.
 */
export async function POST(req: NextRequest) {
  const { botToken } = getTelegramConfig();
  const secret = getWebhookSecretToken();
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  console.log("[telegram webhook] апдейт:", JSON.stringify(update));

  const message = update?.message;
  const chatId = message?.chat?.id != null ? String(message.chat.id) : null;
  const text = typeof message?.text === "string" ? message.text.trim() : null;

  // Не /start — подтверждаем получение и не отвечаем ничего дополнительно
  if (!chatId || !text || !text.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const token = text.split(/\s+/)[1];

  if (!botToken) {
    return NextResponse.json({ ok: true });
  }

  if (!token) {
    await sendTelegramMessage(
      chatId,
      "Привет! Чтобы бот мог присылать напоминания, войдите на сайте через Telegram и нажмите «Подключить напоминания» в личном кабинете."
    );
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { pendingLinkToken: token } });

  if (!user) {
    await sendTelegramMessage(chatId, "Эта ссылка недействительна — она уже использована или её не существует. Сгенерируйте новую в личном кабинете.");
    return NextResponse.json({ ok: true });
  }

  if (!user.pendingLinkTokenExpiresAt || user.pendingLinkTokenExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingLinkToken: null, pendingLinkTokenExpiresAt: null },
    });
    await sendTelegramMessage(chatId, "Ссылка устарела. Зайдите в личный кабинет на сайте и нажмите «Подключить напоминания» ещё раз.");
    return NextResponse.json({ ok: true });
  }

  if (user.telegramId !== chatId) {
    await sendTelegramMessage(chatId, "Эта ссылка выдана другому аккаунту на сайте. Откройте личный кабинет под своим Telegram и сгенерируйте свою ссылку.");
    return NextResponse.json({ ok: true });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { reminderChannelConnectedAt: new Date(), pendingLinkToken: null, pendingLinkTokenExpiresAt: null },
  });
  await sendTelegramMessage(chatId, "Готово! Теперь бот напомнит здесь, когда банка заканчивается.");
  return NextResponse.json({ ok: true });
}
