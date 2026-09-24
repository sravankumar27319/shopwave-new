import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  providerPaymentId: z.string().optional(),
  signature: z.string().optional(),
  provider: z.string().optional(),
  payload: z.record(z.string(), z.any()).optional(),
});

export const failPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  reason: z.string().optional(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>;
export type FailPaymentBody = z.infer<typeof failPaymentSchema>;
export type RefundPaymentBody = z.infer<typeof refundPaymentSchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;
