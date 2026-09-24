import type { Request, Response, NextFunction } from "express";
import { getAllCategories } from "../services/categoryService.js";

export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await getAllCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}
