import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validation";
import { computeDuration, expectedFinishDate } from "@/lib/duration";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true, reminder: true } } },
  });
  if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }
  const status = parsed.data.status;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });
      if (!current) throw new NotFound();

      // Дата доставки ставится один раз — при первом переходе в DELIVERED.
      // От неё пересчитываем, когда закончится каждая позиция: при заказе
      // мы считали от даты оформления, а курьер мог приехать позже.
      const becomesDelivered = status === "DELIVERED" && !current.deliveredAt;
      const deliveredAt = becomesDelivered ? new Date() : current.deliveredAt;

      if (becomesDelivered) {
        for (const item of current.items) {
          const d = computeDuration(item.product);
          await tx.orderItem.update({
            where: { id: item.id },
            data: { expectedFinishAt: d ? expectedFinishDate(deliveredAt!, d.days, item.quantity) : null },
          });
        }
      }

      return tx.order.update({ where: { id }, data: { status, deliveredAt } });
    });
    return NextResponse.json(order);
  } catch (e) {
    if (e instanceof NotFound) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Не удалось обновить заказ" }, { status: 500 });
  }
}

class NotFound extends Error {}
