import { NextRequest, NextResponse } from "next/server";
import { runReminders } from "@/lib/reminders";
import { sendPendingDeliveryPrompts, sendDeliveryPromptFollowUps } from "@/lib/deliveryPrompts";
import { sendSlotReminders } from "@/lib/routineSlotReminders";
import { flushPendingOrderStatusNotifications } from "@/lib/orderStatusNotify";

/**
 * Ежедневный запуск напоминаний. На бесплатном Render планировщика нет,
 * поэтому эндпоинт дёргает внешний cron (cron-job.org, GitHub Actions)
 * с секретом в заголовке. Повторные вызовы безопасны: идемпотентность
 * обеспечивает база, а не расписание.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  return bearer === secret || req.nextUrl.searchParams.get("key") === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  const result = await runReminders(siteUrl);
  const deliveryPrompts = await sendPendingDeliveryPrompts();
  const deliveryPromptFollowUps = await sendDeliveryPromptFollowUps();
  const slotReminders = await sendSlotReminders();
  const orderStatusFlush = await flushPendingOrderStatusNotifications();
  return NextResponse.json({ ...result, deliveryPrompts, deliveryPromptFollowUps, slotReminders, orderStatusFlush });
}

export const POST = handle;
export const GET = handle;
