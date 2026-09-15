import { computeDuration, type UnitType } from "@/lib/duration";

/**
 * Порог плотности отметок, при котором остатку банки по факту (TAKEN)
 * можно доверять больше, чем календарю. Ниже порога — человек отмечается
 * слишком редко, чтобы отметки что-то значили; календарь надёжнее.
 * Конфиг, а не магическое число в логике — см. обсуждение в чате.
 */
export const MARK_DENSITY_THRESHOLD = 0.8;

export interface IntakeMark {
  date: string; // YYYY-MM-DD
  status: "TAKEN" | "SKIPPED";
}

export interface RoutineItemForStats {
  createdAt: Date;
  pausedAt: Date | null;
  product: {
    unitsPerPack: number | null;
    dailyDose: number | null;
    unitType: UnitType | null;
    price: number;
  };
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Дни на паузе за период — вычитаются и из знаменателя «N из M», и из
 * календарного расчёта остатка банки. Пауза может быть только «сейчас»
 * (pausedAt) — истории пауз не храним, этого достаточно для обеих задач.
 */
function pausedDaysInRange(pausedAt: Date | null, from: Date, to: Date, now: Date): number {
  if (!pausedAt) return 0;
  const pauseStart = pausedAt < from ? from : pausedAt;
  const pauseEnd = now < to ? now : to;
  if (pauseStart > pauseEnd) return 0;
  return daysBetween(pauseStart, pauseEnd) + 1;
}

export interface Streaks {
  current: number;
  best: number;
}

/**
 * Серии — по фактическим отметкам, день без отметки рвёт серию (кроме
 * сегодняшнего дня, который ещё не закончился, и дней на паузе, которые
 * просто не считаются). Это ожидаемое поведение трекера, отдельно от
 * остатка банки — см. обсуждение в чате, почему их нельзя мешать.
 */
export function computeStreaks(marks: IntakeMark[], startedAt: Date, pausedAt: Date | null, now: Date): Streaks {
  const byDate = new Map(marks.map((m) => [m.date, m.status]));
  const pausedKey = pausedAt ? dateKey(pausedAt) : null;

  // Текущая серия — назад от сегодня; сегодня без отметки не считается разрывом
  let current = 0;
  const cursor = new Date(now);
  for (let i = 0; i < 730; i++) {
    const key = dateKey(cursor);
    if (parseDateKey(key) < startedAt) break;
    if (pausedKey && key >= pausedKey) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const status = byDate.get(key);
    if (status === "TAKEN") {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (i === 0 && status === undefined) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  // Лучшая серия — вперёд по всей истории с начала позиции
  let best = 0;
  let running = 0;
  const walker = new Date(startedAt);
  while (walker <= now) {
    const key = dateKey(walker);
    if (pausedKey && key >= pausedKey) {
      walker.setDate(walker.getDate() + 1);
      continue;
    }
    if (byDate.get(key) === "TAKEN") {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
    walker.setDate(walker.getDate() + 1);
  }
  best = Math.max(best, current);

  return { current, best };
}

export type DayStatus = "taken" | "skipped" | "paused" | "unmarked" | "future";

/** Компактная сетка за N дней — календарь принято/пропущено/не начато */
export function computeCalendar(
  marks: IntakeMark[],
  startedAt: Date,
  pausedAt: Date | null,
  now: Date,
  days: number
): { date: string; status: DayStatus }[] {
  const byDate = new Map(marks.map((m) => [m.date, m.status]));
  const pausedKey = pausedAt ? dateKey(pausedAt) : null;
  const result: { date: string; status: DayStatus }[] = [];

  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = dateKey(cursor);
    let status: DayStatus;
    if (cursor > now) status = "future";
    else if (parseDateKey(key) < startedAt) status = "future"; // до начала позиции — пусто, не «пропущено»
    else if (pausedKey && key >= pausedKey) status = "paused";
    else {
      const mark = byDate.get(key);
      status = mark === "TAKEN" ? "taken" : mark === "SKIPPED" ? "skipped" : "unmarked";
    }
    result.push({ date: key, status });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/** «Отмечено N дней из M» — M не включает будущее и паузу; N — TAKEN и SKIPPED вместе (отметился, а не «принял») */
export function computeMarkedStats(marks: IntakeMark[], startedAt: Date, pausedAt: Date | null, now: Date, periodDays: number) {
  const from = new Date(now);
  from.setDate(from.getDate() - (periodDays - 1));
  const rangeStart = from < startedAt ? startedAt : from;
  const eligible = Math.max(0, daysBetween(rangeStart, now) + 1) - pausedDaysInRange(pausedAt, rangeStart, now, now);
  const marked = marks.filter((m) => {
    const d = parseDateKey(m.date);
    return d >= rangeStart && d <= now;
  }).length;
  return { marked: Math.min(marked, eligible), total: Math.max(eligible, 0) };
}

/** Доля дней с любой отметкой (TAKEN или SKIPPED) — насколько можно доверять отметкам для остатка банки */
export function markDensity(marks: IntakeMark[], startedAt: Date, pausedAt: Date | null, now: Date): number {
  const { marked, total } = computeMarkedStats(marks, startedAt, pausedAt, now, daysBetween(startedAt, now) + 1);
  if (total <= 0) return 0;
  return marked / total;
}

export interface RemainingEstimate {
  /** Показывать пользователю — календарь или отметки, в зависимости от плотности */
  displayDays: number | null;
  /** Более ранняя из двух оценок — для планирования напоминания, независимо от плотности */
  earliestDays: number | null;
  source: "calendar" | "marks" | null;
}

/**
 * Остаток банки. Календарь — по умолчанию, отметки — только если ими
 * плотно пользуются (см. MARK_DENSITY_THRESHOLD). Для напоминания же
 * всегда берём более раннюю (меньшую) оценку из двух, если она вообще
 * вычислима — лучше напомнить на неделю раньше, чем не напомнить вовсе.
 */
export function computeRemaining(
  item: RoutineItemForStats,
  marks: IntakeMark[],
  now: Date
): RemainingEstimate {
  const d = computeDuration(item.product);
  if (!d) return { displayDays: null, earliestDays: null, source: null };

  const startedAt = item.createdAt;
  const calendarElapsed = daysBetween(startedAt, now) - pausedDaysInRange(item.pausedAt, startedAt, now, now);
  const calendarRemaining = d.days - calendarElapsed;

  const takenCount = marks.filter((m) => m.status === "TAKEN").length;
  const marksRemaining = takenCount > 0 ? d.days - takenCount : null;

  const density = markDensity(marks, startedAt, item.pausedAt, now);
  const displaySource: "calendar" | "marks" = density >= MARK_DENSITY_THRESHOLD && marksRemaining !== null ? "marks" : "calendar";
  const displayDays = displaySource === "marks" ? marksRemaining : calendarRemaining;

  const earliestDays = marksRemaining !== null ? Math.min(calendarRemaining, marksRemaining) : calendarRemaining;

  return { displayDays, earliestDays, source: displaySource };
}
