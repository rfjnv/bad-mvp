import { createHash } from "crypto";

/**
 * Telegram принимает в secret_token только [A-Za-z0-9_-], а значение,
 * которое генерирует Render (generateValue: true в render.yaml), может
 * содержать другие символы — setWebhook падает с "illegal characters".
 * Берём hex-хеш сырого секрета: всегда валиден, детерминирован, доступен
 * и вебхуку (сравнение заголовка), и скрипту регистрации.
 */
export function getWebhookSecretToken(): string {
  const raw = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  if (!raw) return "";
  return createHash("sha256").update(raw).digest("hex");
}

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
  /** Код ответа Telegram (403 = бот не может писать первым / заблокирован) */
  errorCode?: number;
}

/**
 * Отправляет сообщение через Telegram Bot API. Без TELEGRAM_BOT_TOKEN
 * работает в режиме песочницы: реального запроса нет, возвращается
 * то, что было бы отправлено — как и в src/lib/payments/*.
 */
export interface InlineButton {
  text: string;
  url: string;
}

/** Кнопка, которая не открывает ссылку, а шлёт апдейт callback_query — для ответов внутри чата */
export interface CallbackButton {
  text: string;
  callback_data: string;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  buttons?: (InlineButton | CallbackButton)[]
): Promise<SendMessageResult> {
  const { sandbox, botToken } = getTelegramConfig();

  if (sandbox) {
    return { ok: true, sandbox: true, preview: text };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: buttons?.length ? { inline_keyboard: [buttons] } : undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let errorCode: number | undefined;
      try {
        errorCode = JSON.parse(body)?.error_code;
      } catch {
        // не JSON — оставляем errorCode неопределённым
      }
      return { ok: false, sandbox: false, preview: text, error: `Telegram API ${res.status}: ${body}`, errorCode };
    }
    return { ok: true, sandbox: false, preview: text };
  } catch (err) {
    return { ok: false, sandbox: false, preview: text, error: String(err) };
  }
}

/**
 * Останавливает «крутилку» на нажатой inline-кнопке. Без этого вызова
 * Telegram показывает кнопку загружающейся до таймаута — нужен на каждый
 * callback_query, даже если ответного текста нет.
 */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const { sandbox, botToken } = getTelegramConfig();
  if (sandbox) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch {
    // Не критично: сообщение всё равно уже отправляется отдельно
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

function formatFinishDate(finishAt: Date): string {
  return finishAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Asia/Tashkent" });
}

/** «NOW Магний цитрат заканчивается около 23 декабря. Повторить заказ?» */
export function buildFinishReminder(productName: string, finishAt: Date): string {
  return `${productName} заканчивается около ${formatFinishDate(finishAt)}. Повторить заказ?`;
}

export interface FinishReminderItem {
  productName: string;
  finishAt: Date;
}

/**
 * Несколько заканчивающихся позиций — одно сообщение со списком, а не
 * по одному на каждую (не больше BANK_REMINDER_DAILY_LIMIT в сутки,
 * см. src/lib/botMessageBudget.ts).
 */
export function buildFinishReminderList(items: FinishReminderItem[]): string {
  if (items.length === 1) return buildFinishReminder(items[0].productName, items[0].finishAt);
  const lines = items.map((i) => `• ${i.productName} — около ${formatFinishDate(i.finishAt)}`);
  return ["Скоро закончатся:", ...lines, "", "Повторить заказ можно кнопкой ниже."].join("\n");
}

// ── Задача A: что происходит после доставки ──────────────────────────

export function buildDeliveryPromptMessage(orderNumber: string): string {
  return `Заказ ${orderNumber} доставлен. Добавить товары в «Мой приём»?`;
}

export function deliveryPromptButtons(orderId: string): CallbackButton[] {
  return [
    { text: "Да, это мне", callback_data: `dp:self:${orderId}` },
    { text: "Это не мне — в подарок", callback_data: `dp:gift:${orderId}` },
    { text: "Позже", callback_data: `dp:later:${orderId}` },
  ];
}

export interface RoutineItemForMessage {
  name: string;
  dosage: string;
}

/** Короткий план после «Да, это мне»: что, сколько, когда */
export function buildSelfAddedMessage(items: RoutineItemForMessage[]): string {
  const lines = items.map((i) => `• ${i.name} — ${i.dosage}`);
  return [
    "Добавил в «Мой приём»:",
    ...lines,
    "",
    "Напомню, когда будет пора повторить заказ. Отмечать приём — в разделе «Мой приём» на сайте.",
  ].join("\n");
}

export function buildLaterMessage(): string {
  return "Хорошо, спрошу ещё раз через пару дней.";
}

/** Сразу после «В подарок» — ссылка готова, больше делать ничего не нужно */
export function buildGiftReadyMessage(planUrl: string): string {
  return [
    "Готово! Ссылка на план приёма:",
    planUrl,
    "",
    "Отправьте её тому, для кого брали — он сможет отслеживать приём у себя, без вашего участия.",
    "Можно добавить личный комментарий (например, как принимать) — откройте ссылку сами и впишите его перед отправкой.",
  ].join("\n");
}

export interface PlanItemForMessage {
  name: string;
  dosage: string;
}

/** Текст плана целиком — и для копируемого блока на странице, и для /start plan_<token> */
export function buildPlanGuideText(items: PlanItemForMessage[], comment: string | null): string {
  const lines = items.map((i) => `• ${i.name} — ${i.dosage}`);
  const parts = ["План приёма:", ...lines];
  if (comment) parts.push("", comment);
  return parts.join("\n");
}

export function buildPlanNotFoundMessage(): string {
  return "Этот план не найден — возможно, ссылка устарела или отозвана. Попросите новую у того, кто её отправил.";
}
