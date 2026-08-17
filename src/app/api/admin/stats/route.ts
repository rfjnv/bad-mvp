import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

export async function GET() {
  const today = startOfDay(new Date());
  const week = daysAgo(7);
  const month = daysAgo(30);

  const [ordersToday, ordersWeek, ordersMonth, monthOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: week } } }),
    prisma.order.count({ where: { createdAt: { gte: month } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: month }, status: { not: "CANCELLED" } },
      include: { items: true },
    }),
  ]);

  const revenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgCheck = monthOrders.length > 0 ? Math.round(revenue / monthOrders.length) : 0;

  const salesByProduct = new Map<string, number>();
  for (const order of monthOrders) {
    for (const item of order.items) {
      salesByProduct.set(item.productId, (salesByProduct.get(item.productId) ?? 0) + item.quantity);
    }
  }
  const topIds = [...salesByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const topProductsRaw = await prisma.product.findMany({ where: { id: { in: topIds } } });
  const topProducts = topIds
    .map((id) => {
      const product = topProductsRaw.find((p) => p.id === id);
      return product ? { product, sold: salesByProduct.get(id) ?? 0 } : null;
    })
    .filter((x): x is { product: (typeof topProductsRaw)[number]; sold: number } => x !== null);

  return NextResponse.json({
    ordersToday,
    ordersWeek,
    ordersMonth,
    revenue,
    avgCheck,
    topProducts,
  });
}
