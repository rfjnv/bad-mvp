export interface CartLine {
  productId: string;
  quantity: number;
}

const CART_KEY = "bad-mvp-cart";
const CART_EVENT = "bad-mvp-cart-changed";

function readRaw(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l?.productId === "string" && typeof l?.quantity === "number" && l.quantity > 0
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

export function setCartQuantity(productId: string, quantity: number, maxStock?: number): CartLine[] {
  const lines = readRaw();
  const clamped = maxStock !== undefined ? Math.min(quantity, maxStock) : quantity;
  const idx = lines.findIndex((l) => l.productId === productId);
  if (clamped <= 0) {
    if (idx >= 0) lines.splice(idx, 1);
  } else if (idx >= 0) {
    lines[idx].quantity = clamped;
  } else {
    lines.push({ productId, quantity: clamped });
  }
  writeRaw(lines);
  return lines;
}

export function addToCart(productId: string, quantity: number, maxStock?: number): CartLine[] {
  const lines = readRaw();
  const idx = lines.findIndex((l) => l.productId === productId);
  const current = idx >= 0 ? lines[idx].quantity : 0;
  return setCartQuantity(productId, current + quantity, maxStock);
}

export function removeFromCart(productId: string): CartLine[] {
  const lines = readRaw().filter((l) => l.productId !== productId);
  writeRaw(lines);
  return lines;
}

export function clearCart(): void {
  writeRaw([]);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export const CART_CHANGED_EVENT = CART_EVENT;
