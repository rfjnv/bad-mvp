"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TelegramLogin from "@/components/TelegramLogin";

interface PlanItem {
  name: string;
  brand: string;
  imageUrl: string;
  dosage: string;
  durationDays: number | null;
}

function planText(items: PlanItem[], comment: string | null): string {
  const lines = items.map((i) => `• ${i.name} — ${i.dosage}`);
  const parts = ["План приёма:", ...lines];
  if (comment) parts.push("", comment);
  return parts.join("\n");
}

export default function PlanClient({
  token,
  items,
  comment: initialComment,
  claimed: initialClaimed,
  isOwner,
  botUsername,
  compatibilityNotes,
}: {
  token: string;
  items: PlanItem[];
  comment: string | null;
  claimed: boolean;
  isOwner: boolean;
  botUsername: string | null;
  compatibilityNotes: string[];
}) {
  const router = useRouter();
  const [comment, setComment] = useState(initialComment ?? "");
  const [claimed, setClaimed] = useState(initialClaimed);
  const [savingComment, setSavingComment] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState<string | null>(null);

  async function saveComment() {
    setSavingComment(true);
    setCommentSaved(false);
    const res = await fetch(`/api/plan/${token}/comment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    setSavingComment(false);
    if (res.ok) {
      setCommentSaved(true);
      setTimeout(() => setCommentSaved(false), 1500);
    }
  }

  async function afterLogin() {
    setClaiming(true);
    setError(null);
    const res = await fetch(`/api/plan/${token}/claim`, { method: "POST" });
    setClaiming(false);
    if (res.ok) {
      setClaimed(true);
      router.push("/tracker");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Не удалось принять план");
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(planText(items, comment || null));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен — молча игнорируем, текст всё равно на странице
    }
  }

  async function revoke() {
    if (!confirm("Старая ссылка перестанет работать, будет создана новая. Продолжить?")) return;
    const res = await fetch(`/api/plan/${token}/revoke`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setRevoked(data.token);
    }
  }

  if (revoked) {
    const newUrl = typeof window !== "undefined" ? `${window.location.origin}/plan/${revoked}` : `/plan/${revoked}`;
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col gap-4 text-center">
        <h1 className="display-2">Ссылка обновлена</h1>
        <p className="text-text-dim">Старая ссылка больше не работает. Новая:</p>
        <div className="bg-bg-panel rounded-xl p-4 font-mono text-sm break-all">{newUrl}</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">
      <header>
        <h1 className="display-2">План приёма</h1>
        {isOwner && <p className="text-text-dim mt-1">Это ваша ссылка — можно поделиться и добавить комментарий.</p>}
      </header>

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {items.map((i) => (
          <li key={i.name} className="flex items-center gap-3 py-3">
            <span className="relative w-12 h-12 rounded-lg overflow-hidden bg-bg-panel shrink-0">
              <Image src={i.imageUrl} alt="" fill className="object-contain p-1 mix-blend-multiply" sizes="48px" />
            </span>
            <span className="min-w-0 flex-1">
              <div className="font-medium text-sm">{i.name}</div>
              <div className="text-[13px] text-text-dim">{i.dosage}</div>
            </span>
          </li>
        ))}
      </ul>

      {compatibilityNotes.length > 0 && (
        <div className="flex flex-col gap-2 bg-bg-panel rounded-xl p-4">
          <div className="text-sm font-semibold">Как удобнее принимать</div>
          {compatibilityNotes.map((note) => (
            <p key={note} className="text-sm text-text-dim">
              {note}
            </p>
          ))}
          <p className="text-xs text-text-dim border-t border-border pt-2 mt-1">
            Это не медицинская рекомендация. При хронических заболеваниях или приёме лекарств
            посоветуйтесь с врачом.
          </p>
        </div>
      )}

      {isOwner ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Личный комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например: «Пап, магний по 2 капсулы после ужина»"
            rows={3}
            maxLength={500}
            className="px-3 py-2 rounded-lg border border-border resize-none"
          />
          <button
            onClick={saveComment}
            disabled={savingComment}
            className="px-4 py-2 rounded-lg btn btn-secondary text-sm font-semibold w-max disabled:opacity-60"
          >
            {savingComment ? "Сохраняем…" : "Сохранить"}
          </button>
          {commentSaved && <span className="text-sm text-green">Сохранено</span>}
          <button onClick={revoke} className="text-sm text-red w-max mt-2">
            Отозвать ссылку и выпустить новую
          </button>
        </div>
      ) : (
        comment && (
          <div className="bg-bg-panel rounded-xl p-4 text-sm">
            <div className="text-text-dim text-xs mb-1">Комментарий</div>
            {comment}
          </div>
        )
      )}

      {!isOwner && (
        <div className="flex flex-col gap-3">
          {claimed ? (
            <p className="text-sm text-text-dim border border-border rounded-xl p-4">
              Этот план уже принят — если это не вы, попросите новую ссылку у отправителя.
            </p>
          ) : (
            <>
              {!showLogin ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-5 py-3 rounded-lg btn btn-primary font-semibold"
                >
                  Отслеживать приём
                </button>
              ) : (
                <div className="border border-border rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-sm text-text-dim">
                    Войдите через Telegram — план появится в вашем «Моём приёме» со своими напоминаниями.
                  </p>
                  <TelegramLogin botUsername={botUsername} onSuccess={afterLogin} />
                  {claiming && <p className="text-sm text-text-dim">Принимаем план…</p>}
                  {error && <p className="text-sm text-red">{error}</p>}
                </div>
              )}

              {botUsername && (
                <a
                  href={`https://t.me/${botUsername}?start=plan_${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-lg btn btn-secondary font-semibold text-center"
                >
                  Получить гайд в Telegram
                </a>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Текстом</span>
          <button onClick={copyText} className="text-sm link-action">
            {copied ? "Скопировано" : "Скопировать"}
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-bg-panel rounded-xl p-4 font-sans">
          {planText(items, comment || null)}
        </pre>
      </div>
    </div>
  );
}
