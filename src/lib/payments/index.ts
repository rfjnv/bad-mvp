import { createPaymeProvider } from "./payme";
import { createClickProvider } from "./click";
import type { PaymentProvider } from "./types";

export * from "./types";

export function getPaymentProvider(method: "PAYME" | "CLICK"): PaymentProvider {
  return method === "PAYME" ? createPaymeProvider() : createClickProvider();
}
