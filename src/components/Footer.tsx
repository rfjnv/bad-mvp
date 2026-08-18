import Link from "next/link";
import { CONTACTS, DISCLAIMER } from "@/lib/contacts";
import { t } from "@/lib/i18n";

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8L18.1 6c.4-.3-.1-.5-.6-.2L6.6 12.7l-4.7-1.5c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.4 1.7Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-bg-panel">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="font-semibold text-lg tracking-tight">{t.common.siteName}</div>
          <p className="text-[13px] text-text-dim leading-relaxed">
            Витамины и БАД оригинальных брендов с документами и доставкой по Узбекистану.
            Показываем цену за действующее вещество — видно, за что вы платите.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-[13px] font-semibold uppercase tracking-wide text-text-dim">
            Связаться
          </div>
          <a
            href={CONTACTS.phoneHref}
            className="inline-flex items-center gap-2 min-h-[44px] font-medium hover:text-text-dim transition-colors duration-150"
          >
            <PhoneIcon />
            {CONTACTS.phone}
          </a>
          <a
            href={CONTACTS.telegramHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 min-h-[44px] font-medium hover:text-text-dim transition-colors duration-150"
          >
            <TelegramIcon />
            {CONTACTS.telegram}
          </a>
          <a
            href={`mailto:${CONTACTS.email}`}
            className="inline-flex items-center min-h-[44px] text-[15px] text-text-dim hover:text-text transition-colors duration-150"
          >
            {CONTACTS.email}
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-[13px] font-semibold uppercase tracking-wide text-text-dim">
            Магазин
          </div>
          <div className="text-[15px] leading-relaxed">{CONTACTS.address}</div>
          <div className="text-[15px] text-text-dim">{CONTACTS.workHours}</div>
          <div className="text-[13px] text-text-dim leading-relaxed">{CONTACTS.deliveryNote}</div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-[13px] font-semibold uppercase tracking-wide text-text-dim">
            Разделы
          </div>
          <Link href="/catalog" className="min-h-[44px] flex items-center text-[15px] hover:text-text-dim transition-colors duration-150">
            {t.nav.catalog}
          </Link>
          <Link href="/bundles" className="min-h-[44px] flex items-center text-[15px] hover:text-text-dim transition-colors duration-150">
            {t.bundles.navTitle}
          </Link>
          <Link href="/subscription" className="min-h-[44px] flex items-center text-[15px] hover:text-text-dim transition-colors duration-150">
            {t.nav.subscription}
          </Link>
          <Link href="/tracker" className="min-h-[44px] flex items-center text-[15px] hover:text-text-dim transition-colors duration-150">
            {t.nav.tracker}
          </Link>
          <Link href="/privacy" className="min-h-[44px] flex items-center text-[15px] link-action">
            Обработка персональных данных
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-2 text-[13px] text-text-dim">
          <div>{DISCLAIMER}</div>
          <div>
            {CONTACTS.legalName} · {CONTACTS.legalId} · © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  );
}
