import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, buildReminderMessage } from "@/lib/telegram";

/**
 * Ежедневное «не забудьте сегодняшний приём» — рассылается по реальному
 * списку приёма пользователей (RoutineItem), а не по снимку, который раньше
 * присылал гостевой браузер. chatId — это и есть telegramId: с Login Widget
 * отдельная привязка не нужна.
 */
export async function POST() {
  const users = await prisma.user.findMany({
    where: { remindersEnabled: true, routine: { some: {} } },
    select: {
      id: true,
      telegramId: true,
      routine: { select: { product: { select: { name: true } } } },
    },
  });

  const results = [];
  for (const u of users) {
    const message = buildReminderMessage(u.routine.map((r) => r.product.name));
    const result = await sendTelegramMessage(u.telegramId, message);
    results.push({
      userId: u.id,
      telegramId: u.telegramId,
      ok: result.ok,
      sandbox: result.sandbox,
      preview: result.preview,
      error: result.error,
    });
  }

  return NextResponse.json({ sent: results.length, results });
}
