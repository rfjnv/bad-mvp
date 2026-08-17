import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { telegramLinkSchema } from "@/lib/validation";
import { getTelegramConfig } from "@/lib/telegram";

/** Только для песочницы: боевой бот недоступен, эмулируем подключение для демонстрации. */
export async function POST(req: NextRequest) {
  const { sandbox } = getTelegramConfig();
  if (!sandbox) {
    return NextResponse.json({ error: "Песочница отключена — настроен боевой Telegram-бот" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = telegramLinkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  await prisma.telegramSubscriber.upsert({
    where: { deviceId: parsed.data.deviceId },
    create: { deviceId: parsed.data.deviceId, chatId: `sandbox_${parsed.data.deviceId.slice(0, 8)}` },
    update: { chatId: `sandbox_${parsed.data.deviceId.slice(0, 8)}` },
  });

  return NextResponse.json({ connected: true });
}
