import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import { PAYMENT_STATUS_LABELS } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) notFound();

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-green-bg flex items-center justify-center text-green text-2xl">
        ✓
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.success.title}</h1>
      <p className="text-text-dim">{t.success.thankYou}</p>

      <div className="w-full bg-bg-panel rounded-2xl p-5 mt-3 flex flex-col gap-2.5 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-text-dim">{t.success.orderNumber}</span>
          <span className="font-mono font-semibold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-dim">{t.cart.total}</span>
          <span className="font-semibold">{formatSum(order.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-dim">Оплата</span>
          <span className="font-semibold">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
        </div>
      </div>

      <Link href="/catalog" className="mt-4 px-5 py-2.5 rounded-full bg-accent text-white font-semibold hover:bg-accent-dark transition-colors">
        {t.success.backToCatalog}
      </Link>
    </div>
  );
}
