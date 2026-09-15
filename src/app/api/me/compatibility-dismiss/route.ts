import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({ key: z.string().min(1).max(100) });

/**
 * «Понятно, не показывать» на предупреждении в «Моём приёме» —
 * запоминается по ключу конкретной пары/вещества (см. InteractionMatch.key),
 * не глобально: другая пара или тот же слот с другими товарами снова покажет.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  await prisma.compatibilityDismissal.upsert({
    where: { userId_key: { userId: user.id, key: parsed.data.key } },
    create: { userId: user.id, key: parsed.data.key },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
