import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, buildReminderMessage } from "@/lib/telegram";

export async function POST() {
  const subscribers = await prisma.telegramSubscriber.findMany({
    where: { chatId: { not: null } },
  });

  const results = [];
  for (const s of subscribers) {
    const items: string[] = s.routineSnapshot ? JSON.parse(s.routineSnapshot) : [];
    const message = buildReminderMessage(items);
    const result = await sendTelegramMessage(s.chatId!, message);
    results.push({
      deviceId: s.deviceId,
      chatId: s.chatId,
      ok: result.ok,
      sandbox: result.sandbox,
      preview: result.preview,
      error: result.error,
    });
  }

  return NextResponse.json({ sent: results.length, results });
}
