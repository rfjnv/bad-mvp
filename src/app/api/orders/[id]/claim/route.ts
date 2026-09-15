import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, Unauthorized } from "@/lib/currentUser";

/**
 * Гость впервые вошёл на странице своего заказа (успех оформления или
 * статус по ссылке) — привязываем заказ и любые его подарочные Plan
 * к аккаунту, если они ещё ничьи. Ничего не перезаписывает: если заказ
 * уже принадлежит кому-то (в том числе другому пользователю), не трогаем.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await requireUser();

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

    if (!order.userId) {
      await prisma.order.update({ where: { id }, data: { userId: user.id } });
    }
    await prisma.plan.updateMany({
      where: { orderId: id, ownerId: null },
      data: { ownerId: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Unauthorized) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    throw err;
  }
}
