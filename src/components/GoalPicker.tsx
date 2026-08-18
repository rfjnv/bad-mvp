import Link from "next/link";
import { GOALS } from "@/lib/goals";

/**
 * Главный вход в каталог: не «Категории», а «Что вас беспокоит?».
 * Крупная типографика и тонкие линии вместо плашек — цель здесь и есть заголовок.
 */
export default function GoalPicker() {
  return (
    <section>
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="display-2">Что вас беспокоит?</h2>
        <p className="text-text-dim max-w-xl">
          Начните с проблемы, а не с названия витамина — покажем, что при ней обычно принимают.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
        {GOALS.map((goal) => (
          <Link
            key={goal.slug}
            href={`/catalog?goal=${goal.slug}`}
            className="group flex flex-col gap-1 sm:gap-1.5 border-b border-r border-border p-4 sm:p-5 min-h-[92px] sm:min-h-[128px] hover:bg-bg-panel transition-colors duration-150"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-lg sm:text-xl font-semibold tracking-tight">{goal.title}</span>
              <span className="text-text-dim group-hover:text-text transition-colors duration-150 shrink-0">
                <ArrowIcon />
              </span>
            </span>
            <span className="text-[13px] text-text-dim leading-relaxed">{goal.hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
