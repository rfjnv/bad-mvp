import { prisma } from "./prisma";
import { sendTelegramMessage } from "./telegram";
import { buildOrderStatusMessage, buildMergedOrderStatusMessage } from "./orderStatusMessages";
import { recordBotMessage } from "./botMessageBudget";
import type { OrderStatus } from "@prisma/client";

const MERGE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Статусы, которые значат «что-то важное только что произошло» — не
 * копим на слияние ни при каких обстоятельствах, даже если с прошлой
 * отправки не прошло часа. «Передан курьеру» пролежавший до слияния
 * с приездом курьера — это и есть тот баг, который здесь недопустим.
 * Копить можно только промежуточные статусы (CONFIRMED, PACKED,
 * IN_TRANSIT, RETURNED).
 */
const IMMEDIATE_STATUSES = new Set<OrderStatus>(["WITH_COURIER", "DELIVERED", "CANCELLED"]);

/**
 * Вызывается сразу после смены статуса заказа (Задача C). Статусы заказа
 * не участвуют в суточном лимите вообще — человек ждёт свой заказ, это
 * не спам ни при каком количестве. Единственное ограничение — слияние
 * промежуточных переходов в пределах часа, и то не для «важных» статусов
 * (см. IMMEDIATE_STATUSES), которые всегда уходят сразу же, забирая
 * с собой любой накопленный промежуточный статус одним сообщением.
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

  const isImmediate = IMMEDIATE_STATUSES.has(newStatus);
  const withinMergeWindow =
    !isImmediate && order.lastNotifiedAt && now.getTime() - order.lastNotifiedAt.getTime() < MERGE_WINDOW_MS;

  if (withinMergeWindow) {
    // Промежуточный статус, час ещё не прошёл — копим, не шлём второе
    // сообщение подряд. Флаш — либо следующий переход, либо часовой cron.
    await prisma.order.update({ where: { id: orderId }, data: { pendingNotifyStatus: newStatus } });
    return;
  }

  // Отправляем сейчас — забираем с собой любой накопленный промежуточный
  // статус, если он ещё не был отправлен (это и даёт «собран и передан курьеру»)
  const pending = order.pendingNotifyStatus;
  const statuses = pending && pending !== newStatus ? [pending, newStatus] : [newStatus];
  const { text, buttons } =
    statuses.length > 1
      ? buildMergedOrderStatusMessage(order.orderNumber, statuses, { courierPhone: order.courierPhone, cancelReason: order.cancelReason })
      : buildOrderStatusMessage(order.orderNumber, newStatus, { courierPhone: order.courierPhone, cancelReason: order.cancelReason });

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

/**
 * Часовой cron: досылает промежуточные статусы, которые копились на
 * слияние и так и не дождались следующего перехода или «важного»
 * статуса за час. Важные статусы сюда не попадают — они уже ушли сразу
 * (см. notifyOrderStatusChange), pendingNotifyStatus для них не ставится.
 */
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
