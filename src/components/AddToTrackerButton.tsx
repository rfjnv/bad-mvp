"use client";

import { useEffect, useState } from "react";
import {
  addToRoutine,
  isInRoutine,
  removeFromRoutine,
  TRACKER_CHANGED_EVENT,
  type RoutineItem,
} from "@/lib/tracker";
import { useUser } from "@/lib/useUser";
import { ROUTINE_CHANGED_EVENT } from "@/lib/useTracker";
import { t } from "@/lib/i18n";

/**
 * «В мой приём». Вошедший — в аккаунт на сервере, гость — в localStorage.
 * Под кнопкой объясняем, что это: ревью отметило, что сильнейшая кнопка
 * сайта была оформлена как второстепенная и без пояснения.
 */
export default function AddToTrackerButton({ item }: { item: RoutineItem }) {
  const { user, loading } = useUser();
  const [added, setAdded] = useState(false);
  const server = Boolean(user);

  useEffect(() => {
    if (loading) return;
    if (!server) {
      const update = () => setAdded(isInRoutine(item.slug));
      update();
      window.addEventListener(TRACKER_CHANGED_EVENT, update);
      return () => window.removeEventListener(TRACKER_CHANGED_EVENT, update);
    }
    const load = () =>
      fetch("/api/me/routine")
        .then((r) => r.json())
        .then((d) => setAdded((d.items ?? []).some((i: { slug: string }) => i.slug === item.slug)));
    load();
    window.addEventListener(ROUTINE_CHANGED_EVENT, load);
    return () => window.removeEventListener(ROUTINE_CHANGED_EVENT, load);
  }, [item.slug, server, loading]);

  async function toggle() {
    if (!server) {
      if (added) removeFromRoutine(item.slug);
      else addToRoutine(item);
      return;
    }
    setAdded(!added);
    await fetch("/api/me/routine", {
      method: added ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug }),
    });
    window.dispatchEvent(new Event(ROUTINE_CHANGED_EVENT));
  }

  return (
    <div className="flex flex-col gap-1.5 self-start">
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-sm font-medium border transition-colors duration-150 ${
          added
            ? "bg-bg-panel border-border-strong text-text"
            : "bg-white border-border text-text hover:border-border-strong"
        }`}
      >
        <PlusIcon added={added} />
        {added ? t.tracker.addedButton : t.tracker.addButton}
      </button>
      <span className="text-[12px] text-text-dim">
        {server
          ? "Отмечайте приём каждый день — список на всех ваших устройствах"
          : "Ежедневные отметки приёма и напоминание, когда банка закончится"}
      </span>
    </div>
  );
}

function PlusIcon({ added }: { added: boolean }) {
  if (added) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
