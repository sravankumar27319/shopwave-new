import type { Request, Response, NextFunction } from "express";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../services/reviewService.js";
import { createReviewSchema, updateReviewSchema } from "../validators/reviewValidator.js";
import type { AuthRequest } from "../middleware/index.js";
import { AppError } from "../utils/AppError.js";

export async function listProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = (req.params["productId"] as string) || (req.params["id"] as string) || "";
    if (!productId) throw new AppError("Product ID is required", 400);
    const reviews = await getProductReviews(productId);
    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
}

export async function createProductReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const productId = (req.params["productId"] as string) || (req.params["id"] as string) || "";
    if (!productId) throw new AppError("Product ID is required", 400);
    const validated = createReviewSchema.parse(req.body);
    const review = await createReview(userId, productId, validated);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function updateReviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const reviewId = (req.params["id"] as string) || "";
    if (!reviewId) throw new AppError("Review ID is required", 400);
    const validated = updateReviewSchema.parse(req.body);
    const review = await updateReview(userId, reviewId, validated);
    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function deleteReviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: userId } = (req as unknown as AuthRequest).user;
    const reviewId = (req.params["id"] as string) || "";
    if (!reviewId) throw new AppError("Review ID is required", 400);
    await deleteReview(userId, reviewId);
    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}
