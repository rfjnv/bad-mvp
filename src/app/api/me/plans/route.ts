import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

/**
 * Отправленные планы. Отдаёт только факт «принят / не принят» — никаких
 * данных о приёме получателя (RoutineItem/IntakeLog) здесь нет и не может
 * быть: этот запрос их не запрашивает вообще, не фильтрует задним числом.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });

  const plans = await prisma.plan.findMany({
    where: { ownerId: user.id },
    include: { order: { include: { items: { include: { product: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    plans: plans.map((p) => ({
      token: p.token,
      orderNumber: p.order.orderNumber,
      items: p.order.items.map((i) => i.product.name),
      claimed: p.claimedAt !== null,
      claimedAt: p.claimedAt,
      createdAt: p.createdAt,
    })),
  });
}
