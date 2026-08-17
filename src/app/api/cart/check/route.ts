import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
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

  const ids = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
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
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = parsed.data.items.map((item) => {
    const product = byId.get(item.productId);
    if (!product || !product.isActive) {
      return { productId: item.productId, product: null, quantity: 0, adjusted: true };
    }
    const clamped = Math.min(item.quantity, product.stock);
    return {
      productId: item.productId,
      product,
      quantity: clamped,
      adjusted: clamped !== item.quantity,
    };
  });

  const total = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0);

  return NextResponse.json({ lines, total });
}
