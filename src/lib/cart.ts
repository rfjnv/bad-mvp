export interface CartLine {
  /** Стабильный идентификатор товара. Именно slug, а не cuid из базы:
   *  на бесплатном тарифе Render база эфемерная, и при каждом редеплое
   *  cuid'ы пересоздаются — корзина у вернувшегося покупателя ссылалась
   *  бы на несуществующие товары. Slug задаётся вручную и переживает деплой. */
  slug: string;
  quantity: number;
}

/** v2 — переезд с productId (cuid) на slug. Старый ключ чистим при первом чтении. */
const CART_KEY = "bad-mvp-cart-v2";
const LEGACY_CART_KEY = "bad-mvp-cart";
const CART_EVENT = "bad-mvp-cart-changed";

function readRaw(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    // Корзина, сохранённая до перехода на slug, восстановлению не подлежит:
    // в ней лежат cuid'ы от прошлого сида базы.
    if (window.localStorage.getItem(LEGACY_CART_KEY) !== null) {
      window.localStorage.removeItem(LEGACY_CART_KEY);
    }
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l?.slug === "string" && typeof l?.quantity === "number" && l.quantity > 0
    );
  } catch {
    return [];
  }
}

function writeRaw(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCart(): CartLine[] {
  return readRaw();
}

export function setCartQuantity(slug: string, quantity: number, maxStock?: number): CartLine[] {
  const lines = readRaw();
  const clamped = maxStock !== undefined ? Math.min(quantity, maxStock) : quantity;
  const idx = lines.findIndex((l) => l.slug === slug);
  if (clamped <= 0) {
    if (idx >= 0) lines.splice(idx, 1);
  } else if (idx >= 0) {
    lines[idx].quantity = clamped;
  } else {
    lines.push({ slug, quantity: clamped });
  }
  writeRaw(lines);
  return lines;
}

export function addToCart(slug: string, quantity: number, maxStock?: number): CartLine[] {
  const lines = readRaw();
  const idx = lines.findIndex((l) => l.slug === slug);
  const current = idx >= 0 ? lines[idx].quantity : 0;
  return setCartQuantity(slug, current + quantity, maxStock);
}

export function removeFromCart(slug: string): CartLine[] {
  const lines = readRaw().filter((l) => l.slug !== slug);
  writeRaw(lines);
  return lines;
}

/**
 * Выкидывает из корзины позиции, которых больше нет в каталоге.
 * Вызывается после того, как сервер разрешил slug'и в товары:
 * молча чистим мусор, чтобы бейдж в шапке не показывал несуществующие товары.
 * Возвращает true, если что-то удалили.
 */
export function pruneCart(knownSlugs: string[]): boolean {
  const known = new Set(knownSlugs);
  const lines = readRaw();
  const kept = lines.filter((l) => known.has(l.slug));
  if (kept.length === lines.length) return false;
  writeRaw(kept);
  return true;
}

export function clearCart(): void {
  writeRaw([]);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export const CART_CHANGED_EVENT = CART_EVENT;
