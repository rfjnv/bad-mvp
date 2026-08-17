export interface SeasonalAdvisory {
  title: string;
  text: string;
  categorySlug: string;
  categoryName: string;
  accent: string;
}

const ADVISORIES: Record<"winter" | "spring" | "summer" | "autumn", SeasonalAdvisory> = {
  winter: {
    title: "Дефицит витамина D зимой в Ташкенте",
    text: "С ноября по март солнца в разы меньше, а кожа почти не синтезирует витамин D — это сезонная норма для всего региона, а не исключение. Стоит проверить свой запас витамина D сейчас, а не в марте.",
    categorySlug: "vitamin-d",
    categoryName: "Витамин D",
    accent: "#e8a93e",
  },
  spring: {
    title: "Сезон простуд и весенней усталости",
    text: "Перепады температуры и цветение — типичная весенняя нагрузка на иммунитет. Разумно поддержать организм заранее, а не в разгар простуды.",
    categorySlug: "immunity",
    categoryName: "Для иммунитета",
    accent: "#3eb87a",
  },
  summer: {
    title: "Жара вымывает минералы",
    text: "При летних +35…+40°C в Ташкенте организм теряет магний и цинк с потом быстрее обычного — особенно если вы активны на улице. Стоит держать под рукой магний.",
    categorySlug: "magnesium",
    categoryName: "Магний",
    accent: "#4f9d6e",
  },
  autumn: {
    title: "Подготовка к сезону простуд",
    text: "Первый холодный месяц — то время, когда стоит заранее укрепить иммунитет, а не догонять простуду постфактум.",
    categorySlug: "immunity",
    categoryName: "Для иммунитета",
    accent: "#3eb87a",
  },
};

export function getSeasonalAdvisory(date: Date = new Date()): SeasonalAdvisory {
  const month = date.getMonth(); // 0 = январь

  if (month === 11 || month === 0 || month === 1) return ADVISORIES.winter;
  if (month >= 2 && month <= 4) return ADVISORIES.spring;
  if (month >= 5 && month <= 7) return ADVISORIES.summer;
  return ADVISORIES.autumn;
}
