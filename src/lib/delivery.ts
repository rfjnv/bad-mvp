/**
 * Доставка по Ташкенту.
 * Считается и на клиенте (чтобы показать итог до отправки формы),
 * и на сервере при создании заказа — клиентскому расчёту не доверяем.
 */

export const DELIVERY_FEE = 25_000;
export const FREE_DELIVERY_FROM = 500_000;

export function deliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

/** Сколько не хватает до бесплатной доставки; 0 — уже бесплатно */
export function amountUntilFreeDelivery(subtotal: number): number {
  return Math.max(0, FREE_DELIVERY_FROM - subtotal);
}

export const DELIVERY_TERMS =
  "Доставка по Ташкенту в день заказа при оформлении до 18:00, иначе на следующий день.";
