import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bundleSchema } from "@/lib/validation";

export async function GET() {
  const bundles = await prisma.bundle.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(bundles);
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bundleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ошибка валидации" }, { status: 400 });
  }

  const exists = await prisma.bundle.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) {
    return NextResponse.json({ error: "Набор с таким slug уже существует" }, { status: 409 });
  }

  const { productIds, ...data } = parsed.data;
  const bundle = await prisma.bundle.create({
    data: {
      ...data,
      items: { create: productIds.map((productId) => ({ productId })) },
    },
  });
  return NextResponse.json(bundle, { status: 201 });
}
