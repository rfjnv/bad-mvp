import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { tashkentDateKey } from "@/lib/reminders";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Задним числом — да, но не произвольный дневник: 3 дня назад, не больше */
const RETROACTIVE_DAYS_LIMIT = 3;

/** Отметки за диапазон дат — для сегодняшнего списка, серий и календаря */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";
  if (!DATE.test(from) || !DATE.test(to)) {
    return NextResponse.json({ error: "Нужны from и to в формате YYYY-MM-DD" }, { status: 400 });
  }

  const logs = await prisma.intakeLog.findMany({
    where: { userId: user.id, date: { gte: from, lte: to } },
    select: { date: true, status: true, product: { select: { slug: true } } },
  });
  const byDate: Record<string, string[]> = {};
  for (const l of logs) if (l.status === "TAKEN") (byDate[l.date] ??= []).push(l.product.slug);
  return NextResponse.json({ byDate });
}

const postSchema = z.object({
  slug: z.string().min(1),
  date: z.string().regex(DATE),
  /** null — снять отметку; иначе — поставить TAKEN/SKIPPED */
  status: z.enum(["TAKEN", "SKIPPED"]).nullable().optional(),
});

/** Отметить/снять отметку за день — TAKEN, SKIPPED или очистить (status: null) */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  const today = tashkentDateKey(new Date());
  if (parsed.data.date > today) {
    return NextResponse.json({ error: "Нельзя отметить будущий день" }, { status: 400 });
  }
  const limit = new Date();
  limit.setDate(limit.getDate() - RETROACTIVE_DAYS_LIMIT);
  if (parsed.data.date < tashkentDateKey(limit)) {
    return NextResponse.json({ error: `Можно отметить не больше чем на ${RETROACTIVE_DAYS_LIMIT} дня назад` }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });

  const key = {
    userId_productId_date: { userId: user.id, productId: product.id, date: parsed.data.date },
  };

  // status не передан вовсе — прежнее поведение toggle (для обратной совместимости
  // клиента, который просто переключает «принято» на сегодня)
  const status = parsed.data.status === undefined ? "TAKEN" : parsed.data.status;

  if (status === null) {
    await prisma.intakeLog.deleteMany({ where: key.userId_productId_date });
    return NextResponse.json({ status: null });
  }

  const existing = await prisma.intakeLog.findUnique({ where: key });
  if (existing && existing.status === status && parsed.data.status === undefined) {
    // toggle: тот же статус второй раз — снимаем отметку
    await prisma.intakeLog.delete({ where: key });
    return NextResponse.json({ status: null });
  }

  await prisma.intakeLog.upsert({
    where: key,
    create: { userId: user.id, productId: product.id, date: parsed.data.date, status },
    update: { status },
  });
  return NextResponse.json({ status });
}
