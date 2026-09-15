import type { InlineButton } from "./telegram";
import { CONTACTS } from "./contacts";

const STATUS_LABELS: Record<string, string> = {
  NEW: "принят",
  CONFIRMED: "подтверждён",
  PACKED: "собран",
  WITH_COURIER: "передан курьеру",
  IN_TRANSIT: "в пути",
  SHIPPED: "в пути",
  DELIVERED: "доставлен",
  CANCELLED: "отменён",
  RETURNED: "оформлен как возврат",
};

const WHAT_NEXT: Record<string, string> = {
  CONFIRMED: "Собираем на складе.",
  PACKED: "Скоро передадим курьеру.",
  WITH_COURIER: "Курьер уже везёт заказ.",
  IN_TRANSIT: "Будет у вас в ближайшее время.",
  SHIPPED: "Будет у вас в ближайшее время.",
  DELIVERED: "Спасибо за заказ!",
};

export function orderStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/**
 * Сообщение на один переход статуса — короткое, номер заказа и что дальше.
 * Для WITH_COURIER — телефон курьера, если задан. Для CANCELLED — причина
 * и кнопка «Связаться с нами».
 */
export function buildOrderStatusMessage(
  orderNumber: string,
  status: string,
  opts: { courierPhone?: string | null; cancelReason?: string | null } = {}
): { text: string; buttons?: InlineButton[] } {
  const label = orderStatusLabel(status);
  const lines = [`Заказ ${orderNumber} ${label}.`];

  if (status === "WITH_COURIER" && opts.courierPhone) {
    lines.push(`Телефон курьера: ${opts.courierPhone}`);
  }
  if (status === "CANCELLED" && opts.cancelReason) {
    lines.push(`Причина: ${opts.cancelReason}`);
  }
  const whatNext = WHAT_NEXT[status];
  if (whatNext) lines.push(whatNext);

  if (status === "CANCELLED") {
    return {
      text: lines.join("\n"),
      buttons: [{ text: "Связаться с нами", url: CONTACTS.telegramHref }],
    };
  }
  return { text: lines.join("\n") };
}

/**
 * Несколько переходов в пределах часа слились в один — «Заказ собран
 * и передан курьеру» одним сообщением, а не двумя подряд. `statuses` —
 * все промежуточные статусы, пройденные за это время, по порядку;
 * что дальше и кнопки — по последнему из них.
 */
export function buildMergedOrderStatusMessage(
  orderNumber: string,
  statuses: string[],
  opts: { courierPhone?: string | null; cancelReason?: string | null } = {}
): { text: string; buttons?: InlineButton[] } {
  if (statuses.length <= 1) {
    return buildOrderStatusMessage(orderNumber, statuses[0] ?? "", opts);
  }
  const finalStatus = statuses[statuses.length - 1];
  const labels = statuses.map(orderStatusLabel).join(" и ");
  const lines = [`Заказ ${orderNumber} ${labels}.`];

  if (finalStatus === "WITH_COURIER" && opts.courierPhone) {
    lines.push(`Телефон курьера: ${opts.courierPhone}`);
  }
  if (finalStatus === "CANCELLED" && opts.cancelReason) {
    lines.push(`Причина: ${opts.cancelReason}`);
  }
  const whatNext = WHAT_NEXT[finalStatus];
  if (whatNext) lines.push(whatNext);

  if (finalStatus === "CANCELLED") {
    return { text: lines.join("\n"), buttons: [{ text: "Связаться с нами", url: CONTACTS.telegramHref }] };
  }
  return { text: lines.join("\n") };
}
