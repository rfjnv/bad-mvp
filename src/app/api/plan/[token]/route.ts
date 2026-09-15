import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE, verifyUserToken } from "@/lib/session";
import { computeDuration } from "@/lib/duration";

/**
 * Публичные данные плана — без входа, для чтения. Отдаёт состав и дозировки
 * заказа, комментарий отправителя и признак «уже принято» (без деталей
 * приёма получателя — их здесь и не может быть, Plan их не хранит).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const plan = await prisma.plan.findUnique({
    where: { token },
    include: {
      order: { include: { items: { include: { product: true } } } },
    },
  });
  if (!plan) return NextResponse.json({ error: "План не найден" }, { status: 404 });

  const store = await cookies();
  const viewerId = await verifyUserToken(store.get(USER_COOKIE)?.value);
  const isOwner = viewerId != null && viewerId === plan.ownerId;

  return NextResponse.json({
    items: plan.order.items.map((i) => ({
      name: i.product.name,
      brand: i.product.brand,
      imageUrl: i.product.imageUrl,
      dosage: i.product.dosage,
      durationDays: computeDuration(i.product)?.days ?? null,
    })),
    comment: plan.comment,
    claimed: plan.claimedAt !== null,
    isOwner,
    canClaim: plan.claimedAt === null && !isOwner,
  });
}
