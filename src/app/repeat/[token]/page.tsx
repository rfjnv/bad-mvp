import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RepeatClient from "./RepeatClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Повторить заказ",
  robots: { index: false },
};

/**
 * Страница из напоминания «банка заканчивается». Токен случайный и живёт
 * в заказе — пароля не нужно, а угадать его нельзя. Показываем состав
 * прошлого заказа с текущими ценами и наличием, количество можно поменять.
 */
export default async function RepeatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const order = await prisma.order.findUnique({
    where: { repeatToken: token },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  const items = order.items.map((i) => ({
    slug: i.product.slug,
    name: i.product.name,
    brand: i.product.brand,
    imageUrl: i.product.imageUrl,
    price: i.product.price,
    stock: i.product.stock,
    isActive: i.product.isActive,
    quantity: i.quantity,
  }));

  return <RepeatClient orderId={order.id} orderNumber={order.orderNumber} items={items} />;
}
