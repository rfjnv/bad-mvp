import { prisma } from "./prisma";
import { sendTelegramMessage } from "./telegram";
import { buildOrderStatusMessage, buildMergedOrderStatusMessage } from "./orderStatusMessages";
import { canSendBotMessage, recordBotMessage } from "./botMessageBudget";
import type { OrderStatus } from "@prisma/client";

const MERGE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Вызывается сразу после смены статуса заказа (Задача C). Если с прошлой
 * реально отправленной отправки не прошло часа — не шлём второе сообщение
 * подряд, а копим «на потом» в pendingNotifyStatus; часовой cron
 * (flushPendingOrderStatusNotifications) досылает слитое сообщение, как
 * только час пройдёт. То же самое, если сообщение не влезло в суточный
 * бюджет прямо сейчас — не теряем переход, просто откладываем отправку.
 */
export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: OrderStatus,
  notify: boolean,
  now = new Date()
): Promise<void> {
  if (!notify) return; // «без уведомления» в админке

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
  const user = order?.user;
  if (!order || !user || !user.orderStatusNotificationsEnabled || !user.reminderChannelConnectedAt) return;

  const withinMergeWindow = order.lastNotifiedAt && now.getTime() - order.lastNotifiedAt.getTime() < MERGE_WINDOW_MS;
  const overBudget = !(await canSendBotMessage(user.id, "ORDER_STATUS", now));

  if (withinMergeWindow || overBudget) {
    await prisma.order.update({ where: { id: orderId }, data: { pendingNotifyStatus: newStatus } });
    return;
  }

  const { text, buttons } = buildOrderStatusMessage(order.orderNumber, newStatus, {
    courierPhone: order.courierPhone,
    cancelReason: order.cancelReason,
  });
  const result = await sendTelegramMessage(user.telegramId, text, buttons);

  if (!result.ok) {
    if (result.errorCode === 403) {
      await prisma.user.update({ where: { id: user.id }, data: { reminderChannelConnectedAt: null } });
    } else {
      // Сеть моргнула — не теряем переход, cron досошлёт при следующем проходе
      await prisma.order.update({ where: { id: orderId }, data: { pendingNotifyStatus: newStatus } });
    }
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { lastNotifiedStatus: newStatus, lastNotifiedAt: now, pendingNotifyStatus: null },
  });
  await recordBotMessage(user.id, "ORDER_STATUS", now);
}

/** Часовой cron: досылает то, что было отложено — слиянием, одним сообщением */
export async function flushPendingOrderStatusNotifications(now = new Date()): Promise<{ sent: number }> {
  const candidates = await prisma.order.findMany({
    where: { pendingNotifyStatus: { not: null } },
    include: { user: true },
  });

  let sent = 0;

  for (const order of candidates) {
    const user = order.user;
    if (!user || !user.orderStatusNotificationsEnabled || !user.reminderChannelConnectedAt) {
      // Отключил уведомления или потерял канал, пока висело в очереди — не копим бесконечно
      await prisma.order.update({ where: { id: order.id }, data: { pendingNotifyStatus: null } });
      continue;
    }

    const readyByTime = !order.lastNotifiedAt || now.getTime() - order.lastNotifiedAt.getTime() >= MERGE_WINDOW_MS;
    if (!readyByTime) continue; // ещё не прошёл час — ждём следующего прохода

    if (!(await canSendBotMessage(user.id, "ORDER_STATUS", now))) continue; // бюджет — попробуем в следующий проход

    const statuses = order.lastNotifiedStatus
      ? [order.lastNotifiedStatus, order.pendingNotifyStatus!]
      : [order.pendingNotifyStatus!];
    const { text, buttons } = buildMergedOrderStatusMessage(order.orderNumber, statuses, {
      courierPhone: order.courierPhone,
      cancelReason: order.cancelReason,
    });

    const result = await sendTelegramMessage(user.telegramId, text, buttons);
    if (!result.ok) {
      if (result.errorCode === 403) {
        await prisma.user.update({ where: { id: user.id }, data: { reminderChannelConnectedAt: null } });
        await prisma.order.update({ where: { id: order.id }, data: { pendingNotifyStatus: null } });
      }
      continue; // иначе остаётся pending — попробуем в следующий проход
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { lastNotifiedStatus: order.pendingNotifyStatus!, lastNotifiedAt: now, pendingNotifyStatus: null },
    });
    await recordBotMessage(user.id, "ORDER_STATUS", now);
    sent++;
  }

  return { sent };
}
