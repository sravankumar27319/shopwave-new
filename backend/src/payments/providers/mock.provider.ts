import crypto from "crypto";
import type {
  PaymentProvider,
  CreatePaymentSessionInput,
  PaymentSessionResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
  RefundInput,
  RefundResult,
  WebhookParseResult,
} from "../payment.interface.js";
import { logger } from "../../utils/logger.js";

export class MockPaymentProvider implements PaymentProvider {
  public readonly name = "mock";
  private readonly secretKey: string;

  constructor(secretKey = "shopwave-mock-secret-key") {
    this.secretKey = process.env["PAYMENT_MOCK_SECRET"] || secretKey;
  }

  public async createPaymentSession(
    input: CreatePaymentSessionInput
  ): Promise<PaymentSessionResult> {
    const providerPaymentId = `mock_pay_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const clientSecret = `mock_sec_${crypto.randomBytes(16).toString("hex")}`;

    logger.info("Mock payment session created", {
      orderId: input.orderId,
      amount: input.amount,
      providerPaymentId,
    });

    return {
      provider: this.name,
      providerPaymentId,
      clientSecret,
      checkoutUrl: `https://checkout.shopwave.test/pay/${providerPaymentId}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      metadata: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
      },
    };
  }

  public async verifyPayment(
    input: VerifyPaymentInput
  ): Promise<VerifyPaymentResult> {
    const providerPaymentId = input.providerPaymentId || `mock_pay_${Date.now()}`;

    // Fail simulation if explicit payload asks for it or test failure token provided
    if (
      input.payload?.simulateFailure ||
      input.providerPaymentId === "mock_fail" ||
      input.signature === "invalid_signature"
    ) {
      logger.warn("Mock payment verification failed as requested", {
        orderId: input.orderId,
        providerPaymentId,
      });

      return {
        success: false,
        providerPaymentId,
        status: "FAILED",
        amount: 0,
        error: "Card was declined / payment simulation failed",
      };
    }

    // Generate valid HMAC signature
    const signature =
      input.signature ||
      crypto
        .createHmac("sha256", this.secretKey)
        .update(`${input.orderId}:${providerPaymentId}`)
        .digest("hex");

    logger.info("Mock payment successfully verified", {
      orderId: input.orderId,
      providerPaymentId,
    });

    return {
      success: true,
      providerPaymentId,
      status: "SUCCESS",
      amount: input.payload?.amount ? Number(input.payload.amount) : 0,
      signature,
    };
  }

  public async processRefund(input: RefundInput): Promise<RefundResult> {
    const refundId = `mock_ref_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    if (input.providerPaymentId === "mock_refund_fail") {
      logger.warn("Mock refund failed simulation", {
        paymentId: input.paymentId,
        providerPaymentId: input.providerPaymentId,
      });
      return {
        success: false,
        refundId: "",
        amount: input.amount,
        status: "FAILED",
        error: "Refund could not be processed by provider",
      };
    }

    logger.info("Mock refund processed successfully", {
      paymentId: input.paymentId,
      providerPaymentId: input.providerPaymentId,
      refundId,
      amount: input.amount,
    });

    return {
      success: true,
      refundId,
      amount: input.amount,
      status: "REFUNDED",
    };
  }

  public verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    if (!signature) return false;

    const payload = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const expected = crypto
      .createHmac("sha256", secret || this.secretKey)
      .update(payload)
      .digest("hex");

    try {
      return (
        signature.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      );
    } catch {
      return signature === expected;
    }
  }

  public parseWebhookEvent(body: any): WebhookParseResult {
    const eventType = body.event || body.type;
    const data = body.data || body;

    let normalizedType: WebhookParseResult["eventType"] = "unknown";
    if (eventType === "payment.succeeded" || eventType === "payment_intent.succeeded") {
      normalizedType = "payment.succeeded";
    } else if (eventType === "payment.failed" || eventType === "payment_intent.payment_failed") {
      normalizedType = "payment.failed";
    } else if (eventType === "refund.processed" || eventType === "charge.refunded") {
      normalizedType = "refund.processed";
    }

    return {
      eventType: normalizedType,
      orderId: data.orderId || data.metadata?.orderId || "",
      providerPaymentId: data.providerPaymentId || data.id || "",
      amount: Number(data.amount || 0),
      signature: data.signature,
      reason: data.reason || data.failureMessage,
      metadata: data.metadata,
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
