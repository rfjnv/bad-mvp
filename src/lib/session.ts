export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

interface SessionPayload {
  adminId: string;
  exp: number;
}

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

export async function createSessionToken(adminId: string): Promise<string> {
  const payload: SessionPayload = { adminId, exp: Date.now() + SESSION_TTL_MS };
  const data = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)).buffer as ArrayBuffer);
  const sig = await sign(data);
  return `${data}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expectedSig = await sign(data);
  if (expectedSig !== sig) return null;

  try {
    const payload: SessionPayload = JSON.parse(fromBase64Url(data).toString());
    if (payload.exp < Date.now()) return null;
    return payload.adminId;
  } catch {
    return null;
  }
}
