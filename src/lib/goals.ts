/**
 * Подбор «Что вас беспокоит?».
 *
 * Покупатель БАД думает не категориями («Магний», «B-комплекс»), а проблемами:
 * плохо сплю, нет сил, лезут волосы. Категории остаются вторым уровнем,
 * а вход в каталог — через цель.
 *
 * Цель раскрывается в набор категорий, поэтому отдельное поле в базе не нужно:
 * достаточно связки goal → categorySlugs.
 */

export interface Goal {
  slug: string;
  title: string;
  /** Короткая формулировка на языке покупателя, не на языке химии */
  hint: string;
  categorySlugs: string[];
}

export const GOALS: Goal[] = [
  {
    slug: "sleep",
    title: "Плохо сплю",
    hint: "Тяжело засыпать, поверхностный сон, ночные пробуждения",
    categorySlugs: ["magnesium", "b-complex"],
  },
  {
    slug: "energy",
    title: "Нет сил",
    hint: "Усталость с утра, тяжело сосредоточиться, всё через силу",
    categorySlugs: ["b-complex", "iron", "vitamin-d"],
  },
  {
    slug: "immunity",
    title: "Часто болею",
    hint: "Затяжные простуды, межсезонье выбивает из строя",
    categorySlugs: ["immunity", "vitamin-d", "zinc"],
  },
  {
    slug: "skin-hair",
    title: "Кожа и волосы",
    hint: "Ломкие волосы, сухая кожа, слоятся ногти",
    categorySlugs: ["collagen", "zinc", "omega-3"],
  },
  {
    slug: "joints",
    title: "Суставы и связки",
    hint: "Хруст, скованность по утрам, нагрузка от спорта",
    categorySlugs: ["collagen", "omega-3"],
  },
  {
    slug: "digestion",
    title: "Пищеварение",
    hint: "Тяжесть, вздутие, восстановление после антибиотиков",
    categorySlugs: ["probiotics", "magnesium"],
  },
  {
    slug: "sport",
    title: "Спорт и форма",
    hint: "Восстановление после тренировок, набор массы, выносливость",
    categorySlugs: ["sport", "magnesium", "b-complex"],
  },
];

export function findGoal(slug: string | undefined): Goal | null {
  if (!slug) return null;
  return GOALS.find((g) => g.slug === slug) ?? null;
}
