import { prisma } from "./prisma";
import { sendTelegramMessage, buildReminderMessage } from "./telegram";
import { tashkentHour, tashkentDateKey } from "./reminders";
import type { RoutineSlot } from "@prisma/client";

/**
 * Ежедневное «не забудьте приём» по слотам утро/день/вечер — отдельное
 * сообщение на каждый слот, во время, которое пользователь выбрал для
 * этого слота, а не один пакет всех товаров разом в remindHour.
 *
 * Позиции без слота сюда не попадают — для них поведение прежнее,
 * неавтоматическое (кнопка в /admin/telegram), как и раньше Задачи B.
 */
const SLOTS: { slot: RoutineSlot; hourField: "remindHourMorning" | "remindHourAfternoon" | "remindHourEvening" }[] = [
  { slot: "MORNING", hourField: "remindHourMorning" },
  { slot: "AFTERNOON", hourField: "remindHourAfternoon" },
  { slot: "EVENING", hourField: "remindHourEvening" },
];

export async function sendSlotReminders(now = new Date()): Promise<{ sent: number; noChannel: number }> {
  const hour = tashkentHour(now);
  const dateStr = tashkentDateKey(now);
  let sent = 0;
  let noChannel = 0;

  const users = await prisma.user.findMany({
    where: {
      remindersEnabled: true,
      reminderChannelConnectedAt: { not: null },
      routine: { some: { timeSlot: { not: null }, pausedAt: null } },
    },
    include: {
      routine: { where: { timeSlot: { not: null }, pausedAt: null }, include: { product: true } },
    },
  });

  for (const user of users) {
    for (const { slot, hourField } of SLOTS) {
      if (user[hourField] !== hour) continue;
      const items = user.routine.filter((r) => r.timeSlot === slot);
      if (items.length === 0) continue;

      const already = await prisma.slotReminderSent.findUnique({
        where: { userId_slot_date: { userId: user.id, slot, date: dateStr } },
      });
      if (already) continue;

      const text = buildReminderMessage(items.map((i) => i.product.name));
      const result = await sendTelegramMessage(user.telegramId, text);

      if (!result.ok) {
        if (result.errorCode === 403) {
          await prisma.user.update({ where: { id: user.id }, data: { reminderChannelConnectedAt: null } });
          noChannel++;
        }
        continue;
      }

      await prisma.slotReminderSent.create({ data: { userId: user.id, slot, date: dateStr } });
      sent++;
    }
  }

  return { sent, noChannel };
}
