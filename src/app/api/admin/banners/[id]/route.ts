import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bannerSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ошибка валидации" }, { status: 400 });
  }
  try {
    const banner = await prisma.banner.update({ where: { id }, data: parsed.data });
    return NextResponse.json(banner);
  } catch {
    return NextResponse.json({ error: "Баннер не найден" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Баннер не найден" }, { status: 404 });
  }
}
