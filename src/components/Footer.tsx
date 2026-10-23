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

const COLUMN_TITLE = "label-mono text-text-dim mb-1";
const LINK = "min-h-[40px] flex items-center text-[15px] hover:text-amber transition-colors duration-200";

export default function Footer() {
  return (
    <footer className="mt-24 bg-text text-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 flex flex-col gap-14">
        <p className="display-1 max-w-4xl text-bg">
          Видно, за что <span className="text-amber">вы платите.</span>
        </p>

        <div className="grid gap-10 grid-cols-2 lg:grid-cols-4 [&_a]:text-bg">
          <div className="flex flex-col gap-1 col-span-2 lg:col-span-1">
            <div className={COLUMN_TITLE}>{t.common.siteName}</div>
            <p className="text-[14px] text-bg/70 leading-relaxed max-w-xs">
              Оригинальные бренды с документами СЭС, цена за действующее вещество у каждого товара
              и доставка по Ташкенту в день заказа.
            </p>
          </div>

          <div className="flex flex-col">
            <div className={COLUMN_TITLE}>Связаться</div>
            <a href={CONTACTS.phoneHref} className={`${LINK} gap-2 tabular whitespace-nowrap`}>
              <PhoneIcon />
              {CONTACTS.phone}
            </a>
            <a href={CONTACTS.telegramHref} target="_blank" rel="noreferrer" className={`${LINK} gap-2`}>
              <TelegramIcon />
              {CONTACTS.telegram}
            </a>
            <a href={`mailto:${CONTACTS.email}`} className={LINK}>
              {CONTACTS.email}
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <div className={COLUMN_TITLE}>Магазин</div>
            <div className="text-[15px] leading-relaxed">{CONTACTS.address}</div>
            <div className="text-[14px] text-bg/70">{CONTACTS.workHours}</div>
            <div className="text-[13px] text-bg/60 leading-relaxed">{CONTACTS.deliveryNote}</div>
          </div>

          <div className="flex flex-col">
            <div className={COLUMN_TITLE}>Разделы</div>
            <Link href="/catalog" className={LINK}>
              {t.nav.catalog}
            </Link>
            <Link href="/podbor" className={LINK}>
              Подбор по образу жизни
            </Link>
            <Link href="/bundles" className={LINK}>
              {t.bundles.navTitle}
            </Link>
            <Link href="/subscription" className={LINK}>
              {t.nav.subscription}
            </Link>
            <Link href="/tracker" className={LINK}>
              {t.nav.tracker}
            </Link>
          </div>
        </div>

        <div className="border-t border-bg/15 pt-6 flex flex-col sm:flex-row sm:justify-between gap-3 text-[12px] text-bg/55">
          <div className="max-w-xl">{DISCLAIMER}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {CONTACTS.legalName} · {CONTACTS.legalId} · © {new Date().getFullYear()}
            </span>
            <Link href="/privacy" className="underline underline-offset-4 decoration-bg/30 hover:decoration-bg">
              Обработка персональных данных
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
