/**
 * Регистрирует вебхук бота в Telegram — идемпотентно: если URL и так
 * совпадает с нужным, ничего не делает. Раньше setWebhook нигде не
 * вызывался вообще, поэтому Telegram копил апдейты и никуда их не слал.
 *
 * Запускается автоматически при каждом деплое (см. render.yaml), плюс
 * доступен вручную: npm run telegram:webhook
 */
const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";

async function main() {
  if (!botToken) {
    console.log("[telegram-webhook] TELEGRAM_BOT_TOKEN не задан — пропускаю (песочница)");
    return;
  }
  if (!siteUrl) {
    console.log("[telegram-webhook] Не удалось определить публичный URL (PUBLIC_SITE_URL / RENDER_EXTERNAL_URL) — пропускаю");
    return;
  }
  if (!secret) {
    console.log("[telegram-webhook] TELEGRAM_WEBHOOK_SECRET не задан — пропускаю, вебхук не регистрирую");
    return;
  }

  const targetUrl = `${siteUrl}/api/telegram/webhook`;

  const info = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`).then((r) => r.json());
  if (info?.result?.url === targetUrl) {
    console.log(`[telegram-webhook] уже настроен на ${targetUrl} — ничего не делаю`);
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: targetUrl,
      secret_token: secret,
      drop_pending_updates: false,
      allowed_updates: ["message"],
    }),
  }).then((r) => r.json());

  console.log("[telegram-webhook] setWebhook:", JSON.stringify(res));
  if (!res.ok) {
    // Не роняем деплой из-за недоступности Telegram API — это диагностируемо
    // через /api/admin/telegram/diagnostics и не должно блокировать выкладку сайта.
    console.error("[telegram-webhook] регистрация не удалась, сайт всё равно задеплоится");
  }
}

main().catch((err) => {
  console.error("[telegram-webhook] ошибка:", err);
});
