"use client";

import { useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanInfo } from "@/lib/subscriptionPlans";
import SubscriptionForm from "./SubscriptionForm";

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanInfo["id"]>("COMPLEX");
  const formRef = useRef<HTMLDivElement>(null);

  function choosePlan(id: SubscriptionPlanInfo["id"]) {
    setSelectedPlan(id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-16">
      <section className="text-center flex flex-col items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl">
          {t.subscription.title}
        </h1>
        <p className="text-text-dim max-w-xl text-[15px] sm:text-base">{t.subscription.heroSubtitle}</p>
      </section>

      <section id="plans" className="scroll-mt-24">
        <h2 className="display-2 mb-6 text-center">
          {t.subscription.plansTitle}
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              active={selectedPlan === plan.id}
              onChoose={() => choosePlan(plan.id)}
            />
          ))}
        </div>
        <p className="text-xs text-text-dim text-center mt-5 max-w-md mx-auto">
          {t.subscription.priceNote}
        </p>
      </section>

      <section>
        <h2 className="display-2 mb-6 text-center">
          {t.subscription.howItWorksTitle}
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <Step n={1} title={t.subscription.step1Title} text={t.subscription.step1Text} />
          <Step n={2} title={t.subscription.step2Title} text={t.subscription.step2Text} />
          <Step n={3} title={t.subscription.step3Title} text={t.subscription.step3Text} />
        </div>
      </section>

      <section ref={formRef} className="scroll-mt-24">
        <SubscriptionForm selectedPlan={selectedPlan} />
      </section>
    </div>
  );
}

function PlanCard({
  plan,
  active,
  onChoose,
}: {
  plan: SubscriptionPlanInfo;
  active: boolean;
  onChoose: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl p-6 border transition-all ${
        plan.highlighted
          ? "border-border-strong border-2 bg-bg-panel"
          : "border-border bg-white"
      }`}
    >
      {plan.highlighted && (
        <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-lg w-max">
          Популярный
        </span>
      )}
      <div>
        <div className="text-lg font-semibold">{plan.name}</div>
        <p className="text-sm text-text-dim mt-1">{plan.tagline}</p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-accent">
          {t.subscription.discountBadge(plan.discountPct)}
        </span>
        <span className="text-sm text-text-dim">на состав подписки</span>
      </div>

      <ul className="flex flex-col gap-2.5 text-sm flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onChoose}
        className={`px-4 py-3 rounded-lg font-semibold text-sm border transition-colors ${
          active
            ? "bg-accent border-accent text-white hover:bg-accent-dark hover:border-accent-dark"
            : "bg-white border-accent/40 text-accent hover:border-accent hover:bg-accent/5"
        }`}
      >
        {active ? `✓ ${t.subscription.choosePlan}` : t.subscription.choosePlan}
      </button>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-3 items-center text-center sm:items-start sm:text-left">
      <span className="w-9 h-9 rounded-full bg-accent text-white text-sm font-semibold flex items-center justify-center shrink-0">
        {n}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <p className="text-sm text-text-dim mt-1">{text}</p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-green shrink-0 mt-0.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
