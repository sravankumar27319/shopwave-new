import { Router } from "express";
import { listProducts, getProduct } from "../controllers/productController.js";
import { listProductReviews, createProductReview } from "../controllers/reviewController.js";
import { authenticate } from "../middleware/index.js";

const router = Router();

router.get("/", listProducts);
router.get("/:id/reviews", listProductReviews);
router.post("/:id/reviews", authenticate, createProductReview);
router.get("/:id", getProduct);

export default router;
