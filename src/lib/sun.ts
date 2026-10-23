/**
 * Солнце над Ташкентом — расчёт, не прогноз погоды: облачность не учитывается.
 *
 * Порог 45° — «правило тени»: когда солнце ниже, тень длиннее человека,
 * UVB почти не доходит до земли и кожа почти не вырабатывает витамин D.
 */

export const TASHKENT = { lat: 41.31, lon: 69.24, utcOffset: 5 };
export const VITAMIN_D_THRESHOLD = 45;

const RAD = Math.PI / 180;

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

/** Склонение солнца и уравнение времени (минуты), формулы NOAA в упрощённом виде */
function solarParams(date: Date) {
  const g = ((2 * Math.PI) / 365) * (dayOfYear(date) - 1);
  const declination =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqTime =
    229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  return { declination, eqTime };
}

/** Местное время Ташкента в часах (12.5 = 12:30) → высота солнца в градусах */
export function elevationAt(date: Date, localHours: number): number {
  const { declination, eqTime } = solarParams(date);
  const solarMinutes = localHours * 60 + eqTime + 4 * TASHKENT.lon - 60 * TASHKENT.utcOffset;
  const hourAngle = (solarMinutes / 4 - 180) * RAD;
  const phi = TASHKENT.lat * RAD;
  const sinE = Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle);
  return Math.asin(sinE) / RAD;
}

/** Местное время солнечного полдня в часах */
export function solarNoon(date: Date): number {
  const { eqTime } = solarParams(date);
  return (720 - 4 * TASHKENT.lon - eqTime) / 60 + TASHKENT.utcOffset;
}

/** Часы, когда солнце выше порога; null — если сегодня оно до него не поднимается */
export function windowAbove(date: Date, threshold: number): { from: number; to: number } | null {
  const { declination } = solarParams(date);
  const phi = TASHKENT.lat * RAD;
  const cosH = (Math.sin(threshold * RAD) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination));
  if (cosH >= 1) return null;
  const halfHours = Math.acos(Math.max(-1, cosH)) / RAD / 15;
  const noon = solarNoon(date);
  return { from: noon - halfHours, to: noon + halfHours };
}

/** Ближайший день, когда полуденное солнце снова поднимется выше порога */
export function nextDayAbove(date: Date, threshold: number): Date | null {
  for (let i = 1; i <= 366; i++) {
    const d = new Date(date.getTime() + i * 86_400_000);
    if (elevationAt(d, solarNoon(d)) >= threshold) return d;
  }
  return null;
}

/** «Сейчас» в Ташкенте: дата и местные часы — сервер может стоять в любом поясе */
export function tashkentNow(now = new Date()): { date: Date; hours: number } {
  const local = new Date(now.getTime() + TASHKENT.utcOffset * 3_600_000);
  return { date: now, hours: local.getUTCHours() + local.getUTCMinutes() / 60 };
}

export function formatClock(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const [hh, mm] = m === 60 ? [h + 1, 0] : [h, m];
  return `${hh}:${String(mm).padStart(2, "0")}`;
}
