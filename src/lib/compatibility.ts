export type InteractionType = "caution" | "synergy";

/**
 * Данные о товаре, которых достаточно для проверки совместимости —
 * категория для парных правил, состав и доза для правил, завязанных
 * на конкретное вещество, а не на категорию целиком (см. ниже, почему
 * это важно).
 */
export interface CompatibilityItem {
  categorySlug: string;
  composition: string;
  activeSubstance: string | null;
  activeAmount: number | null;
  activeUnit: string | null;
}

export interface InteractionMatch {
  key: string;
  type: InteractionType;
  message: string;
  categories: [string, string];
}

interface CategoryRule {
  categories: [string, string];
  type: InteractionType;
  message: string;
}

/**
 * Правила по категориям целиком — подходят, когда взаимодействие
 * действительно про категорию (форму минерала не разносим по товарам).
 * Правило «железо + витамин C» сюда НЕ входит: категория «для иммунитета»
 * объединяет и бузину с эхинацеей (без витамина C), и реальные источники
 * витамина C — категория не говорит, что в составе конкретного товара.
 * См. checkVitaminCSynergy ниже.
 */
const CATEGORY_RULES: CategoryRule[] = [
  {
    categories: ["iron", "zinc"],
    type: "caution",
    message: "Железо и цинк конкурируют за всасывание в кишечнике. Разнесите приём минимум на 2 часа.",
  },
  {
    categories: ["iron", "magnesium"],
    type: "caution",
    message: "Высокие дозы магния могут мешать усвоению железа. Если принимаете оба, удобнее развести их по времени суток.",
  },
  {
    categories: ["zinc", "magnesium"],
    type: "caution",
    message: "При длительном приёме высоких доз цинка возможно снижение усвоения магния. При обычных дозировках это обычно не имеет значения.",
  },
  {
    categories: ["vitamin-d", "magnesium"],
    type: "synergy",
    message: "Магний участвует в усвоении витамина D — эти две добавки обычно принимают вместе.",
  },
];

const VITAMIN_C_PATTERN = /витамин\s*c|аскорбинов|аскорбат|vitamin\s*c/i;

function hasVitaminC(item: CompatibilityItem): boolean {
  return VITAMIN_C_PATTERN.test(item.composition);
}

/**
 * Железо + витамин C — по факту наличия витамина C в составе конкретного
 * товара в наборе, не по категории. Категория «для иммунитета» этого
 * не гарантирует (см. комментарий у CATEGORY_RULES).
 */
function checkVitaminCSynergy(items: CompatibilityItem[]): InteractionMatch | null {
  const hasIron = items.some((i) => i.categorySlug === "iron");
  const hasVitC = items.some(hasVitaminC);
  if (!hasIron || !hasVitC) return null;
  return {
    key: "iron|vitaminC",
    type: "synergy",
    message: "Витамин C помогает усвоению железа — их часто принимают одновременно.",
    categories: ["iron", "iron"],
  };
}

const ZINC_HIGH_DOSE_MG = 40;

/**
 * Цинк 40 мг и выше при длительном приёме — медь усваивается хуже.
 * У NOW Zinc Picolinate 50 мг это применимо, рядом в каталоге есть
 * Jarrow Zinc Balance с медью в составе — правило заодно подсказывает решение.
 */
function checkZincHighDose(items: CompatibilityItem[]): InteractionMatch | null {
  const hasHighDoseZinc = items.some(
    (i) =>
      i.categorySlug === "zinc" &&
      i.activeAmount != null &&
      i.activeUnit === "мг" &&
      i.activeAmount >= ZINC_HIGH_DOSE_MG
  );
  if (!hasHighDoseZinc) return null;
  return {
    key: "zinc|highDose",
    type: "caution",
    message: "При длительном приёме высоких доз цинка организм хуже усваивает медь. Обратите внимание на продукты, где медь уже добавлена в состав.",
    categories: ["zinc", "zinc"],
  };
}

/** мг — самая мелкая массовая единица в каталоге, приводим к ней для суммы */
const MASS_TO_MG: Record<string, number> = { г: 1000, мг: 1, мкг: 0.001 };

/** «Магний (бисглицинат)» → «Магний» — форма не меняет вещество, для группировки не нужна */
function baseSubstanceName(s: string): string {
  return s.split("(")[0].trim();
}

function formatMg(mg: number): string {
  if (mg < 1) return `${Math.round(mg * 1000)} мкг`;
  if (mg >= 1000) return `${(mg / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} г`;
  return `${Math.round(mg * 100) / 100} мг`;
}

const IODINE_WARNING =
  "Избыток йода может нарушить работу щитовидной железы. Обычно принимают один источник йода, а не несколько.";

/**
 * Два и более товара с одним и тем же действующим веществом — суммарная
 * доза может незаметно удвоиться. Данные те же, из которых считается
 * цена за мг (activeSubstance/activeAmount/activeUnit) — ничего нового
 * не заводим. Единицы вне MASS_TO_MG (МЕ, млрд КОЕ) не складываем, если
 * они не совпадают буквально у всех товаров группы — не гадаем про
 * пересчёт международных единиц.
 */
function checkDuplicateSubstances(items: CompatibilityItem[]): InteractionMatch[] {
  const groups = new Map<string, { categorySlug: string; amounts: { amount: number; unit: string }[] }>();

  for (const item of items) {
    if (!item.activeSubstance || item.activeAmount == null || !item.activeUnit) continue;
    const key = baseSubstanceName(item.activeSubstance);
    const g = groups.get(key) ?? { categorySlug: item.categorySlug, amounts: [] };
    g.amounts.push({ amount: item.activeAmount, unit: item.activeUnit });
    groups.set(key, g);
  }

  const matches: InteractionMatch[] = [];

  for (const [substance, g] of groups) {
    if (g.amounts.length < 2) continue;

    const units = new Set(g.amounts.map((a) => a.unit));
    let doseText: string | null = null;

    if (units.size === 1) {
      // Единица уже одна и та же у всех товаров группы — считаем в ней же.
      // Йод здесь всегда в мкг: пересчёт в «1.15 мг» формально верен, но
      // так дозу йода никто не обсуждает — с этой единицей никогда и работали.
      const [unit] = units;
      const sum = g.amounts.reduce((s, a) => s + a.amount, 0);
      const rounded = Math.round(sum * 100) / 100;
      doseText = `${rounded.toLocaleString("ru-RU")} ${unit}`;
    } else if ([...units].every((u) => u in MASS_TO_MG)) {
      const sumMg = g.amounts.reduce((s, a) => s + a.amount * MASS_TO_MG[a.unit], 0);
      doseText = formatMg(sumMg);
    }
    // Разные несовместимые единицы (например МЕ у одного и мг у другого
    // в одной группе) в каталоге сейчас не встречаются — если появятся,
    // просто не покажем сумму, а не придумаем её.
    if (!doseText) continue;

    const messages = [
      `В заказе два источника одного вещества — ${substance}. Суммарно получается ${doseText} в день. Проверьте, нужна ли вам такая дозировка.`,
    ];
    if (substance === "Йод") messages.push(IODINE_WARNING);

    matches.push({
      key: `dup|${substance}`,
      type: "caution",
      message: messages.join(" "),
      categories: [g.categorySlug, g.categorySlug],
    });
  }

  return matches;
}

/** Все совпадающие правила среди товаров набора. */
export function findInteractions(items: CompatibilityItem[]): InteractionMatch[] {
  const categorySlugs = [...new Set(items.map((i) => i.categorySlug))];
  const matches: InteractionMatch[] = [];

  for (const rule of CATEGORY_RULES) {
    const [a, b] = rule.categories;
    if (categorySlugs.includes(a) && categorySlugs.includes(b)) {
      matches.push({ ...rule, key: [a, b].sort().join("|") });
    }
  }

  const vitC = checkVitaminCSynergy(items);
  if (vitC) matches.push(vitC);

  const zincDose = checkZincHighDose(items);
  if (zincDose) matches.push(zincDose);

  matches.push(...checkDuplicateSubstances(items));

  return matches;
}

/** Правила, где `categorySlug` встречается среди совпадений для набора `items`. */
export function findInteractionsForCategory(
  categorySlug: string,
  items: CompatibilityItem[]
): InteractionMatch[] {
  return findInteractions(items).filter((r) => r.categories.includes(categorySlug));
}
