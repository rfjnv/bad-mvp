export interface RoutineItem {
  /** Ключ — slug: cuid из базы не переживает редеплой эфемерной SQLite */
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  dosage: string;
}

const ROUTINE_KEY = "bad-mvp-tracker-routine-v2";
const LEGACY_ROUTINE_KEY = "bad-mvp-tracker-routine";
const HISTORY_KEY = "bad-mvp-tracker-history-v2";
const LEGACY_HISTORY_KEY = "bad-mvp-tracker-history";
export const TRACKER_CHANGED_EVENT = "bad-mvp-tracker-changed";

function notify(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRACKER_CHANGED_EVENT));
  }
}

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getRoutine(): RoutineItem[] {
  if (typeof window === "undefined") return [];
  try {
    // Старый список приёма ссылался на cuid'ы прошлого сида базы —
    // и отметки, и streak в нём указывали в никуда.
    if (window.localStorage.getItem(LEGACY_ROUTINE_KEY) !== null) {
      window.localStorage.removeItem(LEGACY_ROUTINE_KEY);
      window.localStorage.removeItem(LEGACY_HISTORY_KEY);
    }
    const raw = window.localStorage.getItem(ROUTINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is RoutineItem => typeof r?.slug === "string");
  } catch {
    return [];
  }
}

function writeRoutine(items: RoutineItem[]): void {
  window.localStorage.setItem(ROUTINE_KEY, JSON.stringify(items));
  notify();
}

export function isInRoutine(slug: string): boolean {
  return getRoutine().some((r) => r.slug === slug);
}

export function addToRoutine(item: RoutineItem): void {
  const routine = getRoutine();
  if (routine.some((r) => r.slug === item.slug)) return;
  writeRoutine([...routine, item]);
}

export function removeFromRoutine(slug: string): void {
  writeRoutine(getRoutine().filter((r) => r.slug !== slug));
}

function readHistory(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeHistory(history: Record<string, string[]>): void {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  notify();
}

export function getChecksForDate(date: string): string[] {
  return readHistory()[date] ?? [];
}

export function toggleCheck(slug: string, date: string): void {
  const history = readHistory();
  const forDate = new Set(history[date] ?? []);
  if (forDate.has(slug)) forDate.delete(slug);
  else forDate.add(slug);
  history[date] = [...forDate];
  writeHistory(history);
}

/** Число подряд идущих дней (включая сегодня, если отмечено), когда товар был принят. */
export function getStreak(slug: string, today: Date = new Date()): number {
  const history = readHistory();
  let streak = 0;
  const cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = todayKey(cursor);
    const takenToday = (history[key] ?? []).includes(slug);
    if (!takenToday) {
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
