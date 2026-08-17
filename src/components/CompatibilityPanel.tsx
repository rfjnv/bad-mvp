import type { InteractionMatch } from "@/lib/compatibility";
import { t } from "@/lib/i18n";

export default function CompatibilityPanel({ matches }: { matches: InteractionMatch[] }) {
  if (matches.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-text-dim uppercase tracking-wide">
        {t.cart.compatibilityTitle}
      </div>
      {matches.map((m) => (
        <div
          key={m.key}
          className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ${
            m.type === "caution" ? "bg-red-bg text-red" : "bg-green-bg text-green"
          }`}
        >
          <span className="shrink-0 mt-0.5">{m.type === "caution" ? <WarnIcon /> : <CheckIcon />}</span>
          <span className="text-text">{m.message}</span>
        </div>
      ))}
      <p className="text-xs text-text-dim">{t.cart.compatibilityHint}</p>
    </div>
  );
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
