import Link from "next/link";
import type { SeasonalAdvisory } from "@/lib/seasonal";

function tint(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export default function SeasonalAdvisoryCard({ advisory }: { advisory: SeasonalAdvisory }) {
  const bg = tint(advisory.accent, 0.92);

  return (
    <div className="rounded-3xl p-4 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-3 sm:contents">
        <span
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: tint(advisory.accent, 0.75) }}
        >
          <SunIcon color={advisory.accent} />
        </span>
        <div
          className="text-xs font-semibold uppercase tracking-wide sm:hidden"
          style={{ color: advisory.accent }}
        >
          Сезонная рекомендация
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="hidden sm:block text-xs font-semibold uppercase tracking-wide mb-1"
          style={{ color: advisory.accent }}
        >
          Сезонная рекомендация
        </div>
        <h2 className="text-base sm:text-xl font-semibold tracking-tight mb-1 sm:mb-1.5">{advisory.title}</h2>
        <p className="text-sm text-text-dim max-w-2xl line-clamp-2 sm:line-clamp-none">{advisory.text}</p>
      </div>
      <Link
        href={`/catalog?category=${advisory.categorySlug}`}
        className="shrink-0 self-start sm:self-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white border border-border text-sm font-semibold hover:bg-bg-panel transition-colors text-center"
      >
        Смотреть {advisory.categoryName}
      </Link>
    </div>
  );
}

function SunIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
