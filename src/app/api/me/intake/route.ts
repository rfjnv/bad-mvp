import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Отметки за диапазон дат — для сегодняшнего списка и серий */
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
    select: { date: true, product: { select: { slug: true } } },
  });
  const byDate: Record<string, string[]> = {};
  for (const l of logs) (byDate[l.date] ??= []).push(l.product.slug);
  return NextResponse.json({ byDate });
}

const toggleSchema = z.object({ slug: z.string().min(1), date: z.string().regex(DATE) });

/** Переключить «принято» за день */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = toggleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });

  const key = {
    userId_productId_date: { userId: user.id, productId: product.id, date: parsed.data.date },
  };
  const existing = await prisma.intakeLog.findUnique({ where: key });
  if (existing) {
    await prisma.intakeLog.delete({ where: key });
    return NextResponse.json({ taken: false });
  }
  await prisma.intakeLog.create({
    data: { userId: user.id, productId: product.id, date: parsed.data.date },
  });
  return NextResponse.json({ taken: true });
}
