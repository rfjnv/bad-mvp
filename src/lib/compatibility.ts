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

  return matches;
}

/** Правила, где `categorySlug` встречается среди совпадений для набора `items`. */
export function findInteractionsForCategory(
  categorySlug: string,
  items: CompatibilityItem[]
): InteractionMatch[] {
  return findInteractions(items).filter((r) => r.categories.includes(categorySlug));
}
