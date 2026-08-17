export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number; // сум
  returnUrl: string;
}

export interface CreatePaymentResult {
  /** URL, куда редиректить покупателя для оплаты. В песочнице — внутренняя страница-заглушка. */
  paymentUrl: string;
  /** Идентификатор платежа у провайдера */
  providerPaymentId: string;
  sandbox: boolean;
}

export interface WebhookVerifyResult {
  valid: boolean;
  orderId?: string;
  status?: "PAID" | "FAILED";
  reason?: string;
}

export interface PaymentProvider {
  readonly id: "PAYME" | "CLICK";
  readonly sandbox: boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyCallback(payload: unknown, signature: string | null): Promise<WebhookVerifyResult>;
  handleWebhook(payload: unknown): Promise<{ orderId: string; status: "PAID" | "FAILED" } | null>;
}
