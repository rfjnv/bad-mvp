import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/validation";

export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bannerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ошибка валидации" }, { status: 400 });
  }
  const banner = await prisma.banner.create({ data: parsed.data });
  return NextResponse.json(banner, { status: 201 });
}
