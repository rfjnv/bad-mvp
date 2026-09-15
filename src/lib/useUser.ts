"use client";

import { useCallback, useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  remindersEnabled: boolean;
  remindDaysBefore: number;
  remindHour: number;
  remindHourMorning: number;
  remindHourAfternoon: number;
  remindHourEvening: number;
  reminderChannelConnected: boolean;
}

export const USER_CHANGED_EVENT = "bad-mvp-user-changed";

/**
 * Текущий покупатель на клиенте. Один запрос к /api/me при монтировании
 * и переспрос по событию USER_CHANGED_EVENT — после входа и выхода.
 */
export function useUser() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(USER_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(USER_CHANGED_EVENT, refresh);
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event(USER_CHANGED_EVENT));
  }, []);

  return { user, loading: user === undefined, refresh, logout };
}
