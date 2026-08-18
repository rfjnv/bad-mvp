export interface ActiveBundle {
  slug: string;
  name: string;
  discountPct: number;
  /** slug'и товаров набора — по той же причине, что и в корзине */
  productSlugs: string[];
}

const ACTIVE_BUNDLE_KEY = "bad-mvp-active-bundle-v2";
const LEGACY_ACTIVE_BUNDLE_KEY = "bad-mvp-active-bundle";
export const BUNDLE_CHANGED_EVENT = "bad-mvp-bundle-changed";

export function getActiveBundle(): ActiveBundle | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage.getItem(LEGACY_ACTIVE_BUNDLE_KEY) !== null) {
      window.localStorage.removeItem(LEGACY_ACTIVE_BUNDLE_KEY);
    }
    const raw = window.localStorage.getItem(ACTIVE_BUNDLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.productSlugs) ? (parsed as ActiveBundle) : null;
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
export function isBundleValid(bundle: ActiveBundle, cartLines: { slug: string; quantity: number }[]): boolean {
  return bundle.productSlugs.every((slug) => {
    const line = cartLines.find((l) => l.slug === slug);
    return line !== undefined && line.quantity === 1;
  });
}
