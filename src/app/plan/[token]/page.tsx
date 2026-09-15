import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE, verifyUserToken } from "@/lib/session";
import { getTelegramConfig } from "@/lib/telegram";
import { computeDuration } from "@/lib/duration";
import PlanClient from "./PlanClient";

export const dynamic = "force-dynamic";

// План приёма с личным комментарием — не должен попадать в поиск и в кэш поисковика
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default async function PlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const plan = await prisma.plan.findUnique({
    where: { token },
    include: { order: { include: { items: { include: { product: true } } } } },
  });
  if (!plan) notFound();

  const store = await cookies();
  const viewerId = await verifyUserToken(store.get(USER_COOKIE)?.value);
  const isOwner = viewerId != null && viewerId === plan.ownerId;

  const { botUsername } = getTelegramConfig();

  const items = plan.order.items.map((i) => ({
    name: i.product.name,
    brand: i.product.brand,
    imageUrl: i.product.imageUrl,
    dosage: i.product.dosage,
    durationDays: computeDuration(i.product)?.days ?? null,
  }));

  return (
    <PlanClient
      token={token}
      items={items}
      comment={plan.comment}
      claimed={plan.claimedAt !== null}
      isOwner={isOwner}
      botUsername={botUsername || null}
    />
  );
}
