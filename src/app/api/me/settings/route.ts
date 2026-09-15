import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const hour = z.number().int().min(0).max(23);

const schema = z.object({
  remindersEnabled: z.boolean().optional(),
  intakeRemindersEnabled: z.boolean().optional(),
  orderStatusNotificationsEnabled: z.boolean().optional(),
  remindDaysBefore: z.number().int().min(1).max(30).optional(),
  remindHour: hour.optional(),
  remindHourMorning: hour.optional(),
  remindHourAfternoon: hour.optional(),
  remindHourEvening: hour.optional(),
});

/** Настройки уведомлений — три независимых переключателя плюс время отправки */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректные настройки" }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  return NextResponse.json({
    remindersEnabled: updated.remindersEnabled,
    intakeRemindersEnabled: updated.intakeRemindersEnabled,
    orderStatusNotificationsEnabled: updated.orderStatusNotificationsEnabled,
    remindDaysBefore: updated.remindDaysBefore,
    remindHour: updated.remindHour,
    remindHourMorning: updated.remindHourMorning,
    remindHourAfternoon: updated.remindHourAfternoon,
    remindHourEvening: updated.remindHourEvening,
  });
}
