/**
 * У каждой категории свой цвет, как у линейки банок на полке: товар стоит
 * на подложке своей категории, плитка категории залита её цветом.
 * tint — фон под фото, solid — плашки и акценты, onSolid — текст на solid.
 */
export interface CategoryColor {
  tint: string;
  solid: string;
  onSolid: string;
}

const COLORS: Record<string, CategoryColor> = {
  "vitamin-d": { tint: "#fff3c4", solid: "#ffc93c", onSolid: "#0e1116" },
  "omega-3": { tint: "#dcebff", solid: "#1f6feb", onSolid: "#ffffff" },
  magnesium: { tint: "#ebe5ff", solid: "#6e56cf", onSolid: "#ffffff" },
  zinc: { tint: "#d6f3ee", solid: "#0e9384", onSolid: "#ffffff" },
  collagen: { tint: "#ffe3ec", solid: "#e5568a", onSolid: "#ffffff" },
  probiotics: { tint: "#e2f5e4", solid: "#2f9e44", onSolid: "#ffffff" },
  "b-complex": { tint: "#ffe8d6", solid: "#f76707", onSolid: "#ffffff" },
  iron: { tint: "#ffe2df", solid: "#d9372b", onSolid: "#ffffff" },
  sport: { tint: "#e9ecef", solid: "#212529", onSolid: "#ffffff" },
  immunity: { tint: "#e7f5d8", solid: "#5c940d", onSolid: "#ffffff" },
  iodine: { tint: "#d6eff4", solid: "#1098ad", onSolid: "#ffffff" },
};

const FALLBACK: CategoryColor = { tint: "#f1f3f5", solid: "#495057", onSolid: "#ffffff" };

export function categoryColor(slug: string | null | undefined): CategoryColor {
  return (slug && COLORS[slug]) || FALLBACK;
}
