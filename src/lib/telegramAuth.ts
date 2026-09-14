import { createHash, createHmac, timingSafeEqual } from "crypto";
import { getTelegramConfig } from "./telegram";

/**
 * Проверка данных Telegram Login Widget.
 *
 * Схема из документации Telegram: все поля, кроме hash, сортируются по имени,
 * склеиваются как «key=value» через \n, и HMAC-SHA256 этой строки с ключом
 * SHA256(bot_token) должен совпасть с hash. Данным виджета без этой проверки
 * доверять нельзя — их подделает любой, кто откроет DevTools.
 */

export interface TelegramWidgetPayload {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
}

const MAX_AGE_SECONDS = 24 * 60 * 60;

export function verifyTelegramLogin(payload: Record<string, unknown>): TelegramWidgetPayload | null {
  const { botToken } = getTelegramConfig();
  if (!botToken) return null;

  const { hash, ...rest } = payload;
  if (typeof hash !== "string" || !hash) return null;

  const dataCheckString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null && rest[k] !== "")
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(rest.auth_date);
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  if (!rest.id || typeof rest.first_name !== "string") return null;
  return rest as unknown as TelegramWidgetPayload;
}
