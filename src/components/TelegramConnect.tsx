"use client";

import { useEffect, useRef, useState } from "react";
import { getDeviceId } from "@/lib/device";
import { t } from "@/lib/i18n";

export default function TelegramConnect({ routineNames }: { routineNames: string[] }) {
  const [connected, setConnected] = useState(false);
  const [sandbox, setSandbox] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!connected) return;
    const deviceId = getDeviceId();
    fetch("/api/telegram/sync-routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, items: routineNames }),
    }).catch(() => null);
  }, [connected, routineNames]);

  async function startLink() {
    setLoading(true);
    const deviceId = getDeviceId();
    const res = await fetch("/api/telegram/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    const data = await res.json();
    setLoading(false);
    setLinked(true);
    setSandbox(data.sandbox);
    setDeepLink(data.deepLink);
    setConnected(data.connected);

    if (!data.connected && !data.sandbox) {
      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`/api/telegram/status?deviceId=${deviceId}`);
        const statusData = await statusRes.json();
        if (statusData.connected) {
          setConnected(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 3000);
    }
  }

  async function simulateConnect() {
    setLoading(true);
    const deviceId = getDeviceId();
    const res = await fetch("/api/telegram/simulate-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    setLoading(false);
    if (res.ok) setConnected(true);
  }

  if (connected) {
    return (
      <div className="bg-green-bg rounded-2xl p-4 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-green shrink-0">✓</span>
        <p className="text-sm text-text">{t.tracker.telegramConnected}</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-panel rounded-2xl p-4 flex flex-col gap-3">
      <div className="text-sm font-semibold">{t.tracker.telegramTitle}</div>

      {!linked ? (
        <button
          onClick={startLink}
          disabled={loading}
          className="px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-60 w-max"
        >
          {t.tracker.telegramConnect}
        </button>
      ) : sandbox ? (
        <>
          <p className="text-xs text-text-dim">{t.tracker.telegramSandboxNote}</p>
          <button
            onClick={simulateConnect}
            disabled={loading}
            className="px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-60 w-max"
          >
            {t.tracker.telegramSimulate}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-text-dim">{t.tracker.telegramInstructions}</p>
          {deepLink && (
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold w-max"
            >
              {t.tracker.telegramOpenBot}
            </a>
          )}
          <p className="text-xs text-text-dim">{t.tracker.telegramWaiting}</p>
        </>
      )}
    </div>
  );
}
