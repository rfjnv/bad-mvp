import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bundleSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bundleSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ошибка валидации" }, { status: 400 });
  }

  const { productIds, ...data } = parsed.data;

  try {
    if (productIds) {
      await prisma.bundleItem.deleteMany({ where: { bundleId: id } });
    }
    const bundle = await prisma.bundle.update({
      where: { id },
      data: {
        ...data,
        ...(productIds
          ? { items: { create: productIds.map((productId) => ({ productId })) } }
          : {}),
      },
    });
    return NextResponse.json(bundle);
  } catch {
    return NextResponse.json({ error: "Набор не найден" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.bundle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Набор не найден" }, { status: 404 });
  }
}
