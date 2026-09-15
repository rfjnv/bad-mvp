import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { computeDuration, type UnitType } from "@/lib/duration";
import {
  computeStreaks,
  computeCalendar,
  computeMarkedStats,
  computeRemaining,
  type IntakeMark,
} from "@/lib/routineStats";
import { findInteractions, findSlotConflicts, type CompatibilityItem } from "@/lib/compatibility";

const CALENDAR_DAYS = 30;

const routineSelect = {
  id: true,
  dailyDose: true,
  sortOrder: true,
  timeSlot: true,
  pausedAt: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      imageUrl: true,
      dosage: true,
      unitsPerPack: true,
      unitType: true,
      dailyDose: true,
      price: true,
      composition: true,
      activeSubstance: true,
      activeAmount: true,
      activeUnit: true,
      contraindications: true,
      category: { select: { slug: true } },
    },
  },
} as const;

type RoutineRow = {
  id: string;
  dailyDose: number | null;
  sortOrder: number;
  timeSlot: "MORNING" | "AFTERNOON" | "EVENING" | null;
  pausedAt: Date | null;
  createdAt: Date;
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    imageUrl: string;
    dosage: string;
    unitsPerPack: number | null;
    unitType: UnitType | null;
    dailyDose: number | null;
    price: number;
    composition: string;
    activeSubstance: string | null;
    activeAmount: number | null;
    activeUnit: string | null;
    contraindications: string | null;
    category: { slug: string };
  };
};

/** Список приёма текущего пользователя со статистикой и предупреждениями (Задача B) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });

  const items = (await prisma.routineItem.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
    select: routineSelect,
  })) as RoutineRow[];

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 400); // с запасом на «лучшую серию» за всё время
  const logs = await prisma.intakeLog.findMany({
    where: { userId: user.id, date: { gte: from.toISOString().slice(0, 10) } },
    select: { productId: true, date: true, status: true },
  });
  const marksByProduct = new Map<string, IntakeMark[]>();
  for (const l of logs) {
    const arr = marksByProduct.get(l.productId) ?? [];
    arr.push({ date: l.date, status: l.status });
    marksByProduct.set(l.productId, arr);
  }

  const dismissals = await prisma.compatibilityDismissal.findMany({
    where: { userId: user.id },
    select: { key: true },
  });
  const dismissedKeys = new Set(dismissals.map((d) => d.key));

  const serialized = items.map((r) => {
    const marks = marksByProduct.get(r.product.id) ?? [];
    const d = computeDuration(r.product);
    const streaks = computeStreaks(marks, r.createdAt, r.pausedAt, now);
    const calendar = computeCalendar(marks, r.createdAt, r.pausedAt, now, CALENDAR_DAYS);
    const stats7 = computeMarkedStats(marks, r.createdAt, r.pausedAt, now, 7);
    const stats30 = computeMarkedStats(marks, r.createdAt, r.pausedAt, now, 30);
    const remaining = computeRemaining(
      { createdAt: r.createdAt, pausedAt: r.pausedAt, product: r.product },
      marks,
      now
    );

    return {
      id: r.id,
      slug: r.product.slug,
      name: r.product.name,
      brand: r.product.brand,
      imageUrl: r.product.imageUrl,
      dosage: r.product.dosage,
      dailyDose: r.dailyDose ?? r.product.dailyDose,
      unitType: r.product.unitType,
      durationDays: d?.days ?? null,
      timeSlot: r.timeSlot,
      paused: r.pausedAt !== null,
      streaks,
      calendar,
      markedStats7: stats7,
      markedStats30: stats30,
      remaining,
    };
  });

  // Общая серия — по всему приёму сразу: день считается, если в этот день
  // отмечен хотя бы один товар TAKEN (это про факт, что человек вообще
  // взаимодействовал с приёмом в этот день, а не про то, что выполнил
  // каждую позицию — иначе добавление нового товара обнуляло бы серию).
  let overall: ReturnType<typeof computeStreaks> | null = null;
  let overallStats7: ReturnType<typeof computeMarkedStats> | null = null;
  let overallStats30: ReturnType<typeof computeMarkedStats> | null = null;
  if (items.length > 0) {
    const overallMarksByDate = new Map<string, "TAKEN" | "SKIPPED">();
    for (const [, marks] of marksByProduct) {
      for (const m of marks) {
        if (m.status === "TAKEN") overallMarksByDate.set(m.date, "TAKEN");
        else if (!overallMarksByDate.has(m.date)) overallMarksByDate.set(m.date, "SKIPPED");
      }
    }
    const overallMarks: IntakeMark[] = [...overallMarksByDate.entries()].map(([date, status]) => ({ date, status }));
    const earliestStart = items.reduce((min, r) => (r.createdAt < min ? r.createdAt : min), items[0].createdAt);
    overall = computeStreaks(overallMarks, earliestStart, null, now);
    overallStats7 = computeMarkedStats(overallMarks, earliestStart, null, now, 7);
    overallStats30 = computeMarkedStats(overallMarks, earliestStart, null, now, 30);
  }

  // Дублирование вещества — по всему приёму, вне зависимости от слота
  const compatItems: CompatibilityItem[] = items.map((r) => ({
    categorySlug: r.product.category.slug,
    composition: r.product.composition,
    activeSubstance: r.product.activeSubstance,
    activeAmount: r.product.activeAmount,
    activeUnit: r.product.activeUnit,
  }));
  const generalWarnings = findInteractions(compatItems).filter((m) => m.key.startsWith("dup|"));

  // Конфликты по слоту — только внутри одного слота, только у не-паузных позиций
  const slotWarnings: { slot: string; key: string; type: string; message: string }[] = [];
  for (const slot of ["MORNING", "AFTERNOON", "EVENING"] as const) {
    const slotItems = items.filter((r) => r.timeSlot === slot && !r.pausedAt);
    if (slotItems.length < 2) continue;
    const slotCompatItems: CompatibilityItem[] = slotItems.map((r) => ({
      categorySlug: r.product.category.slug,
      composition: r.product.composition,
      activeSubstance: r.product.activeSubstance,
      activeAmount: r.product.activeAmount,
      activeUnit: r.product.activeUnit,
    }));
    for (const m of findSlotConflicts(slotCompatItems)) {
      slotWarnings.push({ slot, key: m.key, type: m.type, message: m.message });
    }
  }

  const warnings = [
    ...generalWarnings.map((m) => ({ scope: "general", slot: null, key: m.key, type: m.type, message: m.message })),
    ...slotWarnings.map((w) => ({ scope: "slot", slot: w.slot, key: w.key, type: w.type, message: w.message })),
  ].filter((w) => !dismissedKeys.has(w.key));

  return NextResponse.json({
    items: serialized,
    warnings,
    overall: overall ? { streaks: overall, markedStats7: overallStats7, markedStats30: overallStats30 } : null,
  });
}

const addSchema = z.object({ slug: z.string().min(1), dailyDose: z.number().positive().optional() });

/** Добавить товар в список приёма; повторное добавление — не ошибка */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (!product) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });

  const count = await prisma.routineItem.count({ where: { userId: user.id } });
  await prisma.routineItem.upsert({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    create: {
      userId: user.id,
      productId: product.id,
      dailyDose: parsed.data.dailyDose ?? null,
      sortOrder: count,
    },
    update: parsed.data.dailyDose ? { dailyDose: parsed.data.dailyDose } : {},
  });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  slug: z.string().min(1),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]).nullable().optional(),
  paused: z.boolean().optional(),
});

/** Назначить слот времени и/или поставить на паузу / снять с паузы */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });

  const data: { timeSlot?: "MORNING" | "AFTERNOON" | "EVENING" | null; pausedAt?: Date | null } = {};
  if (parsed.data.timeSlot !== undefined) data.timeSlot = parsed.data.timeSlot;
  if (parsed.data.paused !== undefined) data.pausedAt = parsed.data.paused ? new Date() : null;

  await prisma.routineItem.update({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    data,
  });
  return NextResponse.json({ ok: true });
}

const removeSchema = z.object({ slug: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const parsed = removeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  await prisma.routineItem.deleteMany({
    where: { userId: user.id, product: { slug: parsed.data.slug } },
  });
  return NextResponse.json({ ok: true });
}
