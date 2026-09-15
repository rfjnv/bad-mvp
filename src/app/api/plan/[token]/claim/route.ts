import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, Unauthorized } from "@/lib/currentUser";
import { addOrderItemsToRoutine } from "@/lib/orderToRoutine";

/**
 * «Отслеживать приём»: получатель входит через Telegram и забирает план
 * в свой «Мой приём». Работает один раз — кто первый вошёл и нажал,
 * тот и получатель (владелец может отозвать и переслать заново, если
 * ссылка ушла не туда — см. /api/plan/[token]/revoke).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const user = await requireUser();

    const plan = await prisma.plan.findUnique({ where: { token } });
    if (!plan) return NextResponse.json({ error: "План не найден" }, { status: 404 });
    if (plan.ownerId === user.id) {
      return NextResponse.json({ error: "Это ваш собственный план" }, { status: 400 });
    }
    if (plan.claimedAt) {
      return NextResponse.json({ error: "План уже принят" }, { status: 409 });
    }

    // Атомарно: если кто-то забрал план долями секунды раньше, claimedAt уже
    // не null и обновление не применится — сообщаем, а не дублируем приём.
    const claimed = await prisma.plan.updateMany({
      where: { id: plan.id, claimedAt: null },
      data: { recipientUserId: user.id, claimedAt: new Date() },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ error: "План уже принят" }, { status: 409 });
    }

    await addOrderItemsToRoutine(user.id, plan.orderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Unauthorized) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    throw err;
  }
}
