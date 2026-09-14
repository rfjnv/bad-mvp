import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import DemoPaymentClient from "./DemoPaymentClient";

/**
 * Демо-экран оплаты — только для показов, пока нет боевых ключей
 * Payme/Click (см. sandbox-детект в src/lib/payments/{payme,click}.ts).
 * Доступ — ТОЛЬКО на сервере, оба условия обязательны: DEMO_PAYMENTS_ENABLED=1
 * в окружении и действующая админская сессия. Всем остальным — 404,
 * без намёка на существование этого маршрута.
 */
export default async function ProcessPaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  if (process.env.DEMO_PAYMENTS_ENABLED !== "1") notFound();

  const store = await cookies();
  const adminId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!adminId) notFound();

  return <DemoPaymentClient orderId={orderId} />;
}
