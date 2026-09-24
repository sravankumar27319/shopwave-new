import type { Request, Response, NextFunction } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} from "../services/orderService.js";
import { checkoutSchema } from "../validators/checkoutValidator.js";
import { updateOrderStatusSchema } from "../validators/paymentValidator.js";
import type { AuthRequest } from "../middleware/index.js";
import { AppError } from "../utils/AppError.js";

export async function checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const validatedData = checkoutSchema.parse(req.body);
    const order = await createOrder(userId, validatedData);
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const page = typeof req.query["page"] === "string" ? req.query["page"] : undefined;
    const limit = typeof req.query["limit"] === "string" ? req.query["limit"] : undefined;

    const result = await getOrders(userId, {
      ...(page !== undefined ? { page } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = (req as unknown as AuthRequest).user;
    const orderId = (req.params["id"] as string) || "";
    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }
    const order = await getOrderById(authUser.id, orderId, authUser.role);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const orderId = (req.params["id"] as string) || "";
    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }
    const order = await cancelOrder(userId, orderId);
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as unknown as AuthRequest).user;
    const orderId = (req.params["id"] as string) || "";
    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }
    const { status } = updateOrderStatusSchema.parse(req.body);
    const updated = await updateOrderStatus(orderId, status, authUser.role);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
