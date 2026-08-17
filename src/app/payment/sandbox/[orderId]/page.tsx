"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";

function SandboxPaymentContent({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const provider = (searchParams.get("provider") ?? "PAYME") as "PAYME" | "CLICK";
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "done">("processing");

  useEffect(() => {
    const timer = setTimeout(async () => {
      await fetch("/api/payments/sandbox/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, provider }),
      });
      setStatus("done");
      router.push(`/checkout/success?orderId=${orderId}`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [orderId, provider, router]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin" />
      <p className="text-text-dim">
        {status === "processing" ? t.checkout.processingPayment : "Готово"}
      </p>
      <p className="text-xs text-text-dim">
        Режим песочницы — {provider === "PAYME" ? "Payme" : "Click"}. Боевых ключей нет, оплата
        подтверждается автоматически.
      </p>
    </div>
  );
}

export default function SandboxPaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return (
    <Suspense>
      <SandboxPaymentContent orderId={orderId} />
    </Suspense>
  );
}
