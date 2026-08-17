import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscriptionStatusSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = subscriptionStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }
  try {
    const request = await prisma.subscriptionRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(request);
  } catch {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }
}
