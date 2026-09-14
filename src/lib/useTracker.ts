"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRoutine,
  getChecksForDate,
  toggleCheck,
  removeFromRoutine,
  getStreak,
  todayKey,
  TRACKER_CHANGED_EVENT,
  type RoutineItem,
} from "./tracker";
import { useUser } from "./useUser";

export interface TrackerItem extends RoutineItem {
  durationDays?: number | null;
}

export const ROUTINE_CHANGED_EVENT = "bad-mvp-routine-changed";

function dayKey(d: Date): string {
  return todayKey(d);
}

/** Та же логика серии, что и в localStorage-версии, но по данным сервера */
function streakFromHistory(slug: string, byDate: Record<string, string[]>, today: Date): number {
  let streak = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 365; i++) {
    const taken = (byDate[dayKey(cursor)] ?? []).includes(slug);
    if (!taken) {
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Список приёма в двух режимах: для вошедшего — сервер (переносится между
 * устройствами), для гостя — localStorage, как и раньше. Страница трекера
 * не знает, откуда данные: интерфейс один и тот же.
 */
export function useTracker() {
  const { user, loading: userLoading } = useUser();
  const [routine, setRoutine] = useState<TrackerItem[]>([]);
  const [byDate, setByDate] = useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = useState(false);
  const today = todayKey();
  const server = Boolean(user);

  const loadServer = useCallback(async () => {
    const from = new Date();
    from.setDate(from.getDate() - 365);
    const [r, h] = await Promise.all([
      fetch("/api/me/routine").then((x) => x.json()),
      fetch(`/api/me/intake?from=${dayKey(from)}&to=${today}`).then((x) => x.json()),
    ]);
    setRoutine(r.items ?? []);
    setByDate(h.byDate ?? {});
    setLoaded(true);
  }, [today]);

  const loadLocal = useCallback(() => {
    setRoutine(getRoutine());
    setByDate({ [today]: getChecksForDate(today) });
    setLoaded(true);
  }, [today]);

  useEffect(() => {
    if (userLoading) return;
    const load = server ? loadServer : loadLocal;
    load();
    const events = [TRACKER_CHANGED_EVENT, ROUTINE_CHANGED_EVENT];
    events.forEach((e) => window.addEventListener(e, load));
    return () => events.forEach((e) => window.removeEventListener(e, load));
  }, [server, userLoading, loadServer, loadLocal]);

  const toggle = useCallback(
    async (slug: string) => {
      if (!server) {
        toggleCheck(slug, today);
        return;
      }
      // Оптимистично, чтобы галочка не ждала сеть
      setByDate((prev) => {
        const set = new Set(prev[today] ?? []);
        if (set.has(slug)) set.delete(slug);
        else set.add(slug);
        return { ...prev, [today]: [...set] };
      });
      await fetch("/api/me/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, date: today }),
      });
    },
    [server, today]
  );

  const remove = useCallback(
    async (slug: string) => {
      if (!server) {
        removeFromRoutine(slug);
        return;
      }
      setRoutine((prev) => prev.filter((r) => r.slug !== slug));
      await fetch("/api/me/routine", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
    },
    [server]
  );

  const checks = byDate[today] ?? [];
  const streak = (slug: string) => (server ? streakFromHistory(slug, byDate, new Date()) : getStreak(slug));

  return { routine, checks, toggle, remove, streak, loaded: loaded && !userLoading, server, user };
}
