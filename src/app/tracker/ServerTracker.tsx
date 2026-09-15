"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ROUTINE_CHANGED_EVENT } from "@/lib/useTracker";

type Slot = "MORNING" | "AFTERNOON" | "EVENING";
type DayStatus = "taken" | "skipped" | "paused" | "unmarked" | "future";

interface RoutineItemData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  dosage: string;
  durationDays: number | null;
  timeSlot: Slot | null;
  paused: boolean;
  streaks: { current: number; best: number };
  calendar: { date: string; status: DayStatus }[];
  markedStats7: { marked: number; total: number };
  markedStats30: { marked: number; total: number };
  remaining: { displayDays: number | null; source: "calendar" | "marks" | null };
}

interface Warning {
  scope: "general" | "slot";
  slot: Slot | null;
  key: string;
  type: "caution" | "synergy";
  message: string;
}

interface RoutineData {
  items: RoutineItemData[];
  warnings: Warning[];
  overall: { streaks: { current: number; best: number }; markedStats7: { marked: number; total: number }; markedStats30: { marked: number; total: number } } | null;
}

const SLOT_LABELS: Record<Slot, string> = { MORNING: "Утро", AFTERNOON: "День", EVENING: "Вечер" };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function ServerTracker() {
  const [data, setData] = useState<RoutineData | null>(null);

  const load = useCallback(() => {
    fetch("/api/me/routine")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(ROUTINE_CHANGED_EVENT, load);
    return () => window.removeEventListener(ROUTINE_CHANGED_EVENT, load);
  }, [load]);

  if (!data) return <div className="text-text-dim">Загрузка…</div>;

  const generalWarnings = data.warnings.filter((w) => w.scope === "general");

  return (
    <div className="flex flex-col gap-6">
      {data.overall && (
        <div className="bg-bg-panel rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Stat label="Серия" value={`${data.overall.streaks.current} дн.`} hint={`рекорд ${data.overall.streaks.best}`} />
          <Stat
            label="За 7 дней"
            value={`${data.overall.markedStats7.marked} из ${data.overall.markedStats7.total}`}
          />
          <Stat
            label="За 30 дней"
            value={`${data.overall.markedStats30.marked} из ${data.overall.markedStats30.total}`}
          />
        </div>
      )}

      {generalWarnings.map((w) => (
        <WarningCard key={w.key} warning={w} onDismiss={load} />
      ))}

      {(["MORNING", "AFTERNOON", "EVENING"] as const).map((slot) => {
        const slotItems = data.items.filter((i) => i.timeSlot === slot);
        if (slotItems.length === 0) return null;
        const slotWarnings = data.warnings.filter((w) => w.scope === "slot" && w.slot === slot);
        return (
          <div key={slot} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">{SLOT_LABELS[slot]}</h2>
            {slotWarnings.map((w) => (
              <WarningCard key={w.key} warning={w} onDismiss={load} />
            ))}
            {slotItems.map((item) => (
              <RoutineCard key={item.id} item={item} onChanged={load} />
            ))}
          </div>
        );
      })}

      {data.items.some((i) => !i.timeSlot) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Без слота</h2>
          {data.items
            .filter((i) => !i.timeSlot)
            .map((item) => (
              <RoutineCard key={item.id} item={item} onChanged={load} />
            ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-text-dim">{label}</div>
      <div className="text-lg font-semibold tracking-tight">
        {value}
        {hint && <span className="text-xs text-text-dim font-normal ml-1.5">{hint}</span>}
      </div>
    </div>
  );
}

function WarningCard({ warning, onDismiss }: { warning: Warning; onDismiss: () => void }) {
  const [busy, setBusy] = useState(false);
  async function dismiss() {
    setBusy(true);
    await fetch("/api/me/compatibility-dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: warning.key }),
    });
    onDismiss();
  }
  return (
    <div className="bg-bg-panel rounded-xl p-4 flex items-start justify-between gap-3 text-sm">
      <span className="text-text-dim">{warning.message}</span>
      <button onClick={dismiss} disabled={busy} className="shrink-0 text-xs link-action whitespace-nowrap">
        Понятно, не показывать
      </button>
    </div>
  );
}

const DAY_STYLES: Record<DayStatus, string> = {
  taken: "bg-green",
  skipped: "bg-border-strong",
  paused: "bg-bg-panel-2",
  unmarked: "bg-white border border-border",
  future: "bg-transparent",
};

function CalendarGrid({ calendar }: { calendar: { date: string; status: DayStatus }[] }) {
  return (
    <div className="flex flex-wrap gap-[3px]" title="Последние 30 дней">
      {calendar.map((d) => (
        <span
          key={d.date}
          className={`w-2.5 h-2.5 rounded-sm ${DAY_STYLES[d.status]}`}
          title={`${d.date}: ${d.status === "taken" ? "принято" : d.status === "skipped" ? "пропущено" : d.status === "paused" ? "пауза" : d.status === "unmarked" ? "не отмечено" : ""}`}
        />
      ))}
    </div>
  );
}

function RoutineCard({ item, onChanged }: { item: RoutineItemData; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const today = todayKey();
  const yesterday = yesterdayKey();
  const todayStatus = item.calendar[item.calendar.length - 1]?.status ?? "unmarked";
  const yesterdayStatus = item.calendar[item.calendar.length - 2]?.status ?? "unmarked";

  async function mark(date: string, status: "TAKEN" | "SKIPPED" | null) {
    setBusy(true);
    await fetch("/api/me/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug, date, status }),
    });
    setBusy(false);
    onChanged();
    window.dispatchEvent(new Event(ROUTINE_CHANGED_EVENT));
  }

  async function setSlot(slot: Slot | "") {
    setBusy(true);
    await fetch("/api/me/routine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug, timeSlot: slot || null }),
    });
    setBusy(false);
    onChanged();
  }

  async function togglePause() {
    setBusy(true);
    await fetch("/api/me/routine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug, paused: !item.paused }),
    });
    setBusy(false);
    onChanged();
  }

  async function remove() {
    setBusy(true);
    await fetch("/api/me/routine", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug }),
    });
    setBusy(false);
    onChanged();
    window.dispatchEvent(new Event(ROUTINE_CHANGED_EVENT));
  }

  return (
    <div className={`rounded-2xl p-4 border flex flex-col gap-3 ${item.paused ? "bg-bg-panel border-border" : "bg-white border-border"}`}>
      <div className="flex items-center gap-3">
        <Link href={`/product/${item.slug}`} className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-bg-panel">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/product/${item.slug}`} className="font-medium text-sm line-clamp-1">
            {item.name}
          </Link>
          <div className="text-xs text-text-dim mt-0.5 line-clamp-1">{item.dosage}</div>
        </div>
        <button onClick={remove} aria-label="Убрать из приёма" className="shrink-0 text-text-dim hover:text-red transition-colors">
          ✕
        </button>
      </div>

      {item.paused ? (
        <div className="flex items-center justify-between gap-3 text-sm text-text-dim">
          <span>На паузе — напоминания не приходят, серия не считается</span>
          <button onClick={togglePause} disabled={busy} className="link-action shrink-0">
            Возобновить
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dim">
            <span>Серия: {item.streaks.current} дн. (рекорд {item.streaks.best})</span>
            <span>За 7 дней: отмечено {item.markedStats7.marked} из {item.markedStats7.total}</span>
            {item.remaining.displayDays !== null && (
              <span>Осталось ≈ {Math.max(0, item.remaining.displayDays)} дн.</span>
            )}
          </div>

          <CalendarGrid calendar={item.calendar} />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={item.timeSlot ?? ""}
              onChange={(e) => setSlot(e.target.value as Slot | "")}
              disabled={busy}
              className="px-2.5 h-9 rounded-lg bg-bg-panel-2 border border-border text-xs"
            >
              <option value="">Без слота</option>
              <option value="MORNING">Утро</option>
              <option value="AFTERNOON">День</option>
              <option value="EVENING">Вечер</option>
            </select>

            <button
              onClick={() => mark(today, todayStatus === "taken" ? null : "TAKEN")}
              disabled={busy}
              className={`px-3 h-9 rounded-lg text-xs font-medium border ${
                todayStatus === "taken" ? "bg-green text-white border-green" : "border-border bg-white"
              }`}
            >
              {todayStatus === "taken" ? "Принято сегодня ✓" : "Отметить сегодня"}
            </button>
            <button
              onClick={() => mark(today, todayStatus === "skipped" ? null : "SKIPPED")}
              disabled={busy}
              className={`px-3 h-9 rounded-lg text-xs font-medium border ${
                todayStatus === "skipped" ? "bg-border-strong border-border-strong" : "border-border bg-white text-text-dim"
              }`}
            >
              Пропустить сегодня
            </button>
            <button
              onClick={() => mark(yesterday, yesterdayStatus === "taken" ? null : "TAKEN")}
              disabled={busy}
              className={`px-3 h-9 rounded-lg text-xs font-medium border ${
                yesterdayStatus === "taken" ? "bg-green/10 border-green text-green" : "border-border bg-white text-text-dim"
              }`}
            >
              {yesterdayStatus === "taken" ? "Вчера отмечено ✓" : "Отметить вчера"}
            </button>
            <button onClick={togglePause} disabled={busy} className="px-3 h-9 rounded-lg text-xs text-text-dim">
              Пауза
            </button>
          </div>
        </>
      )}
    </div>
  );
}
