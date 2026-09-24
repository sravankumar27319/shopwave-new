import { Router } from "express";
import {
  getWishlistHandler,
  addToWishlistHandler,
  removeFromWishlistHandler,
  clearWishlistHandler,
} from "../controllers/wishlistController.js";
import { authenticate } from "../middleware/index.js";

const router = Router();

router.use(authenticate);

router.get("/", getWishlistHandler);
router.post("/items", addToWishlistHandler);
router.post("/items/:productId", addToWishlistHandler);
router.delete("/items/:id", removeFromWishlistHandler);
router.delete("/", clearWishlistHandler);

export default router;
