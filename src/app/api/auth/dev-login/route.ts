import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserToken, USER_COOKIE, USER_MAX_AGE_SECONDS } from "@/lib/session";

/**
 * Вход без Telegram — только для локальной разработки.
 * Login Widget привязан к домену через BotFather и на localhost не работает,
 * поэтому здесь создаётся тестовый пользователь. В production роут отвечает 404.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.TELEGRAM_LOGIN_DEV_BYPASS !== "1") {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  const json = await req.json().catch(() => ({}));
  const telegramId = String(json.telegramId ?? "100000001");
  const user = await prisma.user.upsert({
    where: { telegramId },
    create: { telegramId, firstName: json.firstName ?? "Тестовый", username: "dev_user" },
    update: { lastLoginAt: new Date() },
  });
  const res = NextResponse.json({ ok: true, user: { id: user.id, firstName: user.firstName } });
  res.cookies.set(USER_COOKIE, await createUserToken(user.id), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: USER_MAX_AGE_SECONDS,
  });
  return res;
}
