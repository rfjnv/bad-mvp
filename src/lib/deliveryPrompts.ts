import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, buildDeliveryPromptMessage, deliveryPromptButtons } from "@/lib/telegram";
import { tashkentHour } from "@/lib/reminders";

const FOLLOW_UP_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Отправляет ещё не отправленные вопросы. Гостю или пользователю без
 * подключённого канала — NO_CHANNEL, вопрос не теряется, просто некому
 * его показать (симметрично src/lib/reminders.ts).
 */
export async function sendPendingDeliveryPrompts(): Promise<{ sent: number; noChannel: number }> {
  const pending = await prisma.deliveryPrompt.findMany({
    where: { status: "PENDING" },
    include: { order: { include: { user: true } } },
  });

  let sent = 0;
  let noChannel = 0;

  for (const p of pending) {
    const user = p.order.user;
    if (!user || !user.reminderChannelConnectedAt) {
      await prisma.deliveryPrompt.update({ where: { id: p.id }, data: { status: "NO_CHANNEL" } });
      noChannel++;
      continue;
    }

    const result = await sendTelegramMessage(
      user.telegramId,
      buildDeliveryPromptMessage(p.order.orderNumber),
      deliveryPromptButtons(p.orderId)
    );
    if (!result.ok) continue; // остаётся PENDING — попробуем в следующий запуск

    await prisma.deliveryPrompt.update({
      where: { id: p.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    sent++;
  }

  return { sent, noChannel };
}

/**
 * Разовый повтор для тех, кто нажал «Позже» — не через ровно 48 часов
 * (никто не должен получить вопрос в 3 ночи), а в тот же час, что выбран
 * в настройках напоминаний пользователя.
 */
export async function sendDeliveryPromptFollowUps(now = new Date()): Promise<{ sent: number }> {
  const due = await prisma.deliveryPrompt.findMany({
    where: {
      status: "SNOOZED",
      followUpSentAt: null,
      snoozedAt: { lte: new Date(now.getTime() - FOLLOW_UP_AFTER_MS) },
    },
    include: { order: { include: { user: true } } },
  });

  let sent = 0;
  const hour = tashkentHour(now);

  for (const p of due) {
    const user = p.order.user;
    if (!user || !user.reminderChannelConnectedAt) continue;
    if (hour < user.remindHour) continue; // ждём своего часа, не шлём раньше

    const result = await sendTelegramMessage(
      user.telegramId,
      buildDeliveryPromptMessage(p.order.orderNumber),
      deliveryPromptButtons(p.orderId)
    );
    if (!result.ok) continue;

    await prisma.deliveryPrompt.update({
      where: { id: p.id },
      data: { followUpSentAt: now },
    });
    sent++;
  }

  return { sent };
}

