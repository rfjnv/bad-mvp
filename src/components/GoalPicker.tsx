import Link from "next/link";
import { GOALS } from "@/lib/goals";

/**
 * Вход в каталог через жалобу — нумерованный индекс, как оглавление.
 * Подбор по образу жизни стоит отдельно и раньше: дефицит от условий
 * человек не чувствует, поэтому о нём говорит табло солнца, а не этот список.
 */
export default function GoalPicker() {
  return (
    <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 lg:gap-14">
      <div className="flex flex-col gap-3 lg:sticky lg:top-28 self-start">
        <span className="label-mono text-text-dim">Указатель</span>
        <h2 className="display-2">Что вас беспокоит?</h2>
        <p className="text-text-dim max-w-sm">
          Начните с ощущения, а не с названия витамина — покажем, что при нём обычно принимают.
        </p>
      </div>

      <ol className="m-0 p-0 list-none border-t border-text">
        {GOALS.map((goal, i) => (
          <li key={goal.slug}>
            <Link
              href={`/catalog?goal=${goal.slug}`}
              className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-border py-4 sm:py-5 hover:bg-bg-panel transition-colors duration-300 -mx-2 px-2"
            >
              <span className="label-mono text-text-dim">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[22px] sm:text-[28px] font-medium tracking-[-0.035em] leading-tight transition-transform duration-300 group-hover:translate-x-1">
                {goal.title}
              </span>
              <span className="hidden sm:block text-[14px] text-text-dim leading-snug">{goal.hint}</span>
              <span className="text-text-dim group-hover:text-amber transition-colors duration-300" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
