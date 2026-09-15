import { prisma } from "./prisma";
import { sendTelegramMessage, buildReminderMessage } from "./telegram";
import { tashkentHour, tashkentDateKey } from "./reminders";
import { canSendBotMessage, recordBotMessage } from "./botMessageBudget";
import type { RoutineSlot } from "@prisma/client";

const MERGE_WINDOW_HOURS = 3;

/**
 * Ежедневное «не забудьте приём». По умолчанию у нового пользователя —
 * один пакет в remindHour ("DEFAULT") для всех позиций без слота; слоты
 * появляются, только если человек сам назначил timeSlot хотя бы одной
 * позиции — три рассылки по умолчанию никому не включаются.
 *
 * Соседние по времени группы (включая DEFAULT) в пределах MERGE_WINDOW_HOURS
 * объединяются в одно сообщение — иначе утро в 8 и слот в 10 были бы двумя
 * отдельными шумными сообщениями вместо одного.
 */
interface Group {
  key: string; // "MORNING" | "AFTERNOON" | "EVENING" | "DEFAULT"
  hour: number;
  items: { productId: string; name: string }[];
}

function clusterByGap(groups: Group[], gapHours: number): Group[][] {
  const sorted = [...groups].sort((a, b) => a.hour - b.hour);
  const clusters: Group[][] = [];
  for (const g of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && g.hour - last[last.length - 1].hour < gapHours) {
      last.push(g);
    } else {
      clusters.push([g]);
    }
  }
  return clusters;
}

export async function sendSlotReminders(now = new Date()): Promise<{ sent: number; noChannel: number }> {
  const hour = tashkentHour(now);
  const dateStr = tashkentDateKey(now);
  let sent = 0;
  let noChannel = 0;

  const users = await prisma.user.findMany({
    where: {
      intakeRemindersEnabled: true,
      reminderChannelConnectedAt: { not: null },
      routine: { some: { pausedAt: null } },
    },
    include: {
      routine: { where: { pausedAt: null }, include: { product: true } },
    },
  });

  for (const user of users) {
    if (user.routine.length === 0) continue;

    const slotGroups: Group[] = (["MORNING", "AFTERNOON", "EVENING"] as RoutineSlot[])
      .map((slot) => ({
        key: slot,
        hour: { MORNING: user.remindHourMorning, AFTERNOON: user.remindHourAfternoon, EVENING: user.remindHourEvening }[slot],
        items: user.routine.filter((r) => r.timeSlot === slot).map((r) => ({ productId: r.productId, name: r.product.name })),
      }))
      .filter((g) => g.items.length > 0);

    const unslotted = user.routine.filter((r) => r.timeSlot === null);
    if (unslotted.length > 0) {
      slotGroups.push({ key: "DEFAULT", hour: user.remindHour, items: unslotted.map((r) => ({ productId: r.productId, name: r.product.name })) });
    }
    if (slotGroups.length === 0) continue;

    for (const cluster of clusterByGap(slotGroups, MERGE_WINDOW_HOURS)) {
      const targetHour = Math.min(...cluster.map((g) => g.hour));
      if (hour !== targetHour) continue;

      const keys = cluster.map((g) => g.key);
      const already = await prisma.slotReminderSent.findFirst({
        where: { userId: user.id, slot: { in: keys }, date: dateStr },
      });
      if (already) continue; // весь кластер отмечается разом — одной записи достаточно

      if (!(await canSendBotMessage(user.id, "INTAKE_REMINDER", now))) continue;

      const items = cluster.flatMap((g) => g.items);
      const text = buildReminderMessage(items.map((i) => i.name));
      const result = await sendTelegramMessage(user.telegramId, text);

      if (!result.ok) {
        if (result.errorCode === 403) {
          await prisma.user.update({ where: { id: user.id }, data: { reminderChannelConnectedAt: null } });
          noChannel++;
        }
        continue;
      }

      await prisma.slotReminderSent.createMany({
        data: keys.map((slot) => ({ userId: user.id, slot, date: dateStr })),
      });
      await recordBotMessage(user.id, "INTAKE_REMINDER", now);
      sent++;
    }
  }

  return { sent, noChannel };
}
