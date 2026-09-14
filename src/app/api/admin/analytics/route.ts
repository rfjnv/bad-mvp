import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GOALS } from "@/lib/goals";
import { CONDITIONS } from "@/lib/lifestyle";

/**
 * Аналитика поведения за период.
 *
 * Считаем по уникальным сессиям, а не по событиям: один человек, десять раз
 * открывший товар, — это один заинтересованный, а не десять. Воронка
 * отвечает на вопрос учредителя «конвертирует ли сайт», блок подбора —
 * «работает ли идея про условия жизни».
 */
export async function GET(req: NextRequest) {
  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30));
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: { createdAt: { gte: since } },
    select: { type: true, sessionId: true, key: true, meta: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // ── Воронка по уникальным сессиям ────────────────────────────────
  const stage = (type: string) => new Set(events.filter((e) => e.type === type).map((e) => e.sessionId));
  const sessions = stage("page_view");
  const viewed = stage("product_view");
  const carted = stage("add_to_cart");
  const checkout = stage("checkout_start");
  const ordered = stage("order_created");

  const funnel = [
    { step: "Зашли на сайт", sessions: sessions.size },
    { step: "Открыли товар", sessions: viewed.size },
    { step: "Добавили в корзину", sessions: carted.size },
    { step: "Дошли до оформления", sessions: checkout.size },
    { step: "Оформили заказ", sessions: ordered.size },
  ];

  // ── Товары: просмотры → корзина ───────────────────────────────────
  const productViews = new Map<string, Set<string>>();
  const productCarts = new Map<string, Set<string>>();
  for (const e of events) {
    if (!e.key) continue;
    if (e.type === "product_view") (productViews.get(e.key) ?? productViews.set(e.key, new Set()).get(e.key)!).add(e.sessionId);
    if (e.type === "add_to_cart") (productCarts.get(e.key) ?? productCarts.set(e.key, new Set()).get(e.key)!).add(e.sessionId);
  }
  const slugs = [...new Set([...productViews.keys(), ...productCarts.keys()])];
  const products = slugs.length
    ? await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } })
    : [];
  const nameBySlug = new Map(products.map((p) => [p.slug, p.name]));
  const productStats = slugs
    .map((slug) => {
      const views = productViews.get(slug)?.size ?? 0;
      const carts = productCarts.get(slug)?.size ?? 0;
      return {
        slug,
        name: nameBySlug.get(slug) ?? slug,
        views,
        carts,
        rate: views > 0 ? Math.round((carts / views) * 100) : null,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  // ── Подбор: цели и условия ────────────────────────────────────────
  const countBy = (type: string) => {
    const m = new Map<string, Set<string>>();
    for (const e of events) {
      if (e.type !== type || !e.key) continue;
      (m.get(e.key) ?? m.set(e.key, new Set()).get(e.key)!).add(e.sessionId);
    }
    return m;
  };
  const goalCounts = countBy("goal_select");
  const conditionCounts = countBy("condition_select");
  const goals = GOALS.map((g) => ({ slug: g.slug, title: g.title, sessions: goalCounts.get(g.slug)?.size ?? 0 }))
    .sort((a, b) => b.sessions - a.sessions);
  const conditions = CONDITIONS.map((c) => ({ slug: c.slug, title: c.title, sessions: conditionCounts.get(c.slug)?.size ?? 0 }))
    .sort((a, b) => b.sessions - a.sessions);

  // ── Поиск: чего ищут и не находят ─────────────────────────────────
  const searches = new Map<string, { count: number; zero: number }>();
  for (const e of events) {
    if (e.type !== "search" || !e.key) continue;
    const results = e.meta ? (JSON.parse(e.meta).results as number) : 0;
    const s = searches.get(e.key) ?? { count: 0, zero: 0 };
    s.count++;
    if (results === 0) s.zero++;
    searches.set(e.key, s);
  }
  const searchStats = [...searches.entries()]
    .map(([query, s]) => ({ query, count: s.count, zeroResults: s.zero }))
    .sort((a, b) => b.zeroResults - a.zeroResults || b.count - a.count)
    .slice(0, 15);

  // ── По дням: сессии и заказы ──────────────────────────────────────
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const daily = new Map<string, { sessions: Set<string>; orders: number; revenue: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    daily.set(dayKey(d), { sessions: new Set(), orders: 0, revenue: 0 });
  }
  for (const e of events) {
    const row = daily.get(dayKey(e.createdAt));
    if (!row) continue;
    if (e.type === "page_view") row.sessions.add(e.sessionId);
    if (e.type === "order_created") {
      row.orders++;
      row.revenue += e.meta ? Number(JSON.parse(e.meta).total) || 0 : 0;
    }
  }
  const timeline = [...daily.entries()].map(([date, r]) => ({
    date,
    sessions: r.sessions.size,
    orders: r.orders,
    revenue: r.revenue,
  }));

  const bundleAdds = stage("bundle_add").size;

  return NextResponse.json({
    days,
    funnel,
    productStats,
    goals,
    conditions,
    searchStats,
    timeline,
    bundleAdds,
    totalEvents: events.length,
  });
}
