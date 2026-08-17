import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscriptionRequestSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/format";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = subscriptionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Проверьте правильность заполнения формы" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(parsed.data.customerPhone);
  if (!phone) {
    return NextResponse.json({ error: "Неверный формат телефона" }, { status: 400 });
  }

  const request = await prisma.subscriptionRequest.create({
    data: {
      plan: parsed.data.plan,
      customerName: parsed.data.customerName,
      customerPhone: phone,
      age: parsed.data.age ?? null,
      goals: parsed.data.goals.join(", "),
      healthNotes: parsed.data.healthNotes || null,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json({ id: request.id }, { status: 201 });
}
