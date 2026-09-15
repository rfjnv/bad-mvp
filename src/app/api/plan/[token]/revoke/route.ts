import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, Unauthorized } from "@/lib/currentUser";

/**
 * Отзыв: если ссылка ушла не в тот чат и её открыли раньше нужного
 * человека, забрать план обратно нельзя иначе — токен просто перестаёт
 * существовать (старый → 404, а не «уже принято»), выпускается новый.
 * Снимает и признак принятия: если план успели забрать не тому, кому
 * предназначалось, отзыв возвращает его в исходное состояние на стороне
 * отправителя. Уже добавленные получателю RoutineItem это не трогает —
 * это его данные, и без его участия их не убрать.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const user = await requireUser();
    const plan = await prisma.plan.findUnique({ where: { token } });
    if (!plan) return NextResponse.json({ error: "План не найден" }, { status: 404 });
    if (plan.ownerId !== user.id) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

    const newToken = randomBytes(24).toString("base64url");
    await prisma.plan.update({
      where: { id: plan.id },
      data: { token: newToken, recipientUserId: null, claimedAt: null },
    });

    return NextResponse.json({ ok: true, token: newToken });
  } catch (err) {
    if (err instanceof Unauthorized) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    throw err;
  }
}
