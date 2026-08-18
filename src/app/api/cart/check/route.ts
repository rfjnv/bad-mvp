import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .default([]),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const slugs = parsed.data.items.map((i) => i.slug);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      price: true,
      oldPrice: true,
      stock: true,
      imageUrl: true,
      isActive: true,
      category: { select: { slug: true, name: true } },
    },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // Позиции, которых больше нет в каталоге, не превращаются в строку с нулевой
  // ценой — они просто не попадают в ответ, а клиент вычищает их из localStorage.
  const lines = parsed.data.items.flatMap((item) => {
    const product = bySlug.get(item.slug);
    if (!product || !product.isActive) return [];
    const clamped = Math.min(item.quantity, product.stock);
    return [
      {
        slug: item.slug,
        product,
        quantity: clamped,
        adjusted: clamped !== item.quantity,
      },
    ];
  });

  const knownSlugs = lines.map((l) => l.slug);
  const removedSlugs = slugs.filter((s) => !knownSlugs.includes(s));
  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return NextResponse.json({ lines, total, knownSlugs, removedSlugs });
}
