export const CATEGORY_COLORS: Record<string, string> = {
  "vitamin-d": "#e8a93e",
  "omega-3": "#3e8fe8",
  magnesium: "#4f9d6e",
  zinc: "#8a8a92",
  collagen: "#d9738a",
  probiotics: "#3ab5b0",
  "b-complex": "#a970d6",
  iron: "#c07a3e",
  sport: "#e8674d",
  immunity: "#3eb87a",
};

export function categoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? "#0071e3";
}
