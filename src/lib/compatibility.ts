export type InteractionType = "caution" | "synergy";

export interface InteractionRule {
  categories: [string, string];
  type: InteractionType;
  message: string;
}

/**
 * Справочные правила сочетаемости по категориям (не по конкретным брендам).
 * Это общеизвестные взаимодействия минералов и витаминов, не медицинское
 * назначение — итоговое решение всегда за консультацией врача/фармацевта.
 */
export const INTERACTION_RULES: InteractionRule[] = [
  {
    categories: ["iron", "zinc"],
    type: "caution",
    message: "Железо и цинк конкурируют за всасывание в кишечнике. Разнесите приём минимум на 2 часа.",
  },
  {
    categories: ["iron", "magnesium"],
    type: "caution",
    message: "Магний может снижать усвоение железа при одновременном приёме — лучше в разное время суток.",
  },
  {
    categories: ["zinc", "magnesium"],
    type: "caution",
    message: "При длительном приёме высоких доз цинк и магний могут снижать усвоение друг друга.",
  },
  {
    categories: ["vitamin-d", "magnesium"],
    type: "synergy",
    message: "Магний участвует в усвоении витамина D — хорошее сочетание, можно принимать вместе.",
  },
  {
    categories: ["iron", "immunity"],
    type: "synergy",
    message: "Витамин C улучшает усвоение железа — если в составе есть его источник, это удачное сочетание.",
  },
];

export interface InteractionMatch extends InteractionRule {
  key: string;
}

function ruleKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

/** Все совпадающие правила среди пар категорий, присутствующих в наборе. */
export function findInteractions(categorySlugs: string[]): InteractionMatch[] {
  const unique = [...new Set(categorySlugs)];
  const matches: InteractionMatch[] = [];
  const seen = new Set<string>();

  for (const rule of INTERACTION_RULES) {
    const [a, b] = rule.categories;
    if (unique.includes(a) && unique.includes(b)) {
      const key = ruleKey(a, b);
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({ ...rule, key });
      }
    }
  }

  return matches;
}

/** Правила, где `categorySlug` встречается в паре с чем-то из `otherCategorySlugs`. */
export function findInteractionsForCategory(
  categorySlug: string,
  otherCategorySlugs: string[]
): InteractionMatch[] {
  return findInteractions([categorySlug, ...otherCategorySlugs]).filter((r) =>
    r.categories.includes(categorySlug)
  );
}
