"use client";

import { useState } from "react";
import { maskPhoneInput } from "@/lib/format";
import { t } from "@/lib/i18n";
import { GOAL_OPTIONS, SUBSCRIPTION_PLANS, type SubscriptionPlanInfo } from "@/lib/subscriptionPlans";

export default function SubscriptionForm({
  selectedPlan,
}: {
  selectedPlan: SubscriptionPlanInfo["id"];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [age, setAge] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [healthNotes, setHealthNotes] = useState("");
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function toggleGoal(goal: string) {
    setGoals((g) => (g.includes(goal) ? g.filter((x) => x !== goal) : [...g, goal]));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Укажите имя";
    if (phone.replace(/\D/g, "").length !== 12) errs.phone = "Неверный формат телефона";
    if (goals.length === 0) errs.goals = "Выберите хотя бы одну цель";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/subscription-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          customerName: name,
          customerPhone: phone,
          age: age ? Number(age) : null,
          goals,
          healthNotes,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.common.error);
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t.common.error);
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-bg rounded-3xl p-8 text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-green text-2xl">
          ✓
        </div>
        <div className="text-xl font-semibold tracking-tight">{t.subscription.successTitle}</div>
        <p className="text-text-dim max-w-sm">{t.subscription.successText}</p>
      </div>
    );
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-border rounded-3xl p-5 sm:p-8 flex flex-col gap-5"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xl font-semibold tracking-tight">{t.subscription.formTitle}</div>
          <p className="text-sm text-text-dim mt-1">{t.subscription.formSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-bg-panel rounded-lg pl-1 pr-3 py-1 shrink-0">
          <span className="bg-accent text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
            {plan.name}
          </span>
          <a href="#plans" className="text-xs link-action">
            Изменить
          </a>
        </div>
      </div>

      <div className="grid sm:grid-cols-[1.3fr_1.3fr_1fr] gap-4">
        <Field label={t.subscription.name} error={fieldErrors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.subscription.namePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>

        <Field label={t.subscription.phone} error={fieldErrors.phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
            placeholder="+998 (XX) XXX-XX-XX"
            inputMode="numeric"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>

        <Field label={t.subscription.age}>
          <input
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
            placeholder={t.subscription.agePlaceholder}
            inputMode="numeric"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>
      </div>

      <Field label={t.subscription.goalsLabel} error={fieldErrors.goals}>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((goal) => {
            const active = goals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  active
                    ? "bg-accent/10 text-accent border-accent"
                    : "bg-bg-panel text-text border-border hover:border-accent/50"
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={t.subscription.healthNotes}>
        <textarea
          value={healthNotes}
          onChange={(e) => setHealthNotes(e.target.value)}
          placeholder={t.subscription.healthNotesPlaceholder}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </Field>

      <Field label={t.subscription.comment}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.subscription.commentPlaceholder}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl bg-bg-panel border border-border resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </Field>

      {error && (
        <div className="bg-red-bg border border-red/30 text-red rounded-xl px-4 py-2.5 text-sm">{error}</div>
      )}

      <button
        disabled={submitting}
        className="px-4 py-3.5 rounded-lg btn btn-primary font-semibold disabled:opacity-60"
      >
        {submitting ? t.subscription.submitting : `${t.subscription.submit} · ${plan.name}`}
      </button>

      <p className="text-xs text-text-dim">{t.subscription.disclaimer}</p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-1.5">{label}</div>
      {children}
      {error && <div className="text-xs text-red mt-1">{error}</div>}
    </div>
  );
}
