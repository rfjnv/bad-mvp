import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Пользователи, которым можно отправить ежедневное напоминание о приёме:
 * вошли через Telegram, не выключили напоминания, и в списке приёма
 * есть хотя бы один товар.
 */
export async function GET() {
  const users = await prisma.user.findMany({
    where: { remindersEnabled: true, routine: { some: {} } },
    select: {
      id: true,
      telegramId: true,
      firstName: true,
      username: true,
      createdAt: true,
      reminderChannelConnectedAt: true,
      _count: { select: { routine: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      telegramId: u.telegramId,
      firstName: u.firstName,
      username: u.username,
      routineCount: u._count.routine,
      createdAt: u.createdAt,
      channelConnected: u.reminderChannelConnectedAt !== null,
    }))
  );
}
