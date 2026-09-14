export interface TelegramConfig {
  /** Нет токена — сообщения никуда не уходят, только печатаются в лог */
  sandbox: boolean;
  /**
   * Можно ли выдать покупателю ссылку t.me/<bot>?start=… для привязки
   * напоминаний. Для этого нужен ещё и username бота; уведомлениям
   * магазину он не нужен — им хватает токена.
   */
  canLink: boolean;
  botToken: string;
  botUsername: string;
}

export function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  // Принимаем и «bot», и «@bot», и «https://t.me/bot» — люди вставляют по-разному
  const botUsername = (process.env.TELEGRAM_BOT_USERNAME || "")
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "");
  return {
    sandbox: !botToken,
    canLink: Boolean(botToken && botUsername),
    botToken,
    botUsername,
  };
}

export interface SendMessageResult {
  ok: boolean;
  sandbox: boolean;
  preview: string;
  error?: string;
}

/**
 * Отправляет сообщение через Telegram Bot API. Без TELEGRAM_BOT_TOKEN
 * работает в режиме песочницы: реального запроса нет, возвращается
 * то, что было бы отправлено — как и в src/lib/payments/*.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<SendMessageResult> {
  const { sandbox, botToken } = getTelegramConfig();

  if (sandbox) {
    return { ok: true, sandbox: true, preview: text };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, sandbox: false, preview: text, error: `Telegram API ${res.status}: ${body}` };
    }
    return { ok: true, sandbox: false, preview: text };
  } catch (err) {
    return { ok: false, sandbox: false, preview: text, error: String(err) };
  }
}

/**
 * Чат магазина, куда приходят уведомления о заказах.
 * Задаётся отдельно от бота: бот один, а чатов может быть несколько
 * (владелец, менеджер, группа склада).
 */
export function getShopChatId(): string {
  return process.env.TELEGRAM_ADMIN_CHAT_ID || "";
}

export interface OrderNotificationInput {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  comment: string | null;
  paymentMethod: string;
  totalAmount: number;
  items: { name: string; quantity: number; priceAtPurchase: number }[];
  siteUrl: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "наличные при получении",
  PAYME: "Payme",
  CLICK: "Click",
};

function formatSum(n: number): string {
  return n.toLocaleString("ru-RU").replace(/ /g, " ") + " сум";
}

export function buildOrderNotification(o: OrderNotificationInput): string {
  const lines = o.items.map(
    (i) => `• ${i.name} × ${i.quantity} — ${formatSum(i.priceAtPurchase * i.quantity)}`
  );
  const parts = [
    `🛒 Новый заказ ${o.orderNumber}`,
    "",
    ...lines,
    "",
    `Итого: ${formatSum(o.totalAmount)}`,
    `Оплата: ${PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}`,
    "",
    `${o.customerName}, ${o.customerPhone}`,
    o.customerAddress,
  ];
  if (o.comment) parts.push("", `Комментарий: ${o.comment}`);
  parts.push("", `${o.siteUrl}/admin/orders/${o.orderId}`);
  return parts.join("\n");
}

export function buildPaymentNotification(orderNumber: string, totalAmount: number, method: string): string {
  return `✅ Оплачен заказ ${orderNumber}\n${formatSum(totalAmount)} через ${PAYMENT_LABELS[method] ?? method}`;
}

/**
 * Уведомляет магазин. Никогда не бросает исключение и не влияет на ответ
 * клиенту: заказ уже в базе, а сбой Telegram — не повод показать покупателю
 * ошибку. В песочнице печатает сообщение в лог сервера, чтобы его было
 * видно и в разработке, и в логах Render до подключения настоящего бота.
 */
export async function notifyShop(text: string): Promise<void> {
  const chatId = getShopChatId();
  const { sandbox } = getTelegramConfig();

  if (sandbox || !chatId) {
    console.log("[telegram → магазин, песочница]\n" + text);
    return;
  }

  const result = await sendTelegramMessage(chatId, text);
  if (!result.ok) {
    console.error("[telegram → магазин] не доставлено:", result.error);
  }
}

export function buildReminderMessage(items: string[]): string {
  if (items.length === 0) {
    return "Напоминание: загляните в «Мой приём» на сайте и добавьте товары, которые принимаете регулярно.";
  }
  const list = items.map((name) => `• ${name}`).join("\n");
  return `Не забудьте сегодняшний приём:\n${list}\n\nОтметить как принято можно в разделе «Мой приём» на сайте.`;
}
