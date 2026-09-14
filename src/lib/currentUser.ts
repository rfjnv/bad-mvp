import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { USER_COOKIE, verifyUserToken } from "./session";

/** Текущий покупатель по cookie или null. Для серверных компонентов и роутов. */
export async function getCurrentUser() {
  const store = await cookies();
  const userId = await verifyUserToken(store.get(USER_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Unauthorized();
  return user;
}

export class Unauthorized extends Error {}
