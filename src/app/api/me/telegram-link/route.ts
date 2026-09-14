import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, Unauthorized } from "@/lib/currentUser";
import { getTelegramConfig } from "@/lib/telegram";

const TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Выдаёт одноразовую deep-link ссылку t.me/<bot>?start=<token> для
 * подключения канала напоминаний — отдельно от входа в аккаунт (Login
 * Widget). Токен привязан к userId уже вошедшего пользователя, не к
 * браузеру: работает одинаково с телефона и с десктопа.
 */
export async function POST() {
  try {
    const user = await requireUser();
    const { canLink, botUsername } = getTelegramConfig();
    if (!canLink) {
      return NextResponse.json({ error: "Бот не настроен" }, { status: 503 });
    }

    const token = randomBytes(24).toString("base64url");
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingLinkToken: token, pendingLinkTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });

    return NextResponse.json({ link: `https://t.me/${botUsername}?start=${token}` });
  } catch (err) {
    if (err instanceof Unauthorized) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    throw err;
  }
}
