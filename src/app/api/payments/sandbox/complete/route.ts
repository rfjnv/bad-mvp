import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";

const bodySchema = z.object({
  orderId: z.string().min(1),
  provider: z.enum(["PAYME", "CLICK"]),
});

/** Только для режима песочницы: провайдер настоящих ключей не проверяет этот роут. */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const provider = getPaymentProvider(parsed.data.provider);
  if (!provider.sandbox) {
    return NextResponse.json({ error: "Песочница отключена для этого провайдера" }, { status: 403 });
  }

  const order = await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { paymentStatus: "PAID" },
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
