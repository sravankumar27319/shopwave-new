import type { Request, Response, NextFunction } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../services/wishlistService.js";
import type { AuthRequest } from "../middleware/index.js";
import { AppError } from "../utils/AppError.js";

export async function getWishlistHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const wishlist = await getWishlist(userId);
    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlistHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const productId = (req.params["productId"] as string | undefined) || (req.body?.productId as string | undefined);
    if (!productId) {
      res.status(400).json({ success: false, message: "productId is required" });
      return;
    }
    const wishlist = await addToWishlist(userId, productId);
    res.status(201).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlistHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const itemId = (req.params["id"] as string) || "";
    if (!itemId) throw new AppError("Item ID is required", 400);
    await removeFromWishlist(userId, itemId);
    res.status(200).json({ success: true, message: "Item removed from wishlist" });
  } catch (err) {
    next(err);
  }
}

export async function clearWishlistHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    await clearWishlist(userId);
    res.status(200).json({ success: true, message: "Wishlist cleared" });
  } catch (err) {
    next(err);
  }
}
