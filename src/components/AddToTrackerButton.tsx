"use client";

import { useEffect, useState } from "react";
import {
  addToRoutine,
  isInRoutine,
  removeFromRoutine,
  TRACKER_CHANGED_EVENT,
  type RoutineItem,
} from "@/lib/tracker";
import { t } from "@/lib/i18n";

export default function AddToTrackerButton({ item }: { item: RoutineItem }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const update = () => setAdded(isInRoutine(item.slug));
    update();
    window.addEventListener(TRACKER_CHANGED_EVENT, update);
    return () => window.removeEventListener(TRACKER_CHANGED_EVENT, update);
  }, [item.slug]);

  return (
    <button
      type="button"
      onClick={() => (added ? removeFromRoutine(item.slug) : addToRoutine(item))}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors self-start ${
        added
          ? "bg-accent/10 border-accent text-accent"
          : "bg-white border-border text-text hover:border-accent/50"
      }`}
    >
      <PlusIcon added={added} />
      {added ? t.tracker.addedButton : t.tracker.addButton}
    </button>
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
