/**
 * Своя иконка для каждой категории.
 * Раньше во всех десяти плитках стояла одна и та же капсула — это читалось
 * как незакрытый плейсхолдер. Иконки монохромные и линейные, без цветных
 * подложек: цвет в этой сетке несёт разделительные линии, а не плашки.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...STROKE} aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  // Витамин D — солнце
  "vitamin-d": (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </Svg>
  ),
  // Омега-3 — рыба
  "omega-3": (
    <Svg>
      <path d="M3 12c3-4.5 7-6.5 11-6.5 2.7 0 4.6 1 5.6 2.2-1 1.4-1.4 2.9-1.4 4.3s.4 2.9 1.4 4.3c-1 1.2-2.9 2.2-5.6 2.2-4 0-8-2-11-6.5Z" />
      <path d="M3 12l-1.2-3M3 12l-1.2 3" />
      <circle cx="16.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  ),
  // Магний — химический элемент в шестиугольнике
  magnesium: (
    <Svg>
      <path d="M12 2.6l8.1 4.7v9.4L12 21.4 3.9 16.7V7.3z" />
      <path d="M8.6 14.4V9.6l3.4 3 3.4-3v4.8" />
    </Svg>
  ),
  // Цинк — кристалл
  zinc: (
    <Svg>
      <path d="M12 2.5l6.5 5-2.4 12h-8.2L5.5 7.5z" />
      <path d="M5.5 7.5h13M12 2.5v17" />
    </Svg>
  ),
  // Коллаген — упругая спираль
  collagen: (
    <Svg>
      <path d="M7 3c0 3.5 10 3.5 10 7s-10 3.5-10 7 10 3.5 10 4" />
      <path d="M7 21h10M7 3h10" />
    </Svg>
  ),
  // Пробиотики — микроорганизмы
  probiotics: (
    <Svg>
      <ellipse cx="9" cy="9.5" rx="4.5" ry="3.2" transform="rotate(-30 9 9.5)" />
      <ellipse cx="15" cy="15" rx="4.5" ry="3.2" transform="rotate(-30 15 15)" />
      <path d="M6.2 6.2l-1.4-1.4M11.8 5.5l1-1.6M18.2 17.8l1.4 1.4M12.2 18.5l-1 1.6" />
    </Svg>
  ),
  // B-комплекс — стопка таблеток
  "b-complex": (
    <Svg>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
      <path d="M5 12.5v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
    </Svg>
  ),
  // Железо — капля крови
  iron: (
    <Svg>
      <path d="M12 2.8s6 6.4 6 10.4a6 6 0 0 1-12 0c0-4 6-10.4 6-10.4Z" />
      <path d="M9.4 13.8a2.7 2.7 0 0 0 2.6 3.2" />
    </Svg>
  ),
  // Спортивное питание — гантель
  sport: (
    <Svg>
      <path d="M2.5 9.5v5M5.5 7.5v9M18.5 7.5v9M21.5 9.5v5" />
      <path d="M5.5 12h13" />
    </Svg>
  ),
  // Иммунитет — щит
  immunity: (
    <Svg>
      <path d="M12 2.6l7.5 3v6c0 4.6-3.2 8.3-7.5 9.8-4.3-1.5-7.5-5.2-7.5-9.8v-6z" />
      <path d="M9 11.8l2.1 2.2 4-4.2" />
    </Svg>
  ),
};

// Запасной вариант для категорий, добавленных через админку
const FALLBACK = (
  <Svg>
    <rect x="6.5" y="2.8" width="11" height="18.4" rx="5.5" />
    <path d="M6.5 12h11" />
  </Svg>
);

export default function CategoryIcon({ slug }: { slug: string }) {
  return <>{ICONS[slug] ?? FALLBACK}</>;
}
