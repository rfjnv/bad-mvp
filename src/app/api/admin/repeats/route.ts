import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Ожидаемые повторы: позиции, у которых банка заканчивается в ближайшие N дней,
 * со статусом напоминания, плюс сводка конверсии за всё время.
 */
export async function GET(req: NextRequest) {
  const days = Math.min(120, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30));
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + days);

  const [items, reminders] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        expectedFinishAt: { not: null, lte: until },
        order: { status: { not: "CANCELLED" } },
      },
      include: {
        product: { select: { name: true, slug: true } },
        reminder: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            deliveredAt: true,
            user: { select: { firstName: true, username: true, remindersEnabled: true } },
          },
        },
      },
      orderBy: { expectedFinishAt: "asc" },
    }),
    prisma.reminder.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = Object.fromEntries(reminders.map((r) => [r.status, r._count._all])) as Record<string, number>;
  const sent = (counts.SENT ?? 0) + (counts.REPEATED ?? 0);
  const repeated = counts.REPEATED ?? 0;

  return NextResponse.json({
    days,
    rows: items.map((i) => ({
      orderItemId: i.id,
      orderId: i.order.id,
      orderNumber: i.order.orderNumber,
      customer: i.order.user
        ? `${i.order.user.firstName}${i.order.user.username ? ` @${i.order.user.username}` : ""}`
        : i.order.customerName,
      phone: i.order.customerPhone,
      channel: i.order.user ? (i.order.user.remindersEnabled ? "telegram" : "off") : "none",
      product: i.product.name,
      productSlug: i.product.slug,
      quantity: i.quantity,
      expectedFinishAt: i.expectedFinishAt,
      overdue: i.expectedFinishAt! < now,
      reminder: i.reminder
        ? { status: i.reminder.status, dueAt: i.reminder.dueAt, sentAt: i.reminder.sentAt }
        : null,
    })),
    summary: {
      pending: counts.PENDING ?? 0,
      sent,
      repeated,
      noChannel: counts.NO_CHANNEL ?? 0,
      conversion: sent > 0 ? Math.round((repeated / sent) * 100) : null,
    },
  });
}
