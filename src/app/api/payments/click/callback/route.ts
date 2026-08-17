import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const payload = form
    ? Object.fromEntries(form.entries())
    : await req.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: -1, error_note: "Bad request" }, { status: 400 });
  }

  const provider = getPaymentProvider("CLICK");
  const verified = await provider.verifyCallback(payload, null);
  if (!verified.valid) {
    return NextResponse.json({ error: -1, error_note: verified.reason ?? "Invalid signature" }, { status: 401 });
  }

  const result = await provider.handleWebhook(payload);
  if (!result) {
    return NextResponse.json({ error: -5, error_note: "Order not found" }, { status: 404 });
  }

  await prisma.order.update({
    where: { id: result.orderId },
    data: { paymentStatus: result.status },
  });

  return NextResponse.json({ error: 0, error_note: "Success" });
}
