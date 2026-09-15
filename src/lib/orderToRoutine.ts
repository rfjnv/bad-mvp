import { prisma } from "@/lib/prisma";
import { RoutineItemForMessage } from "@/lib/telegram";

/**
 * Добавляет товары заказа в «Мой приём» пользователя — общий путь для
 * «Да, это мне» (DeliveryPrompt) и для получателя, принявшего Plan.
 * Повторное добавление не дублирует и не затирает уже выставленную
 * пользователем дозу (upsert только create, update — no-op).
 */
export async function addOrderItemsToRoutine(
  userId: string,
  orderId: string
): Promise<RoutineItemForMessage[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return [];

  const existingCount = await prisma.routineItem.count({ where: { userId } });
  const added: RoutineItemForMessage[] = [];
  let sortOrder = existingCount;

  for (const item of order.items) {
    await prisma.routineItem.upsert({
      where: { userId_productId: { userId, productId: item.productId } },
      create: { userId, productId: item.productId, sortOrder: sortOrder++ },
      update: {},
    });
    added.push({ name: item.product.name, dosage: item.product.dosage });
  }

  return added;
}
