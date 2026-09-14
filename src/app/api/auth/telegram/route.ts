import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramLogin } from "@/lib/telegramAuth";
import { createUserToken, USER_COOKIE, USER_MAX_AGE_SECONDS } from "@/lib/session";

/** Вход через Telegram Login Widget: подпись проверяется здесь, а не в браузере */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const data = verifyTelegramLogin(json as Record<string, unknown>);
  if (!data) {
    return NextResponse.json({ error: "Подпись Telegram не подтверждена" }, { status: 401 });
  }

  const telegramId = String(data.id);
  const user = await prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      firstName: data.first_name,
      username: data.username ?? null,
      photoUrl: data.photo_url ?? null,
    },
    update: {
      firstName: data.first_name,
      username: data.username ?? null,
      photoUrl: data.photo_url ?? null,
      lastLoginAt: new Date(),
    },
  });

  const res = NextResponse.json({ ok: true, user: { id: user.id, firstName: user.firstName } });
  res.cookies.set(USER_COOKIE, await createUserToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: USER_MAX_AGE_SECONDS,
  });
  return res;
}
