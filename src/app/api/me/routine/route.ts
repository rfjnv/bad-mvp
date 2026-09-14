import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { computeDuration, type UnitType } from "@/lib/duration";

const routineSelect = {
  id: true,
  dailyDose: true,
  sortOrder: true,
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
    },
  },
} as const;

interface RoutineRow {
  id: string;
  dailyDose: number | null;
  sortOrder: number;
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
  };
}

function serialize(items: RoutineRow[]) {
  return items.map((r) => {
    const d = computeDuration(r.product);
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
    };
  });
}

/** Список приёма текущего пользователя */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const items = await prisma.routineItem.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
    select: routineSelect,
  });
  return NextResponse.json({ items: serialize(items) });
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
