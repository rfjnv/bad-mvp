"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT, cartCount, getCart, pruneCart } from "@/lib/cart";
import { CONTACTS } from "@/lib/contacts";
import { t } from "@/lib/i18n";

export default function Header() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let prev = cartCount(getCart());
    setCount(prev);

    // Сверяем корзину с каталогом при первой загрузке: если в localStorage
    // остались товары от прошлого состава базы, бейдж не должен их считать.
    const lines = getCart();
    if (lines.length > 0) {
      fetch("/api/cart/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines }),
      })
        .then((r) => r.json())
        .then((data) => pruneCart(data.knownSlugs ?? []))
        .catch(() => {
          /* сеть недоступна — оставляем как есть, пересчитаем в следующий раз */
        });
    }

    const update = () => {
      const next = cartCount(getCart());
      if (next > prev) {
        setBump(true);
        setTimeout(() => setBump(false), 400);
      }
      prev = next;
      setCount(next);
    };
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

        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={CONTACTS.phoneHref}
            className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-bg-panel transition-colors duration-150"
            aria-label={`Позвонить ${CONTACTS.phone}`}
          >
            <PhoneIcon />
          </a>
          <a
            href={CONTACTS.telegramHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-bg-panel transition-colors duration-150"
            aria-label="Написать в Telegram"
          >
            <TelegramIcon />
          </a>

          <Link
            href="/cart"
            className={`relative flex items-center justify-center w-11 h-11 rounded-lg hover:bg-bg-panel transition-colors duration-150 ${bump ? "animate-pop" : ""}`}
            aria-label={t.nav.cart}
          >
            <CartIcon />
            {count > 0 && (
              <span
                className={`absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center ${bump ? "animate-badge-pop" : ""}`}
              >
                {count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-bg-panel transition-colors duration-150"
            aria-label="Меню"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <BurgerIcon />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-white px-5 py-2 flex flex-col text-[15px]">
          {[
            { href: "/", label: t.nav.home },
            { href: "/catalog", label: t.nav.catalog },
            { href: "/bundles", label: t.bundles.navTitle },
            { href: "/subscription", label: t.nav.subscription },
            { href: "/tracker", label: t.nav.tracker },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="min-h-[48px] flex items-center border-b border-border last:border-b-0"
            >
              {item.label}
            </Link>
          ))}

          <div className="grid grid-cols-2 gap-3 py-4">
            <a
              href={CONTACTS.phoneHref}
              className="min-h-[48px] px-4 rounded-lg btn btn-primary text-sm"
            >
              <PhoneIcon />
              Позвонить
            </a>
            <a
              href={CONTACTS.telegramHref}
              target="_blank"
              rel="noreferrer"
              className="min-h-[48px] px-4 rounded-lg btn btn-secondary text-sm"
            >
              <TelegramIcon />
              Telegram
            </a>
          </div>
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

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8L18.1 6c.4-.3-.1-.5-.6-.2L6.6 12.7l-4.7-1.5c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.4 1.7Z" />
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
