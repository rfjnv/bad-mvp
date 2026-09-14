import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

/** История заказов пользователя с датами окончания и статусом напоминаний */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { slug: true, name: true } }, reminder: true } },
    },
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      repeatToken: o.repeatToken,
      items: o.items.map((i) => ({
        slug: i.product.slug,
        name: i.product.name,
        quantity: i.quantity,
        expectedFinishAt: i.expectedFinishAt,
        reminderStatus: i.reminder?.status ?? null,
      })),
    })),
  });
}
