import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId обязателен" }, { status: 400 });
  }

  const subscriber = await prisma.telegramSubscriber.findUnique({ where: { deviceId } });
  return NextResponse.json({ connected: Boolean(subscriber?.chatId) });
}
