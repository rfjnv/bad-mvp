"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Экран оплаты Payme/Click — макет для показов, пока нет боевых ключей
 * провайдеров (см. sandbox-детект в src/lib/payments/{payme,click}.ts).
 * Ничего реально не списывает: подтверждение идёт на /api/payments/process/complete,
 * который на сервере ещё раз проверяет provider.sandbox и как только в
 * окружении появятся PAYME_SECRET_KEY / CLICK_SECRET_KEY — сам себя отключит.
 * Это оформление шага оплаты, а не платёжный шлюз.
 */

type Provider = "PAYME" | "CLICK";
type Step = "form" | "otp" | "processing" | "done";

const BRAND: Record<Provider, { name: string; accent: string; accentDark: string; bg: string }> = {
  PAYME: { name: "Payme", accent: "#00CDBA", accentDark: "#00A896", bg: "#EAFBFA" },
  CLICK: { name: "CLICK", accent: "#0091FF", accentDark: "#0072CC", bg: "#EAF5FF" },
};

function PayLogo({ provider }: { provider: Provider }) {
  const b = BRAND[provider];
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
        style={{ background: b.accent }}
      >
        {provider === "PAYME" ? "P" : "C"}
      </span>
      <span className="text-lg font-bold tracking-tight" style={{ color: b.accentDark }}>
        {b.name}
      </span>
    </div>
  );
}

function ProcessPaymentContent({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const provider = (searchParams.get("provider") ?? "PAYME") as Provider;
  const router = useRouter();
  const b = BRAND[provider];

  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formValid = provider === "PAYME" ? phone.replace(/\D/g, "").length >= 9 : card.replace(/\D/g, "").length >= 16;
  const otpValid = otp.length === 4;

  function submitForm() {
    if (!formValid) return;
    setError(null);
    setStep("otp");
  }

  function submitOtp() {
    if (!otpValid) {
      setError("Неверный код");
      return;
    }
    setError(null);
    setStep("processing");
  }

  useEffect(() => {
    if (step !== "processing") return;
    const timer = setTimeout(async () => {
      await fetch("/api/payments/process/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, provider }),
      });
      setStep("done");
      setTimeout(() => router.push(`/checkout/success?orderId=${orderId}`), 700);
    }, 1400);
    return () => clearTimeout(timer);
  }, [step, orderId, provider, router]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: b.bg }}>
      <div className="max-w-sm mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between">
            <PayLogo provider={provider} />
            <span className="text-xs text-text-dim">Защищённое соединение</span>
          </div>

          <div className="px-6 py-8 flex flex-col gap-5">
            {step === "form" && (
              <>
                <div>
                  <div className="text-sm text-text-dim mb-1">К оплате</div>
                  <div className="text-2xl font-bold">Заказ {orderId.slice(0, 8)}</div>
                </div>

                {provider === "PAYME" ? (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Номер телефона</span>
                    <input
                      autoFocus
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="px-3 py-3 rounded-lg border border-border text-base"
                    />
                  </label>
                ) : (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Номер карты</span>
                    <input
                      autoFocus
                      value={card}
                      onChange={(e) => setCard(e.target.value)}
                      placeholder="8600 0000 0000 0000"
                      inputMode="numeric"
                      className="px-3 py-3 rounded-lg border border-border text-base font-mono tracking-wider"
                    />
                  </label>
                )}

                <button
                  onClick={submitForm}
                  disabled={!formValid}
                  className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-40"
                  style={{ background: b.accent }}
                >
                  Продолжить
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <div>
                  <div className="text-sm text-text-dim mb-1">Код из SMS</div>
                  <div className="text-sm">
                    Отправили на {provider === "PAYME" ? phone : "номер, привязанный к карте"}
                  </div>
                </div>
                <input
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  inputMode="numeric"
                  className="px-3 py-3 rounded-lg border border-border text-2xl font-mono tracking-[0.5em] text-center"
                />
                {error && <p className="text-sm text-red">{error}</p>}
                <button
                  onClick={submitOtp}
                  disabled={!otpValid}
                  className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-40"
                  style={{ background: b.accent }}
                >
                  Подтвердить
                </button>
              </>
            )}

            {step === "processing" && (
              <div className="py-6 flex flex-col items-center gap-4">
                <div
                  className="w-10 h-10 border-4 rounded-full animate-spin"
                  style={{ borderColor: `${b.accent}33`, borderTopColor: b.accent }}
                />
                <p className="text-text-dim">Обрабатываем платёж…</p>
              </div>
            )}

            {step === "done" && (
              <div className="py-6 flex flex-col items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl"
                  style={{ background: b.accent }}
                >
                  ✓
                </div>
                <p className="font-semibold">Оплачено</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProcessPaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return (
    <Suspense>
      <ProcessPaymentContent orderId={orderId} />
    </Suspense>
  );
}
