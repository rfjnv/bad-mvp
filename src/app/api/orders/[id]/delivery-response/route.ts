import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { addOrderItemsToRoutine } from "@/lib/orderToRoutine";

const schema = z.object({ action: z.enum(["self", "gift", "later"]) });

/**
 * Тот же вопрос «это вам или в подарок?», что и в боте (Задача A) —
 * второй вход в ту же механику для гостевых заказов, у которых нет
 * Telegram-канала: страница успешного оформления и статус заказа
 * по ссылке. orderId в URL уже действует как единственный секрет
 * (так же, как /checkout/success?orderId= сейчас показывает заказ
 * кому угодно, у кого есть ссылка) — отдельный токен не добавляем.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Заказ ещё не доставлен" }, { status: 400 });
  }

  const prompt = await prisma.deliveryPrompt.findUnique({ where: { orderId: id } });
  if (prompt?.status === "ANSWERED_SELF" || prompt?.status === "ANSWERED_GIFT") {
    return NextResponse.json({ error: "Уже отвечено" }, { status: 409 });
  }

  if (parsed.data.action === "self") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

    if (!order.userId) await prisma.order.update({ where: { id }, data: { userId: user.id } });
    const items = await addOrderItemsToRoutine(user.id, id);
    await prisma.deliveryPrompt.upsert({
      where: { orderId: id },
      create: { orderId: id, status: "ANSWERED_SELF", answeredAt: new Date() },
      update: { status: "ANSWERED_SELF", answeredAt: new Date() },
    });
    return NextResponse.json({ ok: true, items });
  }

  if (parsed.data.action === "gift") {
    const user = await getCurrentUser();
    const token = randomBytes(24).toString("base64url");
    const plan = await prisma.plan.create({
      data: { token, orderId: id, ownerId: user?.id ?? null },
    });
    await prisma.deliveryPrompt.upsert({
      where: { orderId: id },
      create: { orderId: id, status: "ANSWERED_GIFT", answeredAt: new Date() },
      update: { status: "ANSWERED_GIFT", answeredAt: new Date() },
    });
    return NextResponse.json({ ok: true, token: plan.token });
  }

  // later
  await prisma.deliveryPrompt.upsert({
    where: { orderId: id },
    create: { orderId: id, status: "SNOOZED", snoozedAt: new Date() },
    update: { status: "SNOOZED", snoozedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
