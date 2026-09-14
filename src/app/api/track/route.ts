import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  type: z.enum([
    "page_view",
    "product_view",
    "add_to_cart",
    "checkout_start",
    "goal_select",
    "condition_select",
    "search",
    "bundle_add",
  ]),
  sessionId: z.string().min(8).max(64),
  path: z.string().max(300).nullable().optional(),
  key: z.string().max(200).nullable().optional(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
});

/**
 * Простейший лимит на сессию, чтобы один зациклившийся клиент или скрипт
 * не забил таблицу. В памяти процесса — этого хватает для одного инстанса.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 120;
const WINDOW_MS = 60_000;

function allowed(sessionId: string): boolean {
  const now = Date.now();
  const b = buckets.get(sessionId);
  if (!b || b.resetAt < now) {
    buckets.set(sessionId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  b.count++;
  return b.count <= LIMIT;
}

const BOT_UA = /bot|crawl|spider|slurp|preview|fetch|headless|lighthouse/i;

export async function POST(req: NextRequest) {
  // Роботы не покупают — их просмотры только портят воронку
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const e = parsed.data;
  if (!allowed(e.sessionId)) return NextResponse.json({ ok: true, skipped: "rate" });

  // Периодически чистим протухшие корзины лимита
  if (buckets.size > 5000) {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }

  await prisma.event.create({
    data: {
      type: e.type,
      sessionId: e.sessionId,
      path: e.path ?? null,
      key: e.key ?? null,
      meta: e.meta ? JSON.stringify(e.meta).slice(0, 1000) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
