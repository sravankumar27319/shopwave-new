import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/index.js";
import {
  createPayment,
  getPaymentStatus,
  verifyPayment,
  failPayment,
  handleWebhook,
  processRefund,
} from "../payments/payment.service.js";
import {
  createPaymentSchema,
  verifyPaymentSchema,
  failPaymentSchema,
  refundPaymentSchema,
} from "../validators/paymentValidator.js";
import { AppError } from "../utils/AppError.js";

export async function createPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as unknown as AuthRequest).user;
    const { orderId } = createPaymentSchema.parse(req.body);
    const session = await createPayment(authUser.id, orderId);

    res.status(200).json({
      success: true,
      message: "Payment session initialized successfully",
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as unknown as AuthRequest).user;
    const orderId = (req.params["orderId"] as string) || "";
    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }

    const status = await getPaymentStatus(authUser.id, orderId, authUser.role);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as unknown as AuthRequest).user;
    const validatedData = verifyPaymentSchema.parse(req.body);
    const result = await verifyPayment(authUser.id, validatedData, authUser.role);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message || "Payment verification failed",
        data: result,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function failPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as unknown as AuthRequest).user;
    const { orderId, reason } = failPaymentSchema.parse(req.body);
    const result = await failPayment(authUser.id, orderId, reason);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function webhookHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signature =
      (req.headers["x-signature"] as string) ||
      (req.headers["stripe-signature"] as string) ||
      (req.headers["razorpay-signature"] as string) ||
      (req.headers["signature"] as string) ||
      "";

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await handleWebhook(rawBody, signature, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function refundPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as unknown as AuthRequest).user;
    const paymentId = (req.params["paymentId"] as string) || "";
    if (!paymentId) {
      throw new AppError("Payment ID is required", 400);
    }

    const { reason } = refundPaymentSchema.parse(req.body || {});
    const isAdmin = authUser.role === "ADMIN";

    const result = await processRefund(authUser.id, paymentId, reason, isAdmin);

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
