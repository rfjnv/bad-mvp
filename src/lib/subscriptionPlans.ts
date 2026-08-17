export interface SubscriptionPlanInfo {
  id: "BASIC" | "COMPLEX" | "PREMIUM";
  name: string;
  discountPct: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanInfo[] = [
  {
    id: "BASIC",
    name: "Базовый",
    discountPct: 10,
    tagline: "1 товар на ваш выбор каждый месяц",
    features: [
      "Скидка 10% на выбранный товар",
      "Бесплатная доставка каждый месяц",
      "Отмена или пауза в любой момент",
    ],
  },
  {
    id: "COMPLEX",
    name: "Комплекс",
    discountPct: 15,
    tagline: "До 3 товаров под вашу цель",
    highlighted: true,
    features: [
      "Скидка 15% на все товары комплекса",
      "Бесплатная доставка каждый месяц",
      "Базовый план приёма от нашей команды",
      "Приоритетная поддержка по телефону",
    ],
  },
  {
    id: "PREMIUM",
    name: "Премиум",
    discountPct: 20,
    tagline: "Полный план без ограничений по составу",
    features: [
      "Скидка 20% на весь состав подписки",
      "Бесплатная доставка каждый месяц",
      "Индивидуальный план приёма от нутрициолога",
      "Ежемесячная корректировка плана",
      "Приоритетная поддержка по телефону",
    ],
  },
];

export const GOAL_OPTIONS = [
  "Иммунитет",
  "Энергия и тонус",
  "Сон и стресс",
  "Суставы и связки",
  "Кожа, волосы, ногти",
  "Пищеварение",
  "Спорт и восстановление",
  "Женское здоровье",
] as const;

export function planById(id: string): SubscriptionPlanInfo | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}
