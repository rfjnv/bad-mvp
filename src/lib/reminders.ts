import { prisma } from "./prisma";
import { buildFinishReminderList, sendTelegramMessage, getTelegramConfig, type InlineButton } from "./telegram";
import { computeRemaining, type IntakeMark } from "./routineStats";
import { canSendBankReminder, recordBotMessage } from "./botMessageBudget";

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

export function tashkentHour(now: Date): number {
  return (now.getUTCHours() + TASHKENT_OFFSET_HOURS) % 24;
}

/** YYYY-MM-DD по Ташкенту — для дедупликации разовых по дню рассылок */
export function tashkentDateKey(now: Date): string {
  const t = new Date(now.getTime() + TASHKENT_OFFSET_HOURS * 3_600_000);
  return t.toISOString().slice(0, 10);
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
  // Берём все PENDING, а не только с наступившим dueAt по заказу: если
  // «Мой приём» (Задача B) показывает, что банка кончится раньше, чем
  // предполагал календарь заказа, напоминание должно уйти раньше —
  // по более ранней из двух оценок, см. обсуждение в чате.
  const due = await prisma.reminder.findMany({
    where: { status: "PENDING" },
    include: {
      orderItem: {
        include: {
          product: true,
          order: { include: { user: true } },
        },
      },
    },
  });

  const routineCandidates = due.filter((r) => r.orderItem.order.userId);
  const routineItems = routineCandidates.length
    ? await prisma.routineItem.findMany({
        where: {
          OR: routineCandidates.map((r) => ({
            userId: r.orderItem.order.userId!,
            productId: r.orderItem.productId,
          })),
        },
        include: { product: true },
      })
    : [];
  const routineByKey = new Map(routineItems.map((ri) => [`${ri.userId}:${ri.productId}`, ri]));

  const intakeLogs = routineItems.length
    ? await prisma.intakeLog.findMany({
        where: { OR: routineItems.map((ri) => ({ userId: ri.userId, productId: ri.productId })) },
        select: { userId: true, productId: true, date: true, status: true },
      })
    : [];
  const marksByKey = new Map<string, IntakeMark[]>();
  for (const l of intakeLogs) {
    const key = `${l.userId}:${l.productId}`;
    const arr = marksByKey.get(key) ?? [];
    arr.push({ date: l.date, status: l.status });
    marksByKey.set(key, arr);
  }

  const { sandbox } = getTelegramConfig();

  // Сперва решаем, какие reminder'ы вообще готовы уйти прямо сейчас
  // (канал, час, эффективная дата) — без отправки. Группируем по
  // пользователю: несколько заканчивающихся позиций уходят одним
  // сообщением, не больше BANK_REMINDER_DAILY_LIMIT в сутки на человека.
  type DueReminder = (typeof due)[number];
  type ReadyUser = NonNullable<DueReminder["orderItem"]["order"]["user"]>;
  const readyByUser = new Map<string, { user: ReadyUser; reminders: DueReminder[] }>();

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

    // Более ранняя из двух оценок: заказ (календарь доставки) и «Мой приём»
    // (реальные отметки, если они есть) — не считаем на дисплейный порог
    // плотности, для срабатывания напоминания годится любая оценка по факту.
    let effectiveDueAt = r.dueAt;
    const routineItem = routineByKey.get(`${user.id}:${r.orderItem.productId}`);
    if (routineItem) {
      const marks = marksByKey.get(`${user.id}:${r.orderItem.productId}`) ?? [];
      const est = computeRemaining(
        { createdAt: routineItem.createdAt, pausedAt: routineItem.pausedAt, product: routineItem.product },
        marks,
        now
      );
      if (est.earliestDays !== null) {
        const daysBefore = user.remindDaysBefore ?? DEFAULT_DAYS_BEFORE;
        const routineDueAt = new Date(now);
        routineDueAt.setDate(routineDueAt.getDate() + (est.earliestDays - daysBefore));
        if (routineDueAt < effectiveDueAt) effectiveDueAt = routineDueAt;
      }
    }

    if (effectiveDueAt > now || tashkentHour(now) < user.remindHour) {
      result.waiting++;
      continue;
    }

    const entry = readyByUser.get(user.id) ?? { user, reminders: [] as DueReminder[] };
    entry.reminders.push(r);
    readyByUser.set(user.id, entry);
  }

  for (const { user, reminders } of readyByUser.values()) {
    // Лимит на категорию, не общий бюджет — не влезло сегодня, всё
    // остаётся PENDING и уйдёт завтра одним сообщением, как и должно
    if (!(await canSendBankReminder(user.id, now))) {
      result.waiting += reminders.length;
      continue;
    }

    const finishItems = reminders.map((r) => ({
      productName: r.orderItem.product.name,
      finishAt: r.orderItem.expectedFinishAt ?? r.dueAt,
    }));
    const text = buildFinishReminderList(finishItems);
    // Кнопки — по уникальным заказам среди позиций сообщения, не больше трёх
    const buttons: InlineButton[] = [
      ...new Map(
        reminders
          .filter((r) => r.orderItem.order.repeatToken)
          .map((r) => [r.orderItem.order.id, { text: `Повторить ${r.orderItem.order.orderNumber}`, url: `${siteUrl}/repeat/${r.orderItem.order.repeatToken}` }])
      ).values(),
    ].slice(0, 3);

    if (sandbox) {
      console.log(`[telegram → ${user.telegramId}, песочница]\n${text}`);
    }
    const send = await sendTelegramMessage(user.telegramId, text, buttons.length ? buttons : undefined);
    if (!send.ok) {
      result.errors.push(`${user.telegramId}: ${send.error}`);
      if (send.errorCode === 403) {
        // Пользователь заблокировал бота или отозвал доступ — канал разорван,
        // ретраить бессмысленно, пока не подключит заново
        await prisma.user.update({ where: { id: user.id }, data: { reminderChannelConnectedAt: null } });
        await prisma.reminder.updateMany({
          where: { id: { in: reminders.map((r) => r.id) } },
          data: { status: "NO_CHANNEL" },
        });
        result.noChannel += reminders.length;
      }
      continue; // иначе остаются PENDING — попробуем в следующий запуск
    }

    await prisma.reminder.updateMany({
      where: { id: { in: reminders.map((r) => r.id) } },
      data: { status: "SENT", sentAt: now },
    });
    await recordBotMessage(user.id, "BANK_REMINDER", now);
    result.sent += reminders.length;
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
