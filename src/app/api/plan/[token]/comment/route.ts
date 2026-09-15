import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, Unauthorized } from "@/lib/currentUser";

const schema = z.object({ comment: z.string().trim().max(500) });

/** Только владелец может редактировать личный комментарий к плану */
export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Слишком длинный комментарий" }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { token } });
    if (!plan) return NextResponse.json({ error: "План не найден" }, { status: 404 });
    if (plan.ownerId !== user.id) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

    await prisma.plan.update({
      where: { id: plan.id },
      data: { comment: parsed.data.comment || null },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Unauthorized) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    throw err;
  }
}
