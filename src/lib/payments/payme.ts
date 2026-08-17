import crypto from "crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookVerifyResult,
} from "./types";

const PAYME_CHECKOUT_BASE = "https://checkout.paycom.uz";

export function createPaymeProvider(): PaymentProvider {
  const merchantId = process.env.PAYME_MERCHANT_ID || "";
  const secretKey = process.env.PAYME_SECRET_KEY || "";
  const sandbox = !merchantId || !secretKey;

  return {
    id: "PAYME",
    sandbox,

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      if (sandbox) {
        return {
          paymentUrl: `/payment/sandbox/${input.orderId}?provider=PAYME`,
          providerPaymentId: `sandbox_payme_${input.orderId}`,
          sandbox: true,
        };
      }

      // Боевой Payme: сумма передаётся в тийинах (сум * 100), параметры кодируются в base64
      const params = `m=${merchantId};ac.order_id=${input.orderId};a=${input.amount * 100}`;
      const encoded = Buffer.from(params).toString("base64");
      return {
        paymentUrl: `${PAYME_CHECKOUT_BASE}/${encoded}`,
        providerPaymentId: input.orderId,
        sandbox: false,
      };
    },

    async verifyCallback(payload: unknown, signature: string | null): Promise<WebhookVerifyResult> {
      if (sandbox) {
        return { valid: true };
      }
      // Payme авторизует вебхуки через Basic Auth: base64("Paycom:" + secretKey)
      const expected = "Basic " + Buffer.from(`Paycom:${secretKey}`).toString("base64");
      if (!signature || signature !== expected) {
        return { valid: false, reason: "Неверная подпись Payme (Basic Auth)" };
      }
      return { valid: true };
    },

    async handleWebhook(payload: unknown) {
      const body = payload as {
        method?: string;
        params?: { account?: { order_id?: string }; amount?: number };
      };
      const orderId = body?.params?.account?.order_id;
      if (!orderId) return null;

      if (body?.method === "PerformTransaction") {
        return { orderId, status: "PAID" as const };
      }
      if (body?.method === "CancelTransaction") {
        return { orderId, status: "FAILED" as const };
      }
      return null;
    },
  };
}

export function paymeSignature(secretKey: string, data: string): string {
  return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
}
