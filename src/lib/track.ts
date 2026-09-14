/**
 * Клиентская отправка событий поведения.
 *
 * Своя аналитика вместо Google Analytics: нет чужих скриптов, нет cookie-баннера,
 * и — главное — можно считать то, чего у готовых систем нет: какие цели
 * и условия жизни выбирают в подборе. Это прямой ответ на вопрос
 * «работает ли идея», а не просто счётчик посещений.
 *
 * Анонимно: sessionId — случайная строка в localStorage, к заказу или
 * телефону не привязана.
 */

export type EventType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "checkout_start"
  | "goal_select"
  | "condition_select"
  | "search"
  | "bundle_add";

const SESSION_KEY = "bad-mvp-sid";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = window.localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

export function track(type: EventType, key?: string, meta?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  if (!sessionId) return;

  const body = JSON.stringify({
    type,
    sessionId,
    path: window.location.pathname,
    key: key ?? null,
    meta: meta ?? null,
  });

  // sendBeacon не блокирует переход по ссылке и переживает закрытие вкладки
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* падаем на fetch ниже */
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* аналитика не должна мешать пользователю */
  });
}
