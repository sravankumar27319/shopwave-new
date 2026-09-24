import type { Request, Response, NextFunction } from "express";
import {
  addItemToCart,
  getCartDetails,
  updateCartItemQuantity,
  deleteCartItemById,
  clearUserCart,
} from "../services/cartService.js";
import { addCartItemSchema, updateCartItemSchema } from "../validators/cartValidator.js";
import { AppError } from "../utils/AppError.js";
import type { AuthRequest } from "../middleware/index.js";

export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as unknown as AuthRequest).user;
    const cart = await getCartDetails(user.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const addCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity } = addCartItemSchema.parse(req.body);
    const user = (req as unknown as AuthRequest).user;
    const cart = await addItemToCart(user.id, productId, quantity);
    res.status(201).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = updateCartItemSchema.parse(req.body);
    const user = (req as unknown as AuthRequest).user;
    const rawItemId = req.params["id"];
    const itemId = Array.isArray(rawItemId) ? rawItemId[0] : (rawItemId ?? "");
    if (!itemId) {
      throw new AppError("Item ID is required", 400);
    }
    const cart = await updateCartItemQuantity(user.id, itemId, quantity);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

export const deleteCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as unknown as AuthRequest).user;
    const rawItemId = req.params["id"];
    const itemId = Array.isArray(rawItemId) ? rawItemId[0] : (rawItemId ?? "");
    if (!itemId) {
      throw new AppError("Item ID is required", 400);
    }
    await deleteCartItemById(user.id, itemId);
    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as unknown as AuthRequest).user;
    await clearUserCart(user.id);
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};
