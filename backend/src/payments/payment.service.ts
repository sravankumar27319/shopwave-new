import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { getPaymentProvider } from "./providers/index.js";
import emailService from "../email/email.service.js";
import type { VerifyPaymentInput } from "./payment.interface.js";

export async function createPayment(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      userId,
    },
    include: {
      user: true,
      payment: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "PENDING") {
    throw new AppError(
      `Order cannot be paid because it is already in ${order.status} status`,
      400
    );
  }

  if (order.payment?.status === "SUCCESS") {
    throw new AppError("Payment has already been completed for this order", 400);
  }

  const amount = Number(order.totalAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new AppError("Invalid order amount", 400);
  }

  const provider = getPaymentProvider();

  const session = await provider.createPaymentSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount,
    currency: "USD",
    customer: {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
    },
  });

  // Update payment record with provider and provider payment ID
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      provider: session.provider,
      providerPaymentId: session.providerPaymentId,
      amount: order.totalAmount,
      status: "PENDING",
    },
    update: {
      provider: session.provider,
      providerPaymentId: session.providerPaymentId,
      status: "PENDING",
    },
  });

  logger.info("Payment session created", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    provider: session.provider,
    amount,
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount,
    currency: "USD",
    provider: session.provider,
    providerPaymentId: session.providerPaymentId,
    clientSecret: session.clientSecret,
    checkoutUrl: session.checkoutUrl,
    expiresAt: session.expiresAt,
  };
}

export async function getPaymentStatus(
  userId: string,
  orderId: string,
  userRole = "CUSTOMER"
) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      ...(userRole === "ADMIN" ? {} : { userId }),
    },
    include: {
      payment: true,
    },
  });

  if (!order) {
    throw new AppError("Order or payment not found", 404);
  }

  if (!order.payment) {
    throw new AppError("No payment found for this order", 404);
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.payment.status,
    orderStatus: order.status,
    amount: Number(order.payment.amount),
    provider: order.payment.provider,
    providerPaymentId: order.payment.providerPaymentId,
    createdAt: order.payment.createdAt,
    updatedAt: order.payment.updatedAt,
  };
}

export async function verifyPayment(
  userId: string,
  input: VerifyPaymentInput,
  userRole = "CUSTOMER"
) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: input.orderId }, { orderNumber: input.orderId }],
      ...(userRole === "ADMIN" ? {} : { userId }),
    },
    include: {
      user: true,
      address: true,
      items: true,
      payment: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Idempotency: If payment is already SUCCESS, return success immediately
  if (order.payment?.status === "SUCCESS" && order.status === "CONFIRMED") {
    logger.info("Payment already verified (idempotent response)", {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    return {
      success: true,
      message: "Payment already verified",
      status: "SUCCESS",
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
    };
  }

  const provider = getPaymentProvider(input.provider ?? order.payment?.provider ?? undefined);

  const verification = await provider.verifyPayment({
    orderId: order.id,
    providerPaymentId: input.providerPaymentId ?? order.payment?.providerPaymentId ?? undefined,
    signature: input.signature,
    payload: input.payload,
  });

  if (!verification.success || verification.status !== "SUCCESS") {
    // Record payment failure in database
    await prisma.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: "FAILED",
        providerPaymentId: verification.providerPaymentId || order.payment?.providerPaymentId || null,
      },
    });

    logger.warn("Payment verification failed", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      error: verification.error,
    });

    // Send payment failure email (asynchronously)
    emailService
      .sendPaymentFailureEmail({
        customerName: order.user.name,
        customerEmail: order.user.email,
        orderNumber: order.orderNumber,
        paymentAmount: Number(order.totalAmount),
        reason: verification.error,
      })
      .catch((err) => {
        logger.error("Failed to dispatch payment failure email", {
          orderNumber: order.orderNumber,
          error: err.message,
        });
      });

    return {
      success: false,
      message: verification.error || "Payment verification failed",
      status: "FAILED",
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  }

  // ATOMIC DATABASE TRANSACTION
  const verifiedOrder = await prisma.$transaction(
    async (tx) => {
      // Update Payment
      await tx.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          provider: provider.name,
          providerPaymentId: verification.providerPaymentId,
          signature: verification.signature ?? null,
          amount: order.totalAmount,
          status: "SUCCESS",
        },
        update: {
          providerPaymentId: verification.providerPaymentId,
          signature: verification.signature ?? null,
          status: "SUCCESS",
        },
      });

      // Update Order to CONFIRMED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
        include: {
          user: true,
          address: true,
          items: true,
          payment: true,
        },
      });

      return updatedOrder;
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );

  logger.info("Payment verified and Order confirmed atomically", {
    orderId: verifiedOrder.id,
    orderNumber: verifiedOrder.orderNumber,
    providerPaymentId: verification.providerPaymentId,
  });

  // DISPATCH CONFIRMATION EMAIL POST-COMMIT — awaited so we can report actual delivery status
  let emailSent = false;
  try {
    const emailResult = await emailService.sendOrderConfirmationEmail({
      customerName: verifiedOrder.user.name,
      customerEmail: verifiedOrder.user.email,
      orderNumber: verifiedOrder.orderNumber,
      orderDate: verifiedOrder.createdAt,
      items: verifiedOrder.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(verifiedOrder.subtotal),
      shippingAmount: Number(verifiedOrder.shippingAmount),
      taxAmount: Number(verifiedOrder.taxAmount),
      totalAmount: Number(verifiedOrder.totalAmount),
      address: {
        fullName: verifiedOrder.address.fullName,
        addressLine1: verifiedOrder.address.addressLine1,
        addressLine2: verifiedOrder.address.addressLine2 ?? undefined,
        city: verifiedOrder.address.city,
        state: verifiedOrder.address.state,
        postalCode: verifiedOrder.address.postalCode,
        country: verifiedOrder.address.country,
      },
      paymentStatus: "SUCCESS",
      orderStatus: "CONFIRMED",
    });
    emailSent = emailResult.success === true;
    if (emailSent) {
      logger.info("Order confirmation email dispatched successfully", {
        orderNumber: verifiedOrder.orderNumber,
        to: verifiedOrder.user.email,
      });
    } else {
      logger.warn("Order confirmation email dispatch returned failure", {
        orderNumber: verifiedOrder.orderNumber,
        error: emailResult.error,
      });
    }
  } catch (err: any) {
    emailSent = false;
    logger.error("Exception while sending order confirmation email", {
      orderNumber: verifiedOrder.orderNumber,
      error: err.message,
    });
  }

  return {
    success: true,
    message: "Payment verified successfully",
    status: "SUCCESS",
    orderId: verifiedOrder.id,
    orderNumber: verifiedOrder.orderNumber,
    amount: Number(verifiedOrder.totalAmount),
    providerPaymentId: verification.providerPaymentId,
    emailSent,
    customerEmail: verifiedOrder.user.email,
  };
}

export async function failPayment(
  userId: string,
  orderId: string,
  reason?: string
) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      userId,
    },
    include: {
      user: true,
      payment: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.payment?.status === "SUCCESS") {
    throw new AppError("Cannot fail an already successful payment", 400);
  }

  await prisma.payment.updateMany({
    where: { orderId: order.id },
    data: { status: "FAILED" },
  });

  logger.warn("Payment marked as failed", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    reason,
  });

  emailService
    .sendPaymentFailureEmail({
      customerName: order.user.name,
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      paymentAmount: Number(order.totalAmount),
      reason: reason || "Payment was cancelled or unsuccessful",
    })
    .catch((err) => {
      logger.error("Failed to send payment failure email", {
        orderNumber: order.orderNumber,
        error: err.message,
      });
    });

  return {
    success: true,
    message: "Payment marked as failed",
    status: "FAILED",
    orderId: order.id,
  };
}

export async function handleWebhook(
  rawBody: string | Buffer,
  signature: string,
  parsedBody: any
) {
  const webhookSecret =
    process.env["PAYMENT_WEBHOOK_SECRET"] ||
    process.env["PAYMENT_MOCK_SECRET"] ||
    "shopwave-mock-secret-key";

  const provider = getPaymentProvider();

  const isSignatureValid = provider.verifyWebhookSignature(
    rawBody,
    signature,
    webhookSecret
  );

  if (!isSignatureValid) {
    logger.warn("Webhook rejected due to invalid signature", {
      signatureProvided: !!signature,
    });
    throw new AppError("Invalid webhook signature", 400);
  }

  const event = provider.parseWebhookEvent(parsedBody);

  logger.info("Webhook event received and verified", {
    eventType: event.eventType,
    orderId: event.orderId,
    providerPaymentId: event.providerPaymentId,
  });

  if (event.eventType === "payment.succeeded") {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: event.orderId },
          { orderNumber: event.orderId },
          { payment: { providerPaymentId: event.providerPaymentId } },
        ],
      },
      include: {
        user: true,
        address: true,
        items: true,
        payment: true,
      },
    });

    if (!order) {
      logger.error("Webhook order not found for payment success event", {
        orderId: event.orderId,
        providerPaymentId: event.providerPaymentId,
      });
      return { received: true, error: "Order not found" };
    }

    // IDEMPOTENCY CHECK
    if (order.payment?.status === "SUCCESS" && order.status === "CONFIRMED") {
      logger.info("Webhook duplicate event for confirmed order (idempotent)", {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
      return { received: true, status: "IDEMPOTENT_SUCCESS" };
    }

    // Atomic confirmation transaction
    const confirmedOrder = await prisma.$transaction(
      async (tx) => {
        await tx.payment.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            provider: provider.name,
            providerPaymentId: event.providerPaymentId,
            signature: event.signature ?? null,
            amount: order.totalAmount,
            status: "SUCCESS",
          },
          update: {
            providerPaymentId: event.providerPaymentId,
            signature: event.signature ?? null,
            status: "SUCCESS",
          },
        });

        return tx.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED" },
          include: {
            user: true,
            address: true,
            items: true,
            payment: true,
          },
        });
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    // Post-commit email dispatch
    emailService
      .sendOrderConfirmationEmail({
        customerName: confirmedOrder.user.name,
        customerEmail: confirmedOrder.user.email,
        orderNumber: confirmedOrder.orderNumber,
        orderDate: confirmedOrder.createdAt,
        items: confirmedOrder.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
        subtotal: Number(confirmedOrder.subtotal),
        shippingAmount: Number(confirmedOrder.shippingAmount),
        taxAmount: Number(confirmedOrder.taxAmount),
        totalAmount: Number(confirmedOrder.totalAmount),
        address: {
          fullName: confirmedOrder.address.fullName,
          addressLine1: confirmedOrder.address.addressLine1,
          addressLine2: confirmedOrder.address.addressLine2,
          city: confirmedOrder.address.city,
          state: confirmedOrder.address.state,
          postalCode: confirmedOrder.address.postalCode,
          country: confirmedOrder.address.country,
        },
        paymentStatus: "SUCCESS",
        orderStatus: "CONFIRMED",
      })
      .catch((err) => {
        logger.error("Non-blocking error sending confirmation email from webhook", {
          orderNumber: confirmedOrder.orderNumber,
          error: err.message,
        });
      });

    return { received: true, status: "SUCCESS" };
  }

  if (event.eventType === "payment.failed") {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: event.orderId },
          { orderNumber: event.orderId },
          { payment: { providerPaymentId: event.providerPaymentId } },
        ],
      },
      include: {
        user: true,
        payment: true,
      },
    });

    if (order && order.payment?.status !== "SUCCESS") {
      await prisma.payment.updateMany({
        where: { orderId: order.id },
        data: { status: "FAILED" },
      });

      emailService
        .sendPaymentFailureEmail({
          customerName: order.user.name,
          customerEmail: order.user.email,
          orderNumber: order.orderNumber,
          paymentAmount: Number(order.totalAmount),
          reason: event.reason,
        })
        .catch((err) => {
          logger.error("Error sending payment failure email from webhook", {
            orderNumber: order.orderNumber,
            error: err.message,
          });
        });
    }

    return { received: true, status: "FAILED" };
  }

  if (event.eventType === "refund.processed") {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { orderId: event.orderId },
          { providerPaymentId: event.providerPaymentId },
        ],
      },
      include: {
        order: {
          include: {
            user: true,
            items: true,
          },
        },
      },
    });

    if (payment && payment.status !== "REFUNDED") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELLED" },
        });

        for (const item of payment.order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      });

      emailService
        .sendRefundEmail({
          customerName: payment.order.user.name,
          customerEmail: payment.order.user.email,
          orderNumber: payment.order.orderNumber,
          refundAmount: Number(payment.amount),
          refundDate: new Date(),
          reason: event.reason,
        })
        .catch((err) => {
          logger.error("Error sending refund email from webhook", {
            orderNumber: payment.order.orderNumber,
            error: err.message,
          });
        });
    }

    return { received: true, status: "REFUNDED" };
  }

  return { received: true, status: "IGNORED" };
}

export async function processRefund(
  userId: string,
  paymentIdOrOrderId: string,
  reason?: string,
  isAdmin = false
) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: paymentIdOrOrderId },
        { orderId: paymentIdOrOrderId },
        { order: { orderNumber: paymentIdOrOrderId } },
      ],
      ...(isAdmin ? {} : { order: { userId } }),
    },
    include: {
      order: {
        include: {
          user: true,
          items: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found or not accessible", 404);
  }

  if (payment.status !== "SUCCESS") {
    throw new AppError(
      `Only successful payments can be refunded (current status: ${payment.status})`,
      400
    );
  }

  const provider = getPaymentProvider(payment.provider);

  const refundResult = await provider.processRefund({
    paymentId: payment.id,
    providerPaymentId: payment.providerPaymentId || `pay_${payment.id}`,
    amount: Number(payment.amount),
    reason,
  });

  if (!refundResult.success || refundResult.status !== "REFUNDED") {
    logger.error("Provider refund failed", {
      paymentId: payment.id,
      error: refundResult.error,
    });
    throw new AppError(refundResult.error || "Payment provider declined the refund", 400);
  }

  // Atomic database update for refund
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CANCELLED" },
    });

    // Restore stock if order is cancelled upon refund
    for (const item of payment.order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  logger.info("Refund processed successfully and committed", {
    paymentId: payment.id,
    orderNumber: payment.order.orderNumber,
    refundId: refundResult.refundId,
    amount: refundResult.amount,
  });

  // Send refund notification email post-commit
  emailService
    .sendRefundEmail({
      customerName: payment.order.user.name,
      customerEmail: payment.order.user.email,
      orderNumber: payment.order.orderNumber,
      refundAmount: Number(payment.amount),
      refundDate: new Date(),
      reason,
    })
    .catch((err) => {
      logger.error("Error sending refund email", {
        orderNumber: payment.order.orderNumber,
        error: err.message,
      });
    });

  return {
    success: true,
    message: "Refund processed successfully",
    status: "REFUNDED",
    refundId: refundResult.refundId,
    amount: refundResult.amount,
    orderNumber: payment.order.orderNumber,
  };
}
