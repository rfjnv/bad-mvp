export interface TelegramConfig {
  sandbox: boolean;
  botToken: string;
  botUsername: string;
}

export function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "";
  return { sandbox: !botToken || !botUsername, botToken, botUsername };
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

export function buildReminderMessage(items: string[]): string {
  if (items.length === 0) {
    return "Напоминание: загляните в «Мой приём» на сайте и добавьте товары, которые принимаете регулярно.";
  }
  const list = items.map((name) => `• ${name}`).join("\n");
  return `Не забудьте сегодняшний приём:\n${list}\n\nОтметить как принято можно в разделе «Мой приём» на сайте.`;
}
