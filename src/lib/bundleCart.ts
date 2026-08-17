export interface ActiveBundle {
  slug: string;
  name: string;
  discountPct: number;
  productIds: string[];
}

const ACTIVE_BUNDLE_KEY = "bad-mvp-active-bundle";
export const BUNDLE_CHANGED_EVENT = "bad-mvp-bundle-changed";

export function getActiveBundle(): ActiveBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_BUNDLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveBundle(bundle: ActiveBundle): void {
  window.localStorage.setItem(ACTIVE_BUNDLE_KEY, JSON.stringify(bundle));
  window.dispatchEvent(new Event(BUNDLE_CHANGED_EVENT));
}

export function clearActiveBundle(): void {
  window.localStorage.removeItem(ACTIVE_BUNDLE_KEY);
  window.dispatchEvent(new Event(BUNDLE_CHANGED_EVENT));
}

/** Скидка активна только если каждый товар набора лежит в корзине ровно по 1 шт. */
export function isBundleValid(bundle: ActiveBundle, cartLines: { productId: string; quantity: number }[]): boolean {
  return bundle.productIds.every((id) => {
    const line = cartLines.find((l) => l.productId === id);
    return line !== undefined && line.quantity === 1;
  });
}
