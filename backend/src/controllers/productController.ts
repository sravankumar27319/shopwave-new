import type { Request, Response, NextFunction } from "express";
import { getProducts, getProductById } from "../services/productService.js";
import { getProductsQuerySchema } from "../validators/productValidator.js";

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = getProductsQuerySchema.parse(req.query);
    const result = await getProducts(query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idOrSlug = (req.params["id"] as string) || "";
    const product = await getProductById(idOrSlug);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}
