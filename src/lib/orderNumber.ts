import type { Prisma } from "@prisma/client";

/**
 * Атомарно инкрементирует общий счётчик заказов внутри переданной транзакции
 * и возвращает человекочитаемый номер вида BAD-000001.
 */
export async function nextOrderNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const counter = await tx.counter.upsert({
    where: { id: "order" },
    create: { id: "order", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `BAD-${String(counter.value).padStart(6, "0")}`;
}
