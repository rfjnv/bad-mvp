import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

/**
 * Перенос списка приёма и отметок из localStorage в аккаунт — один раз,
 * после подтверждения пользователем. Ничего не удаляет и не перезаписывает:
 * существующие записи остаются, новые добавляются.
 */
const schema = z.object({
  routine: z.array(z.string().min(1)).max(50),
  history: z
    .record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.array(z.string().min(1)).max(50))
    .default({}),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  const slugs = [...new Set([...parsed.data.routine, ...Object.values(parsed.data.history).flat()])];
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(products.map((p) => [p.slug, p.id]));

  let sortOrder = await prisma.routineItem.count({ where: { userId: user.id } });
  let routineCount = 0;
  for (const slug of parsed.data.routine) {
    const productId = idBySlug.get(slug);
    if (!productId) continue;
    await prisma.routineItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId, sortOrder: sortOrder++ },
      update: {},
    });
    routineCount++;
  }

  const logs: { userId: string; productId: string; date: string }[] = [];
  for (const [date, list] of Object.entries(parsed.data.history)) {
    for (const slug of list) {
      const productId = idBySlug.get(slug);
      if (productId) logs.push({ userId: user.id, productId, date });
    }
  }
  const created = logs.length
    ? await prisma.intakeLog.createMany({ data: logs, skipDuplicates: true })
    : { count: 0 };

  return NextResponse.json({ ok: true, routine: routineCount, history: created.count });
}
