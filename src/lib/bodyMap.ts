/**
 * Зоны силуэта в подборе по образу жизни.
 *
 * Подпись зоны — «где вещество участвует», а не «что болит и что лечит»:
 * карта показывает, куда идёт то, чего не хватает, и не обещает эффекта.
 */

export type ZoneId = "brain" | "thyroid" | "heart" | "blood" | "muscles" | "bones" | "joints" | "immunity";

export interface BodyZone {
  id: ZoneId;
  label: string;
  /** Точка на силуэте, viewBox 0 0 320 440 */
  x: number;
  y: number;
  /** С какой стороны от фигуры стоит подпись */
  side: "left" | "right";
  /** Высота подписи — чтобы соседние не налезали друг на друга */
  labelY: number;
}

export const ZONES: BodyZone[] = [
  { id: "brain", label: "Мозг и нервы", x: 160, y: 36, side: "right", labelY: 30 },
  { id: "thyroid", label: "Щитовидная железа", x: 160, y: 74, side: "left", labelY: 70 },
  { id: "heart", label: "Сердце и сосуды", x: 172, y: 120, side: "right", labelY: 112 },
  { id: "blood", label: "Кровь и кислород", x: 104, y: 172, side: "left", labelY: 176 },
  { id: "muscles", label: "Мышцы", x: 214, y: 156, side: "right", labelY: 176 },
  { id: "bones", label: "Кости", x: 178, y: 296, side: "right", labelY: 290 },
  { id: "joints", label: "Суставы и связки", x: 142, y: 336, side: "left", labelY: 336 },
];

/** Иммунитет не точка, а контур вокруг всей фигуры */
export const IMMUNITY_LABEL = "Иммунитет";

export const CATEGORY_ZONES: Record<string, ZoneId[]> = {
  "vitamin-d": ["bones", "immunity"],
  iodine: ["thyroid"],
  "omega-3": ["heart", "brain"],
  magnesium: ["muscles", "brain"],
  "b-complex": ["brain", "blood"],
  iron: ["blood"],
  immunity: ["immunity"],
  sport: ["muscles"],
  collagen: ["joints"],
};

export function zonesForCategories(categorySlugs: string[]): Set<ZoneId> {
  return new Set(categorySlugs.flatMap((slug) => CATEGORY_ZONES[slug] ?? []));
}
