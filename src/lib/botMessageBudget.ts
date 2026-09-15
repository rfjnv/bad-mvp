import { prisma } from "./prisma";
import type { BotMessageCategory } from "@prisma/client";

/**
 * Суточный бюджет проактивных сообщений бота на пользователя. Не считает
 * прямые ответы на действия человека (нажал кнопку, написал /start) —
 * это не шум, это ожидаемый ответ на конкретное действие.
 *
 * Число в конфиг, не в код — вот оно, одна константа.
 */
export const DAILY_MESSAGE_BUDGET = 4;

/** Меньше число — выше приоритет при исчерпании бюджета */
const PRIORITY: Record<BotMessageCategory, number> = {
  ORDER_STATUS: 1,
  DELIVERY_PROMPT: 2,
  BANK_REMINDER: 3,
  INTAKE_REMINDER: 4,
};

const TASHKENT_OFFSET_HOURS = 5;

function tashkentStartOfDay(now: Date): Date {
  const t = new Date(now.getTime() + TASHKENT_OFFSET_HOURS * 3_600_000);
  t.setUTCHours(0, 0, 0, 0);
  return new Date(t.getTime() - TASHKENT_OFFSET_HOURS * 3_600_000);
}

/**
 * Можно ли отправить сообщение этой категории сейчас, не превышая бюджет.
 * Что не влезло — не копится и не досылается позже (вызывающий код просто
 * не отправляет, ничего не планирует на потом).
 *
 * Ниже бюджета — да, всегда. На бюджете или сверху — да, только если эта
 * категория приоритетнее любой уже отправленной сегодня: статус заказа
 * почти всегда пройдёт, напоминание о приёме — первое, что режется.
 */
export async function canSendBotMessage(userId: string, category: BotMessageCategory, now = new Date()): Promise<boolean> {
  const since = tashkentStartOfDay(now);
  const sentToday = await prisma.botMessageLog.findMany({
    where: { userId, sentAt: { gte: since } },
    select: { category: true },
  });

  if (sentToday.length < DAILY_MESSAGE_BUDGET) return true;

  const lowestSentPriority = Math.max(...sentToday.map((m) => PRIORITY[m.category]));
  return PRIORITY[category] < lowestSentPriority;
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
