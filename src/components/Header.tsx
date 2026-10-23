"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT, cartCount, getCart, pruneCart } from "@/lib/cart";
import { CONTACTS } from "@/lib/contacts";
import { useUser } from "@/lib/useUser";
import { t } from "@/lib/i18n";

export default function Header() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();

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

  const nav = [
    { href: "/catalog", label: t.nav.catalog },
    { href: "/podbor", label: "Подбор" },
    { href: "/bundles", label: t.bundles.navTitle },
    { href: "/subscription", label: t.nav.subscription },
    { href: "/tracker", label: t.nav.tracker },
  ];

  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={t.common.siteName}>
          {/* Янтарная точка — солнце, с которого начинается весь разговор о дефиците */}
          <span className="w-2.5 h-2.5 rounded-full bg-amber" aria-hidden="true" />
          <span className="font-semibold text-[17px] tracking-[-0.03em]">{t.common.siteName}</span>
          <span className="label-mono text-text-dim hidden lg:inline ml-1">Ташкент</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[14px]">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-text-dim hover:text-text transition-colors duration-200">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3 text-[14px]">
          <a
            href={CONTACTS.telegramHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-10 h-10 text-text-dim hover:text-text transition-colors duration-200"
            aria-label="Написать в Telegram"
          >
            <TelegramIcon />
          </a>
          <a
            href={CONTACTS.phoneHref}
            className="hidden sm:flex items-center justify-center w-10 h-10 text-text-dim hover:text-text transition-colors duration-200"
            aria-label={`Позвонить ${CONTACTS.phone}`}
          >
            <PhoneIcon />
          </a>
          <Link
            href={user ? "/account" : "/account?login=1"}
            className="hidden sm:inline-flex items-center h-10 px-1 text-text-dim hover:text-text transition-colors duration-200 max-w-[140px] truncate"
          >
            {user ? user.firstName : "Войти"}
          </Link>

          <Link
            href="/cart"
            className={`inline-flex items-center gap-1.5 h-10 px-1 font-medium ${bump ? "animate-pop" : ""}`}
            aria-label={`${t.nav.cart}${count > 0 ? `: ${count}` : ""}`}
          >
            {t.nav.cart}
            <span
              className={`tabular min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors duration-200 ${
                count > 0 ? "bg-text text-bg" : "bg-bg-panel text-text-dim"
              } ${bump ? "animate-badge-pop" : ""}`}
            >
              {count}
            </span>
          </Link>

          <button
            className="md:hidden inline-flex items-center h-10 pl-2 font-medium"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Закрыть" : "Меню"}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        hidden={!menuOpen}
        className="md:hidden border-t border-border bg-bg px-4 pt-2 pb-5 flex flex-col"
      >
        {[{ href: "/", label: t.nav.home }, ...nav, { href: "/account", label: user ? `Кабинет · ${user.firstName}` : "Войти через Telegram" }].map(
          (item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="min-h-[56px] flex items-baseline gap-4 border-b border-border text-[22px] font-medium tracking-[-0.03em] pt-3"
            >
              <span className="label-mono text-text-dim w-6">{String(i + 1).padStart(2, "0")}</span>
              {item.label}
            </Link>
          )
        )}

        <div className="grid grid-cols-2 gap-2 pt-5">
          <a href={CONTACTS.phoneHref} className="min-h-[48px] px-4 rounded-lg btn btn-primary text-sm">
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
    </header>
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


