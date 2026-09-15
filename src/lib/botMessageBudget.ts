import { prisma } from "./prisma";
import type { BotMessageCategory } from "@prisma/client";

/**
 * НЕ общий пул с приоритетом — квоты по категориям. Общий пул не работает,
 * потому что сообщения дня не известны заранее: напоминания о приёме
 * уходят утром по расписанию, статусы заказа — днём по событию. Если бы
 * утренний пакет съедал общий бюджет, к моменту «курьер выехал» слать
 * было бы уже нечего — а это самое важное сообщение из всех.
 *
 * Числа — конфиг, не код:
 *  - статусы заказа и вопрос после доставки — вне лимита совсем
 *    (ограничены слиянием и идемпотентностью, не количеством);
 *  - банка — не больше BANK_REMINDER_DAILY_LIMIT в сутки (несколько
 *    заканчивающихся позиций сливаются в одно сообщение со списком);
 *  - приём — не больше INTAKE_REMINDER_DAILY_LIMIT в сутки.
 */
export const BANK_REMINDER_DAILY_LIMIT = 1;
export const INTAKE_REMINDER_DAILY_LIMIT = 2;

const TASHKENT_OFFSET_HOURS = 5;

function tashkentStartOfDay(now: Date): Date {
  const t = new Date(now.getTime() + TASHKENT_OFFSET_HOURS * 3_600_000);
  t.setUTCHours(0, 0, 0, 0);
  return new Date(t.getTime() - TASHKENT_OFFSET_HOURS * 3_600_000);
}

async function countSentToday(userId: string, category: BotMessageCategory, now: Date): Promise<number> {
  const since = tashkentStartOfDay(now);
  return prisma.botMessageLog.count({ where: { userId, category, sentAt: { gte: since } } });
}

export async function canSendBankReminder(userId: string, now = new Date()): Promise<boolean> {
  return (await countSentToday(userId, "BANK_REMINDER", now)) < BANK_REMINDER_DAILY_LIMIT;
}

export async function canSendIntakeReminder(userId: string, now = new Date()): Promise<boolean> {
  return (await countSentToday(userId, "INTAKE_REMINDER", now)) < INTAKE_REMINDER_DAILY_LIMIT;
}

export async function recordBotMessage(userId: string, category: BotMessageCategory, now = new Date()): Promise<void> {
  await prisma.botMessageLog.create({ data: { userId, category, sentAt: now } });
}

/** Для админки (пункт 6) — сколько сообщений и какой категории ушло сегодня */
export async function messageCountsToday(now = new Date()): Promise<
  { userId: string; firstName: string; username: string | null; total: number; byCategory: Record<string, number> }[]
> {
  const since = tashkentStartOfDay(now);
  const logs = await prisma.botMessageLog.findMany({
    where: { sentAt: { gte: since } },
    select: { userId: true, category: true, user: { select: { firstName: true, username: true } } },
  });

  const byUser = new Map<string, { firstName: string; username: string | null; total: number; byCategory: Record<string, number> }>();
  for (const l of logs) {
    const entry = byUser.get(l.userId) ?? {
      firstName: l.user.firstName,
      username: l.user.username,
      total: 0,
      byCategory: {},
    };
    entry.total += 1;
    entry.byCategory[l.category] = (entry.byCategory[l.category] ?? 0) + 1;
    byUser.set(l.userId, entry);
  }

  return [...byUser.entries()]
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.total - a.total);
}
