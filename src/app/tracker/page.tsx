"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getRoutine,
  getChecksForDate,
  toggleCheck,
  getStreak,
  removeFromRoutine,
  todayKey,
  TRACKER_CHANGED_EVENT,
  type RoutineItem,
} from "@/lib/tracker";
import { t } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import TelegramConnect from "@/components/TelegramConnect";

export default function TrackerPage() {
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [checks, setChecks] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const today = todayKey();

  useEffect(() => {
    function refresh() {
      setRoutine(getRoutine());
      setChecks(getChecksForDate(today));
      setLoaded(true);
    }
    refresh();
    window.addEventListener(TRACKER_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TRACKER_CHANGED_EVENT, refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <Link href="/catalog" className="px-5 py-2.5 rounded-full bg-accent text-white font-semibold inline-block">
              {t.tracker.goToCatalog}
            </Link>
          }
        />
      </div>
    );
  }

  const takenCount = routine.filter((r) => checks.includes(r.productId)).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t.tracker.title}</h1>
        <p className="text-sm text-text-dim mt-1">{t.tracker.subtitle}</p>
      </div>

      <div className="bg-bg-panel rounded-2xl px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-text-dim">{t.tracker.takenToday}</span>
        <span className="text-lg font-semibold tracking-tight">
          {takenCount} / {routine.length}
        </span>
      </div>

      <TelegramConnect routineNames={routine.map((r) => r.name)} />

      <div className="flex flex-col gap-3">
        {routine.map((item) => {
          const taken = checks.includes(item.productId);
          const streak = getStreak(item.productId);
          return (
            <div
              key={item.productId}
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
                <div className="text-xs text-text-dim mt-0.5">{t.tracker.streak(streak)}</div>
              </div>
              <button
                onClick={() => toggleCheck(item.productId, today)}
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
                onClick={() => removeFromRoutine(item.productId)}
                aria-label={t.tracker.remove}
                className="shrink-0 text-text-dim hover:text-red transition-colors"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
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
