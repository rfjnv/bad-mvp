import { NextResponse } from "next/server";
import { messageCountsToday, DAILY_MESSAGE_BUDGET } from "@/lib/botMessageBudget";

/** Реальная картина отправок за сегодня — пункт 6 из чата, чтобы не гадать */
export async function GET() {
  const counts = await messageCountsToday();
  return NextResponse.json({ budget: DAILY_MESSAGE_BUDGET, users: counts });
}
