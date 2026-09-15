import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  getTelegramConfig,
  getWebhookSecretToken,
  buildSelfAddedMessage,
  buildLaterMessage,
  buildGiftReadyMessage,
  buildPlanGuideText,
  buildPlanNotFoundMessage,
} from "@/lib/telegram";
import { addOrderItemsToRoutine } from "@/lib/orderToRoutine";
import { randomBytes } from "crypto";

/**
 * Вебхук бота. Три вида апдейтов:
 *  - /start <token>        — привязка канала напоминаний к аккаунту
 *  - /start plan_<token>   — «Получить гайд в Telegram» с /plan/<token>,
 *    без аккаунта и без трекинга, просто текст
 *  - callback_query dp:*   — ответ на «это вам / в подарок / позже»
 *    после доставки заказа (Задача A)
 * Отвечает всегда: молчание при неизвестном/просроченном токене — отдельный
 * дефект UX, которого здесь не должно быть.
 */
export async function POST(req: NextRequest) {
  const { botToken } = getTelegramConfig();
  const secret = getWebhookSecretToken();
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  console.log("[telegram webhook] апдейт:", JSON.stringify(update));

  if (!botToken) return NextResponse.json({ ok: true });

  if (update?.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return NextResponse.json({ ok: true });
  }

  const message = update?.message;
  const chatId = message?.chat?.id != null ? String(message.chat.id) : null;
  const text = typeof message?.text === "string" ? message.text.trim() : null;

  if (!chatId || !text || !text.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const payload = text.split(/\s+/)[1];

  if (!payload) {
    await sendTelegramMessage(
      chatId,
      "Привет! Чтобы бот мог присылать напоминания, войдите на сайте через Telegram и нажмите «Подключить напоминания» в личном кабинете."
    );
    return NextResponse.json({ ok: true });
  }

  if (payload.startsWith("plan_")) {
    await handlePlanGuideRequest(chatId, payload.slice("plan_".length));
    return NextResponse.json({ ok: true });
  }

  await handleChannelLinkStart(chatId, payload);
  return NextResponse.json({ ok: true });
}

/** /start plan_<token> — только текст гайда, без аккаунта и без трекинга */
async function handlePlanGuideRequest(chatId: string, token: string): Promise<void> {
  const plan = await prisma.plan.findUnique({
    where: { token },
    include: { order: { include: { items: { include: { product: true } } } } },
  });
  if (!plan) {
    await sendTelegramMessage(chatId, buildPlanNotFoundMessage());
    return;
  }
  const items = plan.order.items.map((i) => ({ name: i.product.name, dosage: i.product.dosage }));
  await sendTelegramMessage(chatId, buildPlanGuideText(items, plan.comment));
}

/** /start <token> — существующая привязка канала напоминаний к аккаунту */
async function handleChannelLinkStart(chatId: string, token: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { pendingLinkToken: token } });

  if (!user) {
    await sendTelegramMessage(chatId, "Эта ссылка недействительна — она уже использована или её не существует. Сгенерируйте новую в личном кабинете.");
    return;
  }

  if (!user.pendingLinkTokenExpiresAt || user.pendingLinkTokenExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingLinkToken: null, pendingLinkTokenExpiresAt: null },
    });
    await sendTelegramMessage(chatId, "Ссылка устарела. Зайдите в личный кабинет на сайте и нажмите «Подключить напоминания» ещё раз.");
    return;
  }

  if (user.telegramId !== chatId) {
    await sendTelegramMessage(chatId, "Эта ссылка выдана другому аккаунту на сайте. Откройте личный кабинет под своим Telegram и сгенерируйте свою ссылку.");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { reminderChannelConnectedAt: new Date(), pendingLinkToken: null, pendingLinkTokenExpiresAt: null },
  });
  await sendTelegramMessage(chatId, "Готово! Теперь бот напомнит здесь, когда банка заканчивается.");
}

interface CallbackQuery {
  id: string;
  message?: { chat?: { id?: number | string } };
  data?: string;
}

/** dp:self:<orderId> / dp:gift:<orderId> / dp:later:<orderId> — Задача A */
async function handleCallbackQuery(cq: CallbackQuery): Promise<void> {
  const chatId = cq.message?.chat?.id != null ? String(cq.message.chat.id) : null;
  const data = cq.data ?? "";
  const [prefix, action, orderId] = data.split(":");

  if (prefix !== "dp" || !chatId || !orderId) {
    await answerCallbackQuery(cq.id);
    return;
  }

  const prompt = await prisma.deliveryPrompt.findUnique({ where: { orderId } });
  if (!prompt) {
    await answerCallbackQuery(cq.id, "Заказ не найден");
    return;
  }
  if (prompt.status === "ANSWERED_SELF" || prompt.status === "ANSWERED_GIFT") {
    await answerCallbackQuery(cq.id, "Уже отвечено");
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!order?.user || order.user.telegramId !== chatId) {
    await answerCallbackQuery(cq.id);
    return;
  }

  if (action === "self") {
    const items = await addOrderItemsToRoutine(order.user.id, orderId);
    await prisma.deliveryPrompt.update({
      where: { orderId },
      data: { status: "ANSWERED_SELF", answeredAt: new Date() },
    });
    await answerCallbackQuery(cq.id, "Добавлено");
    await sendTelegramMessage(chatId, buildSelfAddedMessage(items));
    return;
  }

  if (action === "gift") {
    const token = randomBytes(24).toString("base64url");
    await prisma.plan.create({ data: { token, orderId, ownerId: order.user.id } });
    await prisma.deliveryPrompt.update({
      where: { orderId },
      data: { status: "ANSWERED_GIFT", answeredAt: new Date() },
    });
    const siteUrl = process.env.PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || "";
    await answerCallbackQuery(cq.id, "Готово");
    await sendTelegramMessage(chatId, buildGiftReadyMessage(`${siteUrl}/plan/${token}`));
    return;
  }

  if (action === "later") {
    await prisma.deliveryPrompt.update({
      where: { orderId },
      data: { status: "SNOOZED", snoozedAt: new Date() },
    });
    await answerCallbackQuery(cq.id);
    await sendTelegramMessage(chatId, buildLaterMessage());
    return;
  }

  await answerCallbackQuery(cq.id);
}
