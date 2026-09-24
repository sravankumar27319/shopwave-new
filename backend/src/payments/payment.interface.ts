export interface CreatePaymentSessionInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaymentSessionResult {
  provider: string;
  providerPaymentId: string;
  clientSecret?: string | undefined;
  checkoutUrl?: string | undefined;
  expiresAt?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface VerifyPaymentInput {
  orderId: string;
  providerPaymentId?: string | undefined;
  signature?: string | undefined;
  provider?: string | undefined;
  payload?: any;
}

export interface VerifyPaymentResult {
  success: boolean;
  providerPaymentId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  amount: number;
  signature?: string | undefined;
  error?: string | undefined;
}

export interface RefundInput {
  paymentId: string;
  providerPaymentId: string;
  amount: number;
  reason?: string | undefined;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: "REFUNDED" | "FAILED";
  error?: string | undefined;
}

export type WebhookEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "refund.processed"
  | "unknown";

export interface WebhookParseResult {
  eventType: WebhookEventType;
  orderId: string;
  providerPaymentId: string;
  amount: number;
  signature?: string | undefined;
  reason?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface PaymentProvider {
  readonly name: string;
  createPaymentSession(input: CreatePaymentSessionInput): Promise<PaymentSessionResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  processRefund(input: RefundInput): Promise<RefundResult>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret: string): boolean;
  parseWebhookEvent(body: any): WebhookParseResult;
}
