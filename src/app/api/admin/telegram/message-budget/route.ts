import { NextResponse } from "next/server";
import { messageCountsToday, BANK_REMINDER_DAILY_LIMIT, INTAKE_REMINDER_DAILY_LIMIT } from "@/lib/botMessageBudget";

/** Реальная картина отправок за сегодня — пункт 6 из чата, чтобы не гадать */
export async function GET() {
  const counts = await messageCountsToday();
  return NextResponse.json({
    limits: {
      ORDER_STATUS: null, // вне лимита
      DELIVERY_PROMPT: null, // вне лимита
      BANK_REMINDER: BANK_REMINDER_DAILY_LIMIT,
      INTAKE_REMINDER: INTAKE_REMINDER_DAILY_LIMIT,
    },
    users: counts,
  });
}
