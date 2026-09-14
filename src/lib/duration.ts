/**
 * «Хватит на N дней» и «≈ X сум/день».
 *
 * Считается из явных полей товара (unitsPerPack, dailyDose), а не парсится
 * из названия при каждом показе. Длительность — единственный источник
 * правды для напоминаний «банка заканчивается» и для сравнения товаров:
 * цена за день приёма — честнее, чем цена за банку.
 */

export type UnitType = "CAPSULE" | "TABLET" | "GRAM" | "ML" | "SCOOP";

export const UNIT_LABELS: Record<UnitType, { one: string; few: string; many: string; short: string }> = {
  CAPSULE: { one: "капсула", few: "капсулы", many: "капсул", short: "капс." },
  TABLET: { one: "таблетка", few: "таблетки", many: "таблеток", short: "таб." },
  GRAM: { one: "грамм", few: "грамма", many: "граммов", short: "г" },
  ML: { one: "миллилитр", few: "миллилитра", many: "миллилитров", short: "мл" },
  SCOOP: { one: "мерная ложка", few: "мерные ложки", many: "мерных ложек", short: "мерн. л." },
};

export interface DurationInput {
  unitsPerPack: number | null;
  dailyDose: number | null;
  unitType: UnitType | null;
  price: number;
}

export interface DurationResult {
  days: number;
  pricePerDay: number;
  dailyDose: number;
  unitType: UnitType;
}

/** Округление вниз: банка, которой хватает на 99,5 дня, — это 99 дней */
export function computeDuration(p: DurationInput): DurationResult | null {
  if (!p.unitsPerPack || !p.dailyDose || !p.unitType) return null;
  if (p.unitsPerPack <= 0 || p.dailyDose <= 0) return null;
  const days = Math.floor(p.unitsPerPack / p.dailyDose);
  if (days <= 0) return null;
  return {
    days,
    pricePerDay: Math.round(p.price / days),
    dailyDose: p.dailyDose,
    unitType: p.unitType,
  };
}

export function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

function formatDose(dose: number, unit: UnitType): string {
  const l = UNIT_LABELS[unit];
  const isWhole = Number.isInteger(dose);
  const n = isWhole ? dose : dose.toString().replace(".", ",");
  const word = isWhole ? pluralRu(dose, [l.one, l.few, l.many]) : l.few;
  return `${n} ${word}`;
}

/** «Хватит примерно на 100 дней при приёме 2 капсулы в день» */
export function formatDuration(r: DurationResult): string {
  return `Хватит примерно на ${r.days} ${pluralRu(r.days, ["день", "дня", "дней"])} при приёме ${formatDose(r.dailyDose, r.unitType)} в день`;
}

/** Короткая форма для карточки в сетке: «≈ 100 дней» */
export function formatDurationShort(r: DurationResult): string {
  return `≈ ${r.days} ${pluralRu(r.days, ["день", "дня", "дней"])}`;
}

/**
 * Дата, когда закончится позиция заказа: от доставки, на quantity упаковок.
 * Если доставки ещё не было — считаем от даты заказа (доставляем в день заказа),
 * при переходе в DELIVERED пересчитываем от фактической даты.
 */
export function expectedFinishDate(from: Date, days: number, quantity: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days * Math.max(1, quantity));
  return d;
}
