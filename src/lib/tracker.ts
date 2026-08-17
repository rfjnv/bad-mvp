export interface RoutineItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  dosage: string;
}

const ROUTINE_KEY = "bad-mvp-tracker-routine";
const HISTORY_KEY = "bad-mvp-tracker-history";
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
    const raw = window.localStorage.getItem(ROUTINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRoutine(items: RoutineItem[]): void {
  window.localStorage.setItem(ROUTINE_KEY, JSON.stringify(items));
  notify();
}

export function isInRoutine(productId: string): boolean {
  return getRoutine().some((r) => r.productId === productId);
}

export function addToRoutine(item: RoutineItem): void {
  const routine = getRoutine();
  if (routine.some((r) => r.productId === item.productId)) return;
  writeRoutine([...routine, item]);
}

export function removeFromRoutine(productId: string): void {
  writeRoutine(getRoutine().filter((r) => r.productId !== productId));
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

export function toggleCheck(productId: string, date: string): void {
  const history = readHistory();
  const forDate = new Set(history[date] ?? []);
  if (forDate.has(productId)) forDate.delete(productId);
  else forDate.add(productId);
  history[date] = [...forDate];
  writeHistory(history);
}

/** Число подряд идущих дней (включая сегодня, если отмечено), когда товар был принят. */
export function getStreak(productId: string, today: Date = new Date()): number {
  const history = readHistory();
  let streak = 0;
  const cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = todayKey(cursor);
    const takenToday = (history[key] ?? []).includes(productId);
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
