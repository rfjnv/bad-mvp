/**
 * Подписанные cookie-сессии на Web Crypto (работают и в Edge middleware).
 * Общие примитивы используются двумя сессиями: админской (adminId)
 * и покупательской (userId, после входа через Telegram).
 */

export const SESSION_COOKIE = "admin_session";
export const USER_COOKIE = "user_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней
const USER_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 дней — покупатель заходит редко
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
export const USER_MAX_AGE_SECONDS = USER_TTL_MS / 1000;

function toBase64Url(bytes: ArrayBuffer): string {
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Buffer {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET не задан");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(data: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(sig);
}

/** Подписывает произвольный payload; `kind` не даёт подменить админскую cookie покупательской */
async function createToken(kind: string, subject: string, ttlMs: number): Promise<string> {
  const payload = { kind, sub: subject, exp: Date.now() + ttlMs };
  const data = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)).buffer as ArrayBuffer);
  const sig = await sign(data);
  return `${data}.${sig}`;
}

async function verifyToken(kind: string, token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expectedSig = await sign(data);
  if (expectedSig !== sig) return null;
  try {
    const payload = JSON.parse(fromBase64Url(data).toString()) as { kind?: string; sub?: string; exp?: number };
    if (payload.kind !== kind || !payload.sub || !payload.exp || payload.exp < Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function createSessionToken(adminId: string): Promise<string> {
  return createToken("admin", adminId, SESSION_TTL_MS);
}

export function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  return verifyToken("admin", token);
}

export function createUserToken(userId: string): Promise<string> {
  return createToken("user", userId, USER_TTL_MS);
}

export function verifyUserToken(token: string | undefined | null): Promise<string | null> {
  return verifyToken("user", token);
}
