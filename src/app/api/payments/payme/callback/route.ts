import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }

  const provider = getPaymentProvider("PAYME");
  const signature = req.headers.get("authorization");
  const verified = await provider.verifyCallback(payload, signature);
  if (!verified.valid) {
    return NextResponse.json({ error: { code: -32504, message: "Unauthorized" } }, { status: 401 });
  }

  const result = await provider.handleWebhook(payload);
  if (!result) {
    return NextResponse.json({ error: { code: -31050, message: "Order not found" } }, { status: 404 });
  }

  await prisma.order.update({
    where: { id: result.orderId },
    data: { paymentStatus: result.status },
  });

  return NextResponse.json({ result: { state: result.status === "PAID" ? 2 : -2 } });
}
