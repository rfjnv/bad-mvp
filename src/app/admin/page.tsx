import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

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

export default async function AdminDashboardPage() {
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
  const topProductsRaw = topIds.length
    ? await prisma.product.findMany({ where: { id: { in: topIds } } })
    : [];
  const topProducts = topIds
    .map((id) => {
      const product = topProductsRaw.find((p) => p.id === id);
      return product ? { product, sold: salesByProduct.get(id) ?? 0 } : null;
    })
    .filter((x): x is { product: (typeof topProductsRaw)[number]; sold: number } => x !== null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t.admin.dashboard}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label={t.admin.ordersToday} value={String(ordersToday)} />
        <StatCard label={t.admin.ordersWeek} value={String(ordersWeek)} />
        <StatCard label={t.admin.ordersMonth} value={String(ordersMonth)} />
        <StatCard label={t.admin.revenue} value={formatSum(revenue)} />
        <StatCard label={t.admin.avgCheck} value={formatSum(avgCheck)} />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">{t.admin.topProducts}</h2>
        {topProducts.length === 0 ? (
          <p className="text-text-dim text-sm">Пока нет данных о продажах.</p>
        ) : (
          <div className="bg-bg-panel border border-border rounded-xl divide-y divide-border">
            {topProducts.map(({ product, sold }) => (
              <div key={product.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-text-dim">{product.brand}</div>
                </div>
                <div className="text-sm font-semibold">{sold} шт.</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-panel border border-border rounded-xl p-4">
      <div className="text-xs text-text-dim mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
