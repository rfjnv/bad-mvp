import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { telegramSyncRoutineSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = telegramSyncRoutineSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { deviceId, items } = parsed.data;
  try {
    await prisma.telegramSubscriber.update({
      where: { deviceId },
      data: { routineSnapshot: JSON.stringify(items) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Устройство не подключено" }, { status: 404 });
  }
}
