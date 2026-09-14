"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "confirm" | "processing" | "done";

/**
 * Нейтральный экран, без цветов/логотипов/названий Payme и Click и без
 * полей для платёжных данных — мы их не принимаем и не имитируем приём.
 * Подтверждает /api/payments/process/complete, который на сервере
 * повторно проверяет и DEMO_PAYMENTS_ENABLED, и админскую сессию.
 */
function DemoBanner() {
  return (
    <div className="sticky top-0 z-10 bg-amber-500 text-black text-center text-sm font-semibold py-2 px-4">
      Демо-режим. Деньги не списываются.
    </div>
  );
}

function DemoPaymentContent({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const provider = (searchParams.get("provider") ?? "PAYME") as "PAYME" | "CLICK";
  const router = useRouter();
  const [step, setStep] = useState<Step>("confirm");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setStep("processing");
    setError(null);
    try {
      const res = await fetch("/api/payments/process/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, provider }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Не удалось подтвердить демо-оплату");
        setStep("confirm");
        return;
      }
      setStep("done");
      setTimeout(() => router.push(`/checkout/success?orderId=${orderId}`), 600);
    } catch {
      setError("Не удалось подтвердить демо-оплату");
      setStep("confirm");
    }
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <DemoBanner />
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-6 flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold">Демонстрационная оплата</h1>
            <p className="text-sm text-text-dim mt-1">
              Заказ {orderId.slice(0, 8)} — только для показа, не платёжный шлюз.
            </p>
          </div>

          {step === "confirm" && (
            <>
              {error && <p className="text-sm text-red">{error}</p>}
              <button
                onClick={confirm}
                className="w-full py-3 rounded-lg btn btn-primary font-semibold"
              >
                Подтвердить оплату
              </button>
            </>
          )}

          {step === "processing" && (
            <div className="py-4 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin" />
              <p className="text-text-dim">Обрабатываем демо-оплату…</p>
            </div>
          )}

          {step === "done" && (
            <div className="py-4 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-2xl">
                ✓
              </div>
              <p className="font-semibold">Демо-оплата подтверждена</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DemoPaymentClient({ orderId }: { orderId: string }) {
  return (
    <Suspense>
      <DemoPaymentContent orderId={orderId} />
    </Suspense>
  );
}
