import Link from "next/link";
import { GOALS } from "@/lib/goals";

/** Два входа в каталог: от ощущения (пилюли) и от образа жизни (подбор с силуэтом) */
export default function GoalPicker() {
  return (
    <section className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5">
      <div className="rounded-3xl border-2 border-text p-6 sm:p-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="display-2">Что вас беспокоит?</h2>
          <p className="text-text-dim max-w-md">Выберите, что чувствуете. Покажем, что при этом обычно принимают.</p>
        </div>
        <ul className="m-0 p-0 list-none flex flex-wrap gap-2.5">
          {GOALS.map((goal) => (
            <li key={goal.slug}>
              <Link
                href={`/catalog?goal=${goal.slug}`}
                title={goal.hint}
                className="inline-flex items-center min-h-[48px] px-5 rounded-full border-2 border-text text-[16px] font-semibold hover:bg-sun transition-colors duration-200"
              >
                {goal.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/podbor"
        className="group rounded-3xl bg-text text-white p-6 sm:p-10 flex flex-col justify-between gap-8 min-h-[260px]"
      >
        <div className="flex flex-col gap-3">
          <h2 className="display-2 text-white">Ничего не беспокоит?</h2>
          <p className="text-white/75 max-w-xs">
            Нехватку от офиса, зимы без солнца и города без моря не чувствуешь. Отметьте, как вы живёте, и посмотрите на силуэте, где это отражается.
          </p>
        </div>
        <span className="self-start inline-flex items-center gap-2 min-h-[50px] px-6 rounded-full bg-sun text-text font-semibold transition-transform duration-200 group-hover:translate-x-1">
          Пройти подбор
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
    </section>
  );
}
