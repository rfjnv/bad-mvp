import crypto from "crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookVerifyResult,
} from "./types";

const CLICK_CHECKOUT_BASE = "https://my.click.uz/services/pay";

export function createClickProvider(): PaymentProvider {
  const merchantId = process.env.CLICK_MERCHANT_ID || "";
  const serviceId = process.env.CLICK_SERVICE_ID || "";
  const secretKey = process.env.CLICK_SECRET_KEY || "";
  const sandbox = !merchantId || !serviceId || !secretKey;

  return {
    id: "CLICK",
    sandbox,

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      if (sandbox) {
        return {
          paymentUrl: `/payment/sandbox/${input.orderId}?provider=CLICK`,
          providerPaymentId: `sandbox_click_${input.orderId}`,
          sandbox: true,
        };
      }

      const url = new URL(CLICK_CHECKOUT_BASE);
      url.searchParams.set("service_id", serviceId);
      url.searchParams.set("merchant_id", merchantId);
      url.searchParams.set("amount", String(input.amount));
      url.searchParams.set("transaction_param", input.orderId);
      url.searchParams.set("return_url", input.returnUrl);
      return {
        paymentUrl: url.toString(),
        providerPaymentId: input.orderId,
        sandbox: false,
      };
    },

    async verifyCallback(payload: unknown): Promise<WebhookVerifyResult> {
      if (sandbox) return { valid: true };

      const body = payload as Record<string, string | number | undefined>;
      const {
        click_trans_id,
        service_id,
        merchant_trans_id,
        amount,
        action,
        sign_time,
        sign_string,
      } = body;

      const raw =
        `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}` +
        `${amount}${action}${sign_time}`;
      const expected = crypto.createHash("md5").update(raw).digest("hex");

      if (expected !== sign_string) {
        return { valid: false, reason: "Неверная подпись Click (sign_string)" };
      }
      return { valid: true, orderId: String(merchant_trans_id ?? "") };
    },

    async handleWebhook(payload: unknown) {
      const body = payload as { merchant_trans_id?: string; action?: number | string };
      const orderId = body?.merchant_trans_id;
      if (!orderId) return null;

      // action: 0 = Prepare, 1 = Complete в реальном протоколе Click
      const action = Number(body.action);
      if (action === 1) return { orderId, status: "PAID" as const };
      return { orderId, status: "FAILED" as const };
    },
  };
}
