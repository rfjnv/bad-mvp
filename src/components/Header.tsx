"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT, cartCount, getCart } from "@/lib/cart";
import { t } from "@/lib/i18n";

export default function Header() {
  const [count, setCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setCount(cartCount(getCart()));
    update();
    window.addEventListener(CART_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-lg tracking-tight shrink-0">
          {t.common.siteName}
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-[15px] text-text-dim">
          <Link href="/" className="hover:text-text transition-colors">
            {t.nav.home}
          </Link>
          <Link href="/catalog" className="hover:text-text transition-colors">
            {t.nav.catalog}
          </Link>
          <Link href="/bundles" className="hover:text-text transition-colors">
            {t.bundles.navTitle}
          </Link>
          <Link href="/subscription" className="hover:text-text transition-colors">
            {t.nav.subscription}
          </Link>
          <Link href="/tracker" className="hover:text-text transition-colors">
            {t.nav.tracker}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-bg-panel transition-colors"
            aria-label={t.nav.cart}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-bg-panel transition-colors"
            aria-label="Меню"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <BurgerIcon />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-white px-5 py-4 flex flex-col gap-4 text-[15px]">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            {t.nav.home}
          </Link>
          <Link href="/catalog" onClick={() => setMenuOpen(false)}>
            {t.nav.catalog}
          </Link>
          <Link href="/bundles" onClick={() => setMenuOpen(false)}>
            {t.bundles.navTitle}
          </Link>
          <Link href="/subscription" onClick={() => setMenuOpen(false)}>
            {t.nav.subscription}
          </Link>
          <Link href="/tracker" onClick={() => setMenuOpen(false)}>
            {t.nav.tracker}
          </Link>
        </nav>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
