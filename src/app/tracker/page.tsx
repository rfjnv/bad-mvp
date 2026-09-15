"use client";

import Link from "next/link";
import Image from "next/image";
import { useTracker } from "@/lib/useTracker";
import { t } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import ServerTracker from "./ServerTracker";

export default function TrackerPage() {
  const { routine, checks, toggle, remove, streak, loaded, server } = useTracker();

  if (!loaded) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-text-dim">{t.common.loading}</div>;
  }

  if (routine.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          title={t.tracker.empty}
          hint={t.tracker.emptyHint}
          action={
            <Link href="/catalog" className="px-5 py-2.5 rounded-lg btn btn-primary font-semibold inline-block">
              {t.tracker.goToCatalog}
            </Link>
          }
        />
      </div>
    );
  }

  const takenCount = routine.filter((r) => checks.includes(r.slug)).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
      <div>
        <h1 className="display-1">{t.tracker.title}</h1>
        <p className="text-sm text-text-dim mt-1">
          {server ? "Список привязан к вашему Telegram и виден на всех устройствах." : t.tracker.subtitle}
        </p>
      </div>

      {server ? (
        <ServerTracker />
      ) : (
        <>
          <div className="bg-bg-panel rounded-2xl px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-text-dim">{t.tracker.takenToday}</span>
            <span className="text-lg font-semibold tracking-tight">
              {takenCount} / {routine.length}
            </span>
          </div>

          <div className="border border-border-strong rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm">
              Список хранится в этом браузере. Войдите через Telegram — он будет на всех устройствах,
              появятся серии, календарь и остаток банки.
            </span>
            <Link href="/account?login=1" className="px-4 min-h-[40px] rounded-lg btn btn-primary text-sm shrink-0">
              Войти
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {routine.map((item) => {
              const taken = checks.includes(item.slug);
              const days = streak(item.slug);
              return (
                <div
                  key={item.slug}
                  className={`flex items-center gap-4 rounded-2xl p-3.5 border transition-colors ${
                    taken ? "bg-green-bg border-transparent" : "bg-white border-border"
                  }`}
                >
                  <Link href={`/product/${item.slug}`} className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-bg-panel">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.slug}`} className="font-medium text-sm line-clamp-1">
                      {item.name}
                    </Link>
                    <div className="text-xs text-text-dim mt-0.5 line-clamp-1">{item.dosage}</div>
                    <div className="text-xs text-text-dim mt-0.5">{t.tracker.streak(days)}</div>
                  </div>
                  <button
                    onClick={() => toggle(item.slug)}
                    aria-label={t.tracker.markTaken}
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      taken
                        ? "bg-green border-green text-white"
                        : "bg-white border-border text-transparent hover:border-accent/50"
                    }`}
                  >
                    <CheckIcon />
                  </button>
                  <button
                    onClick={() => remove(item.slug)}
                    aria-label={t.tracker.remove}
                    className="shrink-0 text-text-dim hover:text-red transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
