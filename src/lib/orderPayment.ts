import { prisma } from "@/lib/prisma";
import { notifyShop, buildPaymentNotification } from "@/lib/telegram";

/**
 * Единая точка смены статуса оплаты.
 *
 * Провайдеры присылают вебхуки повторно (Payme и Click делают это штатно),
 * поэтому уведомление магазину уходит только при реальном переходе
 * в PAID — уже оплаченный заказ второй раз не объявляем.
 */
export async function applyPaymentResult(orderId: string, status: "PAID" | "FAILED") {
  const before = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true },
  });
  if (!before) return null;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: status },
  });

  if (status === "PAID" && before.paymentStatus !== "PAID") {
    void notifyShop(buildPaymentNotification(order.orderNumber, order.totalAmount, order.paymentMethod));
  }

  return order;
}
