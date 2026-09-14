import { prisma } from "./prisma";
import { buildFinishReminder, sendTelegramMessage, getTelegramConfig } from "./telegram";

/**
 * Напоминания «банка заканчивается».
 *
 * Два шага, оба идемпотентные — их можно гонять хоть каждый час:
 *   1. Планирование: по позициям заказов с известной датой окончания
 *      создаём Reminder с dueAt = finishAt − N дней. orderItemId уникален,
 *      поэтому второй запуск ничего не добавит.
 *   2. Отправка: PENDING с наступившим dueAt уходят в Telegram и становятся
 *      SENT. Без канала (гость без входа) — NO_CHANNEL: позиция не теряется,
 *      её видно в админке.
 *
 * Час отправки — по Ташкенту, из настроек пользователя. Планировщик может
 * запускаться раньше: до нужного часа напоминание просто ждёт.
 */

const DEFAULT_DAYS_BEFORE = 7;
const LOOKAHEAD_DAYS = 45;
const TASHKENT_OFFSET_HOURS = 5;

function tashkentHour(now: Date): number {
  return (now.getUTCHours() + TASHKENT_OFFSET_HOURS) % 24;
}

export interface RunResult {
  scheduled: number;
  sent: number;
  noChannel: number;
  waiting: number;
  errors: string[];
}

export async function runReminders(siteUrl: string, now = new Date()): Promise<RunResult> {
  const result: RunResult = { scheduled: 0, sent: 0, noChannel: 0, waiting: 0, errors: [] };

  // ── 1. Планирование ─────────────────────────────────────────────
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + LOOKAHEAD_DAYS);

  const items = await prisma.orderItem.findMany({
    where: {
      expectedFinishAt: { not: null, lte: horizon },
      reminder: null,
      order: { status: { not: "CANCELLED" } },
    },
    include: { order: { include: { user: true } } },
  });

  for (const item of items) {
    const daysBefore = item.order.user?.remindDaysBefore ?? DEFAULT_DAYS_BEFORE;
    const dueAt = new Date(item.expectedFinishAt!);
    dueAt.setDate(dueAt.getDate() - daysBefore);
    try {
      await prisma.reminder.create({ data: { orderItemId: item.id, dueAt } });
      result.scheduled++;
    } catch {
      // Уникальный индекс: напоминание уже есть — это и есть идемпотентность
    }
  }

  // ── 2. Отправка ─────────────────────────────────────────────────
  const due = await prisma.reminder.findMany({
    where: { status: "PENDING", dueAt: { lte: now } },
    include: {
      orderItem: {
        include: {
          product: { select: { name: true } },
          order: { include: { user: true } },
        },
      },
    },
  });

  const { sandbox } = getTelegramConfig();

  for (const r of due) {
    const order = r.orderItem.order;
    const user = order.user;

    // Канал — только Telegram вошедшего пользователя, который отдельно
    // подключил напоминания (/start по deep-link). Вход через Login Widget
    // прав писать не даёт — sendMessage на него ответит 403. Гостю и не
    // подключившему канал писать некуда, но позицию не теряем: магазин
    // увидит её в «Ожидаемых повторах».
    if (!user || !user.remindersEnabled || !user.reminderChannelConnectedAt) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: "NO_CHANNEL" } });
      result.noChannel++;
      continue;
    }

    if (tashkentHour(now) < user.remindHour) {
      result.waiting++;
      continue;
    }

    const text = buildFinishReminder(r.orderItem.product.name, r.orderItem.expectedFinishAt ?? r.dueAt);
    const buttons = order.repeatToken
      ? [{ text: "Повторить заказ", url: `${siteUrl}/repeat/${order.repeatToken}` }]
      : undefined;

    if (sandbox) {
      console.log(`[telegram → ${user.telegramId}, песочница]\n${text}\n→ ${buttons?.[0]?.url ?? ""}`);
    }
    const send = await sendTelegramMessage(user.telegramId, text, buttons);
    if (!send.ok) {
      result.errors.push(`${order.orderNumber}: ${send.error}`);
      if (send.errorCode === 403) {
        // Пользователь заблокировал бота или отозвал доступ — канал разорван,
        // ретраить бессмысленно, пока не подключит заново
        await prisma.user.update({ where: { id: user.id }, data: { reminderChannelConnectedAt: null } });
        await prisma.reminder.update({ where: { id: r.id }, data: { status: "NO_CHANNEL" } });
        result.noChannel++;
      }
      continue; // иначе остаётся PENDING — попробуем в следующий запуск
    }

    await prisma.reminder.update({
      where: { id: r.id },
      data: { status: "SENT", sentAt: now },
    });
    result.sent++;
  }

  return result;
}

/**
 * Заказ оформлен со страницы повтора — отмечаем напоминания исходного заказа
 * как сработавшие. Так считается конверсия напоминаний в повторные покупки.
 */
export async function markRepeated(originalOrderId: string, repeatOrderId: string): Promise<void> {
  await prisma.reminder.updateMany({
    where: { orderItem: { orderId: originalOrderId }, status: { in: ["SENT", "PENDING", "NO_CHANNEL"] } },
    data: { status: "REPEATED", repeatOrderId },
  });
}
