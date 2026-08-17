import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { telegramLinkSchema } from "@/lib/validation";
import { getTelegramConfig } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = telegramLinkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { deviceId } = parsed.data;
  const subscriber = await prisma.telegramSubscriber.upsert({
    where: { deviceId },
    create: { deviceId },
    update: {},
  });

  const { sandbox, botUsername } = getTelegramConfig();
  const deepLink = sandbox ? null : `https://t.me/${botUsername}?start=${deviceId}`;

  return NextResponse.json({
    connected: Boolean(subscriber.chatId),
    sandbox,
    deepLink,
  });
}
