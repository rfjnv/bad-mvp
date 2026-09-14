import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { applyPaymentResult } from "@/lib/orderPayment";
import { getPaymentProvider } from "@/lib/payments";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const bodySchema = z.object({
  orderId: z.string().min(1),
  provider: z.enum(["PAYME", "CLICK"]),
});

/**
 * Подтверждение демо-оплаты — не платёж, деньги не двигаются.
 * Защита та же, что и на самой странице (не полагаемся на то, что
 * до этого роута дошли только через неё): DEMO_PAYMENTS_ENABLED=1
 * и действующая админская сессия, оба обязательны.
 */
export async function POST(req: NextRequest) {
  if (process.env.DEMO_PAYMENTS_ENABLED !== "1") {
    return NextResponse.json({ error: "Демо-оплата отключена" }, { status: 404 });
  }
  const store = await cookies();
  const adminId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!adminId) {
    return NextResponse.json({ error: "Требуется вход в админку" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const provider = getPaymentProvider(parsed.data.provider);
  if (!provider.sandbox) {
    return NextResponse.json({ error: "Демо-оплата отключена: у провайдера уже есть боевые ключи" }, { status: 403 });
  }

  const order = await applyPaymentResult(parsed.data.orderId, "DEMO_PAID");
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
